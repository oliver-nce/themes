import frappe
from themes.utils.css_writer import publish_theme


def execute():
    """Copy Theme Version JSON onto NCE Theme.theme_json and drop active_version pointer."""
    if not frappe.db.has_column("NCE Theme", "theme_json"):
        print("NCE Theme.theme_json column not present yet — skipping.")
        return

    if not frappe.db.exists("DocType", "Theme Version"):
        print("Theme Version DocType not present — nothing to collapse.")
        return

    for theme_name in frappe.get_all("NCE Theme", pluck="name"):
        existing = frappe.db.get_value("NCE Theme", theme_name, "theme_json") or ""
        if existing.strip() and existing.strip() != "{}":
            continue
        theme_json = frappe.db.get_value(
            "Theme Version",
            {"parent_theme": theme_name, "published": 1},
            "theme_json",
        )
        if not theme_json:
            versions = frappe.get_all(
                "Theme Version",
                filters={"parent_theme": theme_name},
                fields=["theme_json"],
                order_by="version_no desc",
                limit_page_length=1,
            )
            theme_json = versions[0].theme_json if versions else None
        if theme_json:
            frappe.db.set_value("NCE Theme", theme_name, "theme_json", theme_json)

    cfg = frappe.get_single("Site Theme Config")
    if cfg.active_version:
        frappe.db.set_single_value("Site Theme Config", "active_version", None)

    if cfg.active_theme:
        publish_theme(cfg.active_theme)

    frappe.db.commit()
    print("Collapsed Theme Version payloads onto NCE Theme.theme_json")
