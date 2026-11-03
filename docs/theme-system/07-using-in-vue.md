<!--
Decision tree for theme- classes, CSS variables, or theme-bg-themed in Vue components.

-->

# 07 — Using Theme Classes in Vue

Decision tree and concrete examples for component authors.

> All emitted classes are namespaced with a **`theme-`** prefix (e.g. `theme-bg-primary`).
> The prefix exists so the classes never collide with Frappe Desk / Bootstrap / vanilla
> Tailwind names whose cascade would otherwise override the theme on Desk pages.

## The three-tier rule

1. **Theme class** — default. `class="theme-bg-secondary theme-text-secondary-fg"`.
2. **CSS variable inline** — when token name is dynamic. `:style="{ background: \`var(${roleVar})\` }"`.
3. **Raw hex literal** — never. Breaks the theming chain.

## Decision tree

```
Need a color/spacing/typography value in a Vue component?
│
├─ Is the value known at author time?
│  │
│  ├─ YES → Is there a class for it in THEME_CLASS_CONTRACT.json?
│  │  │
│  │  ├─ YES (status: shipping) → use the theme- class
│  │  ├─ var-only → use :style with var()
│  │  └─ proposed → don't use; pick a different approach
│  │
│  └─ NO (dynamic) → use :style with var(), OR use .theme-bg-themed + --bg
```

## Examples

### Buttons

Use **filled shade** buttons — not frappe-ui `variant="outline"` with page-background fill.
See `button_hierarchy` and `button_interaction` in `THEME_CLASS_CONTRACT.json`. Full recipes: `09-buttons.md`.

```html
<!-- main CTA — auto-paired mono fg + interaction stack -->
<button class="theme-bg-primary theme-rounded theme-p-sm theme-font-medium theme-hover-bg-primary theme-hover-border-primary theme-focus-ring theme-pressed theme-disabled-auto">Submit</button>

<!-- quiet secondary (Cancel, Revert) on theme-bg-surface panels -->
<button class="theme-bg-primary-100 theme-border theme-rounded theme-p-sm theme-font-medium theme-hover-bg-primary theme-hover-border-primary theme-focus-ring theme-pressed theme-disabled-auto">Cancel</button>

<!-- stronger secondary (tabs, Go) when needed -->
<button class="theme-bg-primary-500 theme-border-primary theme-rounded theme-p-sm theme-font-medium theme-hover-bg-primary theme-hover-border-primary theme-focus-ring theme-pressed theme-disabled-auto">Go</button>

<!-- wrong: page bg on a panel control -->
<button class="…" style="background: var(--nce-color-bg)">…</button>

<!-- wrong: hardcoded color -->
<button class="theme-bg-primary text-white">…</button>
```

Reusable component — map `variant` / `role` to the same class strings; bind `:disabled` so `theme-disabled-auto` applies:

```vue
<template>
  <button
    type="button"
    :class="buttonClasses"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'filled' }, // filled | soft | outline | ghost
  role: { type: String, default: 'primary' },
  disabled: { type: Boolean, default: false },
})

const interaction = computed(
  () =>
    `theme-font-medium theme-hover-bg-${props.role} theme-hover-border-${props.role} theme-focus-ring theme-pressed theme-disabled-auto`,
)

const buttonClasses = computed(() => {
  const r = props.role
  const base = {
    filled: `theme-bg-${r} theme-rounded theme-p-sm`,
    soft: `theme-bg-${r}-100 theme-border theme-rounded theme-p-sm`,
    outline: `theme-text-${r} theme-border theme-border-${r} theme-rounded theme-p-sm`,
    ghost: `theme-text-${r} theme-p-sm`,
  }[props.variant] ?? `theme-text-${r} theme-p-sm`
  return `${base} ${interaction.value}`
})
</script>
```

Don't add scoped `:hover` / `:focus-visible` rules on this component — those states live in `nce_theme.css`.

### Cards

```html
<div class="theme-bg-surface theme-border theme-rounded theme-shadow theme-p-lg">
  <h3 class="theme-text-heading theme-text-xl">Card title</h3>
  <p class="theme-text-muted theme-text-sm">Subtitle</p>
  <p>Body copy uses the default text color.</p>
</div>
```

### Tables with theme-tinted header

```html
<table class="w-full">
  <thead>
    <tr class="theme-bg-secondary">
      <th class="theme-text-secondary-fg-tonal theme-p-sm uppercase theme-text-xs">Doctype</th>
      <th class="theme-text-secondary-fg-tonal theme-p-sm uppercase theme-text-xs">Last Synced</th>
    </tr>
  </thead>
  <tbody>
    <tr class="theme-bg-row-alt"><td class="theme-p-sm">Email Queue</td><td>…</td></tr>
  </tbody>
</table>
```

For row separator lines, use scoped CSS with the width vars (no `theme-border-b` class exists):

```css
.table-row {
  border-bottom: var(--nce-border-width) solid var(--nce-color-border);
}
.table-header {
  border-bottom: var(--nce-border-width-strong) solid var(--nce-color-border);
}
```

Or apply `theme-border` on elements that need a full box border (cards, inputs). Use `theme-border-thin` for hairlines and `theme-border-strong` for prominent dividers.

> Note: `w-full` and `uppercase` are vanilla layout utilities, not theme classes — leave
> them unprefixed. Only color / spacing / typography / shape tokens from the contract
> carry the `theme-` prefix.

### Dynamic palette swatches (the var() case)

```vue
<template>
  <div v-for="c in palette" :key="c.var"
       :style="{ backgroundColor: `var(${c.var})` }"
       class="h-14 theme-rounded theme-p-md">
    {{ c.label }}
  </div>
</template>

<script setup>
const palette = [
  { label: 'Primary', var: '--nce-color-primary' },
  { label: 'Secondary', var: '--nce-color-secondary' },
  // ...
]
</script>
```

The class name (which var to use) is dynamic per loop iteration → `:style` with `var()` is correct here. A static class can't help.

### Data-driven backgrounds

```vue
<template>
  <div v-for="item in items"
       :key="item.id"
       class="theme-bg-themed theme-rounded theme-p-sm"
       :style="{ '--bg': `var(--nce-color-${item.severity})` }">
    {{ item.label }}
  </div>
</template>
```

`theme-bg-themed` reads `--bg` and computes a readable foreground. The severity drives which CSS var is used.

## What NOT to do

- Don't write `color: white` in `<style scoped>` as a default — it will fight light backgrounds.
- Don't duplicate utilities inside `<style scoped>` (e.g., `.btn { background: var(--nce-color-primary) }` instead of `class="theme-bg-primary"`).
- Don't put raw hex into props or constants.
- Don't drop the `theme-` prefix — bare names (`bg-primary`, `text-muted`, `border`) collide with Desk/Bootstrap and get overridden on Desk pages.
- Don't reach for `text-white` / `text-black` unless you specifically need the fixed-color cascade (see 05).

## Keeping This Instance changes

A **This Instance** change from Design Mode is saved with a description of the element: the
screen it was on (its browser path), its class, and whichever of these it has: an app key
(`data-nce-key`), a name tag (`title`, `aria-label` or `name`), its words (up to 80 characters)
and its surroundings (the nearest container with a `data-nce-key`, a stable `id`, an
`aria-label` or a heading). Themes' `instance_apply.js` runs on every Desk and website screen,
with Design Mode on or off. After every load, Vue redraw and route change, it writes
`data-nce-instance` on each element that fits a saved description.

- **Position is not used.** Moving an element does not move its style to another one.
- **Several fits, all styled.** If several elements fit one description, all of them get the
  change. The Design Mode popup says how many before you save.
- **Nothing fits.** The note is reported in a toast and the browser console when Design Mode is
  turned on (for example after the element's words change).
- **The app's own `data-nce-instance` wins.** If your template renders `data-nce-instance`,
  Themes never changes it and saves This Instance changes under that id.
- **Give an element a stable identity with `data-nce-key`.** It is the strongest clue: when set,
  it is the only one used.

```html
<button class="action-btn theme-bg-primary" data-nce-key="woo-new-product">New Woo Commerce Product</button>
```

- **Repeated elements (`v-for`)** share one description unless each copy has its own words, name
  tag or `data-nce-key`. For example, `:data-nce-key="'action-' + action.name"`.

## Frappe Desk vs SPA

- **Downstream Frappe apps / Desk pages** consume the emitted `nce_theme.css`, which only
  defines the `theme-`-prefixed classes. This is the public, collision-safe API — always
  use the `theme-` form here.
- **The Themes editor SPA** has its own internal Tailwind build for its own UI; that build
  is separate and is not the downstream contract.

A bare `<button class="bg-primary">` on a Desk page is **not** safe: Desk/Bootstrap already
defines `.bg-primary`, and its cascade can win — which is exactly why the emitted classes are
namespaced. Use `<button class="theme-bg-primary">` so the theme's paired `-fg` rule applies.
