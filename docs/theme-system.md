# Theme System — Agent Reference

> **If you are styling a Vue component or adding CSS to any app using this theme, read this file first.**
> This doc tells you exactly how theming works, what variables to use, and what will break Frappe Desk if you get it wrong.

---

## What This System Does

Themes generates a file called `nce_theme.css` that loads on **every page of the Frappe installation** (Desk, web, SPA — everything). It contains only CSS custom properties prefixed `--nce-*`. Downstream apps (NCE Events, etc.) consume these tokens to theme their components.

The separation is intentional:
- Themes **defines** tokens (`--nce-color-primary`, `--nce-color-muted`, etc.)
- Downstream apps **map** those tokens to their own internal variables, scoped tightly to their own component selectors
- Frappe Desk is **never touched**

---

## The Two Files You Care About

### 1. `nce_theme.css` — loads EVERYWHERE
- Generated at runtime by `ThemeSettings.on_update()`
- Loaded via `app_include_css` in `themes/hooks.py`
- Contains **only** `:root { --nce-* }` declarations
- Regenerated when admin saves Theme Settings in Desk
- Does NOT exist in the git repo — it lives on disk at `themes/public/css/nce_theme.css`

### 2. `themes.css` — loads on `/themes/*` SPA pages ONLY
- Built by Vite + Tailwind (`npm run build` in `frontend/`)
- Loaded via `themes/www/nce.html` only
- Contains full Tailwind output including Preflight global resets
- **Never loaded on Frappe Desk pages**

---

## Available `--nce-*` Tokens

These are always available on every page once the theme has been saved:

```css
--nce-color-primary
--nce-color-secondary
--nce-color-accent
--nce-color-success
--nce-color-info
--nce-color-warning
--nce-color-danger
--nce-color-text
--nce-color-heading
--nce-color-muted
--nce-color-link
--nce-color-focus
--nce-color-bg
--nce-color-surface
--nce-color-border
--nce-color-row-alt

/* Shade scales 50–950 for each semantic colour */
--nce-color-primary-50  … --nce-color-primary-950
--nce-color-secondary-50 … --nce-color-secondary-950
--nce-color-accent-50   … --nce-color-accent-950
--nce-color-success-50  … --nce-color-success-950
--nce-color-info-50     … --nce-color-info-950
--nce-color-warning-50  … --nce-color-warning-950
--nce-color-danger-50   … --nce-color-danger-950

/* Typography */
--nce-font-family
--nce-font-heading
--nce-font-size
--nce-font-weight
--nce-line-height

/* Layout */
--nce-border-radius
--nce-spacing-base
--nce-shadow
--nce-shadow-color
--nce-transition-speed
--nce-sidebar-width
--nce-container-max-width
```

Always include a hardcoded fallback: `var(--nce-color-primary, #126bc4)` — the token may not exist if the theme has never been saved.

---

## How to Use Tokens in a Downstream App (e.g. NCE Events)

Map `--nce-*` tokens to your internal variables **inside a component-scoped selector**:

```css
/* CORRECT — scoped to your component root */
.ppv2-root,
.ppv2-float {
  --text-muted:  var(--nce-color-muted, #888888);
  --text-color:  var(--nce-color-text, #333333);
  --primary:     var(--nce-color-primary, #126bc4);
  --border-color: var(--nce-color-border, #d1d5db);
}
```

Then use your internal variables freely inside your components:

```css
.my-component {
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}
```

---

## Tailwind Utilities in the Themes SPA

`frontend/tailwind.config.js` maps Tailwind utility classes to `--nce-*` tokens:

```js
colors: {
  primary:   "var(--nce-color-primary)",
  secondary: "var(--nce-color-secondary)",
  muted:     "var(--nce-color-muted)",
  ...
}
```

So in Vue templates inside the SPA you can write:
```html
<div class="bg-primary text-white">...</div>
<span class="text-muted">...</span>
```

These utilities **only work inside the SPA** (`/themes/*` pages). Do not expect them to work on Desk pages.

---

## ❌ ABSOLUTE NO-NOS

**Violating any of these will break Frappe Desk for all users on all pages.**

### ❌ NO-NO 1: Setting Frappe native variables at `:root`

```css
/* NEVER DO THIS in any file loaded via app_include_css */
:root {
  --text-muted: var(--nce-color-muted);   /* BREAKS ALL DESK TEXT */
  --text-color: var(--nce-color-text);    /* BREAKS ALL DESK TEXT */
  --primary: var(--nce-color-primary);    /* BREAKS ALL DESK BUTTONS */
  --border-color: var(--nce-color-border); /* BREAKS ALL DESK BORDERS */
}
```

Frappe's `desk.bundle.css` uses these variables for body text, buttons, borders, and more. Overriding them at `:root` in any file loaded site-wide will affect every element on every Desk page.

### ❌ NO-NO 2: Adding un-namespaced variables to `nce_theme.css`

```python
# NEVER add this to _generate_css() in nce_theme_settings.py
lines.append(f"\t--text-muted: {muted_color};")   # WRONG
lines.append(f"\t--primary: {primary};")           # WRONG
lines.append(f"\t--text-color: {text_color};")     # WRONG

# CORRECT — always use --nce- prefix
lines.append(f"\t--nce-color-muted: {muted_color};")
lines.append(f"\t--nce-color-primary: {primary};")
```

### ❌ NO-NO 3: Loading `themes.css` site-wide

```python
# NEVER add themes.css to app_include_css in hooks.py
app_include_css = [
  "/assets/themes/css/nce_theme.css",
  "/assets/themes/frontend/assets/themes.css",  # WRONG — Tailwind Preflight bleeds
]
```

Tailwind Preflight in `themes.css` emits global resets like `*, :before, :after { border-color: var(--nce-color-border) }` which will override Frappe Desk element styles.

### ❌ NO-NO 4: Using component-level CSS without a scope selector

```css
/* WRONG — in a CSS file loaded via app_include_css */
--text-muted: var(--nce-color-muted);  /* at :root or bare */

/* CORRECT — always inside your component root class */
.ppv2-root, .ppv2-float {
  --text-muted: var(--nce-color-muted, #888888);
}
```

---

## ⚠️ Common Mistakes

| Mistake | Symptom | Fix |
|---|---|---|
| `:root {` in `theme_defaults.css` | All Desk muted text turns the NCE muted colour | Change selector to `.your-component-root` |
| Stale `nce_theme.css` on server | Theme changes don't appear, or old colours persist | Re-save Theme Settings in Desk to regenerate |
| Browser cache | Correct file on server, wrong colour in browser | Hard refresh: `Cmd/Ctrl + Shift + R` |
| Adding `--text-muted` etc. to `_generate_css()` | Desk text/borders all change colour | Remove — only `--nce-*` vars belong in that function |
| `themes.css` on Desk page | Global border/font resets affect Desk elements | Only load via `nce.html`, never `app_include_css` |
| No fallback in `var()` | Token undefined on fresh install = invisible/broken | Always use `var(--nce-color-primary, #126bc4)` pattern |
| Forgetting to commit CSS fix before deploying | Server pulls old version, bug reappears | Commit local changes before running deploy script |

---

## Real Bug Example: Desk Text Bleed (fixed 2026-03-22)

**What happened**: All Frappe Desk body text turned pink/magenta, then green, across all pages.

**Cause**: `nce_events/public/css/theme_defaults.css` had this:
```css
:root {
  --text-muted: var(--nce-color-muted, #888888);  /* line 15 on server */
}
```
Instead of:
```css
.ppv2-root,
.ppv2-float {
  --text-muted: var(--nce-color-muted, #888888);
}
```

Since NCE Events loads `theme_defaults.css` on every page via `app_include_css`, the `:root` rule overrode Frappe's `--text-muted: var(--gray-700)`. Frappe's own `desk.bundle.css` sets `body { color: var(--text-muted) }` — so all body text inherited the NCE muted colour.

**What made it hard to diagnose**:
- Browser had cached an old magenta value (`#cc00cc`) for `--nce-color-muted` for 12+ hours after the theme was changed to green (`#5b8635`) — the server was already correct but the browser wasn't
- The server file differed from the local repo (local had the fix, server had the old `:root` version — the fix was never committed)
- `themes.css` was innocent — grepping it for `secondary`/`text-muted` returned nothing

**How it was found**:
```bash
grep -rn "\-\-text-muted:" /home/frappe/frappe-bench/apps/ --include="*.css" \
  | grep -v "frappe/frappe/public/dist"
# → nce_events/.../theme_defaults.css:34: --text-muted: var(--nce-color-muted...)
head -40 /home/frappe/frappe-bench/apps/nce_events/.../theme_defaults.css
# → revealed :root { selector on line 15
```

**Fix**: Change `:root {` to `.ppv2-root, .ppv2-float {`. Commit. Push. Deploy.

---

## Deployment Checklist

When deploying theme-related changes:

- [ ] Local CSS changes are **committed and pushed** before running the deploy script
- [ ] After deploying `nce_theme_settings.py` changes — re-save Theme Settings to regenerate the CSS file
- [ ] After deploying `theme_defaults.css` changes — run `bench build --app nce_events` (or the full deploy script)
- [ ] Tell users to hard-refresh if they see stale colours after a theme change

---

## File Reference

| File | App | Purpose |
|---|---|---|
| `themes/hooks.py` | Themes | `app_include_css` — loads `nce_theme.css` site-wide |
| `themes/www/nce.html` | Themes | Loads `themes.css` for SPA only |
| `themes/themes/doctype/nce_theme_settings/nce_theme_settings.py` | Themes | CSS generator, OKLCH shade math |
| `themes/api.py` | Themes | `regenerate_theme_css()` API endpoint |
| `frontend/tailwind.config.js` | Themes | Maps Tailwind utilities to `--nce-*` tokens |
| `nce_events/public/css/theme_defaults.css` | NCE Events | Maps `--nce-*` to panel-internal vars (scoped to `.ppv2-root, .ppv2-float`) |
| `nce_events/hooks.py` | NCE Events | `app_include_css` loads `theme_defaults.css` and `schema_explorer.css` |