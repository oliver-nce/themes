"""Family-parameterized theme CRUD — single implementation for Web and Desk.

AGENT NAVIGATION — grep "AGENT:" in this file
  AGENT:internals       — _is_default_theme_record, _legacy_editor_flags, _is_active
  AGENT:read            — get_editor_response, get_base_editor_response, get_restore_base_payload
  AGENT:write           — save, create, set_base, save_as_base, set_active
  AGENT:maintain        — list_themes, rename, delete, regenerate_css
  AGENT:auth            — _require_password (wrong password → ValidationError, not logout)
"""
from __future__ import annotations

import json
import re
from typing import Optional

import frappe
from frappe import _
from frappe.utils.password import check_password

from themes.utils.theme_family import DESK_FAMILY, ThemeFamily, WEB_FAMILY


# ─── AGENT:internals ─── Default theme detection, legacy API flags, is_active semantics


def _is_default_theme_record(*, is_default: int | bool | None, theme_name: str) -> bool:
    """True when this row is the product Default theme (site :root fallback). Always exactly one per family."""
    return bool(is_default) or theme_name == "Default"


def _default_theme_name(family: ThemeFamily) -> Optional[str]:
    """Primary key of the Default theme doc, if present."""
    names = frappe.get_all(
        family.doctype,
        filters={"is_default": 1},
        pluck="name",
        limit=1,
    )
    if names:
        return names[0]
    names = frappe.get_all(
        family.doctype,
        filters={"theme_name": "Default"},
        pluck="name",
        limit=1,
    )
    return names[0] if names else None


def _legacy_editor_flags(
    family: ThemeFamily,
    *,
    is_default: bool,
    status: str,
) -> dict:
    """Canonical is_default_theme plus deprecated is_base_theme / site_* aliases for old clients."""
    site_default = _default_theme_name(family)
    flags = {
        "is_default_theme": is_default,
        "site_default_theme": site_default,
        # DEPRECATED — same values as is_default_theme / site_default_theme; do not use in new code.
        "is_base_theme": is_default,
        "site_base_theme": site_default,
    }
    if family.include_site_active_theme_legacy:
        flags["site_active_theme"] = site_default
    return flags


# ─── AGENT:auth ─── password gate for save_as_base (must not raise AuthenticationError)


def _require_password(password: str) -> None:
    if not password:
        frappe.throw(_("Password is required"))
    try:
        check_password(frappe.session.user, password)
    except frappe.AuthenticationError:
        frappe.throw(_("Incorrect password. Please try again."))


def _is_active(family: ThemeFamily, *, is_default: bool, status: str) -> bool:
    if family.is_active_is_base:
        return is_default
    return status == "Active"


def _editor_css_hash(family: ThemeFamily, *, is_default: bool, status: str) -> Optional[str]:
    if family.is_active_is_base:
        return family.read_css_hash() if is_default else None
    if is_default or status == "Active":
        return family.read_css_hash()
    return None


# ─── AGENT:read ─── editor payloads; get_restore_base_payload reads app fixture (base_theme.json)


def get_editor_response(family: ThemeFamily, theme_name: str) -> dict:
    if not frappe.db.exists(family.doctype, theme_name):
        frappe.throw(_(family.theme_exists_label).format(theme_name))
    theme = frappe.get_doc(family.doctype, theme_name)
    is_default = _is_default_theme_record(
        is_default=theme.is_default,
        theme_name=theme.theme_name,
    )
    result = {
        "theme": theme.name,
        "theme_name": theme.theme_name,
        "status": theme.status,
        "is_active": _is_active(family, is_default=is_default, status=theme.status),
        "css_hash": _editor_css_hash(family, is_default=is_default, status=theme.status),
        "payload": json.loads(theme.theme_json or "{}"),
        **_legacy_editor_flags(family, is_default=is_default, status=theme.status),
    }
    return result


def get_base_editor_response(family: ThemeFamily) -> dict:
    default = _default_theme_name(family)
    if not default:
        frappe.throw(_(family.no_base_set_message))
    return get_editor_response(family, default)


def get_active_editor_response(family: ThemeFamily) -> dict:
    active = frappe.get_all(
        family.doctype,
        filters={"status": "Active"},
        limit=1,
        pluck="name",
    )
    if not active:
        frappe.throw(_("No active desk theme set."))
    return get_editor_response(family, active[0])


def get_restore_base_payload(family: ThemeFamily) -> dict:
    if family.load_bundled_base_payload is not None:
        return {"payload": family.load_bundled_base_payload()}
    return {"payload": family.load_seed_payload()}


def _deactivate_other(family: ThemeFamily, theme: str) -> None:
    if not family.single_active:
        return
    for name in frappe.get_all(
        family.doctype,
        filters={"status": "Active", "name": ["!=", theme]},
        pluck="name",
    ):
        frappe.db.set_value(family.doctype, name, "status", "Inactive")


# ─── AGENT:write ─── save/create/set_base/save_as_base/set_active


def save(
    family: ThemeFamily,
    theme: str,
    payload,
    status: Optional[str] = None,
) -> dict:
    if not frappe.db.exists(family.doctype, theme):
        frappe.throw(_(family.theme_exists_label).format(theme))
    clean = family.parse_payload(payload)
    doc = frappe.get_doc(family.doctype, theme)
    doc.theme_json = json.dumps(clean, default=str)
    if status in ("Inactive", "Active"):
        if status == "Active":
            _deactivate_other(family, theme)
        doc.status = status
    doc.flags.ignore_permissions = True
    doc.save()
    is_default = _is_default_theme_record(
        is_default=doc.is_default,
        theme_name=doc.theme_name,
    )
    result = {
        "status": "ok",
        "theme": theme,
        "theme_status": doc.status,
        "is_default_theme": is_default,
        "is_base_theme": is_default,  # deprecated alias
        "is_active": _is_active(family, is_default=is_default, status=doc.status),
    }
    base = family.get_base_theme_name()
    if base == theme or doc.status == "Active":
        result["css_hash"] = family.read_css_hash()
    return result


def create(family: ThemeFamily, theme_name: str, payload) -> dict:
    theme_name = (theme_name or "").strip()
    if not theme_name:
        frappe.throw(_("Theme name is required"))
    if frappe.db.exists(family.doctype, {"theme_name": theme_name}):
        frappe.throw(_(family.duplicate_theme_name_message).format(theme_name))
    clean = family.parse_payload(payload)
    merged = {**family.load_seed_payload(), **clean}
    doc = frappe.new_doc(family.doctype)
    doc.theme_name = theme_name
    doc.theme_json = json.dumps(merged, default=str)
    doc.status = family.default_create_status
    doc.flags.ignore_permissions = True
    doc.insert()
    return {
        "status": "ok",
        "theme": doc.name,
        "theme_name": doc.theme_name,
    }


def set_base(family: ThemeFamily, theme: str) -> dict:
    if not frappe.db.exists(family.doctype, theme):
        frappe.throw(_(family.theme_exists_label).format(theme))
    family.set_base_theme_name(theme)
    return family.publish(theme)


def save_as_base(family: ThemeFamily, theme: str, password: str) -> dict:
    _require_password(password)
    if not frappe.db.exists(family.doctype, theme):
        frappe.throw(_(family.theme_exists_label).format(theme))
    if family.bundle_to_app is None:
        frappe.throw(_("Bundling is not supported for this theme family"))
    payload = json.loads(frappe.db.get_value(family.doctype, theme, "theme_json") or "{}")
    publish_result = set_base(family, theme)
    bundle_result = family.bundle_to_app(payload)
    return {
        "status": "ok",
        "theme": theme,
        "bundled": True,
        **publish_result,
        **bundle_result,
    }


def set_active(family: ThemeFamily, theme: str) -> dict:
    if not frappe.db.exists(family.doctype, theme):
        frappe.throw(_(family.theme_exists_label).format(theme))
    _deactivate_other(family, theme)
    doc = frappe.get_doc(family.doctype, theme)
    doc.status = "Active"
    doc.flags.ignore_permissions = True
    doc.save()
    result = family.publish(theme)
    return {"status": "ok", "theme": theme, **result}


def list_themes(family: ThemeFamily) -> list[dict]:
    rows = frappe.get_all(
        family.doctype,
        fields=["name", "theme_name", "is_default", "status"],
        order_by="theme_name asc",
    )
    for row in rows:
        is_default = _is_default_theme_record(
            is_default=row.get("is_default"),
            theme_name=row["theme_name"],
        )
        row["is_default_theme"] = is_default
        row["is_base_theme"] = is_default  # deprecated alias
        row["is_active"] = _is_active(
            family,
            is_default=is_default,
            status=row["status"],
        )
    return rows


# ─── AGENT:maintain ─── rename/delete (Inactive non-Default only), regenerate_css


def _assert_theme_manageable(family: ThemeFamily, theme: str):
    default_name = _default_theme_name(family)
    if default_name and theme == default_name:
        frappe.throw(_("The Default theme cannot be renamed or deleted."))
    doc = frappe.get_doc(family.doctype, theme)
    if doc.status == "Active":
        frappe.throw(_(family.active_manage_error))
    return doc


def rename(family: ThemeFamily, theme: str, theme_name: str) -> dict:
    theme_name = (theme_name or "").strip()
    if not theme_name:
        frappe.throw(_("Theme name is required"))
    doc = _assert_theme_manageable(family, theme)
    if theme_name == doc.theme_name:
        return {"status": "ok", "theme": doc.name, "theme_name": doc.theme_name}
    if frappe.db.exists(family.doctype, {"theme_name": theme_name}):
        frappe.throw(_(family.duplicate_theme_name_message).format(theme_name))
    slug = re.sub(r"[^a-z0-9]+", "-", theme_name.lower()).strip("-")
    table = f"tab{family.doctype}"
    frappe.db.sql(
        f"""
        UPDATE `{table}`
        SET theme_name = %(theme_name)s, slug = %(slug)s, modified = NOW(),
            modified_by = %(user)s
        WHERE name = %(name)s
        """,
        {"theme_name": theme_name, "slug": slug, "name": doc.name, "user": frappe.session.user},
    )
    frappe.clear_cache(doctype=family.doctype)
    return {"status": "ok", "theme": doc.name, "theme_name": theme_name}


def delete(family: ThemeFamily, theme: str) -> dict:
    _assert_theme_manageable(family, theme)
    frappe.delete_doc(family.doctype, theme, ignore_permissions=True)
    return {"status": "ok", "deleted": theme}


def regenerate_css(family: ThemeFamily) -> dict:
    base = family.get_base_theme_name()
    if not base:
        msg = "No base desk theme set" if family.key == "desk" else "No base theme set"
        frappe.throw(_(msg))
    return family.publish(base)
