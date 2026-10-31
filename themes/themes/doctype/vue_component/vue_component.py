"""Vue Component: one scanned .vue file and the colour overrides chosen for its UI elements."""
from __future__ import annotations

import frappe
from frappe import _
from frappe.model.document import Document

from themes.utils.component_summary import build_summary
from themes.utils.component_sync import (
	BG_RE,
	BORDER_COLOR_RE,
	OVERRIDE_FIELDS,
	SELECTOR_RE,
	TEXT_RE,
	normalise_groups,
	needs_attention,
)

_VALIDATORS = (
	("override_bg_class", BG_RE, "background class"),
	("override_text_class", TEXT_RE, "text class"),
	("override_border_color_class", BORDER_COLOR_RE, "border colour class"),
	("selector_class", SELECTOR_RE, "selector class"),
)


class VueComponent(Document):
	def validate(self):
		for row in self.elements:
			for fieldname, pattern, label in _VALIDATORS:
				value = (row.get(fieldname) or "").strip()
				if value and not pattern.match(value):
					frappe.throw(
						_("Row {0}: {1} is not a valid {2}.").format(row.idx, value, label)
					)

		rows = normalise_groups([r.as_dict() for r in self.elements])
		for i, row in enumerate(self.elements):
			normalised = rows[i]
			row.keep_default = normalised.get("keep_default")
			for field in OVERRIDE_FIELDS:
				row.set(field, normalised.get(field))

		self.element_count = sum(1 for r in rows if r.get("element_status") == "Present")
		self.needs_attention = 1 if needs_attention(rows, self.status) else 0

		from themes.component_api import _used_by

		self.summary = build_summary(
			self.as_dict(),
			rows,
			_used_by(self.component_name, self.name),
		)

	def on_update(self):
		if not self.flags.get("skip_css_publish"):
			from themes.utils.component_css_writer import publish_component_css

			publish_component_css()

	def after_delete(self):
		from themes.utils.component_css_writer import publish_component_css

		publish_component_css()
