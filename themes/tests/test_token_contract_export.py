"""Tests for export_token_contract() stability."""
from __future__ import annotations

import json
import os
import unittest
from pathlib import Path

from themes.utils.theme_tokens import export_token_contract

GOLDEN_PATH = Path(__file__).resolve().parent / "golden" / "token_contract.json"


class TestTokenContractExport(unittest.TestCase):
	@classmethod
	def setUpClass(cls):
		cls.live = export_token_contract()
		if os.environ.get("UPDATE_GOLDEN") == "1":
			GOLDEN_PATH.parent.mkdir(parents=True, exist_ok=True)
			GOLDEN_PATH.write_text(json.dumps(cls.live, indent=2, sort_keys=True) + "\n")

	def test_golden_exists(self):
		self.assertTrue(GOLDEN_PATH.is_file())

	def test_matches_golden(self):
		if not GOLDEN_PATH.is_file():
			self.skipTest("golden token_contract.json not committed")
		golden = json.loads(GOLDEN_PATH.read_text())
		self.assertEqual(self.live, golden)


if __name__ == "__main__":
	unittest.main()
