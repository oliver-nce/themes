# 09 — Button Styling Guidelines

Decision rules + ready-made class recipes for buttons across any downstream Frappe app. Designed to be the single doc an agent (or a human) consults before writing a `<button>` element.

All classes referenced here ship site-wide via `nce_theme.css` (Path B). No Tailwind build required in the consuming app.

## The five button styles

Every button on every screen should be **one of these five**. If a design calls for a sixth thing, the design is probably wrong before the code is.

| Style | Use for | Visual signature |
|---|---|---|
| **Filled** | The single primary action on a screen. Destructive confirmations. Strong state confirmations. | Solid background, auto-paired light/dark text. |
| **Soft** | Frequent secondary actions. Inline action chips. Cells in a button grid where one is "active." | Light tint background (shade-100), darker role-colored text. |
| **Outline** | A secondary action that needs to look "actionable" but not loud. Filter chips. Toolbar buttons. | Transparent background, 1px colored border, colored text. |
| **Ghost** | Cancel / dismiss next to a Filled. Toolbar icons that aren't the primary action. | No background, no border, just colored text. |
| **Header** | A button that sits on top of a `theme-bg-primary` (or other role) parent. | No background, no border, paired-fg text. |

## Decision tree

```
Authoring a button?
│
├─ Is this the ONE most important action on the screen? → Filled, primary
├─ Is it destructive (delete, cancel order, sign out)?  → Filled, danger
├─ Is it confirming a positive state (Save & continue)? → Filled, success
│
├─ Is it a secondary action next to a Filled?           → Ghost (or Outline if loud-er needed)
├─ Is it part of a row of equal-weight actions?         → Soft  (or Outline)
├─ Is it a toolbar / filter / view-switcher button?     → Outline or Soft
│
├─ Does it sit on top of a colored parent (header)?     → Header
│
└─ Anything else                                        → Ghost
```

## Recipes (copy-paste ready)

These are bare patterns — add `font-medium`, `font-bold`, or extra `p-{size}` as needed for visual weight.

### Filled

```html
<!-- Primary action -->
<button class="theme-bg-primary theme-rounded p-sm">Save</button>

<!-- Destructive -->
<button class="theme-bg-danger theme-rounded p-sm">Delete</button>

<!-- Success confirmation -->
<button class="theme-bg-success theme-rounded p-sm">Approve</button>

<!-- Warning (e.g. force-publish, override) -->
<button class="theme-bg-warning theme-rounded p-sm">Override</button>

<!-- Secondary brand -->
<button class="theme-bg-secondary theme-rounded p-sm">Continue</button>
```

The `theme-bg-{role}` class auto-pairs `color: var(--nce-color-{role}-fg)` via the `@layer`-style rule in `nce_theme.css`. **Don't add `theme-text-{role}-fg` alongside** — it's redundant.

### Soft

```html
<!-- Primary soft -->
<button class="theme-bg-primary-100 theme-rounded p-sm">Filter</button>

<!-- Active filter chip (looks pressed) -->
<button class="theme-bg-primary-200 theme-rounded p-sm">Active filter</button>

<!-- Secondary soft -->
<button class="theme-bg-secondary-100 theme-rounded p-sm">Tab</button>

<!-- Danger soft (e.g. a "discard?" warning chip) -->
<button class="theme-bg-danger-100 theme-rounded p-sm">Discard</button>
```

Shade-100 backgrounds auto-pair with the shade's own foreground companion — usually a darker shade of the same hue (300, 700, or a computed value). Result: readable role-tinted text on a light role-tinted background. No need for an explicit text class.

### Outline

```html
<!-- Outline primary -->
<button class="theme-text-primary theme-border theme-border-primary theme-rounded p-sm">
  Edit
</button>

<!-- Outline secondary -->
<button class="theme-text-secondary theme-border theme-border-secondary theme-rounded p-sm">
  Preview
</button>

<!-- Outline danger -->
<button class="theme-text-danger theme-border theme-border-danger theme-rounded p-sm">
  Delete
</button>
```

**The `theme-border` base class is required** because `theme-border-{role}` only sets `border-color` — not width or style. `theme-border` sets all three (`1px solid var(--nce-color-border)`), and then `theme-border-{role}` overrides just the color.

If the button is on a colored surface that needs a transparent background, you're done. If it's on a busy background and you want a clean canvas, add `theme-bg-card` first.

### Ghost

```html
<!-- Default ghost -->
<button class="theme-text-primary p-sm">Cancel</button>

<!-- Muted ghost (less prominent) -->
<button class="theme-text-muted p-sm">Skip</button>

<!-- Ghost with hover affordance (scoped CSS) -->
<button class="my-ghost-btn theme-text-primary p-sm">More…</button>
<style scoped>
.my-ghost-btn:hover { background: var(--nce-color-primary-100); }
</style>
```

Ghosts have no background or border by default. If you want a hover-tint, do it in scoped CSS using `var(--nce-color-primary-100)` — hover variants are not in the contract class set.

### Header (button on a colored parent)

```html
<div class="theme-bg-primary p-md">
  <!-- The button inherits the auto-paired fg color from the parent's text rule -->
  <button class="theme-text-primary-fg p-xs">Action</button>

  <!-- Subtler tonal variant -->
  <button class="theme-text-primary-fg-tonal p-xs">Subtle action</button>
</div>
```

When a parent has `theme-bg-primary`, all child text inherits the paired fg color via the cascade. For an icon button that needs to stand out slightly less, use `theme-text-primary-fg-tonal` (same hue as primary, low chroma, flipped lightness — feels "designed" rather than harsh).

## Choosing the role

| Intent | Role | Why |
|---|---|---|
| Default action ("OK", "Save", "Submit") | `primary` | The "what should I click first" color. |
| Cancel / undo next to a primary | `secondary` or ghost | Visually less loud, supports the primary. |
| Delete / sign out / discard | `danger` | Universal "this is irreversible" signal. |
| Approve / confirm positive outcome | `success` | Matches a green checkmark / "good" feeling. |
| Pending / needs attention badge | `warning` | Yellow-ish "wait" signal. |
| Help / info tooltip trigger | `info` | Neutral, low-stakes informational. |
| Decorative / promotional callout | `accent` | Brand highlight, not a meaningful action. |

**One primary per screen.** If you find yourself reaching for `theme-bg-primary` twice in the same view, one of them is wrong.

## Size and spacing

Use uniform spacing classes — directional spacing (`px-md`, `py-sm`, `pt-lg`) is not in the contract.

| Size | Class | Use for |
|---|---|---|
| Compact | `p-xs` | Icon-only buttons, dense toolbars, table-row actions. |
| Small | `p-sm` | Default for most chrome buttons. Dialog actions. |
| Medium | `p-md` | Form submits, primary CTAs on a card. |
| Large | `p-lg` | Hero CTAs, marketing surfaces. Rare in panel UI. |

For asymmetric padding (taller than wide, common for pill-shaped buttons), use inline `:style` with `var(--nce-spacing-base)`:

```html
<button class="theme-bg-primary theme-rounded"
        :style="{ padding: 'calc(var(--nce-spacing-base) * 0.5) var(--nce-spacing-base)' }">
  Save
</button>
```

## Disabled state

Use scoped CSS — `:disabled` isn't covered by contract classes.

```html
<button class="theme-bg-primary theme-rounded p-sm" :disabled="loading">Save</button>
<style scoped>
button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
```

Don't try to use a different role for disabled. The opacity reduction is universal and theme-safe.

## Loading state

Same approach — scoped or via library. If using a spinner inside the button, the auto-paired fg color from the role class already gives the spinner the right tint:

```html
<button class="theme-bg-primary theme-rounded p-sm">
  <Spinner v-if="loading" />
  Save
</button>
```

## Common mistakes (don't do these)

| Mistake | Why it's wrong |
|---|---|
| `class="theme-bg-primary theme-text-primary-fg"` | The fg class is redundant; the `@layer` rule on `.theme-bg-primary` already sets `color`. Adding it adds noise. |
| `class="theme-bg-primary text-white"` | `text-white` overrides the auto-paired fg with a fixed white. Breaks contrast on pastel themes. Only use `text-white`/`text-black` for the explicit fixed-color cascade case described in `05-foreground-pairing.md`. |
| `class="theme-text-primary theme-border-primary p-sm"` (outline without `theme-border`) | Missing base `theme-border` means the button has no border width/style — only color. Result: no visible border. Add `theme-border` to the class list. |
| `class="bg-primary"` (no `theme-` prefix) | Vanilla Tailwind class name; not what Path B emits. Use `theme-bg-primary`. |
| Hex literals in `<style scoped>` (`color: #126BC4`) | Breaks theming. Use `var(--nce-color-primary)` if a class doesn't fit, never a hex. |
| Two Filled primary buttons on one screen | Confuses "the one important action" signal. Demote one to Soft, Outline, or Ghost. |
| Filled `accent` for a CTA | `accent` is for decorative emphasis, not actions. Use `primary` for actions, `accent` for highlights and badges. |
| Filled `info` for an action button | `info` is for informational STATE (tooltips, hints), not actions. If the action is informational ("Learn more"), use ghost or outline. |

## Quick lookup — what class for what intent?

| Intent | Class string |
|---|---|
| Save / OK / primary CTA | `theme-bg-primary theme-rounded p-sm` |
| Delete | `theme-bg-danger theme-rounded p-sm` |
| Cancel | `theme-text-primary p-sm` (ghost) |
| Cancel with outline | `theme-text-primary theme-border theme-border-primary theme-rounded p-sm` |
| Filter chip (idle) | `theme-bg-card theme-border theme-rounded-sm p-xs` |
| Filter chip (active) | `theme-bg-primary theme-rounded-sm p-xs` |
| Filter chip (soft active) | `theme-bg-primary-200 theme-rounded-sm p-xs` |
| Table row action | `theme-text-primary p-xs` (ghost, small) |
| Toolbar button on colored header | `theme-text-primary-fg p-xs` |
| Subtle action on colored header | `theme-text-primary-fg-tonal p-xs` |
| Success confirmation | `theme-bg-success theme-rounded p-sm` |
| Warning override | `theme-bg-warning theme-rounded p-sm` |
| Status badge | `theme-bg-{role}-100 theme-rounded-sm p-xs` (soft) |

## See also

- `THEME_CLASS_CONTRACT.json` — the full class catalog.
- `03-color-roles.md` — what each role means semantically.
- `04-shade-scale.md` — when to use a shade vs. the base role.
- `05-foreground-pairing.md` — how fg color is computed; mono vs tonal.
- `07-using-in-vue.md` — general decision tree for class vs. var vs. inline.
