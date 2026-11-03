"""Tests for site base desk theme in theme app gate responses."""
from __future__ import annotations

import importlib
import sys
import unittest
from unittest.mock import patch

from themes.tests.frappe_stub import install_frappe_stub

install_frappe_stub()

from themes.component_api import _desk_theme_choice  # noqa: E402


def _identity_whitelist(*args, **kwargs):
	if args and callable(args[0]) and not kwargs:
		return args[0]

	def decorator(fn):
		return fn

	return decorator


class TestDeskThemeChoice(unittest.TestCase):
	def test_returns_name_and_theme_name_when_configured(self):
		with patch(
			"themes.utils.site_theme_config_helpers.get_site_base_desk_theme_name",
			return_value="Corporate Desk",
		), patch("themes.component_api.frappe") as frappe_mock:
			frappe_mock.db.get_value.return_value = "Corporate"
			result = _desk_theme_choice()
		self.assertEqual(result, {"name": "Corporate Desk", "theme_name": "Corporate"})

	def test_returns_empty_when_no_base_desk_theme(self):
		with patch(
			"themes.utils.site_theme_config_helpers.get_site_base_desk_theme_name",
			return_value=None,
		):
			result = _desk_theme_choice()
		self.assertEqual(result, {"name": "", "theme_name": ""})

	def test_returns_empty_when_base_name_is_blank(self):
		with patch(
			"themes.utils.site_theme_config_helpers.get_site_base_desk_theme_name",
			return_value="   ",
		):
			result = _desk_theme_choice()
		self.assertEqual(result, {"name": "", "theme_name": ""})

	def test_returns_empty_when_desk_theme_lookup_missing(self):
		with patch(
			"themes.utils.site_theme_config_helpers.get_site_base_desk_theme_name",
			return_value="Missing Doc",
		), patch("themes.component_api.frappe") as frappe_mock:
			frappe_mock.db.get_value.return_value = None
			result = _desk_theme_choice()
		self.assertEqual(result, {"name": "", "theme_name": ""})

	def test_returns_empty_on_lookup_exception(self):
		with patch(
			"themes.utils.site_theme_config_helpers.get_site_base_desk_theme_name",
			return_value="Corporate Desk",
		), patch("themes.component_api.frappe") as frappe_mock:
			frappe_mock.db.get_value.side_effect = RuntimeError("db down")
			result = _desk_theme_choice()
		self.assertEqual(result, {"name": "", "theme_name": ""})

	def test_returns_empty_on_config_helper_exception(self):
		with patch(
			"themes.utils.site_theme_config_helpers.get_site_base_desk_theme_name",
			side_effect=RuntimeError("config unavailable"),
		):
			result = _desk_theme_choice()
		self.assertEqual(result, {"name": "", "theme_name": ""})

	def test_get_theme_app_gate_includes_desk_theme(self):
		sys.modules["frappe"].whitelist = _identity_whitelist
		component_api = importlib.reload(importlib.import_module("themes.component_api"))
		with patch("themes.component_api.theme_off_apps", return_value=set()), patch(
			"themes.component_api.bridge_apps",
			return_value=set(),
		), patch("themes.component_api.frappe") as frappe_mock, patch(
			"themes.component_api._route_prefixes_for_app",
			return_value=[],
		), patch(
			"themes.utils.css_publish.read_published_css_hash",
			return_value="",
		), patch("themes.component_api.theme_app_slugs", return_value={}), patch(
			"themes.component_api._active_theme_choices",
			return_value=[],
		), patch(
			"themes.component_api._desk_theme_choice",
			return_value={"name": "Base", "theme_name": "Base Label"},
		):
			frappe_mock.get_installed_apps.return_value = []
			gate = component_api.get_theme_app_gate()
		self.assertEqual(gate["desk_theme"], {"name": "Base", "theme_name": "Base Label"})


if __name__ == "__main__":
	unittest.main()
