"""Force-sync the Themes workspace from app JSON and remove Theme Version links."""

from themes.utils.workspace_sync import sync_themes_workspace


def execute():
	sync_themes_workspace()
	print("Synced Themes workspace; removed Theme Version shortcuts and links.")
