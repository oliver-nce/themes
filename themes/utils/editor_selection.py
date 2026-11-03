# Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
"""Per-user last-opened theme for Site and Desk theme editors (frappe.defaults)."""

from __future__ import annotations

import frappe

WEB_EDITOR_THEME_KEY = "nce_editor_theme"
DESK_EDITOR_THEME_KEY = "nce_editor_desk_theme"


def editor_selection_key(*, desk: bool) -> str:
    return DESK_EDITOR_THEME_KEY if desk else WEB_EDITOR_THEME_KEY


def get_last_editor_theme(*, desk: bool = False) -> str:
    """Return the user's last editor theme name, or empty string when unset."""
    value = frappe.defaults.get_user_default(editor_selection_key(desk=desk))
    if not value:
        return ""
    return str(value)


def set_last_editor_theme(theme_name: str, *, desk: bool = False) -> None:
    """Remember which theme document the editor should open for this user."""
    name = (theme_name or "").strip()
    if not name:
        return
    frappe.defaults.set_user_default(editor_selection_key(desk=desk), name)
