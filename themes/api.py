import json

import frappe
from frappe import _
from frappe.utils.password import check_password
from themes.utils.bundle_base_theme import bundle_base_theme_to_app
from themes.utils.css_writer import TOKEN_FIELDS, publish_theme
from themes.utils.site_theme_config_helpers import (
    get_site_base_theme_name,
    set_site_base_theme_name,
)


def _base_theme_payload() -> dict:
    """Load the current Site Theme Config base palette for seeding new themes."""
    base = get_site_base_theme_name()
    if base and frappe.db.exists("NCE Theme", base):
        return json.loads(frappe.db.get_value("NCE Theme", base, "theme_json") or "{}")
    return {}


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
    base = get_site_base_theme_name()
    is_base = base == theme.name
    css_hash = None
    if is_base:
        css_hash = frappe.db.get_single_value("Site Theme Config", "css_hash")
    return {
        "theme": theme.name,
        "theme_name": theme.theme_name,
        "status": theme.status,
        "is_base_theme": is_base,
        "is_active": is_base,  # legacy alias
        "site_base_theme": base,
        "site_active_theme": base,  # legacy alias
        "css_hash": css_hash,
        "payload": json.loads(theme.theme_json or "{}"),
    }


def _require_password(password: str):
    if not password:
        frappe.throw(_("Password is required"), frappe.AuthenticationError)
    check_password(frappe.session.user, password)


@frappe.whitelist()
def get_theme_editor(theme: str):
    """Return token payload for any NCE Theme (for editing without applying to site)."""
    frappe.only_for("System Manager")
    return _theme_editor_response(theme)


@frappe.whitelist()
def get_base_theme_editor():
    """Return the site base theme for the editor."""
    frappe.only_for("System Manager")
    base = get_site_base_theme_name()
    if not base:
        frappe.throw(_("No base theme set. Configure Site Theme Config first."))
    return _theme_editor_response(base)


@frappe.whitelist()
def get_active_theme_editor():
    """Legacy alias for get_base_theme_editor."""
    return get_base_theme_editor()


@frappe.whitelist()
def get_base_theme_payload():
    """Return theme_json for the site base theme (for Restore to Base Theme)."""
    frappe.only_for("System Manager")
    return {"payload": _base_theme_payload()}


@frappe.whitelist()
def save_theme(theme: str, payload, status: str | None = None):
    """Save theme_json on a specific NCE Theme; republish when Active or site base."""
    frappe.only_for("System Manager")
    if not frappe.db.exists("NCE Theme", theme):
        frappe.throw(_("NCE Theme {0} does not exist").format(theme))
    clean = _parse_payload(payload)
    doc = frappe.get_doc("NCE Theme", theme)
    doc.theme_json = json.dumps(clean, default=str)
    if status in ("Inactive", "Active"):
        doc.status = status
    doc.flags.ignore_permissions = True
    doc.save()  # NCETheme.on_update republishes when status/base/Active warrants it
    base = get_site_base_theme_name()
    result = {
        "status": "ok",
        "theme": theme,
        "theme_status": doc.status,
        "is_base_theme": base == theme,
        "is_active": base == theme,
    }
    if base == theme or doc.status == "Active":
        result["css_hash"] = frappe.db.get_single_value("Site Theme Config", "css_hash")
    return result


@frappe.whitelist()
def save_active_theme(payload):
    """Legacy: save the site base theme."""
    frappe.only_for("System Manager")
    base = get_site_base_theme_name()
    if not base:
        frappe.throw(_("No base theme set"))
    return save_theme(base, payload)


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
    merged = {**_base_theme_payload(), **clean}
    doc = frappe.new_doc("NCE Theme")
    doc.theme_name = theme_name
    doc.theme_json = json.dumps(merged, default=str)
    doc.status = "Active"
    doc.flags.ignore_permissions = True
    doc.insert()
    return {
        "status": "ok",
        "theme": doc.name,
        "theme_name": doc.theme_name,
    }


def _set_base_theme(theme: str) -> dict:
    if not frappe.db.exists("NCE Theme", theme):
        frappe.throw(_("NCE Theme {0} does not exist").format(theme))
    set_site_base_theme_name(theme)
    return publish_theme(theme)


@frappe.whitelist()
def set_base_theme(theme: str):
    """Set Site Theme Config.base_theme and regenerate nce_theme.css."""
    frappe.only_for("System Manager")
    result = _set_base_theme(theme)
    return {"status": "ok", "theme": theme, **result}


@frappe.whitelist()
def save_as_base_theme(theme: str, password: str):
    """Set base theme, publish CSS, and bundle payload into app source files."""
    frappe.only_for("System Manager")
    _require_password(password)
    if not frappe.db.exists("NCE Theme", theme):
        frappe.throw(_("NCE Theme {0} does not exist").format(theme))
    payload = json.loads(frappe.db.get_value("NCE Theme", theme, "theme_json") or "{}")
    publish_result = _set_base_theme(theme)
    bundle_result = bundle_base_theme_to_app(payload)
    return {
        "status": "ok",
        "theme": theme,
        "bundled": True,
        **publish_result,
        **bundle_result,
    }


@frappe.whitelist()
def set_active_theme(theme: str):
    """Legacy alias for set_base_theme."""
    return set_base_theme(theme)


@frappe.whitelist()
def save_as_default(theme: str):
    """Legacy alias for set_base_theme (no password — prefer save_as_base_theme)."""
    return set_base_theme(theme)


@frappe.whitelist()
def regenerate_theme_css():
    """Re-publish from current DB state (manual repair)."""
    frappe.only_for("System Manager")
    base = get_site_base_theme_name()
    if not base:
        frappe.throw(_("No base theme set"))
    return publish_theme(base)


@frappe.whitelist()
def list_themes():
    """Return all NCE Themes with site-base flag."""
    frappe.only_for("System Manager")
    base = get_site_base_theme_name()
    rows = frappe.get_all(
        "NCE Theme",
        fields=["name", "theme_name", "is_default", "status"],
        order_by="theme_name asc",
    )
    for row in rows:
        row["is_base_theme"] = row.name == base
        row["is_active"] = row.name == base  # legacy alias
    return rows
