"""Ensure is_default flag matches Site Theme Config pointers (flag-only Default detection)."""

from __future__ import annotations

import frappe

from themes.utils.site_theme_config_helpers import (
    get_site_base_desk_theme_name,
    get_site_base_theme_name,
    set_site_base_desk_theme_name,
    set_site_base_theme_name,
)


def execute():
    _sync_web_defaults()
    _sync_desk_defaults()


def _sync_web_defaults():
    pointer = get_site_base_theme_name()
    target = _resolve_target("NCE Theme", pointer)
    if not target:
        return
    _clear_default_flags("NCE Theme")
    frappe.db.set_value("NCE Theme", target, "is_default", 1, update_modified=False)
    set_site_base_theme_name(target)


def _sync_desk_defaults():
    pointer = get_site_base_desk_theme_name()
    target = _resolve_target("NCE Desk Theme", pointer)
    if not target:
        return
    _clear_default_flags("NCE Desk Theme")
    frappe.db.set_value("NCE Desk Theme", target, "is_default", 1, update_modified=False)
    set_site_base_desk_theme_name(target)


def _resolve_target(doctype: str, pointer: str | None) -> str | None:
    if pointer and frappe.db.exists(doctype, pointer):
        return pointer
    flagged = frappe.get_all(
        doctype,
        filters={"is_default": 1},
        pluck="name",
        limit=1,
    )
    if flagged:
        return flagged[0]
    legacy = frappe.get_all(
        doctype,
        filters={"theme_name": "Default"},
        pluck="name",
        limit=1,
    )
    return legacy[0] if legacy else None


def _clear_default_flags(doctype: str) -> None:
    frappe.db.sql(
        f"UPDATE `tab{doctype}` SET is_default = 0 WHERE IFNULL(is_default, 0) = 1"
    )
