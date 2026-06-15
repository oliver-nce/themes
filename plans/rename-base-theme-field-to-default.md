# Follow-up: rename `base_theme` field → `default_theme`

**Status:** deferred (code change — not yet started)
**Raised:** 2026-06-15, during the Base Theme vs Default Theme terminology cleanup.

## Why

Terminology was clarified so that:

- **Base Theme** = the theme shipped in the repo (`themes/data/base_theme.json`) — seed + safety net, never rendered directly by clients.
- **Default Theme** = the live DB theme that drives the site `:root` fallback — what clients actually render.

The `Site Theme Config.base_theme` field is **misnamed**: it holds the **Default Theme**, not the Base Theme. The name should change to `default_theme` so the code matches the canonical glossary (`.cursor/rules/themes-glossary.mdc`).

## Scope of the rename

DocType fields:

- `Site Theme Config.base_theme` → `default_theme`
- `Site Theme Config.base_desk_theme` → `default_desk_theme`

Cascading code identifiers (audit + rename or alias):

- `themes/utils/site_theme_config_helpers.py` — `get_site_base_theme_name` / `set_site_base_theme_name` (and the SQL field references)
- API endpoints in `themes/api.py` — `set_base_theme`, `save_as_base_theme`, `get_base_theme_editor` (+ desk equivalents)
- `themes/utils/theme_service.py` — `set_base`, `save_as_base`, `get_base_editor_response`, `family.get_base_theme_name` / `set_base_theme_name`
- `themes/utils/theme_family.py` — base-theme-name accessors on `ThemeFamily`
- `themes/utils/css_writer.py` / `desk_css_writer.py` — base resolution for the `:root` block
- Frontend callers: `frontend/src/composables/useThemeEditor.ts`, editor pages — any `site_base_theme` / `is_base_theme` response keys
- `themes/CODE_INDEX.json` references

## Constraints

- **Add a migration patch** (`patches/v1_0/...`) that renames the Single fields and copies values; tolerate the legacy field during the migration window (mirror the existing `active_theme` → `base_theme` tolerance in `site_theme_config_helpers.py`).
- Keep deprecated response-key aliases (`site_base_theme`, `is_base_theme`) for one release so old clients don't break.
- **No tests exist** — build characterization tests around publish/`:root` first (see `plans/REFACTORING_PLAN.md` Stage 5) before renaming, or the rename is unverifiable.

## Done when

- `default_theme` / `default_desk_theme` are the live field names.
- Glossary note about the "legacy field-name clash" is removed.
- A downstream publish still emits the correct `:root` block from the renamed field.
