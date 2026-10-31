"""Unit tests for themes.utils.component_css_writer."""
from __future__ import annotations

import unittest

from themes.utils.component_css_writer import HEADER, declarations_for, generate_component_css, table_css_for


def _row(**kwargs: object) -> dict:
	base = {
		"component_name": "TestComp",
		"element_key": "el",
		"selector_class": "card",
		"line": 1,
		"element_status": "Present",
		"keep_default": 0,
		"override_bg_class": "",
		"override_fg_type": "",
		"override_text_class": "",
		"override_border_width_class": "",
		"override_border_color_class": "",
	}
	base.update(kwargs)
	return base


class TestComponentCssWriter(unittest.TestCase):
	def test_bg_mono(self) -> None:
		decls = declarations_for(_row(
			override_bg_class="theme-bg-primary-300",
			override_fg_type="mono",
		))
		self.assertIn("background-color: var(--nce-color-primary-300);", decls)
		self.assertIn("color: var(--nce-color-primary-300-fg);", decls)

	def test_bg_tonal(self) -> None:
		decls = declarations_for(_row(
			override_bg_class="theme-bg-primary-300",
			override_fg_type="tonal",
		))
		self.assertIn("color: var(--nce-color-primary-300-fg-tonal);", decls)

	def test_bg_primary_no_shade(self) -> None:
		decls = declarations_for(_row(
			override_bg_class="theme-bg-primary",
			override_fg_type="mono",
		))
		self.assertIn("background-color: var(--nce-color-primary);", decls)
		self.assertIn("color: var(--nce-color-primary-fg);", decls)

	def test_text_replaces_bg_color(self) -> None:
		decls = declarations_for(_row(
			override_bg_class="theme-bg-primary-300",
			override_fg_type="mono",
			override_text_class="theme-text-primary-300-fg",
		))
		color_lines = [d for d in decls if d.startswith("color:")]
		self.assertEqual(len(color_lines), 1)
		self.assertEqual(color_lines[0], "color: var(--nce-color-primary-300-fg);")

	def test_border_width_and_colour(self) -> None:
		decls = declarations_for(_row(
			override_border_width_class="theme-border-strong",
			override_border_color_class="theme-border-primary-500",
		))
		self.assertIn("border-style: solid;", decls)
		self.assertIn("border-width: var(--nce-border-width-strong);", decls)
		self.assertIn("border-color: var(--nce-color-primary-500);", decls)

	def test_keep_default_skipped(self) -> None:
		css = generate_component_css([_row(
			keep_default=1,
			override_bg_class="theme-bg-primary",
		)])
		self.assertEqual(css, HEADER)

	def test_missing_skipped(self) -> None:
		css = generate_component_css([_row(
			element_status="Missing",
			override_bg_class="theme-bg-primary",
		)])
		self.assertEqual(css, HEADER)

	def test_bad_selector_skipped(self) -> None:
		css = generate_component_css([_row(
			selector_class="my class",
			override_bg_class="theme-bg-primary",
		)])
		self.assertEqual(css, HEADER)

	def test_invalid_bg_class_emits_nothing(self) -> None:
		decls = declarations_for(_row(override_bg_class="theme-bg-pink-300"))
		self.assertEqual(decls, [])
		css = generate_component_css([_row(override_bg_class="theme-bg-pink-300")])
		self.assertEqual(css, HEADER)

	def test_two_rows_same_selector_one_rule(self) -> None:
		rows = [
			_row(line=10, override_bg_class="theme-bg-primary"),
			_row(line=3, override_bg_class="theme-bg-secondary"),
		]
		css = generate_component_css(rows)
		self.assertEqual(css.count(" › "), 1)
		self.assertIn("secondary", css)

	def test_same_input_twice_equal(self) -> None:
		rows = [_row(override_bg_class="theme-bg-primary-500", override_fg_type="mono")]
		a = generate_component_css(rows)
		b = generate_component_css(rows)
		self.assertEqual(a, b)

	def test_empty_input_header_only(self) -> None:
		self.assertEqual(generate_component_css([]), HEADER)

	def test_selector_tripled(self) -> None:
		css = generate_component_css([_row(
			selector_class="card",
			override_bg_class="theme-bg-primary",
		)])
		self.assertIn(".card.card.card {", css)


def _parent(**kwargs: object) -> dict:
	base = {
		"status": "Present",
		"component_name": "TestComp",
		"has_table": 1,
		"table_selector": "ppv2-table",
		"table_scope_class": "",
		"table_header_bg_class": "",
		"table_header_fg_type": "mono",
		"table_row_bg_class": "",
		"table_row_fg_type": "mono",
		"table_row_alt_bg_class": "",
		"table_row_alt_fg_type": "mono",
		"table_header_line_class": "",
		"table_header_line_color_class": "",
		"table_row_divider_class": "",
		"table_row_divider_color_class": "",
		"table_col_divider_class": "",
		"table_col_divider_color_class": "",
	}
	base.update(kwargs)
	return base


class TestTableCssWriter(unittest.TestCase):
	def test_table_header_bg_mono(self) -> None:
		css = table_css_for(_parent(
			table_header_bg_class="theme-bg-primary-800",
			table_header_fg_type="mono",
		))
		self.assertIn(".ppv2-table.ppv2-table.ppv2-table thead th", css)
		self.assertIn("background-color: var(--nce-color-primary-800);", css)
		self.assertIn("color: var(--nce-color-primary-800-fg);", css)

	def test_table_header_bg_tonal(self) -> None:
		css = table_css_for(_parent(
			table_header_bg_class="theme-bg-primary-800",
			table_header_fg_type="tonal",
		))
		self.assertIn("color: var(--nce-color-primary-800-fg-tonal);", css)

	def test_table_row_even(self) -> None:
		css = table_css_for(_parent(table_row_bg_class="theme-bg-primary-100"))
		self.assertIn("tbody tr:nth-child(even)", css)

	def test_table_row_odd(self) -> None:
		css = table_css_for(_parent(table_row_alt_bg_class="theme-bg-primary-200"))
		self.assertIn("tbody tr:nth-child(odd)", css)

	def test_table_scope_prefix(self) -> None:
		css = table_css_for(_parent(
			table_scope_class="wrap",
			table_header_bg_class="theme-bg-primary-800",
		))
		self.assertIn(".wrap.wrap.wrap .ppv2-table", css)

	def test_empty_colours_no_css(self) -> None:
		self.assertEqual(table_css_for(_parent()), "")

	def test_bad_bg_class_ignored(self) -> None:
		css = table_css_for(_parent(table_header_bg_class="nope"))
		self.assertNotIn("background-color", css)

	def test_row_divider_width_and_colour(self) -> None:
		css = table_css_for(_parent(
			table_row_divider_class="theme-border-strong",
			table_row_divider_color_class="theme-border-primary-500",
		))
		self.assertIn(
			"border-bottom: var(--nce-border-width-strong) solid var(--nce-color-primary-500);",
			css,
		)
		self.assertIn(".ppv2-table.ppv2-table.ppv2-table td", css)

	def test_row_divider_width_only_default_colour(self) -> None:
		css = table_css_for(_parent(table_row_divider_class="theme-border"))
		self.assertIn(
			"border-bottom: var(--nce-border-width) solid var(--nce-color-table-row-divider);",
			css,
		)

	def test_col_divider_last_child_reset(self) -> None:
		css = table_css_for(_parent(
			table_col_divider_class="theme-border",
			table_col_divider_color_class="theme-border-primary-500",
		))
		self.assertIn("border-right: none", css)
		self.assertIn("th:last-child", css)


if __name__ == "__main__":
	unittest.main()
