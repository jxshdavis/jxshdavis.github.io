/* Training dashboard — reads /assets/data/strava-activities.json */
(function () {
  'use strict';

  var DATA_URL = '/assets/data/strava-activities.json';
  var MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Berkeley Blue heat scale: 0 → no activity, 4+ → full blue
  var HEAT = ['#ebedf0', '#c0d4e8', '#80aac8', '#3373a6', '#003d7a'];

  // ── Formatting helpers ──────────────────────────────────────────────────────

  function pad(n) { return String(n).padStart(2, '0'); }

  function toDateStr(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function fmtDistance(meters) {
    return (meters / 1609.344).toFixed(1) + ' mi';
  }

  function fmtDuration(secs) {
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    var s = secs % 60;
    if (h > 0) return h + 'h ' + pad(m) + 'm';
    return m + ':' + pad(s);
  }

  function fmtPace(meters, secs) {
    var miles = meters / 1609.344;
    if (!miles) return '—';
    var spm = secs / miles;
    return Math.floor(spm / 60) + ':' + pad(Math.round(spm % 60)) + '/mi';
  }

  function heatColor(n) {
    return HEAT[Math.min(n, HEAT.length - 1)];
  }

  // ── Build date → activity[] map ─────────────────────────────────────────────

  function buildMap(activities) {
    var map = {};
    activities.forEach(function (a) {
      var date = a.start_date_local.slice(0, 10);
      if (!map[date]) map[date] = [];
      map[date].push(a);
    });
    return map;
  }

  // ── YTD stat cards ──────────────────────────────────────────────────────────

  function renderStats(activities) {
    var year  = new Date().getFullYear();
    var now   = new Date();
    var jan1  = new Date(year, 0, 1);

    var ytd = activities.filter(function (a) {
      return a.start_date_local.slice(0, 4) === String(year);
    });

    var totalDist = ytd.reduce(function (s, a) { return s + (a.distance || 0); }, 0);
    var totalTime = ytd.reduce(function (s, a) { return s + (a.moving_time || 0); }, 0);
    var count     = ytd.length;
    var weeks     = Math.max(1, (now - jan1) / (7 * 86400 * 1000));

    setText('stat-distance',  fmtDistance(totalDist));
    setText('stat-activities', count);
    setText('stat-time',      fmtDuration(totalTime));
    setText('stat-avg',       (count / weeks).toFixed(1) + ' / wk');
  }

  // ── Activity heatmap ────────────────────────────────────────────────────────

  function renderHeatmap(actMap) {
    var now  = new Date();
    var year = now.getFullYear();

    // Sunday on or before Jan 1
    var jan1  = new Date(year, 0, 1);
    var start = new Date(jan1);
    start.setDate(start.getDate() - start.getDay());

    // Collect all weeks up through Dec 31
    var weeks = [];
    var cur   = new Date(start);
    var dec31 = new Date(year, 11, 31);
    while (cur <= dec31) {
      var week = [];
      for (var d = 0; d < 7; d++) {
        week.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }

    // Find which week index each month first appears in
    var monthWeek = {};
    weeks.forEach(function (week, wi) {
      week.forEach(function (day) {
        var mo = day.getMonth();
        if (day.getFullYear() === year && day.getDate() === 1 && !(mo in monthWeek)) {
          monthWeek[mo] = wi;
        }
      });
    });

    // Render month label row
    var monthRow = document.getElementById('heatmap-months');
    if (!monthRow) return;
    monthRow.innerHTML = '';
    for (var wi = 0; wi < weeks.length; wi++) {
      var span = document.createElement('span');
      var mo = findKey(monthWeek, wi);
      if (mo !== null) span.textContent = MONTHS[mo];
      monthRow.appendChild(span);
    }

    // Render grid: one .hm-week column per week
    var grid = document.getElementById('heatmap-grid');
    if (!grid) return;
    grid.innerHTML = '';

    weeks.forEach(function (week) {
      var col = document.createElement('div');
      col.className = 'hm-week';
      week.forEach(function (day) {
        var cell = document.createElement('div');
        cell.className = 'hm-cell';
        var inYear = day.getFullYear() === year;
        var future = day > now;
        if (!inYear || future) {
          cell.classList.add('hm-empty');
        } else {
          var ds   = toDateStr(day);
          var acts = actMap[ds] || [];
          cell.style.background = heatColor(acts.length);
          cell.dataset.date = ds;
          if (acts.length) {
            cell.classList.add('hm-has-data');
            cell.title = ds + ' · ' + acts.length + ' workout' + (acts.length > 1 ? 's' : '');
          } else {
            cell.title = ds;
          }
        }
        col.appendChild(cell);
      });
      grid.appendChild(col);
    });

    // Click handler
    grid.addEventListener('click', function (e) {
      var cell = e.target.closest ? e.target.closest('.hm-has-data') : null;
      if (!cell || !cell.classList.contains('hm-has-data')) {
        hideDetail();
        return;
      }
      grid.querySelectorAll('.hm-selected').forEach(function (c) {
        c.classList.remove('hm-selected');
      });
      cell.classList.add('hm-selected');
      showDetail(cell.dataset.date, actMap[cell.dataset.date] || []);
    });
  }

  // ── Detail panel ────────────────────────────────────────────────────────────

  var PACE_TYPES = ['Run', 'TrailRun', 'VirtualRun', 'Walk', 'Hike'];

  function showDetail(dateStr, activities) {
    var panel  = document.getElementById('detail-panel');
    var dateEl = document.getElementById('detail-date');
    var listEl = document.getElementById('detail-list');
    if (!panel) return;

    // Parse at noon to avoid any DST/timezone edge cases flipping the day
    var d = new Date(dateStr + 'T12:00:00');
    dateEl.textContent = d.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    listEl.innerHTML = '';
    activities.forEach(function (a) {
      var showPace = PACE_TYPES.indexOf(a.sport_type) !== -1 && a.distance && a.moving_time;
      var card = document.createElement('div');
      card.className = 'detail-card';
      card.innerHTML =
        '<div class="detail-card-header">' +
          '<span class="detail-card-name">' + escHtml(a.name) + '</span>' +
          '<span class="detail-card-type">' + escHtml(a.sport_type) + '</span>' +
        '</div>' +
        '<div class="detail-card-stats">' +
          dstat(fmtDistance(a.distance),          'Distance') +
          dstat(fmtDuration(a.moving_time),        'Duration') +
          (showPace ? dstat(fmtPace(a.distance, a.moving_time), 'Pace') : '') +
          (a.average_heartrate ? dstat(Math.round(a.average_heartrate) + ' bpm', 'Avg HR') : '') +
        '</div>';
      listEl.appendChild(card);
    });

    panel.hidden = false;
    // Scroll the panel into view without jumping above the fold
    setTimeout(function () {
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }

  function hideDetail() {
    var panel = document.getElementById('detail-panel');
    if (panel) panel.hidden = true;
    var grid = document.getElementById('heatmap-grid');
    if (grid) {
      grid.querySelectorAll('.hm-selected').forEach(function (c) {
        c.classList.remove('hm-selected');
      });
    }
  }

  // ── Misc helpers ────────────────────────────────────────────────────────────

  function dstat(val, lbl) {
    return '<div class="dstat">' +
      '<div class="dstat-val">' + val + '</div>' +
      '<div class="dstat-lbl">' + lbl + '</div>' +
    '</div>';
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function findKey(obj, val) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      if (obj[keys[i]] === val) return Number(keys[i]);
    }
    return null;
  }

  function renderLastUpdated(ts) {
    if (!ts) return;
    var d = new Date(ts);
    setText('last-updated', 'Updated ' + d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }));
  }

  // ── Boot ────────────────────────────────────────────────────────────────────

  fetch(DATA_URL)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var activities = data.activities || [];
      var actMap     = buildMap(activities);
      renderStats(activities);
      renderHeatmap(actMap);
      renderLastUpdated(data.last_updated);
    })
    .catch(function () {
      var err = document.getElementById('dashboard-error');
      if (err) err.hidden = false;
    });

})();
