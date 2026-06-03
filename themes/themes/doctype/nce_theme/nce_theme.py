import re
import frappe
from frappe import _
from frappe.model.document import Document


class NCETheme(Document):
    def before_save(self):
        if not self.slug:
            self.slug = re.sub(r"[^a-z0-9]+", "-", (self.theme_name or "").lower()).strip("-")

    def validate(self):
        if self.is_default:
            others = frappe.db.get_all(
                "NCE Theme",
                filters={"is_default": 1, "name": ["!=", self.name]},
                pluck="name",
            )
            if others:
                frappe.throw(_("Another theme is already marked default: {0}").format(others[0]))
