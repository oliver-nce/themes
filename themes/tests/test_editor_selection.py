"""Unit tests for per-user editor theme selection (frappe.defaults helpers)."""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock

from themes.tests.frappe_stub import install_frappe_stub

frappe_mock = install_frappe_stub()

from themes.utils import editor_selection as es


class TestEditorSelection(unittest.TestCase):
    def setUp(self):
        self._stored: dict[str, str] = {}
        defaults = MagicMock()
        defaults.set_user_default = lambda key, value, user=None, parenttype=None: self._stored.__setitem__(
            key, value
        )
        defaults.get_user_default = lambda key, user=None: self._stored.get(key)
        frappe_mock.defaults = defaults
        frappe_mock.session.user = "editor@test.local"
        es.frappe = frappe_mock

    def test_get_returns_empty_when_unset(self):
        self.assertEqual(es.get_last_editor_theme(desk=False), "")
        self.assertEqual(es.get_last_editor_theme(desk=True), "")

    def test_web_and_desk_keys_are_independent(self):
        es.set_last_editor_theme("Ocean", desk=False)
        es.set_last_editor_theme("Desk Blue", desk=True)
        self.assertEqual(es.get_last_editor_theme(desk=False), "Ocean")
        self.assertEqual(es.get_last_editor_theme(desk=True), "Desk Blue")
        self.assertEqual(self._stored[es.WEB_EDITOR_THEME_KEY], "Ocean")
        self.assertEqual(self._stored[es.DESK_EDITOR_THEME_KEY], "Desk Blue")

    def test_set_ignores_blank_name(self):
        es.set_last_editor_theme("  ", desk=False)
        es.set_last_editor_theme("", desk=True)
        self.assertEqual(self._stored, {})

    def test_set_strips_whitespace(self):
        es.set_last_editor_theme("  Coral  ", desk=False)
        self.assertEqual(es.get_last_editor_theme(desk=False), "Coral")


if __name__ == "__main__":
    unittest.main()
