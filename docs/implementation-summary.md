# Themes — Implementation Summary

## Architecture

Themes is a Frappe custom app providing site-wide CSS theming. It stores color, typography, and layout settings in a single DocType and compiles them into CSS custom properties (`--nce-*`) that load on every page.

## Components

### Backend (Frappe)
- **`Theme Settings`** DocType — single document holding all theme tokens
- **`themes/hooks.py`** — app metadata, CSS loading (`app_include_css`), SPA routing
- **`themes/api.py`** — whitelisted API: `regenerate_theme_css()`
- **`themes/init_theme.py`** — one-time initialisation script (run via `bench execute`)
- **`themes/www/themes.html`** — SPA entry point template
- **`themes/themes/doctype/theme_settings/theme_settings.py`** — CSS generation logic (`_generate_css()`, `_write_css_file()`)

### Frontend (Vue 3 SPA)
- **`ThemeSettingsPage.vue`** — main theme configuration UI (Colors, Typography, Layout, Advanced tabs)
- **`ThemePreviewPage.vue`** — live theme preview
- **`HomePage.vue`** — landing page
- **`useTheme.ts`** — loads Theme Settings and applies CSS vars
- **`useThemeDefaults.ts`** — default color/typography values
- **`color-shades.ts`** — OKLCH shade generation
- **`theme-injector.ts`** — CSS variable injection utility
- **Tailwind config** — maps Tailwind utilities to `--nce-*` CSS tokens

## Data Flow

1. Admin configures theme in Vue SPA at `/themes/theme-settings`
2. Settings saved to `Theme Settings` DocType via Frappe REST API
3. `ThemeSettings.on_update()` triggers CSS generation
4. CSS written to `themes/public/css/nce_theme.css`
5. CSS loaded site-wide via `app_include_css` in `hooks.py`
6. Downstream apps consume `--nce-*` variables via `var(--nce-*)`

## Available CSS Variables

### Colors
- `--nce-color-primary`, `--nce-color-secondary`, `--nce-color-accent`
- `--nce-color-success`, `--nce-color-info`, `--nce-color-warning`, `--nce-color-danger`
- `--nce-color-text`, `--nce-color-heading`, `--nce-color-muted`
- `--nce-color-link`, `--nce-color-focus`
- `--nce-color-bg`, `--nce-color-surface`, `--nce-color-border`, `--nce-color-row-alt`

### Shade Scales (50-950)
- `--nce-color-primary-50` through `--nce-color-primary-950`
- (Same for secondary, accent, success, info, warning, danger)

### Typography
- `--nce-font-family`, `--nce-font-heading`, `--nce-font-size`, `--nce-font-weight`, `--nce-line-height`

### Layout
- `--nce-border-radius`, `--nce-spacing-base`, `--nce-shadow`, `--nce-shadow-color`
- `--nce-transition-speed`, `--nce-sidebar-width`, `--nce-container-max-width`

## Routes

| Route | Page |
|-------|------|
| `/themes` | Home page |
| `/themes/theme-settings` | Theme configuration |
| `/themes/preview` | Theme preview (standalone) |

## Installation

```bash
bench get-app <repo-url>
bench --site your-site install-app themes
bench execute themes.init_theme.initialize_theme
```
