# Handoff — ThemeSwatchPicker

**Date:** 2026-06-06  
**Companion doc (downstream consumer):** NCE Events `Docs/handoff-theme-swatch-picker.md`  
**Spec:** `docs/theme-swatch-picker.md`

---

## Widget status: shipped in Themes; consumed by NCE Events (Page Panel Colours tab)

Implementation is complete in this repo. **nce_events** wires eight per-panel chrome slots via Page Panel **Colours** tab (`page_panel.js`) and V2 runtime (`panelChromeClasses.js`). See `themes/CODE_INDEX.json` → `consumers.nce_events`.

### Shipped behavior

- **Output:** `theme-{bg|text|border}-{role}-{shade}` (147 combinations; curated shades only).
- **Desk:** `await frappe.ui.themeSwatchPicker.open({ frm, themeField, valueField })` — `themeField` is Link doc name; `resolveNceThemeSlug()` in `desk-adapter.ts` resolves to slug for `data-nce-theme`.
- **Blocked open:** empty Theme or Inactive/missing slug → `blocked-dialog.ts` user message, no modal.
- **While open:** theme pinned; full-screen backdrop blocks host form (no `watchThemeSlug`, no read_only lock).
- **Build:** `cd frontend && npm run build:widget` → `themes/public/dist/` (gitignored).

### Agent rule — Vue embed

`ThemeSwatchPicker.vue` does **not** use `frm.set_value`. Downstream apps (NCE Events Form Dialog) **must** pass:

```vue
:set-field="(fn, val) => { formData[fn] = val }"
:get-field="(fn) => formData[fn]"
```

See `docs/theme-swatch-picker.md` §8.1, `docs/theme-system/INDEX.md`, `themes/CODE_INDEX.json`, comment in `ThemeSwatchPicker.vue`.

---

## Source map

| File | Role |
|------|------|
| `frontend/src/widget/theme-swatch-picker-core.ts` | Modal DOM, open/close |
| `frontend/src/widget/adapters/desk-adapter.ts` | `frappe.ui.themeSwatchPicker`, slug lookup |
| `frontend/src/widget/blocked-dialog.ts` | User messages when open fails |
| `frontend/src/components/ThemeSwatchPicker.vue` | Headless Vue wrapper |
| `themes/hooks.py` | UMD + CSS on Desk |

---

## Do not regress

- Link → slug resolution on Desk (not raw Link value on `data-nce-theme`).
- Backdrop-only “no theme change while open” (no reactive slug watcher).
- Vue `setField` documentation for consumers.

---

## Next session prompt

```
Themes repo — ThemeSwatchPicker handoff.

Read docs/handoff-theme-swatch-picker.md and docs/theme-swatch-picker.md.

Widget shipped; NCE Events integration pending. Task: [widget change | build | consumer wiring in nce_events]

If touching Vue consumer: document setField → formData requirement.
After TS changes: npm run build:widget in frontend/
```
