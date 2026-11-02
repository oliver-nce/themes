"""Desk boot extensions — fresh theme CSS URLs without bench restart.

"""

from __future__ import annotations

from themes.utils.desk_css_writer import get_desk_theme_css_url


def extend_bootinfo(bootinfo):
	"""Expose a desk CSS URL with the current publish hash (read each session)."""
	url = get_desk_theme_css_url()
	if url:
		bootinfo.desk_theme_css_url = url
	try:
		from themes.component_api import can_design, design_mode_enabled

		if design_mode_enabled() and can_design():
			bootinfo.nce_design_mode = {"enabled": True}
	except Exception:
		pass
	try:
		from themes.component_api import bridge_apps, theme_off_apps

		bootinfo.nce_theme_disabled_apps = sorted(theme_off_apps())
		bootinfo.nce_bridge_apps = sorted(bridge_apps())
	except Exception:
		pass
