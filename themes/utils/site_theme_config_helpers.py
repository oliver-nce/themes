# Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
"""Read/write Site Theme Config.base_theme across rename from active_theme."""

from __future__ import annotations

from typing import Optional

import frappe


def get_site_base_theme_name() -> Optional[str]:
    """Return the site base theme link, tolerating pre-migrate active_theme storage."""
    rows = frappe.db.sql(
        """
        SELECT field, value
        FROM `tabSingles`
        WHERE doctype = 'Site Theme Config'
          AND field IN ('base_theme', 'active_theme')
        """,
        as_dict=True,
    )
    by_field = {row.field: row.value for row in rows}
    return by_field.get("base_theme") or by_field.get("active_theme")


def get_site_default_theme_name() -> Optional[str]:
    """Return the designated Default NCE Theme (is_default=1).

    Drives :root at publish. Falls back to Site Theme Config.base_theme only when
    no row is flagged (legacy / mid-migrate sites).
    """
    if not frappe.db.exists("DocType", "NCE Theme"):
        return get_site_base_theme_name()
    flagged = frappe.get_all(
        "NCE Theme",
        filters={"is_default": 1},
        pluck="name",
        limit=1,
    )
    if flagged:
        return flagged[0]
    return get_site_base_theme_name()


def set_site_base_theme_name(theme_name: str) -> None:
    """Persist base theme on the Single (new and legacy field rows during migration)."""
    meta = frappe.get_meta("Site Theme Config")
    cfg = frappe.get_single("Site Theme Config")
    cfg.flags.ignore_permissions = True
    if meta.has_field("base_theme"):
        cfg.set("base_theme", theme_name)
    if meta.has_field("active_theme"):
        cfg.set("active_theme", theme_name)
    if not meta.has_field("base_theme") and not meta.has_field("active_theme"):
        frappe.throw("Site Theme Config has no base_theme or active_theme field")
    cfg.save()
    for field in ("base_theme", "active_theme"):
        if frappe.db.exists("Singles", {"doctype": "Site Theme Config", "field": field}):
            frappe.db.sql(
                """
                UPDATE `tabSingles`
                SET value = %s
                WHERE doctype = 'Site Theme Config' AND field = %s
                """,
                (theme_name, field),
            )


def base_theme_field_on_meta() -> str:
    """Field name present on synced DocType metadata."""
    meta = frappe.get_meta("Site Theme Config")
    if meta.has_field("base_theme"):
        return "base_theme"
    if meta.has_field("active_theme"):
        return "active_theme"
    frappe.throw("Site Theme Config has no base_theme or active_theme field")


def get_site_base_desk_theme_name() -> Optional[str]:
    """Return the site base desk theme link from Site Theme Config."""
    if not frappe.db.exists("DocType", "Site Theme Config"):
        return None
    meta = frappe.get_meta("Site Theme Config")
    if not meta.has_field("base_desk_theme"):
        return None
    return frappe.db.get_single_value("Site Theme Config", "base_desk_theme")


def set_site_base_desk_theme_name(theme_name: str) -> None:
    """Persist base desk theme on the Single."""
    meta = frappe.get_meta("Site Theme Config")
    if not meta.has_field("base_desk_theme"):
        frappe.throw("Site Theme Config has no base_desk_theme field")
    cfg = frappe.get_single("Site Theme Config")
    cfg.flags.ignore_permissions = True
    cfg.set("base_desk_theme", theme_name)
    cfg.save()
