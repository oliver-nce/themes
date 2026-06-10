# 08 — Extending the System

How to add a new role, expose a new shade, or add a new utility category.

> **Prefix reminder:** the downstream/Desk classes are emitted by the `_emit_*` functions
> in `themes/utils/css_writer.py`, and every emitted selector is namespaced with `theme-`
> (e.g. `.theme-bg-brand2`). `frontend/tailwind.config.js` only affects the editor SPA's
> own (unprefixed) build. When adding anything new, emit the `theme-`-prefixed selector in
> `css_writer.py` so downstream apps and Desk pages get it.

## Add a new color role

Example: add `brand2`.

1. **NCE Theme doctype** — add field `brand2_color` (Color), `brand2_color_gamma` (Int), `brand2_color_saturation` (Int).
2. **`themes/utils/css_writer.py`** — add `"brand2_color": "color-brand2"` to `COLOR_FIELDS`, `SHADE_SCALE_FIELDS`, and `FG_ROLES`.
3. **`frontend/src/utils/theme-injector.ts`** — add `"brand2_color"` to `FG_ROLES` and `ROLE_VAR`.
4. **`frontend/tailwind.config.js`** — add `"brand2"` to the `ROLES` array (the `buildColorMap()` helper picks it up).
5. **`THEME_CLASS_CONTRACT.json`** — add a `brand2` block under `color_roles` mirroring the other roles' structure. Set status to `shipping`.
6. **`docs/theme-classes-reference.md`** — add `brand2` row to the Color Roles table.
7. **`docs/theme-system/03-color-roles.md`** — describe what `brand2` means semantically.
8. **`frontend/src/pages/ThemeSettingsPage.vue`** — add UI for `brand2` (mirror the secondary section).
9. Publish: `bench --site <s> execute themes.utils.css_writer.publish_theme --args "['NCE Theme Default']"`.

## Expose a new shade stop as a class

The shade is already emitted as a CSS var; you're just adding the class alias.

1. **`themes/utils/css_writer.py`** — add the stop to `CURATED_SHADES` so the `_emit_role_shade_classes` loop emits `.theme-bg-{role}-{stop}` etc.
2. **`frontend/tailwind.config.js`** — add the stop to the SPA's `SHADES` array (editor SPA only).
3. **`THEME_CLASS_CONTRACT.json`** — update the `shade_scale.status` field on each role to reflect the new curated set.
4. **`docs/theme-system/04-shade-scale.md`** — update the curated list.
5. Republish: `bench --site <s> execute themes.utils.css_writer.publish_theme --args "['NCE Theme Default']"` (and rebuild the SPA: `cd frontend && npm run build`).

## Add a new non-color utility (e.g., `theme-text-emphasis`)

1. **Decide the CSS var**: e.g., `--nce-color-emphasis`.
2. **`themes/utils/css_writer.py`** — emit the var, and emit the class with the `theme-` prefix (e.g. `.theme-text-emphasis`). Decide whether it gets shades and a fg pair.
3. **`frontend/tailwind.config.js`** — map the equivalent class for the editor SPA.
4. **`THEME_CLASS_CONTRACT.json`** — add the entry under the right top-level key.
5. **`docs/theme-classes-reference.md`** — add the row.

## Border width tokens (shipped reference)

Three independent width tokens control line/border thickness site-wide:

| Token field | CSS var | Class | Default |
|---|---|---|---|
| `border_width_thin` | `--nce-border-width-thin` | `theme-border-thin` | `0.5px` |
| `border_width` | `--nce-border-width` | `theme-border` | `1px` |
| `border_width_strong` | `--nce-border-width-strong` | `theme-border-strong` | `2px` |

To add or change the allowed px values:

1. **`themes/utils/theme_tokens.py`** — update `BORDER_WIDTH_MAP` and ensure fields are in `MIGRATED_FIELDS`.
2. **`themes/utils/css_writer.py`** — `_emit_var_block()` reads the three fields; `_emit_semantic_classes()` emits the three classes.
3. **`scripts/export_theme_tokens.py`** — regenerate `frontend/src/domain/theme-tokens.ts`.
4. **`frontend/src/pages/ThemeSettingsPage.vue`** — Layout tab → Line Widths (`borderWidthOptions`).
5. **`THEME_CLASS_CONTRACT.json`** + **`docs/theme-classes-reference.md`** — keep in sync.

Directional borders (table rows, tab underlines) are **not** emitted as `theme-border-b` classes. Downstream apps use:

```css
border-bottom: var(--nce-border-width) solid var(--nce-color-border);
/* or --nce-border-width-strong for table headers */
```

## Add a third fg variant (e.g., `-fg-soft`)

The system currently ships `mono` and `tonal`. Adding `soft`:

1. **`themes/utils/theme_color_utils.py`** — add `pick_fg_soft(hex)` that returns a low-chroma neutral.
2. **`frontend/src/utils/color-shades.ts`** — mirror as `pickFgSoft(hex)`.
3. **`themes/utils/css_writer.py`** — emit `--nce-color-{role}-fg-soft` and per-shade variants in the existing loops.
4. **`frontend/src/utils/theme-injector.ts`** — mirror at runtime.
5. **`frontend/tailwind.config.js`** — add `${r}-fg-soft` to `buildColorMap()`.
6. Update `THEME_CLASS_CONTRACT.json` and the reference docs.

## Rules

- **Keep Python and TS in lock-step.** Every helper in `theme_color_utils.py` has a matching export in `color-shades.ts`. If they drift, the SPA preview and published CSS diverge.
- **Update the contract JSON in the same PR.** Otherwise downstream agents will write code against a class that doesn't exist (or skip one that does).
- **Tree-shaking is your friend.** Adding utility classes that nobody uses doesn't bloat the bundle — Tailwind drops them. Don't over-restrict.
- **Don't remove a class once shipped.** It's a public API. Mark deprecated in the JSON instead and remove only on major version.
