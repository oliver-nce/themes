"""Desk asset helpers — cache-bust generated nce_theme.css via Site Theme Config css_hash."""

from __future__ import annotations

import frappe

NCE_THEME_CSS_PATH = "/assets/themes/css/nce_theme.css"
_PATCH_INSTALLED = False


def nce_theme_stylesheet_href() -> str:
    """Return the Desk stylesheet URL with ?v=css_hash when a theme has been published."""
    try:
        if not getattr(frappe, "db", None):
            return NCE_THEME_CSS_PATH
        css_hash = frappe.db.get_single_value("Site Theme Config", "css_hash")
    except Exception:
        css_hash = None
    if css_hash:
        return f"{NCE_THEME_CSS_PATH}?v={css_hash}"
    return NCE_THEME_CSS_PATH


def _rewrite_nce_theme_href(paths: list) -> list:
    href = nce_theme_stylesheet_href()
    out = []
    for path in paths:
        if isinstance(path, str) and "nce_theme.css" in path.split("?")[0]:
            out.append(href)
        else:
            out.append(path)
    return out


def install_get_hooks_patch() -> None:
    """Patch frappe.get_hooks so app_include_css includes css_hash cache busting."""
    global _PATCH_INSTALLED
    if _PATCH_INSTALLED:
        return

    _orig = frappe.get_hooks

    def get_hooks(hook=None, default=None, app_name=None):
        out = _orig(hook, default, app_name)
        if hook == "app_include_css" and isinstance(out, list):
            return _rewrite_nce_theme_href(out)
        return out

    frappe.get_hooks = get_hooks
    _PATCH_INSTALLED = True
