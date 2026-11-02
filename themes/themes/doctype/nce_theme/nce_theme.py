"""NCE Theme controller — republishes web CSS on update or trash.

"""

# Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
import frappe
from frappe import _
from frappe.model.document import Document
from themes.utils.site_theme_config_helpers import get_site_base_theme_name
from themes.utils.theme_doc import base_theme_json, in_setup, slugify_theme_name


class NCETheme(Document):
    def before_insert(self):
        if not self.theme_json:
            self.theme_json = base_theme_json("NCE Theme", get_site_base_theme_name()) or "{}"

    def before_save(self):
        if not self.slug or self.has_value_changed("theme_name"):
            self.slug = slugify_theme_name(self.theme_name)

    def on_update(self):
        if in_setup():
            return
        if self.has_value_changed("status") or self.status == "Active":
            from themes.utils.css_writer import publish_theme

            publish_theme(self.name)

    def on_trash(self):
        if in_setup():
            return
        from themes.component_api import theme_app_slugs

        slug = (self.slug or "").strip()
        if slug:
            apps = [app for app, chosen in theme_app_slugs().items() if chosen == slug]
            if apps:
                frappe.throw(
                    _(
                        "Cannot delete this theme: its slug {0} is assigned to app(s): {1}"
                    ).format(slug, ", ".join(sorted(apps)))
                )
        was_active = self.status == "Active"
        if was_active:
            from themes.utils.css_writer import publish_theme

            publish_theme(self.name)
