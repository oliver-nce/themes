"""NCE Desk Theme controller that allows one Default and one Active theme, then republishes desk CSS.

"""

# Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
import frappe
from frappe import _
from frappe.model.document import Document
from themes.utils.site_theme_config_helpers import get_site_base_desk_theme_name
from themes.utils.theme_doc import base_theme_json, in_setup, other_record, slugify_theme_name


class NCEDeskTheme(Document):
    def before_insert(self):
        if not self.theme_json:
            self.theme_json = base_theme_json("NCE Desk Theme", get_site_base_desk_theme_name()) or "{}"

    def before_save(self):
        if not self.slug or self.has_value_changed("theme_name"):
            self.slug = slugify_theme_name(self.theme_name)

    def validate(self):
        if self.is_default:
            other = other_record("NCE Desk Theme", {"is_default": 1}, self.name)
            if other:
                frappe.throw(_("Another desk theme is already marked default: {0}").format(other))

        if self.status == "Active":
            other = other_record("NCE Desk Theme", {"status": "Active"}, self.name)
            if other:
                frappe.throw(_("Another desk theme is already active: {0}").format(other))

    def on_update(self):
        if in_setup():
            return
        base = get_site_base_desk_theme_name()
        if self.has_value_changed("status") or self.status == "Active" or base == self.name:
            from themes.utils.desk_css_writer import publish_desk_theme

            publish_desk_theme(self.name)

    def on_trash(self):
        if in_setup():
            return
        base = get_site_base_desk_theme_name()
        if self.status == "Active" or base == self.name:
            from themes.utils.desk_css_writer import publish_desk_theme

            publish_desk_theme(base or self.name)
