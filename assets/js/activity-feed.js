(function () {
  'use strict';

  var DATA_URL = '/assets/data/activity-cards.json';

  var SPORT_ICONS = {
    Run:             '🏃',
    Ride:            '🚴',
    Walk:            '🚶',
    Hike:            '🥾',
    Swim:            '🏊',
    AlpineSki:       '⛷️',
    NordicSki:       '⛷️',
    BackcountrySki:  '⛷️',
    Snowshoe:        '🧊',
    Kayaking:        '🚣',
    Rowing:          '🚣',
    Canoeing:        '🚣',
    Surfing:         '🏄',
    IceSkate:        '⛸️',
  };

  function sportIcon(type) {
    return SPORT_ICONS[type] || '🏅';
  }

  function fmtDistance(meters) {
    return (meters / 1609.344).toFixed(1) + ' mi';
  }

  function fmtTime(seconds) {
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? h + 'h ' + m + 'm' : m + 'm';
  }

  function fmtDate(isoStr) {
    var d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function fmtElevation(meters) {
    return Math.round(meters * 3.28084) + ' ft';
  }

  // ── State ────────────────────────────────────────────────
  var allActivities = [];
  var activeFilter  = 'All';
  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  // ── DOM refs ─────────────────────────────────────────────
  var elLoading   = document.getElementById('feed-loading');
  var elError     = document.getElementById('feed-error');
  var elEmpty     = document.getElementById('feed-empty');
  var elContent   = document.getElementById('feed-content');
  var elFilters   = document.getElementById('feed-filters');
  var elGrid      = document.getElementById('feed-grid');
  var elYearLabel = document.getElementById('feed-year-label');
  var elCount     = document.getElementById('feed-count');

  // ── Render filters ───────────────────────────────────────
  function renderFilters() {
    var types = allActivities.map(function (a) { return a.type; });
    var unique = types.filter(function (t, i) { return types.indexOf(t) === i; });
    var labels = ['All'].concat(unique);

    elFilters.innerHTML = '';
    labels.forEach(function (type) {
      var btn = document.createElement('button');
      btn.className = 'feed-filter-btn' + (type === activeFilter ? ' active' : '');
      btn.textContent = type === 'All' ? 'All' : sportIcon(type) + ' ' + type;
      btn.addEventListener('click', function () {
        activeFilter = type;
        renderFilters();
        renderGrid();
      });
      elFilters.appendChild(btn);
    });
  }

  function cardSrc(a) {
    if (isDark() && a.card_dark)   return a.card_dark;
    if (!isDark() && a.card_light) return a.card_light;
    return a.card_dark || a.card_light || a.card || '';
  }

  // ── Render grid ──────────────────────────────────────────
  function renderGrid() {
    var filtered = activeFilter === 'All'
      ? allActivities
      : allActivities.filter(function (a) { return a.type === activeFilter; });

    if (filtered.length === 0) {
      elGrid.innerHTML = '<p style="color:#888;grid-column:1/-1;padding:16px 0">No activities to show.</p>';
      return;
    }

    elGrid.innerHTML = filtered.map(function (a) {
      var elevHTML = a.elevation > 10
        ? '<div><div class="feed-stat-val">' + fmtElevation(a.elevation) + '</div>'
          + '<div class="feed-stat-lbl">Elev</div></div>'
        : '';

      return '<div class="feed-card">'
        + '<img src="' + cardSrc(a) + '" alt="' + escHtml(a.name) + '" loading="lazy">'
        + '<div class="feed-card-body">'
        +   '<div class="feed-card-meta">'
        +     '<span class="feed-card-type">' + sportIcon(a.type) + ' ' + escHtml(a.type) + '</span>'
        +     '<span class="feed-card-date">' + fmtDate(a.start_date) + '</span>'
        +   '</div>'
        +   '<div class="feed-card-name">' + escHtml(a.name) + '</div>'
        +   '<div class="feed-card-stats">'
        +     '<div><div class="feed-stat-val">' + fmtDistance(a.distance) + '</div>'
        +       '<div class="feed-stat-lbl">Distance</div></div>'
        +     '<div><div class="feed-stat-val">' + fmtTime(a.moving_time) + '</div>'
        +       '<div class="feed-stat-lbl">Time</div></div>'
        +     elevHTML
        +   '</div>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Re-render cards when theme toggle fires or system preference changes
  window.addEventListener('themechange', function () {
    if (allActivities.length > 0) renderGrid();
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (!localStorage.getItem('theme') && allActivities.length > 0) renderGrid();
  });

  // ── Fetch and initialise ─────────────────────────────────
  fetch(DATA_URL)
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (data) {
      elLoading.hidden = true;

      if (data.year) {
        elYearLabel.textContent = data.year + ' Activities';
      }

      allActivities = data.activities || [];

      if (allActivities.length === 0) {
        elEmpty.hidden = false;
        return;
      }

      elCount.textContent = allActivities.length + ' activities';
      elContent.hidden = false;
      renderFilters();
      renderGrid();
    })
    .catch(function () {
      elLoading.hidden = true;
      elError.hidden   = false;
    });

}());
