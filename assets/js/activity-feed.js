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

  function sportIcon(t) { return SPORT_ICONS[t] || '🏅'; }

  function fmtDistance(m)  { return (m / 1609.344).toFixed(1) + ' mi'; }
  function fmtElevation(m) { return Math.round(m * 3.28084) + ' ft'; }
  function fmtTime(s) {
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? h + 'h ' + m + 'm' : m + 'm';
  }
  function fmtDateShort(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function fmtDateFull(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  function fmtPace(speedMs, type) {
    if (!speedMs) return '—';
    if (RIDE_TYPES[type]) return (speedMs * 2.23694).toFixed(1) + ' mph';
    var mpm = 1609.344 / (speedMs * 60);
    var m = Math.floor(mpm), s = Math.round((mpm - m) * 60);
    return m + ':' + (s < 10 ? '0' : '') + s + '/mi';
  }
  function paceLabel(type) { return RIDE_TYPES[type] ? 'Avg Speed' : 'Pace'; }
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  // ── Inject modal HTML into <body> ────────────────────────
  // (must be a direct child of body so position:fixed escapes page stacking contexts)
  var modalHTML = [
    '<div id="af-modal" style="display:none">',
    '  <div id="af-backdrop"></div>',
    '  <div id="af-panel">',
    '    <button id="af-close">&#10005;</button>',
    '    <div id="af-gif-wrap"><img id="af-gif" src="" alt=""></div>',
    '    <div id="af-title"></div>',
    '    <div id="af-meta">',
    '      <span id="af-type-badge"></span>',
    '      <span id="af-date"></span>',
    '    </div>',
    '    <div id="af-stats"></div>',
    '    <div id="af-elev-wrap" style="display:none">',
    '      <div class="af-section-title">Elevation Profile</div>',
    '      <canvas id="af-elev-canvas"></canvas>',
    '    </div>',
    '    <div id="af-hr-wrap" style="display:none">',
    '      <div class="af-section-title">Heart Rate</div>',
    '      <canvas id="af-hr-canvas"></canvas>',
    '    </div>',
    '    <div id="af-laps-wrap" style="display:none">',
    '      <div class="af-section-title">Laps</div>',
    '      <div id="af-laps-scroll">',
    '        <table id="af-laps-table">',
    '          <thead><tr>',
    '            <th>Lap</th><th>Distance</th><th>Pace / Speed</th><th>Avg HR</th>',
    '          </tr></thead>',
    '          <tbody id="af-laps-body"></tbody>',
    '        </table>',
    '      </div>',
    '    </div>',
    '  </div>',
    '</div>',
  ].join('');

  var modalEl = document.createElement('div');
  modalEl.innerHTML = modalHTML;
  document.body.appendChild(modalEl.firstElementChild);

  // ── Inject modal styles into <head> ──────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '#af-modal{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}',
    '#af-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(3px);cursor:pointer}',
    '#af-panel{position:relative;z-index:1;background:var(--t-detail-bg,#fff);border-radius:16px;padding:24px;width:100%;max-width:600px;max-height:88vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.4)}',
    '#af-close{position:absolute;top:14px;right:14px;background:var(--t-toggle-bg,#f0f2f5);border:none;width:32px;height:32px;border-radius:50%;font-size:1rem;cursor:pointer;color:var(--t-muted,#888);display:flex;align-items:center;justify-content:center;transition:background .15s}',
    '#af-close:hover{background:var(--t-toggle-hover,#e4e8ed)}',
    '#af-gif-wrap{border-radius:10px;overflow:hidden;margin-bottom:16px}',
    '#af-gif-wrap img{width:100%;display:block}',
    '#af-title{font-size:1.1rem;font-weight:700;color:var(--t-text,#222);margin-bottom:6px;padding-right:36px}',
    '#af-meta{display:flex;align-items:center;gap:10px;margin-bottom:16px}',
    '#af-type-badge{font-size:.72rem;background:var(--t-accent-bg,#e8f0f9);color:var(--t-accent,#003d7a);padding:2px 10px;border-radius:20px;font-weight:500}',
    '#af-date{font-size:.8rem;color:var(--t-muted,#888)}',
    '#af-stats{display:flex;gap:8px;flex-wrap:wrap;background:var(--t-card-bg,#f4f6f9);border-radius:10px;padding:14px 18px;margin-bottom:18px}',
    '.af-stat{text-align:center;flex:1 1 70px}',
    '.af-stat-val{font-size:1rem;font-weight:600;color:var(--t-accent,#003d7a);line-height:1.2}',
    '.af-stat-lbl{font-size:.65rem;text-transform:uppercase;letter-spacing:.5px;color:var(--t-muted-2,#999);margin-top:3px}',
    '.af-section-title{font-size:.7rem;text-transform:uppercase;letter-spacing:.8px;color:var(--t-muted-2,#999);margin-bottom:8px;font-weight:600}',
    '#af-elev-wrap,#af-hr-wrap{margin-bottom:18px}',
    '#af-elev-canvas,#af-hr-canvas{width:100%;height:80px;display:block;border-radius:6px}',
    '#af-laps-scroll{overflow-x:auto}',
    '#af-laps-table{width:100%;border-collapse:collapse;font-size:.82rem}',
    '#af-laps-table th{text-align:left;padding:6px 10px;font-size:.67rem;text-transform:uppercase;letter-spacing:.6px;color:var(--t-muted-2,#999);border-bottom:1px solid var(--t-border,#eee);font-weight:600}',
    '#af-laps-table td{padding:7px 10px;color:var(--t-text-2,#444);border-bottom:1px solid var(--t-border,#eee);font-size:.82rem}',
    '#af-laps-table tr:last-child td{border-bottom:none}',
  ].join('\n');
  document.head.appendChild(style);

  // ── DOM refs ─────────────────────────────────────────────
  var elModal    = document.getElementById('af-modal');
  var elBackdrop = document.getElementById('af-backdrop');
  var elClose    = document.getElementById('af-close');
  var elGif      = document.getElementById('af-gif');
  var elTitle    = document.getElementById('af-title');
  var elTypeBadge= document.getElementById('af-type-badge');
  var elDate     = document.getElementById('af-date');
  var elStats    = document.getElementById('af-stats');
  var elElevWrap = document.getElementById('af-elev-wrap');
  var elElevCanvas = document.getElementById('af-elev-canvas');
  var elHrWrap   = document.getElementById('af-hr-wrap');
  var elHrCanvas = document.getElementById('af-hr-canvas');
  var elLapsWrap = document.getElementById('af-laps-wrap');
  var elLapsBody = document.getElementById('af-laps-body');

  // feed DOM
  var elLoading   = document.getElementById('feed-loading');
  var elError     = document.getElementById('feed-error');
  var elEmpty     = document.getElementById('feed-empty');
  var elContent   = document.getElementById('feed-content');
  var elFilters   = document.getElementById('feed-filters');
  var elGrid      = document.getElementById('feed-grid');
  var elYearLabel = document.getElementById('feed-year-label');
  var elCount     = document.getElementById('feed-count');

  // ── State ────────────────────────────────────────────────
  var allActivities  = [];
  var activitiesById = {};
  var activeFilter   = 'All';

  // ── Chart drawing ────────────────────────────────────────
  function drawChart(canvas, data, accentHex, fillAlpha) {
    var W = canvas.parentElement.clientWidth || 500;
    var H = 80;
    canvas.width  = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    var minV = data.reduce(function(m,v){return Math.min(m,v);}, Infinity);
    var maxV = data.reduce(function(m,v){return Math.max(m,v);}, -Infinity);
    var range = maxV - minV || 1;
    var pad = 6;

    var pts = data.map(function(v, i) {
      return {
        x: (i / (data.length - 1)) * W,
        y: H - pad - ((v - minV) / range) * (H - pad * 2),
      };
    });

    // Parse hex color to rgba
    var r = parseInt(accentHex.slice(1,3),16);
    var g = parseInt(accentHex.slice(3,5),16);
    var b = parseInt(accentHex.slice(5,7),16);

    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba('+r+','+g+','+b+','+fillAlpha+')');
    grad.addColorStop(1, 'rgba('+r+','+g+','+b+',0)');

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[pts.length-1].x, H);
    ctx.lineTo(pts[0].x, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function accentColor() {
    return isDark() ? '#4A9EE8' : '#003d7a';
  }

  // ── Modal ────────────────────────────────────────────────
  function openModal(a) {
    elGif.src = cardSrc(a);
    elGif.alt = a.name;

    elTitle.textContent     = a.name;
    elTypeBadge.textContent = sportIcon(a.type) + ' ' + a.type;
    elDate.textContent      = fmtDateFull(a.start_date);

    // Stats row
    var speedMs = a.moving_time > 0 ? a.distance / a.moving_time : 0;
    var stats = [
      { val: fmtDistance(a.distance),    lbl: 'Distance' },
      { val: fmtTime(a.moving_time),     lbl: 'Time' },
      { val: fmtPace(speedMs, a.type),   lbl: paceLabel(a.type) },
    ];
    if (a.elevation > 10)
      stats.push({ val: fmtElevation(a.elevation), lbl: 'Elevation' });
    if (a.avg_hr)
      stats.push({ val: Math.round(a.avg_hr) + ' bpm', lbl: 'Avg HR' });
    if (a.max_hr)
      stats.push({ val: Math.round(a.max_hr) + ' bpm', lbl: 'Max HR' });

    elStats.innerHTML = stats.map(function(s) {
      return '<div class="af-stat">'
        + '<div class="af-stat-val">' + escHtml(String(s.val)) + '</div>'
        + '<div class="af-stat-lbl">' + escHtml(s.lbl) + '</div>'
        + '</div>';
    }).join('');

    // Elevation chart
    if (a.altitude && a.altitude.length > 2) {
      elElevWrap.style.display = '';
      setTimeout(function() {
        drawChart(elElevCanvas, a.altitude, accentColor(), isDark() ? 0.35 : 0.25);
      }, 40);
    } else {
      elElevWrap.style.display = 'none';
    }

    // Heart rate chart
    if (a.hr_stream && a.hr_stream.length > 2) {
      elHrWrap.style.display = '';
      setTimeout(function() {
        drawChart(elHrCanvas, a.hr_stream, isDark() ? '#e05a5a' : '#c0392b', isDark() ? 0.35 : 0.25);
      }, 40);
    } else {
      elHrWrap.style.display = 'none';
    }

    // Laps table
    var laps = a.laps;
    if (laps && laps.length > 1) {
      elLapsBody.innerHTML = laps.map(function(lap) {
        return '<tr>'
          + '<td>' + lap.lap_index + '</td>'
          + '<td>' + fmtDistance(lap.distance) + '</td>'
          + '<td>' + (lap.average_speed ? fmtPace(lap.average_speed, a.type) : '—') + '</td>'
          + '<td>' + (lap.average_heartrate ? Math.round(lap.average_heartrate) + ' bpm' : '—') + '</td>'
          + '</tr>';
      }).join('');
      elLapsWrap.style.display = '';
    } else {
      elLapsWrap.style.display = 'none';
    }

    elModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    elModal.style.display = 'none';
    document.body.style.overflow = '';
    elGif.src = '';
  }

  elClose.addEventListener('click', closeModal);
  elBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && elModal.style.display !== 'none') closeModal();
  });

  // ── Feed helpers ─────────────────────────────────────────
  function cardSrc(a) {
    if (isDark()  && a.card_dark)  return a.card_dark;
    if (!isDark() && a.card_light) return a.card_light;
    return a.card_dark || a.card_light || '';
  }

  function renderFilters() {
    var types  = allActivities.map(function(a){ return a.type; });
    var unique = types.filter(function(t,i){ return types.indexOf(t)===i; });
    elFilters.innerHTML = '';
    ['All'].concat(unique).forEach(function(type) {
      var btn = document.createElement('button');
      btn.className = 'feed-filter-btn' + (type === activeFilter ? ' active' : '');
      btn.textContent = type === 'All' ? 'All' : sportIcon(type) + ' ' + type;
      btn.addEventListener('click', function() {
        activeFilter = type; renderFilters(); renderGrid();
      });
      elFilters.appendChild(btn);
    });
  }

  function renderGrid() {
    var list = activeFilter === 'All'
      ? allActivities
      : allActivities.filter(function(a){ return a.type === activeFilter; });

    if (!list.length) {
      elGrid.innerHTML = '<p style="color:#888;grid-column:1/-1;padding:16px 0">No activities to show.</p>';
      return;
    }

    elGrid.innerHTML = list.map(function(a) {
      var elevHTML = a.elevation > 10
        ? '<div><div class="feed-stat-val">' + fmtElevation(a.elevation) + '</div>'
          + '<div class="feed-stat-lbl">Elev</div></div>' : '';
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

    elGrid.querySelectorAll('.feed-card[data-id]').forEach(function(card) {
      card.addEventListener('click', function() {
        var a = activitiesById[parseInt(card.getAttribute('data-id'), 10)];
        if (a) openModal(a);
      });
    });
  }

  window.addEventListener('themechange', function() {
    if (allActivities.length) renderGrid();
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
    if (!localStorage.getItem('theme') && allActivities.length) renderGrid();
  });

  // ── Fetch ─────────────────────────────────────────────────
  fetch(DATA_URL)
    .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(data) {
      elLoading.hidden = true;
      if (data.year) elYearLabel.textContent = data.year + ' Activities';
      allActivities = data.activities || [];
      activitiesById = {};
      allActivities.forEach(function(a) { activitiesById[a.id] = a; });
      if (!allActivities.length) { elEmpty.hidden = false; return; }
      elCount.textContent = allActivities.length + ' activities';
      elContent.hidden = false;
      renderFilters();
      renderGrid();
    })
    .catch(function() { elLoading.hidden = true; elError.hidden = false; });

}());
