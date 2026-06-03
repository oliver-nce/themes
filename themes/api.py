import json

import frappe
from frappe import _
from themes.utils.css_writer import TOKEN_FIELDS, publish_theme


def _parse_payload(payload):
    if isinstance(payload, str):
        payload = json.loads(payload)
    if not isinstance(payload, dict):
        frappe.throw(_("Invalid payload"))
    return {k: payload[k] for k in TOKEN_FIELDS if k in payload and payload[k] is not None}


def _theme_editor_response(theme_name: str) -> dict:
    if not frappe.db.exists("NCE Theme", theme_name):
        frappe.throw(_("NCE Theme {0} does not exist").format(theme_name))
    theme = frappe.get_doc("NCE Theme", theme_name)
    active = frappe.db.get_single_value("Site Theme Config", "active_theme")
    is_active = active == theme.name
    css_hash = None
    if is_active:
        css_hash = frappe.db.get_single_value("Site Theme Config", "css_hash")
    return {
        "theme": theme.name,
        "theme_name": theme.theme_name,
        "is_active": is_active,
        "site_active_theme": active,
        "css_hash": css_hash,
        "payload": json.loads(theme.theme_json or "{}"),
    }


@frappe.whitelist()
def get_theme_editor(theme: str):
    """Return token payload for any NCE Theme (for editing without applying to site)."""
    frappe.only_for("System Manager")
    return _theme_editor_response(theme)


@frappe.whitelist()
def get_active_theme_editor():
    """Return the site-active theme for the editor (legacy entry point)."""
    frappe.only_for("System Manager")
    cfg = frappe.get_single("Site Theme Config")
    if not cfg.active_theme:
        frappe.throw(_("No active theme set. Configure Site Theme Config first."))
    return _theme_editor_response(cfg.active_theme)


@frappe.whitelist()
def save_theme(theme: str, payload):
    """Save theme_json on a specific NCE Theme; publish CSS only if it is site-active."""
    frappe.only_for("System Manager")
    if not frappe.db.exists("NCE Theme", theme):
        frappe.throw(_("NCE Theme {0} does not exist").format(theme))
    clean = _parse_payload(payload)
    doc = frappe.get_doc("NCE Theme", theme)
    doc.theme_json = json.dumps(clean, default=str)
    doc.flags.ignore_permissions = True
    doc.save()
    result = {"status": "ok", "theme": theme, "is_active": False}
    if frappe.db.get_single_value("Site Theme Config", "active_theme") == theme:
        result["is_active"] = True
        result.update(publish_theme(theme))
    return result


@frappe.whitelist()
def save_active_theme(payload):
    """Legacy: save the site-active theme."""
    frappe.only_for("System Manager")
    cfg = frappe.get_single("Site Theme Config")
    if not cfg.active_theme:
        frappe.throw(_("No active theme set"))
    return save_theme(cfg.active_theme, payload)


@frappe.whitelist()
def create_theme(theme_name: str, payload):
    """Create a new NCE Theme from the editor payload."""
    frappe.only_for("System Manager")
    theme_name = (theme_name or "").strip()
    if not theme_name:
        frappe.throw(_("Theme name is required"))
    if frappe.db.exists("NCE Theme", {"theme_name": theme_name}):
        frappe.throw(_("A theme named {0} already exists").format(theme_name))
    clean = _parse_payload(payload)
    doc = frappe.new_doc("NCE Theme")
    doc.theme_name = theme_name
    doc.theme_json = json.dumps(clean, default=str)
    doc.status = "Active"
    doc.flags.ignore_permissions = True
    doc.insert()
    return {
        "status": "ok",
        "theme": doc.name,
        "theme_name": doc.theme_name,
    }


@frappe.whitelist()
def set_active_theme(theme: str):
    """Switch the site to a theme and regenerate nce_theme.css."""
    frappe.only_for("System Manager")
    if not frappe.db.exists("NCE Theme", theme):
        frappe.throw(_("NCE Theme {0} does not exist").format(theme))
    cfg = frappe.get_single("Site Theme Config")
    cfg.active_theme = theme
    cfg.save()
    result = publish_theme(theme)
    return {"status": "ok", "theme": theme, **result}


@frappe.whitelist()
def regenerate_theme_css():
    """Re-publish the site-active theme (manual repair)."""
    frappe.only_for("System Manager")
    cfg = frappe.get_single("Site Theme Config")
    if not cfg.active_theme:
        frappe.throw(_("No active theme set"))
    return publish_theme(cfg.active_theme)


@frappe.whitelist()
def list_themes():
    """Return all NCE Themes with site-active flag."""
    frappe.only_for("System Manager")
    active = frappe.db.get_single_value("Site Theme Config", "active_theme")
    rows = frappe.get_all(
        "NCE Theme",
        fields=["name", "theme_name", "is_default", "status"],
        order_by="theme_name asc",
    )
    for row in rows:
        row["is_active"] = row.name == active
    return rows
