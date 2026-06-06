"""Initialize NCE Desk Theme Default and generate nce_desk_theme.css."""

import json
import os

import frappe

from themes.install import _ensure_default_desk_theme
from themes.utils.desk_css_writer import publish_desk_theme
from themes.utils.site_theme_config_helpers import get_site_base_desk_theme_name


def initialize_desk_theme():
    """Create Default desk theme if missing, set base_desk_theme, publish CSS."""
    default_name = _ensure_default_desk_theme()
    print(f"✓ NCE Desk Theme {default_name!r} ready")

    cfg = frappe.get_single("Site Theme Config")
    if not cfg.base_desk_theme or not frappe.db.exists("NCE Desk Theme", cfg.base_desk_theme):
        cfg.base_desk_theme = default_name
        cfg.flags.ignore_permissions = True
        cfg.save()
        print(f"✓ Site Theme Config.base_desk_theme = {default_name!r}")
    else:
        print(f"✓ Site base desk theme already {cfg.base_desk_theme!r}")

    base = get_site_base_desk_theme_name() or default_name
    result = publish_desk_theme(base)
    print(f"✓ Desk theme CSS published ({result['bytes']} bytes, hash {result['css_hash']})")

    app_path = frappe.get_app_path("themes")
    css_file = os.path.join(app_path, "public", "css", "nce_desk_theme.css")
    if os.path.exists(css_file):
        print(f"✓ CSS file at: {css_file} ({os.path.getsize(css_file)} bytes)")
    else:
        print(f"✗ Warning: CSS file not found at: {css_file}")

    frappe.clear_cache()
    print("✓ Cache cleared")
    return frappe.get_doc("NCE Desk Theme", default_name)


def execute():
    try:
        doc = initialize_desk_theme()
        frappe.db.commit()
        print("\n✅ Desk theme initialization complete!")
        return doc
    except Exception as e:
        print(f"\n❌ Error during desk theme initialization: {e}")
        frappe.db.rollback()
        raise
