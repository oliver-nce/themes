import re

import frappe
from frappe import _
from frappe.model.document import Document
from themes.utils.site_theme_config_helpers import get_site_base_desk_theme_name


class NCEDeskTheme(Document):
    def before_insert(self):
        if not self.theme_json:
            default_json = None
            base = get_site_base_desk_theme_name()
            if base and frappe.db.exists("NCE Desk Theme", base):
                default_json = frappe.db.get_value("NCE Desk Theme", base, "theme_json")
            self.theme_json = default_json or "{}"

    def before_save(self):
        new_slug = re.sub(r"[^a-z0-9]+", "-", (self.theme_name or "").lower()).strip("-")
        if not self.slug or self.has_value_changed("theme_name"):
            self.slug = new_slug

    def validate(self):
        if self.is_default:
            others = frappe.db.get_all(
                "NCE Desk Theme",
                filters={"is_default": 1, "name": ["!=", self.name]},
                pluck="name",
            )
            if others:
                frappe.throw(_("Another desk theme is already marked default: {0}").format(others[0]))

        if self.status == "Active":
            others = frappe.db.get_all(
                "NCE Desk Theme",
                filters={"status": "Active", "name": ["!=", self.name]},
                pluck="name",
            )
            if others:
                frappe.throw(_("Another desk theme is already active: {0}").format(others[0]))

    def on_update(self):
        if getattr(frappe.flags, "in_install", False) or getattr(frappe.flags, "in_migrate", False):
            return
        base = get_site_base_desk_theme_name()
        if self.has_value_changed("status") or self.status == "Active" or base == self.name:
            from themes.utils.desk_css_writer import publish_desk_theme

            publish_desk_theme(self.name)

    def on_trash(self):
        if getattr(frappe.flags, "in_install", False) or getattr(frappe.flags, "in_migrate", False):
            return
        base = get_site_base_desk_theme_name()
        if self.status == "Active" or base == self.name:
            from themes.utils.desk_css_writer import publish_desk_theme

            publish_desk_theme(base or self.name)
