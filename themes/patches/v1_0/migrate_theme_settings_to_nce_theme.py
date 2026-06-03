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
