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
            mock_set_base = MagicMock()

            with patch(
                "themes.utils.css_writer.generate_site_css",
                return_value=web_css,
            ), patch(
                "themes.utils.css_writer.generate_fonts_css",
                return_value=fonts_css,
            ), patch(
                "themes.utils.site_theme_config_helpers.get_site_default_theme_name",
                return_value="Default",
            ), patch(
                "themes.utils.site_theme_config_helpers.get_site_base_theme_name",
                return_value="Default",
            ), patch(
                "themes.utils.site_theme_config_helpers.set_site_base_theme_name",
                mock_set_base,
            ):
                from themes.utils.css_writer import publish_theme

                result = publish_theme("Default")

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
        mock_set_base.assert_not_called()
        self.assertEqual(
            result,
            {
                "status": "ok",
                "theme": "Default",
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

    def test_validate_rejects_second_default(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(self.MODULE)
            frappe_mock.db.get_all.return_value = ["Other"]
            doc = self._theme_class()(name="Mine", is_default=True)
            with self.assertRaises(FrappeThrow) as ctx:
                doc.validate()
            self.assertEqual(str(ctx.exception), "Another theme is already marked default: Other")

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

    def test_on_trash_publishes_base_or_self_when_active(self):
        with fake_frappe() as frappe_mock:
            _reload_modules(self.MODULE)
            with patch(
                f"{self.MODULE}.get_site_base_theme_name",
                return_value="BaseTheme",
            ), patch("themes.utils.css_writer.publish_theme") as mock_publish:
                doc = self._theme_class()(name="Trashed", status="Active")
                doc.on_trash()
            mock_publish.assert_called_once_with("BaseTheme")


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
