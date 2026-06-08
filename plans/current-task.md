[PLAN OVERVIEW]
Total phases: 6
Summary: Path B code complete; B5 local verify PASS; staging publish + browser smoke still required.

Phase 1 — Refactor (B1.1) — DONE
Phase 2 — Role text/border (B1.2) — DONE
Phase 3 — Role shades (B2) — DONE
Phase 4 — Neutrals (B3) — DONE
Phase 5 — Shape/typography/spacing (B4) — DONE
Phase 6 — Publish smoke test (B5) — PARTIAL (see `plans/phase-b5-results.md`)

[CURRENT PHASE: 6 of 6] — B5 finish on staging
File(s): none (server ops)
Changes:
  1. SSH staging bench → `git pull` in `apps/themes` (must include commit `6bfcf03`).
  2. `bench --site manager.ncesoccer.com execute themes.init_theme.execute` (or `publish_theme` with active theme name).
  3. Confirm https://manager.ncesoccer.com/assets/themes/css/nce_theme.css Content-Length ~30 KB+ and grep for `.bg-surface`, `.p-md`.
  4. DevTools class smoke tests; update `plans/phase-b5-results.md` decision line to PASS.
Design context: Local file at `themes/public/css/nce_theme.css` (32 KB) is valid reference output only until server publish.
Frappe notes: `themes.init_theme.execute` republishes active theme and clears cache.
