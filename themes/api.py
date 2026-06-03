import frappe
from frappe import _
from themes.utils.css_writer import publish_version


@frappe.whitelist()
def set_active_theme(theme: str, version: str | None = None):
    """Switch the site to a different theme/version and regenerate nce_theme.css."""
    frappe.only_for("System Manager")
    if not frappe.db.exists("NCE Theme", theme):
        frappe.throw(_("NCE Theme {0} does not exist").format(theme))
    if not version:
        version = frappe.db.get_value(
            "Theme Version", {"parent_theme": theme, "published": 1}, "name"
        )
        if not version:
            frappe.throw(_("Theme {0} has no published version").format(theme))
    cfg = frappe.get_single("Site Theme Config")
    cfg.active_theme = theme
    cfg.active_version = version
    cfg.save()  # on_update triggers publish_version
    return {"status": "ok", "theme": theme, "version": version}


@frappe.whitelist()
def regenerate_theme_css():
    """Re-publish the currently active version (manual repair button)."""
    frappe.only_for("System Manager")
    cfg = frappe.get_single("Site Theme Config")
    if not cfg.active_version:
        frappe.throw(_("No active theme version set"))
    return publish_version(cfg.active_version)


@frappe.whitelist()
def list_themes():
    """Return all NCE Themes with their published version, for the switcher UI."""
    rows = frappe.get_all("NCE Theme", fields=["name", "theme_name", "is_default", "status"])
    for r in rows:
        r["published_version"] = frappe.db.get_value(
            "Theme Version", {"parent_theme": r["name"], "published": 1}, "name"
        )
    return rows
