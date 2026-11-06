"""Default token payload for new NCE Theme installs."""

import json
import os

_FALLBACK_PAYLOAD = {'primary_color': '#1769BC', 'secondary_color': '#D5E1F9', 'accent_color': '#8B5CF6', 'success_color': '#10B981', 'info_color': '#3B82F6', 'warning_color': '#F59E0B', 'danger_color': '#EF4444', 'neutral_color': '#9099a4', 'text_color': '#004782', 'heading_color': '#003A90', 'muted_color': '#6B7280', 'link_color': '#3B82F6', 'focus_color': '#3B82F6', 'background_color': '#DEE9F7', 'surface_color': '#D6E2FB', 'border_color': '#6B7280', 'row_color': '#CBDFFF', 'row_alt_color': '#F4F5F6', 'table_header_bg_color': '#E5E7EB', 'table_row_divider_color': '#85B3FF', 'table_col_divider_color': '#85B3FF', 'font_family': 'Source Sans 3', 'heading_font_family': 'Public Sans', 'font_size': '14px', 'line_height': 'relaxed', 'font_weight_body': '690', 'font_weight_medium': '500', 'font_weight_semibold': '600', 'font_weight_bold': '700', 'hover_bg_shade': '100', 'hover_border_shade': '500', 'focus_ring_enabled': 0, 'focus_fill_enabled': 1, 'button_outline_enabled': 0, 'focus_ring_width': '2px', 'focus_ring_offset': '2px', 'disabled_opacity': '0.5', 'pressed_shift': '1px', 'btn_sm_font_size': '12px', 'btn_sm_pad_y': '2px', 'btn_sm_pad_x': '12px', 'btn_sm_min_height': '28px', 'btn_md_font_size': '14px', 'btn_md_pad_y': '4px', 'btn_md_pad_x': '20px', 'btn_md_min_height': '32px', 'btn_lg_font_size': '16px', 'btn_lg_pad_y': '8px', 'btn_lg_pad_x': '24px', 'btn_lg_min_height': '40px', 'border_radius': 'md', 'border_width_thin': '1px', 'border_width': '2px', 'border_width_strong': '3px', 'table_row_divider_width': 'normal', 'table_col_divider_width': 'normal', 'spacing_scale': 'relaxed', 'shadow': 'lg', 'shadow_color': '#85B3FF', 'shadow_opacity': 53, 'shadow_direction': 137, 'transition_speed': 'normal', 'sidebar_width': '240px', 'container_max_width': '1200px', 'tailwind_overrides': '', 'custom_css': '', 'dark_mode': 0, 'primary_color_gamma': -30, 'primary_color_saturation': 100, 'secondary_color_gamma': 0, 'secondary_color_saturation': 100, 'neutral_color_warmth': -78, 'neutral_color_shades': {'50': '#eef1f5', '100': '#d0dae6', '200': '#bbc5d1', '300': '#a7b1bc', '400': '#97a1ac', '500': '#939da7', '600': '#9099a4', '700': '#6e7781', '800': '#4b545d', '900': '#222a32', '950': '#000001'}, 'brand_palette_mode': 'flexible', 'primary_color_fg_flip_mono': 500}


def load_bundled_base_theme_payload() -> dict:
    """Load bundled base theme from data/base_theme.json, else embedded fallback."""
    path = os.path.join(os.path.dirname(__file__), "..", "data", "base_theme.json")
    try:
        with open(path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return dict(_FALLBACK_PAYLOAD)


# Import-time snapshot; install reads via load_bundled_base_theme_payload().
DEFAULT_THEME_PAYLOAD = load_bundled_base_theme_payload()
