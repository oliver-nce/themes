import frappe


@frappe.whitelist()
def regenerate_theme_css():
	"""Regenerate the site-wide theme CSS from Theme Settings."""
	doc = frappe.get_single("Theme Settings")
	doc.on_update()
	return {"status": "ok", "compiled_css_length": len(doc.compiled_css or "")}
