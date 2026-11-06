"""Unit tests for themes.utils.app_theme_files (temp app dirs, stubbed frappe)."""
from __future__ import annotations

import importlib
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from themes.tests.frappe_stub import install_frappe_stub
from themes.tests.test_backend_characterization import (
    FrappeThrow,
    TestThemeAppApplyGate,
    _reload_modules,
    fake_frappe,
)

install_frappe_stub()

from themes.utils.app_theme_files import MARK_BEGIN, MARK_END

MINIMAL_EXPORT = {
    "nce-themes/nce-themes.css": b"/* nce */",
    "nce-themes/nce-theme-switcher.js": b"// switcher",
    "nce-themes/README.txt": b"readme",
}

MINIMAL_ITEMS = [
    {
        "name": "Ocean",
        "theme_name": "Ocean",
        "slug": "ocean",
        "payload": {"a": "#336699", "n": {"50": "#000"}},
    }
]


class AppThemeFilesFixture:
    def __init__(self) -> None:
        self.root = tempfile.TemporaryDirectory()
        self.site_root = Path(self.root.name) / "site"
        self.site_private = self.site_root / "private"
        self.site_private.mkdir(parents=True)
        self.themes_app = Path(self.root.name) / "themes_app"
        self.target_app = Path(self.root.name) / "nce_events"
        for app_root in (self.themes_app, self.target_app):
            (app_root / "public").mkdir(parents=True)
            (app_root / "hooks.py").write_text(
                'app_name = "nce_events"\n', encoding="utf-8"
            )

    def cleanup(self) -> None:
        self.root.cleanup()

    def site_path(self, *parts: str) -> str:
        return str(self.site_root.joinpath(*parts))

    def paths_for(self, frappe_mock):
        def get_app_path(app: str) -> str:
            if app == "themes":
                return str(self.themes_app)
            return str(self.target_app)

        def get_site_path(*parts: str) -> str:
            return self.site_path(*parts)

        frappe_mock.get_app_path.side_effect = get_app_path
        frappe_mock.get_site_path.side_effect = get_site_path


def _load_app_theme_files():
    _reload_modules("themes.utils.app_theme_files")
    return importlib.import_module("themes.utils.app_theme_files")


class TestAppThemeFilesApply(unittest.TestCase):
    def setUp(self) -> None:
        self.fx = AppThemeFilesFixture()

    def tearDown(self) -> None:
        self.fx.cleanup()

    def _apply(self, slug: str = "ocean", app: str = "nce_events"):
        with fake_frappe() as frappe_mock:
            self.fx.paths_for(frappe_mock)
            frappe_mock.get_all.return_value = [{"name": "Ocean"}]
            mod = _load_app_theme_files()
            with patch(
                "themes.utils.app_theme_files.build_export_files",
                return_value=dict(MINIMAL_EXPORT),
            ), patch(
                "themes.utils.app_theme_files._load_theme_rows",
                return_value=list(MINIMAL_ITEMS),
            ):
                with patch(
                    "themes.component_api._is_frappe_branded",
                    return_value=False,
                ):
                    return mod.apply_to_app(app, slug)

    def test_apply_writes_files_and_managed_hooks_block(self) -> None:
        result = self._apply()
        self.assertEqual(result["app"], "nce_events")
        self.assertEqual(result["slug"], "ocean")
        css = self.fx.target_app / "public" / "nce-themes" / "nce-themes.css"
        self.assertTrue(css.is_file())
        hooks = (self.fx.target_app / "hooks.py").read_text(encoding="utf-8")
        self.assertEqual(hooks.count(MARK_BEGIN), 1)
        compile(hooks, "hooks.py", "exec")
        record = json.loads(
            (self.fx.site_private / "nce-themes-applied.json").read_text(encoding="utf-8")
        )
        self.assertIn("nce_events", record)
        self.assertEqual(record["nce_events"]["slug"], "ocean")

    def test_reapply_replaces_block_once(self) -> None:
        self._apply()
        self._apply()
        hooks = (self.fx.target_app / "hooks.py").read_text(encoding="utf-8")
        self.assertEqual(hooks.count(MARK_BEGIN), 1)
        self.assertEqual(hooks.count(MARK_END), 1)

    def test_refuses_non_compilable_hooks_without_writing(self) -> None:
        hooks_path = self.fx.target_app / "hooks.py"
        hooks_path.write_text("def broken(:\n", encoding="utf-8")
        public_nce = self.fx.target_app / "public" / "nce-themes"
        with fake_frappe() as frappe_mock:
            self.fx.paths_for(frappe_mock)
            frappe_mock.get_all.return_value = [{"name": "Ocean"}]
            mod = _load_app_theme_files()
            with patch(
                "themes.utils.app_theme_files.build_export_files",
                return_value=dict(MINIMAL_EXPORT),
            ), patch(
                "themes.utils.app_theme_files._load_theme_rows",
                return_value=list(MINIMAL_ITEMS),
            ):
                with patch(
                    "themes.component_api._is_frappe_branded",
                    return_value=False,
                ):
                    with self.assertRaises(FrappeThrow):
                        mod.apply_to_app("nce_events", "ocean")
        self.assertFalse(public_nce.exists())
        self.assertEqual(hooks_path.read_text(encoding="utf-8"), "def broken(:\n")
        self.assertFalse((self.fx.site_private / "nce-themes-applied.json").exists())

    def test_refuses_unmanaged_nce_themes_folder(self) -> None:
        (self.fx.target_app / "public" / "nce-themes").mkdir()
        (self.fx.target_app / "public" / "nce-themes" / "extra.txt").write_text("x")
        with fake_frappe() as frappe_mock:
            self.fx.paths_for(frappe_mock)
            frappe_mock.get_all.return_value = [{"name": "Ocean"}]
            mod = _load_app_theme_files()
            with patch(
                "themes.utils.app_theme_files.build_export_files",
                return_value=dict(MINIMAL_EXPORT),
            ), patch(
                "themes.utils.app_theme_files._load_theme_rows",
                return_value=list(MINIMAL_ITEMS),
            ):
                with patch(
                    "themes.component_api._is_frappe_branded",
                    return_value=False,
                ):
                    with self.assertRaises(FrappeThrow):
                        mod.apply_to_app("nce_events", "ocean")

    def test_adopts_existing_folder_when_hooks_has_managed_block(self) -> None:
        public_nce = self.fx.target_app / "public" / "nce-themes"
        public_nce.mkdir()
        (public_nce / "old.txt").write_text("x")
        hooks_path = self.fx.target_app / "hooks.py"
        hooks_path.write_text(
            'app_name = "nce_events"\n' + f"{MARK_BEGIN}\nold = 1\n{MARK_END}\n",
            encoding="utf-8",
        )
        with fake_frappe() as frappe_mock:
            self.fx.paths_for(frappe_mock)
            frappe_mock.get_all.return_value = [{"name": "Ocean"}]
            mod = _load_app_theme_files()
            with patch(
                "themes.utils.app_theme_files.build_export_files",
                return_value=dict(MINIMAL_EXPORT),
            ), patch(
                "themes.utils.app_theme_files._load_theme_rows",
                return_value=list(MINIMAL_ITEMS),
            ):
                with patch(
                    "themes.component_api._is_frappe_branded",
                    return_value=False,
                ):
                    result = mod.apply_to_app("nce_events", "ocean")
        self.assertEqual(result["app"], "nce_events")
        source = hooks_path.read_text(encoding="utf-8")
        self.assertEqual(source.count(MARK_BEGIN), 1)
        self.assertNotIn("old = 1", source)
        record = json.loads((self.fx.site_private / "nce-themes-applied.json").read_text())
        self.assertIn("nce_events", record)

    def test_refuses_themes_and_frappe_branded_apps(self) -> None:
        with fake_frappe() as frappe_mock:
            self.fx.paths_for(frappe_mock)
            mod = _load_app_theme_files()
            with self.assertRaises(FrappeThrow):
                mod.apply_to_app("themes", "ocean")
            with patch(
                "themes.component_api._is_frappe_branded",
                return_value=True,
            ):
                with self.assertRaises(FrappeThrow):
                    mod.apply_to_app("nce_events", "ocean")


class TestRefreshAppliedExports(unittest.TestCase):
    def setUp(self) -> None:
        self.fx = AppThemeFilesFixture()

    def tearDown(self) -> None:
        self.fx.cleanup()

    def test_refresh_rewrites_css_only_and_slug_filter_skips(self) -> None:
        """Refresh rebuilds export bytes and record files; hooks, slug, applied_on stay put.

        Filter slug="ocean" skips entries whose record slug differs.
        """
        MINIMAL_REFRESH = {
            k: (b"/* refreshed */" if k.endswith(".css") else v)
            for k, v in MINIMAL_EXPORT.items()
        }
        mod = _load_app_theme_files()
        with fake_frappe() as frappe_mock:
            self.fx.paths_for(frappe_mock)
            frappe_mock.get_all.return_value = [{"name": "Ocean"}]
            with patch(
                "themes.utils.app_theme_files.build_export_files",
                return_value=dict(MINIMAL_EXPORT),
            ), patch(
                "themes.utils.app_theme_files._load_theme_rows",
                return_value=list(MINIMAL_ITEMS),
            ):
                with patch(
                    "themes.component_api._is_frappe_branded",
                    return_value=False,
                ):
                    mod.apply_to_app("nce_events", "ocean")

        hooks_before = (self.fx.target_app / "hooks.py").read_text(encoding="utf-8")
        record_path = self.fx.site_private / "nce-themes-applied.json"
        record_before = json.loads(record_path.read_text(encoding="utf-8"))
        applied_on_before = record_before["nce_events"]["applied_on"]
        slug_before = record_before["nce_events"]["slug"]

        with fake_frappe() as frappe_mock:
            self.fx.paths_for(frappe_mock)
            frappe_mock.get_all.return_value = [{"name": "Ocean"}]
            with patch(
                "themes.utils.app_theme_files.build_export_files",
                return_value=dict(MINIMAL_REFRESH),
            ), patch(
                "themes.utils.app_theme_files._load_theme_rows",
                return_value=list(MINIMAL_ITEMS),
            ):
                rewritten = mod.refresh_applied_exports()

        self.assertEqual(rewritten, ["nce_events"])
        css_path = self.fx.target_app / "public" / "nce-themes" / "nce-themes.css"
        self.assertEqual(css_path.read_bytes(), b"/* refreshed */")
        self.assertEqual(
            (self.fx.target_app / "hooks.py").read_text(encoding="utf-8"),
            hooks_before,
        )
        record_after = json.loads(record_path.read_text(encoding="utf-8"))
        self.assertEqual(record_after["nce_events"]["slug"], slug_before)
        self.assertEqual(record_after["nce_events"]["applied_on"], applied_on_before)

        # Different slug in record: filtered refresh must not rewrite files.
        record_mut = json.loads(record_path.read_text(encoding="utf-8"))
        record_mut["nce_events"]["slug"] = "forest"
        record_path.write_text(json.dumps(record_mut, indent=2) + "\n", encoding="utf-8")

        MINIMAL_OTHER = {
            k: (b"/* other */" if k.endswith(".css") else v)
            for k, v in MINIMAL_EXPORT.items()
        }
        with fake_frappe() as frappe_mock:
            self.fx.paths_for(frappe_mock)
            frappe_mock.get_all.return_value = [{"name": "Ocean"}]
            with patch(
                "themes.utils.app_theme_files.build_export_files",
                return_value=dict(MINIMAL_OTHER),
            ), patch(
                "themes.utils.app_theme_files._load_theme_rows",
                return_value=list(MINIMAL_ITEMS),
            ):
                rewritten2 = mod.refresh_applied_exports(slug="ocean")

        self.assertEqual(rewritten2, [])
        self.assertEqual(css_path.read_bytes(), b"/* refreshed */")


class TestAppThemeFilesRemoveAndStatus(unittest.TestCase):
    def setUp(self) -> None:
        self.fx = AppThemeFilesFixture()

    def tearDown(self) -> None:
        self.fx.cleanup()

    def _apply(self):
        with fake_frappe() as frappe_mock:
            self.fx.paths_for(frappe_mock)
            frappe_mock.get_all.return_value = [{"name": "Ocean"}]
            mod = _load_app_theme_files()
            with patch(
                "themes.utils.app_theme_files.build_export_files",
                return_value=dict(MINIMAL_EXPORT),
            ), patch(
                "themes.utils.app_theme_files._load_theme_rows",
                return_value=list(MINIMAL_ITEMS),
            ):
                with patch(
                    "themes.component_api._is_frappe_branded",
                    return_value=False,
                ):
                    mod.apply_to_app("nce_events", "ocean")
            return mod

    def test_remove_deletes_files_and_block(self) -> None:
        mod = self._apply()
        with fake_frappe() as frappe_mock:
            self.fx.paths_for(frappe_mock)
            result = mod.remove_from_app("nce_events")
        self.assertTrue(result["removed"])
        self.assertFalse((self.fx.target_app / "public" / "nce-themes").exists())
        hooks = (self.fx.target_app / "hooks.py").read_text(encoding="utf-8")
        self.assertNotIn(MARK_BEGIN, hooks)
        compile(hooks, "hooks.py", "exec")
        record_path = self.fx.site_private / "nce-themes-applied.json"
        record = json.loads(record_path.read_text(encoding="utf-8"))
        self.assertNotIn("nce_events", record)

    def test_app_status_transitions(self) -> None:
        mod = self._apply()
        with fake_frappe() as frappe_mock:
            self.fx.paths_for(frappe_mock)
            self.assertEqual(mod.app_status("nce_events"), "applied")
            shutil.rmtree(self.fx.target_app / "public" / "nce-themes")
            self.assertEqual(mod.app_status("nce_events"), "removed_by_update")
            mod.remove_from_app("nce_events")
            self.assertEqual(mod.app_status("nce_events"), "not_applied")

    def test_remove_when_not_applied_is_noop(self) -> None:
        with fake_frappe() as frappe_mock:
            self.fx.paths_for(frappe_mock)
            mod = _load_app_theme_files()
            result = mod.remove_from_app("nce_events")
        self.assertFalse(result["removed"])


class TestSetThemeAppApplyFilesIntegration(TestThemeAppApplyGate):
    def test_set_theme_app_apply_calls_apply_and_remove(self) -> None:
        with fake_frappe() as frappe_mock:
            frappe_mock.only_for = MagicMock()
            self._configure_theme_app_mocks(
                frappe_mock,
                app_theme_slugs_raw="nce_events=ocean",
            )
            _reload_modules("themes.component_api")
            with patch(
                "themes.component_api._is_frappe_branded",
                side_effect=self._is_frappe_branded_stub,
            ), patch(
                "themes.utils.app_theme_files.apply_to_app",
                return_value={"app": "nce_events", "slug": "ocean", "files": [], "hooks_changed": True},
            ) as apply_mock, patch(
                "themes.utils.app_theme_files.remove_from_app",
                return_value={"app": "nce_events", "removed": True},
            ) as remove_mock, patch(
                "themes.utils.app_theme_files.app_status",
                return_value="applied",
            ), patch(
                "themes.component_api.rescan_all",
                return_value={"status": "ok"},
            ), patch(
                "themes.component_api.publish_component_css",
                return_value={"status": "ok"},
            ), patch(
                "themes.utils.apply_explanation.is_acknowledged",
                return_value=True,
            ):
                from themes.component_api import set_theme_app_apply

                set_theme_app_apply("nce_events", 1)
                apply_mock.assert_called_once_with("nce_events", "ocean")
                remove_mock.assert_not_called()

                set_theme_app_apply("nce_events", 0)
                remove_mock.assert_called_once_with("nce_events")


if __name__ == "__main__":
    unittest.main()
