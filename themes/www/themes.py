"""Website context that sends guests to login except on public theme preview routes.

"""

import glob
import os
import re

import frappe

no_cache = 1


def _frontend_entry():
	"""Hashed Vite entry, so the editor does not also run a cached themes.js."""
	folder = os.path.join(frappe.get_app_path("themes"), "public", "frontend", "assets")
	matches = glob.glob(os.path.join(folder, "themes-entry-*.js"))
	if not matches:
		return "/assets/themes/frontend/assets/themes.js"
	name = os.path.basename(max(matches, key=os.path.getmtime))
	return f"/assets/themes/frontend/assets/{name}"


def _frontend_stylesheet():
	"""Stylesheet href written into the built editor index, including its content hash."""
	index = os.path.join(frappe.get_app_path("themes"), "public", "frontend", "index.html")
	try:
		html = open(index, encoding="utf-8").read()
	except OSError:
		return "/assets/themes/frontend/assets/themes.css"
	match = re.search(r'href="([^"]+\.css)"', html)
	return match.group(1) if match else "/assets/themes/frontend/assets/themes.css"


def get_context(context):
	"""Require login for theme editor routes; preview stays public. Home opens Desk."""
	context.frontend_entry = _frontend_entry()
	context.frontend_css = _frontend_stylesheet()
	context.home_page = "/desk"
	path = (frappe.request.path if getattr(frappe.local, "request", None) else "") or ""
	if path.rstrip("/").endswith("/preview"):
		return

	if frappe.session.user == "Guest":
		redirect_to = frappe.utils.quote(path or "/themes/theme-settings")
		frappe.local.flags.redirect_location = f"/login?redirect-to={redirect_to}"
		raise frappe.Redirect
