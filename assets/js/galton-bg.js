(function () {
  'use strict';

  var canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '-1',
    pointerEvents: 'none'
  });
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext('2d');

  // ── constants ────────────────────────────────────────────────────────────
  var ROWS      = 11;        // peg rows → 12 bins
  var N_BINS    = ROWS + 1;
  var PEG_R     = 3;         // peg dot radius (px)
  var BALL_R    = 4;         // ball radius (px)
  var GRAVITY   = 0.10;      // px per frame²
  var MAX_BIN   = 20;        // balls per bin before dump
  var FADE_RATE = 0.020;     // opacity lost per frame while dumping
  var LERP      = 0.22;      // horizontal lerp toward targetX each frame

  // Sporadic spawn: 1-3 balls every 200-650 ms
  var SPAWN_MIN   = 200;
  var SPAWN_MAX   = 650;
  var SPAWN_COUNT = 3;       // max balls per burst

  // Site theme (very subtle): primary #7a8288, Berkeley Blue #003d7a
  var PEG_ALPHA  = 0.18;
  var FALL_ALPHA = 0.30;
  var BIN_ALPHA  = 0.16;

  // ── state ────────────────────────────────────────────────────────────────
  var W, H, spacing, rowH, topY;
  var pegs    = [];
  var falling = [];  // {col, row, targetX, x, y, vy}
  var stacks  = [];  // stacks[i] = [{y, fade, dumping}]
  var nextSpawn = 0;

  // ── geometry ─────────────────────────────────────────────────────────────
  // Exact x of peg (r, c):  W/2 - r/2*spacing + c*spacing
  // After ROWS deflections, pegX(ROWS, col) == binX(col)  ← bins align automatically
  function pegX(r, c) { return W / 2 - (r / 2) * spacing + c * spacing; }
  function rowY(r)    { return topY + (r + 1) * rowH; }
  function floorY()   { return topY + (ROWS + 2) * rowH; }
  function binX(i)    { return pegX(ROWS, i); }

  // ── setup / resize ────────────────────────────────────────────────────────
  function setup() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;

    spacing = Math.min(W / (N_BINS + 1), H * 0.065);  // bigger than before
    rowH    = (H * 0.62) / (ROWS + 2);
    topY    = H * 0.14;                                // shifted down

    pegs = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c <= r; c++) {
        pegs.push({ x: pegX(r, c), y: rowY(r) });
      }
    }

    stacks  = [];
    for (var i = 0; i < N_BINS; i++) stacks.push([]);
    falling = [];
    nextSpawn = 0;
  }

  // ── spawn ─────────────────────────────────────────────────────────────────
  function spawnOne(yOffset) {
    // col=0, row=0 → heading for peg(0,0) at x = W/2
    falling.push({
      col:     0,
      row:     0,
      targetX: pegX(0, 0),   // = W/2
      x:       W / 2,
      y:       topY - BALL_R - (yOffset || 0),
      vy:      0.8
    });
  }

  function scheduleSpawn(now) {
    nextSpawn = now + SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
  }

  // ── land a ball in its bin ────────────────────────────────────────────────
  function land(b) {
    var idx = Math.max(0, Math.min(N_BINS - 1, b.col));
    var s = stacks[idx];
    var dumping = s.length > 0 && s[0].dumping;
    var ballY = floorY() - s.length * (BALL_R * 2.4 + 0.5);
    s.push({ y: ballY, fade: 1, dumping: dumping });
    if (!dumping && s.length >= MAX_BIN) {
      for (var i = 0; i < s.length; i++) s[i].dumping = true;
    }
  }

  // ── per-frame update ──────────────────────────────────────────────────────
  function update(now) {
    // Sporadic spawn burst
    if (now >= nextSpawn) {
      var count = 1 + Math.floor(Math.random() * SPAWN_COUNT);
      for (var s = 0; s < count; s++) spawnOne(s * (BALL_R * 3));
      scheduleSpawn(now);
    }

    for (var i = falling.length - 1; i >= 0; i--) {
      var b = falling[i];

      // Gravity + fall
      b.vy  = Math.min(b.vy + GRAVITY, 5.5);
      b.y  += b.vy;

      // Smooth lerp toward exact column x — guarantees peg alignment
      b.x += (b.targetX - b.x) * LERP;

      // Hit the next peg row?
      if (b.row < ROWS && b.y >= rowY(b.row) - PEG_R) {
        var dir = Math.random() < 0.5 ? 0 : 1;   // 0 = left lane, 1 = right lane
        b.col    += dir;
        b.row    += 1;
        b.vy      = 1.2;                          // slight bounce off peg
        b.y       = rowY(b.row - 1) + PEG_R + BALL_R;
        // Next target: next peg (or bin if this was the last row)
        b.targetX = pegX(b.row, b.col);           // works for both — bins = pegX(ROWS, col)
      }

      // Land once past all rows and reached floor
      if (b.row >= ROWS && b.y >= floorY()) {
        land(b);
        falling.splice(i, 1);
        continue;
      }

      if (b.y > H + 60) falling.splice(i, 1);
    }

    // Fade dumping bin balls
    for (var si = 0; si < stacks.length; si++) {
      var st = stacks[si];
      for (var bi = st.length - 1; bi >= 0; bi--) {
        if (st[bi].dumping) {
          st[bi].fade -= FADE_RATE;
          if (st[bi].fade <= 0) st.splice(bi, 1);
        }
      }
    }
  }

  // ── draw ──────────────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Pegs
    ctx.fillStyle = 'rgba(122,130,136,' + PEG_ALPHA + ')';
    for (var pi = 0; pi < pegs.length; pi++) {
      ctx.beginPath();
      ctx.arc(pegs[pi].x, pegs[pi].y, PEG_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stacked bin balls
    for (var si = 0; si < stacks.length; si++) {
      var st = stacks[si];
      var bx = binX(si);
      for (var bi = 0; bi < st.length; bi++) {
        ctx.fillStyle = 'rgba(0,61,122,' + (BIN_ALPHA * st[bi].fade).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(bx, st[bi].y, BALL_R, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Falling balls
    ctx.fillStyle = 'rgba(0,61,122,' + FALL_ALPHA + ')';
    for (var fi = 0; fi < falling.length; fi++) {
      ctx.beginPath();
      ctx.arc(falling[fi].x, falling[fi].y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── loop ──────────────────────────────────────────────────────────────────
  function loop(now) {
    update(now);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', setup);
  setup();
  requestAnimationFrame(loop);
})();
