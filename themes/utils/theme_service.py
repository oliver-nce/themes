# Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
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
from typing import Optional

import frappe
from frappe import _
from frappe.utils.password import check_password

from themes.utils.theme_doc import slugify_theme_name
from themes.utils.theme_family import DESK_FAMILY, ThemeFamily, WEB_FAMILY


# ─── AGENT:internals ─── Default theme detection, legacy API flags, is_active semantics


def _require_theme(family: ThemeFamily, theme: str) -> None:
    if not frappe.db.exists(family.doctype, theme):
        frappe.throw(_(family.theme_exists_label).format(theme))


def _is_default_theme_record(*, is_default: int | bool | None) -> bool:
    """True when this row is the Default theme (site :root fallback). Keyed on is_default only."""
    return bool(is_default)


def _default_theme_name(family: ThemeFamily) -> Optional[str]:
    """Primary key of the Default theme doc, if present."""
    names = frappe.get_all(
        family.doctype,
        filters={"is_default": 1},
        pluck="name",
        limit=1,
    )
    return names[0] if names else None


def _promote_to_default(family: ThemeFamily, theme: str) -> None:
    """Move is_default to theme and sync Site Theme Config pointer. Exactly one Default per family."""
    _require_theme(family, theme)
    current = _default_theme_name(family)
    if current and current != theme:
        frappe.db.set_value(family.doctype, current, "is_default", 0, update_modified=False)
    frappe.db.set_value(family.doctype, theme, "is_default", 1, update_modified=False)
    family.set_base_theme_name(theme)
    frappe.clear_cache(doctype=family.doctype)


_WEB_DEFAULT_FLAG_KEYS = (
    "is_default_theme",
    "site_default_theme",
    "is_base_theme",
    "site_base_theme",
    "site_active_theme",
)


def _strip_web_default_flags(family: ThemeFamily, data: dict) -> dict:
    """The web (NCE Theme) side has no Default theme; drop the flags. Desk keeps them."""
    if family.key == "web":
        for key in _WEB_DEFAULT_FLAG_KEYS:
            data.pop(key, None)
    return data


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
    if family.key == "web":
        return status == "Active"
    if family.is_active_is_base:
        return is_default
    return status == "Active"


def _editor_css_hash(family: ThemeFamily, *, is_default: bool, status: str) -> Optional[str]:
    if family.key == "web":
        return family.read_css_hash() if status == "Active" else None
    if family.is_active_is_base:
        return family.read_css_hash() if is_default else None
    if is_default or status == "Active":
        return family.read_css_hash()
    return None


# ─── AGENT:read ─── editor payloads; get_restore_base_payload reads app fixture (base_theme.json)


def get_editor_response(family: ThemeFamily, theme_name: str) -> dict:
    _require_theme(family, theme_name)
    theme = frappe.get_doc(family.doctype, theme_name)
    is_default = _is_default_theme_record(is_default=theme.is_default)
    result = {
        "theme": theme.name,
        "theme_name": theme.theme_name,
        "slug": getattr(theme, "slug", None) or "",
        "status": theme.status,
        "is_active": _is_active(family, is_default=is_default, status=theme.status),
        "css_hash": _editor_css_hash(family, is_default=is_default, status=theme.status),
        "payload": json.loads(theme.theme_json or "{}"),
        **_legacy_editor_flags(family, is_default=is_default, status=theme.status),
    }
    return _strip_web_default_flags(family, result)


def get_base_editor_response(family: ThemeFamily) -> dict:
    default = _default_theme_name(family)
    if not default:
        frappe.throw(_(family.no_base_set_message))
    return get_editor_response(family, default)


def active_theme_name(family: ThemeFamily) -> str:
    names = frappe.get_all(
        family.doctype,
        filters={"status": "Active"},
        limit=1,
        pluck="name",
    )
    if not names:
        frappe.throw(_("No active desk theme set."))
    return names[0]


def get_active_editor_response(family: ThemeFamily) -> dict:
    return get_editor_response(family, active_theme_name(family))


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
    _require_theme(family, theme)
    clean = family.parse_payload(payload)
    doc = frappe.get_doc(family.doctype, theme)
    doc.theme_json = json.dumps(clean, default=str)
    if status in ("Inactive", "Active"):
        if status == "Active":
            _deactivate_other(family, theme)
        doc.status = status
    doc.flags.ignore_permissions = True
    doc.save()
    is_default = _is_default_theme_record(is_default=doc.is_default)
    result = {
        "status": "ok",
        "theme": theme,
        "theme_status": doc.status,
        "is_default_theme": is_default,
        "is_base_theme": is_default,  # deprecated alias
        "is_active": _is_active(family, is_default=is_default, status=doc.status),
    }
    _strip_web_default_flags(family, result)
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
    """Promote theme to Default (:root driver) and republish CSS."""
    _promote_to_default(family, theme)
    result = family.publish(theme)
    return {"status": "ok", "theme": theme, "is_default_theme": True, **result}


def save_as_base(family: ThemeFamily, theme: str, password: str) -> dict:
    _require_password(password)
    _require_theme(family, theme)
    if family.bundle_to_app is None:
        frappe.throw(_("Bundling is not supported for this theme family"))
    payload = json.loads(frappe.db.get_value(family.doctype, theme, "theme_json") or "{}")
    if family.key == "web":
        bundle_result = family.bundle_to_app(payload)
        return {
            "status": "ok",
            "theme": theme,
            "bundled": True,
            **family.publish(theme),
            **bundle_result,
        }
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
    _require_theme(family, theme)
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
        fields=["name", "theme_name", "slug", "is_default", "status"],
        order_by="theme_name asc",
    )
    for row in rows:
        is_default = _is_default_theme_record(is_default=row.get("is_default"))
        row["is_default_theme"] = is_default
        row["is_base_theme"] = is_default  # deprecated alias
        row["is_active"] = _is_active(
            family,
            is_default=is_default,
            status=row["status"],
        )
        if family.key == "web":
            for key in ("is_default", "is_default_theme", "is_base_theme"):
                row.pop(key, None)
    return rows


# ─── AGENT:maintain ─── rename/delete; Default may be renamed, not deleted


def _assert_theme_deletable(family: ThemeFamily, theme: str):
    doc = frappe.get_doc(family.doctype, theme)
    if family.key != "web" and bool(doc.is_default):
        frappe.throw(_("The Default theme cannot be deleted."))
    if doc.status == "Active":
        frappe.throw(_(family.active_manage_error))
    return doc


def _assert_theme_renameable(family: ThemeFamily, theme: str):
    doc = frappe.get_doc(family.doctype, theme)
    if doc.status == "Active" and (family.key == "web" or not bool(doc.is_default)):
        frappe.throw(_(family.active_manage_error))
    return doc


def _rename_record(doctype: str, old_name: str, new_name: str) -> str:
    """Rename a record with frappe.rename_doc.

    Desk themes are linked only from the Site Theme Config single doctype. Frappe's
    update_user_settings then builds an empty `IN ()` clause and MariaDB raises
    ProgrammingError 1064. Single doctypes have no per-record user settings to fix,
    so that step is skipped when every link field belongs to a single doctype.
    """
    from unittest import mock

    try:
        from frappe.model import rename_doc as rename_module
    except ImportError:  # frappe stubbed out (unit tests)
        return frappe.rename_doc(doctype, old_name, new_name, force=True)

    link_fields = rename_module.get_link_fields(doctype)
    if link_fields and all(f.get("issingle") for f in link_fields):
        with mock.patch.object(rename_module, "update_user_settings", lambda *a, **k: None):
            return frappe.rename_doc(doctype, old_name, new_name, force=True)
    return frappe.rename_doc(doctype, old_name, new_name, force=True)


def rename(family: ThemeFamily, theme: str, theme_name: str) -> dict:
    theme_name = (theme_name or "").strip()
    if not theme_name:
        frappe.throw(_("Theme name is required"))
    doc = _assert_theme_renameable(family, theme)
    if theme_name == doc.theme_name:
        return {"status": "ok", "theme": doc.name, "theme_name": doc.theme_name}
    if frappe.db.exists(family.doctype, {"theme_name": theme_name}):
        frappe.throw(_(family.duplicate_theme_name_message).format(theme_name))
    # Records are named after theme_name (autoname field:theme_name), and Frappe forces
    # theme_name back to the record name on every save. Rename the record itself so the
    # new name sticks; changing only the theme_name column reverts on the next save.
    old_name = doc.name
    was_base = family.get_base_theme_name() == old_name
    new_name = _rename_record(family.doctype, old_name, theme_name)
    frappe.db.set_value(
        family.doctype, new_name, "slug", slugify_theme_name(theme_name), update_modified=False
    )
    if was_base:
        family.set_base_theme_name(new_name)
    frappe.clear_cache(doctype=family.doctype)
    return {"status": "ok", "theme": new_name, "theme_name": theme_name}


def delete(family: ThemeFamily, theme: str) -> dict:
    _assert_theme_deletable(family, theme)
    frappe.delete_doc(family.doctype, theme, ignore_permissions=True)
    return {"status": "ok", "deleted": theme}


def regenerate_css(family: ThemeFamily) -> dict:
    if family.key == "web":
        return family.publish("")
    base = family.get_base_theme_name()
    if not base:
        frappe.throw(_(family.no_base_short_message))
    return family.publish(base)
