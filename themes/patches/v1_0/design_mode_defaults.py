import frappe

from themes.utils.design_mode import DEFAULT_PROTECTED


def execute():
	if not frappe.db.exists("DocType", "Theme Component Settings"):
		return
	if not frappe.db.get_single_value("Theme Component Settings", "protected_classes"):
		frappe.db.set_single_value("Theme Component Settings", "protected_classes", "\n".join(DEFAULT_PROTECTED))
