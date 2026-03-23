#!/usr/bin/env python3
"""
test_render.py — quick visual workshop for activity card style.
Renders a single GPX file as an animated GIF card (no basemap).

Usage:
    python test_render.py                        # dark theme
    python test_render.py --theme light          # light theme
    python test_render.py --both                 # render both themes
    python test_render.py --gpx gpx/MyRide.gpx --output test_card.gif
    python test_render.py --duration 5 --fps 30
"""

import argparse
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import matplotlib.colors as mcolors
from matplotlib.collections import LineCollection
import warnings
warnings.filterwarnings('ignore')

from gpx_core import parse_gpx, to_xy, interp_pos


# ── Theme definitions ─────────────────────────────────────────
THEMES = {
    'dark': {
        'bg':          '#0d0d0d',
        'route_color': '#4A9EE8',   # bright blue on dark
        'dot_color':   '#ffffff',
    },
    'light': {
        'bg':          '#f5f5f5',
        'route_color': '#003d7a',   # Berkeley Blue on light
        'dot_color':   '#003d7a',
    },
}

# ── Visual constants (shared across themes) ───────────────────
GHOST_ALPHA  = 0.07
GHOST_WIDTH  = 1.5
TRAIL_WIDTH  = 2.5
TRAIL_ALPHA  = 0.88
GLOW_SIZES   = [600, 300, 130, 60]
GLOW_ALPHAS  = [0.04, 0.10, 0.18, 0.28]
CORE_SIZE    = 50
PADDING      = 0.06


def render(gpx_path, output_path, duration, fps, figsize, theme):
    pts, has_times = parse_gpx(gpx_path)
    if len(pts) < 2:
        raise ValueError(f'Not enough GPS points in {gpx_path}')

    # If timestamps are missing, distribute evenly
    if not has_times:
        n   = len(pts)
        pts = [(float(i) / (n - 1) * duration, p[1], p[2]) for i, p in enumerate(pts)]

    ts = np.array([p[0] for p in pts])
    xy = np.array([to_xy(p[1], p[2]) for p in pts])

    # Normalise timestamps so animation always runs 0 → duration
    ts = (ts - ts[0]) / (ts[-1] - ts[0]) * duration

    n_frames    = int(duration * fps)
    frame_times = np.linspace(0, duration, n_frames)

    bg          = theme['bg']
    route_color = theme['route_color']
    dot_color   = theme['dot_color']
    route_rgb   = mcolors.to_rgb(route_color)

    # Pre-compute dot position for every frame so the trail can wrap cyclically
    all_pos = np.array([
        interp_pos(xy, ts, t) if interp_pos(xy, ts, t) is not None else xy[0]
        for t in frame_times
    ])  # shape: (n_frames, 2)

    # Trail covers the entire loop — so it's always n_frames - 1 segments long
    trail_len = n_frames - 1

    # Pre-compute per-segment alpha: first 10% fully transparent, then linear ramp
    cutoff       = int(trail_len * 0.10)
    trail_alphas = np.concatenate([
        np.zeros(cutoff),
        np.linspace(0.0, TRAIL_ALPHA, trail_len - cutoff),
    ])
    trail_colors = np.zeros((trail_len, 4))
    trail_colors[:, 0] = route_rgb[0]
    trail_colors[:, 1] = route_rgb[1]
    trail_colors[:, 2] = route_rgb[2]
    trail_colors[:, 3] = trail_alphas

    # Bounding box
    px = max((xy[:, 0].max() - xy[:, 0].min()) * PADDING, 200)
    py = max((xy[:, 1].max() - xy[:, 1].min()) * PADDING, 200)
    xmin = xy[:, 0].min() - px;  xmax = xy[:, 0].max() + px
    ymin = xy[:, 1].min() - py;  ymax = xy[:, 1].max() + py

    fig, ax = plt.subplots(figsize=figsize, facecolor=bg)
    ax.set_facecolor(bg)
    ax.set_xlim(xmin, xmax)
    ax.set_ylim(ymin, ymax)
    ax.set_aspect('equal')
    ax.axis('off')
    fig.subplots_adjust(0, 0, 1, 1)

    # Ghost route
    ax.plot(xy[:, 0], xy[:, 1],
            color=route_color, alpha=GHOST_ALPHA, lw=GHOST_WIDTH, zorder=2,
            solid_capstyle='round', solid_joinstyle='round')

    # Decaying trail — LineCollection so each segment has its own alpha
    lc = LineCollection([], linewidths=TRAIL_WIDTH, zorder=4, capstyle='butt', joinstyle='round')
    ax.add_collection(lc)

    # Glow rings + dot
    glow_rings = [ax.scatter([], [], s=sz, c=route_color, alpha=al, zorder=5, linewidths=0)
                  for sz, al in zip(GLOW_SIZES, GLOW_ALPHAS)]
    core       = ax.scatter([], [], s=CORE_SIZE, c=dot_color, alpha=1.0, zorder=9, linewidths=0)

    def update(frame):
        # Trail: indices wrapping cyclically so loop is seamless
        indices   = [(frame - trail_len + i) % n_frames for i in range(trail_len + 1)]
        trail_pts = all_pos[indices]
        segments  = np.stack([trail_pts[:-1], trail_pts[1:]], axis=1)
        lc.set_segments(segments)
        lc.set_color(trail_colors)

        pos2d = all_pos[frame].reshape(1, 2)
        for r in glow_rings: r.set_offsets(pos2d)
        core.set_offsets(pos2d)

        return [lc, core] + glow_rings

    anim = animation.FuncAnimation(fig, update, frames=n_frames,
                                   interval=1000 / fps, blit=True)

    writer = animation.PillowWriter(fps=fps)
    print(f'Rendering {n_frames} frames [{bg}] → {output_path} …')
    anim.save(output_path, writer=writer, dpi=100,
              savefig_kwargs={'facecolor': bg, 'edgecolor': 'none'})
    plt.close(fig)
    print(f'✓  Done — open {output_path} to preview')


# ── CLI ────────────────────────────────────────────────────────
if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--gpx',      default='gpx/Afternoon_Ride-2.gpx')
    ap.add_argument('--output',   default='test_card.gif',
                    help='Output path (ignored when --both is set)')
    ap.add_argument('--theme',    default='dark', choices=['dark', 'light'],
                    help='Color theme (default: dark)')
    ap.add_argument('--both',     action='store_true',
                    help='Render both dark and light themes')
    ap.add_argument('--duration', type=float, default=5.0,
                    help='Animation length in seconds (default: 5)')
    ap.add_argument('--fps',      type=int,   default=30,
                    help='Frames per second (default: 30)')
    ap.add_argument('--size',     type=float, default=4.0,
                    help='Card size in inches, square (default: 4)')
    args = ap.parse_args()

    renders = (
        [('dark', 'test_card_dark.gif'), ('light', 'test_card_light.gif')]
        if args.both
        else [(args.theme, args.output)]
    )

    for theme_name, out_path in renders:
        render(
            gpx_path    = args.gpx,
            output_path = out_path,
            duration    = args.duration,
            fps         = args.fps,
            figsize     = (args.size, args.size),
            theme       = THEMES[theme_name],
        )
