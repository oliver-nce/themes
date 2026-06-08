# Greyscale (Neutral Role) — Coding Brief

## Goal

Add a `neutral` color role to the NCE Theme system, alongside `primary`, `secondary`, `accent`, and the state roles. Default base = `#9CA3AF` pinned at stop 600. Slider set is **gamma + warmth** (warmth replaces saturation). Scale uses its own Bezier-smoothed lightness targets, NOT the brand-color targets, because pinning a light base at stop 600 with the existing targets produces a visible cliff between 600 and 700 and a squashed dark end.

The brand-color path (primary/secondary/accent/state roles) is untouched. Neutral is a sibling code path inside the same role-generation machinery.

## Locked design parameters

### Default base
- `neutral_color` default hex = `#9CA3AF` (Tailwind gray-400 equivalent; OKLCH L≈0.68, C≈0.022, h≈251°).
- Pinned at scale stop 600.

### Neutral-specific lightness targets

The brand-color `_SHADE_TARGETS` table at `themes/utils/theme_color_utils.py:183-195` and its TS twin at `frontend/src/utils/color-shades.ts:123-135` are NOT reused. Neutral has its own table.

Targets are derived from a quadratic Bezier curve through three control points: (pos 0.0, L 0.985), (pos 0.6, L 0.680), (pos 1.0, L 0.170), with control weight c = 0.961. The formula:

```
L(t) = (1−t)² × 0.985  +  2 × (1−t) × t × 0.961  +  t² × 0.170
```

Evaluated at `t = stop_index / 10` for the 11 stops:

| Stop | t    | L target |
|------|------|----------|
| 50   | 0.0  | 0.985    |
| 100  | 0.1  | 0.973    |
| 200  | 0.2  | 0.945    |
| 300  | 0.3  | 0.902    |
| 400  | 0.4  | 0.843    |
| 500  | 0.5  | 0.769    |
| 600  | 0.6  | 0.680 (pinned to user base hex) |
| 700  | 0.7  | 0.576    |
| 800  | 0.8  | 0.456    |
| 900  | 0.9  | 0.321    |
| 950  | 1.0  | 0.170    |

Per-stop L deltas grow gradually from 0.012 at the light end to 0.151 at the dark end — smooth curve, no cliffs, well-spread darks. These values were validated visually against the broken (brand-targets-applied-to-neutral) version and accepted.

Implement as a constant (do not recompute Bezier at runtime):

```python
_NEUTRAL_SHADE_TARGETS = [
    (50, 0.985), (100, 0.973), (200, 0.945), (300, 0.902),
    (400, 0.843), (500, 0.769), (600, 0.680), (700, 0.576),
    (800, 0.456), (900, 0.321), (950, 0.170),
]
```

```ts
const NEUTRAL_SHADE_TARGETS: Array<{ shade: number; l: number }> = [
  { shade: 50, l: 0.985 }, { shade: 100, l: 0.973 }, { shade: 200, l: 0.945 },
  { shade: 300, l: 0.902 }, { shade: 400, l: 0.843 }, { shade: 500, l: 0.769 },
  { shade: 600, l: 0.680 }, { shade: 700, l: 0.576 }, { shade: 800, l: 0.456 },
  { shade: 900, l: 0.321 }, { shade: 950, l: 0.170 },
];
```

### Warmth slider

Replaces saturation for this one role.

- Field: `neutral_color_warmth` (Int, range −100 to +100, default 0).
- UI: center-zero slider (different visual control from the existing 0–200 saturation slider on primary/secondary).
- Math:
  - `hue = (warmth >= 0) ? 60.0 : 250.0` (single pinned warm hue and single pinned cool hue — NOT a continuous sweep)
  - `chroma_scale = abs(warmth) / 100.0`
  - `base_chroma = chroma_scale × NEUTRAL_MAX_CHROMA` where `NEUTRAL_MAX_CHROMA = 0.025`
  - At `warmth == 0`: `base_chroma = 0`, hue irrelevant, scale is pure neutral grays
  - Stop 600 is ALWAYS pinned to the user's saved base hex, regardless of warmth — at warmth=0 the 600 swatch may still show a tint if the user's base hex isn't pure neutral. This is acceptable per the locked design.

Chroma at each stop is the global `base_chroma` (not per-stop modulated), then run through the existing `_max_chroma_in_gamut` cap and `_extreme_chroma_scale` adjustment for parity with the brand-color path.

### Gamma slider

Mirrors primary/secondary exactly. Same range, same `_lightness_with_gamma` math. Field: `neutral_color_gamma` (Int, default 0).

The gamma curve operates on the `_NEUTRAL_SHADE_TARGETS` table, not the brand table.

### Foreground pairing

- `theme-text-neutral-fg` (mono) — ships, works correctly via existing `pick_fg_mono`. Light stops (50–500, L > 0.62) pair to `#0A0A0A`; dark stops (600–950, L < 0.62) pair to `#FFFFFF`.
- `theme-text-neutral-fg-tonal` — ships for API symmetry but at low chroma reads near-mono. Document in `THEME_CLASS_CONTRACT.json` neutral block with a note that authors should prefer `-fg-mono` on neutral surfaces.

## Files touched

Follows the 9-step recipe at `docs/theme-system/08-extending.md:11-23`. Step-by-step with the neutral-specific divergences called out:

### 1. NCE Theme doctype
File: `themes/themes/doctype/nce_theme/nce_theme.json`

Add three fields:
- `neutral_color` (Color, default `#9CA3AF`)
- `neutral_color_gamma` (Int, default 0)
- `neutral_color_warmth` (Int, default 0) *[divergence from recipe step 1 — recipe says `_saturation`]*

### 2. Python color math
File: `themes/utils/theme_color_utils.py`

Add:
- `_NEUTRAL_SHADE_TARGETS` constant (table above, line ~196)
- `NEUTRAL_MAX_CHROMA = 0.025` constant
- `NEUTRAL_WARM_HUE = 60.0` and `NEUTRAL_COOL_HUE = 250.0` constants
- `_generate_neutral_shades(base_hex, gamma=0, warmth=0, pin_600_to_base=True)` — parallel to `_generate_shades` (line 236) but uses `_NEUTRAL_SHADE_TARGETS`, derives chroma from warmth/`NEUTRAL_MAX_CHROMA` instead of `_base_chroma_at_600(hue) * (saturation/100)`, picks hue from warmth sign
- `_effective_neutral_hex(base_hex, gamma=0, warmth=0)` — parallel to `_effective_role_hex` (line 262), uses the new generator

Split the existing constant:
- Rename `GAMMA_SAT_ROLE_FIELDS` (line 233) to keep covering primary + secondary
- Add a sibling `GAMMA_WARMTH_ROLE_FIELDS = frozenset({"neutral_color"})`

### 3. CSS writer
File: `themes/utils/css_writer.py`

- Add `"neutral_color": "color-neutral"` to:
  - `COLOR_FIELDS` (line 63)
  - `SHADE_SCALE_FIELDS` (line 82)
  - `FG_ROLES` (line 46-49)
- Add `neutral_color_gamma`, `neutral_color_warmth` to `MIGRATED_FIELDS` (line 86-91) so they round-trip via `theme_json`
- Add the same two field names to `TOKEN_FIELDS` (line 91) so they reach the SPA payload
- In whichever `_emit_*` helper generates per-role shade output (it's the one consuming `_generate_shades`), branch on role: if role is `neutral_color`, call `_generate_neutral_shades(base, gamma, warmth)` instead of `_generate_shades(base, gamma, saturation)`. Otherwise keep existing behavior.

### 4. TS color math
File: `frontend/src/utils/color-shades.ts`

Mirror everything from step 2:
- `NEUTRAL_SHADE_TARGETS` constant (line ~140, parallel to `SHADE_TARGETS` line 123)
- `NEUTRAL_MAX_CHROMA`, `NEUTRAL_WARM_HUE`, `NEUTRAL_COOL_HUE` constants
- `generateNeutralShades(baseHex, options?: { gamma?: number; warmth?: number })`
- `effectiveNeutralHex(hex, gamma=0, warmth=0)`

Lock-step parity with Python is mandatory per `08-extending.md:54-58` — same numbers in, same hexes out, otherwise the SPA preview and the published CSS diverge.

### 5. Runtime injector
File: `frontend/src/utils/theme-injector.ts`

- Add `"neutral_color"` to `FG_ROLES`
- Add `"neutral_color"` to `ROLE_VAR` map (with value `"color-neutral"`)

### 6. SPA Tailwind config
File: `frontend/tailwind.config.js`

- Add `"neutral"` to the `ROLES` array (line 8-16). The `buildColorMap()` helper (line 19-31) picks it up automatically and generates `neutral-fg`, `neutral-fg-tonal`, `neutral-{shade}`, `neutral-{shade}-fg`, `neutral-{shade}-fg-tonal` entries.
- `buildFgSafelist` (line 33-46) picks `neutral` up via the same `ROLES` iteration — no separate addition needed.

### 7. Class contract
File: `THEME_CLASS_CONTRACT.json`

Add a `neutral` block under `color_roles` (after `danger`, lines ~82-89), mirroring the structure of `primary`. Include all 5 emitted classes (`background_class`, `text_class`, `border_class`, `foreground_mono`, `foreground_tonal`) plus `shade_scale`. Set every `status` to `shipping`.

In the role metadata, add:
- A `tuning_model` field with value `"gamma+warmth"` (vs `"gamma+saturation"` for primary/secondary) so downstream agents can reason about it
- A note on `foreground_tonal` that it reads near-mono at low chroma; authors should prefer `foreground_mono`

### 8. Documentation
Three files:

`docs/theme-classes-reference.md` — add a `neutral` row to the Color Roles table with the same column structure as the others.

`docs/theme-system/03-color-roles.md` — add a Neutral section describing semantics: "Page-level body content, structural backgrounds, dividers, mid-tone surfaces. Use neutral when the element shouldn't carry brand or state meaning."

`docs/theme-system/04-shade-scale.md` — add a paragraph after the existing scale section noting that neutral uses its own `_NEUTRAL_SHADE_TARGETS` table with Bezier-smoothed targets, and that warmth replaces saturation as the chroma control for this one role. Reference this file (`plans/greyscale-coding.md`) for the rationale.

### 9. Editor SPA UI
File: `frontend/src/pages/ThemeSettingsPage.vue`

In the Colours tab block (lines ~162-251), add a Neutral section after the Secondary section. Mirror Secondary's layout, with two adjustments:

1. Replace the saturation slider component (whatever component handles `secondary_color_saturation`) with a center-zero warmth slider. If the existing slider component supports a `:center-zero` prop or symmetric range, use it; otherwise scaffold a new `WarmthSlider.vue` or similar. The control reads −100 (cool) to +100 (warm) with 0 at center, the readout displays both numeric value and a "cool / neutral / warm" label.
2. Add `"neutral_color"`, `"neutral_color_gamma"`, `"neutral_color_warmth"` to the `ALL_FIELDS` array (line 807).

Live-preview wiring: the `computeCSSVariables()` function (around line 769-789) iterates over the role list to emit `--nce-color-{role}` and shade variants. Adding neutral to the role iteration is sufficient because the runtime injector (step 5) reads from the same source.

## Verification

After implementation:

1. **Python ⇄ TS parity test.** With `base=#9CA3AF`, `gamma=0`, `warmth=0`, both `_generate_neutral_shades` and `generateNeutralShades` must produce the exact L values in the table above (within ±0.005 rounding). Run a quick comparison script.
2. **Pinned 600 holds.** With any base hex, the stop-600 entry in the generated scale equals the input hex uppercased.
3. **Warmth=0 produces pure neutral.** Stops other than 600 have C < 0.001 in OKLCH when warmth is 0, regardless of base hex hue/chroma.
4. **Warmth=+100 tints warm, warmth=−100 tints cool.** Stops other than 600 have hue ≈ 60° at +100 and ≈ 250° at −100, with C ≈ 0.025 at mid stops.
5. **Dark-end differentiation.** Stops 700, 800, 900, 950 produce visibly distinct hexes (each pair differs by at least ~10 in any RGB channel at warmth=0).
6. **Foreground pairing.** `theme-text-neutral-fg` resolves to `#0A0A0A` for stops 50–500 and `#FFFFFF` for stops 600–950.
7. **Smoke test in editor.** Open `/themes/theme-settings`, switch to Colours tab, find Neutral section. Default values display, gamma slider moves the curve, warmth slider tints the scale, Save publishes the new CSS, hard-reload of `/themes/preview` shows neutral classes rendering correctly.
8. **Publish + republish.** `bench --site <site> execute themes.utils.css_writer.publish_theme --args "['NCE Theme Default']"` regenerates `nce_theme.css` with `.theme-bg-neutral`, `.theme-text-neutral`, `.theme-border-neutral`, and all 11 shade variants.

## Out of scope (this work)

- Modifying the brand-color shade table. Primary, secondary, accent, success, info, warning, danger keep their existing `_SHADE_TARGETS`.
- Adding warmth as an option to other roles. Warmth is neutral-only; the other roles keep gamma+saturation.
- A "tint hue" continuous sweep variant. The locked design uses two pinned hues (60° and 250°) only.
- Per-stop chroma modulation. The locked design uses a global chroma scale across all stops.
- Adding neutral to the `button_hierarchy` block in `THEME_CLASS_CONTRACT.json`. Neutral is for surfaces and structural elements, not buttons — neutral-as-button-fill is not part of this work.

## Reference

Locked decisions captured during the design session on 2026-06-06. See conversation history for the visual comparisons (existing brand scale applied to `#9CA3AF` vs the Bezier-smoothed neutral scale) that validated the L targets and the warmth model.
