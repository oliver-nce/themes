"""Initialize NCE Theme Default and generate nce_theme.css."""

import json
import os

import frappe

from themes.utils.css_writer import publish_theme
from themes.utils.default_theme import load_bundled_base_theme_payload
from themes.utils.site_theme_config_helpers import get_site_base_theme_name, set_site_base_theme_name


def initialize_theme():
    """Create or update NCE Theme Default and publish CSS."""
    if not frappe.db.exists("NCE Theme", "Default"):
        print("Creating NCE Theme Default with default values...")
        theme = frappe.new_doc("NCE Theme")
        theme.theme_name = "Default"
        theme.is_default = 1
        theme.status = "Active"
        theme.description = "Default site theme."
        theme.theme_json = json.dumps(load_bundled_base_theme_payload(), default=str)
        theme.flags.ignore_permissions = True
        theme.insert()
        print("✓ NCE Theme Default created")
    else:
        print("NCE Theme Default already exists, republishing CSS...")
        theme = frappe.get_doc("NCE Theme", "Default")

    cfg = frappe.get_single("Site Theme Config")
    base = get_site_base_theme_name() or theme.name
    if not get_site_base_theme_name():
        set_site_base_theme_name(theme.name)
        base = theme.name

    result = publish_theme(base)
    print(f"✓ Theme CSS published ({result['bytes']} bytes, hash {result['css_hash']})")

    app_path = frappe.get_app_path("themes")
    css_file = os.path.join(app_path, "public", "css", "nce_theme.css")
    if os.path.exists(css_file):
        print(f"✓ CSS file at: {css_file} ({os.path.getsize(css_file)} bytes)")
    else:
        print(f"✗ Warning: CSS file not found at: {css_file}")

    frappe.clear_cache()
    print("✓ Cache cleared")
    return theme


def execute():
    try:
        doc = initialize_theme()
        frappe.db.commit()
        print("\n✅ Theme initialization complete!")
        return doc
    except Exception as e:
        print(f"\n❌ Error during theme initialization: {e}")
        frappe.db.rollback()
        raise
