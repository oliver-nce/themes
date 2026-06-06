"""Default Desk chrome CSS variable payload for new NCE Desk Theme installs."""

import json
import os

_FALLBACK_PAYLOAD = {
    "primary_color": "#2490EF",
    "brand_color": "#0089FF",
    "bg_color": "#f5f5f6",
    "fg_color": "#ffffff",
    "text_color": "#1f272e",
    "text_muted": "#687178",
    "text_light": "#b0bac0",
    "border_color": "#d1d8dd",
    "dark_border_color": "#8d99a6",
    "control_bg": "#f7fafc",
    "control_bg_on_gray": "#ffffff",
    "btn_default_bg": "#f7fafc",
    "awesomplete_hover_bg": "#f0f4f7",
    "btn_height": "28px",
    "border_radius": "6px",
    "border_radius_lg": "12px",
    "border_radius_full": "999px",
    "g_bar_color": "#2490EF",
    "g_bar_border": "#007be0",
    "g_progress_color": "#0070cc",
    "g_header_background": "#f3f3f3",
    "g_row_color": "#f8f8f8",
    "g_today_highlight": "#edf6fd",
}


def load_bundled_base_desk_theme_payload() -> dict:
    """Load bundled base desk theme from data/base_desk_theme.json, else embedded fallback."""
    path = os.path.join(os.path.dirname(__file__), "..", "data", "base_desk_theme.json")
    try:
        with open(path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return dict(_FALLBACK_PAYLOAD)


DESK_THEME_DEFAULT_PAYLOAD = load_bundled_base_desk_theme_payload()
