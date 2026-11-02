"""Dynamic app_include_css / web_include_css via PEP 562 (no Frappe bench)."""
from __future__ import annotations

import inspect
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import themes.hooks as hooks


class TestHooksDynamicCss(unittest.TestCase):
    def setUp(self):
        self._tmpdir = tempfile.TemporaryDirectory()
        self._css_dir = Path(self._tmpdir.name)
        self._patch = patch.object(hooks, "_css_dir", return_value=str(self._css_dir))
        self._patch.start()

    def tearDown(self):
        self._patch.stop()
        self._tmpdir.cleanup()

    def _write_hash(self, filename: str, value: str) -> None:
        (self._css_dir / f"{filename}.hash").write_text(value, encoding="utf-8")

    def test_css_urls_refresh_without_reimport(self):
        self._write_hash("nce_theme.css", "aaaa1111")

        self.assertIn(
            "/assets/themes/css/nce_theme.css?v=aaaa1111",
            hooks.app_include_css,
        )
        self.assertIn(
            "/assets/themes/css/nce_theme.css?v=aaaa1111",
            hooks.web_include_css,
        )

        self._write_hash("nce_theme.css", "bbbb2222")

        self.assertIn(
            "/assets/themes/css/nce_theme.css?v=bbbb2222",
            hooks.app_include_css,
        )
        self.assertIn(
            "/assets/themes/css/nce_theme.css?v=bbbb2222",
            hooks.web_include_css,
        )

    def test_missing_sidecar_falls_back_to_bare_paths(self):
        app_css = hooks.app_include_css
        web_css = hooks.web_include_css

        self.assertEqual(
            app_css[:4],
            [
                "/assets/themes/css/nce_theme.css",
                "/assets/themes/css/nce_frappe_ui_bridge.css",
                "/assets/themes/css/nce_component_overrides.css",
                "/assets/themes/css/nce_desk_theme.css",
            ],
        )
        self.assertEqual(
            web_css[:3],
            [
                "/assets/themes/css/nce_theme.css",
                "/assets/themes/css/nce_frappe_ui_bridge.css",
                "/assets/themes/css/nce_component_overrides.css",
            ],
        )
        self.assertNotIn("/assets/themes/css/nce_desk_theme.css", web_css)

    def test_getmembers_includes_css_hook_lists(self):
        members = dict(inspect.getmembers(hooks))
        self.assertIn("app_include_css", members)
        self.assertIn("web_include_css", members)
        self.assertIsInstance(members["app_include_css"], list)
        self.assertIsInstance(members["web_include_css"], list)

    def test_dir_includes_css_hook_names(self):
        self.assertIn("app_include_css", dir(hooks))
        self.assertIn("web_include_css", dir(hooks))

    def test_unknown_attribute_raises(self):
        with self.assertRaises(AttributeError) as ctx:
            _ = hooks.not_a_real_hook_attribute
        self.assertIn("not_a_real_hook_attribute", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
