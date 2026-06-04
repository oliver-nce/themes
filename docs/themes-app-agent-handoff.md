# Themes App — Agent Handoff

## Project

Frappe v15 app (`themes`) for site-wide CSS theming via `--nce-*` tokens in `nce_theme.css`.

- **Repo:** https://github.com/oliver-nce/themes.git
- **Branch:** `master`
- **Staging site:** `manager.ncesoccer.com`

---

## What's done (as of commit `190cf60`)

### Phase 2 — Multi-theme backend

- `theme_color_utils.py`, `css_writer.py` (`generate_css`, `publish_theme`)
- DocTypes: **NCE Theme**, **Site Theme Config** (legacy **Theme Settings** deprecated, `on_update` no-op)
- Migration patch: Theme Settings → Default theme
- API: `set_active_theme`, `regenerate_theme_css`, `list_themes`
- Desk workspace with Theme Editor / Switch Theme pages

### Phase 3 — Vue editor wired to backend

- SPA at **`/themes/theme-settings`** reads/writes active theme via `get_active_theme_editor` / `save_active_theme`
- Theme picker dropdown in editor header

### Phase 4 — Simplified model (no Theme Version required)

- **`theme_json`** on **NCE Theme** (one record = name + definition)
- **Site Theme Config**: only **Active Theme** (+ `css_hash`); `active_version` hidden/deprecated
- Patch `collapse_theme_versions_to_nce_theme` copies legacy Theme Version JSON → NCE Theme
- New themes auto-copy Default's `theme_json` on insert
- Theme Versions removed from workspace UI (DocType still exists, deprecated)

### Phase 5 — Legacy cleanup

- **Theme Version** and **Theme Settings** DocTypes removed from app + DB patch
- `active_version` field removed from Site Theme Config
- `publish_version()` shim removed; `init_theme.py` and `after_install` use NCE Theme Default
- Default token payload in `utils/default_theme.py`

### Bug fixes (earlier)

- Workspace crash: Single DocType shortcut → Desk **Pages** (`theme-editor`, `site-theme-switch`)
- Theme dropdown freeze: `switchingTheme` stuck true (fixed with `async/finally`)
- Form reset on theme switch so colors don't bleed between themes

---

## Current architecture

```
NCE Theme (theme_name, theme_json, is_default, status)
       ↓
Site Theme Config (active_theme) → publish_theme() → nce_theme.css
       ↑
Vue Theme Editor (/themes/theme-settings)
```

**User workflow:**

1. Create **NCE Theme** → Save (gets Default's JSON copy)
2. **Theme Editor** → dropdown to switch → edit → **Save Changes**
3. Optional: **Switch Theme** desk page → Site Theme Config form

**Do not use Theme Version or Theme Settings** — removed in Phase 5.

---

## Deploy (staging)

```bash
cd /home/frappe/frappe-bench/apps/themes && git pull
cd ~/frappe-bench
bench --site manager.ncesoccer.com migrate
# migrate runs sync_themes_workspace — drops stale Theme Version workspace links
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
| Task 13 steps 1–5 (staging migrate, switch) | Assumed pass | Staging at `manager.ncesoccer.com` through `190cf60` |
| Task 13 step 6 (fresh install) | **Pending** | No local bench — run on staging server; see `docs/fresh-install-verification.md` |

---

## Known issues / deferred

| Item | Notes |
|------|--------|
| **Workspace fixture sync** | If shortcuts stale, edit Workspace "Themes" or re-import fixture after migrate. |
| **URL shortcuts in Desk** | Require full `https://…` URL; use **Page** shortcuts instead. |
| **Fresh install test (Task 13 step 6)** | Pending on staging bench — see `docs/fresh-install-verification.md` |
| **Per-page theming** | Postponed by design. |
| **`dark_mode`** | Stored in `theme_json`, not emitted to CSS (by choice). |

---

## Key files

| Concern | Path |
|---------|------|
| Editor API | `themes/api.py` |
| CSS publish | `themes/utils/css_writer.py` |
| NCE Theme | `themes/themes/doctype/nce_theme/` |
| Site config | `themes/themes/doctype/site_theme_config/` |
| Vue editor | `frontend/src/pages/ThemeSettingsPage.vue` |
| Workspace | `themes/themes/workspace/themes/themes.json` |
| Desk pages | `themes/themes/page/theme_editor/`, `site_theme_switch/` |
| Index | `themes/CODE_INDEX.json` |

---

## Git state

- **Branch:** `master`, pushed through `190cf60`
- **Untracked:** none (plan doc committed)

---

## Prompt for next session (copy-paste)

```
I'm working on the Themes Frappe app (repo: oliver-nce/themes, branch master).

Read themes/CODE_INDEX.json first.

Current state (post Phase 4):
- Theme definitions live on NCE Theme.theme_json (NOT Theme Version)
- Site Theme Config has active_theme only
- Vue editor at /themes/theme-settings with theme dropdown
- Latest commits through 190cf60 (dropdown freeze fix)

Staging site: manager.ncesoccer.com

[Describe your task here — e.g. "Remove Theme Version DocType entirely", "Add auto theme creation UX", "Fix X", etc.]

Do not bulk-load Frappe Context — use fc_route.ts if Frappe docs needed.
Confirm plan before code changes unless I say "go".
```

Replace the bracketed line with the actual task for the next agent.
