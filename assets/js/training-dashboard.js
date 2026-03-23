/* Training dashboard — reads /assets/data/strava-activities.json */
(function () {
  'use strict';

  var DATA_URL = '/assets/data/strava-activities.json';
  var MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];


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

  // ── Period filtering ────────────────────────────────────────────────────────

  var PERIOD_LABELS = {
    week:  'This Week',
    month: '',   // set dynamically
    year:  '',   // set dynamically
    all:   'All Time'
  };

  function periodWindow(period) {
    var now  = new Date();
    var year = now.getFullYear();
    if (period === 'week') {
      var sun = new Date(now);
      sun.setDate(now.getDate() - now.getDay());
      sun.setHours(0, 0, 0, 0);
      return sun;
    }
    if (period === 'month') return new Date(year, now.getMonth(), 1);
    if (period === 'year')  return new Date(year, 0, 1);
    return null; // all time
  }

  function filterByPeriod(activities, period) {
    var start = periodWindow(period);
    if (!start) return activities;
    return activities.filter(function (a) {
      return new Date(a.start_date_local.slice(0, 10) + 'T12:00:00') >= start;
    });
  }

  function periodLabel(period) {
    var now = new Date();
    if (period === 'week')  return 'This Week';
    if (period === 'month') return MONTHS[now.getMonth()] + ' ' + now.getFullYear();
    if (period === 'year')  return String(now.getFullYear());
    return 'All Time';
  }

  function weeksInPeriod(activities, period) {
    var now   = new Date();
    var start = periodWindow(period);
    if (start) return Math.max(1, (now - start) / (7 * 86400 * 1000));
    // all time: span from oldest activity to now
    if (!activities.length) return 1;
    var oldest = activities.reduce(function (min, a) {
      return a.start_date_local < min ? a.start_date_local : min;
    }, activities[0].start_date_local);
    return Math.max(1, (now - new Date(oldest.slice(0, 10) + 'T12:00:00')) / (7 * 86400 * 1000));
  }

  // ── Stat cards ───────────────────────────────────────────────────────────────

  function renderStats(activities, period) {
    var subset    = filterByPeriod(activities, period);
    var totalDist = subset.reduce(function (s, a) { return s + (a.distance || 0); }, 0);
    var totalTime = subset.reduce(function (s, a) { return s + (a.moving_time || 0); }, 0);
    var count     = subset.length;
    var weeks     = weeksInPeriod(activities, period);

    setText('stats-period-label', periodLabel(period));
    setText('stat-distance',      fmtDistance(totalDist));
    setText('stat-activities',    count);
    setText('stat-time',          fmtDuration(totalTime));
    setText('stat-avg',           (count / weeks).toFixed(1) + ' / wk');
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
          cell.classList.add('hm-lvl-' + Math.min(acts.length, 4));
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

  // ── Activity type filter ────────────────────────────────────────────────────

  function makeCheckItem(id, labelStr, checked, type) {
    var div = document.createElement('div');
    div.className = 'filter-option';
    var cb  = document.createElement('input');
    cb.type = 'checkbox';
    cb.id   = id;
    cb.checked = checked;
    if (type) cb.dataset.type = type;
    var lbl = document.createElement('label');
    lbl.htmlFor    = id;
    lbl.textContent = labelStr;
    div.appendChild(cb);
    div.appendChild(lbl);
    return div;
  }

  function buildActivityFilter(allActs, onchange) {
    var types = [];
    allActs.forEach(function (a) {
      if (a.sport_type && types.indexOf(a.sport_type) === -1) types.push(a.sport_type);
    });
    types.sort();

    var filterEl = document.getElementById('activity-filter');
    var btn      = document.getElementById('activity-filter-btn');
    var dropdown = document.getElementById('activity-filter-dropdown');
    if (!btn || !dropdown) return;

    // Hide filter entirely if there's only one type
    if (types.length <= 1) {
      if (filterEl) filterEl.hidden = true;
      return;
    }

    // Build "All" + per-type checkboxes
    dropdown.appendChild(makeCheckItem('filter-all', 'All Activities', true, null));
    var hr = document.createElement('hr');
    hr.className = 'filter-divider';
    dropdown.appendChild(hr);
    types.forEach(function (t) {
      dropdown.appendChild(makeCheckItem('filter-type-' + t, t, true, t));
    });

    var checkedTypes = types.slice();

    function labelText() {
      if (checkedTypes.length === types.length) return 'All Activities \u25be';
      if (checkedTypes.length === 0)            return 'None \u25be';
      if (checkedTypes.length === 1)            return checkedTypes[0] + ' \u25be';
      return checkedTypes.length + ' types \u25be';
    }

    function syncAllCb() {
      var allCb = dropdown.querySelector('#filter-all');
      if (!allCb) return;
      allCb.checked       = checkedTypes.length === types.length;
      allCb.indeterminate = checkedTypes.length > 0 && checkedTypes.length < types.length;
    }

    function notify() {
      btn.textContent = labelText();
      onchange(checkedTypes.length === types.length ? null : checkedTypes.slice());
    }

    dropdown.querySelector('#filter-all').addEventListener('change', function (e) {
      checkedTypes = e.target.checked ? types.slice() : [];
      dropdown.querySelectorAll('input[data-type]').forEach(function (cb) {
        cb.checked = e.target.checked;
      });
      notify();
    });

    dropdown.querySelectorAll('input[data-type]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        if (cb.checked) {
          if (checkedTypes.indexOf(cb.dataset.type) === -1) checkedTypes.push(cb.dataset.type);
        } else {
          checkedTypes = checkedTypes.filter(function (t) { return t !== cb.dataset.type; });
        }
        syncAllCb();
        notify();
      });
    });

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.hidden = !dropdown.hidden;
    });
    dropdown.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click',  function ()  { dropdown.hidden = true; });
  }

  // ── Boot ────────────────────────────────────────────────────────────────────

  fetch(DATA_URL)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var allActivities = data.activities || [];
      var actMap        = buildMap(allActivities);
      var activePeriod  = 'year';
      var activeTypes   = null; // null = all types

      function getActive() {
        if (!activeTypes) return allActivities;
        return allActivities.filter(function (a) {
          return activeTypes.indexOf(a.sport_type) !== -1;
        });
      }

      renderStats(allActivities, activePeriod);
      renderHeatmap(actMap);
      renderLastUpdated(data.last_updated);

      buildActivityFilter(allActivities, function (types) {
        activeTypes = types;
        renderStats(getActive(), activePeriod);
      });

      // Stats period toggle
      document.querySelectorAll('.period-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          activePeriod = btn.dataset.period;
          document.querySelectorAll('.period-btn').forEach(function (b) {
            b.classList.toggle('period-btn--active', b === btn);
          });
          renderStats(getActive(), activePeriod);
        });
      });


    })
    .catch(function () {
      var err = document.getElementById('dashboard-error');
      if (err) err.hidden = false;
    });

})();
