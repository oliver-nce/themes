"""Initialize NCE Desk Theme Default and generate nce_desk_theme.css.

"""

import frappe

from themes.install import _ensure_base_desk_theme, _ensure_default_desk_theme, _print_css_file_status, _run_setup
from themes.utils.desk_css_writer import publish_desk_theme
from themes.utils.site_theme_config_helpers import get_site_base_desk_theme_name


def initialize_desk_theme():
    """Create Default desk theme if missing, set base_desk_theme, publish CSS."""
    default_name = _ensure_default_desk_theme()
    print(f"✓ NCE Desk Theme {default_name!r} ready")

    if _ensure_base_desk_theme(default_name):
        print(f"✓ Site Theme Config.base_desk_theme = {default_name!r}")
    else:
        print(
            f"✓ Site base desk theme already "
            f"{frappe.db.get_single_value('Site Theme Config', 'base_desk_theme')!r}"
        )

    base = get_site_base_desk_theme_name() or default_name
    result = publish_desk_theme(base)
    print(f"✓ Desk theme CSS published ({result['bytes']} bytes, hash {result['css_hash']})")
    _print_css_file_status("nce_desk_theme.css")
    frappe.clear_cache()
    print("✓ Cache cleared")
    return frappe.get_doc("NCE Desk Theme", default_name)


def execute():
    return _run_setup(initialize_desk_theme, "Desk theme")
