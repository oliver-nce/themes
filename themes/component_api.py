"""Whitelisted API for Vue Component: rescan, refresh, preview and publish CSS."""
from __future__ import annotations

from pathlib import Path

import frappe
from frappe import _

from themes.utils.component_css_writer import declarations_for, publish_component_css, table_css_for
from themes.utils.component_scan import inherit_table_usage, iter_vue_files, mark_roots, scan_vue_file
from themes.utils.component_summary import build_summary
from themes.utils.component_sync import ALWAYS_EXCLUDED_APPS, OVERRIDE_FIELDS, merge_elements
from themes.utils.design_mode import (
	TABLE_CLASS_FIELDS,
	TABLE_FG_FIELDS,
	TABLE_VALUE_FIELDS,
	build_selector_map,
	build_table_map,
	clean_table_values,
	parse_protected,
)

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


# ─── Scanning ───


def _is_frappe_branded(app: str) -> bool:
	try:
		publishers = frappe.get_hooks("app_publisher", app_name=app) or []
	except Exception:
		return False
	return any("frappe technologies" in str(p).lower() for p in publishers)


def _excluded_apps() -> set[str]:
	excluded = set(ALWAYS_EXCLUDED_APPS)
	raw = frappe.db.get_single_value("Theme Component Settings", "excluded_apps") or ""
	for line in raw.splitlines():
		app = line.strip()
		if app:
			excluded.add(app)
	for app in frappe.get_installed_apps():
		if app not in excluded and _is_frappe_branded(app):
			excluded.add(app)
	return excluded


def theme_off_apps() -> set[str]:
	off: set[str] = set()
	raw = frappe.db.get_single_value("Theme Component Settings", "theme_off_apps") or ""
	for line in raw.splitlines():
		app = line.strip()
		if app:
			off.add(app)
	off.discard("themes")
	return off


def bridge_apps() -> set[str]:
	off = theme_off_apps()
	apps: set[str] = set()
	for app in frappe.get_installed_apps():
		if app == "themes":
			continue
		if _is_frappe_branded(app):
			continue
		if app in off:
			continue
		apps.add(app)
	return apps


def theme_app_slugs() -> dict[str, str]:
	slugs: dict[str, str] = {}
	raw = frappe.db.get_single_value("Theme Component Settings", "app_theme_slugs") or ""
	for line in raw.splitlines():
		line = line.strip()
		if not line or "=" not in line:
			continue
		app, slug = line.split("=", 1)
		app = app.strip()
		slug = slug.strip()
		if not app or not slug or app == "themes":
			continue
		slugs[app] = slug
	return slugs


def _active_theme_choices() -> list[dict]:
	choices: list[dict] = []
	for row in frappe.get_all(
		"NCE Theme",
		filters={"status": "Active"},
		fields=["slug", "theme_name"],
		order_by="theme_name asc",
	):
		slug = (row.get("slug") or "").strip()
		if not slug:
			continue
		theme_name = (row.get("theme_name") or "").strip()
		choices.append({"slug": slug, "theme_name": theme_name or slug})
	return choices


def _theme_app_title(app: str) -> str:
	titles = frappe.get_hooks("app_title", app_name=app) or []
	return titles[0] if titles else app


def _route_prefixes_for_app(app: str) -> list[str]:
	prefixes: list[str] = []
	for entry in frappe.get_hooks("add_to_apps_screen", app_name=app) or []:
		if not isinstance(entry, dict):
			continue
		route = (entry.get("route") or "").strip()
		if route.startswith("/"):
			prefixes.append(route)
	for rule in frappe.get_hooks("website_route_rules", app_name=app) or []:
		if not isinstance(rule, dict):
			continue
		from_route = (rule.get("from_route") or "").strip()
		if "<" in from_route:
			from_route = from_route.split("<", 1)[0]
		if from_route.startswith("/"):
			prefixes.append(from_route)
	return prefixes


@frappe.whitelist()
def list_theme_apps() -> dict:
	frappe.only_for("System Manager")
	off = theme_off_apps()
	slugs = theme_app_slugs()
	apps: list[dict] = []
	for app in frappe.get_installed_apps():
		if _is_frappe_branded(app) or app == "themes":
			continue
		apps.append({
			"app": app,
			"title": _theme_app_title(app),
			"apply": app not in off,
			"theme_slug": slugs.get(app, ""),
		})
	apps.sort(key=lambda row: (row["title"], row["app"]))
	return {"apps": apps, "active_themes": _active_theme_choices()}


@frappe.whitelist()
def set_theme_app_apply(app: str, apply) -> dict:
	frappe.only_for("System Manager")
	app = (app or "").strip()
	installed = set(frappe.get_installed_apps())
	if not app or app not in installed:
		frappe.throw(_("Unknown app: {0}").format(app or ""))
	if _is_frappe_branded(app):
		frappe.throw(_("The theme cannot be toggled for app {0}.").format(app))
	if app == "themes":
		frappe.throw(_("The Themes app always uses the site theme."))
	on = str(apply).lower() in ("1", "true", "yes", "on")
	off = theme_off_apps()
	if on:
		off.discard(app)
	else:
		off.add(app)
	frappe.db.set_single_value(
		"Theme Component Settings",
		"theme_off_apps",
		"\n".join(sorted(off)),
	)
	frappe.db.commit()
	publish_component_css()
	return {"status": "ok", "app": app, "apply": on}


@frappe.whitelist()
def set_theme_app_theme(app: str, slug) -> dict:
	frappe.only_for("System Manager")
	app = (app or "").strip()
	installed = set(frappe.get_installed_apps())
	if not app or app not in installed:
		frappe.throw(_("Unknown app: {0}").format(app or ""))
	if _is_frappe_branded(app):
		frappe.throw(_("The theme cannot be toggled for app {0}.").format(app))
	if app == "themes":
		frappe.throw(_("The Themes app always uses the site theme."))
	slug = (slug or "").strip()
	if slug:
		valid = {row["slug"] for row in _active_theme_choices()}
		if slug not in valid:
			frappe.throw(_("Unknown or inactive theme slug: {0}").format(slug))
	slugs = theme_app_slugs()
	if slug:
		slugs[app] = slug
	else:
		slugs.pop(app, None)
	frappe.db.set_single_value(
		"Theme Component Settings",
		"app_theme_slugs",
		"\n".join(f"{name}={value}" for name, value in sorted(slugs.items())),
	)
	frappe.db.commit()
	return {"status": "ok", "app": app, "theme_slug": slug}


@frappe.whitelist(allow_guest=True)
def get_theme_app_gate() -> dict:
	disabled = sorted(theme_off_apps())
	route_prefixes: list[dict] = []
	for app in frappe.get_installed_apps():
		for prefix in _route_prefixes_for_app(app):
			route_prefixes.append({"app": app, "prefix": prefix})
	from themes.utils.css_publish import read_published_css_hash

	return {
		"disabled_apps": disabled,
		"bridge_apps": sorted(bridge_apps()),
		"route_prefixes": route_prefixes,
		"component_css_hash": read_published_css_hash("nce_component_overrides.css") or "",
		"app_themes": [
			{"app": app, "slug": slug}
			for app, slug in sorted(theme_app_slugs().items())
		],
		"active_themes": _active_theme_choices(),
	}


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
		doc.theme_table_targets = ""
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
		doc.theme_table_targets = "\n".join(scan.get("theme_table_targets") or [])
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


def _row_value(row, key):
	return row.get(key) if isinstance(row, dict) else getattr(row, key, None)


def apply_root_flags() -> None:
	rows = frappe.get_all(
		"Vue Component",
		fields=["name", "app", "component_name", "uses_components"],
	)
	scans: list[dict] = []
	for row in rows:
		scans.append({
			"name": _row_value(row, "name"),
			"app": _row_value(row, "app") or "",
			"component_name": _row_value(row, "component_name") or "",
			"uses_components": _row_value(row, "uses_components") or "",
		})
	mark_roots(scans)
	for scan in scans:
		frappe.db.set_value(
			"Vue Component",
			scan["name"],
			"is_root",
			int(scan.get("is_root") or 0),
			update_modified=False,
		)


def vue_component_permission_query(user=None) -> str:
	return "`tabVue Component`.`is_root` = 1"


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


def _save_without_publish(doc, ignore_permissions: bool = False) -> None:
	doc.flags.skip_css_publish = True
	if ignore_permissions:
		doc.save(ignore_permissions=True)
	else:
		doc.save()


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
		_save_without_publish(doc, ignore_permissions=True)

	for row in frappe.get_all("Vue Component", fields=["name", "component_key", "status"]):
		if row.component_key in seen or row.status == "Missing":
			continue
		doc = frappe.get_doc("Vue Component", row.name)
		_apply_scan(doc, None)
		_save_without_publish(doc, ignore_permissions=True)
		missing += 1

	apply_root_flags()
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
	apply_root_flags()
	_refresh_all_summaries()
	return {"status": doc.status, "needs_attention": doc.needs_attention}


@frappe.whitelist()
def components_inside(name: str) -> list[dict]:
	frappe.only_for("System Manager")
	doc = frappe.get_doc("Vue Component", name)
	uses = [u.strip() for u in (doc.uses_components or "").split("\n") if u.strip()]
	if not uses:
		return []
	rows = frappe.get_all(
		"Vue Component",
		filters={"app": doc.app, "component_name": ["in", uses]},
		fields=["name", "component_name"],
	)
	by_name = {row["component_name"]: row for row in rows}
	result: list[dict] = []
	for comp_name in uses:
		row = by_name.get(comp_name)
		if not row:
			continue
		result.append({"name": row["name"], "component_name": row["component_name"]})
	return result


# ─── Preview and publish ───


@frappe.whitelist()
def get_preview_theme() -> dict:
	frappe.only_for("System Manager")
	from themes.utils.site_theme_config_helpers import get_site_default_theme_name

	theme_name = get_site_default_theme_name()
	slug = ""
	if theme_name:
		slug = frappe.db.get_value("NCE Theme", theme_name, "slug") or ""
	return {"theme": theme_name or "", "slug": slug or ""}


def _parse_json_arg(value):
	return frappe.parse_json(value) if isinstance(value, str) else value


@frappe.whitelist()
def preview_declarations(rows) -> dict:
	_require_design()
	rows = _parse_json_arg(rows)
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


# ─── Design Mode ───


def can_design(user: str | None = None) -> bool:
	"""Administrator, System Manager, or anyone who can write Vue Component."""
	user = user or frappe.session.user
	if not user or user == "Guest":
		return False
	if user == "Administrator" or "System Manager" in frappe.get_roles(user):
		return True
	return bool(frappe.has_permission("Vue Component", "write", user=user))


def design_mode_enabled() -> bool:
	return bool(frappe.db.get_single_value("Theme Component Settings", "design_mode_enabled"))


def _require_design() -> None:
	if not can_design():
		frappe.throw(_("You are not allowed to use Design Mode."), frappe.PermissionError)


@frappe.whitelist()
def get_design_mode_status() -> dict:
	return {"enabled": design_mode_enabled(), "allowed": can_design()}


@frappe.whitelist()
def set_design_mode_enabled(enabled) -> dict:
	frappe.only_for("System Manager")
	value = 1 if str(enabled).lower() in ("1", "true", "yes", "on") else 0
	frappe.db.set_single_value("Theme Component Settings", "design_mode_enabled", value)
	frappe.db.commit()
	scan = None
	if value:
		try:
			scan = rescan_all()
		except Exception as e:
			frappe.log_error(title="Design Mode scan failed")
			scan = {"error": str(e)}
	return {"enabled": bool(value), "scan": scan}


def _protected_classes() -> set[str]:
	return parse_protected(frappe.db.get_single_value("Theme Component Settings", "protected_classes"))


@frappe.whitelist()
def get_design_mode_map() -> dict:
	_require_design()
	parents = {
		p.name: p
		for p in frappe.get_all(
			"Vue Component",
			filters={"status": "Present"},
			fields=["name", "component_name", "app", "file_path"],
		)
	}
	rows = []
	for r in frappe.get_all(
		"Vue Component Element",
		filters={"parenttype": "Vue Component", "element_status": "Present"},
		fields=["parent", "selector_class", "tag", "line", "is_dynamic", "keep_default", *OVERRIDE_FIELDS],
	):
		p = parents.get(r.parent)
		if not p:
			continue
		rows.append({**r, "component_name": p.component_name, "app": p.app, "file_path": p.file_path})
	table_rows = frappe.get_all(
		"Vue Component",
		filters={"status": "Present", "owns_table": 1},
		fields=["name", "component_name", "table_selector", "table_scope_class", *TABLE_VALUE_FIELDS],
	)
	theme = get_preview_theme()
	return {
		"theme": theme["theme"],
		"slug": theme["slug"],
		"selectors": build_selector_map(rows, _protected_classes()),
		"tables": build_table_map(table_rows),
	}


def _components_with_selector(selector: str) -> list[str]:
	names = frappe.get_all(
		"Vue Component Element",
		filters={"parenttype": "Vue Component", "element_status": "Present", "selector_class": selector},
		pluck="parent",
	)
	present = set(frappe.get_all("Vue Component", filters={"status": "Present", "name": ["in", list(set(names)) or [""]]}, pluck="name"))
	return sorted(present)


def _publish_and_hash() -> str:
	return publish_component_css().get("css_hash") or ""


@frappe.whitelist()
def save_design_change(selector: str, values) -> dict:
	_require_design()
	values = _parse_json_arg(values)
	selector = (selector or "").strip()
	if selector in _protected_classes():
		frappe.throw(_("{0} is set per panel on the Page Panel's Colours tab.").format(selector))
	names = _components_with_selector(selector)
	if not names:
		frappe.throw(_("No Vue Component uses the class {0}.").format(selector))
	for name in names:
		doc = frappe.get_doc("Vue Component", name)
		for row in doc.elements:
			if row.element_status != "Present" or (row.selector_class or "").strip() != selector:
				continue
			for f in OVERRIDE_FIELDS:
				row.set(f, (values.get(f) or "").strip())
			row.keep_default = 1 if values.get("keep_default") else 0
		_save_without_publish(doc)
	return {"components": names, "css_hash": _publish_and_hash()}


@frappe.whitelist()
def revert_design_components(names) -> dict:
	_require_design()
	names = _parse_json_arg(names)
	reverted = []
	for name in names or []:
		if not frappe.db.exists("Vue Component", name):
			continue
		doc = frappe.get_doc("Vue Component", name)
		for row in doc.elements:
			for f in OVERRIDE_FIELDS:
				row.set(f, "")
			row.keep_default = 0
		for f in TABLE_CLASS_FIELDS:
			doc.set(f, "")
		for f in TABLE_FG_FIELDS:
			doc.set(f, "mono")
		_save_without_publish(doc)
		reverted.append(name)
	return {"reverted": reverted, "css_hash": _publish_and_hash()}


def _table_parent(name: str) -> dict:
	if not frappe.db.exists("Vue Component", name):
		frappe.throw(_("Vue Component {0} not found.").format(name))
	return frappe.db.get_value(
		"Vue Component",
		name,
		["name", "component_name", "status", "has_table", "table_selector", "table_scope_class", *TABLE_VALUE_FIELDS],
		as_dict=True,
	)


@frappe.whitelist()
def preview_design_table(name: str, values) -> dict:
	_require_design()
	values = _parse_json_arg(values)
	parent = dict(_table_parent(name))
	parent.update(clean_table_values(values))
	parent["status"] = "Present"
	parent["has_table"] = 1
	return {"css": table_css_for(parent)}


@frappe.whitelist()
def save_design_table(name: str, values) -> dict:
	_require_design()
	values = _parse_json_arg(values)
	_table_parent(name)
	doc = frappe.get_doc("Vue Component", name)
	for f, v in clean_table_values(values).items():
		doc.set(f, v)
	_save_without_publish(doc)
	return {"name": name, "css_hash": _publish_and_hash()}
