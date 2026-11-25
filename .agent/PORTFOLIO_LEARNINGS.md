# Portfolio Maintenance & Design Learnings

Persistent memory for maintaining `/Users/aayush/Desktop/Projects/portfolio` (live at `https://portfolio.aayushacc5.workers.dev/`, repo `https://github.com/aayushhzz/portfolio`).

## Core Invariants
- **Zero-dependency static architecture**: Vanilla HTML/CSS/JS in `public/` served by Cloudflare Workers static assets (`wrangler.jsonc`). No bundlers or runtime frameworks.
- **Public-only, verified inventory**: Always cross-check `gh repo list aayushhzz --limit 50 --json name,isPrivate,isFork,url` against `public/index.html`. Never link private repos (`paper-harness`, `frame-order`, `ai-engineering-private`, etc.). Every metric and tech tag must come directly from the repo's README or code.
- **Cache busting**: Increment `?v=N` on `/styles.css?v=N` and `/main.js?v=N` in `public/index.html` whenever CSS or JS changes.
- **Anti-slop copy**: Lead with concrete engineering receipts (Recall@8, MRR, test counts, diff caps, latency/token deltas) instead of vague adjectives.
- **Visual verification**: Always run headless browser screenshots at both `1440×900` (desktop) and `390×844` (mobile) and inspect the rendered PNGs — DOM checks alone miss CSS positioning/SVG geometry bugs.

---

## 2026-11-26 — Inventory Sync, Compositor Motion, and 3 Visual Bug Fixes (v8)

### What Changed
- **Repo inventory**: Removed private repo `paper-harness` from `#project-rows`; added public repo `daily-roblox-ai` (`Apps & Tools`, `Python · Luau`). Total project count remains **34** (`18` AI, `3` Infra, `5` Apps, `5` Web3/OSS, `3` Hackathons), keeping the hero metric and index subtitle in sync.
- **Anti-slop copy with verified README receipts**:
  - Updated Featured Card 03 (`Personal AI OS`) with exact stack: Go control plane (Chi), SQLite WAL+FTS5 event journal, P0–P3 Ollama/MLX scheduler, Swift macOS bridge.
  - Upgraded row descriptions for `engram` (80% top-1 / 95% top-3 vs 55%/60% BM25, MRR 0.88), `harness2-lite` (16 synthetic tasks, 198 offline tests), `prerouter-lab` (0.647 held-out Recall@8 vs 0.462 zero-shot, 0.89 ms SSD reads), `jev-lite` (100% held-out cascade accuracy, 32.2% escalated), `econ-wrap` (6/6 passed, -10.9% tokens prune-only), `rlm-mini` (depth-2 `rlm()`/`llm()`, 3,432-char corpus prompt cap), `lean-agent` (300-char rolling buffer), `gpu-blur` (3 CUDA kernels + 8 C++17 checks), and `agentic-web-scraper` (verbatim-quote verification).
- **Performance & Accessibility**:
  - Upgraded `.scroll-progress span` from layout-thrashing `width` animation to compositor-only `transform: scaleX(...)` using native CSS `@supports (animation-timeline: scroll())` (`scroll(root block)`) with JS fallback when unsupported.
  - Replaced global `prefers-reduced-motion: reduce` `animation: none !important; transition-duration: 0.01ms !important` with targeted motion disabling so color/border hover transitions remain smooth and `html { scroll-behavior: auto; }` is respected.
  - Added `:focus-visible` outlines, `aria-pressed` state on filter buttons, `/` search badge, `Escape` key to clear/blur search, subtle node pulse on Card 03 SVG, and removed synchronous reflow (`void r.offsetWidth`) inside `applyFilter()`.
- **Cache busting**: Bumped `styles.css?v=7` → `?v=8` and `main.js?v=7` → `?v=8`.

### Visual Bugs Caught During Verification
1. **SVG cityscape diagonal slash lines (`public/main.js`)**: Cornice `<line>` used `y: top + 7` instead of `y1: top + 7`. Missing `y1` defaulted to `0`, drawing diagonal black lines from the top edge of the footer SVG down to building corners. Fixed to `y1: top + 7`.
2. **Featured Card 02 radar collision (`public/styles.css`)**: `.viz-radar` declared `position: relative;` after `.viz { position: absolute; right: 1.25rem; top: 1.25rem; }`, overriding absolute positioning and placing the radar over the `02` badge in the top-left. Removed `position: relative;`.
3. **Mobile hero portrait overlap (`public/styles.css`)**: `.portrait { margin-top: -2.2rem; }` looks editorial against the giant desktop `12rem` heading, but occluded the `ENGINEER` line at `390×844`. Added `.portrait { margin-top: 1.5rem; }` under `@media (max-width: 760px)`.

### Cloudflare / Wrangler & Tooling Notes
- Default `wrangler dev` port `8787` can collide with other local services; pass `--port 8799` when running local verification and kill the background daemon afterward.
- Playwright Chromium is available locally via `/Users/aayush/Desktop/Projects/personal-ai-os/workers/browser/node_modules/playwright` when Chrome DevTools remote debugging isn't open.

### Next Refinements to Consider
- Add a lightweight project count sync in JS or keep an automated check verifying `#project-rows li` matches the hero metric card and subtitle whenever repos are added.
- Consider adding a subtle copy-email button with inline feedback in the footer alongside the `mailto:` link.
- Periodically re-check `gh repo list` for newly published repos or newly merged OSS PRs.
