"""Unit tests for themes.utils.design_mode."""
from __future__ import annotations

import unittest

from themes.utils.design_mode import (
	build_selector_map,
	build_table_map,
	clean_table_values,
	parse_protected,
)


def _row(**kwargs: object) -> dict:
	base = {
		"parent": "",
		"component_name": "",
		"app": "",
		"file_path": "",
		"selector_class": "",
		"tag": "",
		"line": 0,
		"is_dynamic": 0,
		"override_bg_class": "",
		"override_fg_type": "",
		"override_text_class": "",
		"override_border_width_class": "",
		"override_border_color_class": "",
		"keep_default": 0,
	}
	base.update(kwargs)
	return base


class TestDesignMode(unittest.TestCase):
	def test_parse_protected(self) -> None:
		self.assertEqual(parse_protected(" a\n\nb \n"), {"a", "b"})
		self.assertEqual(parse_protected(None), set())

	def test_build_selector_map_groups_and_sorts(self) -> None:
		rows = [
			_row(
				parent="P1",
				component_name="Beta",
				line=5,
				selector_class="x",
				override_bg_class="theme-bg-primary",
			),
			_row(
				parent="P2",
				component_name="Alpha",
				line=9,
				selector_class="x",
				override_bg_class="theme-bg-accent",
				override_fg_type="tonal",
				tag="div",
			),
			_row(parent="P3", selector_class=""),
			_row(parent="P4", selector_class="1bad"),
		]
		result = build_selector_map(rows, set())
		self.assertEqual(list(result.keys()), ["x"])
		entry = result["x"]
		self.assertEqual([c["name"] for c in entry["components"]], ["P2", "P1"])
		self.assertEqual(entry["values"]["override_bg_class"], "theme-bg-accent")
		self.assertEqual(entry["values"]["override_fg_type"], "tonal")
		self.assertEqual(entry["tag"], "div")

	def test_build_selector_map_protected_and_dynamic(self) -> None:
		rows = [
			_row(
				parent="P1",
				component_name="Alpha",
				line=1,
				selector_class="x",
				is_dynamic=1,
			),
		]
		result = build_selector_map(rows, {"x"})
		entry = result["x"]
		self.assertEqual(entry["protected"], 1)
		self.assertEqual(entry["is_dynamic"], 1)

	def test_build_table_map_groups_and_mono_default(self) -> None:
		rows = [
			{"name": "B1", "component_name": "Beta", "table_selector": "t1"},
			{"name": "A1", "component_name": "Alpha", "table_selector": "t1"},
			{"name": "G1", "component_name": "Gamma", "table_selector": ""},
		]
		result = build_table_map(rows)
		self.assertEqual(list(result.keys()), ["t1"])
		self.assertEqual(result["t1"]["name"], "A1")
		for f in ("table_header_fg_type", "table_row_fg_type", "table_row_alt_fg_type"):
			self.assertEqual(result["t1"]["values"][f], "mono")

	def test_build_table_map_skips_bad_selector(self) -> None:
		rows = [{"name": "X1", "component_name": "Alpha", "table_selector": "1bad"}]
		self.assertEqual(build_table_map(rows), {})

	def test_clean_table_values(self) -> None:
		out = clean_table_values({
			"table_row_bg_class": " theme-bg-primary-100 ",
			"table_row_fg_type": "",
			"junk": "x",
		})
		self.assertEqual(out, {
			"table_row_bg_class": "theme-bg-primary-100",
			"table_row_fg_type": "mono",
		})

	def test_clean_table_values_none(self) -> None:
		self.assertEqual(clean_table_values(None), {})
