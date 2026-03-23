#!/usr/bin/env python3
"""
strava_auth.py — Strava OAuth helper for the local pipeline.

Manages access/refresh tokens in .strava_token.json.

Setup (one-time):
  1. Create a Strava API app at https://www.strava.com/settings/api
     Set "Authorization Callback Domain" to: localhost
  2. Create a .env file:
         STRAVA_CLIENT_ID=your_client_id
         STRAVA_CLIENT_SECRET=your_client_secret
  3. If you already have a refresh token (e.g. from GitHub Secrets):
         STRAVA_REFRESH_TOKEN=your_refresh_token
     This skips the browser flow entirely.

Usage (from other scripts):
    from strava_auth import get_access_token
    token = get_access_token()   # refreshes silently if needed

CLI usage:
    python strava_auth.py        # first time: opens browser; subsequent: silent refresh
"""

import json
import os
import sys
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

import requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass   # python-dotenv optional if env vars are already set

TOKEN_PATH    = os.path.join(os.path.dirname(__file__), '.strava_token.json')
AUTH_URL      = 'https://www.strava.com/oauth/authorize'
TOKEN_URL     = 'https://www.strava.com/oauth/token'
REDIRECT_PORT = 8080
REDIRECT_URI  = f'http://localhost:{REDIRECT_PORT}/callback'
# activity:read_all needed for GPS streams on private activities
SCOPE         = 'activity:read_all'
# Refresh proactively if token expires within this many seconds
EXPIRY_BUFFER = 60


# ── Token file helpers ────────────────────────────────────────
def _load_token():
    if not os.path.exists(TOKEN_PATH):
        return None
    with open(TOKEN_PATH) as f:
        return json.load(f)


def _save_token(data):
    with open(TOKEN_PATH, 'w') as f:
        json.dump(data, f, indent=2)
    print(f'  Token saved → {TOKEN_PATH}')


# ── Credential loader ─────────────────────────────────────────
def _credentials():
    client_id     = os.environ.get('STRAVA_CLIENT_ID')
    client_secret = os.environ.get('STRAVA_CLIENT_SECRET')
    if not client_id or not client_secret:
        sys.exit(
            '\nMissing Strava credentials.\n'
            'Create a .env file with:\n'
            '  STRAVA_CLIENT_ID=your_client_id\n'
            '  STRAVA_CLIENT_SECRET=your_client_secret\n'
        )
    return client_id, client_secret


# ── Token refresh ─────────────────────────────────────────────
def _refresh(client_id, client_secret, refresh_token):
    resp = requests.post(TOKEN_URL, data={
        'client_id':     client_id,
        'client_secret': client_secret,
        'refresh_token': refresh_token,
        'grant_type':    'refresh_token',
    }, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    token = {
        'access_token':  data['access_token'],
        'refresh_token': data['refresh_token'],
        'expires_at':    data['expires_at'],
    }
    _save_token(token)
    return token


# ── Browser OAuth flow ────────────────────────────────────────
def _browser_auth(client_id, client_secret):
    """
    Opens the Strava authorization page, spins up a local HTTP server
    to catch the redirect, and exchanges the code for tokens.
    """
    auth_url = (
        f'{AUTH_URL}'
        f'?client_id={client_id}'
        f'&redirect_uri={REDIRECT_URI}'
        f'&response_type=code'
        f'&approval_prompt=auto'
        f'&scope={SCOPE}'
    )

    auth_code = [None]  # mutable container for the handler to write into

    class _Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            qs = parse_qs(urlparse(self.path).query)
            if 'code' in qs:
                auth_code[0] = qs['code'][0]
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write(
                    b'<html><body style="font-family:sans-serif;padding:2rem">'
                    b'<h2>Authorization successful!</h2>'
                    b'<p>You can close this tab and return to the terminal.</p>'
                    b'</body></html>'
                )
            else:
                error = qs.get('error', ['unknown'])[0]
                self.send_response(400)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write(
                    f'<html><body><h2>Authorization failed: {error}</h2>'
                    f'</body></html>'.encode()
                )

        def log_message(self, *args):
            pass  # suppress server access log

    print(f'\nOpening Strava authorization page…')
    print(f'  If the browser does not open, visit:\n  {auth_url}\n')
    webbrowser.open(auth_url)

    server = HTTPServer(('localhost', REDIRECT_PORT), _Handler)
    print(f'Waiting for Strava redirect on port {REDIRECT_PORT}…')
    while auth_code[0] is None:
        server.handle_request()
    server.server_close()

    print('  Authorization code received. Exchanging for tokens…')
    resp = requests.post(TOKEN_URL, data={
        'client_id':     client_id,
        'client_secret': client_secret,
        'code':          auth_code[0],
        'grant_type':    'authorization_code',
    }, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    token = {
        'access_token':  data['access_token'],
        'refresh_token': data['refresh_token'],
        'expires_at':    data['expires_at'],
    }
    _save_token(token)
    print('  ✓  Authorized.')
    return token


# ── Public API ────────────────────────────────────────────────
def get_access_token():
    """
    Returns a valid Strava access token, refreshing silently if needed.
    On first run, initiates the browser OAuth flow (or bootstraps from
    STRAVA_REFRESH_TOKEN env var if present).
    """
    client_id, client_secret = _credentials()

    token = _load_token()

    # Bootstrap: no token file but refresh token already known (e.g. from GitHub Secrets)
    if token is None:
        env_refresh = os.environ.get('STRAVA_REFRESH_TOKEN')
        if env_refresh:
            print('No token file found — bootstrapping from STRAVA_REFRESH_TOKEN env var…')
            token = _refresh(client_id, client_secret, env_refresh)
        else:
            print('No token file found — starting OAuth authorization flow…')
            token = _browser_auth(client_id, client_secret)

    # Refresh if expired (or about to expire)
    if time.time() >= token['expires_at'] - EXPIRY_BUFFER:
        print('Access token expired — refreshing…')
        token = _refresh(client_id, client_secret, token['refresh_token'])

    return token['access_token']


# ── CLI entry point ───────────────────────────────────────────
if __name__ == '__main__':
    token = get_access_token()
    print(f'\n✓  Access token ready (expires at {time.ctime(json.load(open(TOKEN_PATH))["expires_at"])})')
