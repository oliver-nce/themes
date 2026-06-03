import json
import os
import hashlib
import frappe
from themes.utils.theme_color_utils import (
    BORDER_RADIUS_MAP, SPACING_SCALE_MAP, LINE_HEIGHT_MAP,
    TRANSITION_MAP, _build_shadow, _generate_shades,
)

COLOR_FIELDS = {
    "primary_color": "color-primary",
    "secondary_color": "color-secondary",
    "accent_color": "color-accent",
    "success_color": "color-success",
    "info_color": "color-info",
    "warning_color": "color-warning",
    "danger_color": "color-danger",
    "text_color": "color-text",
    "heading_color": "color-heading",
    "muted_color": "color-muted",
    "link_color": "color-link",
    "focus_color": "color-focus",
    "background_color": "color-bg",
    "surface_color": "color-surface",
    "border_color": "color-border",
    "row_alt_color": "color-row-alt",
}

SHADE_SCALE_FIELDS = {
    "primary_color": "color-primary",
    "secondary_color": "color-secondary",
    "accent_color": "color-accent",
    "success_color": "color-success",
    "info_color": "color-info",
    "warning_color": "color-warning",
    "danger_color": "color-danger",
}

MIGRATED_FIELDS = list(COLOR_FIELDS.keys()) + [
    "font_family", "heading_font_family", "font_size", "line_height",
    "font_weight_body", "border_radius", "spacing_scale", "shadow",
    "shadow_color", "transition_speed", "sidebar_width",
    "container_max_width", "tailwind_overrides", "custom_css",
]

# SPA editor payload keys (MIGRATED_FIELDS + stored-but-not-CSS fields)
TOKEN_FIELDS = MIGRATED_FIELDS + ["dark_mode"]


def generate_css(payload: dict) -> str:
    """Build the full :root { --nce-* } CSS block from a token payload dict."""
    g = payload.get
    lines = [":root {", "", "\t/* ── Theme: canonical variables ── */"]
    for f, var in COLOR_FIELDS.items():
        v = g(f)
        if v:
            lines.append(f"\t--nce-{var}: {v};")
    lines += ["", "\t/* ── Shade scales (50–950) ── */"]
    for f, var in SHADE_SCALE_FIELDS.items():
        v = g(f)
        if not v:
            continue
        for shade_num, shade_hex in _generate_shades(v):
            lines.append(f"\t--nce-{var}-{shade_num}: {shade_hex};")
    ff = g("font_family")
    lines.append(
        f"\t--nce-font-family: "
        + (f"'{ff}', sans-serif" if ff and ff != "System Default"
           else "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif")
        + ";"
    )
    hf = g("heading_font_family")
    lines.append(
        f"\t--nce-font-heading: "
        + (f"'{hf}', sans-serif" if hf and hf != "System Default"
           else "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif")
        + ";"
    )
    lines.append(f"\t--nce-font-size: {g('font_size') or '14px'};")
    lines.append(f"\t--nce-font-weight: {g('font_weight_body') or '400'};")
    lines.append(f"\t--nce-line-height: {LINE_HEIGHT_MAP.get(g('line_height') or 'normal', '1.5')};")
    lines.append(f"\t--nce-border-radius: {BORDER_RADIUS_MAP.get(g('border_radius') or 'md', '0.375rem')};")
    lines.append(f"\t--nce-spacing-base: {SPACING_SCALE_MAP.get(g('spacing_scale') or 'normal', '1rem')};")
    sc = g("shadow_color") or "#000000"
    lines.append(f"\t--nce-shadow-color: {sc};")
    lines.append(f"\t--nce-shadow: {_build_shadow(g('shadow') or 'md', sc)};")
    lines.append(f"\t--nce-transition-speed: {TRANSITION_MAP.get(g('transition_speed') or 'normal', '200ms')};")
    if g("sidebar_width"):
        lines.append(f"\t--nce-sidebar-width: {g('sidebar_width')};")
    if g("container_max_width"):
        cw = "100%" if g("container_max_width") == "full" else g("container_max_width")
        lines.append(f"\t--nce-container-max-width: {cw};")
    if g("tailwind_overrides"):
        try:
            for k, v in json.loads(g("tailwind_overrides")).items():
                lines.append(f"\t--nce-{k}: {v};")
        except (json.JSONDecodeError, TypeError):
            pass
    lines.append("}")
    if g("custom_css"):
        lines += ["", g("custom_css")]
    return "\n".join(lines)


def _write_css_file(css: str) -> str:
    app_path = frappe.get_app_path("themes")
    css_dir = os.path.join(app_path, "public", "css")
    os.makedirs(css_dir, exist_ok=True)
    path = os.path.join(css_dir, "nce_theme.css")
    with open(path, "w") as f:
        f.write(css)
    return path


def publish_theme(theme_name: str) -> dict:
    """Read an NCE Theme, regenerate nce_theme.css, update Site Theme Config."""
    theme = frappe.get_doc("NCE Theme", theme_name)
    payload = json.loads(theme.theme_json or "{}")
    css = generate_css(payload)
    _write_css_file(css)
    css_hash = hashlib.sha1(css.encode("utf-8")).hexdigest()[:8]
    frappe.db.set_single_value("Site Theme Config", "css_hash", css_hash)
    frappe.clear_cache()
    return {"status": "ok", "theme": theme_name, "css_hash": css_hash, "bytes": len(css)}
