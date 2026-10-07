"""Seed Default NCE Desk Theme + base_desk_theme for sites that already ran the no-op field patch.

code-index:begin
{
 "purpose": "Re-runs the desk theme seed for sites whose earlier field patch did nothing.",
 "read_when": "When Default NCE Desk Theme was never created because the field patch no-oped.",
 "gotchas": [],
 "keywords": ["Default NCE Desk Theme", "base_desk_theme", "no-op", "add_base_desk_theme_field", "execute"],
 "format": 1
}
code-index:end
"""

from themes.patches.v1_0.add_base_desk_theme_field import execute
