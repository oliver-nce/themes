# Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
"""Copy developer export bundles into target apps and manage hooks.py includes."""
from __future__ import annotations

import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

import frappe
from frappe import _

from themes.utils.theme_export import EXPORT_ROOT, _load_theme_rows, build_export_files

MARK_BEGIN = "# BEGIN nce-themes (managed)"
MARK_END = "# END nce-themes"

RECORD_FILENAME = "nce-themes-applied.json"


def apply_to_app(app: str, slug: str) -> dict:
	"""Write export files into *app* and append the managed hooks.py block."""
	_refuse_protected_app(app)
	pkg = Path(frappe.get_app_path(app))
	hooks_path = pkg / "hooks.py"
	public_root = pkg / "public"
	nce_dir = public_root / EXPORT_ROOT
	record = _read_record()

	_pre_write_checks(app, pkg, hooks_path, nce_dir, app in record)

	theme_name = _active_theme_name_for_slug(slug)
	items = _load_theme_rows([theme_name])
	fonts_dir = Path(frappe.get_app_path("themes")) / "public" / "fonts"
	export_files = build_export_files(
		items,
		theme_name,
		include_bridge=True,
		fonts_dir=fonts_dir,
		scope_slug=slug,
	)

	relative_paths = _relative_paths_for_export(export_files)
	new_hooks = _hooks_with_block(_read_hooks_source(hooks_path), app)
	_compile_hooks_or_throw(app, new_hooks, hooks_path)

	_backup_hooks(app, hooks_path)
	_write_export_files(public_root, export_files)
	_write_hooks(hooks_path, new_hooks)

	applied_on = datetime.now(timezone.utc).isoformat()
	record[app] = {"slug": slug, "files": relative_paths, "applied_on": applied_on}
	_write_record(record)

	return {
		"app": app,
		"slug": slug,
		"files": relative_paths,
		"hooks_changed": True,
	}


def remove_from_app(app: str) -> dict:
	"""Remove recorded export files and the managed hooks block from *app*."""
	record = _read_record()
	entry = record.get(app)
	if not entry:
		return {"app": app, "removed": False}

	pkg = Path(frappe.get_app_path(app))
	hooks_path = pkg / "hooks.py"
	nce_dir = pkg / "public" / EXPORT_ROOT

	if hooks_path.is_file():
		source = _read_hooks_source(hooks_path)
		if MARK_BEGIN in source or MARK_END in source:
			stripped = _strip_managed_block(source)
			try:
				_compile_hooks_or_throw(app, stripped, hooks_path)
			except Exception:
				_restore_latest_hooks_backup(app, hooks_path)
				raise
			_backup_hooks(app, hooks_path)
			_write_hooks(hooks_path, stripped)

	for rel in entry.get("files") or []:
		target = pkg / rel
		if target.is_file():
			target.unlink()

	_cleanup_nce_dir(pkg, nce_dir, set(entry.get("files") or []))

	del record[app]
	_write_record(record)
	return {"app": app, "removed": True}


def app_status(app: str) -> str:
	"""Return apply state: applied, not_applied, or removed_by_update."""
	record = _read_record()
	if app not in record:
		return "not_applied"
	pkg = Path(frappe.get_app_path(app))
	nce_dir = pkg / "public" / EXPORT_ROOT
	hooks_path = pkg / "hooks.py"
	if not nce_dir.is_dir():
		return "removed_by_update"
	if not hooks_path.is_file():
		return "removed_by_update"
	source = _read_hooks_source(hooks_path)
	if MARK_BEGIN not in source or MARK_END not in source:
		return "removed_by_update"
	return "applied"


def _read_record() -> dict:
	path = _record_path()
	if not path.is_file():
		return {}
	try:
		with open(path, encoding="utf-8") as fh:
			data = json.load(fh)
	except (json.JSONDecodeError, OSError):
		return {}
	return data if isinstance(data, dict) else {}


def _write_record(data: dict) -> None:
	path = _record_path()
	path.parent.mkdir(parents=True, exist_ok=True)
	tmp = path.with_suffix(".tmp")
	with open(tmp, "w", encoding="utf-8") as fh:
		json.dump(data, fh, indent=2, sort_keys=True)
		fh.write("\n")
	os.replace(tmp, path)


def _record_path() -> Path:
	return Path(frappe.get_site_path("private", RECORD_FILENAME))


def _refuse_protected_app(app: str) -> None:
	if app == "themes":
		frappe.throw(_("Themes cannot receive an embedded theme bundle."))
	from themes.component_api import _is_frappe_branded

	if _is_frappe_branded(app):
		frappe.throw(_("Frappe-branded app {0} cannot receive an embedded theme bundle.").format(app))


def _pre_write_checks(
	app: str,
	pkg: Path,
	hooks_path: Path,
	nce_dir: Path,
	in_record: bool,
) -> None:
	if not hooks_path.is_file():
		frappe.throw(_("hooks.py is missing for app {0}.").format(app))
	if not os.access(pkg, os.W_OK):
		frappe.throw(_("App package directory is not writable for {0}.").format(app))
	if not os.access(hooks_path, os.W_OK):
		frappe.throw(_("hooks.py is not writable for app {0}.").format(app))
	# A folder already carrying Themes' managed hooks.py block was written by Themes
	# (for example applied elsewhere, committed into the app's repo, then deployed to a
	# site that has no apply record yet), so adopt it. Anything else is not ours.
	hooks_source = _read_hooks_source(hooks_path)
	hooks_has_block = MARK_BEGIN in hooks_source and MARK_END in hooks_source
	if nce_dir.is_dir() and not in_record and not hooks_has_block:
		frappe.throw(
			_("An unmanaged nce-themes folder already exists for app {0}.").format(app)
		)


def _active_theme_name_for_slug(slug: str) -> str:
	rows = frappe.get_all(
		"NCE Theme",
		filters={"slug": slug, "status": "Active"},
		fields=["name"],
		limit=1,
	)
	if not rows:
		frappe.throw(f"No active NCE Theme with slug {slug}")
	return rows[0]["name"]


def _relative_paths_for_export(export_files: dict[str, bytes]) -> list[str]:
	paths: list[str] = []
	for key in sorted(export_files):
		paths.append(f"public/{key}")
	return paths


def _write_export_files(public_root: Path, export_files: dict[str, bytes]) -> None:
	for key, data in export_files.items():
		dest = public_root / key
		dest.parent.mkdir(parents=True, exist_ok=True)
		dest.write_bytes(data)


def _managed_block(app: str) -> str:
	css_url = f"/assets/{app}/nce-themes/nce-themes.css"
	js_url = f"/assets/{app}/nce-themes/nce-theme-switcher.js"
	return (
		f"{MARK_BEGIN}\n"
		f'app_include_css = (([app_include_css] if isinstance(app_include_css, str) else list(app_include_css)) if "app_include_css" in globals() else []) + ["{css_url}"]\n'
		f'app_include_js = (([app_include_js] if isinstance(app_include_js, str) else list(app_include_js)) if "app_include_js" in globals() else []) + ["{js_url}"]\n'
		f"{MARK_END}"
	)


def _read_hooks_source(hooks_path: Path) -> str:
	return hooks_path.read_text(encoding="utf-8")


def _hooks_with_block(source: str, app: str) -> str:
	block = _managed_block(app)
	begin_count = source.count(MARK_BEGIN)
	end_count = source.count(MARK_END)
	if begin_count == 0 and end_count == 0:
		suffix = "" if source.endswith("\n") or not source else "\n"
		return f"{source}{suffix}\n{block}\n"
	if begin_count != 1 or end_count != 1:
		frappe.throw(_("hooks.py has invalid nce-themes markers."))
	start = source.index(MARK_BEGIN)
	end = source.index(MARK_END) + len(MARK_END)
	prefix = source[:start]
	suffix = source[end:]
	if prefix and not prefix.endswith("\n"):
		prefix += "\n"
	if suffix and not suffix.startswith("\n"):
		suffix = "\n" + suffix
	return f"{prefix}{block}{suffix}"


def _strip_managed_block(source: str) -> str:
	begin_count = source.count(MARK_BEGIN)
	end_count = source.count(MARK_END)
	if begin_count == 0 and end_count == 0:
		return source
	if begin_count != 1 or end_count != 1:
		frappe.throw(_("hooks.py has invalid nce-themes markers."))
	start = source.index(MARK_BEGIN)
	end = source.index(MARK_END) + len(MARK_END)
	prefix = source[:start].rstrip("\n")
	suffix = source[end:].lstrip("\n")
	if prefix and suffix:
		return f"{prefix}\n{suffix}\n"
	if prefix:
		return f"{prefix}\n"
	if suffix:
		return f"{suffix}\n"
	return ""


def _compile_hooks_or_throw(app: str, source: str, hooks_path: Path) -> None:
	try:
		compile(source, str(hooks_path), "exec")
	except SyntaxError:
		frappe.throw(_("hooks.py would not compile for app {0}.").format(app))


def _backup_hooks(app: str, hooks_path: Path) -> None:
	ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
	backup_dir = Path(frappe.get_site_path("private", "nce-themes-backups", app))
	backup_dir.mkdir(parents=True, exist_ok=True)
	dest = backup_dir / f"hooks.py.{ts}"
	shutil.copy2(hooks_path, dest)


def _restore_latest_hooks_backup(app: str, hooks_path: Path) -> None:
	backup_dir = Path(frappe.get_site_path("private", "nce-themes-backups", app))
	if not backup_dir.is_dir():
		return
	backups = sorted(backup_dir.glob("hooks.py.*"))
	if not backups:
		return
	shutil.copy2(backups[-1], hooks_path)


def _write_hooks(hooks_path: Path, source: str) -> None:
	hooks_path.write_text(source, encoding="utf-8")


def _cleanup_nce_dir(pkg: Path, nce_dir: Path, recorded: set[str]) -> None:
	if not nce_dir.is_dir():
		return
	remaining = []
	for path in nce_dir.rglob("*"):
		if path.is_file():
			rel = str(path.relative_to(pkg))
			remaining.append(rel)
	if not remaining:
		shutil.rmtree(nce_dir)
		return
	if set(remaining).issubset(recorded):
		shutil.rmtree(nce_dir)
