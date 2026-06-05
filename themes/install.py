import json

import frappe

from themes.utils.css_writer import publish_theme
from themes.utils.default_theme import load_bundled_base_theme_payload
from themes.utils.workspace_sync import sync_themes_workspace


def _ensure_default_theme():
    if frappe.db.exists("NCE Theme", "Default"):
        return "Default"
    theme = frappe.new_doc("NCE Theme")
    theme.theme_name = "Default"
    theme.is_default = 1
    theme.status = "Active"
    theme.description = "Default site theme."
    theme.theme_json = json.dumps(load_bundled_base_theme_payload(), default=str)
    theme.flags.ignore_permissions = True
    theme.insert()
    return theme.name


def after_install():
    if not frappe.db.exists("DocType", "Site Theme Config"):
        return

    if not frappe.db.get_singles_dict("Site Theme Config"):
        cfg = frappe.new_doc("Site Theme Config")
        cfg.flags.ignore_permissions = True
        cfg.insert()

    default_name = _ensure_default_theme()
    cfg = frappe.get_single("Site Theme Config")
    if not cfg.base_theme or not frappe.db.exists("NCE Theme", cfg.base_theme):
        cfg.base_theme = default_name
        cfg.flags.ignore_permissions = True
        cfg.save()

    publish_theme(cfg.base_theme or default_name)
    sync_themes_workspace()
