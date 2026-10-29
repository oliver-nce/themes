"""Copies the legacy Theme Settings Single into an NCE Theme named Default.

"""

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

    # base_desk_theme is mandatory on newer schemas, but the patch that seeds the
    # Default desk theme runs later. On a fresh site, create it here first.
    if frappe.db.exists("DocType", "NCE Desk Theme") and not frappe.db.exists(
        "NCE Desk Theme", "Default"
    ):
        from themes.utils.default_desk_theme import load_bundled_base_desk_theme_payload

        desk = frappe.new_doc("NCE Desk Theme")
        desk.theme_name = "Default"
        desk.is_default = 1
        desk.status = "Active"
        desk.description = "Default desk theme (Frappe stock chrome variables)."
        desk.theme_json = json.dumps(load_bundled_base_desk_theme_payload(), default=str)
        desk.flags.ignore_permissions = True
        desk.insert()

    # base_theme / base_desk_theme are mandatory on newer schemas.
    for fieldname in ("base_theme", "base_desk_theme"):
        if cfg.get(fieldname):
            continue
        df = cfg.meta.get_field(fieldname)
        if not df:
            continue
        value = df.default
        if not value and df.fieldtype == "Select" and df.options:
            value = next((o for o in df.options.split("\n") if o.strip()), None)
        if not value and df.fieldtype == "Link":
            if df.options == "NCE Theme":
                value = theme.name
            elif frappe.db.exists(df.options, "Default"):
                value = "Default"
            else:
                value = frappe.db.get_value(df.options, {}, "name")
        if value:
            cfg.set(fieldname, value)

    cfg.flags.ignore_permissions = True
    cfg.save()

    publish_theme(theme.name)
    frappe.db.commit()
    print(f"Migrated Theme Settings → NCE Theme '{theme.name}'")
