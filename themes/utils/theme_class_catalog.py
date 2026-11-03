"""Single source for theme-class visual properties (Design Mode + theme-btn CSS)."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from themes.utils.component_sync import (
	BG_RE,
	BORDER_COLOR_RE,
	BORDER_WIDTHS,
	BUTTON_SIZE_CLASSES,
	ROLES,
	normalize_button_size_class,
)

ROOT = Path(__file__).resolve().parents[2]
CONTRACT_PATH = ROOT / "THEME_CLASS_CONTRACT.json"

# ── Property ids (stable API for theme_style_overrides keys) ──

PROP_BUTTON_SIZE = "button-size"
PROP_BACKGROUND = "background"
PROP_TEXT_COLOR = "text-color"
PROP_BORDER_WIDTH = "border-width"
PROP_BORDER_COLOR = "border-color"
PROP_BORDER_RADIUS = "border-radius"
PROP_HOVER_BACKGROUND = "hover-background"
PROP_HOVER_BORDER = "hover-border"
PROP_FOCUS_RING = "focus-ring"
PROP_FOCUS_FILL = "focus-fill"
PROP_BUTTON_OUTLINE = "button-outline"

PROP_TABLE_HEADER_ROW = "table-header-row"
PROP_TABLE_ROWS = "table-rows"
PROP_TABLE_ALT_ROWS = "table-alternate-rows"
PROP_TABLE_HEADER_LINE_W = "table-header-underline-width"
PROP_TABLE_HEADER_LINE_C = "table-header-underline-color"
PROP_TABLE_ROW_DIV_W = "table-row-dividers-width"
PROP_TABLE_ROW_DIV_C = "table-row-dividers-color"
PROP_TABLE_COL_DIV_W = "table-column-dividers-width"
PROP_TABLE_COL_DIV_C = "table-column-dividers-color"

TABLE_PROPERTY_IDS: tuple[str, ...] = (
	PROP_TABLE_HEADER_ROW,
	PROP_TABLE_ROWS,
	PROP_TABLE_ALT_ROWS,
	PROP_TABLE_HEADER_LINE_W,
	PROP_TABLE_HEADER_LINE_C,
	PROP_TABLE_ROW_DIV_W,
	PROP_TABLE_ROW_DIV_C,
	PROP_TABLE_COL_DIV_W,
	PROP_TABLE_COL_DIV_C,
)

TABLE_PROPERTY_ID_SET = frozenset(TABLE_PROPERTY_IDS)

THEME_BTN_PROPERTY_IDS: tuple[str, ...] = (
	PROP_BUTTON_SIZE,
	PROP_BACKGROUND,
	PROP_TEXT_COLOR,
	PROP_BORDER_WIDTH,
	PROP_BORDER_COLOR,
	PROP_BORDER_RADIUS,
	PROP_HOVER_BACKGROUND,
	PROP_HOVER_BORDER,
	PROP_FOCUS_RING,
	PROP_FOCUS_FILL,
	PROP_BUTTON_OUTLINE,
)

NEUTRAL_BG_ROLES = (
	("surface", "Surface / card", "surface"),
	("bg", "Page background", "bg"),
	("row", "Table row", "row"),
	("row-alt", "Alternate row", "row-alt"),
	("header", "Header strip", "primary"),
)

COLOR_ROLE_OPTIONS: list[dict[str, str]] = []
for role in ROLES:
	COLOR_ROLE_OPTIONS.append({"value": role, "label": role.capitalize()})
	for shade in ("50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"):
		COLOR_ROLE_OPTIONS.append({"value": f"{role}-{shade}", "label": f"{role} {shade}"})
for value, label, _ in NEUTRAL_BG_ROLES:
	if value not in {o["value"] for o in COLOR_ROLE_OPTIONS}:
		COLOR_ROLE_OPTIONS.append({"value": value, "label": label})
COLOR_ROLE_OPTIONS.append({"value": "border", "label": "Border"})

BORDER_WIDTH_OPTIONS = [
	{"value": "", "label": "Theme default"},
	{"value": "theme-border-thin", "label": "Thin"},
	{"value": "theme-border", "label": "Normal"},
	{"value": "theme-border-strong", "label": "Strong"},
]

BUTTON_SIZE_OPTIONS = [
	{"value": "", "label": "Medium (default)"},
	{"value": "sm", "label": "Small"},
	{"value": "lg", "label": "Large"},
]

BORDER_RADIUS_OPTIONS = [
	{"value": "", "label": "Theme default"},
	{"value": "theme-rounded", "label": "Default radius"},
	{"value": "theme-rounded-sm", "label": "Small"},
	{"value": "theme-rounded-md", "label": "Medium"},
	{"value": "theme-rounded-lg", "label": "Large"},
	{"value": "theme-rounded-xl", "label": "Extra large"},
]

TRI_STATE_SWITCH_OPTIONS = [
	{"value": "", "label": "Theme default"},
	{"value": "1", "label": "On"},
	{"value": "0", "label": "Off"},
]

OUTLINE_SWITCH_OPTIONS = [
	{"value": "", "label": "Filled (default)"},
	{"value": "1", "label": "Outline"},
]

PROPERTIES: dict[str, dict[str, Any]] = {
	PROP_BUTTON_SIZE: {
		"id": PROP_BUTTON_SIZE,
		"label": "Button size",
		"kind": "choice",
		"default": "",
		"options": BUTTON_SIZE_OPTIONS,
		"legacyField": "override_button_size_class",
	},
	PROP_BACKGROUND: {
		"id": PROP_BACKGROUND,
		"label": "Background",
		"kind": "color-role",
		"default": "surface",
		"options": COLOR_ROLE_OPTIONS,
		"legacyField": "override_bg_class",
		"legacyFgField": "override_fg_type",
		"classPrefix": "theme-bg-",
	},
	PROP_TEXT_COLOR: {
		"id": PROP_TEXT_COLOR,
		"label": "Text colour",
		"kind": "color-role",
		"default": "primary",
		"options": COLOR_ROLE_OPTIONS,
		"legacyField": "override_text_class",
		"classPrefix": "theme-text-",
	},
	PROP_BORDER_WIDTH: {
		"id": PROP_BORDER_WIDTH,
		"label": "Border width",
		"kind": "choice",
		"default": "theme-border",
		"options": BORDER_WIDTH_OPTIONS,
		"legacyField": "override_border_width_class",
	},
	PROP_BORDER_COLOR: {
		"id": PROP_BORDER_COLOR,
		"label": "Border colour",
		"kind": "color-role",
		"default": "border",
		"options": COLOR_ROLE_OPTIONS,
		"legacyField": "override_border_color_class",
		"classPrefix": "theme-border-",
	},
	PROP_BORDER_RADIUS: {
		"id": PROP_BORDER_RADIUS,
		"label": "Corner radius",
		"kind": "choice",
		"default": "theme-rounded-sm",
		"options": BORDER_RADIUS_OPTIONS,
	},
	PROP_HOVER_BACKGROUND: {
		"id": PROP_HOVER_BACKGROUND,
		"label": "Hover background",
		"kind": "color-role",
		"default": "primary",
		"options": COLOR_ROLE_OPTIONS,
		"classPrefix": "theme-hover-bg-",
	},
	PROP_HOVER_BORDER: {
		"id": PROP_HOVER_BORDER,
		"label": "Hover border",
		"kind": "color-role",
		"default": "primary",
		"options": COLOR_ROLE_OPTIONS,
		"classPrefix": "theme-hover-border-",
	},
	PROP_FOCUS_RING: {
		"id": PROP_FOCUS_RING,
		"label": "Focus ring",
		"kind": "switch",
		"default": "",
		"options": TRI_STATE_SWITCH_OPTIONS,
	},
	PROP_FOCUS_FILL: {
		"id": PROP_FOCUS_FILL,
		"label": "Focus fill",
		"kind": "switch",
		"default": "",
		"options": TRI_STATE_SWITCH_OPTIONS,
	},
	PROP_BUTTON_OUTLINE: {
		"id": PROP_BUTTON_OUTLINE,
		"label": "Outline style",
		"kind": "switch",
		"default": "",
		"options": OUTLINE_SWITCH_OPTIONS,
	},
	PROP_TABLE_HEADER_ROW: {
		"id": PROP_TABLE_HEADER_ROW,
		"label": "Header row",
		"kind": "color-role",
		"default": "",
		"options": COLOR_ROLE_OPTIONS,
		"legacyField": "table_header_bg_class",
		"legacyFgField": "table_header_fg_type",
		"classPrefix": "theme-bg-",
	},
	PROP_TABLE_ROWS: {
		"id": PROP_TABLE_ROWS,
		"label": "Rows",
		"kind": "color-role",
		"default": "",
		"options": COLOR_ROLE_OPTIONS,
		"legacyField": "table_row_bg_class",
		"legacyFgField": "table_row_fg_type",
		"classPrefix": "theme-bg-",
	},
	PROP_TABLE_ALT_ROWS: {
		"id": PROP_TABLE_ALT_ROWS,
		"label": "Alternate rows",
		"kind": "color-role",
		"default": "",
		"options": COLOR_ROLE_OPTIONS,
		"legacyField": "table_row_alt_bg_class",
		"legacyFgField": "table_row_alt_fg_type",
		"classPrefix": "theme-bg-",
	},
	PROP_TABLE_HEADER_LINE_W: {
		"id": PROP_TABLE_HEADER_LINE_W,
		"label": "Header underline width",
		"kind": "choice",
		"default": "",
		"options": BORDER_WIDTH_OPTIONS,
		"legacyField": "table_header_line_class",
	},
	PROP_TABLE_HEADER_LINE_C: {
		"id": PROP_TABLE_HEADER_LINE_C,
		"label": "Header underline colour",
		"kind": "color-role",
		"default": "",
		"options": COLOR_ROLE_OPTIONS,
		"legacyField": "table_header_line_color_class",
		"classPrefix": "theme-border-",
	},
	PROP_TABLE_ROW_DIV_W: {
		"id": PROP_TABLE_ROW_DIV_W,
		"label": "Row dividers width",
		"kind": "choice",
		"default": "",
		"options": BORDER_WIDTH_OPTIONS,
		"legacyField": "table_row_divider_class",
	},
	PROP_TABLE_ROW_DIV_C: {
		"id": PROP_TABLE_ROW_DIV_C,
		"label": "Row dividers colour",
		"kind": "color-role",
		"default": "",
		"options": COLOR_ROLE_OPTIONS,
		"legacyField": "table_row_divider_color_class",
		"classPrefix": "theme-border-",
	},
	PROP_TABLE_COL_DIV_W: {
		"id": PROP_TABLE_COL_DIV_W,
		"label": "Column dividers width",
		"kind": "choice",
		"default": "",
		"options": BORDER_WIDTH_OPTIONS,
		"legacyField": "table_col_divider_class",
	},
	PROP_TABLE_COL_DIV_C: {
		"id": PROP_TABLE_COL_DIV_C,
		"label": "Column dividers colour",
		"kind": "color-role",
		"default": "",
		"options": COLOR_ROLE_OPTIONS,
		"legacyField": "table_col_divider_color_class",
		"classPrefix": "theme-border-",
	},
}


def is_table_property_id(prop_id: str) -> bool:
	return (prop_id or "").strip() in TABLE_PROPERTY_ID_SET


def table_style_row_specs() -> list[dict[str, Any]]:
	"""Ordered Design Mode rows for PanelTable (shared with the dialog bundle)."""
	return [
		{"rowKind": "color-role", "propId": PROP_TABLE_HEADER_ROW},
		{"rowKind": "color-role", "propId": PROP_TABLE_ROWS},
		{"rowKind": "color-role", "propId": PROP_TABLE_ALT_ROWS},
		{
			"rowKind": "table-divider",
			"label": "Header underline",
			"widthPropId": PROP_TABLE_HEADER_LINE_W,
			"colorPropId": PROP_TABLE_HEADER_LINE_C,
		},
		{
			"rowKind": "table-divider",
			"label": "Row dividers",
			"widthPropId": PROP_TABLE_ROW_DIV_W,
			"colorPropId": PROP_TABLE_ROW_DIV_C,
		},
		{
			"rowKind": "table-divider",
			"label": "Column dividers",
			"widthPropId": PROP_TABLE_COL_DIV_W,
			"colorPropId": PROP_TABLE_COL_DIV_C,
		},
	]

TEXT_HEADING_RE = re.compile(r"^theme-text-(heading|muted|link)$")
TEXT_NEUTRAL_RE = re.compile(
	r"^theme-text-(text-header|text-header-fg)$"
)
NEUTRAL_BG_CLASS = {
	"theme-bg-bg-page": "bg",
	"theme-bg-surface": "surface",
	"theme-bg-card": "surface",
	"theme-bg-row": "row",
	"theme-bg-row-alt": "row-alt",
	"theme-bg-header": "header",
}

# class name → property ids (non-composite)
CLASS_ENTRIES: dict[str, list[str]] = {
	"theme-btn": list(THEME_BTN_PROPERTY_IDS),
	"theme-btn-sm": [PROP_BUTTON_SIZE],
	"theme-btn-md": [PROP_BUTTON_SIZE],
	"theme-btn-lg": [PROP_BUTTON_SIZE],
	"theme-border-thin": [PROP_BORDER_WIDTH],
	"theme-border": [PROP_BORDER_WIDTH, PROP_BORDER_COLOR],
	"theme-border-strong": [PROP_BORDER_WIDTH],
	"theme-border-input-border": [PROP_BORDER_COLOR],
	"theme-border-input-focus": [PROP_BORDER_COLOR],
	"theme-rounded": [PROP_BORDER_RADIUS],
	"theme-rounded-sm": [PROP_BORDER_RADIUS],
	"theme-rounded-md": [PROP_BORDER_RADIUS],
	"theme-rounded-lg": [PROP_BORDER_RADIUS],
	"theme-rounded-xl": [PROP_BORDER_RADIUS],
	"theme-focus-ring": [PROP_FOCUS_RING],
	"theme-hover-bg-primary": [PROP_HOVER_BACKGROUND],
	"theme-hover-bg-secondary": [PROP_HOVER_BACKGROUND],
	"theme-hover-bg-accent": [PROP_HOVER_BACKGROUND],
	"theme-hover-bg-success": [PROP_HOVER_BACKGROUND],
	"theme-hover-bg-info": [PROP_HOVER_BACKGROUND],
	"theme-hover-bg-warning": [PROP_HOVER_BACKGROUND],
	"theme-hover-bg-danger": [PROP_HOVER_BACKGROUND],
	"theme-hover-bg-neutral": [PROP_HOVER_BACKGROUND],
	"theme-hover-border-primary": [PROP_HOVER_BORDER],
	"theme-hover-border-secondary": [PROP_HOVER_BORDER],
	"theme-hover-border-accent": [PROP_HOVER_BORDER],
	"theme-hover-border-success": [PROP_HOVER_BORDER],
	"theme-hover-border-info": [PROP_HOVER_BORDER],
	"theme-hover-border-warning": [PROP_HOVER_BORDER],
	"theme-hover-border-danger": [PROP_HOVER_BORDER],
	"theme-hover-border-neutral": [PROP_HOVER_BORDER],
	"theme-focus-bg-primary": [PROP_FOCUS_FILL],
	"theme-focus-bg-secondary": [PROP_FOCUS_FILL],
	"theme-focus-bg-accent": [PROP_FOCUS_FILL],
	"theme-focus-bg-success": [PROP_FOCUS_FILL],
	"theme-focus-bg-info": [PROP_FOCUS_FILL],
	"theme-focus-bg-warning": [PROP_FOCUS_FILL],
	"theme-focus-bg-danger": [PROP_FOCUS_FILL],
	"theme-focus-bg-neutral": [PROP_FOCUS_FILL],
}

for role in ROLES:
	CLASS_ENTRIES[f"theme-bg-{role}"] = [PROP_BACKGROUND]
	CLASS_ENTRIES[f"theme-text-{role}"] = [PROP_TEXT_COLOR]
	CLASS_ENTRIES[f"theme-text-{role}-fg"] = [PROP_TEXT_COLOR]
	CLASS_ENTRIES[f"theme-text-{role}-fg-tonal"] = [PROP_TEXT_COLOR]
	CLASS_ENTRIES[f"theme-border-{role}"] = [PROP_BORDER_COLOR]
	for shade in ("50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"):
		CLASS_ENTRIES[f"theme-bg-{role}-{shade}"] = [PROP_BACKGROUND]
		CLASS_ENTRIES[f"theme-text-{role}-{shade}"] = [PROP_TEXT_COLOR]
		CLASS_ENTRIES[f"theme-text-{role}-{shade}-fg"] = [PROP_TEXT_COLOR]
		CLASS_ENTRIES[f"theme-text-{role}-{shade}-fg-tonal"] = [PROP_TEXT_COLOR]
		CLASS_ENTRIES[f"theme-border-{role}-{shade}"] = [PROP_BORDER_COLOR]

for cls in NEUTRAL_BG_CLASS:
	CLASS_ENTRIES[cls] = [PROP_BACKGROUND]
CLASS_ENTRIES["theme-text-heading"] = [PROP_TEXT_COLOR]
CLASS_ENTRIES["theme-text-muted"] = [PROP_TEXT_COLOR]
CLASS_ENTRIES["theme-text-link"] = [PROP_TEXT_COLOR]
CLASS_ENTRIES["theme-text-text-header"] = [PROP_TEXT_COLOR]

for role in ROLES:
	CLASS_ENTRIES[f"theme-focus-ring-{role}"] = [PROP_FOCUS_RING]


def _class_tokens(text: str | None) -> list[str]:
	return [t for t in (text or "").split() if t.startswith("theme-")]


def properties_for_classes(classes: list[str]) -> list[dict[str, Any]]:
	seen: set[str] = set()
	ordered: list[str] = []
	for cls in classes:
		for prop_id in CLASS_ENTRIES.get(cls, []):
			if prop_id not in seen:
				seen.add(prop_id)
				ordered.append(prop_id)
	return [PROPERTIES[pid] for pid in ordered if pid in PROPERTIES]


def parse_style_overrides(raw: str | dict | None) -> dict[str, str]:
	if isinstance(raw, dict):
		data = raw
	elif not raw or not str(raw).strip():
		return {}
	else:
		try:
			data = json.loads(raw)
		except json.JSONDecodeError:
			return {}
	if not isinstance(data, dict):
		return {}
	out: dict[str, str] = {}
	for key, val in data.items():
		if key in PROPERTIES and val is not None:
			out[key] = str(val).strip()
	return out


def _legacy_value(row: dict, prop_id: str) -> str:
	prop = PROPERTIES.get(prop_id) or {}
	field = prop.get("legacyField")
	if not field:
		return ""
	val = (row.get(field) or "").strip()
	if prop_id == PROP_BUTTON_SIZE:
		return normalize_button_size_class(val)
	return val


def effective_style_overrides(row: dict) -> dict[str, str]:
	merged = parse_style_overrides(row.get("theme_style_overrides"))
	for prop_id, prop in PROPERTIES.items():
		if prop_id in merged and merged[prop_id] != "":
			continue
		legacy = _legacy_value(row, prop_id)
		if legacy:
			merged[prop_id] = legacy
	return merged


def _role_token_to_var(token: str) -> str | None:
	token = (token or "").strip()
	if not token:
		return None
	if token in ("surface", "card"):
		return "--nce-color-surface"
	if token == "bg":
		return "--nce-color-bg"
	if token == "row":
		return "--nce-color-row"
	if token == "row-alt":
		return "--nce-color-row-alt"
	if token == "border":
		return "--nce-color-border"
	if token == "header":
		return "--nce-color-primary"
	if "-" in token:
		role, shade = token.split("-", 1)
		if role in ROLES and shade.isdigit():
			return f"--nce-color-{role}-{shade}"
	if token in ROLES:
		return f"--nce-color-{token}"
	return None


def _class_to_color_var(class_name: str, prefix: str) -> str | None:
	cls = (class_name or "").strip()
	if not cls.startswith(prefix):
		return None
	rest = cls[len(prefix):]
	if rest.endswith("-fg-tonal"):
		base = rest[: -len("-fg-tonal")]
		return f"--nce-color-{base}-fg-tonal"
	if rest.endswith("-fg"):
		base = rest[: -len("-fg")]
		return f"--nce-color-{base}-fg"
	return f"--nce-color-{rest}"


def _hover_role_from_value(value: str, prefix: str) -> str:
	val = (value or "").strip()
	if val.startswith(prefix):
		return val[len(prefix):].split("-")[0]
	return val or "primary"


def _declarations_for_property(
	prop_id: str,
	value: str,
	row: dict | None = None,
	*,
	theme_focus_ring_enabled: bool | None = None,
	theme_focus_fill_enabled: bool | None = None,
	hover_bg_shade: int = 100,
	hover_border_shade: int = 500,
) -> list[str]:
	val = (value or "").strip()
	prop = PROPERTIES[prop_id]
	if prop.get("kind") != "switch" and not val:
		return []

	if prop_id == PROP_BUTTON_SIZE:
		prefix = BUTTON_SIZE_CLASSES.get(val)
		if not prefix:
			return []
		return [
			f"font-size: var(--nce-btn-{prefix}-font-size);",
			f"padding: var(--nce-btn-{prefix}-pad-y) var(--nce-btn-{prefix}-pad-x);",
			f"min-height: var(--nce-btn-{prefix}-min-height);",
			"line-height: 1.4;",
			"box-sizing: border-box;",
		]

	if prop_id == PROP_BORDER_WIDTH:
		if val not in BORDER_WIDTHS:
			return []
		return ["border-style: solid;", f"border-width: var({BORDER_WIDTHS[val]});"]

	if prop_id == PROP_BORDER_RADIUS:
		radius_map = {
			"theme-rounded": "var(--nce-border-radius)",
			"theme-rounded-sm": "calc(var(--nce-border-radius) * 0.5)",
			"theme-rounded-md": "var(--nce-border-radius)",
			"theme-rounded-lg": "calc(var(--nce-border-radius) * 1.5)",
			"theme-rounded-xl": "calc(var(--nce-border-radius) * 2)",
		}
		expr = radius_map.get(val)
		if not expr:
			return []
		return [f"border-radius: {expr};"]

	if prop_id == PROP_BACKGROUND:
		bg_cls = val if val.startswith("theme-bg-") else f"theme-bg-{val}"
		match = BG_RE.match(bg_cls)
		if not match:
			var = _role_token_to_var(val)
			if not var:
				return []
			decls = [f"background-color: var({var});"]
			fg_type = (row or {}).get("override_fg_type") or "mono"
			if fg_type == "tonal":
				decls.append(f"color: var({var}-fg-tonal);")
			else:
				decls.append(f"color: var({var}-fg);")
			return decls
		role, shade = match.group(1), match.group(2)
		var = f"--nce-color-{role}-{shade}" if shade else f"--nce-color-{role}"
		decls = [f"background-color: var({var});"]
		merged = effective_style_overrides(row) if row else {}
		if PROP_TEXT_COLOR not in merged:
			fg_type = (row or {}).get("override_fg_type") or "mono"
			suffix = "-fg-tonal" if fg_type == "tonal" else "-fg"
			decls.append(f"color: var({var}{suffix});")
		return decls

	if prop_id == PROP_TEXT_COLOR:
		if val.startswith("theme-text-"):
			var = _class_to_color_var(val, "theme-text-")
		else:
			var = _role_token_to_var(val)
			if var:
				var = var if "fg" in val else f"{var}"
		if not var:
			return []
		if val.startswith("theme-text-"):
			return [f"color: var({var});"]
		return [f"color: var({var});"]

	if prop_id == PROP_BORDER_COLOR:
		if val.startswith("theme-border-"):
			match = BORDER_COLOR_RE.match(val)
			if match:
				role, shade = match.group(1), match.group(2)
				return [f"border-color: var(--nce-color-{role}-{shade});"]
			role_only = re.match(rf"^theme-border-({'|'.join(ROLES)})$", val)
			if role_only:
				return [f"border-color: var(--nce-color-{role_only.group(1)});"]
			if val == "theme-border":
				return ["border-color: var(--nce-color-border);"]
		var = _role_token_to_var(val)
		if var:
			return [f"border-color: var({var});"]
		return []

	if prop_id == PROP_HOVER_BACKGROUND:
		role = _hover_role_from_value(val, "theme-hover-bg-")
		return [
			f"background-color: var(--nce-color-{role}-{hover_bg_shade});",
			f"color: var(--nce-color-{role}-{hover_bg_shade}-fg);",
		]

	if prop_id == PROP_HOVER_BORDER:
		role = _hover_role_from_value(val, "theme-hover-border-")
		return [f"border-color: var(--nce-color-{role}-{hover_border_shade});"]

	if prop_id == PROP_FOCUS_RING:
		enabled = theme_focus_ring_enabled if val == "" else val == "1"
		if val == "0":
			enabled = False
		if enabled:
			return [
				"outline: var(--nce-focus-ring-width) solid var(--nce-color-focus);",
				"outline-offset: var(--nce-focus-ring-offset);",
			]
		return ["outline: none;", "outline-offset: 0;"]

	if prop_id == PROP_FOCUS_FILL:
		enabled = theme_focus_fill_enabled if val == "" else val == "1"
		if val == "0":
			enabled = False
		if enabled:
			return [
				"background-color: var(--nce-color-primary);",
				"color: var(--nce-color-primary-fg);",
				"border-color: var(--nce-color-primary);",
			]
		return []

	if prop_id == PROP_BUTTON_OUTLINE:
		if val != "1":
			return []
		bg = effective_style_overrides(row).get(PROP_BACKGROUND) if row else ""
		return outline_declarations(outline_color_var(bg))

	return []


def outline_color_var(background_value: str | None) -> str:
	val = (background_value or "").strip()
	if not val:
		return "--nce-color-primary"
	bg_cls = val if val.startswith("theme-bg-") else f"theme-bg-{val}"
	match = BG_RE.match(bg_cls)
	if match:
		role, shade = match.group(1), match.group(2)
		return f"--nce-color-{role}-{shade}" if shade else f"--nce-color-{role}"
	var = _role_token_to_var(val)
	return var if var else "--nce-color-primary"


def outline_declarations(color_var: str) -> list[str]:
	return [
		"background-color: transparent;",
		f"border-color: var({color_var});",
		f"color: var({color_var});",
	]


def hover_outline_declarations(
	hover_bg_shade: int = 100,
	hover_border_shade: int = 500,
) -> list[str]:
	return [
		f"background-color: var(--nce-color-primary-{hover_bg_shade});",
		f"color: var(--nce-color-primary-{hover_bg_shade}-fg);",
		f"border-color: var(--nce-color-primary-{hover_border_shade});",
	]


def override_declaration_blocks(row: dict) -> list[tuple[str | None, list[str]]]:
	"""Return (pseudo_suffix, decls) pairs. pseudo_suffix None = base rule, ':hover:not(:disabled)' etc."""
	overrides = effective_style_overrides(row)
	blocks: list[tuple[str | None, list[str]]] = []
	if overrides.get(PROP_BUTTON_OUTLINE) == "1":
		all_decls = outline_declarations(outline_color_var(overrides.get(PROP_BACKGROUND)))
		for prop_id, value in overrides.items():
			if prop_id in (PROP_BACKGROUND, PROP_BUTTON_OUTLINE):
				continue
			all_decls.extend(_declarations_for_property(prop_id, value, row))
		if all_decls:
			blocks.append((None, all_decls))
		blocks.append((":hover:not(:disabled)", hover_outline_declarations()))
	else:
		all_decls: list[str] = []
		for prop_id, value in overrides.items():
			all_decls.extend(_declarations_for_property(prop_id, value, row))
		if all_decls:
			blocks.append((None, all_decls))
	return blocks


def catalog_export() -> dict[str, Any]:
	classes = {name: ids for name, ids in CLASS_ENTRIES.items()}
	return {
		"properties": PROPERTIES,
		"classes": classes,
		"themeBtnPropertyIds": list(THEME_BTN_PROPERTY_IDS),
		"tablePropertyIds": list(TABLE_PROPERTY_IDS),
		"tableStyleRowSpecs": table_style_row_specs(),
	}


def theme_btn_emit_blocks(g) -> tuple[list[str], list[str], list[str], list[str]]:
	"""Base, hover, focus-visible ring, focus-visible fill declaration lines for theme-btn."""
	from themes.utils.css_writer import (
		_check_enabled,
		_curated_shade_from_payload,
		_role_is_configured,
	)

	base = [
		"font-size: var(--nce-btn-md-font-size);",
		"padding: var(--nce-btn-md-pad-y) var(--nce-btn-md-pad-x);",
		"min-height: var(--nce-btn-md-min-height);",
		"line-height: 1.4;",
		"box-sizing: border-box;",
		"background-color: var(--nce-color-surface);",
		"color: var(--nce-color-primary);",
		"border-style: solid;",
		"border-width: var(--nce-border-width);",
		"border-color: var(--nce-color-border);",
		"border-radius: calc(var(--nce-border-radius) * 0.5);",
	]
	hover_bg = _curated_shade_from_payload(g, "hover_bg_shade", "100")
	hover_border = _curated_shade_from_payload(g, "hover_border_shade", "500")
	hover: list[str] = []
	if hover_bg is not None and _role_is_configured(g, "primary_color"):
		hover = _declarations_for_property(
			PROP_HOVER_BACKGROUND,
			"primary",
			hover_bg_shade=hover_bg,
			hover_border_shade=hover_border or 500,
		)
		if hover_border is not None:
			hover.extend(
				_declarations_for_property(
					PROP_HOVER_BORDER,
					"primary",
					hover_bg_shade=hover_bg,
					hover_border_shade=hover_border,
				)
			)
	elif hover_border is not None and _role_is_configured(g, "primary_color"):
		hover = _declarations_for_property(
			PROP_HOVER_BORDER,
			"primary",
			hover_border_shade=hover_border,
		)

	if _check_enabled(g, "button_outline_enabled", default=False) and _role_is_configured(
		g, "primary_color"
	):
		outline_base: list[str] = []
		for line in base:
			if line == "background-color: var(--nce-color-surface);":
				outline_base.append("background-color: transparent;")
			elif line == "border-color: var(--nce-color-border);":
				outline_base.append("border-color: var(--nce-color-primary);")
			else:
				outline_base.append(line)
		base = outline_base
		hover = hover_outline_declarations(int(hover_bg or 100), int(hover_border or 500))

	focus_ring = _declarations_for_property(
		PROP_FOCUS_RING,
		"",
		theme_focus_ring_enabled=_check_enabled(g, "focus_ring_enabled"),
	)
	focus_fill: list[str] = []
	if _check_enabled(g, "focus_fill_enabled") and _role_is_configured(g, "primary_color"):
		focus_fill = _declarations_for_property(
			PROP_FOCUS_FILL,
			"1",
			theme_focus_fill_enabled=True,
		)
	return base, hover, focus_ring, focus_fill


def _set_row_field(row, field: str, value: str) -> None:
	if hasattr(row, "set"):
		row.set(field, value)
	else:
		row[field] = value


def sync_legacy_override_fields(row, overrides: dict[str, str]) -> None:
	"""Write legacy DocFields from JSON overrides for readers that still expect them."""
	for prop_id, prop in PROPERTIES.items():
		field = prop.get("legacyField")
		if not field:
			continue
		if prop_id in overrides:
			_set_row_field(row, field, overrides[prop_id])
