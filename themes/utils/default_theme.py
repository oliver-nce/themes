"""Default token payload for new NCE Theme installs."""

import json
import os

_FALLBACK_PAYLOAD = {
    "primary_color": "#3B82F6",
    "secondary_color": "#10B981",
    "accent_color": "#8B5CF6",
    "success_color": "#10B981",
    "info_color": "#3B82F6",
    "warning_color": "#F59E0B",
    "danger_color": "#EF4444",
    "text_color": "#1F2937",
    "heading_color": "#111827",
    "muted_color": "#6B7280",
    "link_color": "#3B82F6",
    "focus_color": "#3B82F6",
    "background_color": "#FFFFFF",
    "surface_color": "#F9FAFB",
    "border_color": "#E5E7EB",
    "row_alt_color": "#F3F4F6",
    "shadow_color": "#000000",
    "font_family": "System Default",
    "heading_font_family": "System Default",
    "font_size": "14px",
    "line_height": "normal",
    "font_weight_body": "400",
    "border_radius": "md",
    "spacing_scale": "normal",
    "shadow": "md",
    "transition_speed": "normal",
    "sidebar_width": "240px",
    "container_max_width": "1200px",
}


def load_bundled_base_theme_payload() -> dict:
    """Load bundled base theme from data/base_theme.json, else embedded fallback."""
    path = os.path.join(os.path.dirname(__file__), "..", "data", "base_theme.json")
    try:
        with open(path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return dict(_FALLBACK_PAYLOAD)


DEFAULT_THEME_PAYLOAD = load_bundled_base_theme_payload()
