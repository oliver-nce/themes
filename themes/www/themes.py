"""Website context that sends guests to login except on public theme preview routes.

code-index:begin
{
 "purpose": "Website context that sends guests to login except on public theme preview routes.",
 "read_when": "When theme editor pages are reachable without login or preview is wrongly blocked.",
 "gotchas": [
  "Preview paths stay public; every other themes route redirects Guest to login."
 ],
 "keywords": ["get_context", "no_cache", "Guest", "redirect-to", "preview", "theme-settings"],
 "format": 1
}
code-index:end
"""

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
