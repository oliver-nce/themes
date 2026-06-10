import frappe

from themes.utils.desk_css_writer import _read_desk_css_hash, publish_desk_theme


def execute():
	"""Add desk_css_hash to Site Theme Config and backfill from the published sidecar."""
	if not frappe.db.exists(
		"DocField",
		{"parent": "Site Theme Config", "fieldname": "desk_css_hash"},
	):
		return

	desk_hash = _read_desk_css_hash()
	if desk_hash:
		frappe.db.set_single_value("Site Theme Config", "desk_css_hash", desk_hash)
	elif frappe.db.exists("DocType", "NCE Desk Theme"):
		result = publish_desk_theme()
		if result.get("css_hash"):
			frappe.db.set_single_value("Site Theme Config", "desk_css_hash", result["css_hash"])

	frappe.db.commit()
