"""Fresh-install verification for Task 13 step 6.

Run: bench --site <site> execute themes.verify_fresh_install.run
"""

import os

import frappe


def run():
    _check_site_theme_config_exists()
    _check_default_theme()
    _check_base_theme()
    _check_css_file()
    _check_css_hash()
    print("All fresh-install checks passed.")


def _check_site_theme_config_exists():
    if not frappe.db.exists("DocType", "Site Theme Config"):
        raise Exception("Site Theme Config DocType missing")
    cfg = frappe.get_single("Site Theme Config")
    if cfg is None:
        raise Exception("Site Theme Config single not created")
    print("PASS: Site Theme Config exists")


def _check_default_theme():
    if not frappe.db.exists("NCE Theme", "Default"):
        raise Exception("NCE Theme 'Default' not found")
    theme = frappe.get_doc("NCE Theme", "Default")
    if not theme.is_default:
        raise Exception("NCE Theme 'Default' is not marked is_default")
    if theme.theme_json is None:
        raise Exception("NCE Theme 'Default' has no theme_json field")
    print("PASS: NCE Theme Default exists with theme_json")


def _check_base_theme():
    from themes.utils.site_theme_config_helpers import get_site_base_theme_name

    base = get_site_base_theme_name()
    if base != "Default":
        raise Exception(
            f"Expected base_theme='Default', got {base!r}"
        )
    print("PASS: base_theme is Default")


def _check_css_file():
    app_path = frappe.get_app_path("themes")
    css_path = os.path.join(app_path, "public", "css", "nce_theme.css")
    if not os.path.isfile(css_path):
        raise Exception(f"nce_theme.css not found at {css_path}")
    if os.path.getsize(css_path) == 0:
        raise Exception("nce_theme.css is empty")
    print("PASS: nce_theme.css exists and is non-empty")


def _check_css_hash():
    cfg = frappe.get_single("Site Theme Config")
    if not cfg.css_hash:
        raise Exception("Site Theme Config css_hash is not set")
    print(f"PASS: css_hash is set ({cfg.css_hash})")
