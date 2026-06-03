import frappe
from frappe import _
from frappe.model.document import Document


class SiteThemeConfig(Document):
    def validate(self):
        if self.active_theme and not self.active_version:
            self.active_version = frappe.db.get_value(
                "Theme Version",
                {"parent_theme": self.active_theme, "published": 1},
                "name",
            )
        if self.active_version:
            parent = frappe.db.get_value("Theme Version", self.active_version, "parent_theme")
            if parent and parent != self.active_theme:
                frappe.throw(_("Version {0} does not belong to theme {1}").format(
                    self.active_version, self.active_theme))

    def on_update(self):
        # Don't publish during install/migrate — patch calls publish_version explicitly.
        if getattr(frappe.flags, "in_install", False) or getattr(frappe.flags, "in_migrate", False):
            return
        if self.active_version:
            from themes.utils.css_writer import publish_version
            publish_version(self.active_version)
