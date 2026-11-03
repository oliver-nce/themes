#!/usr/bin/env python3
"""Generate frontend/src/domain/theme-class-catalog.ts from theme_class_catalog."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from themes.utils.theme_class_catalog import catalog_export  # noqa: E402

OUT = ROOT / "frontend" / "src" / "domain" / "theme-class-catalog.ts"


def main() -> None:
	payload = catalog_export()
	OUT.parent.mkdir(parents=True, exist_ok=True)
	body = json.dumps(payload, indent="\t")
	text = (
		"/**\n"
		" * GENERATED from themes/utils/theme_class_catalog.py — do not edit by hand.\n"
		" * Regenerate: npm run export:catalog  (or python3 scripts/export_theme_class_catalog.py)\n"
		" */\n\n"
		f"export const THEME_CLASS_CATALOG = {body} as const\n\n"
		"export type ThemeStyleProperty = (typeof THEME_CLASS_CATALOG.properties)[string]\n"
	)
	OUT.write_text(text)
	print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
	main()
