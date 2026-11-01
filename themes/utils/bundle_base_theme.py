"""Write bundled base web and desk themes into app source files (for git commit + new installs).

"""

import json
import os

import frappe


def bundle_base_theme_to_app(payload: dict) -> dict:
    """Persist payload to themes/data/base_theme.json and refresh default_theme.py fallback."""
    json_path, py_path = _write_bundle(
        payload,
        "base_theme.json",
        "default_theme.py",
        _default_theme_py_source(payload),
    )
    return {
        "base_theme_json": json_path,
        "default_theme_py": py_path,
        "bytes": os.path.getsize(json_path),
    }


def bundle_base_desk_theme_to_app(payload: dict) -> dict:
    """Persist payload to themes/data/base_desk_theme.json and refresh default_desk_theme.py fallback."""
    json_path, py_path = _write_bundle(
        payload,
        "base_desk_theme.json",
        "default_desk_theme.py",
        _default_desk_theme_py_source(payload),
    )
    return {
        "base_desk_theme_json": json_path,
        "default_desk_theme_py": py_path,
        "bytes": os.path.getsize(json_path),
    }


def _write_bundle(payload, json_filename, py_filename, py_source) -> tuple[str, str]:
    app_path = frappe.get_app_path("themes")
    data_dir = os.path.join(app_path, "data")
    os.makedirs(data_dir, exist_ok=True)

    json_path = os.path.join(data_dir, json_filename)
    with open(json_path, "w") as f:
        json.dump(payload, f, indent=2, sort_keys=True)
        f.write("\n")

    py_path = os.path.join(app_path, "utils", py_filename)
    with open(py_path, "w") as f:
        f.write(py_source)

    return (json_path, py_path)


def _default_py_module_source(
    payload: dict,
    *,
    module_docstring: str,
    loader_fn_name: str,
    loader_fn_docstring: str,
    json_basename: str,
    top_level_constant: str,
    constant_leading_comment: str | None = None,
) -> str:
    fallback = repr(payload)
    if constant_leading_comment:
        suffix = (
            f"\n\n{constant_leading_comment}\n"
            f"{top_level_constant} = {loader_fn_name}()\n"
        )
    else:
        suffix = f"\n\n{top_level_constant} = {loader_fn_name}()\n"
    return f'''"""{module_docstring}"""

import json
import os

_FALLBACK_PAYLOAD = {fallback}


def {loader_fn_name}() -> dict:
    """{loader_fn_docstring}"""
    path = os.path.join(os.path.dirname(__file__), "..", "data", "{json_basename}")
    try:
        with open(path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return dict(_FALLBACK_PAYLOAD)
{suffix}'''


def _default_theme_py_source(payload: dict) -> str:
    return _default_py_module_source(
        payload,
        module_docstring="Default token payload for new NCE Theme installs.",
        loader_fn_name="load_bundled_base_theme_payload",
        loader_fn_docstring=(
            "Load bundled base theme from data/base_theme.json, else embedded fallback."
        ),
        json_basename="base_theme.json",
        top_level_constant="DEFAULT_THEME_PAYLOAD",
        constant_leading_comment=(
            "# Import-time snapshot; install reads via load_bundled_base_theme_payload()."
        ),
    )


def _default_desk_theme_py_source(payload: dict) -> str:
    return _default_py_module_source(
        payload,
        module_docstring="Default Desk chrome CSS variable payload for new NCE Desk Theme installs.",
        loader_fn_name="load_bundled_base_desk_theme_payload",
        loader_fn_docstring=(
            "Load bundled base desk theme from data/base_desk_theme.json, else embedded fallback."
        ),
        json_basename="base_desk_theme.json",
        top_level_constant="DESK_THEME_DEFAULT_PAYLOAD",
    )
