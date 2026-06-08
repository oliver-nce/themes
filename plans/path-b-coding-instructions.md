# Path B — Ship the full theme contract as site-wide CSS rules

## Goal

Extend `themes/utils/css_writer.py::generate_css()` so the published `nce_theme.css` ships every theme-aware class in `THEME_CLASS_CONTRACT.json` as a bare CSS rule referencing the corresponding `--nce-*` variable. Today the file ships `:root { --nce-* }` plus only seven `.bg-{role}` auto-pairing rules and `.bg-themed`. After this work, the same file additionally ships ~320 bare class rules — `text-{role}`, `border-{role}`, `bg-{role}-{shade}`, `bg-surface`, `text-muted`, `text-link`, `rounded`, `shadow-theme`, `p-md`, `text-base`, etc. — so any downstream Frappe app's Vue components can use `class="bg-surface text-muted rounded p-md"` and have it render correctly without that app needing its own Tailwind build.

User's stated requirement: **"Vue objects in any Frappe app, via the Frappe-UI layer, have all the [contract] classes available."**

## File being edited

**Exactly one file:** `/Users/oliver2/Documents/_NCE_projects/Themes/themes/utils/css_writer.py`

No other source files change. No SQL migrations. No schema changes. No JS, no Vue, no HTML.

## What `generate_css()` produces today (verified — read this before editing)

```
nce_theme.css
├── :root {
│     --nce-color-{primary,secondary,accent,success,info,warning,danger,
│                  text,heading,muted,link,focus,bg,surface,border,row-alt}
│     --nce-color-{role}-fg, --nce-color-{role}-fg-tonal      [7 roles]
│     --nce-color-{role}-{50..950}                            [7 × 11 shades]
│     --nce-color-{role}-{N}-fg, -fg-tonal                    [7 × 7 curated]
│     --nce-font-family, --nce-font-heading
│     --nce-font-size, --nce-font-weight, --nce-line-height
│     --nce-border-radius, --nce-spacing-base
│     --nce-shadow, --nce-shadow-color
│     --nce-transition-speed
│     (optional: --nce-sidebar-width, --nce-container-max-width, tailwind_overrides)
│   }
├── .bg-{role} { background-color: var(--nce-color-{role}); color: var(--nce-color-{role}-fg); }   × 7
└── .bg-themed { ... oklch ... }
```

Path B adds bare class rules between the existing role-bg rules and `.bg-themed`. **No new `:root` vars** — every new rule references vars `_emit_root_block()` already emits.

## Design rules (apply across all phases)

1. **Bare class rules**, not wrapped in `@layer components`. Matches the existing convention. Downstream Tailwind utilities will still outrank these via `@layer utilities` if a downstream app needs to override.
2. **Each emit helper takes `(g, lines)`** where `g = payload.get` and `lines` is the running list. Helpers append directly to `lines`. Helpers that depend on user-configured tokens guard with `if not g(field): return` (or `continue` inside loops).
3. **Module-level helpers**, not nested inside `generate_css()`. Define each helper above `generate_css()`.
4. **One trailing blank line per helper** — `lines.append("")` at the end — to preserve readable separation in the output CSS.
5. **No state variants** (`hover:`, `focus:`, `active:`), no directional spacing (`px-md`, `py-sm`), no dark-mode variants, no ring-focus. Explicitly out of scope.
6. **No new imports.** Every new rule uses the existing imported constants (`COLOR_FIELDS`, `FG_ROLES`, `CURATED_SHADES`, `SHADE_SCALE_FIELDS`).
7. **Never run `bench` or `publish_theme()`.** Deployment owns that. This work is Python source changes only. The smoke test (Phase B5) is a manual step done after the user/deployment publishes.

## Verification harness (use throughout)

Before starting Phase B1, set up a fixture and a diff harness:

```bash
cd /Users/oliver2/Documents/_NCE_projects/Themes

# Capture the current output for a known payload as the baseline.
python3 -c "
import json, sys
sys.path.insert(0, '.')
from themes.utils.css_writer import generate_css
# Use the _state from Docs/nce_theme.json (NCE_Events sibling) or any saved theme.
payload = json.load(open('/Users/oliver2/Documents/_NCE_projects/NCE_Events/Docs/nce_theme.json'))['_state']
# generate_css expects a flat field-name → value dict. Map _state into that shape:
flat = {
    'primary_color': payload['anchorHex'],
    'secondary_color': '#10b981',
    'accent_color': '#f59e0b',
    'success_color': '#22c55e',
    'info_color': '#0ea5e9',
    'warning_color': '#f59e0b',
    'danger_color': '#ef4444',
    'text_color': '#1f2937',
    'heading_color': '#0f172a',
    'muted_color': '#6b7280',
    'link_color': '#2563eb',
    'focus_color': '#3b82f6',
    'background_color': '#ffffff',
    'surface_color': '#f9fafb',
    'border_color': '#e5e7eb',
    'row_alt_color': '#f3f4f6',
    'font_family': 'Inter',
    'font_size': '14px',
    'border_radius': 'md',
    'spacing_scale': 'normal',
    'shadow': 'md',
    'transition_speed': 'normal',
}
print(generate_css(flat))
" > /tmp/css_before.css

wc -l /tmp/css_before.css   # record this — should be roughly 150 lines pre-Path-B
```

After each phase's source edits, regenerate and diff:

```bash
python3 -c "<same script>" > /tmp/css_after_b1.css   # (or b2, b3, b4)
diff /tmp/css_before.css /tmp/css_after_b1.css | head -50
wc -l /tmp/css_after_b1.css
```

Each phase below specifies the expected line-count delta and a sanity check for the rule names introduced.

---

## Phase B1 — Refactor `generate_css()` + add per-role text/border classes

### B1.1 — Refactor (no behavior change)

Extract the existing logic in `generate_css()` (lines 63–148 today) into three module-level helpers, defined immediately above `generate_css()`:

- `_emit_root_block(g, lines)` — current lines 66–131 (the entire `:root { ... }` build, INCLUDING the optional `custom_css` append). End with `lines.append("")` to preserve the blank line that currently separates `:root` from the role-bg rules.
- `_emit_role_bg_classes(g, lines)` — current lines 132–141 (the `/* ── Default fg pairing for bare role classes ── */` comment and the for-loop emitting `.bg-{role}` rules). End with `lines.append("")`.
- `_emit_bg_themed(lines)` — current lines 143–147 (the `/* ── Dynamic-shade escape hatch ── */` comment and the two lines defining `.bg-themed`). No `g` parameter needed. No trailing blank line (this helper is last).

Reduce `generate_css()` to a thin orchestrator:

```python
def generate_css(payload: dict) -> str:
    """Build the full nce_theme.css content from a token payload dict."""
    g = payload.get
    lines = []
    _emit_root_block(g, lines)
    _emit_role_bg_classes(g, lines)
    _emit_bg_themed(lines)
    return "\n".join(lines)
```

**Verify B1.1:** regenerate `/tmp/css_after_b1.1.css` from the same fixture. `diff /tmp/css_before.css /tmp/css_after_b1.1.css` must show **zero differences** (or differ only in trailing whitespace).

### B1.2 — Add the new helper and wire it in

Add `_emit_role_text_border_classes(g, lines)` immediately after `_emit_role_bg_classes` in the file. Insert the call into `generate_css()` between `_emit_role_bg_classes` and `_emit_bg_themed`.

```python
def _emit_role_text_border_classes(g, lines):
    """Per-role text-color, border-color, and explicit fg variants.

    Emits, for each FG_ROLE the user has configured:
      .text-{role}            color: var(--nce-{var})
      .border-{role}          border-color: var(--nce-{var})
      .text-{role}-fg         color: var(--nce-{var}-fg)         (explicit, opt-in to override @layer)
      .text-{role}-fg-tonal   color: var(--nce-{var}-fg-tonal)   (tonal alternative)
    """
    lines.append("/* ── Per-role text/border + explicit fg classes ── */")
    for field, var in COLOR_FIELDS.items():
        if field not in FG_ROLES or not g(field):
            continue
        role = var.replace("color-", "")
        lines.append(f".text-{role} {{ color: var(--nce-{var}); }}")
        lines.append(f".border-{role} {{ border-color: var(--nce-{var}); }}")
        lines.append(f".text-{role}-fg {{ color: var(--nce-{var}-fg); }}")
        lines.append(f".text-{role}-fg-tonal {{ color: var(--nce-{var}-fg-tonal); }}")
    lines.append("")
```

Updated `generate_css()`:

```python
def generate_css(payload: dict) -> str:
    g = payload.get
    lines = []
    _emit_root_block(g, lines)
    _emit_role_bg_classes(g, lines)
    _emit_role_text_border_classes(g, lines)
    _emit_bg_themed(lines)
    return "\n".join(lines)
```

### B1 verification

```bash
python3 -c "<fixture script>" > /tmp/css_after_b1.css
diff /tmp/css_before.css /tmp/css_after_b1.css | grep -c '^>'   # expect 30 (28 rules + 1 comment + 1 blank)
grep -c '^\.text-primary ' /tmp/css_after_b1.css                 # expect 1
grep -c '^\.border-danger ' /tmp/css_after_b1.css                # expect 1
grep -c '^\.text-warning-fg-tonal ' /tmp/css_after_b1.css        # expect 1
python3 -m py_compile themes/utils/css_writer.py                 # exit 0
```

**Stop point.** Do not proceed to B2 until B1 verification passes.

---

## Phase B2 — Per-role per-curated-shade classes (245 rules)

Add `_emit_role_shade_classes(g, lines)` immediately after `_emit_role_text_border_classes`. Wire into `generate_css()` between `_emit_role_text_border_classes` and `_emit_bg_themed`.

```python
def _emit_role_shade_classes(g, lines):
    """Per-role per-curated-shade utility classes (bg auto-paired, text variants, border).

    For each role × each shade in CURATED_SHADES (100, 200, 300, 500, 600, 700, 900):
      .bg-{role}-{shade}         background-color + auto-paired color
      .text-{role}-{shade}       text-color only
      .text-{role}-{shade}-fg    explicit mono fg companion
      .text-{role}-{shade}-fg-tonal  tonal fg companion
      .border-{role}-{shade}     border-color only
    """
    lines.append("/* ── Per-role per-curated-shade utility classes ── */")
    for field, var in SHADE_SCALE_FIELDS.items():
        if not g(field):
            continue
        role = var.replace("color-", "")
        for shade in CURATED_SHADES:
            lines.append(
                f".bg-{role}-{shade} {{ "
                f"background-color: var(--nce-{var}-{shade}); "
                f"color: var(--nce-{var}-{shade}-fg); }}"
            )
            lines.append(f".text-{role}-{shade} {{ color: var(--nce-{var}-{shade}); }}")
            lines.append(f".text-{role}-{shade}-fg {{ color: var(--nce-{var}-{shade}-fg); }}")
            lines.append(f".text-{role}-{shade}-fg-tonal {{ color: var(--nce-{var}-{shade}-fg-tonal); }}")
            lines.append(f".border-{role}-{shade} {{ border-color: var(--nce-{var}-{shade}); }}")
    lines.append("")
```

Updated orchestrator:

```python
def generate_css(payload: dict) -> str:
    g = payload.get
    lines = []
    _emit_root_block(g, lines)
    _emit_role_bg_classes(g, lines)
    _emit_role_text_border_classes(g, lines)
    _emit_role_shade_classes(g, lines)
    _emit_bg_themed(lines)
    return "\n".join(lines)
```

### B2 verification

```bash
python3 -c "<fixture script>" > /tmp/css_after_b2.css
diff /tmp/css_after_b1.css /tmp/css_after_b2.css | grep -c '^>'   # expect 247 (245 rules + 1 comment + 1 blank)
grep -c '^\.bg-primary-100 ' /tmp/css_after_b2.css                 # expect 1
grep -c '^\.bg-secondary-700 ' /tmp/css_after_b2.css               # expect 1
grep -c '^\.text-danger-100-fg-tonal ' /tmp/css_after_b2.css       # expect 1
grep -c '^\.border-accent-300 ' /tmp/css_after_b2.css              # expect 1
grep -c '^\.bg-primary-400 ' /tmp/css_after_b2.css                 # expect 0 (400 is not curated)
python3 -m py_compile themes/utils/css_writer.py                   # exit 0
```

**Stop point.** Do not proceed to B3 until B2 verification passes.

---

## Phase B3 — Neutrals + semantic aliases (~12 rules)

Add `_emit_neutral_classes(g, lines)` immediately after `_emit_role_shade_classes`. Wire into `generate_css()` between `_emit_role_shade_classes` and `_emit_bg_themed`.

```python
def _emit_neutral_classes(g, lines):
    """Neutral surfaces, semantic chrome aliases, text roles, and border roles.

    Each rule is gated on the corresponding user-configured token. Semantic
    aliases (.bg-header, .text-text-header, .border-input-border,
    .border-input-focus) map to existing role tokens — if the design system
    later introduces dedicated --nce-color-header / --nce-color-input-* vars,
    swap the rule's RHS without changing the class name.
    """
    lines.append("/* ── Neutral surfaces, semantic chrome aliases, text/border roles ── */")
    if g("background_color"):
        lines.append(".bg-bg-page { background-color: var(--nce-color-bg); }")
    if g("surface_color"):
        lines.append(".bg-surface { background-color: var(--nce-color-surface); }")
        lines.append(".bg-card { background-color: var(--nce-color-surface); }")
    if g("row_alt_color"):
        lines.append(".bg-row-alt { background-color: var(--nce-color-row-alt); }")
    # Semantic chrome alias — header strip uses primary tokens until a dedicated
    # --nce-color-header is introduced.
    if g("primary_color"):
        lines.append(
            ".bg-header { background-color: var(--nce-color-primary); "
            "color: var(--nce-color-primary-fg); }"
        )
        lines.append(".text-text-header { color: var(--nce-color-primary-fg); }")
    if g("heading_color"):
        lines.append(".text-heading { color: var(--nce-color-heading); }")
    if g("muted_color"):
        lines.append(".text-muted { color: var(--nce-color-muted); }")
    if g("link_color"):
        lines.append(".text-link { color: var(--nce-color-link); }")
    # Default border (collides benignly with vanilla Tailwind .border — same
    # 1px solid shape, themed color).
    if g("border_color"):
        lines.append(
            ".border { border-width: 1px; border-style: solid; "
            "border-color: var(--nce-color-border); }"
        )
        lines.append(".border-input-border { border-color: var(--nce-color-border); }")
    if g("focus_color"):
        lines.append(".border-input-focus { border-color: var(--nce-color-focus); }")
    lines.append("")
```

Updated orchestrator:

```python
def generate_css(payload: dict) -> str:
    g = payload.get
    lines = []
    _emit_root_block(g, lines)
    _emit_role_bg_classes(g, lines)
    _emit_role_text_border_classes(g, lines)
    _emit_role_shade_classes(g, lines)
    _emit_neutral_classes(g, lines)
    _emit_bg_themed(lines)
    return "\n".join(lines)
```

### B3 verification

```bash
python3 -c "<fixture script>" > /tmp/css_after_b3.css
diff /tmp/css_after_b2.css /tmp/css_after_b3.css | grep -c '^>'   # expect ~14 (12 rules + 1 comment + 1 blank, assuming all tokens set)
grep -c '^\.bg-surface ' /tmp/css_after_b3.css                     # expect 1
grep -c '^\.bg-card ' /tmp/css_after_b3.css                        # expect 1
grep -c '^\.text-muted ' /tmp/css_after_b3.css                     # expect 1
grep -c '^\.bg-header ' /tmp/css_after_b3.css                      # expect 1
grep -c '^\.border-input-focus ' /tmp/css_after_b3.css             # expect 1
python3 -m py_compile themes/utils/css_writer.py                   # exit 0
```

**Stop point.** Do not proceed to B4 until B3 verification passes.

---

## Phase B4 — Shape, typography, spacing (~33 rules)

Add three helpers, in this order, immediately after `_emit_neutral_classes`. Wire all three into `generate_css()` between `_emit_neutral_classes` and `_emit_bg_themed`.

```python
def _emit_shape_classes(lines):
    """Border-radius, box-shadow, and transition-duration classes.

    Not gated — every theme has a border-radius and shadow value
    (defaults are emitted by _emit_root_block).
    """
    lines.append("/* ── Shape + motion classes ── */")
    lines.append(".rounded { border-radius: var(--nce-border-radius); }")
    lines.append(".rounded-sm { border-radius: calc(var(--nce-border-radius) * 0.5); }")
    lines.append(".rounded-md { border-radius: var(--nce-border-radius); }")
    lines.append(".rounded-lg { border-radius: calc(var(--nce-border-radius) * 1.5); }")
    lines.append(".rounded-xl { border-radius: calc(var(--nce-border-radius) * 2); }")
    lines.append(".shadow { box-shadow: var(--nce-shadow); }")
    lines.append(".shadow-theme { box-shadow: var(--nce-shadow); }")
    lines.append(".duration-theme { transition-duration: var(--nce-transition-speed); }")
    lines.append("")


def _emit_typography_classes(g, lines):
    """Font family + font size classes.

    .text-{size} (xs, sm, base, lg, xl, 2xl, 3xl, 4xl) — sizes the contract
    catalogues. Sits in the same namespace as .text-{role} but never collides
    because role names and size names don't overlap.
    """
    lines.append("/* ── Typography classes (font family + sizes) ── */")
    if g("font_family"):
        lines.append(".font-sans { font-family: var(--nce-font-family); }")
    if g("heading_font_family"):
        lines.append(".font-heading { font-family: var(--nce-font-heading); }")
    SIZE_MULTIPLIERS = [
        ("xs", "0.75"), ("sm", "0.875"),
        ("base", None),  # base uses the var directly (no calc)
        ("lg", "1.125"), ("xl", "1.25"),
        ("2xl", "1.5"), ("3xl", "1.875"), ("4xl", "2.25"),
    ]
    for name, mul in SIZE_MULTIPLIERS:
        if mul is None:
            lines.append(f".text-{name} {{ font-size: var(--nce-font-size); }}")
        else:
            lines.append(
                f".text-{name} {{ font-size: calc(var(--nce-font-size) * {mul}); }}"
            )
    lines.append("")


def _emit_spacing_classes(lines):
    """Uniform padding/margin/gap classes at xs/sm/md/lg/xl sizes.

    Directional variants (px-md, py-sm, pt-lg, etc.) are out of scope —
    downstream apps add their own Tailwind build if they need them.
    """
    lines.append("/* ── Spacing classes (uniform p/m/gap) ── */")
    SPACING_MULTIPLIERS = [
        ("xs", "0.25"), ("sm", "0.5"),
        ("md", None),  # md uses the var directly
        ("lg", "1.5"), ("xl", "2"),
    ]
    for name, mul in SPACING_MULTIPLIERS:
        if mul is None:
            v = "var(--nce-spacing-base)"
        else:
            v = f"calc(var(--nce-spacing-base) * {mul})"
        lines.append(f".p-{name} {{ padding: {v}; }}")
        lines.append(f".m-{name} {{ margin: {v}; }}")
        lines.append(f".gap-{name} {{ gap: {v}; }}")
    lines.append("")
```

Updated orchestrator (final shape):

```python
def generate_css(payload: dict) -> str:
    g = payload.get
    lines = []
    _emit_root_block(g, lines)
    _emit_role_bg_classes(g, lines)
    _emit_role_text_border_classes(g, lines)
    _emit_role_shade_classes(g, lines)
    _emit_neutral_classes(g, lines)
    _emit_shape_classes(lines)
    _emit_typography_classes(g, lines)
    _emit_spacing_classes(lines)
    _emit_bg_themed(lines)
    return "\n".join(lines)
```

### B4 verification

```bash
python3 -c "<fixture script>" > /tmp/css_after_b4.css
diff /tmp/css_after_b3.css /tmp/css_after_b4.css | grep -c '^>'   # expect ~36 (shape 8 + typo 10 + spacing 15 + 3 comments + 3 blanks)
grep -c '^\.rounded ' /tmp/css_after_b4.css                        # expect 1
grep -c '^\.rounded-xl ' /tmp/css_after_b4.css                     # expect 1
grep -c '^\.shadow-theme ' /tmp/css_after_b4.css                   # expect 1
grep -c '^\.duration-theme ' /tmp/css_after_b4.css                 # expect 1
grep -c '^\.text-base ' /tmp/css_after_b4.css                      # expect 1
grep -c '^\.text-4xl ' /tmp/css_after_b4.css                       # expect 1
grep -c '^\.p-md ' /tmp/css_after_b4.css                           # expect 1
grep -c '^\.gap-xl ' /tmp/css_after_b4.css                         # expect 1
# Spot-check that .text-{role} (B1) and .text-{size} (B4) coexist:
grep -c '^\.text-primary ' /tmp/css_after_b4.css                   # expect 1
grep -c '^\.text-sm ' /tmp/css_after_b4.css                        # expect 1
wc -l /tmp/css_after_b4.css                                        # expect ~470 lines total (~150 baseline + ~320 added)
python3 -m py_compile themes/utils/css_writer.py                   # exit 0
```

**Stop point.** Do not proceed to B5 until B4 verification passes and the diff inspection shows the rules are in the right order: `:root`, role-bg, role-text-border, role-shade, neutrals, shape, typography, spacing, bg-themed.

---

## Phase B5 — Publish + smoke-test (manual, no source changes)

This phase has no Python edits. It documents the deployment + verification steps the user runs.

1. **Publish** (user/deployment runs on the server):
   ```bash
   bench --site <site> execute themes.utils.css_writer.publish_theme --args "['<theme name>']"
   ```
   This calls `publish_theme()` which calls `generate_css()`, writes the result to `themes/public/css/nce_theme.css`, updates the css_hash on Site Theme Config, and clears Frappe cache.

2. **Browser smoke test** at the user's site (e.g. `manager.ncesoccer.com`):
   - Open DevTools → Network → CSS. Locate `/assets/themes/css/nce_theme.css`. Confirm HTTP 200 and Content-Length is ~10× the pre-Path-B value (was ~3 KB, now ~25–30 KB; gzip ~5 KB on the wire).
   - Open the file. Search for each of these strings and confirm presence: `.bg-primary {`, `.text-primary `, `.bg-primary-100 `, `.border-primary-300 `, `.bg-surface `, `.text-muted `, `.text-link `, `.rounded `, `.shadow-theme `, `.text-base `, `.p-md `, `.bg-header `, `.bg-themed `.
   - In Elements, on any plain `<div>` on the page, edit the class attribute to `class="bg-surface text-muted rounded p-md"`. Confirm: background changes to the surface color, child text changes to the muted color, corners round at the theme's border-radius, padding appears at the theme's spacing-base. Screenshot before/after.
   - Repeat with `class="bg-primary-100 border border-primary-300 rounded p-sm"` on another element. Confirm shade tint + bordered shape.

3. **Write `Themes/plans/phase-b5-results.md`** with:
   - `nce_theme.css` URL, size, and Last-Modified timestamp.
   - List of every class group confirmed via grep (Group A through F).
   - Before/after screenshot file paths for the two inspector tests.
   - Any class that didn't render (gap list).
   - Final decision line: `Path B complete — downstream apps can lean on the full contract.` OR `Gaps remain: <describe>`.

---

## Out-of-scope (do not add)

- **State variants** (`hover:bg-primary`, `focus:border-input-focus`, `active:bg-primary`). Would triple the rule count and require specificity-fighting against Frappe Desk's own `:hover` rules. Deferred.
- **Directional spacing** (`px-md`, `py-sm`, `pt-lg`, `mb-4`, etc.). Vanilla Tailwind ships dozens. Out of scope; downstream apps either use uniform `p-md` or their own Tailwind build.
- **Dark-mode variants** (`dark:bg-surface`). The Themes config has dark-mode support but Frappe Desk doesn't expose the selector globally. Out of scope.
- **Ring/focus-ring classes** (`ring-focus`). Needs a box-shadow trick that's awkward without specificity quirks. Deferred to a follow-up.
- **Layout utilities** (`.flex`, `.grid`, `.items-center`, `.w-full`). Vanilla Tailwind, not theme-aware. Out of scope.
- **Any `:root` var changes.** Path B is additive at the rule level only. If a class needs a var that doesn't exist (e.g. `--nce-color-header`), map the class to an existing var (`--nce-color-primary`) and document the alias intent in a code comment.

## Final file structure

After all four code phases, `themes/utils/css_writer.py` should have this top-level structure (everything else above line 60 — imports and constants — unchanged):

```
imports + constants  (lines 1–60, unchanged)

def _emit_root_block(g, lines): ...               # B1.1
def _emit_role_bg_classes(g, lines): ...          # B1.1
def _emit_role_text_border_classes(g, lines): ... # B1.2
def _emit_role_shade_classes(g, lines): ...       # B2
def _emit_neutral_classes(g, lines): ...          # B3
def _emit_shape_classes(lines): ...               # B4
def _emit_typography_classes(g, lines): ...       # B4
def _emit_spacing_classes(lines): ...             # B4
def _emit_bg_themed(lines): ...                   # B1.1 (last)

def generate_css(payload): ...                    # 11-line orchestrator
def _write_css_file(css): ...                     # unchanged
def publish_theme(theme_name): ...                # unchanged
```

Final rule count growth: ~320 new bare CSS rules. File size growth: ~3 KB → ~25–30 KB raw, ~5 KB gzipped.
