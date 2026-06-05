import frappe

no_cache = 1


def get_context(context):
	"""Require login for theme editor routes; preview stays public."""
	path = (frappe.request.path if getattr(frappe.local, "request", None) else "") or ""
	if path.rstrip("/").endswith("/preview"):
		return

	if frappe.session.user == "Guest":
		redirect_to = frappe.utils.quote(path or "/themes/theme-settings")
		frappe.local.flags.redirect_location = f"/login?redirect-to={redirect_to}"
		raise frappe.Redirect
