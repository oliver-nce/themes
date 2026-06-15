"""Tests for movable is_default flag and promote-to-default behavior."""
from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from themes.tests.frappe_stub import install_frappe_stub

install_frappe_stub()

from themes.utils.theme_service import (  # noqa: E402
    _is_default_theme_record,
    _promote_to_default,
    rename,
)
from themes.utils.theme_family import WEB_FAMILY


class TestDefaultThemeFlag(unittest.TestCase):
    def test_is_default_only_from_flag(self):
        self.assertTrue(_is_default_theme_record(is_default=1))
        self.assertFalse(_is_default_theme_record(is_default=0))
        self.assertFalse(_is_default_theme_record(is_default=None))

    def test_rename_allowed_for_default_even_when_active(self):
        doc = MagicMock()
        doc.name = "Default"
        doc.theme_name = "Corporate"
        doc.is_default = 1
        doc.status = "Active"
        with patch("themes.utils.theme_service.frappe") as frappe_mock:
            frappe_mock.get_doc.return_value = doc
            frappe_mock.db.exists.return_value = False
            frappe_mock.db.sql = MagicMock()
            frappe_mock.clear_cache = MagicMock()
            frappe_mock.session.user = "test@example.com"
            result = rename(WEB_FAMILY, "Default", "Winter 2026")
        self.assertEqual(result["theme_name"], "Winter 2026")

    def test_promote_moves_flag_and_pointer(self):
        family = SimpleNamespace(
            doctype="NCE Theme",
            theme_exists_label="NCE Theme {0} does not exist",
            set_base_theme_name=MagicMock(),
        )
        with patch("themes.utils.theme_service.frappe") as frappe_mock, patch(
            "themes.utils.theme_service._default_theme_name",
            return_value="Old Default",
        ):
            frappe_mock.db.exists.return_value = True
            frappe_mock.db.set_value = MagicMock()
            frappe_mock.clear_cache = MagicMock()
            _promote_to_default(family, "Ocean")
            frappe_mock.db.set_value.assert_any_call(
                "NCE Theme", "Old Default", "is_default", 0, update_modified=False
            )
            frappe_mock.db.set_value.assert_any_call(
                "NCE Theme", "Ocean", "is_default", 1, update_modified=False
            )
            family.set_base_theme_name.assert_called_once_with("Ocean")


if __name__ == "__main__":
    unittest.main()
