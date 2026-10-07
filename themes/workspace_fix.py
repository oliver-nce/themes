"""One-shot fix for stale Themes workspace — run on any site after Theme Version removal.

bench --site <site> execute themes.workspace_fix.run

code-index:begin
{
 "purpose": "One-shot site command that rebuilds the Themes workspace after Theme Version removal.",
 "read_when": "When the desk still shows stale Theme Version shortcuts in the Themes workspace.",
 "gotchas": [],
 "keywords": ["workspace_fix", "sync_themes_workspace", "Theme Version", "bench", "execute"],
 "format": 1
}
code-index:end
"""

from themes.utils.workspace_sync import sync_themes_workspace


def run():
	sync_themes_workspace()
	print("Themes workspace fixed: Theme Version shortcuts removed, workspace re-imported.")
