#!/usr/bin/env python3
"""
render_cards.py — render an animated GIF card for each cached Strava activity.

Reads  : activities_cache.json  (written by fetch_activities.py)
Writes : assets/activity-cards/{id}.gif  (one per activity)
         assets/data/activity-cards.json  (feed metadata for the website)

Usage:
    python scripts/render_cards.py                      # incremental (skip existing GIFs)
    python scripts/render_cards.py --rerender 12345678  # force re-render one activity
    python scripts/render_cards.py --all                # re-render everything
"""

import argparse
import json
import os
import sys
import traceback
from datetime import datetime, timezone

import numpy as np

# ── Paths ─────────────────────────────────────────────────────
REPO_ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_PATH  = os.path.join(REPO_ROOT, 'activities_cache.json')
CARDS_DIR   = os.path.join(REPO_ROOT, 'assets', 'activity-cards')
META_PATH   = os.path.join(REPO_ROOT, 'assets', 'data', 'activity-cards.json')
sys.path.insert(0, REPO_ROOT)

from gpx_core import to_xy, render_animation


def _downsample(arr, n=200):
    """Return arr downsampled to at most n evenly-spaced elements."""
    if arr is None or len(arr) <= n:
        return arr
    idx = np.round(np.linspace(0, len(arr) - 1, n)).astype(int)
    return [arr[int(i)] for i in idx]

# ── Card render settings ──────────────────────────────────────
CARD_SETTINGS = dict(
    duration = 6,
    fps      = 30,
    dpi      = 100,
    figsize  = (4, 4),
    show_hud = False,
    loop     = True,
    basemap  = False,
)

THEMES = {
    'dark': {
        'bg_color': '#0d0d0d',
        'colors':   ['#3B9EE8', '#00CFFF', '#FFD200', '#00FF88', '#FF4DFF', '#FF6B35'],
    },
    'light': {
        'bg_color': '#f5f5f5',
        'colors':   ['#003262', '#1a6bc4', '#b08800', '#007a44', '#9900cc', '#c44a00'],
    },
}


# ── Helpers ───────────────────────────────────────────────────
def card_path(activity_id, theme):
    return os.path.join(CARDS_DIR, f'{activity_id}_{theme}.gif')


def card_url(activity_id, theme):
    return f'/assets/activity-cards/{activity_id}_{theme}.gif'


def load_cache():
    if not os.path.exists(CACHE_PATH):
        sys.exit(f'\nNo cache found at {CACHE_PATH}.\nRun scripts/fetch_activities.py first.')
    with open(CACHE_PATH) as f:
        return json.load(f)


def activity_to_track(activity):
    """
    Convert a cache entry to the track dict expected by render_animation.
    Strava stream timestamps are relative (seconds since start) — convert to
    absolute unix timestamps using start_date.
    """
    start_ts = datetime.fromisoformat(
        activity['start_date'].replace('Z', '+00:00')
    ).timestamp()

    ts = np.array([start_ts + t for t in activity['timestamps']])
    xy = np.array([to_xy(lat, lon) for lat, lon in activity['latlng']])

    return {'name': activity['name'], 'ts': ts, 'xy': xy}


def render_one(activity):
    """Render dark and light GIF cards for a single activity. Returns True if both succeed."""
    os.makedirs(CARDS_DIR, exist_ok=True)

    try:
        track = activity_to_track(activity)
    except Exception as e:
        print(f'    Error building track: {e}')
        return False

    success = True
    for theme, theme_opts in THEMES.items():
        out = card_path(activity['id'], theme)
        try:
            render_animation(tracks=[track], output_path=out, **CARD_SETTINGS, **theme_opts)
        except Exception:
            traceback.print_exc()
            if os.path.exists(out):
                os.remove(out)
            success = False

    return success


def write_metadata(cache):
    """
    Write activity-cards.json from the cache, including only activities
    whose GIFs exist on disk. Sorted newest-first.
    """
    os.makedirs(os.path.dirname(META_PATH), exist_ok=True)

    activities_out = []
    for a in cache['activities']:
        if not os.path.exists(card_path(a['id'], 'dark')):
            continue
        activities_out.append({
            'id':         a['id'],
            'name':       a['name'],
            'type':       a['type'],
            'start_date': a['start_date'],
            'distance':   a.get('distance', 0),
            'moving_time': a.get('moving_time', 0),
            'elevation':  a.get('total_elevation_gain', 0),
            'avg_hr':     a.get('average_heartrate'),
            'max_hr':     a.get('max_heartrate'),
            'altitude':   _downsample(a.get('altitude'), 200),
            'hr_stream':  _downsample(a.get('heartrate'), 200),
            'laps':       a.get('laps'),
            'card_dark':  card_url(a['id'], 'dark'),
            'card_light': card_url(a['id'], 'light'),
        })

    # Already sorted newest-first in the cache, but enforce it here too
    activities_out.sort(key=lambda x: x['start_date'], reverse=True)

    meta = {
        'year':       cache.get('year'),
        'generated':  datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'activities': activities_out,
    }

    with open(META_PATH, 'w') as f:
        json.dump(meta, f, indent=2)

    print(f'  Metadata → {META_PATH}  ({len(activities_out)} activities)')


# ── Main ──────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(description='Render animated GIF cards for Strava activities.')
    group = ap.add_mutually_exclusive_group()
    group.add_argument('--rerender', type=int, metavar='ID',
                       help='Force re-render one specific activity by Strava ID')
    group.add_argument('--all', action='store_true',
                       help='Re-render all activities (ignore existing GIFs)')
    args = ap.parse_args()

    cache      = load_cache()
    activities = cache.get('activities', [])

    if not activities:
        print('No activities in cache. Run scripts/fetch_activities.py first.')
        return

    print(f'\nCache: {len(activities)} activities  (year {cache.get("year")})')

    # ── Determine what to render ─────────────────────────────────
    if args.rerender:
        targets = [a for a in activities if a['id'] == args.rerender]
        if not targets:
            sys.exit(f'\nActivity {args.rerender} not found in cache.')
        print(f'Re-rendering activity {args.rerender}.')
    elif args.all:
        targets = activities
        print(f'--all: re-rendering all {len(targets)} activities.')
    else:
        targets = [a for a in activities if not os.path.exists(card_path(a['id'], 'dark'))]
        already = len(activities) - len(targets)
        print(f'Already rendered: {already}  |  To render: {len(targets)}')

    if not targets:
        print('\nNothing to render.')
        write_metadata(cache)
        return

    # ── Render ───────────────────────────────────────────────────
    succeeded = 0
    failed    = 0

    for i, activity in enumerate(targets, 1):
        name = activity['name']
        aid  = activity['id']
        date = activity['start_date'][:10]
        print(f'\n[{i}/{len(targets)}] {name}  ({date})  id={aid}')

        if render_one(activity):
            succeeded += 1
        else:
            failed += 1

    # ── Summary + metadata ───────────────────────────────────────
    print(f'\n{"─" * 40}')
    print(f'Rendered: {succeeded}  |  Failed: {failed}')
    print()
    write_metadata(cache)
    print('\n✓  Done.')


if __name__ == '__main__':
    main()
