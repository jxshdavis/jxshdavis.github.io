(function () {
  const root = document.getElementById("ridge-fan");
  if (!root) return;

  const N = 14;
  const SIGMA = 1.0;
  const BETA = 1.5;
  const REPS = 40;
  const XLIM = 3.3;
  const YLIM = 7.5;

  const $ = (sel) => root.querySelector(sel);
  const plotBox = $(".rf-plot");
  const spread = $(".rf-spread");
  const lambda = $(".rf-lambda");
  const playBtn = $(".rf-play");

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussians(seed, k) {
    const u = mulberry32(seed);
    const out = [];
    while (out.length < k) {
      const a = Math.max(u(), 1e-12);
      const b = u();
      const r = Math.sqrt(-2 * Math.log(a));
      out.push(r * Math.cos(2 * Math.PI * b));
      out.push(r * Math.sin(2 * Math.PI * b));
    }
    return out.slice(0, k);
  }

  const NOISE = Array.from({ length: REPS }, (_, r) => gaussians(1000 + r, N));
  const GRID = Array.from({ length: N }, (_, i) => -1 + (2 * i) / (N - 1));

  function draw() {
    const s = +spread.value;
    const lam = +lambda.value;

    $(".rf-spread-out").textContent = s.toFixed(2);
    $(".rf-lambda-out").textContent = lam.toFixed(1);

    const xs = GRID.map((v) => v * s * 3);
    const S = xs.reduce((acc, x) => acc + x * x, 0);

    const shrink = S / (S + lam);
    const sd = (shrink * SIGMA) / Math.sqrt(S);
    const bias = (-lam * BETA) / (S + lam);
    const rmse = Math.sqrt(sd * sd + bias * bias);

    $(".rf-S").textContent = S.toFixed(1);
    $(".rf-sd").textContent = sd.toFixed(2);
    $(".rf-bias").textContent = bias.toFixed(2);
    $(".rf-rmse").textContent = rmse.toFixed(2);

    const fan = [];
    for (let r = 0; r < REPS; r++) {
      let c = 0;
      for (let i = 0; i < N; i++) {
        c += xs[i] * (BETA * xs[i] + SIGMA * NOISE[r][i]);
      }
      const b = c / (S + lam);
      fan.push({ rep: r, x: -XLIM, y: -XLIM * b });
      fan.push({ rep: r, x: XLIM, y: XLIM * b });
    }

    const truth = [
      { x: -XLIM, y: -XLIM * BETA },
      { x: XLIM, y: XLIM * BETA }
    ];

    const pts = xs.map((x, i) => ({ x: x, y: BETA * x + SIGMA * NOISE[0][i] }));

    const fig = Plot.plot({
      width: 640,
      height: 340,
      marginLeft: 50,
      marginBottom: 45,
      style: { fontSize: "14px", background: "transparent" },
      x: { domain: [-XLIM, XLIM], label: "x", labelAnchor: "center" },
      y: { domain: [-YLIM, YLIM], label: "y", labelAnchor: "center" },
      marks: [
        Plot.ruleY([0], { stroke: "#d8d8d8" }),
        Plot.ruleX([0], { stroke: "#d8d8d8" }),
        Plot.line(fan, {
          x: "x",
          y: "y",
          z: "rep",
          stroke: "#3f7cb8",
          strokeWidth: 1,
          strokeOpacity: 0.28
        }),
        Plot.line(truth, {
          x: "x",
          y: "y",
          stroke: "#b87a1f",
          strokeWidth: 2,
          strokeDasharray: "6 4"
        }),
        Plot.dot(pts, { x: "x", y: "y", fill: "#4a4a4a", r: 3.5 }),
        Plot.frame({ stroke: "#e2e2e2" })
      ]
    });

    plotBox.replaceChildren(fig);
  }

  let raf = null;
  let dir = -1;

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    playBtn.textContent = "Sweep";
  }

  function step() {
    let v = +spread.value + dir * 0.006;
    if (v <= +spread.min) {
      v = +spread.min;
      dir = 1;
    }
    if (v >= +spread.max) {
      v = +spread.max;
      dir = -1;
    }
    spread.value = v;
    draw();
    raf = requestAnimationFrame(step);
  }

  playBtn.addEventListener("click", () => {
    if (raf) {
      stop();
    } else {
      playBtn.textContent = "Pause";
      raf = requestAnimationFrame(step);
    }
  });

  spread.addEventListener("input", () => {
    stop();
    draw();
  });
  lambda.addEventListener("input", draw);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    playBtn.style.display = "none";
  }

  draw();
})();
