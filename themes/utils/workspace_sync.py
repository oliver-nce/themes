"""Sync Themes workspace JSON and remove orphaned Theme Version shortcuts."""

import json
import os

import frappe
from frappe.modules.import_file import import_file_by_path

LEGACY_LINK_TARGETS = ("Theme Version", "Theme Versions")
LEGACY_SHORTCUT_LABELS = ("Theme Version", "Theme Versions")


def scrub_theme_version_workspace_rows():
	"""Delete child rows pointing at removed DocTypes (bypasses Desk Link validation)."""
	for doctype in ("Workspace Link", "Workspace Shortcut"):
		if not frappe.db.table_exists(doctype):
			continue
		for target in LEGACY_LINK_TARGETS:
			frappe.db.delete(doctype, {"link_to": target})
		if doctype == "Workspace Shortcut":
			for label in LEGACY_SHORTCUT_LABELS:
				frappe.db.delete(doctype, {"label": label, "parent": "Themes"})


def scrub_workspace_content():
	"""Remove legacy Theme Versions blocks from workspace layout JSON."""
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
		if b.get("data", {}).get("shortcut_name") not in LEGACY_SHORTCUT_LABELS
	]
	if len(filtered) == len(blocks):
		return
	frappe.db.set_value("Workspace", "Themes", "content", json.dumps(filtered))


def import_themes_workspace():
	"""Force-import workspace from app JSON."""
	app_path = frappe.get_app_path("themes")
	workspace_json = os.path.join(app_path, "themes", "workspace", "themes", "themes.json")
	if os.path.isfile(workspace_json):
		import_file_by_path(workspace_json, force=True, reset_permissions=True)


def sync_themes_workspace():
	"""Full cleanup: scrub DB rows, re-import workspace, scrub again, clear cache."""
	scrub_theme_version_workspace_rows()
	scrub_workspace_content()
	import_themes_workspace()
	scrub_theme_version_workspace_rows()
	scrub_workspace_content()
	frappe.db.commit()
	frappe.clear_cache()
