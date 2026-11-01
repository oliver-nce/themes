"""Unit tests for themes.utils.component_scan."""
from __future__ import annotations

import re
import tempfile
import unittest
from pathlib import Path

from themes.utils.component_scan import (
	inherit_table_usage,
	iter_vue_files,
	mark_roots,
	scan_vue_file,
	scan_vue_source,
)

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "vue"


class TestComponentScan(unittest.TestCase):
	def test_static_theme(self) -> None:
		result = scan_vue_file(FIXTURES / "static_theme.vue")
		keys = [e["element_key"] for e in result["elements"]]
		self.assertEqual(keys, ["card", "card-title"])
		by_key = {e["element_key"]: e for e in result["elements"]}
		self.assertEqual(by_key["card"]["source_classes"], "theme-bg-surface theme-rounded")
		self.assertEqual(by_key["card"]["is_dynamic"], 0)
		self.assertEqual(result["purpose"], "Shows a card.")

	def test_dynamic_float(self) -> None:
		result = scan_vue_file(FIXTURES / "dynamic_float.vue")
		keys = [e["element_key"] for e in result["elements"]]
		self.assertIn("ppv2-float", keys)
		self.assertIn("ppv2-float-footer", keys)
		self.assertNotIn("ppv2-float-header", keys)
		self.assertTrue(any(re.match(r"^span@L\d+$", k) for k in keys))
		footer = next(e for e in result["elements"] if e["element_key"] == "ppv2-float-footer")
		self.assertEqual(footer["is_dynamic"], 1)
		self.assertTrue(footer["binding"].startswith(":class="))
		self.assertEqual(result["uses_components"], ["PanelHeaderToolbar"])

	def test_no_selector(self) -> None:
		result = scan_vue_file(FIXTURES / "no_selector.vue")
		keys = [e["element_key"] for e in result["elements"]]
		self.assertRegex(keys[0], r"^div@L\d+$")
		first = result["elements"][0]
		self.assertEqual(first["selector_class"], "")
		row_keys = [k for k in keys if k == "row" or k.startswith("row#")]
		self.assertEqual(sorted(row_keys, key=lambda k: (k != "row", k)), ["row", "row#2"])

	def test_nested_templates(self) -> None:
		result = scan_vue_file(FIXTURES / "nested_templates.vue")
		by_key = {e["element_key"]: e for e in result["elements"]}
		self.assertIn("badge", by_key)
		self.assertEqual(by_key["tbl"]["tag"], "panel-table")
		self.assertIn("fd-select", by_key)
		self.assertEqual(result["uses_components"], ["PanelTable"])

	def test_with_purpose(self) -> None:
		result = scan_vue_file(FIXTURES / "with_purpose.vue")
		self.assertEqual(result["purpose"], "Renders individual form fields.")

	def test_no_template(self) -> None:
		result = scan_vue_file(FIXTURES / "no_template.vue")
		self.assertEqual(result["elements"], [])
		self.assertEqual(result["uses_components"], [])

	def test_card_line_number(self) -> None:
		path = FIXTURES / "static_theme.vue"
		source = path.read_text(encoding="utf-8")
		expected_line = None
		for i, line in enumerate(source.splitlines(), start=1):
			if '<div class="card' in line:
				expected_line = i
				break
		self.assertIsNotNone(expected_line)
		result = scan_vue_file(path)
		card = next(e for e in result["elements"] if e["element_key"] == "card")
		self.assertEqual(card["line"], expected_line)

	def test_iter_vue_files(self) -> None:
		with tempfile.TemporaryDirectory() as tmp:
			root = Path(tmp)
			(root / "a.vue").write_text("<template></template>", encoding="utf-8")
			(root / "a.vue.bak").write_text("", encoding="utf-8")
			(root / "node_modules").mkdir()
			(root / "node_modules" / "b.vue").write_text("", encoding="utf-8")
			(root / "dist").mkdir()
			(root / "dist" / "c.vue").write_text("", encoding="utf-8")
			(root / "sub").mkdir()
			(root / "sub" / "d.vue").write_text("<template></template>", encoding="utf-8")
			found = iter_vue_files(root)
			self.assertEqual(found, sorted([root / "a.vue", root / "sub" / "d.vue"], key=str))

	def test_table_with_selector(self) -> None:
		source = """<template>
<div class="wrap">
  <table class="ppv2-table theme-table"></table>
</div>
</template>"""
		result = scan_vue_source(source)
		self.assertEqual(result["has_table"], 1)
		self.assertEqual(result["owns_table"], 1)
		self.assertEqual(result["table_selector"], "ppv2-table")
		self.assertEqual(result["root_class"], "wrap")
		self.assertEqual(result["table_scope_class"], "")

	def test_no_table(self) -> None:
		source = """<template><div class="wrap"></div></template>"""
		result = scan_vue_source(source)
		self.assertEqual(result["has_table"], 0)
		self.assertEqual(result["owns_table"], 0)
		self.assertEqual(result["table_selector"], "")

	def test_table_theme_only_class(self) -> None:
		source = """<template><table class="theme-table"></table></template>"""
		result = scan_vue_source(source)
		self.assertEqual(result["has_table"], 1)
		self.assertEqual(result["table_selector"], "")

	def test_inherit_table_usage_direct(self) -> None:
		scans = [
			{
				"app": "nce",
				"component_name": "Parent",
				"owns_table": 0,
				"root_class": "wrap",
				"uses_components": ["PanelTable"],
				"has_table": 0,
				"table_selector": "",
				"table_scope_class": "",
			},
			{
				"app": "nce",
				"component_name": "PanelTable",
				"owns_table": 1,
				"has_table": 1,
				"table_selector": "ppv2-table",
				"root_class": "",
				"uses_components": [],
				"table_scope_class": "",
			},
		]
		inherit_table_usage(scans)
		parent = scans[0]
		child = scans[1]
		self.assertEqual(parent["has_table"], 1)
		self.assertEqual(parent["table_selector"], "ppv2-table")
		self.assertEqual(parent["table_scope_class"], "wrap")
		self.assertEqual(child["table_selector"], "ppv2-table")

	def test_inherit_table_usage_chain(self) -> None:
		scans = [
			{
				"app": "nce",
				"component_name": "A",
				"owns_table": 0,
				"root_class": "root-a",
				"uses_components": ["B"],
				"has_table": 0,
				"table_selector": "",
				"table_scope_class": "",
			},
			{
				"app": "nce",
				"component_name": "B",
				"owns_table": 0,
				"root_class": "root-b",
				"uses_components": ["C"],
				"has_table": 0,
				"table_selector": "",
				"table_scope_class": "",
			},
			{
				"app": "nce",
				"component_name": "C",
				"owns_table": 1,
				"has_table": 1,
				"table_selector": "ppv2-table",
				"root_class": "",
				"uses_components": [],
				"table_scope_class": "",
			},
		]
		inherit_table_usage(scans)
		self.assertEqual(scans[0]["table_selector"], "ppv2-table")
		self.assertEqual(scans[0]["table_scope_class"], "root-a")
		self.assertEqual(scans[1]["table_selector"], "ppv2-table")
		self.assertEqual(scans[1]["table_scope_class"], "root-b")

	def test_inherit_does_not_overwrite_owner(self) -> None:
		scans = [
			{
				"app": "nce",
				"component_name": "Owner",
				"owns_table": 1,
				"has_table": 1,
				"table_selector": "mine-table",
				"root_class": "mine",
				"uses_components": ["OtherTable"],
				"table_scope_class": "",
			},
			{
				"app": "nce",
				"component_name": "OtherTable",
				"owns_table": 1,
				"has_table": 1,
				"table_selector": "other-table",
				"root_class": "",
				"uses_components": [],
				"table_scope_class": "",
			},
		]
		inherit_table_usage(scans)
		self.assertEqual(scans[0]["table_selector"], "mine-table")

	def test_mark_roots_chain(self) -> None:
		scans = [
			{"app": "nce", "component_name": "A", "uses_components": ["B"]},
			{"app": "nce", "component_name": "B", "uses_components": ["C"]},
			{"app": "nce", "component_name": "C", "uses_components": []},
		]
		mark_roots(scans)
		by_name = {s["component_name"]: s for s in scans}
		self.assertEqual(by_name["A"]["is_root"], 1)
		self.assertEqual(by_name["B"]["is_root"], 1)
		self.assertEqual(by_name["C"]["is_root"], 0)

	def test_mark_roots_shared_child(self) -> None:
		scans = [
			{"app": "nce", "component_name": "A", "uses_components": ["B"]},
			{"app": "nce", "component_name": "D", "uses_components": ["B"]},
			{"app": "nce", "component_name": "B", "uses_components": []},
		]
		mark_roots(scans)
		by_name = {s["component_name"]: s for s in scans}
		self.assertEqual(by_name["A"]["is_root"], 1)
		self.assertEqual(by_name["D"]["is_root"], 1)
		self.assertEqual(by_name["B"]["is_root"], 0)

	def test_mark_roots_cross_app(self) -> None:
		scans = [
			{"app": "nce", "component_name": "App", "uses_components": ["Panel"]},
			{"app": "nce", "component_name": "Panel", "uses_components": []},
			{"app": "other", "component_name": "Panel", "uses_components": []},
		]
		mark_roots(scans)
		by_key = {(s["app"], s["component_name"]): s for s in scans}
		self.assertEqual(by_key[("other", "Panel")]["is_root"], 1)
		self.assertEqual(by_key[("nce", "Panel")]["is_root"], 0)

	def test_mark_roots_newline_uses(self) -> None:
		scans = [
			{"app": "nce", "component_name": "Parent", "uses_components": "Foo\nBar"},
			{"app": "nce", "component_name": "Foo", "uses_components": []},
			{"app": "nce", "component_name": "Bar", "uses_components": []},
		]
		mark_roots(scans)
		by_name = {s["component_name"]: s for s in scans}
		self.assertEqual(by_name["Parent"]["is_root"], 1)
		self.assertEqual(by_name["Foo"]["is_root"], 0)
		self.assertEqual(by_name["Bar"]["is_root"], 0)

	def test_mark_roots_isolated(self) -> None:
		scans = [
			{"app": "nce", "component_name": "One", "uses_components": []},
			{"app": "nce", "component_name": "Two", "uses_components": []},
		]
		mark_roots(scans)
		self.assertEqual(scans[0]["is_root"], 1)
		self.assertEqual(scans[1]["is_root"], 1)

	def test_mark_roots_unscanned_child_is_not_a_parent(self) -> None:
		scans = [
			{"app": "nce", "component_name": "Page", "uses_components": ["Toolbar"]},
			{"app": "nce", "component_name": "Toolbar", "uses_components": ["FeatherIcon"]},
		]
		mark_roots(scans)
		by_name = {s["component_name"]: s for s in scans}
		self.assertEqual(by_name["Page"]["is_root"], 1)
		self.assertEqual(by_name["Toolbar"]["is_root"], 0)


class TestThemeTableTargets(unittest.TestCase):
	def test_classed_table(self) -> None:
		source = """<template><div class="acme-panel"><table class="acme-grid"></table></div></template>"""
		result = scan_vue_source(source)
		self.assertEqual(result["theme_table_targets"], ["class:acme-grid"])

	def test_theme_table_class_excluded(self) -> None:
		source = """<template><div class="acme-panel"><table class="acme-grid theme-table"></table></div></template>"""
		result = scan_vue_source(source)
		self.assertEqual(result["theme_table_targets"], [])

	def test_unclassed_table_scope(self) -> None:
		source = """<template><div class="acme-panel"><table></table></div></template>"""
		result = scan_vue_source(source)
		self.assertEqual(result["theme_table_targets"], ["scope:acme-panel"])

	def test_generic_table_classes_scope(self) -> None:
		source = """<template><div class="acme-panel"><table class="table table-bordered"></table></div></template>"""
		result = scan_vue_source(source)
		self.assertEqual(result["theme_table_targets"], ["scope:acme-panel"])

	def test_two_classed_tables(self) -> None:
		source = """<template>
<div class="wrap">
  <table class="a-tbl"></table>
  <table class="b-tbl"></table>
</div>
</template>"""
		result = scan_vue_source(source)
		self.assertEqual(result["theme_table_targets"], ["class:a-tbl", "class:b-tbl"])


if __name__ == "__main__":
	unittest.main()
