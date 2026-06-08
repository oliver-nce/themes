# Theme Class Reference

Copy-paste table of every theme-aware class this app ships. Drop the relevant section into an agent prompt as a quick lookup.

All emitted classes carry a **`theme-`** prefix so they never collide with Frappe Desk / Bootstrap / vanilla Tailwind class names (which would otherwise win the cascade on Desk pages). CSS variables are unchanged (`--nce-*`).

Source of truth: `THEME_CLASS_CONTRACT.json`. If this file disagrees with the JSON, the JSON wins.

Status legend: **shipping** = use today · **var-only** = use `:style="{ … var(--…) }"`, no class yet · **proposed** = not yet implemented.

---

## Color Roles — Base + Foreground Pairs

| Role | Background | Text (as color) | Border | Foreground (mono) | Foreground (tonal) |
|---|---|---|---|---|---|
| primary | `theme-bg-primary` | `theme-text-primary` | `theme-border-primary` | `theme-text-primary-fg` | `theme-text-primary-fg-tonal` |
| secondary | `theme-bg-secondary` | `theme-text-secondary` | `theme-border-secondary` | `theme-text-secondary-fg` | `theme-text-secondary-fg-tonal` |
| accent | `theme-bg-accent` | `theme-text-accent` | `theme-border-accent` | `theme-text-accent-fg` | `theme-text-accent-fg-tonal` |
| success | `theme-bg-success` | `theme-text-success` | — | `theme-text-success-fg` | `theme-text-success-fg-tonal` |
| info | `theme-bg-info` | `theme-text-info` | — | `theme-text-info-fg` | `theme-text-info-fg-tonal` |
| warning | `theme-bg-warning` | `theme-text-warning` | — | `theme-text-warning-fg` | `theme-text-warning-fg-tonal` |
| danger | `theme-bg-danger` | `theme-text-danger` | — | `theme-text-danger-fg` | `theme-text-danger-fg-tonal` |
| neutral | `theme-bg-neutral` | `theme-text-neutral` | `theme-border-neutral` | `theme-text-neutral-fg` | `theme-text-neutral-fg-tonal` |

Each `theme-bg-{role}` rule sets both background and the paired `--nce-color-{role}-fg` color, so you can omit the `-fg` class unless you want the tonal variant. The `theme-text-*` classes are emitted after the bg rules, so adding one overrides the paired color.

---

## Color Roles — Shade Scale (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950)

For each role above, these shade classes exist. Substitute `{role}` ∈ {primary, secondary, accent, success, info, warning, danger, neutral} and `{N}` ∈ {50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950}.

| Pattern | Example |
|---|---|
| `theme-bg-{role}-{N}` | `theme-bg-primary-300` |
| `theme-text-{role}-{N}` | `theme-text-primary-300` |
| `theme-text-{role}-{N}-fg` | `theme-text-primary-300-fg` |
| `theme-text-{role}-{N}-fg-tonal` | `theme-text-primary-300-fg-tonal` |
| `theme-border-{role}-{N}` | `theme-border-primary-300` |

---

## Neutral Roles

| Class | Var | Purpose |
|---|---|---|
| `theme-bg-bg-page` | `--nce-color-bg` | Page background |
| `theme-bg-surface` | `--nce-color-surface` | Card/panel/modal background |
| `theme-bg-card` | `--nce-color-surface` | Alias of `theme-bg-surface` |
| `theme-bg-row-alt` | `--nce-color-row-alt` | Alternating table row |
| `theme-bg-header` | `--nce-color-primary` | Top-bar/header strip (paired with primary fg) |
| `theme-text-text-header` | `--nce-color-primary-fg` | Top-bar/header strip text |

---

## Body Text Roles

| Class | Var | Purpose |
|---|---|---|
| body default (no class) | `--nce-color-text` | Body copy — applies by default |
| `theme-text-heading` | `--nce-color-heading` | H1–H6, prominent text |
| `theme-text-muted` | `--nce-color-muted` | Captions, helper text |
| `theme-text-link` | `--nce-color-link` | Hyperlinks |

---

## Borders & Focus

| Class | Var | Purpose |
|---|---|---|
| `theme-border` | `--nce-color-border` | Card edges, dividers, inputs (1px solid) |
| `theme-border-input-border` | `--nce-color-border` | Form input idle border |
| `theme-border-input-focus` | `--nce-color-focus` | Form input focused border |
| (focus ring — manual, not emitted) | `--nce-color-focus` | Keyboard focus ring |

---

## Typography

| Class | Resolves to |
|---|---|
| `theme-font-sans` | `var(--nce-font-family)` |
| `theme-font-heading` | `var(--nce-font-heading)` |
| `theme-text-xs` | `calc(--nce-font-size * 0.75)` |
| `theme-text-sm` | `calc(--nce-font-size * 0.875)` |
| `theme-text-base` | `var(--nce-font-size)` |
| `theme-text-lg` | `calc(--nce-font-size * 1.125)` |
| `theme-text-xl` | `calc(--nce-font-size * 1.25)` |
| `theme-text-2xl` | `calc(--nce-font-size * 1.5)` |
| `theme-text-3xl` | `calc(--nce-font-size * 1.875)` |
| `theme-text-4xl` | `calc(--nce-font-size * 2.25)` |

---

## Shape, Spacing, Motion

| Class | Resolves to |
|---|---|
| `theme-rounded` | `var(--nce-border-radius)` |
| `theme-rounded-sm` | `calc(--nce-border-radius * 0.5)` |
| `theme-rounded-md` | `var(--nce-border-radius)` |
| `theme-rounded-lg` | `calc(--nce-border-radius * 1.5)` |
| `theme-rounded-xl` | `calc(--nce-border-radius * 2)` |
| `theme-p-xs` / `theme-m-xs` / `theme-gap-xs` | `calc(--nce-spacing-base * 0.25)` |
| `theme-p-sm` / `theme-m-sm` / `theme-gap-sm` | `calc(--nce-spacing-base * 0.5)` |
| `theme-p-md` / `theme-m-md` / `theme-gap-md` | `var(--nce-spacing-base)` |
| `theme-p-lg` / `theme-m-lg` / `theme-gap-lg` | `calc(--nce-spacing-base * 1.5)` |
| `theme-p-xl` / `theme-m-xl` / `theme-gap-xl` | `calc(--nce-spacing-base * 2)` |
| `theme-shadow` / `theme-shadow-theme` | `var(--nce-shadow)` |
| `theme-duration-theme` | `var(--nce-transition-speed)` |

---

## Dynamic Escape Hatch

| Class | Purpose |
|---|---|
| `theme-bg-themed` | Single class that reads `--bg` at runtime. Foreground auto-computed from `--bg`'s OKLCH lightness. Use when shade is dynamic. |

Example:
```html
<button class="theme-bg-themed" :style="{ '--bg': 'var(--nce-color-primary-300)' }">Dynamic shade</button>
```

---

## Rules of Thumb (paste into agent prompts)

1. Prefer the `theme-` class names over raw `var()`. Class names are the public API.
2. Use `:style="{ … var(--nce-…) }"` only when the token name is dynamic.
3. Never hardcode hex literals in components.
4. For bg+text pairing, prefer `theme-bg-{role}` (auto `-fg`) or `theme-bg-{role}-100` for quiet buttons — see `button_hierarchy` in `THEME_CLASS_CONTRACT.json`.
5. Buttons on panels: main CTA `theme-bg-primary`; Cancel/Revert `theme-bg-primary-100 theme-border` — never `variant=outline` with page bg fill (see `button_hierarchy` in JSON).
6. For a row of buttons that must share text color regardless of background, put `text-white` (or `text-black`) on the parent and let it cascade. (`text-white`/`text-black` are vanilla fixed colors, not theme classes.)
7. Don't drop the `theme-` prefix and don't add it to vanilla layout utilities (`flex`, `border-b`, `font-bold`).

---

## Minimal Prompt Block (for agent system prompts)

Copy this whole block into an agent's instructions:

```
This project uses theme-aware classes mapped to CSS variables published by the Themes
app. Color names resolve at runtime, so the same class works across themes. Every emitted
class is namespaced with a `theme-` prefix to avoid colliding with Frappe Desk / Bootstrap.

Roles: primary, secondary, accent, success, info, warning, danger.
Per role: theme-bg-{role}, theme-text-{role}, theme-border-{role}, theme-text-{role}-fg,
  theme-text-{role}-fg-tonal.
Curated shades 100,200,300,500,600,700,900: theme-bg-{role}-{N}, theme-text-{role}-{N},
  theme-text-{role}-{N}-fg, theme-text-{role}-{N}-fg-tonal, theme-border-{role}-{N}.
Other shades (50,400,800,950) require :style="{ background: 'var(--nce-color-{role}-{N})' }".

theme-bg-{role} sets background + the paired text-{role}-fg color, so the -fg class is
optional unless you want -fg-tonal instead.

Neutrals: theme-bg-bg-page, theme-bg-surface, theme-bg-card, theme-bg-row-alt,
  theme-bg-header, theme-text-text-header.
Text: theme-text-heading, theme-text-muted, theme-text-link. Body text applies by default.
Type: theme-font-sans, theme-font-heading, theme-text-{xs,sm,base,lg,xl,2xl,3xl,4xl}.
Shape: theme-rounded[-sm|-md|-lg|-xl], theme-shadow, theme-shadow-theme.
Spacing: theme-{p,m,gap}-{xs,sm,md,lg,xl}.
Border: theme-border, theme-border-input-border, theme-border-input-focus.
Motion: theme-duration-theme.
Dynamic shade: theme-bg-themed + :style="{ '--bg': 'var(--nce-color-{role}-{N})' }".

Buttons: Submit/Apply theme-bg-primary; Cancel/Revert theme-bg-primary-100 theme-border;
no frappe outline + --nce-color-bg on panel controls (see button_hierarchy in JSON).

Rules: never write hex literals; never hardcode color: white as a class default;
prefer paired classes over hand-picked text-white/text-black; keep the theme- prefix;
don't prefix vanilla utilities (flex, border-b, font-bold).
```
