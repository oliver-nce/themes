# Themes App — Agent Handoff

## Project

Frappe v15 app (`themes`) for site-wide CSS theming via `--nce-*` tokens in `nce_theme.css`.

- **Repo:** https://github.com/oliver-nce/themes.git
- **Branch:** `master`
- **Staging site:** `manager.ncesoccer.com`

---

## Architecture (authoritative)

**Read first:** [`docs/theme-system/01-architecture.md`](theme-system/01-architecture.md)

That doc covers the full pipeline, the two-layer `nce_theme.css` output (`:root` base + `[data-nce-theme]` scoped palettes), the NCE Theme data model, theme lifecycle, and downstream consumer pattern.

Supporting references:

| Topic | Doc |
|-------|-----|
| Class catalog | `THEME_CLASS_CONTRACT.json` (repo root) |
| Human-readable class tables | `docs/theme-classes-reference.md` |
| Vue usage / `data-nce-theme` | `docs/theme-system/07-using-in-vue.md` |
| Conceptual index | `docs/theme-system/INDEX.md` |
| Code index | `themes/CODE_INDEX.json` |

---

## What's done

### Phase 2–5 — Foundation (through `190cf60`)

- `theme_color_utils.py`, `css_writer.py`, DocTypes **NCE Theme** + **Site Theme Config**
- Vue editor at `/themes/theme-settings`; Theme Version / Theme Settings removed
- Default token payload in `utils/default_theme.py`

### Phase 6 — Multi-theme scoped palettes (shipped)

> **Terminology:** *Base Theme* = the repo seed/safety net (`themes/data/base_theme.json`, never rendered directly). *Default Theme* = the live `:root` fallback clients render. The `Site Theme Config.base_theme` field is **misnamed** — it holds the Default Theme. See `.cursor/rules/themes-glossary.mdc`.

- **`nce_theme.css` two-layer output:**
  - `:root { --nce-* }` — site-wide **Default theme** (from the `Site Theme Config.base_theme` field — legacy name)
  - `[data-nce-theme="<slug>"] { --nce-* }` — one block per `status = Active` theme
  - Utility classes (`theme-bg-primary`, etc.) emitted **once** from the Default theme; they read vars in scope
- **`publish_theme()`** always rebuilds the whole file from DB state (no partial publish)
- **`base_theme`** field replaces `active_theme` on Site Theme Config (migration patch `rename_base_theme_and_status`); semantically it is the **Default theme** pointer
- **Status model:** `Active` = published as scoped palette; `Inactive` = stored only, no CSS output
- **New themes** seed `theme_json` from the current **Default theme** on insert
- **Editor:** Rename / Delete for Inactive non-Default themes; "Set as base" on System tab (legacy label → makes a theme the Default); login gate on SPA (`themes/www/themes.py`)
- **API:** `set_base_theme`, `save_as_base_theme`, `get_base_theme_editor` (code names use "base" but operate on the Default theme; + legacy aliases for `active_theme` names)
- **Frontend:** Vite hashed chunk filenames (cache-safe deploys)
- **Helpers:** `utils/site_theme_config_helpers.py` reads `base_theme` / legacy `active_theme` during migration window

### Per-panel theming — shipped (Themes side)

Downstream apps (e.g. NCE Events) opt in by setting `data-nce-theme="<slug>"` on a panel root. Omit the attribute (or use a missing/Inactive slug) → inherits `:root` base. No Themes-app changes required beyond the scoped palette blocks above.

### Border width tokens — shipped

Three independently configurable line/border widths in `theme_json`, edited via Theme Editor → Layout → **Line Widths**:

| Field | Var | Class | Default |
|-------|-----|-------|---------|
| `border_width_thin` | `--nce-border-width-thin` | `theme-border-thin` | `0.5px` |
| `border_width` | `--nce-border-width` | `theme-border` | `1px` |
| `border_width_strong` | `--nce-border-width-strong` | `theme-border-strong` | `2px` |

See `THEME_CLASS_CONTRACT.json` → `border_and_focus` and `themes/CODE_INDEX.json` → `concern_lookup.border_width_tokens`.

---

## Current architecture (summary)

```
NCE Theme (theme_name, slug, theme_json, status: Active|Inactive)
       ↓
Site Theme Config (base_theme = Default theme pointer, css_hash)
       ↓
publish_theme() → generate_site_css()
       → :root { --nce-* }                    (Default theme)
       → [data-nce-theme="slug"] { --nce-* }  (each Active theme)
       → .theme-bg-primary, …                 (utility layer, once)
       → nce_theme.css
       ↑
Vue Theme Editor (/themes/theme-settings)
```

**User workflow:**

1. Create **NCE Theme** → seeds from the Default theme's `theme_json`
2. **Theme Editor** → edit tokens → **Save Changes** (republish if Active or the Default)
3. **Set as base** (legacy label) → makes this theme the **Default** → `:root` fallback site-wide
4. **Active** → included in next publish as `[data-nce-theme]` block (multiple Active themes allowed)
5. **Inactive** → safe to edit/rename/delete without affecting live CSS

**Do not use Theme Version or Theme Settings** — removed in Phase 5.

---

## Deploy (staging)

```bash
cd /home/frappe/frappe-bench/apps/themes && git pull
cd ~/frappe-bench
bench --site manager.ncesoccer.com migrate
# Or if migrate already ran but workspace is still broken:
bench --site manager.ncesoccer.com execute themes.workspace_fix.run
cd apps/themes/frontend && yarn install && yarn build
cd ~/frappe-bench
bench build --app themes
bench clear-cache
bench restart
```

Hard-refresh browser after deploy.

---

## Verification

| Test | Status | Notes |
|------|--------|-------|
| Multi-theme publish (`:root` + scoped blocks) | Shipped | See `01-architecture.md` |
| Per-panel `data-nce-theme` consumer pattern | Shipped (contract) | Downstream app wires attribute on panel root |
| Fresh install (Task 13 step 6) | **Pending** | See `docs/fresh-install-verification.md` |

---

## Known issues / deferred

| Item | Notes |
|------|--------|
| **Workspace fixture sync** | If shortcuts stale, edit Workspace "Themes" or re-import fixture after migrate. |
| **URL shortcuts in Desk** | Require full `https://…` URL; use **Page** shortcuts instead. |
| **Fresh install test** | Pending on staging bench — see `docs/fresh-install-verification.md` |
| **`dark_mode`** | Stored in `theme_json`, not emitted to CSS (by choice). |
| **`list_themes()` slug** | API returns `name` / `theme_name` / `status` but not `slug` — consumers resolve slug via NCE Theme Link or extend API. |

---

## Key files

| Concern | Path |
|---------|------|
| **Architecture spec** | `docs/theme-system/01-architecture.md` |
| Editor API | `themes/api.py` |
| CSS publish | `themes/utils/css_writer.py` (`generate_site_css`, `publish_theme`) |
| Default theme helpers (the `base_theme` field — legacy name) | `themes/utils/site_theme_config_helpers.py` |
| NCE Theme | `themes/themes/doctype/nce_theme/` |
| Site config | `themes/themes/doctype/site_theme_config/` |
| Vue editor | `frontend/src/pages/ThemeSettingsPage.vue` |
| Login gate | `themes/www/themes.py` |
| Workspace | `themes/themes/workspace/themes/themes.json` |
| Index | `themes/CODE_INDEX.json` |

---

## Prompt for next session (copy-paste)

```
I'm working on the Themes Frappe app (repo: oliver-nce/themes, branch master).

Read themes/CODE_INDEX.json first.
Read docs/theme-system/01-architecture.md for current architecture (base_theme, scoped palettes, Active/Inactive).

Current state:
- nce_theme.css: :root (base_theme) + [data-nce-theme] per Active theme + theme-* utility classes
- Site Theme Config.base_theme is the site-wide default
- Per-panel theming: downstream apps set data-nce-theme="<slug>" (shipped on Themes side)
- Vue editor at /themes/theme-settings; login gate on SPA

Staging site: manager.ncesoccer.com

[Describe your task here]

Do not bulk-load Frappe Context — use fc_route.ts if Frappe docs needed.
Confirm plan before code changes unless I say "go".
```

Replace the bracketed line with the actual task for the next agent.
