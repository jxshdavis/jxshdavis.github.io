#!/usr/bin/env python3
"""
gpx_core.py — shared rendering core for GPX animation tools.

Exports:
    parse_gpx(path)                    -> (points, has_timestamps)
    assign_timestamps(pts, start, end) -> points
    to_xy(lat, lon)                    -> np.ndarray
    interp_pos(xy, ts, t)              -> np.ndarray | None
    render_animation(...)              -> None
"""

import os
import numpy as np
import gpxpy
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import matplotlib.colors as mcolors
from matplotlib.collections import LineCollection
from pyproj import Transformer
import warnings
warnings.filterwarnings('ignore')


# ── Visual config ─────────────────────────────────────────────
BG_COLOR     = '#0d0d0d'
COLORS       = ['#3B9EE8', '#00CFFF', '#FFD200', '#00FF88', '#FF4DFF', '#FF6B35']

GHOST_ALPHA  = 0.07
GHOST_WIDTH  = 1.5
TRAIL_WIDTH  = 2.5
TRAIL_ALPHA  = 0.88
GLOW_SIZES   = [600, 300, 130, 60]
GLOW_ALPHAS  = [0.04, 0.10, 0.18, 0.28]
CORE_SIZE    = 50
PADDING      = 0.06


# ── Coordinate transform ──────────────────────────────────────
_to_merc = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)


# ── GPX parsing ───────────────────────────────────────────────
def parse_gpx(path):
    """
    Returns (points, has_timestamps).
    points is a list of (unix_ts_or_None, lat, lon).
    """
    with open(path, 'r', encoding='utf-8') as f:
        gpx = gpxpy.parse(f)

    timed, untimed = [], []
    for track in gpx.tracks:
        for seg in track.segments:
            for p in seg.points:
                if p.time:
                    timed.append((p.time.timestamp(), p.latitude, p.longitude))
                else:
                    untimed.append((None, p.latitude, p.longitude))

    if timed:
        timed.sort()
        return timed, True
    return untimed, False


def assign_timestamps(pts, start_ts, end_ts):
    """
    Distribute timestamps proportionally by cumulative distance along the route.
    More accurate than linear spacing — slow/turning sections get more time.
    """
    lats  = np.array([p[1] for p in pts])
    lons  = np.array([p[2] for p in pts])
    dlat  = np.diff(lats) * 111_320
    dlon  = np.diff(lons) * 111_320 * np.cos(np.radians(lats[:-1]))
    dists = np.sqrt(dlat**2 + dlon**2)
    cum   = np.concatenate([[0], np.cumsum(dists)])
    total = cum[-1]
    fracs = cum / total if total > 0 else np.linspace(0, 1, len(pts))
    span  = end_ts - start_ts
    return [(start_ts + f * span, p[1], p[2]) for f, p in zip(fracs, pts)]


def to_xy(lat, lon):
    return np.array(_to_merc.transform(lon, lat))


def interp_pos(xy, ts, t):
    """
    Linearly interpolate (x, y) at real time t.
    Returns None before track starts; clamps to last point after track ends.
    """
    if t < ts[0]:
        return None
    if t >= ts[-1]:
        return xy[-1]
    i  = int(np.clip(np.searchsorted(ts, t, side='right') - 1, 0, len(ts) - 2))
    dt = ts[i + 1] - ts[i]
    a  = (t - ts[i]) / dt if dt > 0 else 0.0
    return xy[i] + a * (xy[i + 1] - xy[i])


# ── Renderer ──────────────────────────────────────────────────
def render_animation(
    tracks,
    output_path,
    duration,
    fps,
    dpi,
    figsize,
    show_hud,
    loop,
    basemap,
    bg_color=None,
    colors=None,
):
    """
    Render one or more GPS tracks to an animated .gif or .mp4.

    Parameters
    ----------
    tracks      : list of {'name': str, 'ts': np.ndarray, 'xy': np.ndarray}
                  ts — unix timestamps (seconds); xy — Web Mercator (x, y) pairs
    output_path : str  — '.gif' uses PillowWriter, '.mp4' uses FFMpegWriter
    duration    : float — animation length in seconds
    fps         : int
    dpi         : int
    figsize     : (float, float) — inches
    show_hud    : bool — draw elapsed-time counter and progress bar
    loop        : bool — cyclic seamless trail; for GIF output, loops infinitely
    basemap     : bool — fetch CartoDB DarkMatter tiles via contextily
    """
    ext      = os.path.splitext(output_path)[1].lower()
    is_gif   = ext == '.gif'
    bg_color = bg_color if bg_color is not None else BG_COLOR
    colors   = colors   if colors   is not None else COLORS

    n_frames    = int(duration * fps)
    g_start     = min(t['ts'][0]  for t in tracks)
    g_end       = max(t['ts'][-1] for t in tracks)
    frame_real  = np.linspace(g_start, g_end, n_frames)

    # ── Bounding box ────────────────────────────────────────────
    all_xy = np.vstack([t['xy'] for t in tracks])
    xmin, ymin = all_xy.min(axis=0)
    xmax, ymax = all_xy.max(axis=0)
    px = max((xmax - xmin) * PADDING, 200)
    py = max((ymax - ymin) * PADDING, 200)
    xmin -= px; xmax += px
    ymin -= py; ymax += py

    # ── Figure ──────────────────────────────────────────────────
    fig, ax = plt.subplots(figsize=figsize, facecolor=bg_color)
    ax.set_facecolor(bg_color)
    ax.set_xlim(xmin, xmax)
    ax.set_ylim(ymin, ymax)
    ax.set_aspect('equal')
    ax.axis('off')
    fig.subplots_adjust(0, 0, 1, 1)

    # ── Basemap ─────────────────────────────────────────────────
    if basemap:
        try:
            import contextily as ctx
            ctx.add_basemap(ax, crs='EPSG:3857',
                            source=ctx.providers.CartoDB.DarkMatter,
                            attribution=False)
            print('  Map tiles loaded.')
        except Exception as e:
            print(f'  Warning: could not load map tiles ({e})')

    # ── Ghost routes ────────────────────────────────────────────
    for i, t in enumerate(tracks):
        c = colors[i % len(colors)]
        ax.plot(t['xy'][:, 0], t['xy'][:, 1],
                color=c, alpha=GHOST_ALPHA, lw=GHOST_WIDTH, zorder=2,
                solid_capstyle='round', solid_joinstyle='round')

    # ── Trail pre-computation ────────────────────────────────────
    trail_len = n_frames - 1
    cutoff    = int(trail_len * 0.10)
    trail_alphas = np.concatenate([
        np.zeros(cutoff),
        np.linspace(0.0, TRAIL_ALPHA, trail_len - cutoff),
    ])

    track_artists = []
    for i, t in enumerate(tracks):
        c     = colors[i % len(colors)]
        c_rgb = mcolors.to_rgb(c)

        # Pre-compute dot position at every frame
        all_pos = np.array([
            interp_pos(t['xy'], t['ts'], rt)
            if interp_pos(t['xy'], t['ts'], rt) is not None
            else t['xy'][0]
            for rt in frame_real
        ])  # (n_frames, 2)

        tc        = np.zeros((trail_len, 4))
        tc[:, :3] = c_rgb
        tc[:, 3]  = trail_alphas

        lc = LineCollection([], linewidths=TRAIL_WIDTH, zorder=4,
                            capstyle='butt', joinstyle='round')
        ax.add_collection(lc)

        glow_rings = [
            ax.scatter([], [], s=sz, c=c, alpha=al, zorder=5, linewidths=0)
            for sz, al in zip(GLOW_SIZES, GLOW_ALPHAS)
        ]
        core = ax.scatter([], [], s=CORE_SIZE, c='white', alpha=1.0,
                          zorder=9, linewidths=0)

        track_artists.append({
            'all_pos':      all_pos,
            'trail_colors': tc,
            'lc':           lc,
            'glow_rings':   glow_rings,
            'core':         core,
        })

    # ── HUD ─────────────────────────────────────────────────────
    hud_artists = []
    pb_x0 = pb_x1 = 0.0  # satisfy linter; set properly below
    if show_hud:
        hud_y_top  = ymax - (ymax - ymin) * 0.04
        hud_x_left = xmin + (xmax - xmin) * 0.03

        time_txt = ax.text(
            hud_x_left, hud_y_top, '',
            color='white', fontsize=14, va='top', ha='left',
            fontfamily='monospace', zorder=15,
            bbox=dict(boxstyle='round,pad=0.45', fc=BG_COLOR, alpha=0.72, ec='none'),
        )

        pb_y  = ymin + (ymax - ymin) * 0.025
        pb_x0 = xmin + (xmax - xmin) * 0.03
        pb_x1 = xmax - (xmax - xmin) * 0.03
        ax.plot([pb_x0, pb_x1], [pb_y, pb_y],
                color='white', alpha=0.18, lw=4, zorder=14, solid_capstyle='butt')
        pb_fill, = ax.plot([pb_x0, pb_x0], [pb_y, pb_y],
                           color='white', alpha=0.70, lw=4, zorder=15,
                           solid_capstyle='butt')

        hud_artists  = [time_txt, pb_fill]
        _span_real   = g_end - g_start

    # ── Update function ─────────────────────────────────────────
    def update(frame):
        artists = []

        for ta in track_artists:
            all_pos = ta['all_pos']
            tc      = ta['trail_colors']

            if loop:
                # Cyclic trail — skip the segment that jumps from end back to start
                indices    = np.array([(frame - trail_len + i) % n_frames
                                       for i in range(trail_len + 1)])
                trail_pts  = all_pos[indices]
                segs       = np.stack([trail_pts[:-1], trail_pts[1:]], axis=1)
                valid      = np.diff(indices) > 0   # False at the wrap-around jump
                ta['lc'].set_segments(segs[valid])
                ta['lc'].set_color(tc[valid])
            else:
                # Growing trail — fixed-length window ending at current frame
                start     = max(0, frame - trail_len)
                trail_pts = all_pos[start:frame + 1]
                if len(trail_pts) >= 2:
                    segs   = np.stack([trail_pts[:-1], trail_pts[1:]], axis=1)
                    n_segs = len(segs)
                    ta['lc'].set_segments(segs)
                    ta['lc'].set_color(tc[-n_segs:])
                else:
                    ta['lc'].set_segments([])

            pos2d = all_pos[frame].reshape(1, 2)
            for r in ta['glow_rings']:
                r.set_offsets(pos2d)
            ta['core'].set_offsets(pos2d)

            artists += [ta['lc'], ta['core']] + ta['glow_rings']

        if show_hud:
            elapsed = (frame / max(n_frames - 1, 1)) * _span_real
            h, rem  = divmod(int(elapsed), 3600)
            m, s    = divmod(rem, 60)
            time_txt.set_text(f'{h:02d}:{m:02d}:{s:02d}' if h else f'{m:02d}:{s:02d}')
            p = frame / max(n_frames - 1, 1)
            pb_fill.set_xdata([pb_x0, pb_x0 + (pb_x1 - pb_x0) * p])
            artists = hud_artists + artists

        return artists

    # ── Save ────────────────────────────────────────────────────
    print(f'Rendering {n_frames} frames → {output_path} …')
    anim_obj = animation.FuncAnimation(
        fig, update, frames=n_frames, interval=1000 / fps, blit=True,
    )

    savefig_kw = {'facecolor': bg_color, 'edgecolor': 'none'}

    if is_gif:
        writer = animation.PillowWriter(fps=fps)
        anim_obj.save(output_path, writer=writer, dpi=dpi,
                      savefig_kwargs=savefig_kw)
    else:
        def _progress(i, n):
            pct    = (i + 1) / n * 100
            filled = int(pct / 2)
            bar    = '█' * filled + '░' * (50 - filled)
            print(f'\r  [{bar}] {pct:5.1f}%', end='', flush=True)

        writer = animation.FFMpegWriter(
            fps=fps, bitrate=5000,
            extra_args=['-vcodec', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18'],
        )
        anim_obj.save(output_path, writer=writer, dpi=dpi,
                      savefig_kwargs=savefig_kw,
                      progress_callback=_progress)
        print()

    plt.close(fig)
    print(f'✓  Done → {output_path}')
