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

  var RIDE_TYPES = { Ride: true, VirtualRide: true, EBikeRide: true, Handcycle: true };

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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function fmtDateShort(isoStr) {
    var d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function fmtElevation(meters) {
    return Math.round(meters * 3.28084) + ' ft';
  }

  function fmtPace(avgSpeedMs, type) {
    if (!avgSpeedMs) return '—';
    if (RIDE_TYPES[type]) {
      return (avgSpeedMs * 2.23694).toFixed(1) + ' mph';
    }
    var minPerMile = 1609.344 / (avgSpeedMs * 60);
    var mins = Math.floor(minPerMile);
    var secs = Math.round((minPerMile - mins) * 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs + '/mi';
  }

  function paceLabel(type) {
    return RIDE_TYPES[type] ? 'Avg Speed' : 'Pace';
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  // ── State ────────────────────────────────────────────────
  var allActivities = [];
  var activitiesById = {};
  var activeFilter  = 'All';

  // ── DOM refs ─────────────────────────────────────────────
  var elLoading   = document.getElementById('feed-loading');
  var elError     = document.getElementById('feed-error');
  var elEmpty     = document.getElementById('feed-empty');
  var elContent   = document.getElementById('feed-content');
  var elFilters   = document.getElementById('feed-filters');
  var elGrid      = document.getElementById('feed-grid');
  var elYearLabel = document.getElementById('feed-year-label');
  var elCount     = document.getElementById('feed-count');

  // ── Modal refs ───────────────────────────────────────────
  var elModal      = document.getElementById('activity-modal');
  var elBackdrop   = document.getElementById('modal-backdrop');
  var elModalClose = document.getElementById('modal-close');
  var elModalGif   = document.getElementById('modal-gif');
  var elModalTitle = document.getElementById('modal-title');
  var elModalType  = document.getElementById('modal-type');
  var elModalDate  = document.getElementById('modal-date');
  var elModalStats = document.getElementById('modal-stats');
  var elElevWrap   = document.getElementById('modal-elev-wrap');
  var elElevCanvas = document.getElementById('modal-elev-canvas');
  var elLapsWrap   = document.getElementById('modal-laps-wrap');
  var elLapsBody   = document.getElementById('modal-laps-body');

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

      return '<div class="feed-card" data-id="' + a.id + '" style="cursor:pointer">'
        + '<img src="' + cardSrc(a) + '" alt="' + escHtml(a.name) + '" loading="lazy">'
        + '<div class="feed-card-body">'
        +   '<div class="feed-card-meta">'
        +     '<span class="feed-card-type">' + sportIcon(a.type) + ' ' + escHtml(a.type) + '</span>'
        +     '<span class="feed-card-date">' + fmtDateShort(a.start_date) + '</span>'
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

    // Attach click handlers
    var cards = elGrid.querySelectorAll('.feed-card[data-id]');
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener('click', function () {
          var id = parseInt(card.getAttribute('data-id'), 10);
          var activity = activitiesById[id];
          if (activity) openModal(activity);
        });
      })(cards[i]);
    }
  }

  // ── Modal ────────────────────────────────────────────────
  function openModal(a) {
    // GIF
    elModalGif.src = cardSrc(a);
    elModalGif.alt = a.name;

    // Header
    elModalTitle.textContent = a.name;
    elModalType.textContent  = sportIcon(a.type) + ' ' + a.type;
    elModalDate.textContent  = fmtDate(a.start_date);

    // Stats
    var avgSpeedMs = a.moving_time > 0 ? a.distance / a.moving_time : 0;
    var stats = [
      { val: fmtDistance(a.distance),         lbl: 'Distance' },
      { val: fmtTime(a.moving_time),           lbl: 'Time' },
      { val: fmtPace(avgSpeedMs, a.type),      lbl: paceLabel(a.type) },
    ];
    if (a.elevation > 10) {
      stats.push({ val: fmtElevation(a.elevation), lbl: 'Elevation' });
    }
    if (a.avg_hr) {
      stats.push({ val: Math.round(a.avg_hr) + ' bpm', lbl: 'Avg HR' });
    }
    if (a.max_hr) {
      stats.push({ val: Math.round(a.max_hr) + ' bpm', lbl: 'Max HR' });
    }
    elModalStats.innerHTML = stats.map(function (s) {
      return '<div class="modal-stat">'
        + '<div class="modal-stat-val">' + escHtml(String(s.val)) + '</div>'
        + '<div class="modal-stat-lbl">' + escHtml(s.lbl) + '</div>'
        + '</div>';
    }).join('');

    // Elevation profile
    if (a.altitude && a.altitude.length > 2) {
      elElevWrap.hidden = false;
      // Defer canvas draw until visible (need layout dimensions)
      setTimeout(function () { drawElevationChart(elElevCanvas, a.altitude); }, 30);
    } else {
      elElevWrap.hidden = true;
    }

    // Laps
    var laps = a.laps;
    if (laps && laps.length > 1) {
      elLapsBody.innerHTML = laps.map(function (lap) {
        var pace = lap.average_speed ? fmtPace(lap.average_speed, a.type) : '—';
        var hr   = lap.average_heartrate ? Math.round(lap.average_heartrate) + ' bpm' : '—';
        return '<tr>'
          + '<td>' + lap.lap_index + '</td>'
          + '<td>' + fmtDistance(lap.distance) + '</td>'
          + '<td>' + pace + '</td>'
          + '<td>' + hr + '</td>'
          + '</tr>';
      }).join('');
      elLapsWrap.hidden = false;
    } else {
      elLapsWrap.hidden = true;
    }

    elModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    elModal.hidden = true;
    document.body.style.overflow = '';
    elModalGif.src = '';
  }

  // ── Elevation chart ──────────────────────────────────────
  function drawElevationChart(canvas, altData) {
    var W = canvas.clientWidth || canvas.parentElement.clientWidth || 500;
    var H = 80;
    canvas.width  = W;
    canvas.height = H;

    var ctx = canvas.getContext('2d');
    var minA = altData.reduce(function (m, v) { return Math.min(m, v); }, Infinity);
    var maxA = altData.reduce(function (m, v) { return Math.max(m, v); }, -Infinity);
    var range = maxA - minA || 1;
    var pad = 6;

    var pts = altData.map(function (a, i) {
      return {
        x: (i / (altData.length - 1)) * W,
        y: H - pad - ((a - minA) / range) * (H - pad * 2),
      };
    });

    var accent = isDark() ? '#4A9EE8' : '#003d7a';
    var fillA  = isDark() ? 'rgba(74,158,232,0.35)' : 'rgba(0,61,122,0.25)';
    var fillB  = isDark() ? 'rgba(74,158,232,0)'    : 'rgba(0,61,122,0)';

    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, fillA);
    grad.addColorStop(1, fillB);

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.lineTo(pts[0].x, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var j = 1; j < pts.length; j++) {
      ctx.lineTo(pts[j].x, pts[j].y);
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.stroke();
  }

  // ── Modal event listeners ────────────────────────────────
  if (elModalClose) elModalClose.addEventListener('click', closeModal);
  if (elBackdrop)   elBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && elModal && !elModal.hidden) closeModal();
  });

  // Re-render GIF src when theme changes
  window.addEventListener('themechange', function () {
    if (allActivities.length > 0) renderGrid();
    // Also update modal GIF if open
    if (elModal && !elModal.hidden && elModalGif && elModalGif.dataset.id) {
      var a = activitiesById[parseInt(elModalGif.dataset.id, 10)];
      if (a) elModalGif.src = cardSrc(a);
    }
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
      activitiesById = {};
      allActivities.forEach(function (a) { activitiesById[a.id] = a; });

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
