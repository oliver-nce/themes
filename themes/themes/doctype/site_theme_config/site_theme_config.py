import frappe
from frappe import _
from frappe.model.document import Document


class SiteThemeConfig(Document):
    def validate(self):
        if self.base_theme and not frappe.db.exists("NCE Theme", self.base_theme):
            frappe.throw(_("NCE Theme {0} does not exist").format(self.base_theme))

    def on_update(self):
        if getattr(frappe.flags, "in_install", False) or getattr(frappe.flags, "in_migrate", False):
            return
        if self.base_theme:
            from themes.utils.css_writer import publish_theme
            publish_theme(self.base_theme)
