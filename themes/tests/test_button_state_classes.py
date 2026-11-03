"""Regression tests for button-state utility classes in generate_css."""

from __future__ import annotations

import unittest

from themes.tests.frappe_stub import install_frappe_stub

install_frappe_stub()

from themes.utils.css_writer import generate_css
from themes.utils.default_theme import DEFAULT_THEME_PAYLOAD
from themes.utils.theme_class_catalog import hover_outline_declarations, theme_btn_emit_blocks
from themes.utils.theme_color_utils import resolve_neutral_into_payload


def _default_css() -> str:
    payload = resolve_neutral_into_payload(dict(DEFAULT_THEME_PAYLOAD))
    return generate_css(payload)


class TestButtonStateClasses(unittest.TestCase):
    def test_default_payload_emits_contract_classes(self):
        css = _default_css()
        self.assertIn(".theme-font-semibold { font-weight: var(--nce-font-weight-semibold); }", css)
        self.assertIn(
            ".theme-hover-bg-primary:hover:not(:disabled), .hover-bg-primary:hover:not(:disabled)",
            css,
        )
        self.assertIn(".theme-hover-border-neutral:hover:not(:disabled)", css)
        self.assertIn("button.theme-focus-bg-primary:focus-visible:not(:disabled)", css)
        self.assertIn(".theme-focus-bg-neutral:focus-visible:not(:disabled)", css)
        self.assertIn(
            "button.theme-focus-bg-primary:focus-visible:not(:disabled), .theme-focus-bg-primary:focus-visible:not(:disabled) "
            "{ background-color: var(--nce-color-primary); color: var(--nce-color-primary-fg); border-color: var(--nce-color-primary); }",
            css,
        )
        self.assertIn(".theme-focus-ring:focus-visible, .focus-ring:focus-visible", css)
        self.assertIn(".theme-focus-ring-danger:focus-visible", css)
        self.assertIn(".theme-disabled { opacity: var(--nce-disabled-opacity); cursor: not-allowed; }", css)
        self.assertIn(".theme-pressed:active:not(:disabled)", css)

    def test_focus_fill_disabled_omits_focus_bg_rules(self):
        payload = resolve_neutral_into_payload(dict(DEFAULT_THEME_PAYLOAD))
        for off in (0, "0", False):
            trial = dict(payload)
            trial["focus_fill_enabled"] = off
            css = generate_css(trial)
            self.assertNotIn("theme-focus-bg-primary", css)

    def test_focus_ring_disabled_emits_no_outline(self):
        payload = resolve_neutral_into_payload(dict(DEFAULT_THEME_PAYLOAD))
        for off in (0, "0", False):
            trial = dict(payload)
            trial["focus_ring_enabled"] = off
            css = generate_css(trial)
            self.assertIn(
                ".theme-focus-ring:focus-visible, .focus-ring:focus-visible "
                "{ outline: none; outline-offset: 0; }",
                css,
            )

    def test_hover_bg_shade_token_changes_emitted_shade(self):
        payload = resolve_neutral_into_payload(dict(DEFAULT_THEME_PAYLOAD))
        payload["hover_bg_shade"] = "200"
        css = generate_css(payload)
        self.assertIn("var(--nce-color-primary-200)", css)
        self.assertIn(
            ".theme-hover-bg-primary:hover:not(:disabled), .hover-bg-primary:hover:not(:disabled) "
            "{ background-color: var(--nce-color-primary-200); color: var(--nce-color-primary-200-fg); }",
            css,
        )
        self.assertNotIn(
            ".theme-hover-bg-primary:hover:not(:disabled), .hover-bg-primary:hover:not(:disabled) "
            "{ background-color: var(--nce-color-primary-100);",
            css,
        )

    def test_default_payload_emits_button_size_classes(self):
        css = _default_css()
        self.assertIn("button.theme-btn, .theme-btn {", css)
        self.assertIn("button.theme-btn-md, .theme-btn-md {", css)
        self.assertIn(
            "padding: var(--nce-btn-md-pad-y) var(--nce-btn-md-pad-x);",
            css,
        )
        self.assertIn("--nce-btn-md-pad-y: 4px;", css)

    def test_theme_btn_includes_complete_button_styles(self):
        css = _default_css()
        block_start = css.index("button.theme-btn, .theme-btn {")
        block_end = css.index("}", block_start)
        block = css[block_start:block_end]
        self.assertIn("background-color: var(--nce-color-surface);", block)
        self.assertIn("color: var(--nce-color-primary);", block)
        self.assertIn("border-color: var(--nce-color-border);", block)
        self.assertIn("border-radius: calc(var(--nce-border-radius) * 0.5);", block)
        self.assertIn("font-size: var(--nce-btn-md-font-size);", block)
        self.assertIn(
            "button.theme-btn:hover:not(:disabled), .theme-btn:hover:not(:disabled) "
            "{ background-color: var(--nce-color-primary-100); color: var(--nce-color-primary-100-fg); "
            "border-color: var(--nce-color-primary-500); }",
            css,
        )
        self.assertIn(
            "button.theme-btn:focus-visible:not(:disabled), .theme-btn:focus-visible:not(:disabled) "
            "{ outline: var(--nce-focus-ring-width) solid var(--nce-color-focus); "
            "outline-offset: var(--nce-focus-ring-offset); }",
            css,
        )
        self.assertIn(
            "button.theme-btn:focus-visible:not(:disabled), .theme-btn:focus-visible:not(:disabled) "
            "{ background-color: var(--nce-color-primary); color: var(--nce-color-primary-fg); "
            "border-color: var(--nce-color-primary); }",
            css,
        )

    def test_theme_btn_respects_focus_switches(self):
        payload = resolve_neutral_into_payload(dict(DEFAULT_THEME_PAYLOAD))
        focus_fill_rule = (
            "button.theme-btn:focus-visible:not(:disabled), .theme-btn:focus-visible:not(:disabled) "
            "{ background-color: var(--nce-color-primary); color: var(--nce-color-primary-fg); "
            "border-color: var(--nce-color-primary); }"
        )
        for off in (0, "0", False):
            trial = dict(payload)
            trial["focus_ring_enabled"] = off
            css = generate_css(trial)
            self.assertIn(
                "button.theme-btn:focus-visible:not(:disabled), .theme-btn:focus-visible:not(:disabled) "
                "{ outline: none; outline-offset: 0; }",
                css,
            )
        for off in (0, "0", False):
            trial = dict(payload)
            trial["focus_fill_enabled"] = off
            css = generate_css(trial)
            self.assertNotIn(focus_fill_rule, css)

    def test_theme_btn_md_is_size_only(self):
        css = _default_css()
        block_start = css.index("button.theme-btn-md, .theme-btn-md {")
        block_end = css.index("}", block_start)
        block = css[block_start:block_end]
        self.assertNotIn("background-color", block)
        self.assertIn("font-size: var(--nce-btn-md-font-size);", block)

    def test_button_size_pad_override_changes_var_not_declaration(self):
        payload = resolve_neutral_into_payload(dict(DEFAULT_THEME_PAYLOAD))
        payload["btn_md_pad_y"] = "6px"
        css = generate_css(payload)
        self.assertIn(
            "padding: var(--nce-btn-md-pad-y) var(--nce-btn-md-pad-x);",
            css,
        )
        self.assertIn("--nce-btn-md-pad-y: 6px;", css)
        self.assertNotIn("padding: 6px var(--nce-btn-md-pad-x);", css)

    def test_theme_btn_outline_off_by_default(self):
        payload = resolve_neutral_into_payload(dict(DEFAULT_THEME_PAYLOAD))
        base, _, _, _ = theme_btn_emit_blocks(payload.get)
        self.assertIn("background-color: var(--nce-color-surface);", base)

    def test_theme_btn_outline_enabled_with_primary(self):
        payload = resolve_neutral_into_payload(dict(DEFAULT_THEME_PAYLOAD))
        payload["button_outline_enabled"] = 1
        base, hover, _, _ = theme_btn_emit_blocks(payload.get)
        self.assertIn("background-color: transparent;", base)
        self.assertIn("border-color: var(--nce-color-primary);", base)
        self.assertNotIn("background-color: var(--nce-color-surface);", base)
        self.assertEqual(hover, hover_outline_declarations(100, 500))

    def test_theme_btn_outline_without_primary_unchanged(self):
        payload = resolve_neutral_into_payload(dict(DEFAULT_THEME_PAYLOAD))
        payload["button_outline_enabled"] = 1
        payload["primary_color"] = ""
        base, _, _, _ = theme_btn_emit_blocks(payload.get)
        self.assertIn("background-color: var(--nce-color-surface);", base)
        self.assertIn("border-color: var(--nce-color-border);", base)


if __name__ == "__main__":
    unittest.main()
