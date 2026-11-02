"""Committed themes_app.css snapshot and /themes page wiring (no Frappe bench)."""
from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CSS_PATH = REPO_ROOT / "themes" / "public" / "css" / "themes_app.css"
THEMES_HTML = REPO_ROOT / "themes" / "www" / "themes.html"
HOOKS_PY = REPO_ROOT / "themes" / "hooks.py"


class TestThemesAppCss(unittest.TestCase):
    def test_themes_app_css_snapshot(self):
        self.assertTrue(CSS_PATH.is_file(), f"missing {CSS_PATH}")

        text = CSS_PATH.read_text(encoding="utf-8")
        self.assertIn("body:has(#themes-app) {", text)
        self.assertNotIn("\n:root {", text)
        self.assertNotRegex(text, r"(?m)^:root\s*\{")
        self.assertIn("--nce-color-primary: #0561AC", text)
        self.assertIn("--nce-color-surface: #D6E2FB", text)
        self.assertIn("font-family: 'Source Sans 3'", text)
        self.assertIn("font-family: 'Public Sans'", text)

    def test_themes_page_loads_snapshot_not_hooks(self):
        html = THEMES_HTML.read_text(encoding="utf-8")
        self.assertIn("themes_app.css", html)

        hooks = HOOKS_PY.read_text(encoding="utf-8")
        self.assertNotIn("themes_app.css", hooks)


if __name__ == "__main__":
    unittest.main()
