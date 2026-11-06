"""Themes editor (/themes) uses published nce_theme.css, not a frozen snapshot (no Frappe bench)."""
from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CSS_PATH = REPO_ROOT / "themes" / "public" / "css" / "themes_app.css"
THEMES_HTML = REPO_ROOT / "themes" / "www" / "themes.html"
HOOKS_PY = REPO_ROOT / "themes" / "hooks.py"


class TestThemesAppCss(unittest.TestCase):
    def test_themes_editor_uses_published_nce_theme_not_frozen_snapshot(self):
        html = THEMES_HTML.read_text(encoding="utf-8")
        self.assertIn("nce_theme.css", html)
        self.assertNotIn("themes_app.css", html)

        hooks = HOOKS_PY.read_text(encoding="utf-8")
        self.assertNotIn("themes_app.css", hooks)

        self.assertFalse(CSS_PATH.is_file(), f"frozen snapshot should be removed: {CSS_PATH}")


if __name__ == "__main__":
    unittest.main()
