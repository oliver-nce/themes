"""Desk boot extensions — fresh theme CSS URLs without bench restart.

code-index:begin
{
 "purpose": "Desk boot hook that exposes the current desk theme CSS URL each session.",
 "read_when": "When the desk is not picking up a freshly published theme stylesheet.",
 "gotchas": [],
 "keywords": ["extend_bootinfo", "desk_theme_css_url", "bootinfo", "publish hash", "bench restart"],
 "format": 1
}
code-index:end
"""

from __future__ import annotations

from themes.utils.desk_css_writer import get_desk_theme_css_url


def extend_bootinfo(bootinfo):
	"""Expose a desk CSS URL with the current publish hash (read each session)."""
	url = get_desk_theme_css_url()
	if url:
		bootinfo.desk_theme_css_url = url
