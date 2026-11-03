"""Design Mode table dialog uses the shared shell property list and sparse instance saves."""
from __future__ import annotations

import unittest

from themes.utils.instance_style import parse_instance_style_overrides
from themes.utils.theme_class_catalog import (
	TABLE_PROPERTY_IDS,
	table_style_row_specs,
)


class TestTableDesignDialogModel(unittest.TestCase):
	def test_table_style_tabs_match_element_shell(self):
		tab_ids = ("component", "instance")
		self.assertEqual(len(tab_ids), 2)
		self.assertEqual(tab_ids[0], "component")
		self.assertEqual(tab_ids[1], "instance")

	def test_table_style_rows_cover_catalog_properties(self):
		specs = table_style_row_specs()
		prop_ids_from_rows: set[str] = set()
		for spec in specs:
			if spec.get("rowKind") == "table-divider":
				prop_ids_from_rows.add(spec["widthPropId"])
				prop_ids_from_rows.add(spec["colorPropId"])
			else:
				prop_ids_from_rows.add(spec["propId"])
		self.assertEqual(prop_ids_from_rows, set(TABLE_PROPERTY_IDS))

	def test_instance_override_stores_single_table_property(self):
		sparse = {"table-header-row": "theme-bg-primary-100"}
		bag = parse_instance_style_overrides(sparse)
		self.assertEqual(bag, sparse)
		self.assertNotIn("table-rows", bag)


if __name__ == "__main__":
	unittest.main()
