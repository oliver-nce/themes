"""Reads the installed Frappe major version and whether it is v16 or later.

code-index:begin
{
 "purpose": "Reads the installed Frappe major version and whether it is v16 or later.",
 "read_when": "When theme code must branch between Frappe 15 and 16 behaviour.",
 "gotchas": [],
 "keywords": ["get_frappe_major_version", "is_v16_or_later", "frappe.__version__", "major version"],
 "format": 1
}
code-index:end
"""

import frappe


def get_frappe_major_version():
	"""Return the major version number of the installed Frappe framework."""
	try:
		return int(frappe.__version__.split(".")[0])
	except (ValueError, IndexError, AttributeError):
		return 15


def is_v16_or_later():
	"""Check if the running Frappe version is 16 or later."""
	return get_frappe_major_version() >= 16
