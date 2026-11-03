"""One-shot fix for stale Themes workspace — run on any site after Theme Version removal.

Not importable as a module (scripts/ is not a package), so `bench execute` cannot
reach it. Run it through the console:

    echo 'import runpy; runpy.run_path(frappe.get_app_path("themes", "..", "scripts", "workspace_fix.py"))["run"]()' \\
      | bench --site <site> console

"""

from themes.utils.workspace_sync import sync_themes_workspace


def run():
	sync_themes_workspace()
	print("Themes workspace fixed: Theme Version shortcuts removed, workspace re-imported.")
