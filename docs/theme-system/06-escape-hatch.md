<!--
Documents theme-bg-themed, which computes black or white text from a runtime --bg color.

code-index:begin
{
 "purpose": "Documents theme-bg-themed, which computes black or white text from a runtime --bg color.",
 "read_when": "When a shade is chosen at runtime for charts, pickers, or data-driven backgrounds.",
 "gotchas": [
  "The computed foreground is always pure black or pure white.",
  "Do not put theme-text-* on the same element unless you mean to override the computed color.",
  "Only mono foreground ships; a tonal theme-bg-themed variant is not currently shipped.",
  "Typos in --bg pass silently because there is no autocomplete.",
  "Relative oklch() needs Chromium 119+, Safari 16.4+, or Firefox 128+; older browsers need an inline color."
 ],
 "keywords": ["theme-bg-themed", "oklch", "--bg", "0.62", "Chromium", "Firefox", "mono", "shade"],
 "format": 1
}
code-index:end
-->

# 06 — Dynamic Shade Escape Hatch

For cases where the shade isn't known at author time (color picker previews, chart fills, data-driven backgrounds).

## The class

```css
.theme-bg-themed {
    background-color: var(--bg, var(--nce-color-primary));
    color: oklch(from var(--bg, var(--nce-color-primary)) calc((l - 0.62) * -infinity) 0 0);
}
```

One class. The coder sets `--bg` at runtime. The foreground is computed live by the browser from that `--bg`'s OKLCH lightness.

## Usage

```html
<!-- pick a shade at runtime -->
<button class="theme-bg-themed" :style="{ '--bg': 'var(--nce-color-primary-300)' }">
  Light primary
</button>

<!-- bind to data -->
<div v-for="item in items"
     class="theme-bg-themed"
     :style="{ '--bg': item.color }">
  {{ item.label }}
</div>

<!-- compose with arbitrary hex (avoid in production, but useful for previews) -->
<div class="theme-bg-themed" :style="{ '--bg': '#a8c4ff' }">Preview</div>
```

## How the foreground math works

```
calc((l - 0.62) * -infinity)
```

- When `l > 0.62`: `(l - 0.62)` is positive → multiplied by `-infinity` → `-infinity` → clamps to 0 → black text.
- When `l < 0.62`: `(l - 0.62)` is negative → multiplied by `-infinity` → `+infinity` → clamps to 1 → white text.
- At `l = 0.62`: undefined boundary; modern browsers resolve to 0 → black.

The `oklch(L 0 0)` form means L=value, C=0, H=0 → grayscale. So output is always pure black or pure white.

## Browser support

`oklch(from …)` relative color syntax requires:

- Chromium 119+ (Oct 2023)
- Safari 16.4+ (Mar 2023)
- Firefox 128+ (Jul 2024)

For older browsers, fall back to setting `color` inline as well as `--bg`.

## When to use vs. shade classes

| Situation | Use |
|---|---|
| Static shade known at author time | `theme-bg-primary-300 theme-text-primary-300-fg` (theme class) |
| Shade computed from props/data at runtime | `theme-bg-themed` + `:style="{ '--bg': … }"` |
| Arbitrary user-picked hex (color picker preview) | `theme-bg-themed` + `:style="{ '--bg': hex }"` |
| Chart bar fills bound to a value | `theme-bg-themed` per bar |

## Limitations

- No autocomplete for the `--bg` value — typos pass silently.
- Only mono foreground. For tonal fg with dynamic bg, you'd need a second utility (`.theme-bg-themed-tonal`) — not currently shipped.
- The `theme-text-*` utilities outrank the computed color rule, so don't put both on the same element unless you mean to override.
