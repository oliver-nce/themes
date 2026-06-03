import json
import frappe
from themes.utils.css_writer import MIGRATED_FIELDS, publish_theme


def execute():
    """Migrate legacy Theme Settings Single → NCE Theme + Site Theme Config."""
    if frappe.db.exists("NCE Theme", "Default"):
        print("NCE Theme 'Default' already exists — skipping migration.")
        return

    if not frappe.db.exists("DocType", "Theme Settings"):
        print("Legacy Theme Settings DocType not present — nothing to migrate.")
        return

    old = frappe.db.get_singles_dict("Theme Settings") or {}
    if not old:
        print("Legacy Theme Settings has no data — creating empty Default theme.")

    payload = {k: old.get(k) for k in MIGRATED_FIELDS if old.get(k) is not None}

    theme = frappe.new_doc("NCE Theme")
    theme.theme_name = "Default"
    theme.is_default = 1
    theme.status = "Active"
    theme.description = "Migrated from legacy Theme Settings Single."
    theme.theme_json = json.dumps(payload, default=str)
    theme.flags.ignore_permissions = True
    theme.insert()

    cfg = frappe.get_single("Site Theme Config")
    cfg.active_theme = theme.name
    cfg.flags.ignore_permissions = True
    cfg.save()

    publish_theme(theme.name)
    frappe.db.commit()
    print(f"Migrated Theme Settings → NCE Theme '{theme.name}'")
