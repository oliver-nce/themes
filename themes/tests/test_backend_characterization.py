"""Characterization tests for backend publish, bundle, and doctype controllers (pre-refactor).

"""
from __future__ import annotations

import hashlib
import importlib
import json
import os
import sys
import tempfile
import types
import unittest
from contextlib import contextmanager
from pathlib import Path
from unittest.mock import MagicMock, patch

GOLDEN_DIR = Path(__file__).resolve().parent / "golden"
BUNDLE_PAYLOAD = {"b": 1, "a": "#fff", "n": {"50": "#000"}}


class FrappeThrow(Exception):
    pass


class _FrappeFlags:
    def __init__(self) -> None:
        self.in_install = False
        self.in_migrate = False

    def get(self, key, default=None):
        return getattr(self, key, default)


class StubDocument:
    """Minimal Document stand-in for controller tests under fake_frappe."""

    def __init__(self, **kwargs):
        self._changed: dict[str, bool] = {}
        self.flags = _FrappeFlags()
        for key, value in kwargs.items():
            setattr(self, key, value)

    def get(self, key, default=None):
        return getattr(self, key, default)

    def set(self, key, value):
        setattr(self, key, value)

    def has_value_changed(self, field):
        return bool(self._changed.get(field))

    def as_dict(self):
        return {
            k: v
            for k, v in self.__dict__.items()
            if not k.startswith("_") and k != "flags"
        }


def _build_fake_frappe_modules():
    frappe_mock = MagicMock()
    frappe_mock._ = lambda s: s
    def throw(msg):
        raise FrappeThrow(msg)

    frappe_mock.throw = throw
    frappe_mock.flags = _FrappeFlags()
    frappe_mock.cache = MagicMock()

    model_document = types.ModuleType("frappe.model.document")
    model_document.Document = StubDocument
    model = types.ModuleType("frappe.model")
    model.document = model_document

    patched = {
        "frappe": frappe_mock,
        "frappe.model": model,
        "frappe.model.document": model_document,
    }
    return frappe_mock, patched


@contextmanager
def fake_frappe():
    frappe_mock, patched = _build_fake_frappe_modules()
    themes_frappe_backup: dict[str, object] = {}
    for name, mod in list(sys.modules.items()):
        if name.startswith("themes.") and hasattr(mod, "frappe"):
            themes_frappe_backup[name] = mod.frappe
            mod.frappe = frappe_mock

    with patch.dict(sys.modules, patched, clear=False):
        try:
            yield frappe_mock
        finally:
            for name, original in themes_frappe_backup.items():
                mod = sys.modules.get(name)
                if mod is not None:
                    mod.frappe = original


def _reload_modules(*module_names: str) -> None:
    for name in module_names:
        if name in sys.modules:
            importlib.reload(sys.modules[name])
        else:
            importlib.import_module(name)


def _temp_app_layout(frappe_mock: MagicMock) -> tempfile.TemporaryDirectory:
    tmp = tempfile.TemporaryDirectory()
    app_path = tmp.name
    os.makedirs(os.path.join(app_path, "utils"), exist_ok=True)
    os.makedirs(os.path.join(app_path, "public", "css"), exist_ok=True)
    frappe_mock.get_app_path.return_value = app_path
    return tmp


class TestBundleOutput(unittest.TestCase):
    def test_web_bundle_writes_json_and_default_theme_py(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(
                "themes.utils.bundle_base_theme",
                "themes.utils.theme_family",
            )
            from themes.utils.theme_family import _web_bundle

            tmp = _temp_app_layout(frappe_mock)
            result = _web_bundle(dict(BUNDLE_PAYLOAD))

        self.assertEqual(set(result.keys()), {"base_theme_json", "default_theme_py", "bytes"})
        json_path = result["base_theme_json"]
        py_path = result["default_theme_py"]
        expected_json = json.dumps(BUNDLE_PAYLOAD, indent=2, sort_keys=True) + "\n"
        self.assertTrue(json_path.endswith(os.path.join("data", "base_theme.json")))
        with open(json_path, encoding="utf-8") as f:
            self.assertEqual(f.read(), expected_json)
        self.assertEqual(result["bytes"], len(expected_json.encode("utf-8")))
        golden = (GOLDEN_DIR / "bundle_default_theme_py.txt").read_text(encoding="utf-8")
        with open(py_path, encoding="utf-8") as f:
            self.assertEqual(f.read(), golden)
        tmp.cleanup()

    def test_desk_bundle_writes_json_and_default_desk_theme_py(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(
                "themes.utils.bundle_base_theme",
                "themes.utils.theme_family",
            )
            from themes.utils.theme_family import _desk_bundle

            tmp = _temp_app_layout(frappe_mock)
            result = _desk_bundle(dict(BUNDLE_PAYLOAD))

        self.assertEqual(
            set(result.keys()),
            {"base_desk_theme_json", "default_desk_theme_py", "bytes"},
        )
        json_path = result["base_desk_theme_json"]
        py_path = result["default_desk_theme_py"]
        expected_json = json.dumps(BUNDLE_PAYLOAD, indent=2, sort_keys=True) + "\n"
        self.assertTrue(json_path.endswith(os.path.join("data", "base_desk_theme.json")))
        with open(json_path, encoding="utf-8") as f:
            self.assertEqual(f.read(), expected_json)
        self.assertEqual(result["bytes"], len(expected_json.encode("utf-8")))
        golden = (GOLDEN_DIR / "bundle_default_desk_theme_py.txt").read_text(encoding="utf-8")
        with open(py_path, encoding="utf-8") as f:
            self.assertEqual(f.read(), golden)
        tmp.cleanup()


class TestDeskPublishTail(unittest.TestCase):
    def test_publish_desk_theme_writes_css_hash_and_updates_config(self):
        css_body = "BODY"
        expected_hash = hashlib.sha1(css_body.encode("utf-8")).hexdigest()[:8]

        with fake_frappe() as frappe_mock:
            _reload_modules("themes.utils.desk_css_writer")
            tmp = _temp_app_layout(frappe_mock)
            frappe_mock.db.exists.return_value = True
            frappe_mock.get_all.return_value = ["Base"]

            with patch(
                "themes.utils.desk_css_writer.generate_desk_css",
                return_value=css_body,
            ), patch(
                "themes.utils.site_theme_config_helpers.get_site_base_desk_theme_name",
                return_value="Base",
            ):
                from themes.utils.desk_css_writer import publish_desk_theme

                result = publish_desk_theme("Base")

            app_path = frappe_mock.get_app_path.return_value
            css_path = os.path.join(app_path, "public", "css", "nce_desk_theme.css")
            hash_path = css_path + ".hash"
            with open(css_path, encoding="utf-8") as f:
                self.assertEqual(f.read(), css_body)
            with open(hash_path, encoding="utf-8") as f:
                self.assertEqual(f.read(), expected_hash)

        frappe_mock.db.set_single_value.assert_called_once_with(
            "Site Theme Config", "desk_css_hash", expected_hash
        )
        frappe_mock.cache.delete_value.assert_called_with("assets_json")
        frappe_mock.clear_cache.assert_called()
        self.assertEqual(
            result,
            {
                "status": "ok",
                "theme": "Base",
                "css_hash": expected_hash,
                "bytes": 4,
            },
        )
        tmp.cleanup()

    def test_read_desk_css_hash_from_sidecar_after_publish(self):
        css_body = "BODY"
        with fake_frappe() as frappe_mock:
            _reload_modules("themes.utils.desk_css_writer")
            tmp = _temp_app_layout(frappe_mock)
            frappe_mock.db.exists.return_value = True
            frappe_mock.get_all.return_value = []

            with patch(
                "themes.utils.desk_css_writer.generate_desk_css",
                return_value=css_body,
            ), patch(
                "themes.utils.site_theme_config_helpers.get_site_base_desk_theme_name",
                return_value="Base",
            ):
                from themes.utils.desk_css_writer import (
                    _read_desk_css_hash,
                    publish_desk_theme,
                )

                publish_desk_theme("Base")
                self.assertEqual(_read_desk_css_hash(), hashlib.sha1(css_body.encode()).hexdigest()[:8])
            tmp.cleanup()

    def test_read_desk_css_hash_none_when_sidecar_missing(self):
        with fake_frappe() as frappe_mock:
            _reload_modules("themes.utils.desk_css_writer")
            tmp = _temp_app_layout(frappe_mock)
            from themes.utils.desk_css_writer import _read_desk_css_hash

            self.assertIsNone(_read_desk_css_hash())
            tmp.cleanup()


class TestWebPublishTail(unittest.TestCase):
    def test_publish_theme_writes_css_fonts_and_hash(self):
        web_css = "WEB"
        fonts_css = "FONTS"
        expected_hash = hashlib.sha1(web_css.encode("utf-8")).hexdigest()[:8]

        with fake_frappe() as frappe_mock:
            _reload_modules("themes.utils.css_writer")
            tmp = _temp_app_layout(frappe_mock)
            frappe_mock.db.exists.return_value = True
            frappe_mock.db.get_value.return_value = "{}"
            frappe_mock.get_all.return_value = []
            bundled_payload = {"primary_color": "#3B82F6"}

            with patch(
                "themes.utils.css_writer.generate_site_css",
                return_value=web_css,
            ), patch(
                "themes.utils.css_writer.generate_fonts_css",
                return_value=fonts_css,
            ), patch(
                "themes.utils.default_theme.load_bundled_base_theme_payload",
                return_value=bundled_payload,
            ), patch(
                "themes.utils.frappe_ui_bridge.publish_frappe_ui_bridge_css",
            ):
                from themes.utils.css_writer import publish_theme

                result = publish_theme("AnyTheme")

            app_path = frappe_mock.get_app_path.return_value
            theme_path = os.path.join(app_path, "public", "css", "nce_theme.css")
            fonts_path = os.path.join(app_path, "public", "css", "fonts.css")
            with open(theme_path, encoding="utf-8") as f:
                self.assertEqual(f.read(), web_css)
            with open(fonts_path, encoding="utf-8") as f:
                self.assertEqual(f.read(), fonts_css)
            with open(theme_path + ".hash", encoding="utf-8") as f:
                self.assertEqual(f.read(), expected_hash)

        frappe_mock.db.set_single_value.assert_called_once_with(
            "Site Theme Config", "css_hash", expected_hash
        )
        frappe_mock.cache.delete_value.assert_called_with("assets_json")
        frappe_mock.clear_cache.assert_called()
        self.assertEqual(
            result,
            {
                "status": "ok",
                "theme": "base",
                "css_hash": expected_hash,
                "bytes": 3,
            },
        )
        tmp.cleanup()


class TestComponentPublishTail(unittest.TestCase):
    def test_publish_component_css_header_only_when_no_rows(self):
        with fake_frappe() as frappe_mock:
            _reload_modules("themes.utils.component_css_writer")
            tmp = _temp_app_layout(frappe_mock)
            frappe_mock.get_all.side_effect = lambda *a, **k: []

            from themes.utils.component_css_writer import HEADER, publish_component_css

            result = publish_component_css()

            app_path = frappe_mock.get_app_path.return_value
            css_path = os.path.join(app_path, "public", "css", "nce_component_overrides.css")
            with open(css_path, encoding="utf-8") as f:
                self.assertEqual(f.read(), HEADER)

        frappe_mock.db.set_single_value.assert_not_called()
        frappe_mock.cache.delete_value.assert_called_with("assets_json")
        frappe_mock.clear_cache.assert_called()
        self.assertEqual(set(result.keys()), {"status", "css_hash", "rules"})
        self.assertEqual(result["status"], "ok")
        tmp.cleanup()

    def _publish_with_widget_parent(
        self,
        frappe_mock,
        theme_off_raw: str,
        parent_app: str = "custom_app",
        *,
        app_theme_slugs_raw: str = "",
        active_theme_slugs: list[str] | None = None,
        installed_apps: list[str] | None = None,
    ):
        _reload_modules("themes.utils.component_css_writer", "themes.component_api")
        tmp = _temp_app_layout(frappe_mock)
        if installed_apps is None:
            installed_apps = [parent_app]
        frappe_mock.get_installed_apps.return_value = installed_apps
        if active_theme_slugs is None:
            active_theme_slugs = []
        parent = {
            "name": "VC-1",
            "app": parent_app,
            "component_name": "Widget",
            "status": "Present",
            "has_table": 0,
            "table_selector": "",
            "table_scope_class": "",
            "theme_table_targets": "",
        }
        element = {
            "parent": "VC-1",
            "element_key": "root",
            "selector_class": "widget-root",
            "line": 1,
            "element_status": "Present",
            "keep_default": 0,
            "override_bg_class": "theme-bg-primary-300",
            "override_fg_type": "mono",
            "override_text_class": "",
            "override_border_width_class": "",
            "override_border_color_class": "",
            "override_button_size_class": "",
        }

        def get_all_side_effect(doctype, **kwargs):
            if doctype == "Vue Component":
                return [parent]
            if doctype == "Vue Component Element":
                return [element]
            if doctype == "NCE Theme":
                return [{"slug": slug, "theme_name": slug} for slug in active_theme_slugs]
            return []

        frappe_mock.get_all.side_effect = get_all_side_effect

        def get_single_side_effect(doctype, fieldname):
            if doctype == "Theme Component Settings" and fieldname == "theme_off_apps":
                return theme_off_raw
            if doctype == "Theme Component Settings" and fieldname == "app_theme_slugs":
                return app_theme_slugs_raw
            return ""

        frappe_mock.db.get_single_value.side_effect = get_single_side_effect

        with patch("themes.component_api._is_frappe_branded", return_value=False):
            from themes.utils.component_css_writer import publish_component_css

            publish_component_css()
        app_path = frappe_mock.get_app_path.return_value
        css_path = os.path.join(app_path, "public", "css", "nce_component_overrides.css")
        with open(css_path, encoding="utf-8") as f:
            css_text = f.read()
        return tmp, css_text

    def test_publish_component_css_skips_theme_off_app(self):
        with fake_frappe() as frappe_mock:
            tmp, css_text = self._publish_with_widget_parent(frappe_mock, "custom_app")
            self.assertNotIn("widget-root", css_text)
        tmp.cleanup()

    def test_publish_component_css_includes_app_when_theme_on(self):
        with fake_frappe() as frappe_mock:
            tmp, css_text = self._publish_with_widget_parent(
                frappe_mock,
                "",
                app_theme_slugs_raw="custom_app=ocean",
                active_theme_slugs=["ocean"],
            )
            self.assertIn("widget-root", css_text)
        tmp.cleanup()

    def test_theme_off_apps_ignores_themes_app(self):
        with fake_frappe() as frappe_mock:
            tmp, css_text = self._publish_with_widget_parent(
                frappe_mock, "themes", parent_app="themes"
            )
            self.assertIn("widget-root", css_text)
        tmp.cleanup()

    def test_theme_app_slugs_parsing(self):
        with fake_frappe() as frappe_mock:
            def get_single_side_effect(doctype, fieldname):
                if doctype == "Theme Component Settings" and fieldname == "app_theme_slugs":
                    return "nce_events=ocean\nthemes=skip\nbadline\n"
                return ""

            frappe_mock.db.get_single_value.side_effect = get_single_side_effect
            _reload_modules("themes.component_api")
            from themes.component_api import theme_app_slugs

            self.assertEqual(theme_app_slugs(), {"nce_events": "ocean"})


class TestThemeAppApplyGate(unittest.TestCase):
    def _configure_theme_app_mocks(
        self,
        frappe_mock,
        *,
        theme_off_raw: str = "",
        app_theme_slugs_raw: str = "",
        active_theme_slugs: list[str] | None = None,
        installed_apps: list[str] | None = None,
    ):
        if active_theme_slugs is None:
            active_theme_slugs = ["ocean"]
        if installed_apps is None:
            installed_apps = ["themes", "frappe", "nce_events", "custom_app"]
        frappe_mock.get_installed_apps.return_value = installed_apps

        def get_all_side_effect(doctype, **kwargs):
            if doctype == "NCE Theme":
                return [{"slug": slug, "theme_name": slug.title()} for slug in active_theme_slugs]
            return []

        frappe_mock.get_all.side_effect = get_all_side_effect

        def get_single_side_effect(doctype, fieldname):
            if doctype == "Theme Component Settings" and fieldname == "theme_off_apps":
                return theme_off_raw
            if doctype == "Theme Component Settings" and fieldname == "app_theme_slugs":
                return app_theme_slugs_raw
            return ""

        frappe_mock.db.get_single_value.side_effect = get_single_side_effect

        def identity_whitelist(*args, **kwargs):
            if args and callable(args[0]) and not kwargs:
                return args[0]

            def decorator(fn):
                return fn

            return decorator

        frappe_mock.whitelist = identity_whitelist

    @staticmethod
    def _is_frappe_branded_stub(app: str) -> bool:
        return app == "frappe"

    def test_theme_off_apps_includes_unthemed_installed_app(self):
        with fake_frappe() as frappe_mock:
            self._configure_theme_app_mocks(
                frappe_mock,
                app_theme_slugs_raw="nce_events=ocean",
            )
            _reload_modules("themes.component_api")
            with patch(
                "themes.component_api._is_frappe_branded",
                side_effect=self._is_frappe_branded_stub,
            ):
                from themes.component_api import theme_off_apps

                off = theme_off_apps()
            self.assertIn("custom_app", off)
            self.assertNotIn("nce_events", off)

    def test_theme_off_apps_excludes_valid_themed_and_not_stored_off(self):
        with fake_frappe() as frappe_mock:
            self._configure_theme_app_mocks(
                frappe_mock,
                app_theme_slugs_raw="nce_events=ocean\ncustom_app=ocean",
            )
            _reload_modules("themes.component_api")
            with patch(
                "themes.component_api._is_frappe_branded",
                side_effect=self._is_frappe_branded_stub,
            ):
                from themes.component_api import theme_off_apps

                off = theme_off_apps()
            self.assertNotIn("nce_events", off)
            self.assertNotIn("custom_app", off)

    def test_theme_off_apps_stored_off_stays_off_with_valid_theme(self):
        with fake_frappe() as frappe_mock:
            self._configure_theme_app_mocks(
                frappe_mock,
                theme_off_raw="nce_events",
                app_theme_slugs_raw="nce_events=ocean",
            )
            _reload_modules("themes.component_api")
            with patch(
                "themes.component_api._is_frappe_branded",
                side_effect=self._is_frappe_branded_stub,
            ):
                from themes.component_api import theme_off_apps

                off = theme_off_apps()
            self.assertIn("nce_events", off)

    def test_theme_off_apps_never_adds_themes_or_frappe_branded(self):
        with fake_frappe() as frappe_mock:
            self._configure_theme_app_mocks(frappe_mock, app_theme_slugs_raw="")
            _reload_modules("themes.component_api")
            with patch(
                "themes.component_api._is_frappe_branded",
                side_effect=self._is_frappe_branded_stub,
            ):
                from themes.component_api import theme_off_apps

                off = theme_off_apps()
            self.assertNotIn("themes", off)
            self.assertNotIn("frappe", off)

    def test_set_theme_app_apply_on_without_theme_throws(self):
        with fake_frappe() as frappe_mock:
            frappe_mock.only_for = MagicMock()
            self._configure_theme_app_mocks(frappe_mock, app_theme_slugs_raw="")
            _reload_modules("themes.component_api")
            with patch(
                "themes.component_api._is_frappe_branded",
                side_effect=self._is_frappe_branded_stub,
            ), patch("themes.component_api.publish_component_css", return_value={"status": "ok"}):
                from themes.component_api import set_theme_app_apply

                with self.assertRaises(FrappeThrow) as ctx:
                    set_theme_app_apply("nce_events", 1)
            self.assertEqual(str(ctx.exception), "Choose a theme for nce_events first.")

    def test_set_theme_app_theme_empty_slug_throws(self):
        with fake_frappe() as frappe_mock:
            frappe_mock.only_for = MagicMock()
            self._configure_theme_app_mocks(frappe_mock)
            _reload_modules("themes.component_api")
            with patch(
                "themes.component_api._is_frappe_branded",
                side_effect=self._is_frappe_branded_stub,
            ):
                from themes.component_api import set_theme_app_theme

                with self.assertRaises(FrappeThrow):
                    set_theme_app_theme("nce_events", "")

    def test_set_theme_app_theme_unknown_slug_throws(self):
        with fake_frappe() as frappe_mock:
            frappe_mock.only_for = MagicMock()
            self._configure_theme_app_mocks(frappe_mock)
            _reload_modules("themes.component_api")
            with patch(
                "themes.component_api._is_frappe_branded",
                side_effect=self._is_frappe_branded_stub,
            ):
                from themes.component_api import set_theme_app_theme

                with self.assertRaises(FrappeThrow) as ctx:
                    set_theme_app_theme("nce_events", "missing-slug")
            self.assertEqual(str(ctx.exception), "Unknown or inactive theme slug: missing-slug")


class TestNCEThemeController(unittest.TestCase):
    MODULE = "themes.themes.doctype.nce_theme.nce_theme"

    def _theme_class(self):
        return getattr(importlib.import_module(self.MODULE), "NCETheme")

    def test_before_save_slug_from_theme_name_when_empty(self):
        with fake_frappe():
            _reload_modules(self.MODULE)
            doc = self._theme_class()(theme_name="  My Theme #2 ", slug="")
            doc.before_save()
            self.assertEqual(doc.slug, "my-theme-2")

    def test_before_save_keeps_slug_when_theme_name_unchanged(self):
        with fake_frappe():
            _reload_modules(self.MODULE)
            doc = self._theme_class()(theme_name="Keep", slug="existing-slug")
            doc.before_save()
            self.assertEqual(doc.slug, "existing-slug")

    def test_before_save_replaces_slug_when_theme_name_changed(self):
        with fake_frappe():
            _reload_modules(self.MODULE)
            doc = self._theme_class()(theme_name="New Name", slug="old-slug")
            doc._changed["theme_name"] = True
            doc.before_save()
            self.assertEqual(doc.slug, "new-name")

    def test_before_insert_copies_base_theme_json(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(self.MODULE)
            frappe_mock.db.exists.return_value = True
            frappe_mock.db.get_value.return_value = '{"from":"base"}'
            with patch(f"{self.MODULE}.get_site_base_theme_name", return_value="Base"):
                doc = self._theme_class()(theme_json="")
                doc.before_insert()
            self.assertEqual(doc.theme_json, '{"from":"base"}')

    def test_before_insert_empty_json_when_no_base(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(self.MODULE)
            frappe_mock.db.exists.return_value = False
            with patch(f"{self.MODULE}.get_site_base_theme_name", return_value=None):
                doc = self._theme_class()(theme_json="")
                doc.before_insert()
            self.assertEqual(doc.theme_json, "{}")

    def test_before_insert_leaves_nonempty_theme_json(self):
        with fake_frappe():
            _reload_modules(self.MODULE)
            doc = self._theme_class()(theme_json='{"keep":true}')
            doc.before_insert()
            self.assertEqual(doc.theme_json, '{"keep":true}')

    def test_no_second_default_validation_on_web_theme(self):
        with fake_frappe():
            _reload_modules(self.MODULE)
            theme_cls = self._theme_class()
            self.assertNotIn(
                "validate",
                theme_cls.__dict__,
                "Web NCE Theme must not enforce a single Default theme",
            )

    def test_on_update_skips_publish_during_install(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(self.MODULE)
            frappe_mock.flags.in_install = True
            with patch("themes.utils.css_writer.publish_theme") as mock_publish:
                doc = self._theme_class()(name="T", status="Active")
                doc.on_update()
            mock_publish.assert_not_called()

    def test_on_update_skips_publish_during_migrate(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(self.MODULE)
            frappe_mock.flags.in_migrate = True
            with patch("themes.utils.css_writer.publish_theme") as mock_publish:
                doc = self._theme_class()(name="T", status="Active")
                doc.on_update()
            mock_publish.assert_not_called()

    def test_on_update_publishes_when_active(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(self.MODULE)
            with patch(
                f"{self.MODULE}.get_site_base_theme_name",
                return_value="Other",
            ), patch("themes.utils.css_writer.publish_theme") as mock_publish:
                doc = self._theme_class()(name="ActiveOne", status="Active")
                doc.on_update()
            mock_publish.assert_called_once_with("ActiveOne")

    def test_on_trash_publishes_when_active(self):
        with fake_frappe():
            _reload_modules(self.MODULE)
            with patch("themes.utils.css_writer.publish_theme") as mock_publish:
                doc = self._theme_class()(name="Trashed", status="Active", slug="trashed")
                doc.on_trash()
            mock_publish.assert_called_once_with("Trashed")

    def test_on_trash_refuses_when_slug_assigned_to_app(self):
        with fake_frappe():
            _reload_modules(self.MODULE)
            with patch(
                "themes.component_api.theme_app_slugs",
                return_value={"nce_events": "in-use"},
            ), patch("themes.utils.css_writer.publish_theme") as mock_publish:
                doc = self._theme_class()(name="Locked", status="Inactive", slug="in-use")
                with self.assertRaises(FrappeThrow) as ctx:
                    doc.on_trash()
            mock_publish.assert_not_called()
            self.assertIn("nce_events", str(ctx.exception))
            self.assertIn("in-use", str(ctx.exception))


class TestNCEDeskThemeController(unittest.TestCase):
    MODULE = "themes.themes.doctype.nce_desk_theme.nce_desk_theme"

    def _desk_class(self):
        return getattr(importlib.import_module(self.MODULE), "NCEDeskTheme")

    def test_before_save_slug_from_theme_name_when_empty(self):
        with fake_frappe():
            _reload_modules(self.MODULE)
            doc = self._desk_class()(theme_name="  My Theme #2 ", slug="")
            doc.before_save()
            self.assertEqual(doc.slug, "my-theme-2")

    def test_validate_rejects_second_default(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(self.MODULE)
            frappe_mock.db.get_all.return_value = ["DeskOther"]
            doc = self._desk_class()(name="Mine", is_default=True)
            with self.assertRaises(FrappeThrow) as ctx:
                doc.validate()
            self.assertEqual(
                str(ctx.exception),
                "Another desk theme is already marked default: DeskOther",
            )

    def test_validate_rejects_second_active(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(self.MODULE)

            frappe_mock.db.get_all.return_value = ["ActiveOther"]
            doc = self._desk_class()(name="Mine", status="Active", is_default=0)
            with self.assertRaises(FrappeThrow) as ctx:
                doc.validate()
            self.assertEqual(
                str(ctx.exception),
                "Another desk theme is already active: ActiveOther",
            )

    def test_on_update_publishes_when_active(self):
        with fake_frappe():
            _reload_modules(self.MODULE)
            with patch(
                f"{self.MODULE}.get_site_base_desk_theme_name",
                return_value="Other",
            ), patch("themes.utils.desk_css_writer.publish_desk_theme") as mock_publish:
                doc = self._desk_class()(name="DeskActive", status="Active")
                doc.on_update()
            mock_publish.assert_called_once_with("DeskActive")

    def test_on_update_skips_publish_during_install(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(self.MODULE)
            frappe_mock.flags.in_install = True
            with patch("themes.utils.desk_css_writer.publish_desk_theme") as mock_publish:
                doc = self._desk_class()(name="T", status="Active")
                doc.on_update()
            mock_publish.assert_not_called()

    def test_on_trash_publishes_base_or_self_when_active(self):
        with fake_frappe():
            _reload_modules(self.MODULE)
            with patch(
                f"{self.MODULE}.get_site_base_desk_theme_name",
                return_value="DeskBase",
            ), patch("themes.utils.desk_css_writer.publish_desk_theme") as mock_publish:
                doc = self._desk_class()(name="Trashed", status="Active")
                doc.on_trash()
            mock_publish.assert_called_once_with("DeskBase")

    def test_before_insert_copies_base_desk_theme_json(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(self.MODULE)
            frappe_mock.db.exists.return_value = True
            frappe_mock.db.get_value.return_value = '{"desk":true}'
            with patch(
                f"{self.MODULE}.get_site_base_desk_theme_name",
                return_value="DeskBase",
            ):
                doc = self._desk_class()(theme_json="")
                doc.before_insert()
            self.assertEqual(doc.theme_json, '{"desk":true}')


class TestSiteThemeConfigController(unittest.TestCase):
    MODULE = "themes.themes.doctype.site_theme_config.site_theme_config"

    def _config_class(self):
        return getattr(importlib.import_module(self.MODULE), "SiteThemeConfig")

    def test_on_update_skips_during_install(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(self.MODULE)
            frappe_mock.flags.in_install = True
            with patch("themes.utils.css_writer.publish_theme") as mock_web, patch(
                "themes.utils.desk_css_writer.publish_desk_theme"
            ) as mock_desk:
                doc = self._config_class()(base_theme="Default")
                doc.on_update()
            mock_web.assert_not_called()
            mock_desk.assert_not_called()

    def test_validate_missing_base_theme(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(self.MODULE)
            frappe_mock.db.exists.return_value = False
            doc = self._config_class()(base_theme="MissingTheme", active_theme=None)
            with patch(
                "themes.utils.site_theme_config_helpers.get_site_base_theme_name",
                return_value=None,
            ), patch(
                "themes.utils.site_theme_config_helpers.get_site_base_desk_theme_name",
                return_value=None,
            ):
                with self.assertRaises(FrappeThrow) as ctx:
                    doc.validate()
            self.assertEqual(str(ctx.exception), "NCE Theme MissingTheme does not exist")


class TestVueComponentValidate(unittest.TestCase):
    MODULE = "themes.themes.doctype.vue_component.vue_component"

    def _component_class(self):
        return getattr(importlib.import_module(self.MODULE), "VueComponent")

    def _doc(self, **fields):
        defaults = {"elements": [], "status": "Present", "component_name": "C", "name": "C-1"}
        defaults.update(fields)
        return self._component_class()(**defaults)

    def test_table_header_bg_invalid_message(self):
        self._assert_table_field_error(
            {"table_header_bg_class": "bad"},
            "Table Table Header Background: bad is not a valid background class.",
        )

    def _assert_table_field_error(self, field_kwargs, expected_message):
        with fake_frappe():
            _reload_modules(self.MODULE)
            component_api = types.ModuleType("themes.component_api")
            component_api._used_by = lambda *a, **k: []
            sys.modules["themes.component_api"] = component_api
            doc = self._doc(**field_kwargs)
            with patch(f"{self.MODULE}.normalise_groups", return_value=[]), patch(
                f"{self.MODULE}.needs_attention", return_value=False
            ), patch(f"{self.MODULE}.build_summary", return_value=""), patch(
                "themes.component_api._used_by", return_value=[]
            ):
                with self.assertRaises(FrappeThrow) as ctx:
                    doc.validate()
            self.assertEqual(str(ctx.exception), expected_message)

    def test_table_row_fg_type_invalid_message(self):
        self._assert_table_field_error(
            {"table_row_fg_type": "x"},
            "Table Table Row Text: x is not a valid text type.",
        )

    def test_table_row_divider_class_invalid_message(self):
        self._assert_table_field_error(
            {"table_row_divider_class": "x"},
            "Table Horizontal Divider Width: x is not a valid border width class.",
        )

    def test_table_col_divider_color_class_invalid_message(self):
        self._assert_table_field_error(
            {"table_col_divider_color_class": "x"},
            "Table Vertical Divider Colour: x is not a valid border colour class.",
        )

    def test_table_fields_valid_values_do_not_throw(self):
        with fake_frappe():
            _reload_modules(self.MODULE)
            component_api = types.ModuleType("themes.component_api")
            component_api._used_by = lambda *a, **k: []
            sys.modules["themes.component_api"] = component_api
            doc = self._doc(
                table_header_bg_class="theme-bg-primary-600",
                table_row_fg_type="tonal",
                table_row_divider_class="theme-border",
                table_col_divider_color_class="theme-border-primary-600",
            )
            with patch(f"{self.MODULE}.normalise_groups", return_value=[]), patch(
                f"{self.MODULE}.needs_attention", return_value=False
            ), patch(f"{self.MODULE}.build_summary", return_value=""), patch(
                "themes.component_api._used_by", return_value=[]
            ):
                doc.validate()


if __name__ == "__main__":
    unittest.main()
