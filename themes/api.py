import json

import frappe
from frappe import _
from themes.utils.css_writer import TOKEN_FIELDS, publish_version


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
    if not cfg.active_version:
        frappe.throw(_("No active theme version set. Configure Site Theme Config first."))
    version = frappe.get_doc("Theme Version", cfg.active_version)
    theme_name = cfg.active_theme
    if cfg.active_theme:
        theme_name = frappe.db.get_value("NCE Theme", cfg.active_theme, "theme_name") or cfg.active_theme
    return {
        "theme": cfg.active_theme,
        "version": cfg.active_version,
        "theme_name": theme_name,
        "label": version.label,
        "css_hash": cfg.css_hash,
        "payload": json.loads(version.theme_json or "{}"),
    }


@frappe.whitelist()
def save_active_theme(payload):
    """Update active Theme Version JSON and publish nce_theme.css."""
    frappe.only_for("System Manager")
    clean = _parse_payload(payload)
    cfg = frappe.get_single("Site Theme Config")
    if not cfg.active_version:
        frappe.throw(_("No active theme version set"))
    version = frappe.get_doc("Theme Version", cfg.active_version)
    version.theme_json = json.dumps(clean, default=str)
    version.flags.ignore_permissions = True
    version.save()
    result = publish_version(version.name)
    return {"status": "ok", "version": version.name, **result}


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
