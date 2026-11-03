"""Design Mode helpers: the CSS-class maps sent to the page and table value cleaning."""
from __future__ import annotations

from themes.utils.component_sync import OVERRIDE_FIELDS, SELECTOR_RE

DEFAULT_PROTECTED: tuple[str, ...] = ()

ROW_VALUE_FIELDS = (*OVERRIDE_FIELDS, "keep_default", "override_important")


def parse_protected(text: str | None) -> set[str]:
	return {line.strip() for line in (text or "").splitlines() if line.strip()}


def build_selector_map(rows: list[dict], protected: set[str]) -> dict:
	"""Group element rows by selector_class for the page script.

	rows: dicts with parent, component_name, app, file_path, selector_class, tag, line,
	is_dynamic, the override fields, keep_default, and override_important.
	"""
	ordered = sorted(rows, key=lambda r: ((r.get("component_name") or ""), int(r.get("line") or 0)))
	result: dict[str, dict] = {}
	for row in ordered:
		sel = (row.get("selector_class") or "").strip()
		if not sel or not SELECTOR_RE.match(sel):
			continue
		entry = result.get(sel)
		if entry is None:
			entry = {
				"components": [],
				"tag": row.get("tag") or "",
				"is_dynamic": 0,
				"protected": 1 if sel in protected else 0,
				"source_classes": (row.get("source_classes") or "").strip(),
				"values": {f: (row.get(f) or "") for f in OVERRIDE_FIELDS},
			}
			entry["values"]["keep_default"] = 1 if row.get("keep_default") else 0
			entry["values"]["override_important"] = 1 if row.get("override_important") else 0
			result[sel] = entry
		if row.get("is_dynamic"):
			entry["is_dynamic"] = 1
		name = row.get("parent")
		if name and name not in [c["name"] for c in entry["components"]]:
			entry["components"].append({
				"name": name,
				"component_name": row.get("component_name") or "",
				"app": row.get("app") or "",
				"file_path": row.get("file_path") or "",
			})
	return result


TABLE_CLASS_FIELDS = (
	"table_header_bg_class", "table_row_bg_class", "table_row_alt_bg_class",
	"table_header_line_class", "table_header_line_color_class",
	"table_row_divider_class", "table_row_divider_color_class",
	"table_col_divider_class", "table_col_divider_color_class",
)
TABLE_FG_FIELDS = ("table_header_fg_type", "table_row_fg_type", "table_row_alt_fg_type")
TABLE_VALUE_FIELDS = (*TABLE_CLASS_FIELDS, *TABLE_FG_FIELDS)


def clean_table_values(values: dict | None) -> dict:
	"""Keep only table fields; strip strings; empty fg type becomes mono."""
	out: dict[str, str] = {}
	for f in TABLE_VALUE_FIELDS:
		if values is None or f not in values:
			continue
		v = (values.get(f) or "").strip()
		if f in TABLE_FG_FIELDS and not v:
			v = "mono"
		out[f] = v
	return out


def build_table_map(rows: list[dict]) -> dict:
	"""Map table_selector → owning component, for components with owns_table=1.

	rows: dicts with name, component_name, table_selector, table_scope_class and TABLE_VALUE_FIELDS.
	When two components own the same selector the first by component_name wins.
	"""
	result: dict[str, dict] = {}
	for row in sorted(rows, key=lambda r: r.get("component_name") or ""):
		sel = (row.get("table_selector") or "").strip()
		if not sel or not SELECTOR_RE.match(sel) or sel in result:
			continue
		values = {f: (row.get(f) or "") for f in TABLE_CLASS_FIELDS}
		for f in TABLE_FG_FIELDS:
			values[f] = (row.get(f) or "mono") or "mono"
		result[sel] = {
			"name": row.get("name") or "",
			"component_name": row.get("component_name") or "",
			"scope": (row.get("table_scope_class") or "").strip(),
			"values": values,
		}
	return result
