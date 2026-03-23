#!/usr/bin/env python3
"""
fetch_activities.py — fetch current-year Strava activities + GPS streams.

Saves/updates activities_cache.json at the repo root. Runs incrementally:
only new activities (not already in the cache) get a GPS stream fetch.

Usage:
    python scripts/fetch_activities.py              # current year, incremental
    python scripts/fetch_activities.py --year 2026  # explicit year
    python scripts/fetch_activities.py --refresh    # re-fetch all GPS streams
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone

import requests

# ── Paths ─────────────────────────────────────────────────────
REPO_ROOT  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_PATH = os.path.join(REPO_ROOT, 'activities_cache.json')
sys.path.insert(0, REPO_ROOT)

# ── Strava API ────────────────────────────────────────────────
API_BASE  = 'https://www.strava.com/api/v3'
TOKEN_URL = 'https://www.strava.com/oauth/token'

# Activity types that never have meaningful outdoor GPS — skip stream fetch
SKIP_TYPES = {
    'VirtualRide', 'VirtualRun', 'EllipticalTrainer', 'StairStepper',
    'WeightTraining', 'Yoga', 'Crossfit', 'Pilates', 'Stretching',
    'Meditation', 'RockClimbing',
}


# ── Auth ──────────────────────────────────────────────────────
def _get_token():
    """
    Returns a valid Strava access token.
    CI: refreshes inline from env vars (same pattern as fetch_strava.py).
    Local: delegates to strava_auth.get_access_token().
    """
    client_id     = os.environ.get('STRAVA_CLIENT_ID')
    client_secret = os.environ.get('STRAVA_CLIENT_SECRET')
    refresh_token = os.environ.get('STRAVA_REFRESH_TOKEN')

    if client_id and client_secret and refresh_token:
        resp = requests.post(TOKEN_URL, data={
            'client_id':     client_id,
            'client_secret': client_secret,
            'refresh_token': refresh_token,
            'grant_type':    'refresh_token',
        }, timeout=30)
        resp.raise_for_status()
        return resp.json()['access_token']

    try:
        from strava_auth import get_access_token
        return get_access_token()
    except ImportError:
        sys.exit(
            '\nCould not authenticate. Either:\n'
            '  • Set STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN\n'
            '  • Or ensure strava_auth.py is accessible from the repo root\n'
        )


# ── Cache helpers ─────────────────────────────────────────────
def _load_cache():
    if not os.path.exists(CACHE_PATH):
        return {'year': None, 'activities': []}
    with open(CACHE_PATH) as f:
        return json.load(f)


def _save_cache(cache):
    with open(CACHE_PATH, 'w') as f:
        json.dump(cache, f, indent=2)
    n = len(cache['activities'])
    print(f'  Cache saved → {CACHE_PATH}  ({n} activities)')


# ── Strava API helpers ────────────────────────────────────────
def _fetch_summaries(headers, after_ts, before_ts):
    """Fetch all activity summaries within a unix timestamp window (paginated)."""
    summaries = []
    page = 1
    while True:
        r = requests.get(
            f'{API_BASE}/athlete/activities',
            headers=headers,
            params={
                'per_page': 100,
                'page':     page,
                'after':    int(after_ts),
                'before':   int(before_ts),
            },
            timeout=30,
        )
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        summaries.extend(batch)
        print(f'  Page {page}: {len(batch)} activities')
        if len(batch) < 100:
            break
        page += 1
    return summaries


def _fetch_stream(headers, activity_id):
    """
    Fetch GPS + sensor streams for one activity.
    Returns a dict of available stream arrays, or None if no GPS data.
    """
    r = requests.get(
        f'{API_BASE}/activities/{activity_id}/streams',
        headers=headers,
        params={'keys': 'latlng,time,heartrate,altitude,cadence,watts', 'key_by_type': 'true'},
        timeout=30,
    )
    if r.status_code == 404:
        return None
    r.raise_for_status()
    data       = r.json()
    latlng     = data.get('latlng', {}).get('data')
    timestamps = data.get('time',   {}).get('data')
    if not latlng or not timestamps or len(latlng) < 2:
        return None
    return {
        'latlng':     latlng,
        'timestamps': timestamps,
        'heartrate':  data.get('heartrate', {}).get('data'),
        'altitude':   data.get('altitude',  {}).get('data'),
        'cadence':    data.get('cadence',   {}).get('data'),
        'watts':      data.get('watts',     {}).get('data'),
    }


def _fetch_laps(headers, activity_id):
    """
    Fetch lap splits for one activity.
    Returns a list of lap dicts (empty list if none), or None on a hard error.
    """
    r = requests.get(
        f'{API_BASE}/activities/{activity_id}/laps',
        headers=headers,
        timeout=30,
    )
    if r.status_code == 404:
        return []
    r.raise_for_status()
    laps = r.json()
    return [
        {
            'lap_index':            lap.get('lap_index', i + 1),
            'distance':             lap.get('distance', 0),
            'moving_time':          lap.get('moving_time', 0),
            'average_speed':        lap.get('average_speed'),
            'average_heartrate':    lap.get('average_heartrate'),
            'max_heartrate':        lap.get('max_heartrate'),
            'average_cadence':      lap.get('average_cadence'),
            'average_watts':        lap.get('average_watts'),
            'total_elevation_gain': lap.get('total_elevation_gain'),
        }
        for i, lap in enumerate(laps)
    ]


def _has_gps(summary):
    """Quick check via summary_polyline before spending an API call on the stream."""
    sport = summary.get('sport_type') or summary.get('type', '')
    if sport in SKIP_TYPES:
        return False
    return bool(summary.get('map', {}).get('summary_polyline'))


# ── Main ──────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(description='Fetch Strava activities + GPS streams.')
    ap.add_argument('--year',    type=int, default=datetime.now(timezone.utc).year,
                    help='Calendar year to fetch (default: current year)')
    ap.add_argument('--refresh', action='store_true',
                    help='Re-fetch GPS streams for all cached activities')
    args = ap.parse_args()

    target_year = args.year

    # ── Load cache ───────────────────────────────────────────────
    cache = _load_cache()

    if cache['year'] is not None and cache['year'] != target_year:
        print(f'\nYear rollover detected: {cache["year"]} → {target_year}. Clearing cache.')
        cache = {'year': target_year, 'activities': []}
    else:
        cache['year'] = target_year

    # Keyed by activity ID for fast lookup and update
    cache_by_id = {a['id']: a for a in cache['activities']}

    print(f'\nTarget year  : {target_year}')
    print(f'Cached so far: {len(cache_by_id)} activities')

    # ── Auth ─────────────────────────────────────────────────────
    print('\nRefreshing Strava access token…')
    headers = {'Authorization': f'Bearer {_get_token()}'}
    print('  ✓  Token ready.')

    # ── Fetch activity summaries for the year ────────────────────
    year_start = datetime(target_year,     1, 1, tzinfo=timezone.utc).timestamp()
    year_end   = datetime(target_year + 1, 1, 1, tzinfo=timezone.utc).timestamp()

    print(f'\nFetching {target_year} activity summaries from Strava…')
    all_summaries = _fetch_summaries(headers, year_start, year_end)
    print(f'  Total: {len(all_summaries)}')

    # Filter to activities that have outdoor GPS
    gps_summaries = [s for s in all_summaries if _has_gps(s)]
    n_skipped = len(all_summaries) - len(gps_summaries)
    print(f'  With GPS: {len(gps_summaries)}  |  Skipped (indoor / no GPS): {n_skipped}')

    # Update summary metadata for all GPS activities (names, distances, etc. can change)
    for s in gps_summaries:
        aid = s['id']
        existing = cache_by_id.get(aid, {})
        cache_by_id[aid] = {
            # Preserve GPS + sensor data if already cached
            'latlng':               existing.get('latlng'),
            'timestamps':           existing.get('timestamps'),
            'heartrate':            existing.get('heartrate'),
            'altitude':             existing.get('altitude'),
            'cadence':              existing.get('cadence'),
            'watts':                existing.get('watts'),
            'laps':                 existing.get('laps'),
            # Fresh metadata from Strava
            'id':                   aid,
            'name':                 s.get('name', f'Activity {aid}'),
            'type':                 s.get('sport_type') or s.get('type', 'Unknown'),
            'start_date':           s['start_date'],
            'distance':             s.get('distance', 0),
            'moving_time':          s.get('moving_time', 0),
            'total_elevation_gain': s.get('total_elevation_gain', 0),
            'average_heartrate':    s.get('average_heartrate'),
            'max_heartrate':        s.get('max_heartrate'),
        }

    # ── Fetch GPS streams ────────────────────────────────────────
    if args.refresh:
        # Clear cached GPS + sensor streams and laps so everything gets re-fetched
        for entry in cache_by_id.values():
            entry['latlng']     = None
            entry['timestamps'] = None
            entry['heartrate']  = None
            entry['altitude']   = None
            entry['cadence']    = None
            entry['watts']      = None
            entry['laps']       = None
        print('\n--refresh: clearing cached GPS/sensor streams and laps — re-fetching all.')

    needs_stream = [
        s for s in gps_summaries
        if cache_by_id[s['id']].get('latlng') is None
    ]
    # Activities that have GPS but were cached before laps were added
    needs_laps_only = [
        s for s in gps_summaries
        if cache_by_id[s['id']].get('latlng') is not None
        and cache_by_id[s['id']].get('laps') is None
    ]
    print(f'\nGPS streams to fetch: {len(needs_stream)}')
    print(f'Laps to backfill    : {len(needs_laps_only)}')

    fetched           = 0
    skipped_no_stream = 0

    for i, summary in enumerate(needs_stream, 1):
        aid  = summary['id']
        name = cache_by_id[aid]['name']
        print(f'  [{i}/{len(needs_stream)}] {name} … ', end='', flush=True)

        streams = _fetch_stream(headers, aid)

        if streams is None:
            print('no GPS stream — skipped')
            skipped_no_stream += 1
            # Remove from cache_by_id so it doesn't appear in the output
            del cache_by_id[aid]
            continue

        cache_by_id[aid].update(streams)

        # Fetch laps in the same pass (one extra call per activity)
        laps = _fetch_laps(headers, aid)
        cache_by_id[aid]['laps'] = laps if laps is not None else []

        n_pts  = len(streams['latlng'])
        n_laps = len(cache_by_id[aid]['laps'])
        fetched += 1
        print(f'{n_pts} pts | {n_laps} laps')

        # Stay within Strava rate limits (100 req / 15 min)
        time.sleep(0.4)

    if needs_stream:
        print(f'\n  Fetched: {fetched}  |  No stream: {skipped_no_stream}')

    # ── Backfill laps for already-cached activities ───────────────
    if needs_laps_only:
        print(f'\nBackfilling laps for {len(needs_laps_only)} activities…')
        for i, summary in enumerate(needs_laps_only, 1):
            aid  = summary['id']
            name = cache_by_id[aid]['name']
            print(f'  [{i}/{len(needs_laps_only)}] {name} … ', end='', flush=True)
            laps = _fetch_laps(headers, aid)
            cache_by_id[aid]['laps'] = laps if laps is not None else []
            print(f'{len(cache_by_id[aid]["laps"])} laps')
            time.sleep(0.4)

    # ── Rebuild and save cache ───────────────────────────────────
    # Keep only activities that (a) appeared in today's Strava fetch and (b) have GPS data
    gps_ids = {s['id'] for s in gps_summaries}
    cache['activities'] = [
        entry for aid, entry in cache_by_id.items()
        if aid in gps_ids and entry.get('latlng') is not None
    ]
    # Newest first
    cache['activities'].sort(key=lambda a: a['start_date'], reverse=True)

    print()
    _save_cache(cache)
    print('\n✓  Done.')


if __name__ == '__main__':
    main()
