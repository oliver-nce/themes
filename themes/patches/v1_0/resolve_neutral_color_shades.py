import json

import frappe

from themes.utils.theme_color_utils import resolve_neutral_into_payload


def execute():
	"""Backfill resolved neutral tokens on saved themes."""
	updated = 0
	for name in frappe.get_all("NCE Theme", pluck="name"):
		raw = frappe.db.get_value("NCE Theme", name, "theme_json") or "{}"
		try:
			payload = json.loads(raw)
		except json.JSONDecodeError:
			continue
		if payload.get("neutral_color_shades"):
			continue
		payload = resolve_neutral_into_payload(payload)
		frappe.db.set_value(
			"NCE Theme",
			name,
			"theme_json",
			json.dumps(payload, default=str),
			update_modified=False,
		)
		updated += 1
	frappe.db.commit()
	print(f"Resolved neutral_color_shades on {updated} theme(s)")
