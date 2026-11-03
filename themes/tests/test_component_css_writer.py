"""Unit tests for themes.utils.component_css_writer."""
from __future__ import annotations

import unittest

from themes.utils.component_css_writer import (
	HEADER,
	_important,
	declarations_for,
	generate_component_css,
	instance_rule_blocks,
	theme_button_rules,
	table_css_for,
	theme_table_bundle_for,
)


def _row(**kwargs: object) -> dict:
	base = {
		"component_name": "TestComp",
		"element_key": "el",
		"selector_class": "card",
		"line": 1,
		"element_status": "Present",
		"keep_default": 0,
		"override_important": 0,
		"override_bg_class": "",
		"override_fg_type": "",
		"override_text_class": "",
		"override_border_width_class": "",
		"override_border_color_class": "",
		"override_button_size_class": "",
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

	def test_button_size_large(self) -> None:
		decls = declarations_for(_row(override_button_size_class="lg"))
		self.assertIn("font-size: var(--nce-btn-lg-font-size);", decls)
		self.assertIn(
			"padding: var(--nce-btn-lg-pad-y) var(--nce-btn-lg-pad-x);",
			decls,
		)
		self.assertIn("min-height: var(--nce-btn-lg-min-height);", decls)

	def test_button_size_medium_empty(self) -> None:
		decls = declarations_for(_row(override_button_size_class=""))
		size_lines = [d for d in decls if "nce-btn-" in d]
		self.assertEqual(size_lines, [])

	def test_button_size_legacy_class_names(self) -> None:
		decls = declarations_for(_row(override_button_size_class="theme-btn-sm"))
		self.assertIn("font-size: var(--nce-btn-sm-font-size);", decls)

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

	def test_override_important_on_component_css(self) -> None:
		css = generate_component_css([_row(
			override_important=1,
			override_bg_class="theme-bg-primary-500",
			override_fg_type="mono",
		)])
		for line in css.splitlines():
			stripped = line.strip()
			if stripped.endswith("{"):
				continue
			if stripped == "}" or stripped.startswith("/*"):
				continue
			self.assertIn("!important", stripped, msg=line)

	def test_override_important_off_component_css(self) -> None:
		css = generate_component_css([_row(
			override_important=0,
			override_bg_class="theme-bg-primary-500",
			override_fg_type="mono",
		)])
		self.assertNotIn("!important", css)


class TestImportantHelper(unittest.TestCase):
	def test_adds_before_semicolon(self) -> None:
		self.assertEqual(
			_important(["border-style: solid;"]),
			["border-style: solid !important;"],
		)

	def test_leaves_existing_important(self) -> None:
		decl = "color: red !important;"
		self.assertEqual(_important([decl]), [decl])

	def test_no_trailing_semicolon(self) -> None:
		self.assertEqual(_important(["color: red"]), ["color: red !important;"])


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
		self.assertIn(".ppv2-table tbody tr:nth-child(even)", css)
		self.assertNotIn(".ppv2-table.ppv2-table.ppv2-table tbody tr", css)

	def test_table_row_odd(self) -> None:
		css = table_css_for(_parent(table_row_alt_bg_class="theme-bg-primary-200"))
		self.assertIn(".ppv2-table tbody tr:nth-child(odd)", css)
		self.assertNotIn(".ppv2-table.ppv2-table.ppv2-table tbody tr", css)

	def test_table_row_scoped(self) -> None:
		css = table_css_for(_parent(
			table_scope_class="wrap",
			table_row_bg_class="theme-bg-primary-100",
		))
		self.assertIn(".wrap .ppv2-table tbody tr:nth-child(even)", css)

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


class TestThemeTableBundle(unittest.TestCase):
	def test_class_target(self) -> None:
		css = theme_table_bundle_for({
			"status": "Present",
			"component_name": "X",
			"theme_table_targets": "class:acme-grid",
		})
		self.assertIn(".acme-grid.acme-grid.acme-grid td {", css)
		self.assertIn(".acme-grid tbody tr:nth-child(even)", css)
		self.assertIn("var(--nce-border-width-table-row)", css)
		self.assertIn("var(--nce-color-table-col-divider)", css)

	def test_scope_target(self) -> None:
		css = theme_table_bundle_for({
			"status": "Present",
			"component_name": "X",
			"theme_table_targets": "scope:acme-panel",
		})
		self.assertIn(".acme-panel.acme-panel.acme-panel table td {", css)

	def test_invalid_lines_empty(self) -> None:
		css = theme_table_bundle_for({
			"status": "Present",
			"component_name": "X",
			"theme_table_targets": "class:\nweird:x",
		})
		self.assertEqual(css, "")

	def test_missing_status_empty(self) -> None:
		css = theme_table_bundle_for({
			"status": "Missing",
			"component_name": "X",
			"theme_table_targets": "class:acme-grid",
		})
		self.assertEqual(css, "")


class TestInstanceRuleBlocks(unittest.TestCase):
	def test_emits_block_when_keep_default_off(self) -> None:
		rec = {
			"instance_id": "abcdefgh1",
			"selector_class": "my-btn",
			"instance_style_overrides": '{"background":"theme-bg-primary-500"}',
		}
		merged = {"my-btn": {"selector_class": "my-btn", "keep_default": 0}}
		blocks = instance_rule_blocks([rec], merged)
		self.assertEqual(len(blocks), 1)
		self.assertIn('[data-nce-instance="abcdefgh1"]', blocks[0])

	def test_skips_when_keep_default_on(self) -> None:
		rec = {
			"instance_id": "abcdefgh1",
			"selector_class": "my-btn",
			"instance_style_overrides": '{"background":"theme-bg-primary-500"}',
		}
		merged = {"my-btn": {"selector_class": "my-btn", "keep_default": 1}}
		self.assertEqual(instance_rule_blocks([rec], merged), [])

	def test_empty_overrides_returns_no_blocks(self) -> None:
		rec = {
			"instance_id": "abcdefgh1",
			"selector_class": "my-btn",
			"instance_style_overrides": "{}",
		}
		merged = {"my-btn": {"selector_class": "my-btn", "keep_default": 0}}
		self.assertEqual(instance_rule_blocks([rec], merged), [])

	def test_instance_override_important_on(self) -> None:
		rec = {
			"instance_id": "abcdefgh1",
			"selector_class": "my-btn",
			"instance_style_overrides": '{"background":"theme-bg-primary-500"}',
		}
		merged = {
			"my-btn": {
				"selector_class": "my-btn",
				"keep_default": 0,
				"override_important": 1,
			},
		}
		blocks = instance_rule_blocks([rec], merged)
		self.assertEqual(len(blocks), 1)
		self.assertIn("!important", blocks[0])

	def test_instance_override_important_off(self) -> None:
		rec = {
			"instance_id": "abcdefgh1",
			"selector_class": "my-btn",
			"instance_style_overrides": '{"background":"theme-bg-primary-500"}',
		}
		merged = {
			"my-btn": {
				"selector_class": "my-btn",
				"keep_default": 0,
				"override_important": 0,
			},
		}
		blocks = instance_rule_blocks([rec], merged)
		self.assertEqual(len(blocks), 1)
		self.assertNotIn("!important", blocks[0])


class TestThemeButtonRules(unittest.TestCase):
	@classmethod
	def setUpClass(cls) -> None:
		from themes.utils.default_theme import DEFAULT_THEME_PAYLOAD
		from themes.utils.theme_color_utils import resolve_neutral_into_payload

		cls._default_payload = resolve_neutral_into_payload(dict(DEFAULT_THEME_PAYLOAD))

	def _theme(self, **payload_overrides: object) -> dict[str, dict]:
		payload = dict(self._default_payload)
		payload.update(payload_overrides)
		return {"a": {"slug": "ocean", "payload": payload}}

	def _button_row(self, **kwargs: object) -> dict:
		base = {
			"app": "a",
			"selector_class": "my-btn",
			"tag": "button",
			"source_classes": "",
			"element_status": "Present",
			"keep_default": 0,
			"component_name": "Comp",
		}
		base.update(kwargs)
		return base

	def test_button_tag_emits_full_theme_btn_rules(self) -> None:
		out = theme_button_rules([self._button_row()], self._theme())
		self.assertIn(':where([data-nce-theme="ocean"] .my-btn) {', out)
		self.assertIn("font-size: var(--nce-btn-md-font-size);", out)
		self.assertIn(':where([data-nce-theme="ocean"] .my-btn:hover:not(:disabled))', out)

	def test_outline_enabled_uses_transparent_fill(self) -> None:
		out = theme_button_rules(
			[self._button_row()],
			self._theme(button_outline_enabled=1),
		)
		self.assertIn("background-color: transparent;", out)
		self.assertNotIn("background-color: var(--nce-color-surface);", out)

	def test_outline_off_uses_surface_fill(self) -> None:
		out = theme_button_rules([self._button_row()], self._theme())
		self.assertIn("background-color: var(--nce-color-surface);", out)

	def test_non_button_div_without_theme_btn_class(self) -> None:
		out = theme_button_rules(
			[self._button_row(tag="div")],
			self._theme(),
		)
		self.assertEqual(out, "")

	def test_div_with_theme_btn_class_emits(self) -> None:
		out = theme_button_rules(
			[self._button_row(tag="div", source_classes="theme-btn-md theme-bg-card")],
			self._theme(),
		)
		self.assertIn(':where([data-nce-theme="ocean"] .my-btn) {', out)

	def test_keep_default_skips(self) -> None:
		self.assertEqual(
			theme_button_rules([self._button_row(keep_default=1)], self._theme()),
			"",
		)

	def test_override_important_does_not_affect_theme_buttons(self) -> None:
		out = theme_button_rules(
			[self._button_row(override_important=1)],
			self._theme(),
		)
		self.assertIn("font-size: var(--nce-btn-md-font-size);", out)
		self.assertNotIn("!important", out)

	def test_app_not_in_theme_by_app(self) -> None:
		self.assertEqual(
			theme_button_rules([self._button_row(app="other")], self._theme()),
			"",
		)

	def test_not_present_skips(self) -> None:
		self.assertEqual(
			theme_button_rules(
				[self._button_row(element_status="Missing")],
				self._theme(),
			),
			"",
		)

	def test_missing_element_status(self) -> None:
		row = self._button_row()
		del row["element_status"]
		self.assertEqual(theme_button_rules([row], self._theme()), "")

	def test_duplicate_selector_one_block(self) -> None:
		rows = [self._button_row(), self._button_row(component_name="Other")]
		out = theme_button_rules(rows, self._theme())
		self.assertEqual(out.count("theme buttons › ocean › my-btn"), 1)

	def test_every_rule_selector_uses_where(self) -> None:
		out = theme_button_rules([self._button_row()], self._theme())
		for line in out.splitlines():
			stripped = line.strip()
			if stripped.endswith("{"):
				self.assertTrue(
					stripped.startswith(":where(") or stripped.startswith("/*"),
					msg=f"expected :where() or comment, got: {line!r}",
				)

	def test_stable_idempotent_output(self) -> None:
		rows = [self._button_row()]
		first = theme_button_rules(rows, self._theme())
		second = theme_button_rules(rows, self._theme())
		self.assertEqual(first, second)


if __name__ == "__main__":
	unittest.main()
