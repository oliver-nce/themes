import frappe
from frappe import _
from frappe.model.document import Document
from themes.utils.site_theme_config_helpers import (
    get_site_base_desk_theme_name,
    get_site_base_theme_name,
)


class SiteThemeConfig(Document):
    def validate(self):
        base = self.get("base_theme") or self.get("active_theme") or get_site_base_theme_name()
        if base and not frappe.db.exists("NCE Theme", base):
            frappe.throw(_("NCE Theme {0} does not exist").format(base))

        desk_base = self.get("base_desk_theme") or get_site_base_desk_theme_name()
        if desk_base and not frappe.db.exists("NCE Desk Theme", desk_base):
            frappe.throw(_("NCE Desk Theme {0} does not exist").format(desk_base))

    def on_update(self):
        if getattr(frappe.flags, "in_install", False) or getattr(frappe.flags, "in_migrate", False):
            return
        base = self.get("base_theme") or get_site_base_theme_name()
        if base:
            from themes.utils.css_writer import publish_theme

            publish_theme(base)

        desk_base = self.get("base_desk_theme") or get_site_base_desk_theme_name()
        if desk_base:
            from themes.utils.desk_css_writer import publish_desk_theme

            publish_desk_theme(desk_base)
