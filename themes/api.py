from __future__ import annotations

import json
import re
from typing import Optional

import frappe
from frappe import _
from frappe.utils.password import check_password
from themes.utils.css_writer import TOKEN_FIELDS, publish_theme
from themes.utils.desk_css_writer import DESK_TOKEN_FIELDS, _read_desk_css_hash, publish_desk_theme
from themes.utils.site_theme_config_helpers import (
    get_site_base_desk_theme_name,
    get_site_base_theme_name,
    set_site_base_desk_theme_name,
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
    clean = {k: payload[k] for k in TOKEN_FIELDS if k in payload and payload[k] is not None}
    from themes.utils.theme_color_utils import resolve_neutral_into_payload

    return resolve_neutral_into_payload(clean)


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
        frappe.throw(_("Password is required"))
    try:
        check_password(frappe.session.user, password)
    except frappe.AuthenticationError:
        frappe.throw(_("Incorrect password. Please try again."))


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
def save_theme(theme: str, payload, status: Optional[str] = None):
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
    from themes.utils.bundle_base_theme import bundle_base_theme_to_app

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


def _assert_theme_manageable(theme: str):
    """Raise if theme cannot be renamed or deleted."""
    base = get_site_base_theme_name()
    if base == theme:
        frappe.throw(
            _(
                "The site base theme cannot be renamed or deleted. "
                "Choose another base theme in System first."
            )
        )
    doc = frappe.get_doc("NCE Theme", theme)
    if doc.status == "Active":
        frappe.throw(_("Set the theme to Inactive before renaming or deleting it."))
    return doc


@frappe.whitelist()
def rename_theme(theme: str, theme_name: str):
    """Rename an Inactive, non-base NCE Theme.

    NCE Theme uses autoname=field:theme_name so name==theme_name at creation.
    We only update the display label (theme_name + slug); name stays as the
    stable primary key so existing references are unaffected.
    """
    frappe.only_for("System Manager")
    theme_name = (theme_name or "").strip()
    if not theme_name:
        frappe.throw(_("Theme name is required"))
    doc = _assert_theme_manageable(theme)
    if theme_name == doc.theme_name:
        return {"status": "ok", "theme": doc.name, "theme_name": doc.theme_name}
    if frappe.db.exists("NCE Theme", {"theme_name": theme_name}):
        frappe.throw(_("A theme named {0} already exists").format(theme_name))
    slug = re.sub(r"[^a-z0-9]+", "-", theme_name.lower()).strip("-")
    frappe.db.sql(
        """
        UPDATE `tabNCE Theme`
        SET theme_name = %(theme_name)s, slug = %(slug)s, modified = NOW(),
            modified_by = %(user)s
        WHERE name = %(name)s
        """,
        {"theme_name": theme_name, "slug": slug, "name": doc.name,
         "user": frappe.session.user},
    )
    frappe.clear_cache(doctype="NCE Theme")
    return {"status": "ok", "theme": doc.name, "theme_name": theme_name}


@frappe.whitelist()
def delete_theme(theme: str):
    """Delete an Inactive, non-base NCE Theme."""
    frappe.only_for("System Manager")
    _assert_theme_manageable(theme)
    frappe.delete_doc("NCE Theme", theme, ignore_permissions=True)
    return {"status": "ok", "deleted": theme}


def _base_desk_theme_payload() -> dict:
    base = get_site_base_desk_theme_name()
    if base and frappe.db.exists("NCE Desk Theme", base):
        return json.loads(frappe.db.get_value("NCE Desk Theme", base, "theme_json") or "{}")
    return {}


def _parse_desk_payload(payload):
    if isinstance(payload, str):
        payload = json.loads(payload)
    if not isinstance(payload, dict):
        frappe.throw(_("Invalid payload"))
    return {k: payload[k] for k in DESK_TOKEN_FIELDS if k in payload and payload[k] is not None}


def _desk_theme_editor_response(theme_name: str) -> dict:
    if not frappe.db.exists("NCE Desk Theme", theme_name):
        frappe.throw(_("NCE Desk Theme {0} does not exist").format(theme_name))
    theme = frappe.get_doc("NCE Desk Theme", theme_name)
    base = get_site_base_desk_theme_name()
    is_base = base == theme.name
    css_hash = None
    if is_base or theme.status == "Active":
        css_hash = _read_desk_css_hash()
    return {
        "theme": theme.name,
        "theme_name": theme.theme_name,
        "status": theme.status,
        "is_base_theme": is_base,
        "is_active": theme.status == "Active",
        "site_base_theme": base,
        "css_hash": css_hash,
        "payload": json.loads(theme.theme_json or "{}"),
    }


def _deactivate_other_desk_themes(theme: str) -> None:
    for name in frappe.get_all(
        "NCE Desk Theme",
        filters={"status": "Active", "name": ["!=", theme]},
        pluck="name",
    ):
        frappe.db.set_value("NCE Desk Theme", name, "status", "Inactive")


@frappe.whitelist()
def get_desk_theme_editor(theme: str):
    """Return desk chrome payload for any NCE Desk Theme."""
    frappe.only_for("System Manager")
    return _desk_theme_editor_response(theme)


@frappe.whitelist()
def get_base_desk_theme_editor():
    """Return the site base desk theme for the editor."""
    frappe.only_for("System Manager")
    base = get_site_base_desk_theme_name()
    if not base:
        frappe.throw(_("No base desk theme set. Configure Site Theme Config first."))
    return _desk_theme_editor_response(base)


@frappe.whitelist()
def get_active_desk_theme_editor():
    """Return the Active desk theme for the editor."""
    frappe.only_for("System Manager")
    active = frappe.get_all(
        "NCE Desk Theme",
        filters={"status": "Active"},
        limit=1,
        pluck="name",
    )
    if not active:
        frappe.throw(_("No active desk theme set."))
    return _desk_theme_editor_response(active[0])


@frappe.whitelist()
def get_base_desk_theme_payload():
    """Return theme_json for the site base desk theme."""
    frappe.only_for("System Manager")
    return {"payload": _base_desk_theme_payload()}


@frappe.whitelist()
def save_desk_theme(theme: str, payload, status: Optional[str] = None):
    """Save theme_json on a specific NCE Desk Theme; republish when Active or site base."""
    frappe.only_for("System Manager")
    if not frappe.db.exists("NCE Desk Theme", theme):
        frappe.throw(_("NCE Desk Theme {0} does not exist").format(theme))
    clean = _parse_desk_payload(payload)
    doc = frappe.get_doc("NCE Desk Theme", theme)
    doc.theme_json = json.dumps(clean, default=str)
    if status in ("Inactive", "Active"):
        if status == "Active":
            _deactivate_other_desk_themes(theme)
        doc.status = status
    doc.flags.ignore_permissions = True
    doc.save()
    base = get_site_base_desk_theme_name()
    result = {
        "status": "ok",
        "theme": theme,
        "theme_status": doc.status,
        "is_base_theme": base == theme,
        "is_active": doc.status == "Active",
    }
    if base == theme or doc.status == "Active":
        result["css_hash"] = _read_desk_css_hash()
    return result


@frappe.whitelist()
def save_active_desk_theme(payload):
    """Save the Active desk theme payload."""
    frappe.only_for("System Manager")
    active = frappe.get_all(
        "NCE Desk Theme",
        filters={"status": "Active"},
        limit=1,
        pluck="name",
    )
    if not active:
        frappe.throw(_("No active desk theme set."))
    return save_desk_theme(active[0], payload)


@frappe.whitelist()
def create_desk_theme(theme_name: str, payload):
    """Create a new NCE Desk Theme from the editor payload."""
    frappe.only_for("System Manager")
    theme_name = (theme_name or "").strip()
    if not theme_name:
        frappe.throw(_("Theme name is required"))
    if frappe.db.exists("NCE Desk Theme", {"theme_name": theme_name}):
        frappe.throw(_("A desk theme named {0} already exists").format(theme_name))
    clean = _parse_desk_payload(payload)
    merged = {**_base_desk_theme_payload(), **clean}
    doc = frappe.new_doc("NCE Desk Theme")
    doc.theme_name = theme_name
    doc.theme_json = json.dumps(merged, default=str)
    doc.status = "Inactive"
    doc.flags.ignore_permissions = True
    doc.insert()
    return {
        "status": "ok",
        "theme": doc.name,
        "theme_name": doc.theme_name,
    }


def _set_base_desk_theme(theme: str) -> dict:
    if not frappe.db.exists("NCE Desk Theme", theme):
        frappe.throw(_("NCE Desk Theme {0} does not exist").format(theme))
    set_site_base_desk_theme_name(theme)
    return publish_desk_theme(theme)


@frappe.whitelist()
def set_base_desk_theme(theme: str):
    """Set Site Theme Config.base_desk_theme and regenerate nce_desk_theme.css."""
    frappe.only_for("System Manager")
    result = _set_base_desk_theme(theme)
    return {"status": "ok", "theme": theme, **result}


@frappe.whitelist()
def save_as_base_desk_theme(theme: str, password: str):
    """Set base desk theme, publish CSS, and bundle payload into app source files."""
    frappe.only_for("System Manager")
    _require_password(password)
    if not frappe.db.exists("NCE Desk Theme", theme):
        frappe.throw(_("NCE Desk Theme {0} does not exist").format(theme))
    from themes.utils.bundle_base_desk_theme import bundle_base_desk_theme_to_app

    payload = json.loads(frappe.db.get_value("NCE Desk Theme", theme, "theme_json") or "{}")
    publish_result = _set_base_desk_theme(theme)
    bundle_result = bundle_base_desk_theme_to_app(payload)
    return {
        "status": "ok",
        "theme": theme,
        "bundled": True,
        **publish_result,
        **bundle_result,
    }


@frappe.whitelist()
def set_active_desk_theme(theme: str):
    """Set one NCE Desk Theme Active and republish desk CSS."""
    frappe.only_for("System Manager")
    if not frappe.db.exists("NCE Desk Theme", theme):
        frappe.throw(_("NCE Desk Theme {0} does not exist").format(theme))
    _deactivate_other_desk_themes(theme)
    doc = frappe.get_doc("NCE Desk Theme", theme)
    doc.status = "Active"
    doc.flags.ignore_permissions = True
    doc.save()
    result = publish_desk_theme(theme)
    return {"status": "ok", "theme": theme, **result}


@frappe.whitelist()
def list_desk_themes():
    """Return all NCE Desk Themes with site-base flag."""
    frappe.only_for("System Manager")
    base = get_site_base_desk_theme_name()
    rows = frappe.get_all(
        "NCE Desk Theme",
        fields=["name", "theme_name", "is_default", "status"],
        order_by="theme_name asc",
    )
    for row in rows:
        row["is_base_theme"] = row.name == base
        row["is_active"] = row.status == "Active"
    return rows


def _assert_desk_theme_manageable(theme: str):
    base = get_site_base_desk_theme_name()
    if base == theme:
        frappe.throw(
            _(
                "The site base desk theme cannot be renamed or deleted. "
                "Choose another base desk theme in System first."
            )
        )
    doc = frappe.get_doc("NCE Desk Theme", theme)
    if doc.status == "Active":
        frappe.throw(_("Set the desk theme to Inactive before renaming or deleting it."))
    return doc


@frappe.whitelist()
def rename_desk_theme(theme: str, theme_name: str):
    """Rename an Inactive, non-base NCE Desk Theme."""
    frappe.only_for("System Manager")
    theme_name = (theme_name or "").strip()
    if not theme_name:
        frappe.throw(_("Theme name is required"))
    doc = _assert_desk_theme_manageable(theme)
    if theme_name == doc.theme_name:
        return {"status": "ok", "theme": doc.name, "theme_name": doc.theme_name}
    if frappe.db.exists("NCE Desk Theme", {"theme_name": theme_name}):
        frappe.throw(_("A desk theme named {0} already exists").format(theme_name))
    slug = re.sub(r"[^a-z0-9]+", "-", theme_name.lower()).strip("-")
    frappe.db.sql(
        """
        UPDATE `tabNCE Desk Theme`
        SET theme_name = %(theme_name)s, slug = %(slug)s, modified = NOW(),
            modified_by = %(user)s
        WHERE name = %(name)s
        """,
        {"theme_name": theme_name, "slug": slug, "name": doc.name,
         "user": frappe.session.user},
    )
    frappe.clear_cache(doctype="NCE Desk Theme")
    return {"status": "ok", "theme": doc.name, "theme_name": theme_name}


@frappe.whitelist()
def delete_desk_theme(theme: str):
    """Delete an Inactive, non-base NCE Desk Theme."""
    frappe.only_for("System Manager")
    _assert_desk_theme_manageable(theme)
    frappe.delete_doc("NCE Desk Theme", theme, ignore_permissions=True)
    return {"status": "ok", "deleted": theme}


@frappe.whitelist()
def regenerate_desk_theme_css():
    """Re-publish desk CSS from current DB state (manual repair)."""
    frappe.only_for("System Manager")
    base = get_site_base_desk_theme_name()
    if not base:
        frappe.throw(_("No base desk theme set"))
    return publish_desk_theme(base)
