# Themes — Implementation Summary

## Architecture

Themes is a Frappe custom app that stores colour, typography, and layout tokens on **NCE Theme** records and compiles them into `nce_theme.css` — CSS custom properties (`--nce-*`) plus `theme-*` utility classes loaded site-wide on every page.

**Full spec:** [`docs/theme-system/01-architecture.md`](theme-system/01-architecture.md)

**Class catalog:** `THEME_CLASS_CONTRACT.json` (repo root)

## Output: two layers in `nce_theme.css`

| Layer | Source | Purpose |
|-------|--------|---------|
| `:root { --nce-* }` | `Site Theme Config.base_theme` | Site-wide default palette |
| `[data-nce-theme="<slug>"] { --nce-* }` | Each **NCE Theme** with `status = Active` | Per-panel palette override |
| `.theme-bg-primary`, `.theme-text-muted`, … | Emitted **once** from base payload | Stable class API; reads vars in scope |

Downstream apps (e.g. NCE Events) opt into a palette by setting `data-nce-theme="<slug>"` on a panel root. Omit the attribute → inherits `:root`. **Per-panel theming is shipped on the Themes side.**

## Data model

### NCE Theme

| Field | Role |
|-------|------|
| `name` | Primary key (from `theme_name` at creation; never changes) |
| `theme_name` | Display label (editable; drives `slug` on save) |
| `slug` | Used as `data-nce-theme` attribute value |
| `status` | `Active` = published as scoped block; `Inactive` = stored only |
| `theme_json` | Full token payload (JSON) |

New themes seed `theme_json` from the current **base theme** on insert.

### Site Theme Config (Single)

| Field | Role |
|-------|------|
| `base_theme` | Link → NCE Theme driving `:root` |
| `css_hash` | Cache-buster for `nce_theme.css` |

Legacy field `active_theme` is migrated to `base_theme` via patch `rename_base_theme_and_status`.

## Components

### Backend (Frappe)

| File | Role |
|------|------|
| `themes/api.py` | `save_theme`, `set_base_theme`, `save_as_base_theme`, `list_themes`, `get_theme_editor`, rename/delete |
| `themes/utils/css_writer.py` | `generate_site_css()`, `publish_theme()` — full rebuild from DB |
| `themes/utils/theme_color_utils.py` | OKLCH shades, foreground pairing |
| `themes/utils/site_theme_config_helpers.py` | Read/write `base_theme` (migration-safe) |
| `themes/utils/default_theme.py` | Factory-default token payload |
| `themes/hooks.py` | `app_include_css` → `nce_theme.css?v=<hash>` |
| `themes/www/themes.py` | Login gate (Guest → `/login`; `/themes/preview` stays public) |
| `themes/themes/doctype/nce_theme/` | Theme records |
| `themes/themes/doctype/site_theme_config/` | Site base + hash |

### Frontend (Vue 3 SPA)

| File | Role |
|------|------|
| `frontend/src/pages/ThemeSettingsPage.vue` | Main editor (Colours, Typography, Layout, System) |
| `frontend/src/pages/ThemePreviewPage.vue` | Live preview (`/themes/preview`) |
| `frontend/src/utils/color-shades.ts` | OKLCH shade generation (editor) |
| `frontend/tailwind.config.js` | Editor SPA internal build only — **not** the downstream Desk contract |

Vite emits hashed lazy-chunk filenames so deploys invalidate browser chunk cache.

## Data flow

```
Theme Editor (/themes/theme-settings)
    → api.save_theme() / save_as_base_theme()
    → NCE Theme.theme_json persisted
    → NCETheme.on_update() / publish trigger
    → css_writer.publish_theme()
        → :root (base_theme)
        → [data-nce-theme] per Active theme
        → theme-* utility classes (once)
    → themes/public/css/nce_theme.css + .hash
    → hooks.app_include_css (site-wide)
    → Downstream panels: data-nce-theme + theme-* classes
```

`publish_theme()` always rebuilds the **entire** file from current DB state — no partial publish.

## Available CSS variables (summary)

### Colours
`--nce-color-primary`, `--nce-color-secondary`, `--nce-color-accent`, `--nce-color-success`, `--nce-color-info`, `--nce-color-warning`, `--nce-color-danger`, `--nce-color-text`, `--nce-color-heading`, `--nce-color-muted`, `--nce-color-link`, `--nce-color-focus`, `--nce-color-bg`, `--nce-color-surface`, `--nce-color-border`, `--nce-color-row-alt`

Each role colour also has `-fg` / `-fg-tonal` and shade scales `50`–`950` (utility classes for all 11 stops).

### Typography
`--nce-font-family`, `--nce-font-heading`, `--nce-font-size`, `--nce-font-weight`, `--nce-line-height`

### Layout / motion
`--nce-border-radius`, `--nce-spacing-base`, `--nce-shadow`, `--nce-shadow-color`, `--nce-transition-speed`, `--nce-sidebar-width`, `--nce-container-max-width`

See `THEME_CLASS_CONTRACT.json` for the full class ↔ var mapping.

## Routes

| Route | Page |
|-------|------|
| `/themes` | Home |
| `/themes/theme-settings` | Theme editor (auth required) |
| `/themes/preview` | Standalone preview (public) |

## Installation

```bash
bench get-app <repo-url>
bench --site your-site install-app themes
bench --site your-site migrate
cd apps/themes/frontend && yarn install && yarn build
bench build --app themes
bench restart
```

Fresh-install checks: `docs/fresh-install-verification.md`

## Related docs

| Doc | Use when |
|-----|----------|
| `docs/theme-system/01-architecture.md` | Pipeline, scoped palettes, lifecycle |
| `docs/theme-system/07-using-in-vue.md` | Component authoring in downstream apps |
| `docs/themes-app-agent-handoff.md` | Agent session handoff / deploy / known issues |
| `themes/CODE_INDEX.json` | Locating code elements |
