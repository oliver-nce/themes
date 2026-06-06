"""Write the bundled base desk theme into app source files (for git commit + new installs)."""

import json
import os

import frappe


def bundle_base_desk_theme_to_app(payload: dict) -> dict:
    """Persist payload to themes/data/base_desk_theme.json and refresh default_desk_theme.py fallback."""
    app_path = frappe.get_app_path("themes")
    data_dir = os.path.join(app_path, "data")
    os.makedirs(data_dir, exist_ok=True)

    json_path = os.path.join(data_dir, "base_desk_theme.json")
    with open(json_path, "w") as f:
        json.dump(payload, f, indent=2, sort_keys=True)
        f.write("\n")

    py_path = os.path.join(app_path, "utils", "default_desk_theme.py")
    with open(py_path, "w") as f:
        f.write(_default_desk_theme_py_source(payload))

    return {
        "base_desk_theme_json": json_path,
        "default_desk_theme_py": py_path,
        "bytes": os.path.getsize(json_path),
    }


def _default_desk_theme_py_source(payload: dict) -> str:
    fallback = repr(payload)
    return f'''"""Default Desk chrome CSS variable payload for new NCE Desk Theme installs."""

import json
import os

_FALLBACK_PAYLOAD = {fallback}


def load_bundled_base_desk_theme_payload() -> dict:
    """Load bundled base desk theme from data/base_desk_theme.json, else embedded fallback."""
    path = os.path.join(os.path.dirname(__file__), "..", "data", "base_desk_theme.json")
    try:
        with open(path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return dict(_FALLBACK_PAYLOAD)


DESK_THEME_DEFAULT_PAYLOAD = load_bundled_base_desk_theme_payload()
'''
