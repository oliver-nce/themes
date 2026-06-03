import frappe


def execute():
    """Remove deprecated Theme Version and Theme Settings DocTypes from the database."""
    removed = False

    if frappe.db.exists("DocType", "Theme Version"):
        for name in frappe.get_all("Theme Version", pluck="name"):
            frappe.delete_doc("Theme Version", name, force=1, ignore_permissions=True)
        removed = True

    if frappe.db.exists("DocType", "Theme Settings"):
        if frappe.db.exists("Theme Settings", "Theme Settings"):
            frappe.delete_doc(
                "Theme Settings", "Theme Settings", force=1, ignore_permissions=True
            )
        removed = True

    for doctype in ("Theme Version", "Theme Settings"):
        if frappe.db.exists("DocType", doctype):
            frappe.delete_doc("DocType", doctype, force=1, ignore_permissions=True)

    frappe.db.commit()
    if removed:
        print("Removed legacy Theme Version and Theme Settings DocTypes")
    else:
        print("Legacy Theme Version and Theme Settings already removed — skipping.")
