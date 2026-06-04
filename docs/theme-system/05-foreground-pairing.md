# 05 — Foreground Pairing

The system computes a readable foreground (text) color for every background, automatically.

## Three modes

| Mode | What it does | When to use |
|---|---|---|
| **Mono** (`theme-text-{role}-fg`) | Picks black or white by OKLCH lightness threshold | Default. Maximum contrast. |
| **Tonal** (`theme-text-{role}-fg-tonal`) | Same hue, flipped lightness, reduced chroma | When you want a tinted, "designed" look instead of harsh black/white. |
| **Fixed** (`text-white` or `text-black` on parent) | One color across all children regardless of bg | Rows of mixed-color buttons that must share text color. |

## The math

**Mono threshold** (Python `pick_fg_mono`, TS `pickFgMono`):
```
L, _, _ = oklch(hex)
return "#0A0A0A" if L > 0.62 else "#FFFFFF"
```

**Tonal** (Python `pick_fg_tonal`, TS `pickFgTonal`):
```
L, C, h = oklch(hex)
target_L = clamp(1 - L, 0.05, 0.95)
target_C = C * 0.35      # reduce chroma so it doesn't vibrate
return oklch_to_hex(target_L, target_C, h)
```

## Where it runs

- At **publish time** in `themes/utils/css_writer.py` → writes `--nce-color-{role}-fg` and `--nce-color-{role}-fg-tonal` into `nce_theme.css`.
- For **every curated shade** too — `--nce-color-{role}-{N}-fg` etc.
- At **runtime** in `frontend/src/utils/theme-injector.ts` → mirrors the same math live for the SPA preview.

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
