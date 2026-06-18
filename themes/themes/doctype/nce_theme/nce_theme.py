# Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
import re
import json
import frappe
from frappe import _
from frappe.model.document import Document
from themes.utils.site_theme_config_helpers import get_site_base_theme_name


class NCETheme(Document):
    def before_insert(self):
        if not self.theme_json:
            default_json = None
            base = get_site_base_theme_name()
            if base and frappe.db.exists("NCE Theme", base):
                default_json = frappe.db.get_value("NCE Theme", base, "theme_json")
            self.theme_json = default_json or "{}"

    def before_save(self):
        new_slug = re.sub(r"[^a-z0-9]+", "-", (self.theme_name or "").lower()).strip("-")
        if not self.slug or self.has_value_changed("theme_name"):
            self.slug = new_slug

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
        base = get_site_base_theme_name()
        if self.has_value_changed("status") or self.status == "Active" or base == self.name:
            from themes.utils.css_writer import publish_theme
            publish_theme(self.name)

    def on_trash(self):
        if getattr(frappe.flags, "in_install", False) or getattr(frappe.flags, "in_migrate", False):
            return
        base = get_site_base_theme_name()
        if self.status == "Active" or base == self.name:
            from themes.utils.css_writer import publish_theme
            publish_theme(base or self.name)
