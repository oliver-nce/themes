# 05 — Foreground Pairing

The system computes a readable foreground (text) color for every background, automatically.

## Three modes

| Mode | What it does | When to use |
|---|---|---|
| **Mono** (`theme-text-{role}-fg`) | Picks black or white by OKLCH lightness threshold | Default. Maximum contrast. |
| **Tonal** (`theme-text-{role}-fg-tonal`) | Cross-brand for primary/secondary (see below); same-hue OKLCH for all other roles | When you want a tinted, "designed" look instead of harsh black/white. |
| **Fixed** (`text-white` or `text-black` on parent) | One color across all children regardless of bg | Rows of mixed-color buttons that must share text color. |

## The math

**Mono threshold** (Python `pick_fg_mono`, TS `pickFgMono`):
```
L, _, _ = oklch(hex)
return "#0A0A0A" if L > 0.62 else "#FFFFFF"
```

**Tonal — default (all roles except primary/secondary)** (Python `pick_fg_tonal`, TS `pickFgTonal`):
```
L, C, h = oklch(hex)
target_L = clamp(1 - L, 0.05, 0.95)
target_C = C * 0.35      # reduce chroma so it doesn't vibrate
return oklch_to_hex(target_L, target_C, h)
```

**Tonal — cross-brand pairing (primary ↔ secondary)**

For the primary and secondary roles, tonal uses the opposite brand color instead of same-hue OKLCH:

- **Primary** backgrounds (all shades 100–900 + base) → **secondary hex** as tonal text
- **Secondary** backgrounds (all shades 100–900 + base) → **primary hex** as tonal text
- All other roles → standard `pick_fg_tonal` above

This creates a deliberate cross-brand relationship: wherever you use `theme-text-primary-fg-tonal`, you see the secondary color as text, and vice versa. The same secondary/primary hex is used across all shade levels — contrast may be reduced on extreme shades (100 / 900) but the visual pairing is consistent.

Falls back to `pick_fg_tonal(role_hex)` if the opposite brand color is not configured.

## Where it runs

- At **publish time** in `themes/utils/css_writer.py` → writes `--nce-color-{role}-fg`, `--nce-color-{role}-fg-tonal`, and per-shade variants into `nce_theme.css`. Cross-brand logic is applied for `primary_color` and `secondary_color` at both role-level and all curated shade levels.
- At **runtime** in `frontend/src/utils/theme-injector.ts` → mirrors the same cross-brand logic live (called when an Active theme loads its CSS vars into `:root`).
- In **live editor preview** in `frontend/src/pages/ThemeSettingsPage.vue` → `computeCSSVariables()` applies cross-brand tonal to both role-level and per-shade vars; pushed to the preview popup via `postMessage`.

## Auto-pairing

`themes/utils/css_writer.py` ships a paired rule for each role:

```css
.theme-bg-secondary { background-color: var(--nce-color-secondary); color: var(--nce-color-secondary-fg); }
```

So `<button class="theme-bg-secondary">` is correctly contrasted without you remembering the `-fg` class. To opt out (e.g., to use tonal), add an explicit text class:

```html
<button class="theme-bg-secondary theme-text-secondary-fg-tonal">Tonal</button>
```

The text classes are emitted after the bg rules in `nce_theme.css`, so the explicit text class wins.

## The fixed-color case

For a row of buttons of different brand colors where you want consistent text:

```html
<div class="flex theme-gap-sm text-white">
  <button class="theme-bg-primary">A</button>
  <button class="theme-bg-secondary">B</button>
  <button class="theme-bg-accent">C</button>
</div>
```

The parent's `text-white` cascades to the buttons' text; the per-role paired `color` is set on the button itself, so to force a shared color use a fixed text utility on the children if needed. (`text-white`/`text-black` are vanilla fixed colors, not theme classes.)

## Why threshold 0.62 (not 0.5)?

OKLCH L is perceptually uniform. Empirical testing across the 7 base roles shows 0.62 lands black text on light pastel/tint backgrounds (where 0.5 would still pick white and fail WCAG AA). For stricter accessibility, switch to APCA — drop-in replacement for the threshold function.

## Why tonal exists

Pure black or white on a colored background can feel harsh for marketing/decorative surfaces. Tonal text (same hue, low chroma) feels "designed" — like Stripe or Linear's UI. Use it on hero sections, tonal banners, decorative cards.

For functional UI (buttons, table cells, form fields) — stick with mono.
