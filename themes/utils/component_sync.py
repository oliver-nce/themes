"""Merge scanned Vue elements with saved overrides and shared colour constants."""
from __future__ import annotations

import re

ROLES = ("primary", "secondary", "accent", "success", "info", "warning", "danger", "neutral")
SHADES = ("50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950")
BORDER_WIDTHS = {
	"theme-border-thin": "--nce-border-width-thin",
	"theme-border": "--nce-border-width",
	"theme-border-strong": "--nce-border-width-strong",
}
BUTTON_SIZE_CLASSES = {
	"sm": "sm",
	"lg": "lg",
	"theme-btn-sm": "sm",
	"theme-btn-lg": "lg",
}


def normalize_button_size_class(raw: str) -> str:
	"""Design Mode stores empty (medium), sm, or lg; accept legacy theme-btn-* values."""
	s = (raw or "").strip()
	return BUTTON_SIZE_CLASSES.get(s, s if s in ("", "sm", "lg") else "")


ALWAYS_EXCLUDED_APPS = frozenset({"frappe", "themes"})
OVERRIDE_FIELDS = ("override_bg_class", "override_fg_type", "override_text_class",
	"override_border_width_class", "override_border_color_class",
	"override_button_size_class", "theme_style_overrides")

ROLE_ALT = "|".join(ROLES)
SHADE_ALT = "|".join(SHADES)
BG_RE = re.compile(rf"^theme-bg-({ROLE_ALT})(?:-({SHADE_ALT}))?$")
TEXT_RE = re.compile(rf"^theme-text-({ROLE_ALT})(?:-({SHADE_ALT}))?(-fg(?:-tonal)?)?$")
BORDER_COLOR_RE = re.compile(rf"^theme-border-({ROLE_ALT})-({SHADE_ALT})$")
SELECTOR_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_-]*$")


def group_key(row: dict) -> str:
	return (row.get("selector_class") or "").strip() or row["element_key"]


def has_override(row: dict) -> bool:
	from themes.utils.theme_class_catalog import parse_style_overrides

	if parse_style_overrides(row.get("theme_style_overrides")):
		return True
	for field in OVERRIDE_FIELDS:
		if field in ("override_fg_type", "theme_style_overrides"):
			continue
		if (row.get(field) or "").strip():
			return True
	return False


def _group_sort_key(row: dict) -> tuple[int, int]:
	status_rank = 0 if row.get("element_status") == "Present" else 1
	return (status_rank, int(row.get("line") or 0))


def _canonical_by_group(rows: list[dict]) -> dict[str, dict]:
	groups: dict[str, list[dict]] = {}
	for row in rows:
		key = group_key(row)
		groups.setdefault(key, []).append(row)
	canonical: dict[str, dict] = {}
	for key, members in groups.items():
		canonical[key] = min(members, key=_group_sort_key)
	return canonical


def normalise_groups(rows: list[dict]) -> list[dict]:
	canonical = _canonical_by_group(rows)
	result: list[dict] = []
	for row in rows:
		copy = dict(row)
		first = canonical[group_key(row)]
		copy["keep_default"] = first.get("keep_default")
		copy["override_important"] = first.get("override_important")
		for field in OVERRIDE_FIELDS:
			copy[field] = first.get(field)
		result.append(copy)
	return result


def merge_elements(existing: list[dict], scanned: list[dict]) -> list[dict]:
	by_key = {row["element_key"]: row for row in existing}
	seen: set[str] = set()
	result: list[dict] = []

	for scan in scanned:
		key = scan["element_key"]
		seen.add(key)
		selector = scan.get("selector_class") or ""
		if key in by_key:
			row = dict(by_key[key])
			row["tag"] = scan["tag"]
			row["line"] = scan["line"]
			row["source_classes"] = scan["source_classes"]
			row["binding"] = scan["binding"]
			row["is_dynamic"] = scan["is_dynamic"]
			row["element_status"] = "Present"
			scanned_sel = row.get("scanned_selector") or ""
			if (row.get("selector_class") or "") == scanned_sel:
				row["selector_class"] = selector
				row["scanned_selector"] = selector
			else:
				row["scanned_selector"] = selector
			result.append(row)
		else:
			result.append({
				"element_key": key,
				"tag": scan["tag"],
				"line": scan["line"],
				"selector_class": selector,
				"scanned_selector": selector,
				"source_classes": scan["source_classes"],
				"binding": scan["binding"],
				"is_dynamic": scan["is_dynamic"],
				"element_status": "Present",
				"keep_default": 0,
				"override_important": 0,
				"override_bg_class": "",
				"override_fg_type": "",
				"override_text_class": "",
				"override_border_width_class": "",
				"override_border_color_class": "",
				"override_button_size_class": "",
				"theme_style_overrides": "",
			})

	for row in existing:
		key = row["element_key"]
		if key not in seen:
			missing = dict(row)
			missing["element_status"] = "Missing"
			result.append(missing)

	return normalise_groups(result)


def needs_attention(rows: list[dict], file_status: str) -> bool:
	if file_status == "Missing":
		return True
	for row in rows:
		if row.get("element_status") != "Present":
			continue
		if not (row.get("selector_class") or "").strip():
			return True
		if row.get("keep_default"):
			continue
		if not has_override(row):
			return True
	return False
