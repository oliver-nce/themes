"""Initialize NCE Theme Default and generate nce_theme.css.

"""

import frappe

from themes.install import _ensure_default_theme, _print_css_file_status, _run_setup
from themes.utils.css_writer import publish_theme
from themes.utils.site_theme_config_helpers import get_site_base_theme_name, set_site_base_theme_name


def initialize_theme():
    """Create or update NCE Theme Default and publish CSS."""
    existed = frappe.db.exists("NCE Theme", "Default")
    if existed:
        print("NCE Theme Default already exists, republishing CSS...")
    else:
        print("Creating NCE Theme Default with default values...")
    name = _ensure_default_theme()
    if not existed:
        print("✓ NCE Theme Default created")
    theme = frappe.get_doc("NCE Theme", name)
    base = get_site_base_theme_name()
    if not base:
        set_site_base_theme_name(theme.name)
        base = theme.name
    result = publish_theme(base)
    print(f"✓ Theme CSS published ({result['bytes']} bytes, hash {result['css_hash']})")
    _print_css_file_status("nce_theme.css")
    frappe.clear_cache()
    print("✓ Cache cleared")
    return theme


def execute():
    return _run_setup(initialize_theme, "Theme")
