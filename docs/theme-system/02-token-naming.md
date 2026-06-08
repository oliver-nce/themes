# 02 — Token Naming

All CSS variables use the `--nce-` prefix to avoid collisions with Frappe/Tailwind/other apps.

## Pattern

```
--nce-{category}-{role}[-{shade}][-{modifier}]
```

Examples:

| Variable | Category | Role | Shade | Modifier |
|---|---|---|---|---|
| `--nce-color-primary` | color | primary | — | — |
| `--nce-color-primary-300` | color | primary | 300 | — |
| `--nce-color-primary-fg` | color | primary | — | fg |
| `--nce-color-primary-300-fg-tonal` | color | primary | 300 | fg-tonal |
| `--nce-font-family` | font | family | — | — |
| `--nce-border-radius` | border | radius | — | — |
| `--nce-spacing-base` | spacing | base | — | — |
| `--nce-shadow` | shadow | (default) | — | — |

## Emitted class names

Emitted classes carry a `theme-` prefix, then drop the `--nce-color-` part and use the rest.
The prefix prevents collisions with Frappe Desk / Bootstrap / vanilla Tailwind class names.

| CSS variable | Emitted class |
|---|---|
| `--nce-color-primary` | `theme-bg-primary`, `theme-text-primary`, `theme-border-primary` |
| `--nce-color-primary-300` | `theme-bg-primary-300`, `theme-text-primary-300` |
| `--nce-color-primary-fg` | `theme-text-primary-fg` |
| `--nce-color-primary-300-fg-tonal` | `theme-text-primary-300-fg-tonal` |
| `--nce-font-family` | `theme-font-sans` |
| `--nce-border-radius` | `theme-rounded` |
| `--nce-spacing-base` | `theme-p-md`, `theme-m-md`, `theme-gap-md` |

## Rules

1. Never invent a new prefix. Use `--nce-` always.
2. Roles are lowercase singular: `primary`, `secondary`, not `Primary` or `primaries`.
3. Shade numbers follow Tailwind: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950.
4. Modifiers are last: `-fg`, `-fg-tonal`, `-fg-mono` (where applicable).
5. All 11 shade stops (50–950) have emitted classes.
