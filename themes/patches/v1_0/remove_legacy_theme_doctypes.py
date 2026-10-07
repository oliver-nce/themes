"""Deletes leftover Theme Version and Theme Settings DocTypes and their rows.

code-index:begin
{
 "purpose": "Deletes leftover Theme Version and Theme Settings DocTypes and their rows.",
 "read_when": "When deprecated Theme Version or Theme Settings tables are still in the database.",
 "gotchas": [],
 "keywords": ["Theme Version", "Theme Settings", "_delete_all_rows", "delete_doc", "Singles"],
 "format": 1
}
code-index:end
"""

import frappe


def _delete_all_rows(doctype: str) -> bool:
    """Delete every row for a DocType without loading its Document controller."""
    if not frappe.db.table_exists(doctype):
        return False
    frappe.db.delete(doctype)
    return True


def execute():
    """Remove deprecated Theme Version and Theme Settings DocTypes from the database."""
    removed = False

    if _delete_all_rows("Theme Version"):
        removed = True

    if frappe.db.exists("DocType", "Theme Settings"):
        frappe.db.delete("Singles", {"doctype": "Theme Settings"})
        _delete_all_rows("Theme Settings")
        removed = True

    for doctype in ("Theme Version", "Theme Settings"):
        if frappe.db.exists("DocType", doctype):
            frappe.delete_doc("DocType", doctype, force=1, ignore_permissions=True)

    frappe.db.commit()
    if removed:
        print("Removed legacy Theme Version and Theme Settings DocTypes")
    else:
        print("Legacy Theme Version and Theme Settings already removed — skipping.")
