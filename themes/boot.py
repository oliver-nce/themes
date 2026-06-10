"""Desk boot extensions — fresh theme CSS URLs without bench restart."""

from __future__ import annotations

from themes.utils.desk_css_writer import get_desk_theme_css_url


def extend_bootinfo(bootinfo):
	"""Expose a desk CSS URL with the current publish hash (read each session)."""
	url = get_desk_theme_css_url()
	if url:
		bootinfo.desk_theme_css_url = url
