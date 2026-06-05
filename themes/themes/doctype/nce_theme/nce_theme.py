import re
import json
import frappe
from frappe import _
from frappe.model.document import Document


class NCETheme(Document):
    def before_insert(self):
        if not self.theme_json:
            default_json = None
            active = frappe.db.get_single_value("Site Theme Config", "active_theme")
            if active and frappe.db.exists("NCE Theme", active):
                default_json = frappe.db.get_value("NCE Theme", active, "theme_json")
            self.theme_json = default_json or "{}"

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

    def on_update(self):
        if getattr(frappe.flags, "in_install", False) or getattr(frappe.flags, "in_migrate", False):
            return
        active = frappe.db.get_single_value("Site Theme Config", "active_theme")
        if self.status == "Active" or active == self.name:
            from themes.utils.css_writer import publish_theme
            publish_theme(self.name)

    def on_trash(self):
        if getattr(frappe.flags, "in_install", False) or getattr(frappe.flags, "in_migrate", False):
            return
        active = frappe.db.get_single_value("Site Theme Config", "active_theme")
        if self.status == "Active" or active == self.name:
            from themes.utils.css_writer import publish_theme
            publish_theme(active or self.name)
