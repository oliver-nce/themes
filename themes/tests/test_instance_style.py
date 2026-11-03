"""Unit tests for instance-level Design Mode style resolution and save payloads."""

import unittest

from themes.utils.instance_style import (
	build_save_instance_payload,
	clean_fingerprint,
	effective_style_for_instance,
	instance_css_selector,
	instance_override_declaration_blocks,
	is_instance_property_overridden,
	note_fits,
	normalize_route,
	normalize_words,
	parse_instance_style_overrides,
	pick_note,
	preview_css_for_instance,
)
from themes.utils.theme_class_catalog import (
	PROP_BACKGROUND,
	PROP_BORDER_COLOR,
	PROP_BORDER_RADIUS,
	PROP_BUTTON_OUTLINE,
	PROP_HOVER_BACKGROUND,
	PROP_FOCUS_RING,
	effective_style_overrides,
)


def _component(**overrides):
	row = {
		"keep_default": 0,
		"override_fg_type": "mono",
		"theme_style_overrides": overrides,
	}
	return row


class TestInstanceStyleResolver(unittest.TestCase):
	def test_three_instances_no_overrides_same_effective(self):
		comp = _component(background="theme-bg-primary-500", **{"border-radius": "theme-rounded-lg"})
		for _ in range(3):
			self.assertEqual(
				effective_style_for_instance(comp, {}),
				effective_style_overrides(comp),
			)

	def test_component_change_updates_all_without_instance_keys(self):
		comp_v1 = _component(background="theme-bg-primary-500")
		comp_v2 = _component(background="theme-bg-primary-600")
		inst = {}
		self.assertEqual(
			effective_style_for_instance(comp_v2, inst)["background"],
			"theme-bg-primary-600",
		)
		self.assertNotIn("background", parse_instance_style_overrides(inst))

	def test_single_property_instance_override(self):
		comp = _component(background="theme-bg-primary-500", **{"border-radius": "theme-rounded-lg"})
		inst = {PROP_BACKGROUND: "theme-bg-danger-500"}
		eff = effective_style_for_instance(comp, inst)
		self.assertEqual(eff[PROP_BACKGROUND], "theme-bg-danger-500")
		self.assertEqual(eff[PROP_BORDER_RADIUS], "theme-rounded-lg")

	def test_component_change_on_overridden_property_does_not_affect_instance(self):
		comp_v1 = _component(background="theme-bg-primary-500")
		inst = {PROP_BACKGROUND: "theme-bg-danger-500"}
		comp_v2 = _component(background="theme-bg-primary-600")
		self.assertEqual(
			effective_style_for_instance(comp_v2, inst)[PROP_BACKGROUND],
			"theme-bg-danger-500",
		)

	def test_component_change_on_other_property_updates_instance(self):
		comp_v1 = _component(
			background="theme-bg-primary-500",
			**{PROP_BORDER_RADIUS: "theme-rounded-sm"},
		)
		inst = {PROP_BACKGROUND: "theme-bg-danger-500"}
		comp_v2 = _component(
			background="theme-bg-primary-600",
			**{PROP_BORDER_RADIUS: "theme-rounded-lg"},
		)
		eff = effective_style_for_instance(comp_v2, inst)
		self.assertEqual(eff[PROP_BACKGROUND], "theme-bg-danger-500")
		self.assertEqual(eff[PROP_BORDER_RADIUS], "theme-rounded-lg")

	def test_reset_removes_key_and_follows_component(self):
		comp = _component(background="theme-bg-primary-500")
		inst = {PROP_BACKGROUND: "theme-bg-danger-500"}
		self.assertTrue(is_instance_property_overridden(inst, PROP_BACKGROUND))
		inst = parse_instance_style_overrides({})
		self.assertFalse(is_instance_property_overridden(inst, PROP_BACKGROUND))
		self.assertEqual(
			effective_style_for_instance(comp, inst)[PROP_BACKGROUND],
			"theme-bg-primary-500",
		)

	def test_after_reset_component_change_propagates(self):
		comp_v1 = _component(background="theme-bg-primary-500")
		comp_v2 = _component(background="theme-bg-primary-600")
		inst = {}
		self.assertEqual(
			effective_style_for_instance(comp_v2, inst)[PROP_BACKGROUND],
			"theme-bg-primary-600",
		)

	def test_sparse_storage_only_overridden_keys(self):
		sparse = parse_instance_style_overrides(
			{PROP_BACKGROUND: "theme-bg-danger-500", PROP_BORDER_RADIUS: "theme-rounded-lg"}
		)
		self.assertEqual(set(sparse.keys()), {PROP_BACKGROUND, PROP_BORDER_RADIUS})

	def test_save_payload_sparse_only(self):
		payload = build_save_instance_payload("abc123456789", {PROP_BACKGROUND: "red"})
		self.assertEqual(payload["instance_id"], "abc123456789")
		self.assertEqual(payload["instance_style_overrides"], {PROP_BACKGROUND: "red"})
		payload_clear = build_save_instance_payload("abc123456789", {})
		self.assertEqual(payload_clear["instance_style_overrides"], {})

	def test_hover_focus_instance_rules_only_for_overridden_keys(self):
		comp = _component(**{PROP_HOVER_BACKGROUND: "primary", PROP_FOCUS_RING: "1"})
		sparse_hover = {PROP_HOVER_BACKGROUND: "secondary"}
		blocks = instance_override_declaration_blocks(comp, sparse_hover)
		self.assertTrue(blocks)
		joined = " ".join(d for _, ds in blocks for d in ds)
		self.assertIn("background-color", joined)
		sparse_focus = {PROP_FOCUS_RING: "0"}
		focus_blocks = instance_override_declaration_blocks(comp, sparse_focus)
		self.assertTrue(focus_blocks)
		css = preview_css_for_instance("ppv2-btn", "inst1", comp, sparse_hover)
		self.assertIn("[data-nce-instance=\"inst1\"]", css)

	def test_instance_selector_more_specific_than_component(self):
		sel = instance_css_selector("ppv2-btn", "inst1")
		self.assertIn(".ppv2-btn.ppv2-btn.ppv2-btn", sel)
		self.assertIn("[data-nce-instance=\"inst1\"]", sel)

	def test_empty_instance_override_emits_no_css(self):
		comp = _component(background="theme-bg-primary-500")
		self.assertEqual(instance_override_declaration_blocks(comp, {}), [])

	def test_instance_outline_uses_component_background(self):
		comp = _component(
			background="theme-bg-danger-600",
			**{PROP_BUTTON_OUTLINE: "1"},
		)
		decls = [d for _, ds in instance_override_declaration_blocks(comp, {PROP_BUTTON_OUTLINE: "1"}) for d in ds]
		self.assertIn("border-color: var(--nce-color-danger-600);", decls)
		self.assertIn("color: var(--nce-color-danger-600);", decls)
		self.assertNotIn("background-color: var(--nce-color-danger-600);", decls)

	def test_instance_bg_only_switches_outline_color_on_component(self):
		comp = _component(
			background="theme-bg-danger-600",
			**{PROP_BUTTON_OUTLINE: "1"},
		)
		decls = [d for _, ds in instance_override_declaration_blocks(comp, {PROP_BACKGROUND: "theme-bg-success-500"}) for d in ds]
		self.assertIn("border-color: var(--nce-color-success-500);", decls)
		self.assertIn("color: var(--nce-color-success-500);", decls)

	def test_instance_outline_explicit_border_after_outline(self):
		comp = _component(**{PROP_BUTTON_OUTLINE: "1"})
		sparse = {PROP_BUTTON_OUTLINE: "1", PROP_BORDER_COLOR: "theme-border-danger-700"}
		base = next(ds for p, ds in instance_override_declaration_blocks(comp, sparse) if p is None)
		border = [d for d in base if d.startswith("border-color:")]
		self.assertEqual(border[-1], "border-color: var(--nce-color-danger-700);")

	def test_non_outline_instance_sparse_unchanged(self):
		comp = _component(background="theme-bg-primary-500")
		sparse = {PROP_BORDER_RADIUS: "theme-rounded-lg"}
		decls = [d for _, ds in instance_override_declaration_blocks(comp, sparse) for d in ds]
		self.assertIn("border-radius:", decls[0])
		self.assertNotIn("background-color: transparent;", decls)


class TestInstanceFingerprint(unittest.TestCase):
	def test_normalize_route(self):
		self.assertEqual(normalize_route("/desk/x/"), "/desk/x")
		self.assertEqual(normalize_route("desk//x?a=1#b"), "/desk/x")
		self.assertEqual(normalize_route("/"), "/")
		self.assertEqual(normalize_route(""), "")

	def test_normalize_words(self):
		self.assertEqual(normalize_words("  hello   world  "), "hello world")
		self.assertEqual(normalize_words("x" * 81), "")

	def test_clean_fingerprint_keys_and_truncation(self):
		fp = clean_fingerprint(None)
		for key in ("route", "nce_key", "name_tag", "label_text", "context_key", "fit_count"):
			self.assertIn(key, fp)
		long_key = "k" * 200
		fp2 = clean_fingerprint({"nce_key": long_key, "name_tag": long_key})
		self.assertEqual(len(fp2["nce_key"]), 140)
		self.assertEqual(len(fp2["name_tag"]), 140)
		long_route = "/" + "a" * 250
		fp3 = clean_fingerprint({"route": long_route})
		self.assertEqual(len(fp3["route"]), 200)

	def test_clean_fingerprint_fit_count(self):
		self.assertEqual(clean_fingerprint({"fit_count": "3"})["fit_count"], 3)
		self.assertEqual(clean_fingerprint({"fit_count": -1})["fit_count"], 0)
		self.assertEqual(clean_fingerprint({"fit_count": None})["fit_count"], 0)

	def test_note_fits_class(self):
		note = {"selector_class": "a", "nce_key": "", "name_tag": "", "label_text": "", "context_key": ""}
		self.assertFalse(note_fits(note, {"selector_class": "b"}))

	def test_note_fits_nce_key_match_ignores_words(self):
		note = {
			"selector_class": "btn",
			"nce_key": "save",
			"name_tag": "Save",
			"label_text": "Save",
			"context_key": "",
		}
		candidate = {"selector_class": "btn", "nce_key": "save", "label_text": "Other"}
		self.assertTrue(note_fits(note, candidate))

	def test_note_fits_nce_key_mismatch(self):
		note = {"selector_class": "btn", "nce_key": "save", "name_tag": "", "label_text": "", "context_key": ""}
		candidate = {"selector_class": "btn", "nce_key": "cancel"}
		self.assertFalse(note_fits(note, candidate))

	def test_note_fits_all_clues_must_match(self):
		note = {
			"selector_class": "btn",
			"nce_key": "",
			"name_tag": "Go",
			"label_text": "Go",
			"context_key": "heading:Products",
		}
		self.assertTrue(
			note_fits(
				note,
				{
					"selector_class": "btn",
					"name_tag": "Go",
					"label_text": "Go",
					"context_key": "heading:Products",
				},
			)
		)
		self.assertFalse(
			note_fits(
				note,
				{
					"selector_class": "btn",
					"name_tag": "Go",
					"label_text": "Go",
					"context_key": "heading:Other",
				},
			)
		)

	def test_note_fits_empty_clue_on_note_ignored(self):
		note = {
			"selector_class": "btn",
			"nce_key": "",
			"name_tag": "Go",
			"label_text": "",
			"context_key": "",
		}
		self.assertTrue(note_fits(note, {"selector_class": "btn", "name_tag": "Go", "label_text": "Anything"}))

	def test_note_fits_no_clues_fits_class(self):
		note = {"selector_class": "btn", "nce_key": "", "name_tag": "", "label_text": "", "context_key": ""}
		self.assertTrue(note_fits(note, {"selector_class": "btn"}))
		self.assertTrue(note_fits(note, {"selector_class": "btn", "label_text": "x"}))

	def test_pick_note_strength(self):
		notes = [
			{
				"instance_id": "weak",
				"selector_class": "btn",
				"nce_key": "",
				"name_tag": "A",
				"label_text": "",
				"context_key": "",
				"modified": "2026-01-01T00:00:00",
			},
			{
				"instance_id": "strong",
				"selector_class": "btn",
				"nce_key": "key1",
				"name_tag": "",
				"label_text": "",
				"context_key": "",
				"modified": "2026-01-01T00:00:00",
			},
		]
		candidate = {"selector_class": "btn", "nce_key": "key1"}
		self.assertEqual(pick_note(candidate, notes), "strong")

	def test_pick_note_modified_tiebreak(self):
		notes = [
			{
				"instance_id": "older",
				"selector_class": "btn",
				"nce_key": "",
				"name_tag": "Same",
				"label_text": "",
				"context_key": "",
				"modified": "2026-01-01T00:00:00",
			},
			{
				"instance_id": "later",
				"selector_class": "btn",
				"nce_key": "",
				"name_tag": "Same",
				"label_text": "",
				"context_key": "",
				"modified": "2026-02-01T00:00:00",
			},
		]
		candidate = {"selector_class": "btn", "name_tag": "Same"}
		self.assertEqual(pick_note(candidate, notes), "later")

	def test_pick_note_no_fit(self):
		note = {
			"instance_id": "n1",
			"selector_class": "btn",
			"nce_key": "x",
			"name_tag": "",
			"label_text": "",
			"context_key": "",
			"modified": "2026-01-01T00:00:00",
		}
		self.assertIsNone(pick_note({"selector_class": "btn", "nce_key": "y"}, [note]))


if __name__ == "__main__":
	unittest.main()
