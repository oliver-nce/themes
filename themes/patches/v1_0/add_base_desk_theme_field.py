import frappe


def execute():
    """Ensure Site Theme Config has base_desk_theme slot after model sync (no-op if already set)."""
    if not frappe.db.exists("DocType", "Site Theme Config"):
        return

    if not frappe.db.exists(
        "DocField",
        {"parent": "Site Theme Config", "fieldname": "base_desk_theme"},
    ):
        return

    existing = frappe.db.get_single_value("Site Theme Config", "base_desk_theme")
    if existing:
        return
