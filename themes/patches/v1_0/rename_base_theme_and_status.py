"""Renames Site Theme Config.active_theme to base_theme and maps old statuses to Inactive.

code-index:begin
{
 "purpose": "Renames Site Theme Config.active_theme to base_theme and maps old statuses to Inactive.",
 "read_when": "When Site Theme Config still stores active_theme or themes use Draft or Archived.",
 "gotchas": [],
 "keywords": ["active_theme", "base_theme", "Inactive", "Draft", "Archived", "tabSingles"],
 "format": 1
}
code-index:end
"""

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
