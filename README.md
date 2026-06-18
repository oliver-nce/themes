# Themes

Frappe v15/v16 custom app for site-wide theming.

> ⚠️ **Experimental app — use at your own risk.** This app is actively evolving. APIs, token names, and behaviour may change between versions. Feedback welcome.

---

## What it does

The app has two independent theming functions:

**1. Frappe UI / style settings** — A visual theme editor for your Vue/Frappe apps. You configure colours, typography, spacing, and shadows. The app generates a CSS file (`nce_theme.css`) that loads on every page of the Frappe installation — Desk, web pages, and SPAs — exposing a set of CSS custom properties (`--nce-*`) and utility classes (`theme-*`) that downstream Vue apps consume.

**2. Desk styling** — A separate editor that overrides Frappe Desk's own CSS variables (e.g. `--primary-color`, `--border-color`, `--font-stack`), letting you restyle the Desk chrome — sidebar, header, buttons, and controls — without touching the Frappe source.

---

## How it works

### The publish pipeline

```
[1] Theme Editor  (/themes/theme-settings)
    User picks colours, fonts, spacing, shadows.
    Saved to NCE Theme.theme_json (one record per theme).
          ↓
[2] api.py → save_theme()
    Persists theme_json, triggers CSS regeneration.
          ↓
[3] css_writer.py → publish_theme()
    Reads every Active NCE Theme from the DB.
    Builds nce_theme.css with three layers:
      :root { --nce-* }                         ← Default theme (site-wide fallback)
      .theme-bg-primary, .theme-text-muted, …   ← Utility classes (emitted once)
      [data-nce-theme="ocean"] { --nce-* }      ← One block per Active theme
    Writes themes/public/css/nce_theme.css
          ↓
[4] hooks.py → app_include_css
    nce_theme.css loaded on every Frappe page.
          ↓
[5] Your Vue components use theme- classes or --nce-* vars.
```

### How colour scales are mapped

Each brand colour role (primary, secondary, accent, success, info, warning, danger, neutral) is stored as a single base hex value in `theme_json`. When the theme is published, the app generates an 11-stop shade scale for each role using the **OKLCH colour space** — the same perceptual model used by Tailwind v3's colour palette.

The shade stops follow the standard Tailwind numbering:

```
50 · 100 · 200 · 300 · 400 · 500 · 600 · 700 · 800 · 900 · 950
```

The base colour is pinned at stop **600**. Lighter stops (50–500) are derived by increasing OKLCH lightness toward white while preserving hue and chroma. Darker stops (700–950) decrease lightness toward near-black. Chroma is scaled back at the extremes to keep every stop inside the sRGB gamut.

Each stop is emitted as a CSS custom property and a corresponding Tailwind-style utility class:

```css
/* CSS variable */
--nce-color-primary-300: #93C5FD;

/* Utility classes (theme- prefix) */
.theme-bg-primary-300  { background-color: var(--nce-color-primary-300); }
.theme-text-primary-300 { color: var(--nce-color-primary-300); }
.theme-border-primary-300 { border-color: var(--nce-color-primary-300); }
```

The full stop range (50–950) is available as both CSS variables and `theme-` utility classes for all eight colour roles.

For primary and secondary roles, every shade stop also gets a paired foreground token computed via OKLCH contrast — `--nce-color-primary-300-fg` (mono black/white) and `--nce-color-primary-300-fg-tonal` (a hue-matched tonal contrast colour).

The neutral role uses a separate **warmth** control (−100 cool → +100 warm) rather than a base hex, generating a greyscale ramp with a subtle warm or cool tint.

### Two themes, two concepts

- **Base Theme** — A known-good theme shipped in the repo (`themes/data/base_theme.json`). It is a seed used on fresh installs and the target for "Restore to Base Theme". It is never rendered directly by client apps.
- **Default Theme** — The live DB theme that drives the `:root` block — the site-wide fallback every page uses when no explicit theme is assigned.

---

## CSS variables reference

These are available on every page once a theme has been saved:

```css
/* Semantic colours */
--nce-color-primary
--nce-color-secondary
--nce-color-accent
--nce-color-success
--nce-color-info
--nce-color-warning
--nce-color-danger
--nce-color-neutral
--nce-color-text
--nce-color-heading
--nce-color-muted
--nce-color-link
--nce-color-focus
--nce-color-bg
--nce-color-surface
--nce-color-border
--nce-color-row-alt

/* Shade scales 50–950 for each brand role */
--nce-color-primary-50 … --nce-color-primary-950
--nce-color-secondary-50 … --nce-color-secondary-950
/* …accent, success, info, warning, danger, neutral */

/* Typography */
--nce-font-family
--nce-font-heading
--nce-font-size
--nce-font-weight
--nce-line-height

/* Layout */
--nce-border-radius
--nce-border-width-thin
--nce-border-width
--nce-border-width-strong
--nce-spacing-base
--nce-shadow
--nce-shadow-color
--nce-transition-speed
--nce-sidebar-width
--nce-container-max-width
```

Always include a fallback: `var(--nce-color-primary, #126bc4)` — the token is undefined on a fresh install until a theme has been saved.

> **Note on the `--nce-` prefix.** `nce` is the internal namespace used by this specific installation. It is a fixed prefix baked into the app — all theme tokens and the generated `nce_theme.css` use it. When building your own Vue components, you consume the `--nce-*` variables as-is, but your own internal component variables should use your own prefix (e.g. `--my-app-*`) to keep them clearly distinct.

---

## Using the theme in Vue components

**The default theme applies site-wide.** Any Vue app that does not hardcode its own CSS classes will inherit the theme automatically — you just need to use the right class names.

### Mixing theme classes with an app's own CSS scheme

An app may have its own broader CSS scheme — covering component structure, custom states, app-specific layout, and other settings that are outside the scope of Themes. Not every class in that scheme has a `theme-` equivalent, and that is fine. The `theme-` classes do not need to replace the entire scheme.

The approach is to edit the existing scheme directly — replacing hardcoded colour, border, and spacing classes with their `theme-` equivalents in place. Everything else in the scheme stays exactly as it was.

```html
<!-- An element using the app's own scheme (hardcoded colours) -->
<div class="ppv2-card ppv2-card--featured bg-blue-600 rounded-lg p-4 text-white text-sm">

<!-- Same element with theme- classes applied selectively for the colour/shape/spacing tokens.
     The app's own structural classes (ppv2-card, ppv2-card--featured) are untouched. -->
<div class="ppv2-card ppv2-card--featured theme-bg-primary theme-rounded theme-p-md theme-text-primary-fg theme-text-sm">
```

`ppv2-card` and `ppv2-card--featured` remain — they are the app's own structural and state classes and are not the concern of Themes. Only the classes that set colour, shape, and spacing are swapped for `theme-` equivalents.

### Use `theme-` utility classes

The app emits a set of `theme-`-prefixed utility classes into `nce_theme.css`. These are the public, collision-safe API for downstream Vue components. The `theme-` prefix prevents collisions with Frappe Desk, Bootstrap, and Tailwind class names.

```html
<!-- background -->
<div class="theme-bg-surface theme-border theme-rounded theme-shadow theme-p-lg">
  <h3 class="theme-text-heading theme-text-xl">Card title</h3>
  <p class="theme-text-muted theme-text-sm">Subtitle</p>
  <p>Body copy — inherits --nce-color-text automatically.</p>
</div>

<!-- primary action button -->
<button class="theme-bg-primary theme-rounded theme-p-sm">Submit</button>

<!-- quiet secondary button -->
<button class="theme-bg-primary-100 theme-border theme-rounded theme-p-sm">Cancel</button>
```

### Full shade scale in templates

All 11 stops (50–950) are available as utility classes for every colour role:

```html
<!-- light tint background -->
<div class="theme-bg-primary-100"> … </div>

<!-- mid-range badge -->
<span class="theme-bg-success-400 theme-text-success-400-fg"> Active </span>

<!-- dark accent border -->
<div class="theme-border-secondary-700"> … </div>
```

The paired `-fg` classes provide auto-contrast foreground colours for any shade:

```html
<button class="theme-bg-primary-500 theme-text-primary-500-fg">Go</button>
```

### Inline CSS variables (dynamic values)

When the class name needs to be computed at runtime, use `:style` with `var()`:

```vue
<template>
  <div v-for="role in palette" :key="role.var"
       :style="{ backgroundColor: `var(${role.var})` }"
       class="theme-rounded theme-p-md">
    {{ role.label }}
  </div>
</template>

<script setup>
const palette = [
  { label: 'Primary',   var: '--nce-color-primary' },
  { label: 'Secondary', var: '--nce-color-secondary' },
  { label: 'Accent',    var: '--nce-color-accent' },
]
</script>
```

### Scoped CSS in downstream apps

If your app ships its own CSS file (loaded via `app_include_css`), map `--nce-*` tokens to your own internal variables inside a scoped selector — never at `:root`:

```css
/* CORRECT — map --nce-* tokens to your own vars, scoped to your component root */
.my-app-root {
  --my-text-color:   var(--nce-color-text, #333333);
  --my-text-muted:   var(--nce-color-muted, #888888);
  --my-primary:      var(--nce-color-primary, #126bc4);
  --my-border-color: var(--nce-color-border, #d1d5db);
}

/* Then use your own vars freely inside the component */
.my-component {
  color: var(--my-text-muted);
  border: 1px solid var(--my-border-color);
}
```

> ⚠️ **Never override Frappe variables at `:root`.** Setting `--text-muted`, `--text-color`, `--primary`, or `--border-color` at the root level in any file loaded site-wide will break Frappe Desk text, buttons, and borders for all users on all pages.

### Multi-theme panels

Wrap any section in `data-nce-theme="<slug>"` to render it in a different Active theme's palette:

```html
<!-- uses Default theme (:root) -->
<div class="theme-bg-surface"> … </div>

<!-- uses the "ocean" theme palette -->
<div data-nce-theme="ocean" class="theme-bg-surface"> … </div>
```

The `slug` is derived from the NCE Theme record's name. The theme must have `status = Active` to produce a scoped palette block in `nce_theme.css`.

---

## ThemeSwatchPicker — picking custom colour variations

The app ships a **ThemeSwatchPicker** widget that lets a non-technical user pick any shade from the current theme palette and store it as a `theme-{kind}-{role}-{shade}` class string. This is the intended way to let users customise colour choices (e.g. a panel header colour) without exposing raw hex values.

The picker covers all 264 combinations: 3 kinds (bg, text, border) × 8 roles × 11 shade stops.

**In a Vue app:**

```vue
<ThemeSwatchPicker
  theme-field="theme"
  value-field="header_color"
  v-model:open="pickerOpen"
  :get-field="(fn) => formData[fn]"
  :set-field="(fn, val) => { formData[fn] = val }"
/>
```

**In a Frappe Desk form (Client Script):**

```js
frappe.ui.themeSwatchPicker.open({
  frm,
  themeField: 'theme',        // Link → NCE Theme doc name
  valueField: 'header_color',
});
```

**On a standalone HTML page:**

```html
<script src="/assets/themes/dist/theme-swatch-picker.umd.js"></script>
<script>
  window.themeSwatchPicker.open({
    themeFieldEl: document.getElementById('theme'),
    valueFieldEl: document.getElementById('header_color'),
  });
</script>
```

The picker does no colour math of its own — it reads directly from the live `nce_theme.css`, so what the user sees in the swatch grid is exactly what rendered components will show.

---

## Install

```bash
bench get-app https://github.com/YOUR_USERNAME/themes.git
bench --site your-site install-app themes
bench --site your-site migrate
```

Build the frontend after pulling changes:

```bash
cd apps/themes/frontend && yarn install && yarn build
cd ~/frappe-bench && bench build --app themes && bench restart
```

Open the editor at `/themes/theme-settings` or via Desk → Themes workspace → **Theme Editor**.

---

## License

Copyright (c) 2026 Oliver Reid. All rights reserved.

Use of this software is permitted within your own Frappe installation.
Copying, reproducing, or incorporating any part of this source code
into other projects is strictly prohibited without written permission
from the author.
