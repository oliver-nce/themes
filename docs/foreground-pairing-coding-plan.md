# Foreground Pairing — Coding Plan

Implementation plan for adding automatic foreground (text) tokens paired with every theme color role and curated shade. Each task below is self-contained — the executing coding agent reads only the file named and follows the instructions, no other context required.

---

## Summary

**Problem.** This Themes app emits role tokens (`--nce-color-primary`, shade scales `--nce-color-primary-100…950`) but no companion **foreground** tokens, and the Tailwind layer exposes only base roles, not shade stops. Consumer Vue components hardcode `color: white` against potentially-light backgrounds (e.g. `.btn` in `ThemePreviewPage.vue` line 482), producing unreadable buttons and header rows when the user picks a light secondary color.

**Solution.** Implement a paired-token design system:

1. For every role and every curated shade, compute two foreground colors at CSS-publish time — a *mono* (black or white by OKLCH lightness threshold) and a *tonal* (same hue, flipped lightness, reduced chroma).
2. Emit them as `--nce-color-{role}[-{shade}]-fg` and `--nce-color-{role}[-{shade}]-fg-tonal` CSS variables.
3. Expose them as Tailwind utilities in `tailwind.config.js`.
4. Ship `@layer components` defaults so bare `.bg-{role}` self-pairs with `.text-{role}-fg`.
5. Ship one dynamic escape-hatch utility `.bg-themed` for runtime-chosen shades.
6. Curated shade scale: **100, 200, 300, 500, 600, 700, 900** (7 stops).
7. Roles in scope: **primary, secondary, accent, success, info, warning, danger**.
8. Foreground threshold: **OKLCH L > 0.62 → `#0A0A0A`; else `#FFFFFF`**. Tonal: `L = clamp(1 - bg.L, 0.05, 0.95)`, `C = bg.C * 0.35`, same hue.

After this lands, authors write `class="bg-secondary text-secondary-fg"` or just `class="bg-secondary"` (auto-paired) and contrast is correct for every theme the user picks.

---

## Verification (run after all tasks complete)

1. Regenerate CSS: `bench --site <sitename> execute themes.utils.css_writer.publish_theme --args "['NCE Theme Default']"`.
2. Open `<site>/assets/themes/css/nce_theme.css` — confirm presence of `--nce-color-secondary-fg`, `--nce-color-secondary-300-fg`, `--nce-color-secondary-fg-tonal`, etc.
3. In `frontend/`, run `npm run build` — confirm Tailwind compiles without errors.
4. Load `/themes/theme-preview` — verify the new "Foreground Pairing" preview section renders with readable text on every swatch.
5. Change Secondary color in the Theme Editor to a light blue (e.g. `#A8C4FF`) — verify the Secondary button now shows dark text automatically.

---

## TASK 1 of 7: Add foreground-picker helpers (Python)

```
File: themes/utils/theme_color_utils.py

Read this file. After the existing _oklch_to_hex() function (ends near line 132), add two new helper functions:

def pick_fg_mono(hex_color: str) -> str:
    """Return '#0A0A0A' if hex_color is light enough for dark text, else '#FFFFFF'.
    Uses OKLCH lightness with threshold 0.62."""
    if not hex_color or len(hex_color) < 7:
        return "#FFFFFF"
    L, _, _ = _hex_to_oklch(hex_color)
    return "#0A0A0A" if L > 0.62 else "#FFFFFF"


def pick_fg_tonal(hex_color: str) -> str:
    """Return a same-hue tonal foreground: lightness flipped, chroma reduced to 35%."""
    if not hex_color or len(hex_color) < 7:
        return "#FFFFFF"
    L, C, h = _hex_to_oklch(hex_color)
    target_L = max(0.05, min(0.95, 1.0 - L))
    target_C = C * 0.35
    return _oklch_to_hex(target_L, target_C, h)


Do not change anything else in this file. After adding, run:
  python -c "from themes.utils.theme_color_utils import pick_fg_mono, pick_fg_tonal; print(pick_fg_mono('#A8C4FF'), pick_fg_tonal('#A8C4FF'))"
Expected: prints '#0A0A0A' and a dark blue tonal hex.
```

---

## TASK 2 of 7: Emit foreground tokens + escape-hatch CSS

```
File: themes/utils/css_writer.py

Read this file.

CHANGE 1. At the top of the file, the existing import statement reads:
  from themes.utils.theme_color_utils import (
      BORDER_RADIUS_MAP, SPACING_SCALE_MAP, LINE_HEIGHT_MAP,
      TRANSITION_MAP, _build_shadow, _generate_shades,
  )
Add `pick_fg_mono` and `pick_fg_tonal` to this import.

CHANGE 2. Define a constant near the top of the file (after the imports):

  CURATED_SHADES = (100, 200, 300, 500, 600, 700, 900)
  FG_ROLES = ("primary_color", "secondary_color", "accent_color",
              "success_color", "info_color", "warning_color", "danger_color")

CHANGE 3. Inside generate_css(), find the loop that emits the base role variables (the
"Theme: canonical variables" block, around lines 60-63). Immediately after that loop
(before the blank line at line 64), insert:

      # ── Foreground companions for each role ──
      for f, var in COLOR_FIELDS.items():
          if f not in FG_ROLES:
              continue
          v = g(f)
          if not v:
              continue
          lines.append(f"\t--nce-{var}-fg: {pick_fg_mono(v)};")
          lines.append(f"\t--nce-{var}-fg-tonal: {pick_fg_tonal(v)};")

CHANGE 4. Find the shade-scale loop (around lines 65-74). Inside the inner
`for shade_num, shade_hex in _generate_shades(...)` loop, AFTER the existing
`lines.append(f"\t--nce-{var}-{shade_num}: {shade_hex};")` line, add two more
lines so each shade also emits fg variants:

              lines.append(f"\t--nce-{var}-{shade_num}-fg: {pick_fg_mono(shade_hex)};")
              lines.append(f"\t--nce-{var}-{shade_num}-fg-tonal: {pick_fg_tonal(shade_hex)};")

CHANGE 5. At the very end of generate_css(), immediately before `return "\n".join(lines)`,
append a block of @layer components defaults plus the .bg-themed escape hatch. Add:

  lines.append("")
  lines.append("/* ── Default fg pairing for bare role classes ── */")
  for f, var in COLOR_FIELDS.items():
      if f not in FG_ROLES:
          continue
      if not g(f):
          continue
      lines.append(
          f".bg-{var.replace('color-', '')} {{ background-color: var(--nce-{var}); color: var(--nce-{var}-fg); }}"
      )
  lines.append("")
  lines.append("/* ── Dynamic-shade escape hatch ── */")
  lines.append(".bg-themed { background-color: var(--bg, var(--nce-color-primary));")
  lines.append("  color: oklch(from var(--bg, var(--nce-color-primary)) calc((l - 0.62) * -infinity) 0 0); }")

Do not change anything else. After editing, run:
  bench --site <sitename> execute themes.utils.css_writer.publish_theme --args "['NCE Theme Default']"
and grep the output file for "--nce-color-secondary-fg" — expect at least 8 matches
(one base + seven curated shades).
```

---

## TASK 3 of 7: Add foreground helpers (TypeScript mirror)

```
File: frontend/src/utils/color-shades.ts

Read this file. At the very end of the file (after the existing isDark() function
around line 269), add two exports that mirror the Python helpers exactly:

export function pickFgMono(hex: string): string {
  if (!hex || hex.length < 7) return "#FFFFFF";
  const { L } = hexToOklch(hex);
  return L > 0.62 ? "#0A0A0A" : "#FFFFFF";
}

export function pickFgTonal(hex: string): string {
  if (!hex || hex.length < 7) return "#FFFFFF";
  const { L, C, h } = hexToOklch(hex);
  const targetL = Math.max(0.05, Math.min(0.95, 1 - L));
  const targetC = C * 0.35;
  return oklchToHex(targetL, targetC, h);
}

Do not change anything else.
```

---

## TASK 4 of 7: Live-preview foreground injection

```
File: frontend/src/utils/theme-injector.ts

Read this file.

CHANGE 1. At the top, add an import:
  import { pickFgMono, pickFgTonal, generateShades } from "./color-shades"

CHANGE 2. Define a constant after the imports:
  const FG_ROLES = ["primary_color", "secondary_color", "accent_color",
                    "success_color", "info_color", "warning_color", "danger_color"] as const
  const CURATED_SHADES = [100, 200, 300, 500, 600, 700, 900] as const
  const ROLE_VAR: Record<string, string> = {
    primary_color: "color-primary", secondary_color: "color-secondary",
    accent_color: "color-accent", success_color: "color-success",
    info_color: "color-info", warning_color: "color-warning",
    danger_color: "color-danger",
  }

CHANGE 3. In the injectCSSVars() function (around lines 36-51), AFTER the existing
primary_color block, add a loop that writes fg companions and curated shades for every
role present in `settings`:

  for (const role of FG_ROLES) {
    const hex = settings[role]
    if (!hex) continue
    const v = ROLE_VAR[role]
    root.style.setProperty(`--nce-${v}-fg`, pickFgMono(hex))
    root.style.setProperty(`--nce-${v}-fg-tonal`, pickFgTonal(hex))
    const shades = generateShades(hex)
    for (const s of shades) {
      if (!CURATED_SHADES.includes(s.shade as 100)) continue
      root.style.setProperty(`--nce-${v}-${s.shade}`, s.hex)
      root.style.setProperty(`--nce-${v}-${s.shade}-fg`, pickFgMono(s.hex))
      root.style.setProperty(`--nce-${v}-${s.shade}-fg-tonal`, pickFgTonal(s.hex))
    }
  }

Do not change anything else.
```

---

## TASK 5 of 7: Expose new Tailwind utilities

```
File: frontend/tailwind.config.js

Read this file.

CHANGE 1. At the top of the file, after the existing imports, add helpers that
expand role × shade × variant entries:

  const ROLES = ["primary", "secondary", "accent", "success", "info", "warning", "danger"];
  const SHADES = [100, 200, 300, 500, 600, 700, 900];

  function buildColorMap() {
    const map = {};
    for (const r of ROLES) {
      map[`${r}-fg`] = `var(--nce-color-${r}-fg)`;
      map[`${r}-fg-tonal`] = `var(--nce-color-${r}-fg-tonal)`;
      for (const s of SHADES) {
        map[`${r}-${s}`] = `var(--nce-color-${r}-${s})`;
        map[`${r}-${s}-fg`] = `var(--nce-color-${r}-${s}-fg)`;
        map[`${r}-${s}-fg-tonal`] = `var(--nce-color-${r}-${s}-fg-tonal)`;
      }
    }
    return map;
  }

CHANGE 2. Inside theme.extend.colors (currently lines 20-41), at the end of the
object literal, spread the generated map so the new keys join existing ones:

      ...buildColorMap(),

CHANGE 3. Inside theme.extend.textColor (currently lines 42-47), at the end of the
object literal, also spread:

      ...buildColorMap(),

Do not change anything else. After editing, run:
  cd frontend && npm run build
and grep dist for "secondary-300-fg" to confirm a utility was generated.
```

---

## TASK 6 of 7: Add a Foreground Pairing showcase to the preview page

```
File: frontend/src/pages/ThemePreviewPage.vue

Read this file.

CHANGE 1. In the <template>, immediately AFTER the existing "Colour Palette" <section>
block (which ends with </section> on the line after the swatch loop, near line 49),
insert a new <section>:

      <section>
        <h2 class="section-label">Foreground Pairing — Mono & Tonal</h2>
        <div class="preview-surface rounded-xl p-6 space-y-4">
          <div v-for="role in fgRoles" :key="role" class="space-y-1">
            <div class="text-xs preview-muted uppercase tracking-wider">{{ role }}</div>
            <div class="flex flex-wrap gap-2">
              <span v-for="stop in fgStops" :key="`${role}-${stop}`"
                    :class="[stop === 'base' ? `bg-${role}` : `bg-${role}-${stop}`,
                             stop === 'base' ? `text-${role}-fg` : `text-${role}-${stop}-fg`]"
                    class="px-3 py-1.5 rounded text-xs font-medium">
                {{ stop === 'base' ? '600' : stop }} mono
              </span>
              <span v-for="stop in fgStops" :key="`${role}-${stop}-tonal`"
                    :class="[stop === 'base' ? `bg-${role}` : `bg-${role}-${stop}`,
                             stop === 'base' ? `text-${role}-fg-tonal` : `text-${role}-${stop}-fg-tonal`]"
                    class="px-3 py-1.5 rounded text-xs font-medium">
                {{ stop === 'base' ? '600' : stop }} tonal
              </span>
            </div>
          </div>
        </div>
      </section>

CHANGE 2. In the <script setup>, near the other const data declarations (around
line 358), add:

  const fgRoles = ["primary", "secondary", "accent", "success", "info", "warning", "danger"]
  const fgStops = ["base", 100, 300, 500, 700, 900]

CHANGE 3. In the <style scoped> block, REMOVE the hardcoded `color: white;` from
the .btn rule (currently around line 482) so the new bg-* default pairing can show
through. The line to delete is exactly:
  color: white;

CHANGE 4. In the same <style scoped> block, DELETE the manual warning override
(currently around line 504):
  .btn-warning { background-color: var(--nce-color-warning, #f59e0b); color: #1f2937; }
And REPLACE it with:
  .btn-warning { background-color: var(--nce-color-warning, #f59e0b); color: var(--nce-color-warning-fg, #1f2937); }

Do not change anything else in this file.
```

---

## TASK 7 of 7: Update the contract document

```
File: THEME_CLASS_CONTRACT.json

Read this file.

CHANGE 1. For each color role under "color_roles" (primary, secondary, accent,
success, info, warning, danger), change the "status" field inside
"foreground_mono" and "foreground_tonal" from "proposed" to "shipping".

CHANGE 2. For each "shade_scale" entry under "color_roles", change "status" from
"var-only" to "shipping (curated: 100, 200, 300, 500, 600, 700, 900)" and add a
"note" key: "Other stops remain var-only — use :style with var() if needed."

CHANGE 3. Under "examples_for_authors", DELETE the key
"primary_button_after_fg_lands" and rename "primary_button_today" to
"primary_button" with new value:
  "<button class=\"bg-primary rounded px-md py-sm\">Primary</button>"
(note: text-* class no longer required — @layer components default pairs it).

CHANGE 4. Add a new top-level key after "neutral_roles":
  "escape_hatch": {
    "themed_bg": {
      "class": "bg-themed",
      "purpose": "Single class accepting a runtime --bg CSS variable. Foreground is computed live via OKLCH relative color and follows whatever --bg resolves to.",
      "usage": "<button class=\"bg-themed\" :style=\"{ '--bg': 'var(--nce-color-primary-300)' }\">Dynamic</button>",
      "status": "shipping",
      "browser_support": "Chromium 119+, Safari 16.4+, Firefox 128+"
    }
  }

Do not change anything else.
```

---

## Task order

Run tasks 1 → 7 in order. Tasks 1 and 3 (adding helpers) must complete before tasks 2 and 4 (which import those helpers). Task 5 (Tailwind config) must complete before task 6 (preview page references the new classes). Task 7 (contract update) runs last so the document reflects what actually shipped.
