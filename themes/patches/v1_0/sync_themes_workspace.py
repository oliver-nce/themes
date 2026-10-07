"""Force-sync the Themes workspace from app JSON and remove Theme Version links.

code-index:begin
{
 "purpose": "Reimports the Themes workspace and removes leftover Theme Version links.",
 "read_when": "When the Themes workspace still shows Theme Version shortcuts after the migration.",
 "gotchas": [],
 "keywords": ["sync_themes_workspace", "Theme Version", "workspace", "execute"],
 "format": 1
}
code-index:end
"""

from themes.utils.workspace_sync import sync_themes_workspace


def execute():
	sync_themes_workspace()
	print("Synced Themes workspace; removed Theme Version shortcuts and links.")
