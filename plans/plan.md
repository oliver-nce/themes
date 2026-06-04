# Path B — Ship full theme contract as site-wide CSS rules

### Goal

Extend `themes/utils/css_writer.py::generate_css()` so published `nce_theme.css` ships every theme-aware class in `THEME_CLASS_CONTRACT.json` as bare CSS rules referencing existing `--nce-*` variables. Downstream Frappe Vue apps can use contract classes without their own Tailwind build.

### Phases

Phase 1 — Refactor (B1.1)
  Files: `themes/utils/css_writer.py`
  What: Extract `_emit_root_block`, `_emit_role_bg_classes`, `_emit_bg_themed`; zero output diff.
  Key decisions: Module-level helpers; thin `generate_css` orchestrator.
  Depends on: none

Phase 2 — Role text/border (B1.2)
  Files: `themes/utils/css_writer.py`
  What: Add `_emit_role_text_border_classes` (+28 rules).
  Depends on: 1

Phase 3 — Role shades (B2)
  Files: `themes/utils/css_writer.py`
  What: Add `_emit_role_shade_classes` (+245 rules).
  Depends on: 2

Phase 4 — Neutrals (B3)
  Files: `themes/utils/css_writer.py`
  What: Add `_emit_neutral_classes` (~12 rules).
  Depends on: 3

Phase 5 — Shape/typography/spacing (B4)
  Files: `themes/utils/css_writer.py`
  What: Add `_emit_shape_classes`, `_emit_typography_classes`, `_emit_spacing_classes` (~33 rules).
  Depends on: 4

Phase 6 — Publish smoke test (B5)
  Files: none (manual); optional `plans/phase-b5-results.md`
  What: `publish_theme` on server; browser verification.
  Depends on: 5

### Design Decisions

- Single file: `css_writer.py` only; no new `:root` vars.
- Bare rules, no `@layer`; no state variants (`hover:`, `focus:`).
- Orchestrator order: root → role-bg → text-border → shades → neutrals → shape → typo → spacing → bg-themed.

### Risks / Open Questions

- `ring-focus` deferred (needs `:focus-visible` / box-shadow; not in Path B).
- `.border` may interact with vanilla Tailwind in apps that ship both (documented as benign).
- Published `nce_theme.css` on disk updates only after `publish_theme` (B5).
