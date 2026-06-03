# Themes App Restructure — Phase 2 Coding Plan

Scoped to the three user-approved deliverables:

1. Save the current legacy `Theme Settings` Single as a **Default** theme in a new DocType.
2. Set the site to use that theme (`Site Theme Config` Single).
3. Add a tool to switch the site to an alternative theme (workspace shortcut + whitelisted API).

Per-page theming is **postponed** — single global `nce_theme.css` driven by one active-version pointer.

Paste each task below into Cursor's Composer model one at a time, in order. Each task is self-contained; the coder does not need to read other files or this plan. After Task 3 the install lock-timeout is already fixed, so if you need to stop mid-stream the site is still safe.

---

## TASK 1 of 13: Extract color math into a utility module

```
File: themes/utils/theme_color_utils.py  (NEW)

Create this file. Copy the following blocks VERBATIM from
themes/themes/doctype/theme_settings/theme_settings.py (lines 1-7 imports
and lines 8-218):

  - imports: json, math, os, frappe (drop frappe if not used here)
  - constants: BORDER_RADIUS_MAP, SPACING_SCALE_MAP, LINE_HEIGHT_MAP,
    SHADOW_DEFS, TRANSITION_MAP
  - helpers: _hex_to_rgb, _hex_to_hsl, _hsl_to_hex, _srgb_to_linear,
    _linear_to_srgb, _hex_to_oklch, _oklch_to_hex, _max_chroma_in_gamut,
    _SHADE_TARGETS, _generate_shades, _build_shadow

Only `json`, `math` are needed at the top. Do NOT import frappe here.
Do not modify the function bodies.

Do not delete anything from theme_settings.py yet — that happens in Task 3.
```

---

## TASK 2 of 13: Add the CSS writer / publish module

```
File: themes/utils/css_writer.py  (NEW)

Create this file with the following content exactly:

import json
import os
import hashlib
import frappe
from themes.utils.theme_color_utils import (
    BORDER_RADIUS_MAP, SPACING_SCALE_MAP, LINE_HEIGHT_MAP,
    TRANSITION_MAP, _build_shadow, _generate_shades,
)

COLOR_FIELDS = {
    "primary_color": "color-primary",
    "secondary_color": "color-secondary",
    "accent_color": "color-accent",
    "success_color": "color-success",
    "info_color": "color-info",
    "warning_color": "color-warning",
    "danger_color": "color-danger",
    "text_color": "color-text",
    "heading_color": "color-heading",
    "muted_color": "color-muted",
    "link_color": "color-link",
    "focus_color": "color-focus",
    "background_color": "color-bg",
    "surface_color": "color-surface",
    "border_color": "color-border",
    "row_alt_color": "color-row-alt",
}

SHADE_SCALE_FIELDS = {
    "primary_color": "color-primary",
    "secondary_color": "color-secondary",
    "accent_color": "color-accent",
    "success_color": "color-success",
    "info_color": "color-info",
    "warning_color": "color-warning",
    "danger_color": "color-danger",
}

MIGRATED_FIELDS = list(COLOR_FIELDS.keys()) + [
    "font_family", "heading_font_family", "font_size", "line_height",
    "font_weight_body", "border_radius", "spacing_scale", "shadow",
    "shadow_color", "transition_speed", "sidebar_width",
    "container_max_width", "tailwind_overrides", "custom_css",
]


def generate_css(payload: dict) -> str:
    """Build the full :root { --nce-* } CSS block from a token payload dict."""
    g = payload.get
    lines = [":root {", "", "\t/* ── Theme: canonical variables ── */"]
    for f, var in COLOR_FIELDS.items():
        v = g(f)
        if v:
            lines.append(f"\t--nce-{var}: {v};")
    lines += ["", "\t/* ── Shade scales (50–950) ── */"]
    for f, var in SHADE_SCALE_FIELDS.items():
        v = g(f)
        if not v:
            continue
        for shade_num, shade_hex in _generate_shades(v):
            lines.append(f"\t--nce-{var}-{shade_num}: {shade_hex};")
    ff = g("font_family")
    lines.append(
        f"\t--nce-font-family: "
        + (f"'{ff}', sans-serif" if ff and ff != "System Default"
           else "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif")
        + ";"
    )
    hf = g("heading_font_family")
    lines.append(
        f"\t--nce-font-heading: "
        + (f"'{hf}', sans-serif" if hf and hf != "System Default"
           else "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif")
        + ";"
    )
    lines.append(f"\t--nce-font-size: {g('font_size') or '14px'};")
    lines.append(f"\t--nce-font-weight: {g('font_weight_body') or '400'};")
    lines.append(f"\t--nce-line-height: {LINE_HEIGHT_MAP.get(g('line_height') or 'normal', '1.5')};")
    lines.append(f"\t--nce-border-radius: {BORDER_RADIUS_MAP.get(g('border_radius') or 'md', '0.375rem')};")
    lines.append(f"\t--nce-spacing-base: {SPACING_SCALE_MAP.get(g('spacing_scale') or 'normal', '1rem')};")
    sc = g("shadow_color") or "#000000"
    lines.append(f"\t--nce-shadow-color: {sc};")
    lines.append(f"\t--nce-shadow: {_build_shadow(g('shadow') or 'md', sc)};")
    lines.append(f"\t--nce-transition-speed: {TRANSITION_MAP.get(g('transition_speed') or 'normal', '200ms')};")
    if g("sidebar_width"):
        lines.append(f"\t--nce-sidebar-width: {g('sidebar_width')};")
    if g("container_max_width"):
        cw = "100%" if g("container_max_width") == "full" else g("container_max_width")
        lines.append(f"\t--nce-container-max-width: {cw};")
    if g("tailwind_overrides"):
        try:
            for k, v in json.loads(g("tailwind_overrides")).items():
                lines.append(f"\t--nce-{k}: {v};")
        except (json.JSONDecodeError, TypeError):
            pass
    lines.append("}")
    if g("custom_css"):
        lines += ["", g("custom_css")]
    return "\n".join(lines)


def _write_css_file(css: str) -> str:
    app_path = frappe.get_app_path("themes")
    css_dir = os.path.join(app_path, "public", "css")
    os.makedirs(css_dir, exist_ok=True)
    path = os.path.join(css_dir, "nce_theme.css")
    with open(path, "w") as f:
        f.write(css)
    return path


def publish_version(version_name: str) -> dict:
    """Read a Theme Version, regenerate nce_theme.css, update Site Theme Config."""
    version = frappe.get_doc("Theme Version", version_name)
    payload = json.loads(version.theme_json or "{}")
    css = generate_css(payload)
    _write_css_file(css)
    css_hash = hashlib.sha1(css.encode("utf-8")).hexdigest()[:8]
    frappe.db.set_single_value("Site Theme Config", "css_hash", css_hash)
    frappe.clear_cache()
    return {"status": "ok", "version": version_name, "css_hash": css_hash,
            "bytes": len(css)}

Do not change anything else.
```

---

## TASK 3 of 13: Neuter legacy `Theme Settings.on_update`

```
File: themes/themes/doctype/theme_settings/theme_settings.py

Read this file. Find the class ThemeSettings at line 259. Replace the
entire on_update method (lines 260-264) with:

    def on_update(self):
        # Deprecated. CSS publishing now lives on Theme Version + Site Theme Config.
        # Kept as a no-op so existing saves don't error during migration.
        return

Do NOT delete the helper functions above (lines 1-218) yet — other code
imports them indirectly until Task 1's util module fully replaces them.
Do not change anything else in this file.
```

---

## TASK 4 of 13: Create the `NCE Theme` DocType

```
Files: themes/themes/doctype/nce_theme/__init__.py  (NEW, empty)
       themes/themes/doctype/nce_theme/nce_theme.json  (NEW)
       themes/themes/doctype/nce_theme/nce_theme.py    (NEW)

nce_theme.json content:

{
 "actions": [],
 "allow_rename": 1,
 "autoname": "field:theme_name",
 "creation": "2026-06-03 00:00:00.000000",
 "doctype": "DocType",
 "engine": "InnoDB",
 "field_order": ["theme_name", "slug", "is_default", "status", "description"],
 "fields": [
  {"fieldname": "theme_name", "fieldtype": "Data", "label": "Theme Name", "reqd": 1, "unique": 1},
  {"fieldname": "slug", "fieldtype": "Data", "label": "Slug", "read_only": 1, "unique": 1},
  {"fieldname": "is_default", "fieldtype": "Check", "label": "Is Default", "default": "0"},
  {"fieldname": "status", "fieldtype": "Select", "label": "Status", "options": "Draft\nActive\nArchived", "default": "Active"},
  {"fieldname": "description", "fieldtype": "Small Text", "label": "Description"}
 ],
 "index_web_pages_for_search": 0,
 "links": [],
 "modified": "2026-06-03 00:00:00.000000",
 "modified_by": "Administrator",
 "module": "Themes",
 "name": "NCE Theme",
 "owner": "Administrator",
 "permissions": [
  {"create": 1, "delete": 1, "email": 1, "export": 1, "print": 1, "read": 1, "role": "System Manager", "share": 1, "write": 1}
 ],
 "sort_field": "creation",
 "sort_order": "DESC",
 "states": [],
 "track_changes": 1
}

nce_theme.py content:

import re
import frappe
from frappe import _
from frappe.model.document import Document


class NCETheme(Document):
    def before_save(self):
        if not self.slug:
            self.slug = re.sub(r"[^a-z0-9]+", "-", (self.theme_name or "").lower()).strip("-")

    def validate(self):
        if self.is_default:
            others = frappe.db.get_all(
                "NCE Theme",
                filters={"is_default": 1, "name": ["!=", self.name]},
                pluck="name",
            )
            if others:
                frappe.throw(_("Another theme is already marked default: {0}").format(others[0]))

Do not modify anything else.
```

---

## TASK 5 of 13: Create the `Theme Version` DocType

```
Files: themes/themes/doctype/theme_version/__init__.py  (NEW, empty)
       themes/themes/doctype/theme_version/theme_version.json  (NEW)
       themes/themes/doctype/theme_version/theme_version.py    (NEW)

theme_version.json content:

{
 "actions": [],
 "autoname": "format:TV-{parent_theme}-{version_no:04d}",
 "creation": "2026-06-03 00:00:00.000000",
 "doctype": "DocType",
 "engine": "InnoDB",
 "field_order": ["parent_theme", "version_no", "label", "published", "theme_json"],
 "fields": [
  {"fieldname": "parent_theme", "fieldtype": "Link", "label": "Theme", "options": "NCE Theme", "reqd": 1, "in_list_view": 1},
  {"fieldname": "version_no", "fieldtype": "Int", "label": "Version No", "reqd": 1, "in_list_view": 1},
  {"fieldname": "label", "fieldtype": "Data", "label": "Label", "in_list_view": 1},
  {"fieldname": "published", "fieldtype": "Check", "label": "Published", "default": "0", "in_list_view": 1},
  {"fieldname": "theme_json", "fieldtype": "Long Text", "label": "Theme JSON", "description": "Full token payload (JSON)"}
 ],
 "index_web_pages_for_search": 0,
 "links": [],
 "modified": "2026-06-03 00:00:00.000000",
 "modified_by": "Administrator",
 "module": "Themes",
 "name": "Theme Version",
 "owner": "Administrator",
 "permissions": [
  {"create": 1, "delete": 1, "email": 1, "export": 1, "print": 1, "read": 1, "role": "System Manager", "share": 1, "write": 1}
 ],
 "sort_field": "version_no",
 "sort_order": "DESC",
 "states": [],
 "track_changes": 1
}

theme_version.py content:

import frappe
from frappe import _
from frappe.model.document import Document


class ThemeVersion(Document):
    def before_insert(self):
        if not self.version_no:
            last = frappe.db.get_value(
                "Theme Version",
                {"parent_theme": self.parent_theme},
                "max(version_no)",
            )
            self.version_no = (last or 0) + 1

    def validate(self):
        if self.published:
            others = frappe.db.get_all(
                "Theme Version",
                filters={
                    "parent_theme": self.parent_theme,
                    "published": 1,
                    "name": ["!=", self.name],
                },
                pluck="name",
            )
            if others:
                frappe.db.set_value("Theme Version", others, "published", 0)

Do not modify anything else.
```

---

## TASK 6 of 13: Create the `Site Theme Config` Single DocType

```
Files: themes/themes/doctype/site_theme_config/__init__.py  (NEW, empty)
       themes/themes/doctype/site_theme_config/site_theme_config.json  (NEW)
       themes/themes/doctype/site_theme_config/site_theme_config.py    (NEW)

site_theme_config.json content:

{
 "actions": [],
 "creation": "2026-06-03 00:00:00.000000",
 "doctype": "DocType",
 "engine": "InnoDB",
 "field_order": ["active_theme", "active_version", "css_hash"],
 "fields": [
  {"fieldname": "active_theme", "fieldtype": "Link", "label": "Active Theme", "options": "NCE Theme"},
  {"fieldname": "active_version", "fieldtype": "Link", "label": "Active Version", "options": "Theme Version"},
  {"fieldname": "css_hash", "fieldtype": "Data", "label": "CSS Hash", "read_only": 1}
 ],
 "index_web_pages_for_search": 0,
 "issingle": 1,
 "links": [],
 "modified": "2026-06-03 00:00:00.000000",
 "modified_by": "Administrator",
 "module": "Themes",
 "name": "Site Theme Config",
 "owner": "Administrator",
 "permissions": [
  {"create": 1, "delete": 1, "email": 1, "print": 1, "read": 1, "role": "System Manager", "share": 1, "write": 1}
 ],
 "sort_field": "creation",
 "sort_order": "DESC",
 "states": [],
 "track_changes": 1
}

site_theme_config.py content:

import frappe
from frappe import _
from frappe.model.document import Document


class SiteThemeConfig(Document):
    def validate(self):
        if self.active_theme and not self.active_version:
            self.active_version = frappe.db.get_value(
                "Theme Version",
                {"parent_theme": self.active_theme, "published": 1},
                "name",
            )
        if self.active_version:
            parent = frappe.db.get_value("Theme Version", self.active_version, "parent_theme")
            if parent and parent != self.active_theme:
                frappe.throw(_("Version {0} does not belong to theme {1}").format(
                    self.active_version, self.active_theme))

    def on_update(self):
        # Don't publish during install/migrate — patch calls publish_version explicitly.
        if getattr(frappe.flags, "in_install", False) or getattr(frappe.flags, "in_migrate", False):
            return
        if self.active_version:
            from themes.utils.css_writer import publish_version
            publish_version(self.active_version)

Do not modify anything else.
```

---

## TASK 7 of 13: Add safe `after_install`

```
File: themes/install.py  (NEW)

Create this file with content:

import frappe


def after_install():
    if not frappe.db.exists("DocType", "Site Theme Config"):
        return
    if not frappe.db.get_singles_dict("Site Theme Config"):
        cfg = frappe.new_doc("Site Theme Config")
        cfg.flags.ignore_permissions = True
        cfg.insert()

Do not modify anything else.
```

---

## TASK 8 of 13: Wire `after_install` into hooks

```
File: themes/hooks.py

Read this file. After the existing `add_to_apps_screen = [...]` block
(ending around line 27), append:

after_install = "themes.install.after_install"

Leave app_include_css and everything else unchanged.
Do not modify anything else.
```

---

## TASK 9 of 13: Update the API surface

```
File: themes/api.py

Read this file. REPLACE the entire file contents with:

import frappe
from frappe import _
from themes.utils.css_writer import publish_version


@frappe.whitelist()
def set_active_theme(theme: str, version: str | None = None):
    """Switch the site to a different theme/version and regenerate nce_theme.css."""
    frappe.only_for("System Manager")
    if not frappe.db.exists("NCE Theme", theme):
        frappe.throw(_("NCE Theme {0} does not exist").format(theme))
    if not version:
        version = frappe.db.get_value(
            "Theme Version", {"parent_theme": theme, "published": 1}, "name"
        )
        if not version:
            frappe.throw(_("Theme {0} has no published version").format(theme))
    cfg = frappe.get_single("Site Theme Config")
    cfg.active_theme = theme
    cfg.active_version = version
    cfg.save()  # on_update triggers publish_version
    return {"status": "ok", "theme": theme, "version": version}


@frappe.whitelist()
def regenerate_theme_css():
    """Re-publish the currently active version (manual repair button)."""
    frappe.only_for("System Manager")
    cfg = frappe.get_single("Site Theme Config")
    if not cfg.active_version:
        frappe.throw(_("No active theme version set"))
    return publish_version(cfg.active_version)


@frappe.whitelist()
def list_themes():
    """Return all NCE Themes with their published version, for the switcher UI."""
    rows = frappe.get_all("NCE Theme", fields=["name", "theme_name", "is_default", "status"])
    for r in rows:
        r["published_version"] = frappe.db.get_value(
            "Theme Version", {"parent_theme": r["name"], "published": 1}, "name"
        )
    return rows

Do not modify anything else.
```

---

## TASK 10 of 13: Add the migration patch file

```
Files: themes/patches/v1_0/__init__.py  (NEW, empty)
       themes/patches/v1_0/migrate_theme_settings_to_nce_theme.py  (NEW)

migrate_theme_settings_to_nce_theme.py content:

import json
import frappe
from themes.utils.css_writer import MIGRATED_FIELDS, publish_version


def execute():
    """Migrate legacy Theme Settings Single → NCE Theme + Theme Version + Site Theme Config."""
    if frappe.db.exists("NCE Theme", "Default"):
        print("NCE Theme 'Default' already exists — skipping migration.")
        return

    if not frappe.db.exists("DocType", "Theme Settings"):
        print("Legacy Theme Settings DocType not present — nothing to migrate.")
        return

    old = frappe.db.get_singles_dict("Theme Settings") or {}
    if not old:
        print("Legacy Theme Settings has no data — creating empty Default theme.")

    theme = frappe.new_doc("NCE Theme")
    theme.theme_name = "Default"
    theme.is_default = 1
    theme.status = "Active"
    theme.description = "Migrated from legacy Theme Settings Single."
    theme.flags.ignore_permissions = True
    theme.insert()

    payload = {k: old.get(k) for k in MIGRATED_FIELDS if old.get(k) is not None}

    version = frappe.new_doc("Theme Version")
    version.parent_theme = theme.name
    version.version_no = 1
    version.label = "Migrated baseline"
    version.published = 1
    version.theme_json = json.dumps(payload, default=str)
    version.flags.ignore_permissions = True
    version.insert()

    cfg = frappe.get_single("Site Theme Config")
    cfg.active_theme = theme.name
    cfg.active_version = version.name
    cfg.flags.ignore_permissions = True
    cfg.save()

    publish_version(version.name)
    frappe.db.commit()
    print(f"Migrated Theme Settings → NCE Theme '{theme.name}' / Version '{version.name}'")

Do not modify anything else.
```

---

## TASK 11 of 13: Register the patch

```
File: themes/patches.txt

Read this file. Replace its entire contents with:

[pre_model_sync]

[post_model_sync]
themes.patches.v1_0.migrate_theme_settings_to_nce_theme

Do not modify anything else.
```

---

## TASK 12 of 13: Surface the switcher in the workspace

```
File: themes/themes/workspace/themes/themes.json

Read this file. Replace the entire file contents with:

{
 "charts": [],
 "content": "[{\"id\":\"hdr_overview\",\"type\":\"header\",\"data\":{\"text\":\"<span class=\\\"h4\\\"><b>Themes</b></span>\",\"col\":12}},{\"id\":\"sc_switch\",\"type\":\"shortcut\",\"data\":{\"shortcut_name\":\"Switch Theme\",\"col\":4}},{\"id\":\"sc_themes\",\"type\":\"shortcut\",\"data\":{\"shortcut_name\":\"Themes\",\"col\":4}},{\"id\":\"sc_versions\",\"type\":\"shortcut\",\"data\":{\"shortcut_name\":\"Theme Versions\",\"col\":4}}]",
 "creation": "2026-03-15 00:00:00.000000",
 "custom_blocks": [],
 "docstatus": 0,
 "doctype": "Workspace",
 "for_user": "",
 "hide_custom": 0,
 "icon": "tool",
 "idx": 0,
 "is_hidden": 0,
 "label": "Themes",
 "links": [
  {"hidden": 0, "is_query_report": 0, "label": "Theme Management", "link_count": 0, "onboard": 0, "type": "Card Break"},
  {"hidden": 0, "is_query_report": 0, "label": "NCE Theme", "link_to": "NCE Theme", "link_type": "DocType", "onboard": 0, "type": "Link"},
  {"hidden": 0, "is_query_report": 0, "label": "Theme Version", "link_to": "Theme Version", "link_type": "DocType", "onboard": 0, "type": "Link"},
  {"hidden": 0, "is_query_report": 0, "label": "Site Theme Config", "link_to": "Site Theme Config", "link_type": "DocType", "onboard": 0, "type": "Link"}
 ],
 "modified": "2026-06-03 00:00:00.000000",
 "modified_by": "Administrator",
 "module": "Themes",
 "name": "Themes",
 "number_cards": [],
 "owner": "Administrator",
 "parent_page": "",
 "public": 1,
 "quick_lists": [],
 "restrict_to_domain": "",
 "roles": [],
 "sequence_id": 100.0,
 "shortcuts": [
  {"color": "Blue", "doc_view": "", "label": "Switch Theme", "link_to": "Site Theme Config", "type": "DocType"},
  {"color": "Grey", "doc_view": "List", "label": "Themes", "link_to": "NCE Theme", "type": "DocType"},
  {"color": "Grey", "doc_view": "List", "label": "Theme Versions", "link_to": "Theme Version", "type": "DocType"}
 ],
 "title": "Themes"
}

Do not modify anything else.
```

---

## TASK 13 of 13: Verification — run on a staging copy

```
On the bench, against a staging copy of the site:

1. bench --site <staging> migrate
   Expect: patch logs "Migrated Theme Settings → NCE Theme 'Default' / Version 'TV-Default-0001'"
   and no lock-timeout / no _hex_to_oklch errors.

2. bench --site <staging> console
   >>> import frappe
   >>> frappe.get_doc("NCE Theme", "Default").as_dict()
   >>> frappe.get_doc("Theme Version", "TV-Default-0001").as_dict()
   >>> frappe.get_single("Site Theme Config").as_dict()
   Confirm active_theme="Default", active_version set, css_hash populated.

3. ls -la apps/themes/themes/public/css/nce_theme.css
   File exists, size > 0, mtime = now.

4. In Desk → Themes workspace → click "Switch Theme" → form opens on
   Site Theme Config. Pick a different theme (create one first via
   "Themes" shortcut if needed). Save. nce_theme.css should regenerate
   (check mtime + css_hash changes).

5. bench --site <staging> execute frappe.clear_cache && bench restart
   Hard-refresh browser. Confirm tokens in DevTools reflect the active
   theme.

6. Fresh-install test on a throwaway site:
   bench new-site test.local
   bench --site test.local install-app themes
   Expect: completes cleanly, after_install creates empty Site Theme
   Config, no migration runs (no legacy data). Then manually create an
   NCE Theme + Theme Version (published) and set active.

If any step fails: bench --site <site> migrate --skip-failing is NOT
the answer — capture the traceback and stop. The patch is idempotent;
fix the cause and re-run.
```

---

## Notes

- Order matters: do 1→13 sequentially.
- After **Task 3** the install lock-timeout is already fixed, so the site is safe to leave between tasks.
- The migration patch is **idempotent** (`frappe.db.exists("NCE Theme", "Default")` short-circuits).
- Per-page / per-route theming was postponed — revisit once single-site switching is verified in production.
