import frappe


def after_install():
    if not frappe.db.exists("DocType", "Site Theme Config"):
        return
    if not frappe.db.get_singles_dict("Site Theme Config"):
        cfg = frappe.new_doc("Site Theme Config")
        cfg.flags.ignore_permissions = True
        cfg.insert()
