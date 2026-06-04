"""Force-sync the Themes workspace from app JSON and remove Theme Version links."""

import json
import os

import frappe
from frappe.modules.import_file import import_file_by_path


def _scrub_theme_version_workspace_rows():
	"""Remove child rows that still point at the deleted DocType."""
	for doctype in ("Workspace Link", "Workspace Shortcut"):
		if frappe.db.table_exists(doctype):
			frappe.db.delete(doctype, {"link_to": "Theme Version"})
			frappe.db.delete(doctype, {"link_to": "Theme Versions"})


def _scrub_workspace_content():
	"""Drop legacy Theme Versions blocks from the workspace content JSON."""
	if not frappe.db.exists("Workspace", "Themes"):
		return
	content = frappe.db.get_value("Workspace", "Themes", "content")
	if not content:
		return
	try:
		blocks = json.loads(content)
	except (TypeError, json.JSONDecodeError):
		return
	filtered = [
		b
		for b in blocks
		if b.get("data", {}).get("shortcut_name") != "Theme Versions"
	]
	if len(filtered) == len(blocks):
		return
	frappe.db.set_value("Workspace", "Themes", "content", json.dumps(filtered))


def execute():
	_scrub_theme_version_workspace_rows()
	_scrub_workspace_content()

	app_path = frappe.get_app_path("themes")
	workspace_json = os.path.join(app_path, "themes", "workspace", "themes", "themes.json")
	if os.path.isfile(workspace_json):
		import_file_by_path(workspace_json, force=True, reset_permissions=True)

	_scrub_theme_version_workspace_rows()
	frappe.db.commit()
	print("Synced Themes workspace; removed Theme Version shortcuts and links.")
