"""Unit tests for themes.utils.component_summary."""
from __future__ import annotations

import unittest

from themes.utils.component_summary import build_summary, describe_theme_classes, element_noun


class TestDescribeThemeClasses(unittest.TestCase):
	def test_theme_bg_primary(self) -> None:
		self.assertEqual(describe_theme_classes(["theme-bg-primary"]), "primary background")

	def test_theme_bg_primary_300(self) -> None:
		self.assertEqual(describe_theme_classes(["theme-bg-primary-300"]), "primary 300 background")

	def test_theme_bg_surface(self) -> None:
		self.assertEqual(describe_theme_classes(["theme-bg-surface"]), "surface background")

	def test_theme_text_fg_tonal(self) -> None:
		self.assertEqual(
			describe_theme_classes(["theme-text-primary-300-fg-tonal"]),
			"primary 300 tonal contrast text",
		)

	def test_theme_text_fg(self) -> None:
		self.assertEqual(
			describe_theme_classes(["theme-text-primary-300-fg"]),
			"primary 300 contrast text",
		)

	def test_theme_text_role_shade(self) -> None:
		self.assertEqual(describe_theme_classes(["theme-text-primary-300"]), "primary 300 text")

	def test_theme_text_other(self) -> None:
		self.assertEqual(describe_theme_classes(["theme-text-heading"]), "heading text")

	def test_theme_border_thin(self) -> None:
		self.assertEqual(describe_theme_classes(["theme-border-thin"]), "thin border")

	def test_theme_border(self) -> None:
		self.assertEqual(describe_theme_classes(["theme-border"]), "normal border")

	def test_theme_border_strong(self) -> None:
		self.assertEqual(describe_theme_classes(["theme-border-strong"]), "strong border")

	def test_theme_border_colour(self) -> None:
		self.assertEqual(
			describe_theme_classes(["theme-border-primary-500"]),
			"primary 500 border colour",
		)

	def test_theme_border_other(self) -> None:
		self.assertEqual(describe_theme_classes(["theme-border-dashed"]), "dashed border")

	def test_theme_rounded(self) -> None:
		self.assertEqual(describe_theme_classes(["theme-rounded"]), "rounded corners")

	def test_theme_rounded_size(self) -> None:
		self.assertEqual(describe_theme_classes(["theme-rounded-lg"]), "lg rounded corners")

	def test_theme_shadow(self) -> None:
		self.assertEqual(describe_theme_classes(["theme-shadow-theme"]), "shadow")

	def test_unknown_ignored(self) -> None:
		self.assertEqual(describe_theme_classes(["theme-unknown-foo"]), "no theme classes in the template")

	def test_duplicate_phrase_once(self) -> None:
		self.assertEqual(
			describe_theme_classes(["theme-bg-primary", "theme-bg-primary-500"]),
			"primary background, primary 500 background",
		)


class TestElementNoun(unittest.TestCase):
	def test_select_fd_input(self) -> None:
		self.assertEqual(element_noun("select", "fd-input fd-select"), "dropdown")

	def test_span_reqd(self) -> None:
		self.assertEqual(element_noun("span", "ppv2-fd-reqd"), "required marker")

	def test_p_desc(self) -> None:
		self.assertEqual(element_noun("p", "ppv2-fd-desc"), "help text")

	def test_div_footer(self) -> None:
		self.assertEqual(element_noun("div", "ppv2-float-footer"), "footer")

	def test_panel_table_component(self) -> None:
		self.assertEqual(element_noun("PanelTable", "tbl"), "PanelTable component")


class TestBuildSummary(unittest.TestCase):
	@classmethod
	def _sample(cls) -> tuple[dict, list[dict], list[str]]:
		comp = {
			"component_name": "SampleField",
			"app": "nce_events",
			"file_path": "public/js/SampleField.vue",
			"purpose": "Renders sample fields.",
			"uses_components": "ChildA\nChildB",
		}
		rows = [
			{
				"element_key": "ppv2-fd-reqd",
				"tag": "span",
				"line": 10,
				"selector_class": "ppv2-fd-reqd",
				"source_classes": "theme-text-danger-600-fg",
				"element_status": "Present",
				"is_dynamic": 0,
				"keep_default": 0,
				"override_bg_class": "",
				"override_fg_type": "",
				"override_text_class": "theme-text-primary-600",
				"override_border_width_class": "",
				"override_border_color_class": "",
			},
			{
				"element_key": "ppv2-fd-desc",
				"tag": "p",
				"line": 20,
				"selector_class": "ppv2-fd-desc",
				"source_classes": "theme-text-neutral-600",
				"element_status": "Present",
				"is_dynamic": 0,
				"keep_default": 1,
				"override_bg_class": "",
				"override_fg_type": "",
				"override_text_class": "",
				"override_border_width_class": "",
				"override_border_color_class": "",
			},
			{
				"element_key": "ppv2-fd-desc-2",
				"tag": "p",
				"line": 25,
				"selector_class": "ppv2-fd-desc",
				"source_classes": "theme-text-neutral-500",
				"element_status": "Present",
				"is_dynamic": 0,
				"keep_default": 1,
				"override_bg_class": "",
				"override_fg_type": "",
				"override_text_class": "",
				"override_border_width_class": "",
				"override_border_color_class": "",
			},
			{
				"element_key": "div@L30",
				"tag": "div",
				"line": 30,
				"selector_class": "",
				"source_classes": "theme-bg-primary-100",
				"element_status": "Present",
				"is_dynamic": 1,
				"keep_default": 0,
				"override_bg_class": "",
				"override_fg_type": "",
				"override_text_class": "",
				"override_border_width_class": "",
				"override_border_color_class": "",
			},
		]
		return comp, rows, ["PanelFormDialogBody"]

	def test_build_summary_exact(self) -> None:
		comp, rows, used_by = self._sample()
		expected = "\n".join([
			"SampleField — nce_events: public/js/SampleField.vue",
			"Purpose: Renders sample fields.",
			"Used by: PanelFormDialogBody",
			"Uses: ChildA, ChildB",
			"Themed elements: 3 (4 in the template)",
			"• ppv2-fd-reqd — required marker: danger 600 contrast text",
			"• ppv2-fd-desc — help text ×2: neutral 600 text, neutral 500 text",
			"• div@L30 — box: primary 100 background; colour also set by code; !! no class",
			"Colours: 1 set, 1 kept at theme default, 1 still to choose.",
		])
		self.assertEqual(build_summary(comp, rows, used_by), expected)

	def test_build_summary_deterministic(self) -> None:
		comp, rows, used_by = self._sample()
		a = build_summary(comp, rows, used_by)
		b = build_summary(comp, rows, used_by)
		self.assertEqual(a, b)


if __name__ == "__main__":
	unittest.main()
