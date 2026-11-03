"""Unit tests for themes.utils.theme_export (pure builder, no Frappe bench)."""
from __future__ import annotations

import io
import json
import unittest
import zipfile
from pathlib import Path

from themes.tests.frappe_stub import install_frappe_stub

install_frappe_stub()

from themes.utils.theme_export import (
    ThemeExportError,
    build_export_css,
    build_export_files,
    build_export_zip,
    validate_export_items,
)
from themes.utils.theme_color_utils import resolve_neutral_into_payload

TESTS_DIR = Path(__file__).resolve().parent
DATA_DIR = TESTS_DIR.parent / "data"
FONTS_DIR = TESTS_DIR.parent / "public" / "fonts"
DEVELOPER_GUIDE_PATH = (
    TESTS_DIR.parent / "public" / "docs" / "Themes_Developer_Export_Guide.pdf"
)
DEVELOPER_GUIDE_ZIP_KEY = "nce-themes/Themes_Developer_Export_Guide.pdf"


def _load_default_payload() -> dict:
    with open(DATA_DIR / "base_theme.json") as f:
        return resolve_neutral_into_payload(json.load(f))


def _items_default_plus_alt(
    default_name: str = "Default",
    alt_slug: str = "ocean",
) -> list[dict]:
    default = _load_default_payload()
    warm = resolve_neutral_into_payload({**default, "neutral_color_warmth": 40})
    return [
        {"name": default_name, "theme_name": "Default", "slug": "", "payload": default},
        {"name": "Ocean", "theme_name": "Ocean", "slug": alt_slug, "payload": warm},
    ]


class TestThemeExport(unittest.TestCase):
    def test_fallback_uses_where_root(self) -> None:
        items = _items_default_plus_alt()
        css = build_export_css(items, "Default")
        self.assertIn(":where(:root)", css)
        self.assertNotRegex(css, r"(?<!\:where)\(:root\)")

    def test_scope_slug_replaces_root_selector(self) -> None:
        items = _items_default_plus_alt()[:1]
        css = build_export_css(items, "Default", scope_slug="mine")
        self.assertIn(':where([data-nce-theme="mine"])', css)
        self.assertNotIn(":where(:root)", css)

    def test_scoped_theme_uses_data_nce_theme(self) -> None:
        items = _items_default_plus_alt(alt_slug="ocean")
        css = build_export_css(items, "Default")
        self.assertIn(':where([data-nce-theme="ocean"])', css)

    def test_no_assets_themes_in_css(self) -> None:
        items = _items_default_plus_alt()
        css = build_export_css(items, "Default")
        self.assertNotIn("/assets/themes", css)

    def test_font_urls_relative(self) -> None:
        payload = _load_default_payload()
        payload["font_family"] = "Inter"
        items = [{"name": "T", "theme_name": "T", "slug": "", "payload": payload}]
        css = build_export_css(items, "T")
        self.assertIn("url('fonts/inter/latin-wght-normal.woff2')", css)

    def test_only_used_fonts_in_file_dict(self) -> None:
        payload = _load_default_payload()
        payload["font_family"] = "Inter"
        items = [{"name": "T", "theme_name": "T", "slug": "", "payload": payload}]
        files = build_export_files(items, "T", fonts_dir=FONTS_DIR)
        font_keys = [k for k in files if k.startswith("nce-themes/fonts/")]
        self.assertEqual(len(font_keys), 2)
        self.assertTrue(all(k.endswith(".woff2") for k in font_keys))
        self.assertTrue(
            (FONTS_DIR / "inter" / "latin-wght-normal.woff2").is_file()
        )

    def test_bridge_only_when_requested(self) -> None:
        items = _items_default_plus_alt()
        without = build_export_css(items, "Default", include_bridge=False)
        with_bridge = build_export_css(items, "Default", include_bridge=True)
        self.assertNotIn("data-nce-bridge", without)
        self.assertIn(':where(:root[data-nce-bridge="on"]', with_bridge)
        self.assertIn("--gray-500: var(--nce-color-neutral-500);", with_bridge)

    def test_non_default_without_slug_raises(self) -> None:
        items = _items_default_plus_alt()
        items[1]["slug"] = ""
        with self.assertRaises(ThemeExportError):
            validate_export_items(items, "Default")

    def test_zip_contains_expected_members(self) -> None:
        items = _items_default_plus_alt()
        payload = items[0]["payload"]
        payload["font_family"] = "Inter"
        files = build_export_files(items, "Default", fonts_dir=FONTS_DIR)
        raw = build_export_zip(files)
        with zipfile.ZipFile(io.BytesIO(raw)) as zf:
            names = set(zf.namelist())
        self.assertIn("nce-themes/README.txt", names)
        self.assertIn("nce-themes/nce-themes.css", names)
        self.assertIn("nce-themes/nce-theme-switcher.js", names)
        self.assertIn(DEVELOPER_GUIDE_ZIP_KEY, names)

    def test_developer_export_guide_pdf_in_files(self) -> None:
        items = _items_default_plus_alt()
        files = build_export_files(items, "Default", fonts_dir=FONTS_DIR)
        self.assertIn(DEVELOPER_GUIDE_ZIP_KEY, files)
        pdf_bytes = files[DEVELOPER_GUIDE_ZIP_KEY]
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))
        self.assertEqual(pdf_bytes, DEVELOPER_GUIDE_PATH.read_bytes())

    def test_readme_lists_slugs(self) -> None:
        items = _items_default_plus_alt(alt_slug="ocean")
        files = build_export_files(items, "Default", fonts_dir=FONTS_DIR)
        readme = files["nce-themes/README.txt"].decode("utf-8")
        self.assertIn("Themes_Developer_Export_Guide.pdf", readme)
        self.assertIn('slug "ocean"', readme)
        self.assertIn('slug ""', readme)


if __name__ == "__main__":
    unittest.main()
