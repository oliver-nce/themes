"""Unit tests for themes.utils.component_sync."""
from __future__ import annotations

import unittest

from themes.utils.component_sync import (
	has_override,
	merge_elements,
	needs_attention,
	normalise_groups,
)


class TestComponentSync(unittest.TestCase):
	def test_new_row_empty_overrides(self) -> None:
		existing: list[dict] = []
		scanned = [{
			"element_key": "card",
			"tag": "div",
			"line": 5,
			"selector_class": "card",
			"source_classes": "theme-bg-primary",
			"binding": "",
			"is_dynamic": 0,
		}]
		result = merge_elements(existing, scanned)
		self.assertEqual(len(result), 1)
		row = result[0]
		self.assertEqual(row["override_bg_class"], "")
		self.assertEqual(row["keep_default"], 0)
		self.assertFalse(has_override(row))

	def test_existing_keeps_overrides_after_rescan(self) -> None:
		existing = [{
			"element_key": "card",
			"tag": "div",
			"line": 3,
			"selector_class": "card",
			"scanned_selector": "card",
			"source_classes": "old",
			"binding": "",
			"is_dynamic": 0,
			"element_status": "Present",
			"keep_default": 0,
			"override_bg_class": "theme-bg-primary-300",
			"override_fg_type": "mono",
			"override_text_class": "",
			"override_border_width_class": "",
			"override_border_color_class": "",
		}]
		scanned = [{
			"element_key": "card",
			"tag": "div",
			"line": 10,
			"selector_class": "card",
			"source_classes": "theme-bg-surface",
			"binding": "",
			"is_dynamic": 0,
		}]
		result = merge_elements(existing, scanned)
		row = result[0]
		self.assertEqual(row["override_bg_class"], "theme-bg-primary-300")
		self.assertEqual(row["line"], 10)
		self.assertEqual(row["source_classes"], "theme-bg-surface")

	def test_edited_selector_survives_rescan(self) -> None:
		existing = [{
			"element_key": "card",
			"tag": "div",
			"line": 5,
			"selector_class": "my-card",
			"scanned_selector": "card",
			"source_classes": "",
			"binding": "",
			"is_dynamic": 0,
			"element_status": "Present",
			"keep_default": 0,
			"override_bg_class": "",
			"override_fg_type": "",
			"override_text_class": "",
			"override_border_width_class": "",
			"override_border_color_class": "",
		}]
		scanned = [{
			"element_key": "card",
			"tag": "div",
			"line": 8,
			"selector_class": "card",
			"source_classes": "",
			"binding": "",
			"is_dynamic": 0,
		}]
		result = merge_elements(existing, scanned)
		row = result[0]
		self.assertEqual(row["selector_class"], "my-card")
		self.assertEqual(row["scanned_selector"], "card")

	def test_vanished_row_missing_last(self) -> None:
		existing = [
			{
				"element_key": "card",
				"tag": "div",
				"line": 5,
				"selector_class": "card",
				"scanned_selector": "card",
				"source_classes": "",
				"binding": "",
				"is_dynamic": 0,
				"element_status": "Present",
				"keep_default": 0,
				"override_bg_class": "",
				"override_fg_type": "",
				"override_text_class": "",
				"override_border_width_class": "",
				"override_border_color_class": "",
			},
			{
				"element_key": "gone",
				"tag": "span",
				"line": 20,
				"selector_class": "gone",
				"scanned_selector": "gone",
				"source_classes": "",
				"binding": "",
				"is_dynamic": 0,
				"element_status": "Present",
				"keep_default": 0,
				"override_bg_class": "theme-bg-danger-500",
				"override_fg_type": "",
				"override_text_class": "",
				"override_border_width_class": "",
				"override_border_color_class": "",
			},
		]
		scanned = [{
			"element_key": "card",
			"tag": "div",
			"line": 5,
			"selector_class": "card",
			"source_classes": "",
			"binding": "",
			"is_dynamic": 0,
		}]
		result = merge_elements(existing, scanned)
		self.assertEqual(result[0]["element_key"], "card")
		self.assertEqual(result[1]["element_key"], "gone")
		self.assertEqual(result[1]["element_status"], "Missing")
		self.assertEqual(result[1]["override_bg_class"], "theme-bg-danger-500")

	def test_new_row_inherits_group_overrides(self) -> None:
		existing = [{
			"element_key": "card",
			"tag": "div",
			"line": 5,
			"selector_class": "shared",
			"scanned_selector": "shared",
			"source_classes": "",
			"binding": "",
			"is_dynamic": 0,
			"element_status": "Present",
			"keep_default": 0,
			"override_bg_class": "theme-bg-primary-500",
			"override_fg_type": "tonal",
			"override_text_class": "",
			"override_border_width_class": "",
			"override_border_color_class": "",
		}]
		scanned = [
			{
				"element_key": "card",
				"tag": "div",
				"line": 5,
				"selector_class": "shared",
				"source_classes": "",
				"binding": "",
				"is_dynamic": 0,
			},
			{
				"element_key": "card-inner",
				"tag": "div",
				"line": 12,
				"selector_class": "shared",
				"source_classes": "",
				"binding": "",
				"is_dynamic": 0,
			},
		]
		result = merge_elements(existing, scanned)
		new_row = next(r for r in result if r["element_key"] == "card-inner")
		self.assertEqual(new_row["override_bg_class"], "theme-bg-primary-500")
		self.assertEqual(new_row["override_fg_type"], "tonal")

	def test_normalise_groups_copies_first_row(self) -> None:
		rows = [
			{
				"element_key": "b",
				"selector_class": "grp",
				"line": 5,
				"element_status": "Present",
				"keep_default": 0,
				"override_bg_class": "theme-bg-primary-100",
				"override_fg_type": "tonal",
				"override_text_class": "",
				"override_border_width_class": "",
				"override_border_color_class": "",
			},
			{
				"element_key": "a",
				"selector_class": "grp",
				"line": 10,
				"element_status": "Present",
				"keep_default": 1,
				"override_bg_class": "",
				"override_fg_type": "",
				"override_text_class": "",
				"override_border_width_class": "",
				"override_border_color_class": "",
			},
		]
		result = normalise_groups(rows)
		self.assertEqual(result[0]["override_bg_class"], "theme-bg-primary-100")
		self.assertEqual(result[1]["override_bg_class"], "theme-bg-primary-100")
		self.assertEqual(result[1]["keep_default"], 0)
		self.assertEqual(result[1]["override_fg_type"], "tonal")

	def test_needs_attention_all_keep_default(self) -> None:
		rows = [{
			"element_status": "Present",
			"selector_class": "card",
			"keep_default": 1,
			"override_bg_class": "",
			"override_fg_type": "",
			"override_text_class": "",
			"override_border_width_class": "",
			"override_border_color_class": "",
		}]
		self.assertFalse(needs_attention(rows, "Present"))

	def test_needs_attention_untouched_row(self) -> None:
		rows = [{
			"element_status": "Present",
			"selector_class": "card",
			"keep_default": 0,
			"override_bg_class": "",
			"override_fg_type": "",
			"override_text_class": "",
			"override_border_width_class": "",
			"override_border_color_class": "",
		}]
		self.assertTrue(needs_attention(rows, "Present"))

	def test_needs_attention_empty_selector_with_keep_default(self) -> None:
		rows = [{
			"element_status": "Present",
			"selector_class": "",
			"keep_default": 1,
			"override_bg_class": "",
			"override_fg_type": "",
			"override_text_class": "",
			"override_border_width_class": "",
			"override_border_color_class": "",
		}]
		self.assertTrue(needs_attention(rows, "Present"))

	def test_needs_attention_file_missing(self) -> None:
		self.assertTrue(needs_attention([], "Missing"))

	def test_needs_attention_only_missing_rows(self) -> None:
		rows = [{
			"element_status": "Missing",
			"selector_class": "",
			"keep_default": 0,
			"override_bg_class": "",
			"override_fg_type": "",
			"override_text_class": "",
			"override_border_width_class": "",
			"override_border_color_class": "",
		}]
		self.assertFalse(needs_attention(rows, "Present"))


if __name__ == "__main__":
	unittest.main()
