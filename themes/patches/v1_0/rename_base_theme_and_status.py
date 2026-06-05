import frappe


def execute():
    """Rename Site Theme Config.active_theme → base_theme; Draft/Archived → Inactive."""
    if frappe.db.exists("DocType", "Site Theme Config"):
        frappe.db.sql(
            """
            UPDATE `tabSingles`
            SET field = 'base_theme'
            WHERE doctype = 'Site Theme Config' AND field = 'active_theme'
            """
        )

    if frappe.db.exists("DocType", "NCE Theme"):
        frappe.db.sql(
            """
            UPDATE `tabNCE Theme`
            SET status = 'Inactive'
            WHERE status IN ('Draft', 'Archived')
            """
        )

    frappe.db.commit()
