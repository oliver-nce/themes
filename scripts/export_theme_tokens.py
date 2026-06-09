#!/usr/bin/env python3
"""Generate frontend/src/domain/theme-tokens.ts from themes.utils.theme_tokens."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from themes.utils.theme_tokens import export_token_contract  # noqa: E402

OUT = ROOT / "frontend" / "src" / "domain" / "theme-tokens.ts"


def _ts_string(value: str) -> str:
	return json.dumps(value)


def _ts_object(obj: dict, indent: int = 1) -> str:
	pad = "\t" * indent
	lines = ["{"]
	for key, val in obj.items():
		lines.append(f"{pad}{_ts_string(key)}: {_ts_value(val, indent + 1)},")
	lines.append("\t" * (indent - 1) + "}")
	return "\n".join(lines)


def _ts_array(items, indent: int = 1) -> str:
	if not items:
		return "[]"
	if isinstance(items[0], (list, tuple)):
		inner = ", ".join(_ts_value(item, indent) for item in items)
		return f"[{inner}]"
	if isinstance(items[0], str):
		return json.dumps(items)
	return json.dumps(items)


def _ts_value(val, indent: int = 1):
	if isinstance(val, dict):
		return _ts_object(val, indent)
	if isinstance(val, list):
		if val and isinstance(val[0], list):
			parts = []
			for row in val:
				parts.append("[" + ", ".join(str(x) for x in row) + "]")
			return "[" + ", ".join(parts) + "]"
		return json.dumps(val)
	if isinstance(val, str):
		return _ts_string(val)
	return json.dumps(val)


def render_ts(contract: dict) -> str:
	c = contract
	lines = [
		"/**",
		" * GENERATED from themes/utils/theme_tokens.py — do not edit by hand.",
		" * Regenerate: npm run export:tokens  (or python3 scripts/export_theme_tokens.py)",
		" */",
		"",
		f"export const CURATED_SHADES = {json.dumps(c['curatedShades'])} as const",
		"export type ThemeShade = (typeof CURATED_SHADES)[number]",
		"",
		f"export const ROLES = {json.dumps(c['roles'])} as const",
		"export type ThemeRole = (typeof ROLES)[number]",
		"",
		f"export const FG_ROLES = {json.dumps(c['fgRoles'])} as const",
		f"export const FG_SHADE_ROLES = {json.dumps(c['fgShadeRoles'])} as const",
		"",
		f"export const GAMMA_SAT_ROLE_FIELDS = new Set<string>({json.dumps(c['gammaSatRoleFields'])})",
		"",
		f"export const BORDER_RADIUS_MAP: Record<string, string> = {_ts_object(c['borderRadiusMap'], 0)}",
		f"export const SPACING_SCALE_MAP: Record<string, string> = {_ts_object(c['spacingScaleMap'], 0)}",
		f"export const LINE_HEIGHT_MAP: Record<string, string> = {_ts_object(c['lineHeightMap'], 0)}",
		f"export const TRANSITION_MAP: Record<string, string> = {_ts_object(c['transitionMap'], 0)}",
		"",
		"export type ShadowLayer = [number, number, number, number, number]",
		f"export const SHADOW_DEFS: Record<string, ShadowLayer[]> = {_ts_object(c['shadowDefs'], 0)}",
		"",
		f"export const COLOR_FIELDS: Record<string, string> = {_ts_object(c['colorFields'], 0)}",
		f"export const SHADE_SCALE_FIELDS: Record<string, string> = {_ts_object(c['shadeScaleFields'], 0)}",
		f"export const COLOR_VAR_MAP: Record<string, string> = {_ts_object(c['colorVarMap'], 0)}",
		f"export const ROLE_VAR_MAP: Record<string, string> = {_ts_object(c['roleVarMap'], 0)}",
		"",
		"export const SHADE_PREVIEW_FIELDS: ReadonlyArray<readonly [string, string]> = "
		+ json.dumps([tuple(pair) for pair in c["shadePreviewFields"]])
		+ " as const",
		"",
		f"export const FONT_REGISTRY: Record<string, readonly [string, string]> = "
		+ json.dumps({k: tuple(v) for k, v in c["fontRegistry"].items()}),
		f"export const RETIRED_FONT_ALIASES: Record<string, string> = {_ts_object(c['retiredFontAliases'], 0)}",
		f"export const FONT_OPTIONS: readonly string[] = {json.dumps(c['fontOptions'])} as const",
		f"export const TOKEN_FIELDS: readonly string[] = {json.dumps(c['tokenFields'])} as const",
		"",
	]
	return "\n".join(lines) + "\n"


def main() -> None:
	contract = export_token_contract()
	OUT.parent.mkdir(parents=True, exist_ok=True)
	OUT.write_text(render_ts(contract))
	print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
	main()
