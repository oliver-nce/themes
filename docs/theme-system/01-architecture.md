# 01 — Architecture

## The pipeline

```
[1] Theme Editor (Vue SPA)
    User picks a hex like #3B82F6 in BrandColorPicker.vue
    Saved on NCE Theme.theme_json
            ↓
[2] css_writer.py → generate_css(payload)
    Emits :root { --nce-color-primary: #3B82F6; ... }
    Plus shade scales --nce-color-primary-{50..950}
    Plus foreground companions --nce-color-primary-fg, -fg-tonal
    Plus theme- utility classes:
        .theme-bg-primary      → background + paired --nce-color-primary-fg
        .theme-text-primary-fg → color: var(--nce-color-primary-fg)
    Writes themes/public/css/nce_theme.css
            ↓
[3] hooks.py → app_include_css = ["css/nce_theme.css"]
    Loaded site-wide on every Frappe page (this is the downstream contract)
            ↓
[4] frontend/tailwind.config.js
    Editor SPA only — provides equivalent names for the editor's own UI.
    Separate from the emitted, theme--prefixed downstream classes above.
            ↓
[5] Vue component (downstream app / Desk)
    <button class="theme-bg-primary">Click</button>
    Reads the current --nce-* value — flips when theme changes
```

## Key properties

1. **Class names are stable.** Once shipped, `theme-bg-primary` always means "the user's chosen primary." Component code written today still works after re-theming.
2. **Values are live.** Changing the editor swaps the var value; no rebuild needed.
3. **One source of truth.** Editor → JSON on NCE Theme → CSS vars → `theme-` classes → components. No hex literals downstream.
4. **Foreground auto-pairing.** `--nce-color-{role}-fg` is computed at publish time from the role's lightness, so contrast follows the theme.

## Live preview path

When the user is editing in the SPA (before saving):

```
ThemeSettingsPage.vue → useTheme.ts → theme-injector.ts
                                              ↓
                                  root.style.setProperty('--nce-color-primary', '#NEW')
```

The injector mutates `:root` inline so the preview pane updates without a full publish.

## Files in the pipeline

| Step | File |
|---|---|
| Editor UI | `frontend/src/pages/ThemeSettingsPage.vue` |
| Color picker | `frontend/src/components/BrandColorPicker.vue` |
| Live preview | `frontend/src/utils/theme-injector.ts` |
| Shade math (TS) | `frontend/src/utils/color-shades.ts` |
| Shade math (Py) | `themes/utils/theme_color_utils.py` |
| CSS emitter | `themes/utils/css_writer.py` |
| Editor SPA Tailwind | `frontend/tailwind.config.js` |
| Site CSS load | `themes/hooks.py` (`app_include_css`) |
| Persistent storage | `themes/themes/doctype/nce_theme/` |
