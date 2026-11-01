import frappe


def execute():
	if not frappe.db.exists("DocType", "Theme Component Settings"):
		return
	frappe.db.set_single_value("Theme Component Settings", "protected_classes", "")
