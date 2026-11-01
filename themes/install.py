"""after_install creates Default web and desk themes from the bundled Base Theme payloads, publishes CSS, and syncs the workspace.

"""

import json
import os

import frappe

from themes.utils.css_publish import public_css_path
from themes.utils.css_writer import publish_theme
from themes.utils.desk_css_writer import publish_desk_theme
from themes.utils.default_desk_theme import load_bundled_base_desk_theme_payload
from themes.utils.default_theme import load_bundled_base_theme_payload
from themes.utils.site_theme_config_helpers import get_site_base_theme_name, set_site_base_theme_name
from themes.utils.workspace_sync import sync_themes_workspace


def _ensure_default_theme_doc(doctype: str, description: str, load_payload) -> str:
    if frappe.db.exists(doctype, "Default"):
        return "Default"
    theme = frappe.new_doc(doctype)
    theme.theme_name = "Default"
    theme.is_default = 1
    theme.status = "Active"
    theme.description = description
    theme.theme_json = json.dumps(load_payload(), default=str)
    theme.flags.ignore_permissions = True
    theme.insert()
    return theme.name


def _ensure_default_theme():
    return _ensure_default_theme_doc(
        "NCE Theme",
        "Default site theme.",
        load_bundled_base_theme_payload,
    )


def _ensure_default_desk_theme():
    return _ensure_default_theme_doc(
        "NCE Desk Theme",
        "Default desk theme.",
        load_bundled_base_desk_theme_payload,
    )


def _ensure_base_desk_theme(default_name: str) -> bool:
    cfg = frappe.get_single("Site Theme Config")
    if not cfg.base_desk_theme or not frappe.db.exists("NCE Desk Theme", cfg.base_desk_theme):
        cfg.base_desk_theme = default_name
        cfg.flags.ignore_permissions = True
        cfg.save()
        return True
    return False


def _print_css_file_status(css_filename: str) -> None:
    path = public_css_path(css_filename)
    if os.path.exists(path):
        print(f"✓ CSS file at: {path} ({os.path.getsize(path)} bytes)")
    else:
        print(f"✗ Warning: CSS file not found at: {path}")


def _run_setup(initialize, label: str):
    try:
        doc = initialize()
        frappe.db.commit()
        print(f"\n✅ {label} initialization complete!")
        return doc
    except Exception as e:
        print(f"\n❌ Error during {label.lower()} initialization: {e}")
        frappe.db.rollback()
        raise


def after_install():
    if not frappe.db.exists("DocType", "Site Theme Config"):
        return

    if not frappe.db.get_singles_dict("Site Theme Config"):
        cfg = frappe.new_doc("Site Theme Config")
        cfg.flags.ignore_permissions = True
        cfg.insert()

    default_name = _ensure_default_theme()
    default_desk_name = _ensure_default_desk_theme()
    base = get_site_base_theme_name()
    if not base or not frappe.db.exists("NCE Theme", base):
        set_site_base_theme_name(default_name)
        base = default_name

    _ensure_base_desk_theme(default_desk_name)

    publish_theme(base)
    publish_desk_theme(default_desk_name)
    sync_themes_workspace()
