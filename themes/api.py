from __future__ import annotations

from typing import Optional

import frappe
from frappe import _

from themes.utils.theme_family import DESK_FAMILY, WEB_FAMILY
from themes.utils import theme_service as svc


def _theme_editor_response(theme_name: str) -> dict:
    """Backward compat for tests — prefer theme_service.get_editor_response(WEB_FAMILY, …)."""
    return svc.get_editor_response(WEB_FAMILY, theme_name)


def _desk_theme_editor_response(theme_name: str) -> dict:
    """Backward compat for tests — prefer theme_service.get_editor_response(DESK_FAMILY, …)."""
    return svc.get_editor_response(DESK_FAMILY, theme_name)


def _require_system_manager():
    frappe.only_for("System Manager")


@frappe.whitelist()
def get_theme_editor(theme: str):
    """Return token payload for any NCE Theme (for editing without applying to site)."""
    _require_system_manager()
    return svc.get_editor_response(WEB_FAMILY, theme)


@frappe.whitelist()
def get_base_theme_editor():
    """Return the site base theme for the editor."""
    _require_system_manager()
    return svc.get_base_editor_response(WEB_FAMILY)


@frappe.whitelist()
def get_active_theme_editor():
    """DEPRECATED — remove after callers confirmed gone.

    Legacy alias for get_base_theme_editor(). Still called from frontend useTheme.ts.
    Prefer get_base_theme_editor() or get_theme_editor(theme).
    """
    return get_base_theme_editor()


@frappe.whitelist()
def get_base_theme_payload():
    """Return the app-bundled base theme (data/base_theme.json) for Restore to Base Theme."""
    _require_system_manager()
    return svc.get_restore_base_payload(WEB_FAMILY)


@frappe.whitelist()
def save_theme(theme: str, payload, status: Optional[str] = None):
    """Save theme_json on a specific NCE Theme; republish when Active or site base."""
    _require_system_manager()
    return svc.save(WEB_FAMILY, theme, payload, status)


@frappe.whitelist()
def save_active_theme(payload):
    """DEPRECATED — remove after callers confirmed gone.

    Legacy: save the site base theme. Prefer save_theme(base, payload).
    """
    _require_system_manager()
    base = WEB_FAMILY.get_base_theme_name()
    if not base:
        frappe.throw(_("No base theme set"))
    return svc.save(WEB_FAMILY, base, payload)


@frappe.whitelist()
def create_theme(theme_name: str, payload):
    """Create a new NCE Theme from the editor payload."""
    _require_system_manager()
    return svc.create(WEB_FAMILY, theme_name, payload)


@frappe.whitelist()
def set_base_theme(theme: str):
    """Set Site Theme Config.base_theme and regenerate nce_theme.css."""
    _require_system_manager()
    result = svc.set_base(WEB_FAMILY, theme)
    return {"status": "ok", "theme": theme, **result}


@frappe.whitelist()
def save_as_base_theme(theme: str, password: str):
    """Set base theme, publish CSS, and bundle payload into app source files."""
    _require_system_manager()
    return svc.save_as_base(WEB_FAMILY, theme, password)


@frappe.whitelist()
def set_active_theme(theme: str):
    """DEPRECATED — remove after callers confirmed gone.

    Legacy alias for set_base_theme(). Prefer set_base_theme(theme).
    """
    return set_base_theme(theme)


@frappe.whitelist()
def save_as_default(theme: str):
    """DEPRECATED — remove after callers confirmed gone.

    Legacy alias for set_base_theme (no password). Prefer save_as_base_theme().
    """
    return set_base_theme(theme)


@frappe.whitelist()
def regenerate_theme_css():
    """Re-publish from current DB state (manual repair)."""
    _require_system_manager()
    return svc.regenerate_css(WEB_FAMILY)


@frappe.whitelist()
def list_themes():
    """Return all NCE Themes with site-base flag."""
    _require_system_manager()
    return svc.list_themes(WEB_FAMILY)


@frappe.whitelist()
def rename_theme(theme: str, theme_name: str):
    """Rename an Inactive, non-base NCE Theme."""
    _require_system_manager()
    return svc.rename(WEB_FAMILY, theme, theme_name)


@frappe.whitelist()
def delete_theme(theme: str):
    """Delete an Inactive, non-base NCE Theme."""
    _require_system_manager()
    return svc.delete(WEB_FAMILY, theme)


@frappe.whitelist()
def get_desk_theme_editor(theme: str):
    """Return desk chrome payload for any NCE Desk Theme."""
    _require_system_manager()
    return svc.get_editor_response(DESK_FAMILY, theme)


@frappe.whitelist()
def get_base_desk_theme_editor():
    """Return the site base desk theme for the editor."""
    _require_system_manager()
    return svc.get_base_editor_response(DESK_FAMILY)


@frappe.whitelist()
def get_active_desk_theme_editor():
    """Return the Active desk theme for the editor."""
    _require_system_manager()
    return svc.get_active_editor_response(DESK_FAMILY)


@frappe.whitelist()
def get_base_desk_theme_payload():
    """Return theme_json for the site base desk theme."""
    _require_system_manager()
    return svc.get_restore_base_payload(DESK_FAMILY)


@frappe.whitelist()
def save_desk_theme(theme: str, payload, status: Optional[str] = None):
    """Save theme_json on a specific NCE Desk Theme; republish when Active or site base."""
    _require_system_manager()
    return svc.save(DESK_FAMILY, theme, payload, status)


@frappe.whitelist()
def save_active_desk_theme(payload):
    """Save the Active desk theme payload."""
    _require_system_manager()
    active = frappe.get_all(
        "NCE Desk Theme",
        filters={"status": "Active"},
        limit=1,
        pluck="name",
    )
    if not active:
        frappe.throw(_("No active desk theme set."))
    return svc.save(DESK_FAMILY, active[0], payload)


@frappe.whitelist()
def create_desk_theme(theme_name: str, payload):
    """Create a new NCE Desk Theme from the editor payload."""
    _require_system_manager()
    return svc.create(DESK_FAMILY, theme_name, payload)


@frappe.whitelist()
def set_base_desk_theme(theme: str):
    """Set Site Theme Config.base_desk_theme and regenerate nce_desk_theme.css."""
    _require_system_manager()
    result = svc.set_base(DESK_FAMILY, theme)
    return {"status": "ok", "theme": theme, **result}


@frappe.whitelist()
def save_as_base_desk_theme(theme: str, password: str):
    """Set base desk theme, publish CSS, and bundle payload into app source files."""
    _require_system_manager()
    return svc.save_as_base(DESK_FAMILY, theme, password)


@frappe.whitelist()
def set_active_desk_theme(theme: str):
    """Set one NCE Desk Theme Active and republish desk CSS."""
    _require_system_manager()
    return svc.set_active(DESK_FAMILY, theme)


@frappe.whitelist()
def list_desk_themes():
    """Return all NCE Desk Themes with site-base flag."""
    _require_system_manager()
    return svc.list_themes(DESK_FAMILY)


@frappe.whitelist()
def rename_desk_theme(theme: str, theme_name: str):
    """Rename an Inactive, non-base NCE Desk Theme."""
    _require_system_manager()
    return svc.rename(DESK_FAMILY, theme, theme_name)


@frappe.whitelist()
def delete_desk_theme(theme: str):
    """Delete an Inactive, non-base NCE Desk Theme."""
    _require_system_manager()
    return svc.delete(DESK_FAMILY, theme)


@frappe.whitelist()
def regenerate_desk_theme_css():
    """Re-publish desk CSS from current DB state (manual repair)."""
    _require_system_manager()
    return svc.regenerate_css(DESK_FAMILY)
