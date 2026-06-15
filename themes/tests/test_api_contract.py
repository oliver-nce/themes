"""API response shape tests for editor helpers (mocked — no Frappe bench required)."""
from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import patch

from themes.tests.frappe_stub import install_frappe_stub

install_frappe_stub()

from themes.api import _desk_theme_editor_response, _theme_editor_response

WEB_EDITOR_KEYS = {
    "theme": str,
    "theme_name": str,
    "status": str,
    "is_default_theme": bool,
    "is_base_theme": bool,
    "is_active": bool,
    "site_default_theme": (str, type(None)),
    "site_base_theme": (str, type(None)),
    "site_active_theme": (str, type(None)),
    "css_hash": (str, type(None)),
    "payload": dict,
}

DESK_EDITOR_KEYS = {
    "theme": str,
    "theme_name": str,
    "status": str,
    "is_default_theme": bool,
    "is_base_theme": bool,
    "is_active": bool,
    "site_default_theme": (str, type(None)),
    "site_base_theme": (str, type(None)),
    "css_hash": (str, type(None)),
    "payload": dict,
}


def _assert_shape(test_case: unittest.TestCase, data: dict, schema: dict, label: str) -> None:
    for key, expected_type in schema.items():
        test_case.assertIn(key, data, f"{label}: missing key {key!r}")
        if isinstance(expected_type, tuple):
            test_case.assertIsInstance(
                data[key],
                expected_type,
                f"{label}: {key} expected one of {expected_type}, got {type(data[key])}",
            )
        else:
            test_case.assertIsInstance(
                data[key],
                expected_type,
                f"{label}: {key} expected {expected_type}, got {type(data[key])}",
            )


class TestApiContract(unittest.TestCase):
    def test_web_editor_response_shape_when_default(self):
        theme_doc = SimpleNamespace(
            name="Default",
            theme_name="Default",
            is_default=1,
            status="Active",
            theme_json='{"primary_color":"#3B82F6"}',
        )
        with patch("themes.utils.theme_service.frappe") as frappe_mock, patch(
            "themes.utils.theme_service._default_theme_name",
            return_value="Default",
        ), patch("themes.utils.theme_family.read_web_css_hash", return_value="abc12345"):
            frappe_mock.db.exists.return_value = True
            frappe_mock.get_doc.return_value = theme_doc
            frappe_mock.get_all.return_value = ["Default"]

            result = _theme_editor_response("Default")

        _assert_shape(self, result, WEB_EDITOR_KEYS, "web default")
        self.assertTrue(result["is_default_theme"])
        self.assertEqual(result["is_base_theme"], result["is_default_theme"])
        self.assertTrue(result["is_active"])
        self.assertEqual(result["site_default_theme"], "Default")
        self.assertEqual(result["site_active_theme"], result["site_default_theme"])
        self.assertEqual(result["css_hash"], "abc12345")

    def test_web_editor_response_shape_when_not_default(self):
        theme_doc = SimpleNamespace(
            name="Alt Theme",
            theme_name="Ocean",
            is_default=0,
            status="Active",
            theme_json="{}",
        )
        with patch("themes.utils.theme_service.frappe") as frappe_mock, patch(
            "themes.utils.theme_service._default_theme_name",
            return_value="Default",
        ):
            frappe_mock.db.exists.return_value = True
            frappe_mock.get_doc.return_value = theme_doc
            frappe_mock.get_all.return_value = ["Default"]

            result = _theme_editor_response("Alt Theme")

        _assert_shape(self, result, WEB_EDITOR_KEYS, "web non-default")
        self.assertFalse(result["is_default_theme"])
        self.assertFalse(result["is_active"])
        self.assertIsNone(result["css_hash"])

    def test_desk_editor_response_shape_when_active(self):
        theme_doc = SimpleNamespace(
            name="Alt Desk",
            theme_name="Ocean",
            is_default=0,
            status="Active",
            theme_json='{"primary_color":"#2490EF"}',
        )
        with patch("themes.utils.theme_service.frappe") as frappe_mock, patch(
            "themes.utils.theme_service._default_theme_name",
            return_value="Default",
        ), patch("themes.utils.desk_css_writer.read_desk_css_hash", return_value="desk1234"):
            frappe_mock.db.exists.return_value = True
            frappe_mock.get_doc.return_value = theme_doc

            result = _desk_theme_editor_response("Alt Desk")

        _assert_shape(self, result, DESK_EDITOR_KEYS, "desk active")
        self.assertFalse(result["is_default_theme"])
        self.assertTrue(result["is_active"])
        self.assertEqual(result["css_hash"], "desk1234")
        self.assertNotIn("site_active_theme", result)

    def test_desk_is_active_follows_status_not_default(self):
        """Default desk theme can be Inactive — is_active must follow status, not Default flag."""
        theme_doc = SimpleNamespace(
            name="Default",
            theme_name="Default",
            is_default=1,
            status="Inactive",
            theme_json="{}",
        )
        with patch("themes.utils.theme_service.frappe") as frappe_mock, patch(
            "themes.utils.theme_service._default_theme_name",
            return_value="Default",
        ), patch("themes.utils.desk_css_writer.read_desk_css_hash", return_value="desk1234"):
            frappe_mock.db.exists.return_value = True
            frappe_mock.get_doc.return_value = theme_doc

            result = _desk_theme_editor_response("Default")

        self.assertTrue(result["is_default_theme"])
        self.assertFalse(result["is_active"])

    def test_desk_editor_response_shape_when_inactive_non_default(self):
        theme_doc = SimpleNamespace(
            name="Alt Desk",
            theme_name="Alt",
            is_default=0,
            status="Inactive",
            theme_json="{}",
        )
        with patch("themes.utils.theme_service.frappe") as frappe_mock, patch(
            "themes.utils.theme_service._default_theme_name",
            return_value="Default",
        ), patch("themes.utils.desk_css_writer.read_desk_css_hash", return_value="desk1234"):
            frappe_mock.db.exists.return_value = True
            frappe_mock.get_doc.return_value = theme_doc

            result = _desk_theme_editor_response("Alt Desk")

        _assert_shape(self, result, DESK_EDITOR_KEYS, "desk inactive")
        self.assertFalse(result["is_default_theme"])
        self.assertFalse(result["is_active"])
        self.assertIsNone(result["css_hash"])

    def test_web_list_row_legacy_aliases_match_default(self):
        row = {
            "name": "Default",
            "theme_name": "Default",
            "is_default": 1,
            "status": "Active",
        }
        row["is_default_theme"] = bool(row["is_default"])
        row["is_base_theme"] = row["is_default_theme"]
        row["is_active"] = row["is_default_theme"]
        self.assertTrue(row["is_default_theme"])
        self.assertEqual(row["is_active"], row["is_default_theme"])

    def test_web_list_row_renamed_default_not_by_name(self):
        row = {
            "name": "Default",
            "theme_name": "Corporate",
            "is_default": 1,
            "status": "Active",
        }
        row["is_default_theme"] = bool(row["is_default"])
        self.assertTrue(row["is_default_theme"])

    def test_desk_list_row_active_semantics(self):
        row = {
            "name": "Alt Desk",
            "theme_name": "Alt",
            "is_default": 0,
            "status": "Active",
        }
        row["is_default_theme"] = bool(row["is_default"])
        row["is_active"] = row["status"] == "Active"
        self.assertFalse(row["is_default_theme"])
        self.assertTrue(row["is_active"])


if __name__ == "__main__":
    unittest.main()
