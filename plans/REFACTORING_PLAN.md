# Themes App — Staged Refactoring Plan

**Author:** Architecture review (analyst pass — no code changed)
**Date:** 2026-06-09
**Scope reviewed:** `themes/` (Frappe app) + `frontend/src/` (Vue SPA). `node_modules`, build output, and `Frappe Context/` excluded.
**Status of this document:** advisory. Nothing here changes behavior. Hand stages to a coding agent one at a time, in order.

> ⚠️ **Read this first.** There are **zero automated tests** in the repo (only `Frappe Context/` doc fixtures match `*test*`). Several findings below are duplication/consolidation work that is **unsafe without a characterization test net**. Stage 5 (tests) is written last for narrative order but its first three items are a **prerequisite for Stages 2–4**. Build the snapshot/parity tests *before* consolidating.

---

## A. Concise diagnosis of the current architecture

The app does one job well-defined job: turn an editable **token payload** into **published CSS** that downstream apps consume via CSS custom properties. The real domain is small and clean:

- **Entities:** `NCE Theme` (web/site tokens → `--nce-*`), `NCE Desk Theme` (Frappe Desk chrome tokens → native `--*-color`), and `Site Theme Config` (a Single holding `base_theme`, `base_desk_theme`, `css_hash`).
- **Core workflow:** Vue SPA edits a payload → `themes.api.save_*` → doc `on_update` → `publish_*()` → generate CSS string → write `.css` + `.css.hash` sidecar + set `css_hash` on the Single → clear cache. `hooks.py` reads the sidecar hash at import time to cache-bust `app_include_css`.
- **Business rules:** one **base** theme per family renders to `:root`; **Active** themes render as scoped blocks; the base theme cannot be renamed/deleted; a theme must be Inactive before rename/delete.

The trouble is **not** the domain — it is that the app was **cloned, not extended**, when "Desk themes" were added. The Web-theme stack (API CRUD, CSS writer, publish plumbing, editor page, hooks URL builder) was copy-pasted into a near-identical Desk-theme stack with `desk` spliced into the names. On top of that, the **OKLCH color math and the token lookup tables exist in two-to-three languages at once**, kept aligned only by hand-written "keep in sync" comments. The result is a codebase whose *conceptual* size is ~1× but whose *maintenance* size is ~2–3×, with several places where the two copies have **already silently diverged**.

Severity is moderate, not critical: each piece is individually readable and the boundaries (tokens → math → emit → publish → API → UI) are actually latent in the current layout. This makes it a **good** refactoring candidate — the target structure is mostly already implied by the file names.

---

## B. Highest-risk problem areas (ranked)

| # | Area | Risk | Why it's dangerous |
|---|------|------|--------------------|
| 1 | **No tests anywhere** | 🔴 Critical | Any consolidation in §C/§D is unverifiable. A color-math or CSS-emit regression is invisible until a downstream app renders wrong. |
| 2 | **OKLCH math duplicated across languages** — `themes/utils/theme_color_utils.py` ↔ `frontend/src/utils/color-shades.ts` | 🔴 High | Line-for-line port. Comments literally say *"Matches frontend color-shades.ts"* (`theme_color_utils.py:88,112,155,296`) and *"Matches frontend"*. Edit one, the other drifts, and previews stop matching published CSS. |
| 3 | **`is_active` means different things for Web vs Desk** | 🔴 High | Web: `is_active = (base == theme)` (`api.py:53–55,126,237`). Desk: `is_active = (status == "Active")` (`api.py:327,403,512`) **and** single-active is enforced (`_deactivate_other_desk_themes`, `api.py:334–340`). Same field name, opposite semantics. An agent "harmonizing" them will break one side. |
| 4 | **Token tables duplicated 3×** — role/shade/map tables | 🟠 High | `SHADOW_DEFS`, `BORDER_RADIUS_MAP`, `LINE_HEIGHT_MAP`, `TRANSITION_MAP`, `GAMMA_SAT_*` live in `theme_color_utils.py`, again inline in `ThemeSettingsPage.vue:734–766`, and partly again in `DeskThemeSettingsPage.vue`. `ROLES`/`CURATED_SHADES`/`SHADE_SCALE_FIELDS` live in `css_writer.py` **and** `widget/constants.ts` (with a "keep in sync with css_writer.py" header). |
| 5 | **`api.py` is two parallel CRUD modules in one file** | 🟠 High | Web half `:20–295`, Desk half `:298–574`. 18 endpoints, ~9 mirrored pairs. 574 lines. |
| 6 | **God-component editor pages** | 🟠 Medium | `ThemeSettingsPage.vue` = **1,884 lines** (script alone ~1,060), re-implements CSS-var computation, shadow building, and all token maps. `DeskThemeSettingsPage.vue` = 979 lines, a structural clone. |
| 7 | **Dead/legacy API surface** | 🟠 Medium | `get_active_theme_editor` (`:87`), `save_active_theme` (`:133`), `set_active_theme` (`:203`), `save_as_default` (`:209`) + `is_active`/`site_active_theme` "legacy alias" response keys. Obscures the live surface. |
| 8 | **`CODE_INDEX.json` is stale and misleading** | 🟠 Medium | Documents only the Web subsystem; **omits the entire Desk subsystem** (`nce_desk_theme` doctype, `desk_css_writer.py`, `default_desk_theme.py`, `init_desk_theme.py`, `bundle_base_desk_theme.py`, `site_theme_config_helpers.py`, `workspace_sync.py`, `verify_fresh_install.py`). References `composables/useTheme.ts` which does **not exist** (actual: `useDeskTheme.ts`). The project's own rules say to read this file *first* — so the index actively misleads any agent. |
| 9 | **CSS publish plumbing duplicated** | 🟡 Medium | `_write_css_file`/`_write_css_hash_file`/hash/`cache.delete_value("assets_json")`/`clear_cache` cloned in `css_writer.py:549–620` and `desk_css_writer.py:67–124`, with subtly different base-resolution fallbacks (`css_writer.py:586–600` vs `desk_css_writer.py:101–117`). |
| 10 | **Migration scaffolding now permanent** | 🟡 Low | `site_theme_config_helpers.py:10–46` permanently tolerates the pre-migrate `active_theme` field and double-writes both fields with raw SQL. Patches under `patches/v1_0/` suggest the migration is long done. |

---

## C. Proposed target structure

The aim is **one source of truth per concept**, and **one parameterized "theme family"** instead of two cloned stacks. No behavior change — this is a re-grouping.

### Python (`themes/`)

```
themes/
  domain/
    theme_tokens.py      # SINGLE source of truth: ROLES, SHADE_SCALE_FIELDS,
                         #   COLOR_FIELDS, CURATED_SHADES, BORDER_RADIUS_MAP,
                         #   SPACING_SCALE_MAP, LINE_HEIGHT_MAP, TRANSITION_MAP,
                         #   SHADOW_DEFS, GAMMA_SAT_ROLE_FIELDS, FONT_REGISTRY…
                         #   Exposes export_token_contract() -> dict for the frontend build.
    color_math.py        # (renamed from theme_color_utils.py) OKLCH/HSL pure math only.
    theme_family.py      # ThemeFamily descriptor: doctype, config_field, token_fields,
                         #   css_filename, var_style ("nce" | "desk"), single_active: bool.
                         #   Two instances: WEB_FAMILY, DESK_FAMILY.
  services/
    css_emit.py          # pure str building: generate_css / generate_site_css / generate_desk_css.
    css_publish.py       # ONE publish(family, theme_name) + shared _write_css/_write_hash/_bust_cache.
    theme_service.py     # family-agnostic CRUD: get_editor, save, create, set_base,
                         #   save_as_base, rename, delete, list — takes a ThemeFamily.
  api.py                 # THIN @whitelist wrappers that bind a family to theme_service calls.
  utils/
    site_theme_config_helpers.py   # keep; collapse legacy active_theme handling (Stage 4).
    bundle_base_theme.py / bundle_base_desk_theme.py  # merge into bundle_theme(family).
    workspace_sync.py    # unchanged.
```

### Frontend (`frontend/src/`)

```
src/
  domain/
    theme-tokens.ts      # GENERATED from theme_tokens.py export_token_contract() — do not hand-edit.
    color-shades.ts      # keep as the JS math impl, but add a parity test vs Python (Stage 5).
  composables/
    useThemeEditor.ts    # shared editor state machine used by BOTH pages (load/dirty/save/preview).
  pages/
    theme-settings/      # ThemeSettingsPage split into ColorsTab / TypographyTab / LayoutTab /
                         #   AdvancedTab + ThemeSettingsPage shell.
    DeskThemeSettingsPage.vue   # reuse useThemeEditor; drop inline token-map copies.
  widget/constants.ts    # import ROLES/CURATED_SHADES from domain/theme-tokens.ts instead of re-declaring.
```

> **Assumption (mark as uncertain):** The existing `THEME_CLASS_CONTRACT.json` at the repo root already catalogs theme-aware classes and their CSS variables. It is a strong candidate to *become* (or be generated from) the single token contract. Confirm whether it is hand-maintained or generated before wiring the frontend to it.

---

## D. Staged refactoring plan

Each stage is independently shippable and reversible. **Do not start Stage 2 until the Stage 5 parity/snapshot tests exist** (see the note at the top).

### Stage 1 — Low-risk cleanup (no logic touched)

**What to change**
1. **Fix `CODE_INDEX.json`.** Add every Desk-subsystem file and doctype; correct `composables/useTheme.ts` → `useDeskTheme.ts`; note `useThemeDefaults.ts` accurately. (`themes/CODE_INDEX.json`)
2. **Mark dead endpoints.** Add a `# DEPRECATED — remove after callers confirmed gone` docstring to `get_active_theme_editor`, `save_active_theme`, `set_active_theme`, `save_as_default` and grep the wider NCE codebase + `frontend/src` for callers. Frontend already calls `get_active_theme_editor` / `get_active_desk_theme_editor` — confirm before removing. **Do not delete yet.**
3. **Inline-document the `is_active` divergence** at `api.py:53` and `api.py:327` with an explicit `# NOTE: Web is_active == is_base; Desk is_active == status=='Active'. These are intentionally different — do not unify without product sign-off.` This defuses the #1 AI-confusion trap cheaply.
4. **Add module headers** to `css_writer.py` and `desk_css_writer.py` cross-linking each other and naming what is shared vs intentionally different.

**Why it matters:** the index and the `is_active` ambiguity are the two things most likely to make the *next* agent (human or AI) introduce a regression. Fixing docs first makes every later stage safer.

**Risk:** 🟢 Very low (comments + JSON metadata only).

**Files affected:** `themes/CODE_INDEX.json`, `themes/api.py`, `themes/utils/css_writer.py`, `themes/utils/desk_css_writer.py`.

**Verify behavior unchanged:** `git diff` contains only comments/strings/JSON; run `bench build` / app import; load both editor pages and save once on each.

---

### Stage 2 — Consolidate duplicated logic (behavior-preserving)

> Prerequisite: Stage 5 items 1–3 (snapshot + parity tests) must be green first.

**What to change**
1. **One token-table module.** Create `themes/domain/theme_tokens.py` and move `BORDER_RADIUS_MAP`, `SPACING_SCALE_MAP`, `LINE_HEIGHT_MAP`, `TRANSITION_MAP`, `SHADOW_DEFS`, `GAMMA_SAT_ROLE_FIELDS`, `COLOR_FIELDS`, `SHADE_SCALE_FIELDS`, `CURATED_SHADES`, `FG_ROLES`, `FONT_REGISTRY` here. Re-export from old locations so imports keep working. Rename `theme_color_utils.py` → `domain/color_math.py` via a re-export shim.
2. **Generate the frontend token contract.** Add `export_token_contract()` to `theme_tokens.py` and a small build step that writes `frontend/src/domain/theme-tokens.ts`. Replace the hand-declared tables in `widget/constants.ts`, `ThemeSettingsPage.vue:715–766`, and `DeskThemeSettingsPage.vue` with imports from it. **This kills finding #4.**
3. **Shared CSS publish plumbing.** Extract `_write_css_file`/`_write_css_hash_file`/hash/`_bust_cache` into `services/css_publish.py` as `write_published_css(css_filename, css) -> css_hash`. Have both `publish_theme` and `publish_desk_theme` call it. Keep the two `publish_*` entry points (their *content* generation differs); only the file/hash/cache tail is shared.
4. **Single hooks URL builder.** Replace `_nce_theme_css_url` + `_nce_desk_theme_css_url` (`hooks.py:15–60`) with one `_css_url(css_filename)` called twice.

**Why it matters:** removes the highest-churn duplication (token maps + publish tail + hooks) without touching the math or the API contract. Drift risk drops sharply.

**Risk:** 🟠 Medium — moving constants can change import order / introduce circular imports. Mitigate with re-export shims and one-module-at-a-time commits.

**Files affected:** new `themes/domain/theme_tokens.py`, `themes/domain/color_math.py` (shim), `themes/services/css_publish.py`; edits to `css_writer.py`, `desk_css_writer.py`, `hooks.py`, `widget/constants.ts`, both editor pages, `frontend/tailwind.config.js` (if it reads the maps).

**Verify behavior unchanged:**
- CSS snapshot test (Stage 5.1): published `nce_theme.css` / `nce_desk_theme.css` byte-identical before/after for a fixed payload.
- `css_hash` value identical before/after (it is a SHA-1 of the CSS — a perfect regression sentinel).
- Frontend: token-contract diff = empty; preview CSS vars unchanged for a sample theme.

---

### Stage 3 — Clarify domain boundaries (introduce ThemeFamily; still behavior-preserving)

**What to change**
1. **Define `ThemeFamily`** in `themes/domain/theme_family.py`: a frozen descriptor `(doctype, config_getter, config_setter, token_fields, css_filename, single_active, bundle_fn)`. Instantiate `WEB_FAMILY` and `DESK_FAMILY`.
2. **Extract `theme_service.py`** with family-parameterized functions: `get_editor_response(family, name)`, `save(family, name, payload, status)`, `create(family, name, payload)`, `set_base(family, name)`, `save_as_base(family, name, password)`, `rename(family, name, new_name)`, `delete(family, name)`, `list_themes(family)`. Port the **two existing behaviors faithfully** — `single_active` flag drives `_deactivate_other` only when set (Desk), and `is_active` is computed per family rule passed in the descriptor. **Preserve the divergence; do not unify it.**
3. **Make `api.py` thin.** Each `@frappe.whitelist()` becomes a 1–3 line wrapper binding a family to a `theme_service` call. Net `api.py` shrinks from 574 → ~150 lines.
4. **Shared frontend editor composable.** Extract `useThemeEditor.ts` (load/dirty-tracking/save/preview-postMessage) and have both pages consume it, parameterized by API method names + family.

**Why it matters:** this is where the "cloned, not extended" debt is actually repaid. One CRUD implementation, two configured families. New families (e.g. a future "Email theme") become a descriptor, not a copy.

**Risk:** 🟠 Medium–High — this rewrites the API internals (not the wire contract). The wire contract (method names, response keys including legacy aliases) must stay byte-identical.

**Files affected:** new `theme_family.py`, `theme_service.py`, `useThemeEditor.ts`; heavy edit to `api.py`; edits to both editor pages.

**Verify behavior unchanged:**
- API contract test (Stage 5.2): for each of the 18 endpoints, assert response **keys and types** match a recorded baseline — *especially* `is_active`, `is_base_theme`, `site_active_theme`, `css_hash`.
- Manual: full editor flow on both pages (load → edit → save → set base → rename → delete) with DB state diffed.

---

### Stage 4 — Deeper architectural changes (behavior change allowed, each explicitly flagged)

Only after Stages 1–3 are stable. Each item is opt-in and individually reversible. **Mark each PR "BEHAVIOR CHANGE".**

1. **Retire dead endpoints** (`get_active_theme_editor`, `save_active_theme`, `set_active_theme`, `save_as_default`) and the `is_active`/`site_active_theme` legacy response aliases — **only** once Stage 1.2 confirmed no remaining callers. Update the frontend to call the canonical `*_base_*` methods. *Behavior change: removes URLs.*
2. **Collapse `active_theme` legacy tolerance** in `site_theme_config_helpers.py:10–46` to read/write `base_theme` only, *after* verifying via DB query that no live site still has an `active_theme` Singles row. *Behavior change: drops migration fallback.* Guard with a one-shot patch that asserts migration completed.
3. **Reconsider `_emit_prefixed_rule` double-class output** (`css_writer.py:377–438`): every neutral/chrome class ships twice (`theme-bg-surface` **and** `bg-surface`). Audit downstream consumers (NCE Events `panelChromeClasses.js`, per CODE_INDEX) for which prefix is actually referenced; drop the unused alias. *Behavior change: smaller CSS, potential consumer break — audit required.* **Uncertain assumption:** both prefixes may still be load-bearing; verify before removing.
4. **Unify `single_active` semantics** *only if product agrees* — decide whether Web themes should also be mutually-exclusive-active like Desk, or document permanently that they differ. This is a **product decision, not a refactor.** Leave as-is unless sign-off.

**Risk:** 🔴 High (these change observable behavior). Ship one at a time behind the test net.

**Files affected:** `api.py`, `site_theme_config_helpers.py`, `css_writer.py`, frontend API callers, possibly downstream NCE Events repo.

**Verify:** consumer audit + the Stage 5 contract/snapshot suite + a staging-site smoke test of an actual downstream app rendering.

---

### Stage 5 — Tests, validation, migration checks (BUILD ITEMS 1–3 FIRST)

These are written last for narrative flow, but **items 1–3 are the gate for Stages 2–4.**

1. **CSS snapshot tests** *(prereq for Stage 2)*. For 2–3 fixed payloads (default, gamma/sat-tweaked, neutral-warmth), assert `generate_css()` / `generate_site_css()` / `generate_desk_css()` output is byte-stable. Store golden files under `themes/tests/golden/`. The `css_hash` makes this trivial — assert the 8-char hash.
2. **API contract tests** *(prereq for Stage 3)*. Hit all 18 whitelisted endpoints against a test theme; snapshot response shape. Lock in the legacy keys so Stage 4 removal is a *deliberate* diff.
3. **Python↔TS color-math parity test** *(prereq for any color-math touch)*. Generate shades for a set of hex inputs in Python (`color_math.py`) and in TS (`color-shades.ts`), assert identical hex outputs. This is the only thing that makes finding #2 safe to ever touch again. Run it in CI so the two impls can never silently drift.
4. **Publish idempotency test.** `publish_theme()` twice → same `css_hash`, same file bytes, no exception when no base theme set.
5. **Migration-completed assertion.** Before Stage 4.2, a check/patch confirming no `Site Theme Config.active_theme` Singles row remains on target sites.

**Risk:** 🟢 Low (adds tests only). **Highest value in the whole plan** — without 1–3, every other stage is a leap of faith.

**Files affected:** new `themes/tests/`, `frontend/src/**/__tests__/`, CI config.

---

## E. Naming recommendations (for the coding agent)

| Current | Proposed | Reason |
|---------|----------|--------|
| `themes/utils/theme_color_utils.py` | `themes/domain/color_math.py` | It's pure color math, not misc utils. |
| (scattered maps) | `themes/domain/theme_tokens.py` | Single source of truth for token tables + `export_token_contract()`. |
| `_write_css_file` + `_write_desk_css_file` (×2) | `services/css_publish.write_published_css(filename, css)` | One writer. |
| `_nce_theme_css_url` + `_nce_desk_theme_css_url` | `_css_url(filename)` | One builder. |
| `publish_theme` / `publish_desk_theme` | keep names, add `services/css_publish.publish(family, name)` underneath | Shared tail, distinct heads. |
| Web/Desk CRUD pairs in `api.py` | `services/theme_service.<verb>(family, …)` + thin `api.py` wrappers | Kill the clone. |
| (new) | `domain/theme_family.py: WEB_FAMILY, DESK_FAMILY` | Parameterize instead of duplicate. |
| `ThemeSettingsPage.vue` (1,884 ln) | `pages/theme-settings/{ColorsTab,TypographyTab,LayoutTab,AdvancedTab}.vue` + shell | Break the god-component. |
| (new) | `composables/useThemeEditor.ts` | Shared editor state for both pages. |
| `frontend/src/domain/theme-tokens.ts` | (generated) | Mirror of Python contract; never hand-edited. |

---

## Uncertain assumptions (flagged for confirmation)

1. The migration off `active_theme` → `base_theme` is complete on all live sites (drives Stage 4.2). **Verify with a DB query before removing the fallback.**
2. Both class prefixes from `_emit_prefixed_rule` (`theme-bg-*` and bare `bg-*`) are still consumed somewhere (drives Stage 4.3). **Audit NCE Events before dropping either.**
3. `THEME_CLASS_CONTRACT.json` is hand-maintained, not generated — if generated, the token-contract export (Stage 2.2) should feed *it*, not duplicate it.
4. The frontend `get_active_*_editor` calls are still wired in the SPA (grep shows they are) — so "dead" endpoints in §B#7 are **not yet** safe to delete; Stage 1.2 must reconcile this first.

## Suggested execution order for the coding agent

`Stage 1 (all)` → `Stage 5.1–5.3` → `Stage 2` → `Stage 5.4` → `Stage 3` → `Stage 5.2 re-run` → `Stage 4 (one item per PR)`.
