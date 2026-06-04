# Plan — Namespace site-wide theme classes with `theme-` prefix

## Why

`nce_theme.css` emits utility classes whose names collide with Frappe Desk's
Bootstrap classes (`bg-primary`, `text-muted`, `bg-secondary`, `border`, …).
On Desk pages, Desk's CSS can win the cascade, so e.g. a panel header tagged
`bg-primary` renders Desk's near-black instead of the theme's Primary colour.

Shade classes (`bg-primary-100`) don't collide because Bootstrap has no
shade-suffixed names — which is why they already work.

## Decision

Namespace **every emitted class** with `theme-` so nothing collides with Desk,
Bootstrap, jQuery-UI, or vanilla Tailwind. `theme-` is product-neutral (not a
client brand like `nce-`, not a framework like `vue-`) and self-documenting.

- **Only class names change.** CSS variables stay `--nce-color-*`.
- **Editor fields unchanged.** Primary/Secondary/… pickers untouched.
- **SPA Tailwind untouched.** The `/themes/*` editor SPA uses its own bundled
  Tailwind and never loads on Desk — only the site-wide emitted CSS is renamed.

### Mapping (old → new)

| Old | New |
|-----|-----|
| `bg-{role}` | `theme-bg-{role}` |
| `text-{role}` / `border-{role}` / `text-{role}-fg` / `-fg-tonal` | `theme-…` |
| `bg-{role}-{shade}` (+ text/border/fg shade variants) | `theme-bg-{role}-{shade}` … |
| `bg-bg-page`, `bg-surface`, `bg-card`, `bg-row-alt`, `bg-header` | `theme-…` |
| `text-text-header`, `text-heading`, `text-muted`, `text-link` | `theme-…` |
| `border`, `border-input-border`, `border-input-focus` | `theme-border`, … |
| `rounded*`, `shadow`, `shadow-theme`, `duration-theme` | `theme-…` |
| `font-sans`, `font-heading`, `text-{xs…4xl}` | `theme-…` |
| `p-{size}`, `m-{size}`, `gap-{size}` | `theme-…` |
| `bg-themed` | `theme-bg-themed` |

Doubled names (`bg-bg-page`, `text-text-header`) kept 1:1 as
`theme-bg-bg-page` / `theme-text-text-header` for a pure mechanical rename;
simplifying them is an optional later cleanup.

## Steps

1. **Themes — `themes/utils/css_writer.py`**: prefix every selector in the
   `_emit_*` emitters with `theme-`. (This file.)
2. **Themes — `THEME_CLASS_CONTRACT.json`**: update every class `name`/`class`
   to the prefixed form.
3. **Themes — `docs/theme-system/`, `docs/theme-classes-reference.md`**:
   update examples (advisory; can follow).
4. **Republish** (user/deploy): `bench --site <site> execute
   themes.utils.css_writer.publish_theme --args "['<active theme>']"`
   (or Save/Apply in the editor) → regenerates `nce_theme.css` with `theme-`.
5. **nce_events**: replace only the theme-contract classes (not `ppv2-*`,
   not vanilla `flex`/`border-b`/`font-bold`) with the `theme-` form across
   `public/js/panel_page_v2/components/*.vue` + `App.vue`.
6. **nce_events**: `npm run build` in `public/js/panel_page_v2/`.
7. Deploy both together (classes only resolve once `nce_theme.css` is republished).

## Ordering constraint

nce_events components styled with `theme-*` show no theme colour until the
republished `nce_theme.css` ships. Deploy Themes republish + nce_events build
together.

## Out of scope

- Renaming CSS variables (`--nce-color-*` stay).
- The `/themes/*` editor SPA's own Tailwind build.
- Cleaning up doubled names (`theme-bg-bg-page`).
