import frappe
from frappe import _
from frappe.model.document import Document


class ThemeVersion(Document):
    def before_insert(self):
        if not self.version_no:
            last = frappe.db.get_value(
                "Theme Version",
                {"parent_theme": self.parent_theme},
                "max(version_no)",
            )
            self.version_no = (last or 0) + 1

    def validate(self):
        if self.published:
            others = frappe.db.get_all(
                "Theme Version",
                filters={
                    "parent_theme": self.parent_theme,
                    "published": 1,
                    "name": ["!=", self.name],
                },
                pluck="name",
            )
            if others:
                frappe.db.set_value("Theme Version", others, "published", 0)
