"""Unit tests for themes.utils.component_scan."""
from __future__ import annotations

import re
import tempfile
import unittest
from pathlib import Path

from themes.utils.component_scan import iter_vue_files, scan_vue_file

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


if __name__ == "__main__":
	unittest.main()
