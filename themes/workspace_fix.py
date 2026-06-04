"""One-shot fix for stale Themes workspace — run on any site after Theme Version removal.

bench --site <site> execute themes.workspace_fix.run
"""

from themes.utils.workspace_sync import sync_themes_workspace


def run():
	sync_themes_workspace()
	print("Themes workspace fixed: Theme Version shortcuts removed, workspace re-imported.")
