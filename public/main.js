(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  // Shared mouse + scroll state for smooth multi-layer interactivity.
  const state = { mx: 0, my: 0, scrollY: window.scrollY, scrollVel: 0, lastY: window.scrollY };

  if (!reduceMotion && finePointer) {
    window.addEventListener("pointermove", (e) => {
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
      state.mx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      state.my = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    }, { passive: true });
  }

  // Scroll progress bar (JS fallback when CSS scroll-timeline is unsupported) + hero/footer parallax + active nav pill.
  const progressBar = document.querySelector(".scroll-progress span");
  const nativeScrollTimeline = typeof CSS !== "undefined" && CSS.supports("animation-timeline", "scroll()");
  const mega = document.querySelector(".mega");
  const portrait = document.querySelector(".portrait");
  const bigName = document.querySelector(".big-name");
  const navLinks = [...document.querySelectorAll(".nav nav a[data-nav]")];
  const sections = navLinks.map((a) => document.getElementById(a.dataset.nav)).filter(Boolean);

  let scrollTick = false;
  const onScroll = () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      state.scrollVel = Math.max(-60, Math.min(60, y - state.lastY));
      state.lastY = y;
      state.scrollY = y;

      if (progressBar && !nativeScrollTimeline) {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        progressBar.style.transform = `scaleX(${Math.min(1, y / max)})`;
      }

      if (mega && !reduceMotion) {
        const clamped = Math.min(y, window.innerHeight);
        const shiftX = finePointer ? -state.mx * 10 : 0;
        mega.style.transform = `translate3d(${shiftX}px, ${clamped * 0.28}px, 0)`;
        mega.style.opacity = String(Math.max(0, 1 - clamped / window.innerHeight));
      }

      if (portrait && !reduceMotion && !portrait.matches(":hover")) {
        const clamped = Math.min(y, window.innerHeight);
        portrait.style.transform = `translate3d(0, ${-clamped * 0.08}px, 0)`;
      }

      if (bigName && !reduceMotion) {
        const rect = bigName.parentElement.getBoundingClientRect();
        const p = Math.max(-1, Math.min(1, (rect.top - window.innerHeight * 0.5) / window.innerHeight));
        bigName.style.transform = `translate3d(-50%, ${p * 36}px, 0)`;
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

  // Subtle mouse-driven hero heading parallax while in viewport.
  if (!reduceMotion && finePointer && mega) {
    window.addEventListener("pointermove", () => {
      if (state.scrollY < window.innerHeight) {
        mega.style.transform = `translate3d(${-state.mx * 12}px, ${state.scrollY * 0.28 - state.my * 6}px, 0)`;
      }
    }, { passive: true });
  }

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

  // Interactive 3D tilt + specular spotlight on featured cards, portrait, and metric cards.
  if (!reduceMotion && finePointer) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const visual = card.querySelector(".project-visual") || card;
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        const rx = (0.5 - y) * 7;
        const ry = (x - 0.5) * 7;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        visual.style.setProperty("--px", `${x * 100}%`);
        visual.style.setProperty("--py", `${y * 100}%`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });

    document.querySelectorAll(".metric").forEach((m) => {
      m.addEventListener("pointermove", (e) => {
        const r = m.getBoundingClientRect();
        m.style.setProperty("--px", `${((e.clientX - r.left) / r.width) * 100}%`);
        m.style.setProperty("--py", `${((e.clientY - r.top) / r.height) * 100}%`);
      });
    });

    // Magnetic pointer attraction on primary buttons.
    document.querySelectorAll(".nav-cta, .btn, .to-top").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.22;
        btn.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }

  // Interactive hero network canvas (distributed nodes + mouse attraction + scroll depth + click ripples).
  const canvas = document.getElementById("hero-net");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    const pointer = { x: -9999, y: -9999 };
    const ripples = [];
    const nodes = [];
    const COUNT = 52;

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
        r: 1.4 + Math.random() * 1.5,
        accent: i % 5 === 0
      });
    }

    canvas.parentElement.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    }, { passive: true });
    canvas.parentElement.addEventListener("pointerdown", (e) => {
      const rect = canvas.getBoundingClientRect();
      ripples.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, r: 6, a: 0.55 });
    });
    canvas.parentElement.addEventListener("pointerleave", () => { pointer.x = -9999; pointer.y = -9999; });

    let active = true;
    const heroObs = new IntersectionObserver(([en]) => { active = en.isIntersecting; }, { threshold: 0.05 });
    heroObs.observe(canvas.parentElement);

    const draw = () => {
      if (active) {
        ctx.clearRect(0, 0, w, h);
        const scrollBoost = Math.min(2.2, 1 + Math.abs(state.scrollVel) * 0.04);
        state.scrollVel *= 0.92;

        // Expanding ripples
        for (let k = ripples.length - 1; k >= 0; k--) {
          const rp = ripples[k];
          rp.r += 3.5; rp.a *= 0.94;
          ctx.strokeStyle = `rgba(56, 189, 248, ${rp.a})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2); ctx.stroke();
          if (rp.a < 0.02) ripples.splice(k, 1);
        }

        for (let i = 0; i < COUNT; i++) {
          const a = nodes[i];
          a.x += a.vx * scrollBoost;
          a.y += a.vy * scrollBoost;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;

          const dxp = pointer.x - a.x, dyp = pointer.y - a.y;
          const dp = Math.hypot(dxp, dyp);
          if (dp < 180 && dp > 1) {
            a.x += (dxp / dp) * 0.4;
            a.y += (dyp / dp) * 0.4;
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dp / 180) * 0.36})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
          }

          for (let j = i + 1; j < COUNT; j++) {
            const b = nodes[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < 140) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - dist / 140) * 0.13})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }

          ctx.fillStyle = dp < 180
            ? (a.accent ? "rgba(52, 211, 153, 0.95)" : "rgba(56, 189, 248, 0.9)")
            : (a.accent ? "rgba(52, 211, 153, 0.45)" : "rgba(255, 255, 255, 0.35)");
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  // ---------- Interactive Canvas Graphs for All 4 Featured Project Banners ----------
  const cardCanvases = [...document.querySelectorAll("canvas.card-viz")];
  cardCanvases.forEach((cv) => {
    const kind = cv.dataset.viz;
    const host = cv.parentElement;
    const ctx = cv.getContext("2d");
    let w = 0, h = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    const ptr = { x: -999, y: -999, inside: false };
    let visible = true;
    let t = 0;

    const resize = () => {
      const r = host.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    host.addEventListener("pointermove", (e) => {
      const r = host.getBoundingClientRect();
      ptr.x = e.clientX - r.left;
      ptr.y = e.clientY - r.top;
      ptr.inside = true;
    }, { passive: true });
    host.addEventListener("pointerleave", () => { ptr.inside = false; ptr.x = -999; ptr.y = -999; });

    const obs = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.05 });
    obs.observe(host);

    const scrollProgress = () => {
      const r = host.getBoundingClientRect();
      return Math.max(0, Math.min(1, (window.innerHeight - r.top) / (window.innerHeight + r.height)));
    };

    // Deterministic pseudo-random helper for graph layout
    const prng = (s) => () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };

    // Precompute call-graph nodes for Hexagon CI
    const cgRand = prng(4242);
    const cgNodes = Array.from({ length: 24 }, (_, idx) => {
      const col = idx % 6;
      const row = Math.floor(idx / 6);
      const hit = idx === 0 || idx === 7 || idx === 14 || idx === 15 || idx === 22 || idx === 23;
      return {
        nx: 0.1 + col * 0.16 + (cgRand() - 0.5) * 0.05,
        ny: 0.22 + row * 0.18 + (cgRand() - 0.5) * 0.05,
        hit,
        end: idx === 22 || idx === 23
      };
    });
    const cgEdges = [
      [0, 7, true], [7, 14, true], [14, 15, true], [14, 22, true], [15, 23, true]
    ];
    for (let i = 0; i < cgNodes.length; i++) {
      for (let j = i + 1; j < cgNodes.length; j++) {
        if (cgNodes[i].hit && cgNodes[j].hit) continue;
        const d = Math.hypot(cgNodes[i].nx - cgNodes[j].nx, cgNodes[i].ny - cgNodes[j].ny);
        if (d < 0.24) cgEdges.push([i, j, false]);
      }
    }

    const stages = ["triage", "plan", "code", "test", "review", "pr", "sync"];
    const mcpLabels = ["logs", "metrics", "traces", "PRs", "RCAs", "k8s"];
    const dagNodes = [
      { id: "go-plane", nx: 0.5, ny: 0.44, r: 7, accent: true },
      { id: "sqlite-wal", nx: 0.22, ny: 0.32, r: 5 },
      { id: "ollama/mlx", nx: 0.78, ny: 0.30, r: 5.5, accent: true },
      { id: "p0–p3", nx: 0.76, ny: 0.62, r: 5 },
      { id: "swift-ui", nx: 0.24, ny: 0.64, r: 5 },
      { id: "cdp-tab", nx: 0.50, ny: 0.20, r: 4.5 }
    ];
    const dagEdges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [2, 3], [1, 4], [5, 2]];

    const renderFrame = () => {
      ctx.clearRect(0, 0, w, h);
      const sp = scrollProgress();

      if (kind === "pipeline") {
        // Card 01: Interactive 7-stage PR pipeline + live bars + traveling packets
        const padX = w * 0.09;
        const stepX = (w - padX * 2) / (stages.length - 1);
        const baseY = h * 0.46;
        let hovered = -1;
        if (ptr.inside) {
          let best = 999;
          stages.forEach((_, i) => {
            const d = Math.abs(ptr.x - (padX + i * stepX));
            if (d < best) { best = d; hovered = i; }
          });
        }
        const activeIdx = hovered >= 0 ? hovered : Math.floor(((sp * 6 + t * 0.7) % stages.length));

        // Base rail
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(padX, baseY); ctx.lineTo(w - padX, baseY); ctx.stroke();

        // Active glowing rail up to activeIdx
        const grad = ctx.createLinearGradient(padX, 0, w - padX, 0);
        grad.addColorStop(0, "rgba(56,189,248,0.85)");
        grad.addColorStop(1, "rgba(52,211,153,0.95)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(padX, baseY); ctx.lineTo(padX + activeIdx * stepX, baseY); ctx.stroke();

        // Traveling packets
        for (let p = 0; p < 3; p++) {
          const prog = ((t * (ptr.inside ? 0.55 : 0.28) + p * 0.33 + sp * 0.4) % 1);
          const px = padX + prog * (w - padX * 2);
          ctx.fillStyle = prog > 0.8 ? "#34d399" : "#38bdf8";
          ctx.beginPath(); ctx.arc(px, baseY, 3, 0, Math.PI * 2); ctx.fill();
        }

        // Stage nodes + throughput bars
        stages.forEach((label, i) => {
          const sx = padX + i * stepX;
          const distM = ptr.inside ? Math.hypot(ptr.x - sx, ptr.y - baseY) : 999;
          const boost = distM < 90 ? (1 - distM / 90) : 0;
          const barH = 14 + Math.sin(t * 2.2 + i * 0.9 + sp * 4) * 8 + boost * 20;
          const isLit = i <= activeIdx;

          ctx.fillStyle = i === stages.length - 1 ? "rgba(52,211,153,0.55)" : (isLit ? "rgba(56,189,248,0.45)" : "rgba(255,255,255,0.12)");
          ctx.fillRect(sx - 3, baseY - 14 - barH, 6, barH);

          ctx.fillStyle = i === activeIdx ? "#34d399" : (isLit ? "#38bdf8" : "#3f3f46");
          ctx.beginPath(); ctx.arc(sx, baseY, i === activeIdx ? 5.5 : 4, 0, Math.PI * 2); ctx.fill();

          ctx.font = "500 10px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillStyle = i === activeIdx ? "#f4f4f5" : "rgba(139,139,150,0.75)";
          ctx.fillText(label, sx, baseY + 18);
        });
      } else if (kind === "radar") {
        // Card 02: Interactive 6+ MCP Telemetry Radar
        const cx = w * 0.62, cy = h * 0.44;
        const maxR = Math.min(w, h) * 0.36;

        // Concentric rings
        for (let r = 1; r <= 3; r++) {
          ctx.strokeStyle = "rgba(56,189,248,0.14)";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(cx, cy, (maxR / 3) * r, 0, Math.PI * 2); ctx.stroke();
        }

        // Sweep angle follows mouse if inside, else smooth time + scroll
        const sweep = ptr.inside
          ? Math.atan2(ptr.y - cy, ptr.x - cx)
          : (t * 0.9 + sp * Math.PI * 1.5);

        // Radar wedge
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(sweep);
        const wGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, maxR);
        wGrad.addColorStop(0, "rgba(56,189,248,0.28)");
        wGrad.addColorStop(1, "rgba(56,189,248,0.0)");
        ctx.fillStyle = wGrad;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, maxR, -0.45, 0.08); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(56,189,248,0.75)";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(maxR, 0); ctx.stroke();
        ctx.restore();

        // 6 MCP orbiting source nodes
        mcpLabels.forEach((lbl, i) => {
          const baseAng = (i / mcpLabels.length) * Math.PI * 2 + sp * 1.1 + t * 0.12;
          const distR = maxR * (0.58 + (i % 2) * 0.28);
          let nx = cx + Math.cos(baseAng) * distR;
          let ny = cy + Math.sin(baseAng) * distR;
          if (ptr.inside) {
            const dm = Math.hypot(ptr.x - nx, ptr.y - ny);
            if (dm < 85 && dm > 1) {
              nx += ((ptr.x - nx) / dm) * (1 - dm / 85) * 10;
              ny += ((ptr.y - ny) / dm) * (1 - dm / 85) * 10;
            }
          }
          const angDiff = Math.abs(Math.atan2(Math.sin(baseAng - sweep), Math.cos(baseAng - sweep)));
          const ping = Math.max(0, 1 - angDiff / 0.8);

          // Citation link back to hub
          ctx.strokeStyle = `rgba(52,211,153,${0.12 + ping * 0.55})`;
          ctx.lineWidth = 1 + ping * 0.8;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke();

          ctx.fillStyle = ping > 0.35 ? "#34d399" : "#38bdf8";
          ctx.beginPath(); ctx.arc(nx, ny, 3 + ping * 2.5, 0, Math.PI * 2); ctx.fill();

          ctx.font = "500 9.5px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillStyle = ping > 0.35 ? "#f4f4f5" : "rgba(139,139,150,0.78)";
          ctx.fillText(lbl, nx, ny - 8);
        });

        // Hub node
        ctx.fillStyle = "#f4f4f5";
        ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, Math.PI * 2); ctx.fill();
      } else if (kind === "dag") {
        // Card 03: Personal AI OS multi-agent DAG + live message pulses
        const pts = dagNodes.map((n, i) => {
          const driftX = Math.cos(t * 0.8 + i * 1.3 + sp * 3) * 6;
          const driftY = Math.sin(t * 0.9 + i * 1.1 + sp * 2) * 5;
          let x = n.nx * w + driftX;
          let y = n.ny * h + driftY;
          if (ptr.inside) {
            const dx = ptr.x - x, dy = ptr.y - y;
            const d = Math.hypot(dx, dy);
            if (d < 130 && d > 1) {
              x += (dx / d) * (1 - d / 130) * 12;
              y += (dy / d) * (1 - d / 130) * 12;
            }
          }
          return { ...n, x, y };
        });

        dagEdges.forEach(([ai, bi], idx) => {
          const a = pts[ai], b = pts[bi];
          const midD = ptr.inside ? Math.hypot(ptr.x - (a.x + b.x) / 2, ptr.y - (a.y + b.y) / 2) : 999;
          const glow = midD < 100 ? (1 - midD / 100) : 0;

          ctx.strokeStyle = `rgba(56,189,248,${0.22 + glow * 0.5})`;
          ctx.lineWidth = 1.2 + glow;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

          // Traveling event pulse along edge
          const p = (t * (ptr.inside ? 0.65 : 0.35) + idx * 0.19 + sp * 0.5) % 1;
          const px = a.x + (b.x - a.x) * p;
          const py = a.y + (b.y - a.y) * p;
          ctx.fillStyle = idx % 2 === 0 ? "#38bdf8" : "#34d399";
          ctx.beginPath(); ctx.arc(px, py, 2.3 + glow, 0, Math.PI * 2); ctx.fill();
        });

        pts.forEach((n) => {
          const dm = ptr.inside ? Math.hypot(ptr.x - n.x, ptr.y - n.y) : 999;
          const near = dm < 90;
          ctx.fillStyle = n.accent || near ? "#38bdf8" : "#f4f4f5";
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r + (near ? 2 : 0), 0, Math.PI * 2); ctx.fill();
          ctx.font = "500 9.5px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillStyle = near ? "#f4f4f5" : "rgba(139,139,150,0.85)";
          ctx.fillText(n.id, n.x, n.y + n.r + 12);
        });
      } else if (kind === "callgraph") {
        // Card 04: Hexagon CI Go AST Call-Graph Pruner (scroll + mouse prunes to 2 affected)
        const pruneFactor = ptr.inside ? 1 : Math.min(1, Math.max(0.25, sp * 1.4));
        const pts = cgNodes.map((n, i) => {
          let x = n.nx * w + Math.sin(t * 0.6 + i) * 2;
          let y = n.ny * h + Math.cos(t * 0.5 + i) * 2;
          if (ptr.inside && n.hit) {
            const dx = ptr.x - x, dy = ptr.y - y;
            const d = Math.hypot(dx, dy);
            if (d < 120 && d > 1) { x += (dx / d) * 4; y += (dy / d) * 4; }
          }
          return { ...n, x, y };
        });

        cgEdges.forEach(([ai, bi, isHit], idx) => {
          const a = pts[ai], b = pts[bi];
          if (isHit) {
            ctx.strokeStyle = `rgba(52,211,153,${0.4 + pruneFactor * 0.55})`;
            ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

            const p = (t * 0.7 + idx * 0.27) % 1;
            ctx.fillStyle = "#34d399";
            ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p, 2.4, 0, Math.PI * 2); ctx.fill();
          } else {
            ctx.strokeStyle = `rgba(255,255,255,${0.14 * (1 - pruneFactor * 0.72)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        });

        pts.forEach((n) => {
          if (n.hit) {
            ctx.fillStyle = n.end ? "#34d399" : "#38bdf8";
            ctx.beginPath(); ctx.arc(n.x, n.y, n.end ? 5.2 : 3.8, 0, Math.PI * 2); ctx.fill();
            if (n.end) {
              ctx.strokeStyle = "rgba(52,211,153,0.45)";
              ctx.lineWidth = 1.5;
              ctx.beginPath(); ctx.arc(n.x, n.y, 8 + Math.sin(t * 3) * 2.5, 0, Math.PI * 2); ctx.stroke();
            }
          } else {
            ctx.fillStyle = `rgba(139,139,150,${0.45 * (1 - pruneFactor * 0.72)})`;
            ctx.beginPath(); ctx.arc(n.x, n.y, 2.3, 0, Math.PI * 2); ctx.fill();
          }
        });
      }
    };

    if (reduceMotion) {
      t = 1.2;
      renderFrame();
    } else {
      const loop = () => {
        if (visible) {
          t += 0.016;
          renderFrame();
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  });

  // Project index filters + live search + '/' shortcut + Escape clear.
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

  // ---------- The footer city: an ink skyline that builds itself + mouse parallax ----------
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

  if (!reduceMotion && finePointer) {
    scape.addEventListener("pointermove", (e) => {
      const r = scape.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      backLayer.g.style.transform = `translateX(${-nx * 14}px)`;
      frontLayer.g.style.transform = `translateX(${-nx * 5}px)`;
    }, { passive: true });
    scape.addEventListener("pointerleave", () => {
      backLayer.g.style.transform = "";
      frontLayer.g.style.transform = "";
    });
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
