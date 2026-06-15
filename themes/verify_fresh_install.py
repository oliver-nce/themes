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
    default_name = frappe.get_all(
        "NCE Theme",
        filters={"is_default": 1},
        pluck="name",
        limit=1,
    )
    if not default_name:
        raise Exception("No NCE Theme marked is_default=1")
    theme = frappe.get_doc("NCE Theme", default_name[0])
    if not theme.is_default:
        raise Exception(f"NCE Theme {default_name[0]!r} is not marked is_default")
    if theme.theme_json is None:
        raise Exception(f"NCE Theme {default_name[0]!r} has no theme_json field")
    print(f"PASS: Default NCE Theme {default_name[0]!r} exists with theme_json")


def _check_base_theme():
    from themes.utils.site_theme_config_helpers import get_site_base_theme_name

    base = get_site_base_theme_name()
    default_name = frappe.get_all(
        "NCE Theme",
        filters={"is_default": 1},
        pluck="name",
        limit=1,
    )
    if not base:
        raise Exception("Site Theme Config.base_theme is not set")
    if not default_name:
        raise Exception("No NCE Theme marked is_default=1")
    if base != default_name[0]:
        raise Exception(
            f"base_theme {base!r} does not match is_default theme {default_name[0]!r}"
        )
    print(f"PASS: base_theme matches Default theme ({base!r})")


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
