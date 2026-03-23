---
permalink: /training/
title: "Training"
author_profile: true
redirect_from:
  - /training.html
---

<style>
  /* ── Section layout ─────────────────────────────────── */
  .train-section {
    margin-bottom: 48px;
  }

  .train-section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 16px;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }

  .train-section-header h2,
  .train-section > h2 {
    font-size: 1.2rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #888;
    margin: 0;
    border: none;
    padding: 0;
  }

  .train-updated {
    font-size: 0.78rem;
    color: #bbb;
  }

  /* ── YTD stat cards ──────────────────────────────────── */
  .stat-cards {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .stat-card {
    flex: 1 1 120px;
    background: #f4f6f9;
    border-radius: 10px;
    padding: 18px 20px;
    text-align: center;
  }

  .stat-val {
    font-size: 1.75rem;
    font-weight: 700;
    color: #003d7a;
    line-height: 1.1;
  }

  .stat-lbl {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #999;
    margin-top: 5px;
  }

  /* ── Heatmap ─────────────────────────────────────────── */
  .heatmap-outer {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }

  .hm-day-labels {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 22px; /* aligns with first cell row, below month labels */
    flex-shrink: 0;
  }

  .hm-day-label {
    height: 12px;
    line-height: 12px;
    width: 16px;
    font-size: 9px;
    color: #aaa;
    text-align: right;
  }

  .heatmap-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  #heatmap-months {
    display: flex;
    gap: 2px;
    height: 20px;
    align-items: flex-end;
    padding-bottom: 2px;
  }

  #heatmap-months span {
    display: block;
    width: 12px;
    font-size: 10px;
    color: #999;
    white-space: nowrap;
    overflow: visible;
  }

  #heatmap-grid {
    display: flex;
    gap: 2px;
  }

  .hm-week {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .hm-cell {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    background: #ebedf0;
    cursor: default;
    flex-shrink: 0;
    transition: opacity 0.1s;
  }

  .hm-empty {
    background: transparent !important;
    cursor: default;
  }

  .hm-has-data {
    cursor: pointer;
  }

  .hm-has-data:hover {
    opacity: 0.72;
  }

  .hm-selected {
    outline: 2px solid #003d7a;
    outline-offset: 1px;
  }

  /* ── Heatmap legend ──────────────────────────────────── */
  .hm-legend {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    color: #aaa;
    margin-top: 10px;
    justify-content: flex-end;
  }

  .hm-legend-cell {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  /* ── Detail panel ────────────────────────────────────── */
  #detail-panel {
    background: #f9fafb;
    border-radius: 12px;
    padding: 22px 26px;
    margin-top: 24px;
  }

  #detail-date {
    font-size: 1rem;
    font-weight: 600;
    color: #222;
    margin: 0 0 18px 0;
  }

  .detail-card {
    background: #fff;
    border: 1px solid #e8ecf0;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 12px;
  }

  .detail-card:last-child {
    margin-bottom: 0;
  }

  .detail-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .detail-card-name {
    font-weight: 600;
    color: #222;
    font-size: 0.97rem;
  }

  .detail-card-type {
    font-size: 0.75rem;
    background: #e8f0f9;
    color: #003d7a;
    padding: 2px 10px;
    border-radius: 20px;
    font-weight: 500;
  }

  .detail-card-stats {
    display: flex;
    gap: 28px;
    flex-wrap: wrap;
  }

  .dstat-val {
    font-size: 1.05rem;
    font-weight: 600;
    color: #003d7a;
    line-height: 1.2;
  }

  .dstat-lbl {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #999;
    margin-top: 3px;
  }

  /* ── Error state ─────────────────────────────────────── */
  #dashboard-error {
    background: #fdf3f3;
    border: 1px solid #f5c6c6;
    border-radius: 8px;
    padding: 16px 20px;
    color: #a33;
    font-size: 0.9rem;
  }
</style>

<div id="dashboard-error" hidden>
  Could not load activity data. The Strava data file may not exist yet — run the GitHub Actions workflow to generate it.
</div>

<div class="train-section">
  <div class="train-section-header">
    <h2>This Year</h2>
    <span id="last-updated" class="train-updated"></span>
  </div>
  <div class="stat-cards">
    <div class="stat-card">
      <div class="stat-val" id="stat-distance">—</div>
      <div class="stat-lbl">Distance</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" id="stat-activities">—</div>
      <div class="stat-lbl">Activities</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" id="stat-time">—</div>
      <div class="stat-lbl">Moving Time</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" id="stat-avg">—</div>
      <div class="stat-lbl">Frequency</div>
    </div>
  </div>
</div>

<div class="train-section">
  <h2 style="font-size:1.2rem;letter-spacing:1px;text-transform:uppercase;color:#888;margin-bottom:16px;border-bottom:1px solid #eee;padding-bottom:8px;">Activity</h2>

  <div class="heatmap-outer">
    <div class="hm-day-labels">
      <div class="hm-day-label"></div>
      <div class="hm-day-label">M</div>
      <div class="hm-day-label"></div>
      <div class="hm-day-label">W</div>
      <div class="hm-day-label"></div>
      <div class="hm-day-label">F</div>
      <div class="hm-day-label"></div>
    </div>
    <div class="heatmap-scroll">
      <div id="heatmap-months"></div>
      <div id="heatmap-grid"></div>
    </div>
  </div>

  <div class="hm-legend">
    <span>Less</span>
    <div class="hm-legend-cell" style="background:#ebedf0;"></div>
    <div class="hm-legend-cell" style="background:#c0d4e8;"></div>
    <div class="hm-legend-cell" style="background:#80aac8;"></div>
    <div class="hm-legend-cell" style="background:#3373a6;"></div>
    <div class="hm-legend-cell" style="background:#003d7a;"></div>
    <span>More</span>
  </div>

  <div id="detail-panel" hidden>
    <h3 id="detail-date"></h3>
    <div id="detail-list"></div>
  </div>
</div>

<script src="/assets/js/training-dashboard.js"></script>
