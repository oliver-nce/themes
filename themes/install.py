import json

import frappe

from themes.utils.css_writer import publish_theme
from themes.utils.desk_css_writer import publish_desk_theme
from themes.utils.default_desk_theme import load_bundled_base_desk_theme_payload
from themes.utils.default_theme import load_bundled_base_theme_payload
from themes.utils.site_theme_config_helpers import get_site_base_theme_name, set_site_base_theme_name
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


def _ensure_default_desk_theme():
    if frappe.db.exists("NCE Desk Theme", "Default"):
        return "Default"
    theme = frappe.new_doc("NCE Desk Theme")
    theme.theme_name = "Default"
    theme.is_default = 1
    theme.status = "Active"
    theme.description = "Default desk theme."
    theme.theme_json = json.dumps(load_bundled_base_desk_theme_payload(), default=str)
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
    default_desk_name = _ensure_default_desk_theme()
    cfg = frappe.get_single("Site Theme Config")
    base = get_site_base_theme_name()
    if not base or not frappe.db.exists("NCE Theme", base):
        set_site_base_theme_name(default_name)
        base = default_name

    if not cfg.base_desk_theme or not frappe.db.exists("NCE Desk Theme", cfg.base_desk_theme):
        cfg.base_desk_theme = default_desk_name
        cfg.flags.ignore_permissions = True
        cfg.save()

    publish_theme(base)
    publish_desk_theme(default_desk_name)
    sync_themes_workspace()
