"""Default token payload for new NCE Theme installs."""

import json
import os

_FALLBACK_PAYLOAD = {
    "brand_palette_mode": "corporate",
    "primary_color": "#3B82F6",
    "secondary_color": "#10B981",
    "accent_color": "#8B5CF6",
    "success_color": "#10B981",
    "info_color": "#3B82F6",
    "warning_color": "#F59E0B",
    "danger_color": "#EF4444",
    "neutral_color_warmth": 0,
    "neutral_color": "#989898",
    "neutral_color_shades": {
        "50": "#f1f1f1",
        "100": "#d9d9d9",
        "200": "#c4c4c4",
        "300": "#afafaf",
        "400": "#a0a0a0",
        "500": "#9b9b9b",
        "600": "#989898",
        "700": "#767676",
        "800": "#525252",
        "900": "#292929",
        "950": "#000000",
    },
    "text_color": "#1F2937",
    "heading_color": "#111827",
    "muted_color": "#6B7280",
    "link_color": "#3B82F6",
    "focus_color": "#3B82F6",
    "background_color": "#FFFFFF",
    "surface_color": "#F9FAFB",
    "border_color": "#E5E7EB",
    "row_color": "#F9FAFB",
    "row_alt_color": "#F3F4F6",
    "table_header_bg_color": "#10B981",
    "table_row_divider_color": "#E5E7EB",
    "table_col_divider_color": "#E5E7EB",
    "table_row_divider_width": "thin",
    "table_col_divider_width": "thin",
    "shadow_color": "#000000",
    "font_family": "System Default",
    "heading_font_family": "System Default",
    "font_size": "14px",
    "line_height": "normal",
    "font_weight_body": "400",
    "border_radius": "md",
    "border_width_thin": "0.5px",
    "border_width": "1px",
    "border_width_strong": "2px",
    "spacing_scale": "normal",
    "shadow": "md",
    "shadow_opacity": 100,
    "shadow_direction": 180,
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
