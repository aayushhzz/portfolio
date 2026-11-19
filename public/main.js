(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  // Scroll reveals.
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); revealObs.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));

  // Title drifts up and fades as you scroll past it.
  const mega = document.querySelector(".mega");
  if (mega && !reduceMotion) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, window.innerHeight);
        mega.style.transform = `translateY(${y * 0.3}px)`;
        mega.style.opacity = String(1 - y / window.innerHeight);
        ticking = false;
      });
    }, { passive: true });
  }

  // Project index filters, with a count on each tab.
  const rows = [...document.querySelectorAll("#project-rows li")];
  const filters = [...document.querySelectorAll(".filter")];
  filters.forEach((btn) => {
    const f = btn.dataset.filter;
    btn.querySelector("sup").textContent = f === "all" ? rows.length : rows.filter((r) => r.dataset.cat === f).length;
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.toggle("is-active", b === btn));
      rows.forEach((r) => {
        r.hidden = f !== "all" && r.dataset.cat !== f;
        if (!r.hidden) { r.style.animation = "none"; void r.offsetWidth; r.style.animation = ""; }
      });
    });
  });

  document.querySelector(".to-top")?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  // ---------- The footer city: an ink skyline that builds itself ----------
  const svg = document.querySelector(".city");
  const scape = document.querySelector(".cityscape");
  if (!svg || !scape) return;

  const NS = "http://www.w3.org/2000/svg";
  const INK = "#111", PAPER = "#f7f7f5", HAZE = "#e9e9e6";
  const W = 1200, GROUND = 350;

  // Seeded random so the skyline is the same on every visit.
  let seed = 20261119;
  const rand = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const between = (a, b) => a + rand() * (b - a);
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  };

  const windows = [];
  let order = 0;

  const building = (x, w, h, layer) => {
    const g = el("g", { class: "bldg" }, layer.g);
    g.style.setProperty("--d", `${order++ * 35}ms`);
    const top = GROUND - h;
    const stroke = layer.back ? "#c4c4c0" : INK;
    const fill = layer.back ? HAZE : PAPER;
    const sw = layer.back ? 1.4 : 2.2;

    // Roof details.
    const roof = rand();
    if (roof < 0.18) {
      el("polygon", { points: `${x},${top} ${x + w / 2},${top - w * 0.35} ${x + w},${top}`, fill, stroke, "stroke-width": sw, "stroke-linejoin": "round" }, g);
    } else if (roof < 0.38) {
      const sw2 = w * between(0.4, 0.7);
      el("rect", { x: x + (w - sw2) / 2, y: top - 22, width: sw2, height: 22, fill, stroke, "stroke-width": sw }, g);
      el("line", { x1: x + w / 2, y1: top - 22, x2: x + w / 2, y2: top - 58, stroke, "stroke-width": sw }, g);
    } else if (roof < 0.52 && !layer.back) {
      const tx = x + between(8, w - 30);
      el("line", { x1: tx + 4, y1: top, x2: tx + 4, y2: top - 12, stroke, "stroke-width": 1.6 }, g);
      el("line", { x1: tx + 18, y1: top, x2: tx + 18, y2: top - 12, stroke, "stroke-width": 1.6 }, g);
      el("rect", { x: tx, y: top - 34, width: 22, height: 22, rx: 3, fill, stroke, "stroke-width": 1.8 }, g);
      el("path", { d: `M${tx - 2} ${top - 34} L${tx + 11} ${top - 44} L${tx + 24} ${top - 34}`, fill, stroke, "stroke-width": 1.8, "stroke-linejoin": "round" }, g);
    }

    el("rect", { x, y: top, width: w, height: h, fill, stroke, "stroke-width": sw }, g);
    if (!layer.back && rand() > 0.5) el("line", { x1: x, y1: top + 7, x2: x + w, y2: top + 7, stroke, "stroke-width": 1.2 }, g);

    // Window grid.
    if (!layer.back) {
      const cols = Math.max(1, Math.floor((w - 12) / 15));
      const rows = Math.max(1, Math.floor((h - 34) / 20));
      const offX = x + (w - (cols * 15 - 6)) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const win = el("rect", {
            class: "win" + (rand() < 0.22 ? " lit" : ""),
            x: offX + c * 15, y: top + 16 + r * 20, width: 9, height: 11,
            fill: PAPER, stroke: INK, "stroke-width": 1.1,
          }, g);
          windows.push(win);
        }
      }
      // Door.
      if (w > 50 && rand() > 0.4) {
        const dx = x + w / 2 - 7;
        el("rect", { x: dx, y: GROUND - 20, width: 14, height: 20, fill: INK }, g);
      }
    }
  };

  const tree = (x, parent) => {
    const g = el("g", { class: "bldg" }, parent);
    g.style.setProperty("--d", `${order++ * 35}ms`);
    const r = between(9, 15);
    el("line", { x1: x, y1: GROUND, x2: x, y2: GROUND - 18, stroke: INK, "stroke-width": 2 }, g);
    el("circle", { cx: x, cy: GROUND - 18 - r * 0.8, r, fill: PAPER, stroke: INK, "stroke-width": 2 }, g);
  };

  const backLayer = { g: el("g", {}, svg), back: true };
  const frontLayer = { g: el("g", {}, svg), back: false };

  for (let x = -30; x < W + 30;) {
    const w = between(50, 120);
    building(x, w, between(150, 290), backLayer);
    x += w + between(-10, 6);
  }
  order = 0;
  for (let x = -10; x < W + 10;) {
    const w = between(48, 125);
    building(x, w, between(80, 230), frontLayer);
    x += w + between(4, 16);
    if (rand() < 0.35) { tree(x + 6, frontLayer.g); x += 22; }
  }

  // Street.
  el("line", { x1: 0, y1: GROUND, x2: W, y2: GROUND, stroke: INK, "stroke-width": 2.5 }, svg);
  el("line", { x1: 0, y1: GROUND + 17, x2: W, y2: GROUND + 17, stroke: INK, "stroke-width": 1.6, "stroke-dasharray": "18 14" }, svg);

  // Cars and birds, in ink.
  const car = (y, dur, delay, rev) => {
    const g = el("g", { class: "car" + (rev ? " rev" : "") }, svg);
    g.style.animationDuration = `${dur}s`;
    g.style.animationDelay = `${delay}s`;
    el("path", { d: `M0 ${y} L0 ${y - 10} L10 ${y - 10} L16 ${y - 19} L34 ${y - 19} L40 ${y - 10} L50 ${y - 10} L50 ${y} Z`, fill: PAPER, stroke: INK, "stroke-width": 2, "stroke-linejoin": "round" }, g);
    el("circle", { cx: 12, cy: y, r: 5, fill: INK }, g);
    el("circle", { cx: 39, cy: y, r: 5, fill: INK }, g);
  };
  car(GROUND + 12, 16, 0, false);
  car(GROUND + 28, 22, -9, true);
  car(GROUND + 12, 19, -12, false);

  for (let i = 0; i < 3; i++) {
    const g = el("g", { class: "bird" }, svg);
    g.style.animationDelay = `${-i * 4.5}s`;
    g.style.animationDuration = `${14 + i * 3}s`;
    const y = 40 + i * 22;
    el("path", { d: `M0 ${y} q6 -7 12 0 q6 -7 12 0`, fill: "none", stroke: INK, "stroke-width": 1.8, "stroke-linecap": "round" }, g);
  }

  // Build the city when the footer comes into view; then let the windows flicker.
  let flicker;
  const cityObs = new IntersectionObserver(([en]) => {
    if (en.isIntersecting) {
      scape.classList.add("built");
      if (!reduceMotion && !flicker) {
        flicker = setInterval(() => {
          windows[Math.floor(Math.random() * windows.length)].classList.toggle("lit");
        }, 260);
      }
    } else if (flicker) {
      clearInterval(flicker);
      flicker = null;
    }
  }, { threshold: 0.2 });
  cityObs.observe(scape);
})();
