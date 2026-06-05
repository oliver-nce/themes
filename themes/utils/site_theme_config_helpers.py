"""Read/write Site Theme Config.base_theme across rename from active_theme."""

import frappe


def get_site_base_theme_name() -> str | None:
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
