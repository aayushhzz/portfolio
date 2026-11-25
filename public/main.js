(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  // Global cursor spotlight coordinates.
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (e) => {
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
    }, { passive: true });
  }

  // Scroll progress bar (JS fallback when CSS scroll-timeline is unsupported) + hero parallax + active nav pill.
  const progressBar = document.querySelector(".scroll-progress span");
  const nativeScrollTimeline = typeof CSS !== "undefined" && CSS.supports("animation-timeline", "scroll()");
  const mega = document.querySelector(".mega");
  const navLinks = [...document.querySelectorAll(".nav nav a[data-nav]")];
  const sections = navLinks.map((a) => document.getElementById(a.dataset.nav)).filter(Boolean);

  let scrollTick = false;
  const onScroll = () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (progressBar && !nativeScrollTimeline) {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        progressBar.style.transform = `scaleX(${Math.min(1, y / max)})`;
      }

      if (mega && !reduceMotion) {
        const clamped = Math.min(y, window.innerHeight);
        mega.style.transform = `translateY(${clamped * 0.28}px)`;
        mega.style.opacity = String(1 - clamped / window.innerHeight);
      }

      let current = "";
      for (const sec of sections) {
        if (y + window.innerHeight * 0.35 >= sec.offsetTop) current = sec.id;
      }
      navLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.nav === current));
      scrollTick = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Scroll reveals + metric count-ups.
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      if (en.target.classList.contains("metrics") && !reduceMotion) {
        en.target.querySelectorAll(".metric-val[data-count]").forEach((el) => {
          const target = Number(el.dataset.count);
          const suffix = el.dataset.suffix || "";
          const start = performance.now();
          const dur = 900;
          const step = (now) => {
            const p = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = `${Math.round(target * eased)}${suffix}`;
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      }
      revealObs.unobserve(en.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));

  // Monospace scramble-decode on hero corner tag.
  const scrambleEl = document.querySelector(".scramble");
  if (scrambleEl && !reduceMotion) {
    const final = scrambleEl.dataset.text || scrambleEl.textContent;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/[]&";
    let frame = 0;
    const run = () => {
      frame++;
      scrambleEl.textContent = final.split("").map((ch, idx) => {
        if (ch === " ") return " ";
        if (idx < frame / 1.4) return ch;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join("");
      if (frame < final.length * 1.5) requestAnimationFrame(run);
      else scrambleEl.textContent = final;
    };
    setTimeout(() => requestAnimationFrame(run), 400);
  }

  // Interactive 3D tilt + specular spotlight on featured cards and portrait.
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const visual = card.querySelector(".project-visual") || card;
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        const rx = (0.5 - y) * 6;
        const ry = (x - 0.5) * 6;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        visual.style.setProperty("--px", `${x * 100}%`);
        visual.style.setProperty("--py", `${y * 100}%`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  // Interactive hero network canvas (distributed nodes + cursor attraction).
  const canvas = document.getElementById("hero-net");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    const pointer = { x: -9999, y: -9999 };
    const nodes = [];
    const COUNT = 46;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      nodes.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
        r: 1.4 + Math.random() * 1.4
      });
    }

    canvas.parentElement.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    }, { passive: true });
    canvas.parentElement.addEventListener("pointerleave", () => { pointer.x = -9999; pointer.y = -9999; });

    let active = true;
    const heroObs = new IntersectionObserver(([en]) => { active = en.isIntersecting; }, { threshold: 0.05 });
    heroObs.observe(canvas.parentElement);

    const draw = () => {
      if (active) {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < COUNT; i++) {
          const a = nodes[i];
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;

          const dxp = pointer.x - a.x, dyp = pointer.y - a.y;
          const dp = Math.hypot(dxp, dyp);
          if (dp < 160 && dp > 1) {
            a.x += (dxp / dp) * 0.35;
            a.y += (dyp / dp) * 0.35;
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dp / 160) * 0.32})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
          }

          for (let j = i + 1; j < COUNT; j++) {
            const b = nodes[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < 135) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - dist / 135) * 0.12})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }

          ctx.fillStyle = dp < 160 ? "rgba(56, 189, 248, 0.85)" : "rgba(255, 255, 255, 0.35)";
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  // Project index filters + live search + '/' shortcut.
  const rows = [...document.querySelectorAll("#project-rows li")];
  const filters = [...document.querySelectorAll(".filter")];
  const searchInput = document.getElementById("project-search");
  const noResults = document.getElementById("no-results");
  let activeCat = "all";

  const applyFilter = () => {
    const q = (searchInput?.value || "").trim().toLowerCase();
    let visible = 0;
    rows.forEach((r) => {
      const catOk = activeCat === "all" || r.dataset.cat === activeCat;
      const textOk = !q || r.textContent.toLowerCase().includes(q);
      r.hidden = !(catOk && textOk);
      if (!r.hidden) visible++;
    });
    if (noResults) noResults.hidden = visible > 0;
  };

  filters.forEach((btn) => {
    const f = btn.dataset.filter;
    btn.querySelector("sup").textContent = f === "all" ? rows.length : rows.filter((r) => r.dataset.cat === f).length;
    btn.addEventListener("click", () => {
      activeCat = f;
      filters.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      applyFilter();
    });
  });

  searchInput?.addEventListener("input", applyFilter);
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      applyFilter();
      searchInput.blur();
    }
  });
  window.addEventListener("keydown", (e) => {
    const tag = document.activeElement?.tagName;
    if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      searchInput?.focus();
    }
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

  el("line", { x1: 0, y1: GROUND, x2: W, y2: GROUND, stroke: INK, "stroke-width": 2.5 }, svg);
  el("line", { x1: 0, y1: GROUND + 17, x2: W, y2: GROUND + 17, stroke: INK, "stroke-width": 1.6, "stroke-dasharray": "18 14" }, svg);

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
