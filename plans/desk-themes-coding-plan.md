# Desk Themes — Phased Coding Plan

## Goal

Ship a second SPA at `/desk-themes/*` that manages "NCE Desk Theme" records and publishes `nce_desk_theme.css` — a site-wide stylesheet that overrides Frappe's built-in `:root` custom properties to repaint Desk chrome (navbar accent, page bg, borders, button defaults, radius, Gantt). Full CRUD + base/Active lifecycle mirroring the existing NCE Theme system.

The new SPA is purely additive: nothing in the existing `/themes/*` editor or its data model changes.

## Locked architecture (from prior discussion)

- **Two SPAs, one frontend build.** New `/desk-themes/*` routes alongside `/themes/*` in `frontend/`. Shared `App.vue` shell, shared components, shared save plumbing.
- **Two DocTypes, fully independent records.** `NCE Theme` unchanged. New `NCE Desk Theme` mirrors its shape.
- **Two CSS files, both site-wide.** `app_include_css` becomes `[nce_theme.css, nce_desk_theme.css, theme-swatch-picker.css]`.
- **Two Site Theme Config slots.** Add `base_desk_theme` Link field; switching one doesn't touch the other.
- **Two Apps-screen tiles.** "Themes" (existing) and "Desk Themes" (new).
- **Independent active state.** A site can have an Active NCE Theme and an Active Desk Theme at the same time.

## Mirror map

| Existing (NCE Theme) | New (Desk Theme) |
|---|---|
| `themes/themes/doctype/nce_theme/` | `themes/themes/doctype/nce_desk_theme/` |
| `themes/themes/page/theme_editor/` | `themes/themes/page/desk_theme_editor/` |
| `themes/utils/css_writer.py` | `themes/utils/desk_css_writer.py` |
| `themes/utils/default_theme.py` | `themes/utils/default_desk_theme.py` |
| `themes/utils/data/base_theme.json` | `themes/utils/data/base_desk_theme.json` |
| `themes/api.py` (NCE methods) | `themes/api.py` (additional Desk methods, same file) |
| `frontend/src/pages/HomePage.vue` | `frontend/src/pages/DeskThemeHomePage.vue` |
| `frontend/src/pages/ThemeSettingsPage.vue` | `frontend/src/pages/DeskThemeSettingsPage.vue` |
| `frontend/src/pages/ThemePreviewPage.vue` | `frontend/src/pages/DeskThemePreviewPage.vue` |
| `frontend/src/composables/useTheme.ts` | `frontend/src/composables/useDeskTheme.ts` |

The mirror is mechanical — wherever a method/file says `theme`/`Theme`, the new one says `desk_theme`/`Desk Theme`.

## Field inventory (the ~22 Desk fields)

Grouped to match the tab layout the SPA will use.

**Colors** (12 fields)
`--primary-color`, `--brand-color`, `--bg-color`, `--fg-color`, `--text-color`, `--text-muted`, `--text-light`, `--border-color`, `--dark-border-color`, `--control-bg`, `--control-bg-on-gray`, `--btn-default-bg`, `--awesomplete-hover-bg`

**Shape** (4 fields)
`--btn-height`, `--border-radius`, `--border-radius-lg`, `--border-radius-full`

**Gantt** (6 fields)
`--g-bar-color`, `--g-bar-border`, `--g-progress-color`, `--g-header-background`, `--g-row-color`, `--g-today-highlight`

All 22 are CSS custom properties Frappe already declares at `:root` and consumes throughout Desk. Overriding them at `:root` from `app_include_css` is the cleanest possible override path — no `!important`, no specificity fight (per the cascade verification doc).

## Phases

Each phase is self-contained and ends at a stop point. Run the verify step before moving on. Phases are designed so the SPA does not appear until late — the backend lands first.

---

### Phase 1 — DocType + Site Theme Config field

**Files**
- New: `themes/themes/doctype/nce_desk_theme/__init__.py`
- New: `themes/themes/doctype/nce_desk_theme/nce_desk_theme.json`
- New: `themes/themes/doctype/nce_desk_theme/nce_desk_theme.py`
- Edit: `themes/themes/doctype/site_theme_config/site_theme_config.json` — add `base_desk_theme` Link field (Link → `NCE Desk Theme`)
- New: `themes/patches/v1_0/add_base_desk_theme_field.py` (no-op if column exists — covers fresh installs vs upgrades)
- Edit: `themes/patches.txt` to register the patch

**What**
Mirror `NCE Theme` exactly. Fields: `theme_name` (Data, unique), `slug` (Data, unique, auto-set from `theme_name`), `is_default` (Check), `status` (Select: Active/Inactive, default Inactive), `description` (Small Text), `theme_json` (Long Text / JSON store of the 22 field values).

**Key decisions**
- Slug field exists for parity even though Desk Themes never get a `data-nce-desk-theme="<slug>"` scoped block on Desk pages (you can't wrap Desk's DOM). Keep it so save-as-base / rename flows mirror.
- Only one Desk Theme can have `status=Active` at a time — enforce in `nce_desk_theme.py:validate()` (mirror the equivalent NCE constraint if present, else copy the pattern).

**Verify**
- `bench --site <site> migrate`
- `bench --site <site> list-apps` shows themes
- Confirm `NCE Desk Theme` listed at `/app/nce-desk-theme`
- Confirm `base_desk_theme` field renders on `Site Theme Config` form

**Depends on:** none

---

### Phase 2 — Default payload + bundled defaults

**Files**
- New: `themes/utils/default_desk_theme.py` — single dict constant `DESK_THEME_DEFAULT_PAYLOAD` holding Frappe v15 default values for the 22 fields (sourced from `Frappe Context/theming_css_systems.md:63-69, 849-862, 802-809`)
- New: `themes/utils/data/base_desk_theme.json` — same payload as JSON for fresh-install bundling
- Edit: `themes/install.py` — add `_ensure_default_desk_theme()` parallel to `_ensure_default_theme()`, call from `after_install()`

**What**
Authoritative defaults so every fresh install gets a "Default Desk Theme" record that matches Frappe's stock appearance. Switching Active back to this Theme = "revert to Frappe defaults."

**Key decisions**
- Hex literals only (no NCE roles, no var refs) — Desk Themes are a closed system, no cross-import with NCE Themes.
- Source values from documented Frappe defaults; do not invent.

**Verify**
On a fresh test site after `bench install-app themes`:
- `NCE Desk Theme` named "Default" exists, `is_default=1`, `status=Active`
- `Site Theme Config.base_desk_theme = Default`

**Depends on:** 1

---

### Phase 3 — CSS writer module + hooks wiring

**Files**
- New: `themes/utils/desk_css_writer.py` — implements:
  - `_emit_desk_var_block(payload, selector=":root")` → list of `--var: value;` lines for the 22 fields
  - `generate_desk_css(base_theme_name, active_theme_names)` → full file content (base in `:root`, optional Active themes appended; see decision below)
  - `publish_desk_theme(theme_name=None)` → write `themes/public/css/nce_desk_theme.css` + sidecar `.hash` file (mirror `publish_theme` pattern)
- Edit: `themes/hooks.py:42` — add the new file to `app_include_css` with the same cache-bust helper pattern (`_nce_desk_theme_css_url()` next to the existing `_nce_theme_css_url()`)

**What**
The publish path that turns saved `theme_json` into a `:root { --primary-color: …; … }` block in a new stylesheet, served on every Desk page.

**Key decisions**
- **No scoped blocks for Desk themes** beyond `:root`. You can't add `data-nce-desk-theme` to the Frappe Desk shell — there's no hook for it. So only the base/Active theme contributes to the file. If the user wants to A/B preview, they switch Active and republish; no per-element scoping. This is a deliberate divergence from NCE Themes' multi-palette model.
- No class selectors, no `!important`. Pure `:root { … }` overrides.
- No custom_css escape hatch in v1 (kept under Advanced tab if added later — see "Decisions deferred").

**Verify**
- `bench --site <site> execute themes.utils.desk_css_writer.publish_desk_theme`
- Confirm `themes/public/css/nce_desk_theme.css` exists and contains a `:root { … }` block with the 22 vars
- Hit `https://<site>/assets/themes/css/nce_desk_theme.css` in browser → 200 with the right content
- DevTools on `/app/home`: inspect `<html>`, confirm `--primary-color` reflects the saved value

**Depends on:** 2

---

### Phase 4 — Backend API methods

**Files**
- Edit: `themes/api.py` — append parallel whitelisted methods:
  - `get_desk_theme_editor(theme: str)`
  - `get_base_desk_theme_editor()`
  - `get_active_desk_theme_editor()`
  - `get_base_desk_theme_payload()`
  - `save_desk_theme(theme, payload, status=None)`
  - `save_active_desk_theme(payload)`
  - `create_desk_theme(theme_name, payload)`
  - `set_base_desk_theme(theme)`
  - `save_as_base_desk_theme(theme, password)`
  - `set_active_desk_theme(theme)`
  - `list_desk_themes()`
  - `rename_desk_theme(old, new)`
  - `delete_desk_theme(theme)`
  - `regenerate_desk_theme_css()`

**What**
Mirror the NCE Theme API surface 1:1. Each method delegates to `desk_css_writer.publish_desk_theme()` after persisting, exactly as the existing methods delegate to `publish_theme()`.

**Key decisions**
- Live in the same `api.py` file (not a separate module) — keeps deployment simple and matches the existing convention of one whitelisted-API module per app.
- Same password-gated pattern for `save_as_base_desk_theme` (uses existing `_require_password()` helper).
- Use the same `_parse_payload` / `_theme_editor_response` helpers — generalize them if needed (small refactor) or duplicate them with `_desk_` prefix (zero risk to existing NCE flow).

**Verify**
- `bench --site <site> console`:
  - `frappe.call("themes.api.list_desk_themes")` → returns `[{"name": "Default", "status": "Active", ...}]`
  - `frappe.call("themes.api.get_active_desk_theme_editor")` → returns the payload

**Depends on:** 3

---

### Phase 5 — SPA routing + nav + Web Page mount

**Files**
- Edit: `frontend/src/router.ts` — add 3 routes:
  - `/desk-themes` → `DeskThemeHomePage`
  - `/desk-themes/theme-settings` → `DeskThemeSettingsPage`
  - `/desk-themes/preview` → `DeskThemePreviewPage` (`meta: { standalone: true }`)
- New: `frontend/src/pages/DeskThemeHomePage.vue` (placeholder — links to settings + preview; mirror `HomePage.vue` shape)
- Edit: `frontend/src/App.vue` — sidebar shows two grouped sections: "Themes" (existing two links) and "Desk Themes" (new two links). Section labels can be `<div class="text-xs font-semibold uppercase text-gray-400 px-3 pt-4 pb-1">` separators above each group.
- Edit: `themes/hooks.py:47-49` — `website_route_rules` already covers `/themes/<path>`; add a second rule for `/desk-themes/<path>` → `themes` (the same Web Page template; the Vue router handles the rest)

**What**
The SPA is reachable at the new URL prefix, lands on a stub home page, and the sidebar shows both top-level apps.

**Key decisions**
- One Web Page template (`themes/www/themes.html`) serves both prefixes — Vue router picks the right component. Confirmed: `themes.html` already mounts `#app` and loads the SPA bundle; no per-route template work needed.
- Sidebar gets section headers rather than two separate sidebars — single shell is the whole point of "one frontend build."

**Verify**
- `cd frontend && npm run build && bench build --app themes && bench restart`
- Hit `/desk-themes` → lands on the home page
- Sidebar shows both groups
- `/desk-themes/theme-settings` and `/desk-themes/preview` route correctly (component stubs are fine for now)

**Depends on:** 4

---

### Phase 6 — Desk-side tile + Desk Page redirect

**Files**
- Edit: `themes/hooks.py:51-58` — add a second entry to `add_to_apps_screen`:
  ```python
  {
      "name": "desk-themes",
      "logo": "/assets/themes/images/logo.jpg",
      "title": "Desk Themes",
      "route": "/app/desk-theme-editor",
  }
  ```
  (Use a distinct logo if you have one; reuse for now.)
- New: `themes/themes/page/desk_theme_editor/desk_theme_editor.js` — single-line redirect:
  ```js
  frappe.pages["desk-theme-editor"].on_page_load = function () {
      window.location.href = "/desk-themes/theme-settings";
  };
  ```
- New: `themes/themes/page/desk_theme_editor/desk_theme_editor.json` — mirror the existing `theme_editor.json`

**What**
Symmetric Desk entry point. Users see two tiles on the Apps screen ("Themes" and "Desk Themes"), each landing in its own SPA.

**Verify**
- After `bench migrate + restart`: both tiles render on `/apps`
- Click "Desk Themes" tile → lands at `/desk-themes/theme-settings`

**Depends on:** 5

---

### Phase 7 — DeskThemeSettingsPage.vue (the editor)

**Files**
- New: `frontend/src/pages/DeskThemeSettingsPage.vue`

**What**
Copy `ThemeSettingsPage.vue` wholesale, then:
1. Replace the `ALL_FIELDS` array (line ~807) with the 22 Desk field names from the inventory.
2. Replace `tabs` (line ~799) with: `colors`, `shape`, `gantt`, `advanced`, `system`.
3. Rewrite each tab's `<div v-show="activeTab === '…'">` block to render the right field set:
   - Colors: 13 `BrandColorPicker`/`SwatchPicker` instances bound to color fields
   - Shape: 4 number/select inputs (btn-height: px input; radius fields: px input)
   - Gantt: 6 `SwatchPicker` instances
   - Advanced: empty in v1 (see Decisions deferred)
   - System: identical to existing — password-gated `Save as base Desk Theme`
4. Repoint every API call:
   - `themes.api.get_active_theme_editor` → `themes.api.get_active_desk_theme_editor`
   - `themes.api.save_theme` → `themes.api.save_desk_theme`
   - …same mechanical replace for every NCE method → Desk method
5. Rename the dirty-tracking state, the confirm dialog copy, the page title.

**Key decisions**
- Don't try to share a base component between the two settings pages in v1. Copy is faster, lower risk, and the divergence (different fields, different API names, different preview target) makes a shared base premature. Refactor to a shared base later if both pages prove stable.
- Reuse `BrandColorPicker.vue` and `SwatchPicker.vue` as-is — they're field-agnostic, just bound to whatever color field you pass.

**Verify**
- Load `/desk-themes/theme-settings`
- See the Default Desk Theme loaded with all 22 values populated
- Change `--primary-color`, click Save → toast confirms save
- `themes/public/css/nce_desk_theme.css` on disk reflects the new value
- DevTools on `/app/home` (separate browser tab): hard reload → navbar accent reflects the change

**Depends on:** 6

---

### Phase 8 — useDeskTheme composable + live preview

**Files**
- New: `frontend/src/composables/useDeskTheme.ts` — mirrors `useTheme.ts:1-31`, but the `applyThemeVars` function writes Frappe vars (`--primary-color`, `--bg-color`, …) to `:root` instead of `--nce-*`
- New: `frontend/src/pages/DeskThemePreviewPage.vue` — full-page iframe pointing at `/app/home` (or a small dropdown of preview targets: `/app/home`, `/app/user`, `/app/system-settings`). The iframe receives `postMessage` updates from the settings page exactly the way `ThemeSettingsPage.vue:786-789` pushes updates to the existing preview window.
- Edit: `DeskThemeSettingsPage.vue` — wire `computeCSSVariables()` to emit Frappe var names instead of `--nce-*` names, and the postMessage push pattern (already in `ThemeSettingsPage.vue:769-789`) carries over unchanged.

**What**
Live preview without save — user edits a color, the preview iframe repaints instantly. Same UX as the existing editor's preview window.

**Key decisions**
- The preview target loads inside Desk (`/app/...`), so it inherits the published `nce_desk_theme.css` plus whatever postMessage overrides the settings page pushes. The settings page itself does NOT need to render Desk chrome — it's the editor, not the preview.
- The iframe boundary requires the preview page to listen for `postMessage` and apply the vars to its own `:root`. Mirror the existing `nce-theme-update` message format; use `nce-desk-theme-update` as the type so the channels don't collide.

**Verify**
- Open settings + preview in two windows (or use the "open preview" button mirroring the existing flow)
- Adjust `--primary-color` slider → preview navbar repaints in real time, before save
- Save → confirm the change persists after preview reload

**Depends on:** 7

---

### Phase 9 — Smoke test + handoff doc

**Files**
- New: `docs/desk-themes-handoff.md` — what got built, the 22 fields, the file paths, the publish command, known limitations (no scoped palettes, no class overrides, no print formats)
- Update: `themes/CODE_INDEX.json` — add the new modules/pages/composables under a new `desk_themes` block parallel to the existing `themes` and `frontend` blocks
- Update: `THEME_CLASS_CONTRACT.json` — does NOT change (Desk Themes are not part of the public class contract; they're internal var overrides)

**What**
Full end-to-end test from a fresh install, plus the docs Future-You needs to remember what got built.

**Smoke test script**
1. Fresh install on a test site → confirm "Default" Desk Theme exists, status Active
2. Create a new Desk Theme "Maroon", change `--primary-color` to `#7B1E3A`, save → verify CSS file updates
3. Set "Maroon" as Active → navbar accent repaints across Desk
4. Set "Maroon" as base → bundled defaults update; commit `themes/utils/data/base_desk_theme.json`
5. Delete "Maroon" → status reverts to "Default" or whichever is base
6. Hit `/desk-themes/preview` → live preview works in iframe
7. Confirm `/themes/theme-settings` still works unchanged

**Depends on:** 8

---

## Ordering constraint

Phase 1 → 2 → 3 → 4 must land before any SPA work; the SPA depends on the API which depends on the writer which depends on the storage. Phases 5 → 6 → 7 → 8 can technically interleave but the recommended order minimizes "the SPA is half-wired" states. Phase 9 happens last because it documents what actually exists, not what was planned.

## Out of scope (v1)

- **Class-targeted Desk overrides** (`.navbar`, `.btn-primary`, `.indicator.green`, etc.). The verification doc shows these need `!important` or higher specificity and fight the cascade — separate v2 effort once the var-only path is stable and we know exactly how often the var set falls short.
- **Per-page or per-route Desk theming.** No `data-nce-desk-theme` scoping because Desk's shell isn't ours to wrap. One base + one Active globally.
- **Dark mode parity for Desk vars.** The Frappe Desk dark mode (`[data-theme="dark"]`) is a separate `:root` block; covering it doubles the field count. Decide whether to add a "Dark Desk Theme" sibling DocType or a `dark_overrides` JSON on the same record in v2.
- **Print Style integration.** Frappe routes print CSS through the Print Style DocType, not `app_include_css`. Separate code path, separate effort.
- **Frappe SCSS variables** (`$gray-*`, `$primary`, `$danger`). Compile-time only — cannot be reached from `nce_desk_theme.css` no matter what. Document this limitation in the handoff doc so users don't try to add fields for them.

## Decisions deferred (revisit after v1 ships)

- Adding a `custom_css` textarea under an "Advanced" tab as an escape hatch for class-targeted overrides users want to ship before the v2 class-targeted system exists. Trade-off: gives power users a way out vs. opens a `!important` arms race in user-authored CSS.
- Sharing a base settings component between `ThemeSettingsPage.vue` and `DeskThemeSettingsPage.vue`. Only worth doing once both pages have shipped and stabilized.
- A "Reset all fields to Frappe defaults" button on the Desk settings page (one click reverts the whole payload to `DESK_THEME_DEFAULT_PAYLOAD`). Trivial to add; deferred only because it's an enhancement, not blocking.
- Multi-tile Apps-screen icon. Reusing `logo.jpg` for both tiles is fine for v1; a Desk-specific icon is polish.
