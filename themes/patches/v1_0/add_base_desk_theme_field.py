import json

import frappe

from themes.utils.default_desk_theme import load_bundled_base_desk_theme_payload


def execute():
    """Add base_desk_theme slot and seed Default NCE Desk Theme from bundled Frappe defaults."""
    if not frappe.db.exists("DocType", "NCE Desk Theme"):
        return

    if not frappe.db.exists(
        "DocField",
        {"parent": "Site Theme Config", "fieldname": "base_desk_theme"},
    ):
        return

    default_name = "Default"
    payload = load_bundled_base_desk_theme_payload()
    payload_json = json.dumps(payload, default=str)

    if not frappe.db.exists("NCE Desk Theme", default_name):
        theme = frappe.new_doc("NCE Desk Theme")
        theme.theme_name = default_name
        theme.is_default = 1
        theme.status = "Active"
        theme.description = "Default desk theme (Frappe stock chrome variables)."
        theme.theme_json = payload_json
        theme.flags.ignore_permissions = True
        theme.insert()
    else:
        existing_json = frappe.db.get_value("NCE Desk Theme", default_name, "theme_json") or "{}"
        if existing_json in ("", "{}"):
            frappe.db.set_value(
                "NCE Desk Theme",
                default_name,
                {"theme_json": payload_json, "is_default": 1},
            )

    if frappe.db.exists("DocType", "Site Theme Config"):
        base = frappe.db.get_single_value("Site Theme Config", "base_desk_theme")
        if not base or not frappe.db.exists("NCE Desk Theme", base):
            cfg = frappe.get_single("Site Theme Config")
            cfg.base_desk_theme = default_name
            cfg.flags.ignore_permissions = True
            cfg.save()

    from themes.utils.desk_css_writer import publish_desk_theme

    publish_desk_theme(default_name)
    frappe.db.commit()
