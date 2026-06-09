"""Python side of color-math parity — golden data shared with frontend vitest."""
from __future__ import annotations

import json
import os
import sys
import unittest
from pathlib import Path

from themes.tests.frappe_stub import install_frappe_stub

install_frappe_stub()

from themes.utils.theme_color_utils import (
    _effective_role_hex,
    _generate_shades,
    generate_neutral_shades,
    pick_fg_mono,
    pick_fg_tonal,
)

GOLDEN_PATH = Path(__file__).resolve().parent / "golden" / "color_math_parity.json"


def _build_parity_fixture() -> dict:
    hex_inputs = [
        "#3B82F6",
        "#10B981",
        "#EF4444",
        "#989898",
        "#FFFFFF",
        "#000000",
        "#8B5CF6",
    ]
    fixture = {
        "hex_inputs": hex_inputs,
        "generate_shades": {},
        "neutral_shades": {},
        "effective_role_hex": {},
        "pick_fg_mono": {},
        "pick_fg_tonal": {},
    }
    for hx in hex_inputs:
        fixture["generate_shades"][hx] = {
            str(s): h for s, h in _generate_shades(hx)
        }
        fixture["pick_fg_mono"][hx] = pick_fg_mono(hx)
        fixture["pick_fg_tonal"][hx] = pick_fg_tonal(hx)
        fixture["effective_role_hex"][hx] = {
            "default": _effective_role_hex(hx),
            "gamma20_sat120": _effective_role_hex(hx, 20, 120),
        }
    for warmth in [0, -50, 50, 100]:
        fixture["neutral_shades"][str(warmth)] = {
            str(s): h for s, h in generate_neutral_shades(warmth)
        }
    return fixture


class TestColorMathParity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.live = _build_parity_fixture()
        if os.environ.get("UPDATE_GOLDEN") == "1":
            GOLDEN_PATH.parent.mkdir(parents=True, exist_ok=True)
            GOLDEN_PATH.write_text(json.dumps(cls.live, indent=2) + "\n")

    def test_golden_fixture_exists(self):
        self.assertTrue(
            GOLDEN_PATH.is_file(),
            "Missing color_math_parity.json. Run: UPDATE_GOLDEN=1 python -m unittest themes.tests.test_color_math_parity",
        )

    def test_matches_golden(self):
        if not GOLDEN_PATH.is_file():
            self.skipTest("golden color_math_parity.json not committed")
        golden = json.loads(GOLDEN_PATH.read_text())
        self.assertEqual(self.live, golden)


if __name__ == "__main__":
    unittest.main()
