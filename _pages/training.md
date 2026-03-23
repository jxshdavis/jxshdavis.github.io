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
    border-bottom: 1px solid var(--t-border);
    padding-bottom: 8px;
  }

  .train-section-header h2,
  .train-section > h2 {
    font-size: 1.2rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--t-muted);
    margin: 0;
    border: none;
    padding: 0;
  }

  .train-updated {
    font-size: 0.78rem;
    color: var(--t-muted-4);
  }

  /* ── YTD stat cards ──────────────────────────────────── */
  .stat-cards {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .stat-card {
    flex: 1 1 120px;
    background: var(--t-card-bg);
    border-radius: 10px;
    padding: 18px 20px;
    text-align: center;
  }

  .stat-val {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--t-accent);
    line-height: 1.1;
  }

  .stat-lbl {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--t-muted-2);
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
    color: var(--t-muted-3);
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
    color: var(--t-muted-2);
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
    background: var(--hm-0);
    cursor: default;
    flex-shrink: 0;
    transition: opacity 0.1s;
  }

  .hm-lvl-0 { background: var(--hm-0); }
  .hm-lvl-1 { background: var(--hm-1); }
  .hm-lvl-2 { background: var(--hm-2); }
  .hm-lvl-3 { background: var(--hm-3); }
  .hm-lvl-4 { background: var(--hm-4); }

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
    outline: 2px solid var(--t-accent);
    outline-offset: 1px;
  }

  /* ── Heatmap legend ──────────────────────────────────── */
  .hm-legend {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    color: var(--t-muted-3);
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
    background: var(--t-panel-bg);
    border-radius: 12px;
    padding: 22px 26px;
    margin-top: 24px;
  }

  #detail-date {
    font-size: 1rem;
    font-weight: 600;
    color: var(--t-text);
    margin: 0 0 18px 0;
  }

  .detail-card {
    background: var(--t-detail-bg);
    border: 1px solid var(--t-border-2);
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
    color: var(--t-text);
    font-size: 0.97rem;
  }

  .detail-card-type {
    font-size: 0.75rem;
    background: var(--t-accent-bg);
    color: var(--t-accent);
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
    color: var(--t-accent);
    line-height: 1.2;
  }

  .dstat-lbl {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--t-muted-2);
    margin-top: 3px;
  }

  /* ── Period toggle ──────────────────────────────────── */
  .period-toggle {
    display: flex;
    gap: 3px;
    background: var(--t-toggle-bg);
    border-radius: 8px;
    padding: 3px;
  }

  .period-btn {
    background: none;
    border: none;
    padding: 5px 11px;
    border-radius: 6px;
    font-size: 0.78rem;
    color: var(--t-muted);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    font-family: inherit;
  }

  .period-btn:hover:not(.period-btn--active) {
    background: var(--t-accent-hover);
    color: var(--t-accent);
  }

  .period-btn--active {
    background: var(--t-accent);
    color: #fff;
  }

  .train-last-updated {
    font-size: 0.75rem;
    color: var(--t-muted-5);
    margin-top: 12px;
    text-align: right;
  }

  /* ── Activity type filter ────────────────────────────── */
  .activity-filter {
    position: relative;
  }

  .activity-filter-btn {
    background: var(--t-toggle-bg);
    border: none;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.78rem;
    color: var(--t-text-3);
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
    transition: background 0.15s;
  }

  .activity-filter-btn:hover {
    background: var(--t-toggle-hover);
  }

  .activity-filter-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: var(--t-detail-bg);
    border: 1px solid var(--t-border-2);
    border-radius: 10px;
    padding: 6px 0;
    min-width: 170px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    z-index: 100;
  }

  .filter-option {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 7px 14px;
    cursor: pointer;
    transition: background 0.1s;
  }

  .filter-option:hover {
    background: var(--t-card-bg);
  }

  .filter-option label {
    cursor: pointer;
    margin: 0;
    font-size: 0.85rem;
    color: var(--t-text-2);
  }

  .filter-option input[type="checkbox"] {
    accent-color: var(--t-accent);
    width: 14px;
    height: 14px;
    cursor: pointer;
    flex-shrink: 0;
    margin: 0;
  }

  .filter-divider {
    border: none;
    border-top: 1px solid var(--t-border);
    margin: 5px 0;
  }

  /* ── Error state ──────────────────────────────────────── */
  #dashboard-error {
    background: var(--t-error-bg);
    border: 1px solid var(--t-error-bdr);
    border-radius: 8px;
    padding: 16px 20px;
    color: #a33;
    font-size: 0.9rem;
  }

  /* ── Activity feed filter pills ──────────────────────── */
  #feed-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  .feed-filter-btn {
    background: var(--t-toggle-bg);
    border: none;
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 0.78rem;
    color: var(--t-text-3);
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s, color 0.15s;
  }

  .feed-filter-btn:hover:not(.active) {
    background: var(--t-toggle-hover);
  }

  .feed-filter-btn.active {
    background: var(--t-accent);
    color: #fff;
  }

  /* ── Activity feed card grid ─────────────────────────── */
  #feed-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  @media (max-width: 900px) {
    #feed-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 540px) {
    #feed-grid { grid-template-columns: 1fr; }
  }

  .feed-card {
    background: var(--feed-card-bg);
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .feed-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(74, 158, 232, 0.18);
  }

  .feed-card img {
    width: 100%;
    display: block;
    aspect-ratio: 1 / 1;
  }

  .feed-card-body {
    padding: 12px 14px 14px;
  }

  .feed-card-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
  }

  .feed-card-type {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--feed-card-type);
  }

  .feed-card-date {
    font-size: 0.7rem;
    color: var(--feed-card-date);
  }

  .feed-card-name {
    color: var(--feed-card-name);
    font-weight: 600;
    font-size: 0.88rem;
    margin-bottom: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .feed-card-stats {
    display: flex;
    gap: 18px;
  }

  .feed-stat-val {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--feed-stat-val);
    line-height: 1.2;
  }

  .feed-stat-lbl {
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--feed-stat-lbl);
    margin-top: 2px;
  }

  /* ── Feed states ─────────────────────────────────────── */
  #feed-loading {
    color: var(--t-muted-3);
    font-size: 0.9rem;
    padding: 16px 0;
  }

  #feed-error {
    background: var(--t-error-bg);
    border: 1px solid var(--t-error-bdr);
    border-radius: 8px;
    padding: 16px 20px;
    color: #a33;
    font-size: 0.9rem;
  }

  #feed-empty {
    color: var(--t-muted-3);
    font-size: 0.9rem;
    padding: 16px 0;
  }

</style>

<div id="dashboard-error" hidden>
  Could not load activity data. The Strava data file may not exist yet — run the GitHub Actions workflow to generate it.
</div>

<div class="train-section">
  <div class="train-section-header">
    <h2 id="stats-period-label">2026</h2>
    <div style="display:flex;gap:8px;align-items:center;">
      <div class="activity-filter" id="activity-filter">
        <button class="activity-filter-btn" id="activity-filter-btn">All Activities &#9662;</button>
        <div class="activity-filter-dropdown" id="activity-filter-dropdown" hidden></div>
      </div>
      <div class="period-toggle">
        <button class="period-btn" data-period="week">Week</button>
        <button class="period-btn" data-period="month">Month</button>
        <button class="period-btn period-btn--active" data-period="year">Year</button>
        <button class="period-btn" data-period="all">All Time</button>
      </div>
    </div>
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
  <div class="train-last-updated" id="last-updated"></div>
</div>


<div class="train-section">
  <div class="train-section-header">
    <h2>Activity</h2>
  </div>

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
    <div class="hm-legend-cell hm-lvl-0"></div>
    <div class="hm-legend-cell hm-lvl-1"></div>
    <div class="hm-legend-cell hm-lvl-2"></div>
    <div class="hm-legend-cell hm-lvl-3"></div>
    <div class="hm-legend-cell hm-lvl-4"></div>
    <span>More</span>
  </div>

  <div id="detail-panel" hidden>
    <h3 id="detail-date"></h3>
    <div id="detail-list"></div>
  </div>
</div>

<script src="/assets/js/training-dashboard.js"></script>

<div class="train-section">
  <div class="train-section-header">
    <h2 id="feed-year-label">Activities</h2>
    <span class="train-updated" id="feed-count"></span>
  </div>

  <div id="feed-loading">Loading activities…</div>

  <div id="feed-error" hidden>
    Could not load activity data. The feed will appear once the GitHub Actions workflow has run.
  </div>

  <div id="feed-empty" hidden>
    No activities with GPS data found for this year yet.
  </div>

  <div id="feed-content" hidden>
    <div id="feed-filters"></div>
    <div id="feed-grid"></div>
  </div>
</div>

<script src="/assets/js/activity-feed.js"></script>
