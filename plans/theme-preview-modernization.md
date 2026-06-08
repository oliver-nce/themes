# Theme Preview Modernization — Make the preview render with the contract classes it advertises

## Goal

`ThemePreviewPage.vue` is the editor's "what will my theme look like in a real Frappe app?" demo. Its job is to faithfully show the user what downstream UI will look like with their saved theme. Today the preview achieves visual fidelity by defining ~150 lines of local `<style scoped>` rules (`.btn-primary`, `.badge-warning`, `.alert-danger`, `.card`, etc.) that each read `var(--nce-color-*)` directly. After Path B, those exact same colors are available as bare classes (`theme-bg-primary`, `theme-bg-warning-100`, `theme-bg-surface`, etc.) site-wide.

This means **the preview is currently lying** — or at least, decoupled. The preview reflects what the theme looks like through its own private CSS rules, not through the classes that downstream apps consume. If a developer in nce_events writes `class="theme-bg-primary"`, they're rendering through the contract's `@layer`-style rule in `nce_theme.css`. The preview should render through the same rule, so what the user sees in the editor is exactly what they ship.

This plan rewrites `ThemePreviewPage.vue` to consume the contract classes directly. After the work, the preview's `<style scoped>` block shrinks from ~230 lines to ~30 (layout-only), and every visual claim the preview makes is backed by the same CSS rule a downstream Vue app would render through.

## File being edited

**Exactly one file:** `/Users/oliver2/Documents/_NCE_projects/Themes/frontend/src/pages/ThemePreviewPage.vue`

No backend changes. No `css_writer.py` work. No new `@layer` rules. This is pure Vue template rewrites + scoped-CSS deletion.

## Important context

- ThemePreviewPage.vue runs inside the **Themes Vue SPA** (the editor at `/themes/*`). The SPA loads its OWN compiled Tailwind utility CSS (from `frontend/tailwind.config.js`) AND the site-wide `nce_theme.css`. So in this page, BOTH the contract classes (`theme-bg-primary`) AND vanilla Tailwind utilities (`gap-3`, `flex`, `p-8`) work.
- **Preserve vanilla Tailwind utilities used for demo layout** (`flex`, `grid`, `gap-*`, `mb-*`, `mt-*`, `space-y-*`, `max-w-*`, `mx-auto`, `text-xs`, etc.). They aren't theme-aware and the preview's layout depends on them. They're fine.
- **Replace local CSS-rule-backed semantic classes** (`.btn-primary`, `.badge-success`, `.card`, `.preview-surface`, etc.) with contract classes from `THEME_CLASS_CONTRACT.json`. These are the misleading layer — the preview should render colors and chrome through the contract, not through its private rule set.
- **Where the contract has no equivalent**, keep the scoped CSS rule and document why in an inline comment. Examples: `.alert` needs a `border-left: 4px solid` accent which has no class equivalent (directional border, out of scope); `.pill` needs `border-radius: 9999px` which is fully-round, not the theme's `rounded` value.

## Phase index

- **P1** — Chrome (page, surface, headings, text, muted, link, section-label)
- **P2** — Buttons (Filled, Outline, Ghost, sizes, disabled)
- **P3** — Badges, Pills, Alerts (the tinted-color elements)
- **P4** — Forms, Tables, Cards, Pagination, Tabs (the data UI)
- **P5** — Final scoped CSS cleanup + verification screenshot

Each phase is a self-contained chunk. Stop after each, render the page, eyeball it, then continue.

---

## P1 — Chrome conversion (page, surface, headings, text, muted, link, section labels)

**Affected lines (approximate):** template — everywhere `preview-*` / `section-label` is used. Scoped CSS — lines 480–520.

### Template replacements

For every occurrence in the template:

| Replace | With |
|---|---|
| `class="preview-page"` | `class="theme-bg-bg-page"` |
| `class="preview-surface rounded-xl p-8"` (and similar) | `class="theme-bg-surface theme-border theme-rounded theme-shadow p-8"` — keep `p-8` and any layout classes, replace the visual chrome with contract classes. `rounded-xl` (vanilla Tailwind) stays if you want the bigger radius; replace with `theme-rounded-lg` for theme-driven radius. |
| `class="preview-heading text-4xl font-bold"` | `class="theme-text-heading theme-font-heading text-4xl font-bold"` — keep size + weight, prefix theme for color + family. |
| `class="preview-text"` | (delete the class — body color cascades from `--nce-color-text` via the root rule. No class needed.) |
| `class="preview-muted"` | `class="theme-text-muted"` |
| `class="preview-link"` | `class="theme-text-link underline"` — keep `underline` (vanilla Tailwind, layout-y) for the visual treatment. |
| `class="section-label"` | `class="theme-text-muted text-xs font-bold uppercase tracking-wider mb-3"` — section labels are a composition, not a single role; spell it out in template. |

For mixed cases like `class="text-sm preview-muted"`, the result is `class="text-sm theme-text-muted"`.

### Scoped CSS deletions

Delete these rules entirely from `<style scoped>` (no longer used after template updates):

- `.section-label` (lines ~480–487)
- `.preview-page` (lines ~489–492)
- `.preview-surface` (lines ~494–498)
- `.preview-heading` (lines ~500–503)
- `.preview-text` (lines ~505–507)
- `.preview-muted` (lines ~509–511)
- `.preview-link` and `.preview-link:hover` (lines ~513–520)

### Verification

Run `npm run dev` in `frontend/`, open the preview at `/themes/preview` (or however it's routed locally), and confirm:

- Page background renders as the theme's bg color.
- Each section's surface wrapper renders with theme surface bg + theme border + theme rounded corners.
- Section labels (Typography, Colour Palette, etc.) render as small bold uppercase muted text.
- Headings render in the heading color and heading font.
- Body paragraphs render in the default text color.
- Muted captions render in the muted color.
- Links render in the link color with underline.

**Stop point.** If a chrome element renders wrong, the contract class for that element doesn't exist or is misnamed. Check `THEME_CLASS_CONTRACT.json` or `09-buttons.md` before continuing.

---

## P2 — Buttons (Filled, Outline, Ghost, sizes, disabled)

**Affected lines:** template ~83–109; scoped CSS ~522–564.

### Template replacements

Replace the Buttons section template (lines 86–108) with:

```html
<div class="preview-surface rounded-xl p-8 space-y-4">
  <!-- (preview-surface already migrated in P1 — keep the class change from P1 here) -->

  <!-- Row 1: Filled (auto-paired foregrounds) -->
  <div class="flex flex-wrap gap-3">
    <button class="theme-bg-primary theme-rounded p-sm font-medium">Primary Action</button>
    <button class="theme-bg-secondary theme-rounded p-sm font-medium">Secondary</button>
    <button class="theme-bg-accent theme-rounded p-sm font-medium">Accent</button>
    <button class="theme-bg-success theme-rounded p-sm font-medium">Success</button>
    <button class="theme-bg-warning theme-rounded p-sm font-medium">Warning</button>
    <button class="theme-bg-danger theme-rounded p-sm font-medium">Danger</button>
    <button class="theme-bg-info theme-rounded p-sm font-medium">Info</button>
  </div>

  <!-- Row 2: Outline + Ghost -->
  <div class="flex flex-wrap gap-3">
    <button class="theme-text-primary theme-border theme-border-primary theme-rounded p-sm font-medium">Outline Primary</button>
    <button class="theme-text-secondary theme-border theme-border-secondary theme-rounded p-sm font-medium">Outline Secondary</button>
    <button class="theme-text-danger theme-border theme-border-danger theme-rounded p-sm font-medium">Outline Danger</button>
    <button class="theme-text-primary theme-rounded p-sm font-medium hover-ghost">Ghost Button</button>
  </div>

  <!-- Row 3: Sizes + Disabled -->
  <div class="flex flex-wrap gap-3 items-center">
    <button class="theme-bg-primary theme-rounded p-xs text-xs font-medium">Small</button>
    <button class="theme-bg-primary theme-rounded p-sm font-medium">Medium</button>
    <button class="theme-bg-primary theme-rounded p-md text-lg font-medium">Large</button>
    <button class="theme-bg-primary theme-rounded p-sm font-medium opacity-50 cursor-not-allowed" disabled>Disabled</button>
  </div>
</div>
```

Notes on the conversion:

- `theme-bg-{role}` auto-pairs the foreground via `nce_theme.css`'s `@layer`-style rule. No `theme-text-{role}-fg` needed.
- Outline buttons need BOTH `theme-border` (for width + style) AND `theme-border-{role}` (for color). `theme-border-{role}` alone has no width.
- The Ghost button keeps a `hover-ghost` class name as a hook for a small scoped `:hover` rule (state variants aren't in the contract).
- Sizes use `p-xs` / `p-sm` / `p-md` (contract spacing), and `text-xs` / `text-lg` (contract typography sizes). Avoid the vanilla `px-3 py-1` directional spacing — the contract uses uniform sizes only.

### Scoped CSS deletions and additions

Delete all of lines ~522–564 (`.btn`, `.btn:hover`, `.btn-primary` through `.btn-info`, `.btn-outline-*`, `.btn-ghost`, `.btn-ghost:hover`).

Add a small ghost-hover rule to replace `.btn-ghost:hover`:

```css
/* Ghost button hover — state variants not in the contract. */
.hover-ghost:hover {
  background-color: var(--nce-color-primary-100);
}
```

If you want the universal `:hover { opacity: 0.9 }` behavior the old `.btn:hover` provided across all button types, replicate it with a selector that targets the button elements in this section, OR add a vanilla `transition-opacity hover:opacity-90` class to each button (Tailwind hover variants work inside this SPA but not site-wide; that's fine — the preview lives inside the SPA).

### Verification

Open the preview, look at the Buttons section. Confirm:

- All 7 filled buttons render with correct background color AND auto-contrasted text (white on dark roles, near-black on warning which has light bg).
- 3 outline buttons render with 1px colored borders and matching text color, transparent background.
- Ghost button renders as plain text in primary color, no border, no bg. On hover, picks up a light primary-100 tint.
- Three size variants visibly differ in padding + font size.
- Disabled button looks half-faded and non-clickable.

**Stop point.** If a button's foreground is wrong (e.g. white text on a light yellow warning bg), check whether you accidentally added `theme-text-{role}-fg` or `text-white` — that overrides the auto-pairing.

---

## P3 — Badges, Pills, Alerts (tinted-color elements)

**Affected lines:** template ~172–212; scoped CSS ~598–656.

### Template replacements

Replace the Badges & Tags section (lines 175–192) with:

```html
<div class="preview-surface rounded-xl p-8 space-y-4">
  <!-- Soft badges via shade-100 (auto-paired) -->
  <div class="flex flex-wrap gap-2">
    <span class="theme-bg-primary-100 theme-rounded-sm text-xs font-medium px-3 py-0.5">Primary</span>
    <span class="theme-bg-secondary-100 theme-rounded-sm text-xs font-medium px-3 py-0.5">Secondary</span>
    <span class="theme-bg-accent-100 theme-rounded-sm text-xs font-medium px-3 py-0.5">Accent</span>
    <span class="theme-bg-success-100 theme-rounded-sm text-xs font-medium px-3 py-0.5">Approved</span>
    <span class="theme-bg-warning-100 theme-rounded-sm text-xs font-medium px-3 py-0.5">Pending</span>
    <span class="theme-bg-danger-100 theme-rounded-sm text-xs font-medium px-3 py-0.5">Rejected</span>
    <span class="theme-bg-info-100 theme-rounded-sm text-xs font-medium px-3 py-0.5">Information</span>
  </div>

  <!-- Pills (rounded-full, solid colored) -->
  <div class="flex flex-wrap gap-2">
    <span class="theme-bg-primary rounded-full text-xs font-semibold px-3 py-0.5">v2.4.1</span>
    <span class="theme-bg-success rounded-full text-xs font-semibold px-3 py-0.5">Active</span>
    <span class="theme-bg-warning rounded-full text-xs font-semibold px-3 py-0.5">Beta</span>
    <span class="theme-bg-danger rounded-full text-xs font-semibold px-3 py-0.5">Deprecated</span>
    <span class="theme-bg-muted-pill rounded-full text-xs font-semibold px-3 py-0.5">Draft</span>
  </div>
</div>
```

Notes:

- **Badges** previously used `color-mix(... 15%, transparent)` to fake a soft tint. The contract's `theme-bg-{role}-100` is a real pre-computed soft tint that auto-pairs to a readable darker fg. Cleaner and theme-correct.
- **Pills** keep the `rounded-full` vanilla Tailwind class (a fully-round border-radius has no theme equivalent — `theme-rounded-xl` is still a partial radius).
- The "muted" pill has no role equivalent; keep `theme-bg-muted-pill` as a scoped class name and define a small rule that maps it to the muted token. (Alternative: use `theme-text-muted theme-border` on a transparent pill instead. Up to you.)
- `px-3 py-0.5` is vanilla Tailwind directional spacing — preserved because the contract's uniform `p-xs` would make the pills square, not narrow ovals. The preview is allowed to use vanilla Tailwind for non-theme concerns.

Replace the Alerts section (lines 198–211) with:

```html
<div class="space-y-3">
  <!-- Soft tinted backgrounds with role-colored left border accent -->
  <div class="theme-bg-success-100 theme-rounded p-sm alert-accent-success">
    <strong>Success!</strong> Your changes have been saved successfully.
  </div>
  <div class="theme-bg-info-100 theme-rounded p-sm alert-accent-info">
    <strong>Info:</strong> A new software update is available for download.
  </div>
  <div class="theme-bg-warning-100 theme-rounded p-sm alert-accent-warning">
    <strong>Warning:</strong> Your session will expire in 5 minutes.
  </div>
  <div class="theme-bg-danger-100 theme-rounded p-sm alert-accent-danger">
    <strong>Error:</strong> Unable to process your request. Please try again later.
  </div>
</div>
```

Each alert uses the soft shade-100 background (auto-paired fg gives readable text), plus a small scoped class for the 4px left-border accent (directional border, no contract equivalent).

### Scoped CSS deletions and additions

Delete `.badge`, `.badge-{role}` (7 rules), `.pill`, `.pill-{role}` (5 rules), `.alert`, `.alert-{role}` (4 rules) — lines ~598–656.

Add small rules for the parts the contract can't cover:

```css
/* Muted pill — no role equivalent in the contract. */
.theme-bg-muted-pill { background-color: var(--nce-color-muted); color: var(--nce-color-bg); }

/* Alert left-border accents — directional border, not in the contract. */
.alert-accent-success { border-left: 4px solid var(--nce-color-success); }
.alert-accent-info    { border-left: 4px solid var(--nce-color-info); }
.alert-accent-warning { border-left: 4px solid var(--nce-color-warning); }
.alert-accent-danger  { border-left: 4px solid var(--nce-color-danger); }
```

### Verification

Open the preview, look at Badges, Pills, Alerts. Confirm:

- Soft badges render as a soft role-tinted background with darker role-colored text (the auto-paired shade-100 fg).
- Pills render as solid colored ovals with auto-paired fg.
- Alerts render with soft tinted backgrounds, readable body text, and a thick colored left stripe.

**Stop point.** If badges look too saturated, the user's theme may have shade-100 set close to the role base color. That's a theme issue, not a code issue. Document in the phase notes.

---

## P4 — Forms, Tables, Cards, Pagination, Tabs

**Affected lines:** template ~111–170 (forms), ~214–249 (tables), ~251–301 (cards), ~325–364 (nav); scoped CSS ~568–706.

### Form fields

Replace `field-label` / `field-input` / `field-checkbox` / `field-radio` classes in template (lines 117–166):

| Replace | With |
|---|---|
| `class="field-label"` | `class="block theme-text-heading text-sm font-medium mb-1.5"` |
| `class="field-input"` | `class="w-full theme-bg-bg-page theme-border theme-border-input-border theme-rounded p-sm theme-input-focus"` |
| `class="field-checkbox"` | (keep — `accent-color` styling has no contract equivalent; rename to `theme-accent-primary` for clarity, keep the scoped rule) |
| `class="field-radio"` | (same — keep with rename) |

Add a scoped focus rule (focus variants not in contract):

```css
.theme-input-focus:focus {
  outline: none;
  border-color: var(--nce-color-focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--nce-color-focus) 20%, transparent);
}

.theme-accent-primary {
  accent-color: var(--nce-color-primary);
}
```

Delete `.field-label`, `.field-input`, `.field-input:focus`, `.field-checkbox`, `.field-radio` from scoped CSS.

### Data Table

Replace template (lines 220–246):

```html
<table class="w-full text-sm">
  <thead>
    <tr class="theme-bg-surface theme-text-heading theme-table-header">
      <th class="text-left px-4 py-3 font-semibold">Name</th>
      <th class="text-left px-4 py-3 font-semibold">Email</th>
      <th class="text-left px-4 py-3 font-semibold">Role</th>
      <th class="text-left px-4 py-3 font-semibold">Status</th>
      <th class="text-right px-4 py-3 font-semibold">Score</th>
    </tr>
  </thead>
  <tbody>
    <tr
      v-for="(row, i) in tableRows"
      :key="i"
      class="theme-table-row"
      :class="i % 2 === 0 ? 'theme-bg-bg-page' : 'theme-bg-row-alt'"
    >
      <td class="px-4 py-3 font-medium">{{ row.name }}</td>
      <td class="px-4 py-3 theme-text-muted">{{ row.email }}</td>
      <td class="px-4 py-3">{{ row.role }}</td>
      <td class="px-4 py-3">
        <!-- Use the soft badge pattern from P3 -->
        <span
          class="theme-rounded-sm text-xs font-medium px-3 py-0.5"
          :class="'theme-bg-' + row.statusType + '-100'"
        >{{ row.status }}</span>
      </td>
      <td class="px-4 py-3 text-right font-mono">{{ row.score }}</td>
    </tr>
  </tbody>
</table>
```

Add scoped rules for the parts not in the contract (bottom borders, hover):

```css
.theme-table-header {
  border-bottom: 2px solid var(--nce-color-border);
}
.theme-table-row {
  border-bottom: 1px solid var(--nce-color-border);
  transition: background-color var(--nce-transition-speed) ease;
}
.theme-table-row:hover {
  background-color: var(--nce-color-primary-100);
}
```

Delete `.table-header`, `.table-row`, `.table-row:hover`, `.table-row-even`, `.table-row-odd` from scoped CSS.

### Cards

Replace `class="card"` (lines 255, 260, 265, 272, 287) with `class="theme-bg-surface theme-border theme-rounded theme-shadow p-md"`.

Delete `.card` from scoped CSS.

The "Quick Links" inner cards (lines 290–297) currently use inline `:style="{ backgroundColor: 'var(--nce-color-surface)', color: 'var(--nce-color-text)' }"`. Replace with `class="theme-bg-surface block p-3 rounded-lg text-sm text-center transition-colors"` and delete the inline `:style`.

The success/warning/danger trend indicators (lines 258, 263, 268) use inline `:style="color: var(--nce-color-success)"` etc. Replace with `class="theme-text-success"` / `theme-text-warning` / `theme-text-danger`.

### Pagination, Breadcrumbs, Tabs

Replace breadcrumb separators (lines 332, 334): `class="preview-muted"` → `class="theme-text-muted"`.

Replace breadcrumb link active text (line 335): `class="preview-text font-medium"` → `class="font-medium"` (default text cascades).

Replace tabs (lines 338–348) — the inline `:style` switches between an active and idle look. Replace with class bindings:

```html
<div class="flex gap-1 theme-tab-bar">
  <button
    v-for="(t, i) in ['Overview', 'Settings', 'Members', 'Billing']"
    :key="t"
    class="px-4 py-2 text-sm font-medium -mb-px"
    :class="i === 1 ? 'theme-tab-active' : 'theme-tab-idle'"
  >{{ t }}</button>
</div>
```

Scoped CSS for the tab states (directional border + state, not in contract):

```css
.theme-tab-bar {
  border-bottom: 2px solid var(--nce-color-border);
}
.theme-tab-active {
  border-bottom: 2px solid var(--nce-color-primary);
  color: var(--nce-color-primary);
}
.theme-tab-idle {
  border-bottom: 2px solid transparent;
  color: var(--nce-color-muted);
}
```

Replace pagination (lines 350–362). The Prev/Next buttons use `class="pagination-btn preview-muted"`; the numbered buttons use inline `:style` for the active state.

```html
<div class="flex items-center gap-1">
  <button class="theme-pagination-btn theme-text-muted">← Prev</button>
  <button
    v-for="p in [1,2,3,4,5]"
    :key="p"
    class="theme-pagination-btn"
    :class="p === 2 ? 'theme-bg-primary' : ''"
  >{{ p }}</button>
  <button class="theme-pagination-btn theme-text-muted">Next →</button>
</div>
```

Scoped rules:

```css
.theme-pagination-btn {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--nce-border-radius);
  font-size: 0.8125rem;
  cursor: pointer;
  border: none;
  background: transparent;
  transition: background-color var(--nce-transition-speed) ease;
}
.theme-pagination-btn:hover {
  background-color: var(--nce-color-surface);
}
```

Delete `.pagination-btn` and `.pagination-btn:hover` from scoped CSS.

### Verification

Render. Check forms (inputs with focus rings), table (zebra stripes + hover tint), three cards with auto-paired chrome, breadcrumbs, tab bar with active underline, pagination with active number.

**Stop point.** Confirm the table hover state actually fires (try mouseover). If not, the scoped `.theme-table-row:hover` rule may have been deleted; restore from the scoped block above.

---

## P5 — Final scoped CSS cleanup + verification screenshot

After P1–P4, audit `<style scoped>`. The expected residuals are:

```css
/* Layout/state rules — kept because state variants and directional properties
   are not in the contract. */
.hover-ghost:hover { background-color: var(--nce-color-primary-100); }

.theme-bg-muted-pill { background-color: var(--nce-color-muted); color: var(--nce-color-bg); }

.alert-accent-success { border-left: 4px solid var(--nce-color-success); }
.alert-accent-info    { border-left: 4px solid var(--nce-color-info); }
.alert-accent-warning { border-left: 4px solid var(--nce-color-warning); }
.alert-accent-danger  { border-left: 4px solid var(--nce-color-danger); }

.theme-input-focus:focus {
  outline: none;
  border-color: var(--nce-color-focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--nce-color-focus) 20%, transparent);
}

.theme-accent-primary { accent-color: var(--nce-color-primary); }

.theme-table-header { border-bottom: 2px solid var(--nce-color-border); }
.theme-table-row { border-bottom: 1px solid var(--nce-color-border); transition: background-color var(--nce-transition-speed) ease; }
.theme-table-row:hover { background-color: var(--nce-color-primary-100); }

.theme-tab-bar { border-bottom: 2px solid var(--nce-color-border); }
.theme-tab-active { border-bottom: 2px solid var(--nce-color-primary); color: var(--nce-color-primary); }
.theme-tab-idle { border-bottom: 2px solid transparent; color: var(--nce-color-muted); }

.theme-pagination-btn { width: 2rem; height: 2rem; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--nce-border-radius); font-size: 0.8125rem; cursor: pointer; border: none; background: transparent; transition: background-color var(--nce-transition-speed) ease; }
.theme-pagination-btn:hover { background-color: var(--nce-color-surface); }
```

That's ~30 lines, all of which fall into one of:

- **State variants** (`:hover`, `:focus`) — out of Path B's class scope.
- **Directional CSS** (`border-left`, `border-bottom`) — not in the contract.
- **Properties without a contract equivalent** (`accent-color`, `box-shadow` ring composition).

Everything else should be gone. If any color rule references `var(--nce-color-*)` and could be expressed as a `theme-*` class, replace it.

### Final visual verification

1. Run `npm run dev` in `frontend/`.
2. Open `/themes/preview` in the editor.
3. Cycle through 2–3 saved themes via the editor's theme switcher. Confirm every section flips colors correctly.
4. Take screenshots: one with the default theme, one with a high-contrast dark-primary theme, one with a low-saturation pastel theme. Save to `Themes/plans/preview-after.png` etc.
5. Compare against `Themes/plans/preview-before.png` (capture this BEFORE starting P1).
6. The preview should look near-identical to the before, but every visual is now reaching the user's screen through `nce_theme.css`'s `@layer`-style classes — exactly the path a downstream Vue app would take.

### Acceptance criteria for the whole plan

- `ThemePreviewPage.vue` `<style scoped>` shrinks from ~230 lines to ~30.
- No template element uses a `.preview-*`, `.btn-*`, `.badge-*`, `.alert-*`, `.pill-*`, `.card`, `.table-*`, `.pagination-btn`, or `.field-*` class — all migrated to contract classes or renamed to `theme-*`-prefixed scoped helpers.
- No template element uses inline `:style` to set a `var(--nce-color-*)` background or color (except for the dynamic palette/swatch loops where the var is selected at runtime — those stay).
- No new hex literals introduced.
- Visual diff (before/after) shows no meaningful regressions on at least 3 themes.

---

## Out of scope

- The Colour Palette section (lines 35–49) and Foreground Pairing section (lines 50–82) are **canonical demos of the dynamic `var()` case** — they loop over the role list and use `:style="{ backgroundColor: var(--nce-color-${role}) }"`. These should NOT migrate to static classes because the whole point of those sections is to demonstrate runtime-dynamic color usage. Leave them alone.
- The Shadows & Radii section (lines 366–381) uses `getDynamicShadow(s)` to compose `color-mix()` strings at runtime. Same logic — it's demonstrating dynamic composition. Leave alone.
- The Progress Bars section (lines 303–323) uses inline `:style="{ backgroundColor: var(--nce-color-${bar.color}) }"` for the same dynamic reason. Leave alone.
- The floating "live theme update" banner at the top of the template (line 3) is editor chrome, not preview content. Leave alone.

These four exceptions are themselves valid contract usage — they demonstrate the `:style` + `var()` escape hatch from `07-using-in-vue.md`. The preview correctly shows BOTH the class-based path AND the var-based path.
