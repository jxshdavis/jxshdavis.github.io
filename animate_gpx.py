#!/usr/bin/env python3
"""
GPX Activity Animator
Animate multiple GPX tracks simultaneously on a real map, export as MP4.

Usage:
    python animate_gpx.py
    python animate_gpx.py --folder ./gpx --output run.mp4 --duration 45 --fps 30
    python animate_gpx.py --fallback-start "2026-03-22 13:48:00" --fallback-duration "2:32:13"
    python animate_gpx.py --align-starts

Notes:
    --fallback-start / --fallback-duration apply to any GPX file missing timestamps.
    Strava strips timestamps from other people's activities for privacy — this is
    the workaround. Times are interpreted in --timezone (default: America/New_York).
"""

import argparse
import os
import sys
import glob
import json
import numpy as np
from datetime import datetime, timezone

from gpx_core import parse_gpx, assign_timestamps, to_xy, render_animation


# ── CLI-only helpers ──────────────────────────────────────────
def fmt_ts(ts):
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')


def parse_duration(s):
    """Parse 'H:MM:SS', 'M:SS', or plain seconds → float seconds."""
    parts = s.strip().split(':')
    try:
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
        elif len(parts) == 2:
            return int(parts[0]) * 60 + float(parts[1])
        else:
            return float(parts[0])
    except ValueError:
        sys.exit(f'\nCould not parse --fallback-duration "{s}".\n'
                 f'Use format: "H:MM:SS"  e.g.  "2:32:13"')


def parse_local_time(s, tz_name):
    """
    Parse 'YYYY-MM-DD HH:MM:SS' (or 'YYYY-MM-DD HH:MM') in the given
    IANA timezone and return a UTC unix timestamp.
    """
    try:
        import zoneinfo
        ZoneInfo = zoneinfo.ZoneInfo
    except ImportError:
        try:
            from backports.zoneinfo import ZoneInfo
        except ImportError:
            sys.exit('\nThe "zoneinfo" module is needed. Run: pip install backports.zoneinfo')

    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        sys.exit(f'\nUnknown timezone "{tz_name}".\n'
                 f'Use an IANA name like: America/New_York, US/Pacific, Europe/London')

    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
        try:
            dt = datetime.strptime(s, fmt).replace(tzinfo=tz)
            return dt.timestamp()
        except ValueError:
            continue

    sys.exit(f'\nCould not parse --fallback-start "{s}".\n'
             f'Use format: "YYYY-MM-DD HH:MM:SS"  e.g.  "2026-03-22 13:48:00"')


def load_config(config_path):
    """Load optional JSON config file. Returns {} if not found."""
    if not os.path.exists(config_path):
        return {}
    with open(config_path, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError as e:
            sys.exit(f'\nCould not parse config file {config_path}:\n  {e}\n'
                     f'Check your JSON syntax.')


# ── Main ──────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(description='Animate GPX tracks to MP4.')
    ap.add_argument('--folder',            default='./gpx',
                    help='Folder with .gpx files (default: ./gpx)')
    ap.add_argument('--config',            default='./config.json',
                    help='JSON config file for per-file timing (default: ./config.json)')
    ap.add_argument('--output',            default='animation.mp4',
                    help='Output MP4 path (default: animation.mp4)')
    ap.add_argument('--duration',          type=float, default=30,
                    help='Animation length in seconds (default: 30)')
    ap.add_argument('--fps',               type=int,   default=30,
                    help='Frames per second (default: 30)')
    ap.add_argument('--dpi',               type=int,   default=150,
                    help='Output resolution DPI (default: 150)')
    ap.add_argument('--align-starts',      action='store_true',
                    help='Shift all tracks to start together (ignores real timestamps).')
    ap.add_argument('--fallback-start',    default=None,
                    help='Start time for ALL GPX files missing timestamps (if no config entry). '
                         'Format: "YYYY-MM-DD HH:MM:SS"  e.g. "2026-03-22 13:48:00"')
    ap.add_argument('--fallback-duration', default=None,
                    help='Duration for ALL GPX files missing timestamps (if no config entry). '
                         'Format: "H:MM:SS"  e.g. "2:32:13"')
    ap.add_argument('--timezone',          default='America/New_York',
                    help='Timezone for all time inputs (default: America/New_York). '
                         'Other examples: US/Pacific, US/Central, Europe/London')
    args = ap.parse_args()

    # ── Load config ──────────────────────────────────────────────
    config = load_config(args.config)
    if config:
        print(f'\nLoaded config: {args.config}')

    tz_name = config.get('timezone', args.timezone)

    # ── CLI fallback timestamps ──────────────────────────────────
    cli_fallback_start = None
    cli_fallback_end   = None

    if args.fallback_start:
        if not args.fallback_duration:
            sys.exit('\n--fallback-start also requires --fallback-duration.\n'
                     'Example: --fallback-start "2026-03-22 13:48:00" --fallback-duration "2:32:13"')
        cli_fallback_start = parse_local_time(args.fallback_start, tz_name)
        cli_fallback_end   = cli_fallback_start + parse_duration(args.fallback_duration)
        print(f'\nCLI fallback window ({tz_name}):')
        print(f'  {args.fallback_start}  →  +{args.fallback_duration}')
        print(f'  UTC: {fmt_ts(cli_fallback_start)}  →  {fmt_ts(cli_fallback_end)}')

    # ── Load GPX files ───────────────────────────────────────────
    files = sorted(glob.glob(os.path.join(args.folder, '*.gpx')))
    if not files:
        sys.exit(f'\nNo .gpx files found in: {args.folder}\n'
                 f'Create the folder and drop your Strava GPX exports in it.')

    print(f'\nFound {len(files)} GPX file(s):')
    tracks = []

    for f in files:
        pts, has_times = parse_gpx(f)
        name = os.path.splitext(os.path.basename(f))[0]

        if len(pts) < 2:
            print(f'  SKIP  {os.path.basename(f)}  — no GPS points found')
            continue

        if not has_times:
            fname     = os.path.basename(f)
            track_cfg = config.get('tracks', {}).get(fname)

            if track_cfg:
                t_start = parse_local_time(track_cfg['start'], tz_name)
                t_end   = t_start + parse_duration(track_cfg['duration'])
                print(f'  ✓  {fname}  (no timestamps — using config.json entry)')
                print(f'       {fmt_ts(t_start)}  →  {fmt_ts(t_end)}')
            elif cli_fallback_start is not None:
                t_start = cli_fallback_start
                t_end   = cli_fallback_end
                print(f'  ✓  {fname}  (no timestamps — using CLI fallback)')
            else:
                print(f'  SKIP  {fname}  — no timestamps in file.')
                print(f'         Add an entry to config.json or use --fallback-start / --fallback-duration.')
                continue

            pts = assign_timestamps(pts, t_start, t_end)

        ts  = np.array([p[0] for p in pts])
        xy  = np.array([to_xy(p[1], p[2]) for p in pts])
        dur = (ts[-1] - ts[0]) / 60

        print(f'  ✓  {os.path.basename(f)}')
        print(f'       {len(pts)} points  |  {dur:.1f} min')
        print(f'       Start : {fmt_ts(ts[0])}')
        print(f'       End   : {fmt_ts(ts[-1])}')

        tracks.append({'name': name, 'ts': ts, 'xy': xy})

    if not tracks:
        sys.exit('\nNo valid GPX tracks to animate. Exiting.')

    # ── Optionally align starts ──────────────────────────────────
    if args.align_starts:
        ref = tracks[0]['ts'][0]
        for t in tracks:
            t['ts'] = t['ts'] - t['ts'][0] + ref
        print('\n--align-starts: all tracks shifted to begin at the same moment.')

    g_start = min(t['ts'][0]  for t in tracks)
    g_end   = max(t['ts'][-1] for t in tracks)
    span    = g_end - g_start
    n_frames = int(args.duration * args.fps)

    print(f'\nAnimation window : {fmt_ts(g_start)}  →  {fmt_ts(g_end)}')
    print(f'Real time span   : {span/60:.1f} min  ({span/3600:.2f} hr)')
    print(f'Animation        : {args.duration}s × {args.fps}fps = {n_frames} frames')
    print(f'Time compression : 1 animation second = {span/args.duration/60:.1f} real minutes')
    print('\nFetching map tiles…')

    render_animation(
        tracks      = tracks,
        output_path = args.output,
        duration    = args.duration,
        fps         = args.fps,
        dpi         = args.dpi,
        figsize     = (10, 10),
        show_hud    = True,
        loop        = False,
        basemap     = True,
    )

    print(f'\n✓  Saved → {args.output}')


if __name__ == '__main__':
    main()
