"""Whitelisted API for Vue Component: rescan, refresh, preview and publish CSS."""
from __future__ import annotations

from pathlib import Path

import frappe
from frappe import _

from themes.utils.component_css_writer import declarations_for, publish_component_css
from themes.utils.component_scan import inherit_table_usage, iter_vue_files, scan_vue_file
from themes.utils.component_summary import build_summary
from themes.utils.component_sync import ALWAYS_EXCLUDED_APPS, merge_elements

ELEMENT_FIELDS = (
	"element_key",
	"tag",
	"line",
	"selector_class",
	"scanned_selector",
	"source_classes",
	"binding",
	"is_dynamic",
	"element_status",
	"keep_default",
	"override_bg_class",
	"override_fg_type",
	"override_text_class",
	"override_border_width_class",
	"override_border_color_class",
)


def _excluded_apps() -> set[str]:
	excluded = set(ALWAYS_EXCLUDED_APPS)
	raw = frappe.db.get_single_value("Theme Component Settings", "excluded_apps") or ""
	for line in raw.splitlines():
		app = line.strip()
		if app:
			excluded.add(app)
	return excluded


def _app_root(app: str) -> Path:
	return Path(frappe.get_app_path(app)).parent


def _vue_file(doc) -> Path | None:
	"""Resolved .vue path for a record, or None when the file is gone.

	Rejects a file_path that climbs out of the app folder.
	"""
	root = _app_root(doc.app).resolve()
	path = (root / doc.file_path).resolve()
	if not path.is_relative_to(root):
		frappe.throw(_("File path is outside the app folder."))
	return path if path.is_file() else None


def _set_rows(doc, rows: list[dict]) -> None:
	doc.set("elements", [])
	for row in rows:
		doc.append("elements", {k: v for k, v in row.items() if k in ELEMENT_FIELDS})


def _apply_scan(doc, scan: dict | None) -> None:
	if scan is None:
		doc.status = "Missing"
		for row in doc.elements:
			row.element_status = "Missing"
		doc.has_table = 0
		doc.owns_table = 0
		doc.root_class = ""
		doc.table_selector = ""
		doc.table_scope_class = ""
	else:
		doc.component_name = scan["component_name"]
		doc.source_hash = scan["source_hash"]
		doc.purpose = scan["purpose"]
		doc.uses_components = "\n".join(scan["uses_components"])
		doc.status = "Present"
		doc.has_table = int(scan.get("has_table") or 0)
		doc.owns_table = int(scan.get("owns_table") or 0)
		doc.root_class = scan.get("root_class") or ""
		doc.table_selector = scan.get("table_selector") or ""
		doc.table_scope_class = scan.get("table_scope_class") or ""
		merged = merge_elements([r.as_dict() for r in doc.elements], scan["elements"])
		_set_rows(doc, merged)
	doc.last_scanned = frappe.utils.now_datetime()


def _used_by(component_name: str, exclude_name: str) -> list[str]:
	if not component_name:
		return []
	names: list[str] = []
	for row in frappe.get_all(
		"Vue Component",
		filters={"status": "Present", "name": ["!=", exclude_name]},
		fields=["component_name", "uses_components"],
	):
		uses = row.get("uses_components") or ""
		if component_name in uses.split("\n"):
			names.append(row["component_name"])
	return sorted(names)


def _refresh_all_summaries() -> None:
	for row in frappe.get_all("Vue Component", pluck="name"):
		doc = frappe.get_doc("Vue Component", row)
		element_rows = [r.as_dict() for r in doc.elements]
		text = build_summary(
			doc.as_dict(),
			element_rows,
			_used_by(doc.component_name, doc.name),
		)
		frappe.db.set_value("Vue Component", doc.name, "summary", text, update_modified=False)


@frappe.whitelist()
def rescan_all() -> dict:
	frappe.only_for("System Manager")
	seen: set[str] = set()
	found = 0
	new = 0
	missing = 0
	excluded = _excluded_apps()

	pending: list[tuple] = []
	for app in frappe.get_installed_apps():
		if app in excluded:
			continue
		root = _app_root(app)
		for path in iter_vue_files(root):
			rel = path.relative_to(root).as_posix()
			key = f"{app}:{rel}"
			seen.add(key)
			found += 1
			existing = frappe.db.get_value("Vue Component", {"component_key": key})
			if existing:
				doc = frappe.get_doc("Vue Component", existing)
			else:
				doc = frappe.new_doc("Vue Component")
				doc.app = app
				doc.file_path = rel
				doc.component_key = key
				new += 1
			scan = scan_vue_file(path)
			scan["app"] = app
			pending.append((doc, scan))

	inherit_table_usage([scan for _, scan in pending])

	for doc, scan in pending:
		_apply_scan(doc, scan)
		doc.flags.skip_css_publish = True
		doc.save(ignore_permissions=True)

	for row in frappe.get_all("Vue Component", fields=["name", "component_key", "status"]):
		if row.component_key in seen or row.status == "Missing":
			continue
		doc = frappe.get_doc("Vue Component", row.name)
		_apply_scan(doc, None)
		doc.flags.skip_css_publish = True
		doc.save(ignore_permissions=True)
		missing += 1

	_refresh_all_summaries()
	publish_component_css()
	return {
		"found": found,
		"new": new,
		"missing": missing,
		"with_work": frappe.db.count("Vue Component", {"needs_attention": 1}),
	}


@frappe.whitelist()
def refresh_component(name: str) -> dict:
	frappe.only_for("System Manager")
	doc = frappe.get_doc("Vue Component", name)
	path = _vue_file(doc)
	scan = scan_vue_file(path) if path else None
	if scan is not None:
		scan["app"] = doc.app
		siblings: list[dict] = []
		for child_name in scan["uses_components"]:
			row = frappe.db.get_value(
				"Vue Component",
				{"app": doc.app, "component_name": child_name},
				[
					"component_name",
					"has_table",
					"table_selector",
					"root_class",
					"uses_components",
					"table_scope_class",
				],
				as_dict=True,
			)
			if not row:
				continue
			siblings.append({
				"app": doc.app,
				"component_name": row["component_name"],
				"has_table": int(row.get("has_table") or 0),
				"owns_table": 1,
				"table_selector": row.get("table_selector") or "",
				"root_class": row.get("root_class") or "",
				"uses_components": row.get("uses_components") or "",
				"table_scope_class": row.get("table_scope_class") or "",
			})
		inherit_table_usage([scan, *siblings])
	_apply_scan(doc, scan)
	doc.save()
	_refresh_all_summaries()
	return {"status": doc.status, "needs_attention": doc.needs_attention}


@frappe.whitelist()
def get_preview_theme() -> dict:
	frappe.only_for("System Manager")
	from themes.utils.site_theme_config_helpers import get_site_default_theme_name

	theme_name = get_site_default_theme_name()
	slug = ""
	if theme_name:
		slug = frappe.db.get_value("NCE Theme", theme_name, "slug") or ""
	return {"theme": theme_name or "", "slug": slug or ""}


@frappe.whitelist()
def preview_declarations(rows) -> dict:
	frappe.only_for("System Manager")
	if isinstance(rows, str):
		rows = frappe.parse_json(rows)
	result: dict[str, str] = {}
	for row in rows:
		key = row.get("key")
		if not key:
			continue
		result[key] = " ".join(declarations_for(row))
	return result


@frappe.whitelist()
def publish_css() -> dict:
	frappe.only_for("System Manager")
	return publish_component_css()


@frappe.whitelist()
def open_vue_components() -> dict:
	"""Ensure Vue Component exists and has rows, then return its Desk list URL."""
	frappe.only_for("System Manager")
	created = False
	if not frappe.db.exists("DocType", "Vue Component"):
		# Child table first, then the parent, then the settings single.
		frappe.reload_doc("themes", "doctype", "vue_component_element", force=True)
		frappe.reload_doc("themes", "doctype", "vue_component", force=True)
		frappe.reload_doc("themes", "doctype", "theme_component_settings", force=True)
		frappe.clear_cache()
		created = True
	populated = False
	if created or not frappe.db.count("Vue Component"):
		rescan_all()
		populated = True
	return {
		"url": "/app/vue-component",
		"created": created,
		"populated": populated,
	}
