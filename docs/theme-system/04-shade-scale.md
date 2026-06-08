# 04 — Shade Scale

Every brand/state role generates an 11-stop OKLCH shade scale, matching the Tailwind convention.

## The 11 stops

| Stop | OKLCH L target | Typical use |
|---|---|---|
| 50 | 0.97 | Subtlest tint — page-section backgrounds |
| 100 | 0.93 | Soft tint — badges, hover surfaces |
| 200 | 0.87 | Light tint — alerts, light banners |
| 300 | 0.78 | Pastel — secondary buttons, disabled states |
| 400 | 0.68 | Mid-light — borders on dark surfaces |
| 500 | 0.57 | Mid — used for inverted/dark mode primaries |
| **600** | **0.48** | **Base — the user's chosen color is pinned here** |
| 700 | 0.39 | Slightly darker — hover/active states |
| 800 | 0.31 | Dark — strong emphasis text |
| 900 | 0.23 | Very dark — headings on tinted backgrounds |
| 950 | 0.16 | Darkest — body text on tinted backgrounds |

The user's picked color always lands at **stop 600**. All other stops are computed from it in OKLCH space, then mapped back to sRGB with gamut clipping.

## Shade classes

All **11 stops** are exposed as classes:

- **50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950**

These have classes like `theme-bg-primary-300`, `theme-text-primary-700`, plus matching fg variants.

## Why this scale?

- **OKLCH lightness** is perceptually uniform — stop 300 looks half as light as stop 700 to the eye, unlike HSL.
- **Pinned 600** means the user's picked color shows up exactly — no automatic shifting.
- **All 11 stops** ship as classes so authors and the swatch picker can use any step without falling back to `var()`.

## Gamma and saturation tuning

Each role accepts optional `gamma` and `saturation` params (stored on NCE Theme as `{role}_color_gamma`, `{role}_color_saturation`):

- `gamma` (-100 → +100): lightens mids (positive) or darkens mids (negative). 0 = baseline.
- `saturation` (0 → 200): scales chroma. 100 = max in-gamut at stop 600.

These let designers tune the family without changing the base hex.
