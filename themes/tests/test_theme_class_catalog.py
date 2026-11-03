"""Unit tests for themes.utils.theme_class_catalog."""
from __future__ import annotations

import unittest

from themes.utils.component_css_writer import declaration_blocks_for, declarations_for
from themes.utils.theme_class_catalog import (
	PROP_BUTTON_OUTLINE,
	PROP_TEXT_COLOR,
	THEME_BTN_PROPERTY_IDS,
	properties_for_classes,
)


class TestThemeClassCatalog(unittest.TestCase):
	def test_theme_btn_expands_all_properties(self) -> None:
		ids = [p["id"] for p in properties_for_classes(["theme-btn"])]
		self.assertEqual(ids, list(THEME_BTN_PROPERTY_IDS))
		self.assertIn(PROP_BUTTON_OUTLINE, ids)

	def test_text_primary_only_text_row(self) -> None:
		ids = [p["id"] for p in properties_for_classes(["theme-text-primary"])]
		self.assertEqual(ids, [PROP_TEXT_COLOR])

	def test_dedupe_border_when_btn_and_border(self) -> None:
		ids = [p["id"] for p in properties_for_classes(["theme-btn", "theme-border"])]
		self.assertEqual(ids.count("border-width"), 1)
		self.assertEqual(ids.count("border-color"), 1)


class TestButtonOutlineOverrides(unittest.TestCase):
	def _row(self, **kwargs: object) -> dict:
		base = {
			"override_bg_class": "",
			"override_fg_type": "",
			"override_text_class": "",
			"override_border_width_class": "",
			"override_border_color_class": "",
			"override_button_size_class": "",
			"theme_style_overrides": "",
		}
		base.update(kwargs)
		return base

	def test_outline_off_emits_nothing(self) -> None:
		decls = declarations_for(self._row(theme_style_overrides='{"button-outline":""}'))
		self.assertFalse(any("transparent" in d for d in decls))
		decls_off = declarations_for(self._row(theme_style_overrides='{"button-outline":"0"}'))
		self.assertFalse(any("transparent" in d for d in decls_off))

	def test_outline_on_emits_primary_outline(self) -> None:
		decls = declarations_for(self._row(theme_style_overrides='{"button-outline":"1"}'))
		self.assertIn("background-color: transparent;", decls)
		self.assertIn("border-color: var(--nce-color-primary);", decls)
		self.assertIn("color: var(--nce-color-primary);", decls)

	def test_outline_on_includes_hover_block(self) -> None:
		blocks = declaration_blocks_for(self._row(theme_style_overrides='{"button-outline":"1"}'))
		pseudos = [p for p, _ in blocks]
		self.assertIn(":hover:not(:disabled)", pseudos)

	def test_outline_with_background_uses_bg_color_not_fill(self) -> None:
		decls = declarations_for(
			self._row(
				theme_style_overrides='{"button-outline":"1","background":"theme-bg-success-500"}',
			)
		)
		self.assertIn("background-color: transparent;", decls)
		self.assertIn("border-color: var(--nce-color-success-500);", decls)
		self.assertIn("color: var(--nce-color-success-500);", decls)
		self.assertFalse(any(d.startswith("background-color: var(") for d in decls))

	def test_outline_explicit_border_color_wins(self) -> None:
		decls = declarations_for(
			self._row(
				theme_style_overrides=(
					'{"button-outline":"1","background":"theme-bg-success-500",'
					'"border-color":"theme-border-danger-700"}'
				),
			)
		)
		border = [d for d in decls if d.startswith("border-color:")]
		self.assertEqual(border[-1], "border-color: var(--nce-color-danger-700);")

	def test_outline_explicit_text_color_wins(self) -> None:
		decls = declarations_for(
			self._row(
				theme_style_overrides=(
					'{"button-outline":"1","text-color":"theme-text-danger-700"}'
				),
			)
		)
		color_idxs = [i for i, d in enumerate(decls) if d.startswith("color:")]
		self.assertEqual(color_idxs[-1], len(decls) - 1)
		self.assertIn("color: var(--nce-color-danger-700);", decls)

	def test_filled_background_unchanged_without_outline(self) -> None:
		decls = declarations_for(
			self._row(theme_style_overrides='{"background":"theme-bg-primary-500"}'),
		)
		self.assertIn("background-color: var(--nce-color-primary-500);", decls)
		self.assertNotIn("background-color: transparent;", decls)

	def test_legacy_button_size_when_json_empty(self) -> None:
		decls = declarations_for(self._row(override_button_size_class="lg"))
		self.assertIn("font-size: var(--nce-btn-lg-font-size);", decls)

	def test_legacy_border_width_when_json_empty(self) -> None:
		decls = declarations_for(self._row(override_border_width_class="theme-border-strong"))
		self.assertIn("border-width: var(--nce-border-width-strong);", decls)


if __name__ == "__main__":
	unittest.main()
