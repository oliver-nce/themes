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


@frappe.whitelist()
def get_active_theme_editor():
    """Return active theme metadata and token payload for the Vue editor."""
    frappe.only_for("System Manager")
    cfg = frappe.get_single("Site Theme Config")
    if not cfg.active_theme:
        frappe.throw(_("No active theme set. Configure Site Theme Config first."))
    theme = frappe.get_doc("NCE Theme", cfg.active_theme)
    return {
        "theme": theme.name,
        "theme_name": theme.theme_name,
        "css_hash": cfg.css_hash,
        "payload": json.loads(theme.theme_json or "{}"),
    }


@frappe.whitelist()
def save_active_theme(payload):
    """Update active NCE Theme JSON and publish nce_theme.css."""
    frappe.only_for("System Manager")
    clean = _parse_payload(payload)
    cfg = frappe.get_single("Site Theme Config")
    if not cfg.active_theme:
        frappe.throw(_("No active theme set"))
    theme = frappe.get_doc("NCE Theme", cfg.active_theme)
    theme.theme_json = json.dumps(clean, default=str)
    theme.flags.ignore_permissions = True
    theme.save()
    result = publish_theme(theme.name)
    return {"status": "ok", "theme": theme.name, **result}


@frappe.whitelist()
def set_active_theme(theme: str, version: str | None = None):
    """Switch the site to a different theme and regenerate nce_theme.css."""
    frappe.only_for("System Manager")
    if not frappe.db.exists("NCE Theme", theme):
        frappe.throw(_("NCE Theme {0} does not exist").format(theme))
    cfg = frappe.get_single("Site Theme Config")
    cfg.active_theme = theme
    cfg.save()
    return {"status": "ok", "theme": theme}


@frappe.whitelist()
def regenerate_theme_css():
    """Re-publish the currently active theme (manual repair button)."""
    frappe.only_for("System Manager")
    cfg = frappe.get_single("Site Theme Config")
    if not cfg.active_theme:
        frappe.throw(_("No active theme set"))
    return publish_theme(cfg.active_theme)


@frappe.whitelist()
def list_themes():
    """Return all NCE Themes for the switcher UI."""
    return frappe.get_all(
        "NCE Theme",
        fields=["name", "theme_name", "is_default", "status"],
        order_by="theme_name asc",
    )
