# 03 — Color Roles

For the complete class list see `THEME_CLASS_CONTRACT.json`. This file explains the *semantics* — what each role is *for*.

## Brand roles

| Role | Semantic meaning | When to use |
|---|---|---|
| **primary** | Main brand color | Default action buttons, primary links, key UI accents. The "what should I click first" color. |
| **secondary** | Supporting brand color | Secondary buttons, alternate emphasis, headers when primary would be too loud. |
| **accent** | Highlight color | Decorative callouts, badges, highlights. Not for primary actions. |

## State roles

| Role | Semantic meaning | When to use |
|---|---|---|
| **success** | Positive state | Confirmation banners, "✓ Saved" toasts, healthy metric badges. |
| **info** | Informational state | Neutral notifications, help tips, "did you know" hints. |
| **warning** | Caution state | Warnings, pending items, "needs attention" badges. |
| **danger** | Error / destructive state | Failure messages, delete buttons, critical alerts. |

## Neutral (greyscale role)

| Role | Semantic meaning | When to use |
|---|---|---|
| **neutral** | Structural greyscale | Page-level body content, structural backgrounds, dividers, mid-tone surfaces. Use when the element should not carry brand or state meaning. Tuned with **gamma + warmth** (not saturation). |

## Structural neutral roles

These don't follow the role + shade + fg pattern — they're flat.

| Role | Semantic meaning |
|---|---|
| `theme-bg-bg-page` | Page background — the lowest-elevation surface. |
| `theme-bg-surface` | Card/panel/modal background — one step up from page. |
| `theme-bg-card` | Alias of `theme-bg-surface` for semantic clarity. |
| `theme-bg-row-alt` | Alternating table row (zebra striping). |
| `theme-bg-header` | Top-bar/header strip. |

## Text roles

| Role | When to use |
|---|---|
| body default (`--nce-color-text`, no class) | Body copy — applies by default, rarely set explicitly. |
| `theme-text-heading` | H1–H6, prominent text. |
| `theme-text-muted` | Captions, timestamps, helper text. |
| `theme-text-link` | Hyperlinks. |

## Choosing the right role

- "Click here" button → `primary`
- "Cancel" button next to a primary → `secondary` or ghost
- "Delete account" button → `danger`
- A pending status badge → `warning`
- A "saved" toast → `success`
- A help tooltip background → `info`
- A row in a table → use `theme-bg-row-alt` for stripes, not a brand role
- A card on the page → `theme-bg-surface`, not a brand role
