import json
import os
import hashlib
import frappe
from themes.utils.theme_color_utils import (
    BORDER_RADIUS_MAP, SPACING_SCALE_MAP, LINE_HEIGHT_MAP,
    TRANSITION_MAP, _build_shadow, _generate_shades,
    pick_fg_mono, pick_fg_tonal,
)

CURATED_SHADES = (100, 200, 300, 500, 600, 700, 900)
FG_ROLES = (
    "primary_color", "secondary_color", "accent_color",
    "success_color", "info_color", "warning_color", "danger_color",
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
TOKEN_FIELDS = MIGRATED_FIELDS + [
    "dark_mode",
    "primary_color_gamma",
    "primary_color_saturation",
    "secondary_color_gamma",
    "secondary_color_saturation",
]


def _emit_root_block(g, lines):
    """Emit :root { --nce-* } and optional custom_css."""
    lines.extend([":root {", "", "\t/* ── Theme: canonical variables ── */"])
    for f, var in COLOR_FIELDS.items():
        v = g(f)
        if v:
            lines.append(f"\t--nce-{var}: {v};")
    for f, var in COLOR_FIELDS.items():
        if f not in FG_ROLES:
            continue
        v = g(f)
        if not v:
            continue
        lines.append(f"\t--nce-{var}-fg: {pick_fg_mono(v)};")
        lines.append(f"\t--nce-{var}-fg-tonal: {pick_fg_tonal(v)};")
    lines += ["", "\t/* ── Shade scales (50–950) ── */"]
    for f, var in SHADE_SCALE_FIELDS.items():
        v = g(f)
        if not v:
            continue
        gamma = g(f"{f}_gamma") or 0
        saturation = g(f"{f}_saturation")
        if saturation is None:
            saturation = 100
        for shade_num, shade_hex in _generate_shades(v, gamma=gamma, saturation=saturation):
            lines.append(f"\t--nce-{var}-{shade_num}: {shade_hex};")
            if shade_num in CURATED_SHADES:
                lines.append(f"\t--nce-{var}-{shade_num}-fg: {pick_fg_mono(shade_hex)};")
                lines.append(f"\t--nce-{var}-{shade_num}-fg-tonal: {pick_fg_tonal(shade_hex)};")
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
    lines.append("")


def _emit_role_bg_classes(g, lines):
    """Default fg pairing for bare .bg-{role} classes."""
    lines.append("/* ── Default fg pairing for bare role classes ── */")
    for f, var in COLOR_FIELDS.items():
        if f not in FG_ROLES:
            continue
        if not g(f):
            continue
        role = var.replace("color-", "")
        lines.append(
            f".bg-{role} {{ background-color: var(--nce-{var}); color: var(--nce-{var}-fg); }}"
        )
    lines.append("")


def _emit_role_text_border_classes(g, lines):
    """Per-role text-color, border-color, and explicit fg variants."""
    lines.append("/* ── Per-role text/border + explicit fg classes ── */")
    for field, var in COLOR_FIELDS.items():
        if field not in FG_ROLES or not g(field):
            continue
        role = var.replace("color-", "")
        lines.append(f".text-{role} {{ color: var(--nce-{var}); }}")
        lines.append(f".border-{role} {{ border-color: var(--nce-{var}); }}")
        lines.append(f".text-{role}-fg {{ color: var(--nce-{var}-fg); }}")
        lines.append(f".text-{role}-fg-tonal {{ color: var(--nce-{var}-fg-tonal); }}")
    lines.append("")


def _emit_role_shade_classes(g, lines):
    """Per-role per-curated-shade utility classes."""
    lines.append("/* ── Per-role per-curated-shade utility classes ── */")
    for field, var in SHADE_SCALE_FIELDS.items():
        if not g(field):
            continue
        role = var.replace("color-", "")
        for shade in CURATED_SHADES:
            lines.append(
                f".bg-{role}-{shade} {{ "
                f"background-color: var(--nce-{var}-{shade}); "
                f"color: var(--nce-{var}-{shade}-fg); }}"
            )
            lines.append(f".text-{role}-{shade} {{ color: var(--nce-{var}-{shade}); }}")
            lines.append(f".text-{role}-{shade}-fg {{ color: var(--nce-{var}-{shade}-fg); }}")
            lines.append(f".text-{role}-{shade}-fg-tonal {{ color: var(--nce-{var}-{shade}-fg-tonal); }}")
            lines.append(f".border-{role}-{shade} {{ border-color: var(--nce-{var}-{shade}); }}")
    lines.append("")


def _emit_neutral_classes(g, lines):
    """Neutral surfaces, semantic chrome aliases, text/border roles."""
    lines.append("/* ── Neutral surfaces, semantic chrome aliases, text/border roles ── */")
    if g("background_color"):
        lines.append(".bg-bg-page { background-color: var(--nce-color-bg); }")
    if g("surface_color"):
        lines.append(".bg-surface { background-color: var(--nce-color-surface); }")
        lines.append(".bg-card { background-color: var(--nce-color-surface); }")
    if g("row_alt_color"):
        lines.append(".bg-row-alt { background-color: var(--nce-color-row-alt); }")
    if g("primary_color"):
        lines.append(
            ".bg-header { background-color: var(--nce-color-primary); "
            "color: var(--nce-color-primary-fg); }"
        )
        lines.append(".text-text-header { color: var(--nce-color-primary-fg); }")
    if g("heading_color"):
        lines.append(".text-heading { color: var(--nce-color-heading); }")
    if g("muted_color"):
        lines.append(".text-muted { color: var(--nce-color-muted); }")
    if g("link_color"):
        lines.append(".text-link { color: var(--nce-color-link); }")
    if g("border_color"):
        lines.append(
            ".border { border-width: 1px; border-style: solid; "
            "border-color: var(--nce-color-border); }"
        )
        lines.append(".border-input-border { border-color: var(--nce-color-border); }")
    if g("focus_color"):
        lines.append(".border-input-focus { border-color: var(--nce-color-focus); }")
    lines.append("")


def _emit_shape_classes(lines):
    """Border-radius, box-shadow, and transition-duration classes."""
    lines.append("/* ── Shape + motion classes ── */")
    lines.append(".rounded { border-radius: var(--nce-border-radius); }")
    lines.append(".rounded-sm { border-radius: calc(var(--nce-border-radius) * 0.5); }")
    lines.append(".rounded-md { border-radius: var(--nce-border-radius); }")
    lines.append(".rounded-lg { border-radius: calc(var(--nce-border-radius) * 1.5); }")
    lines.append(".rounded-xl { border-radius: calc(var(--nce-border-radius) * 2); }")
    lines.append(".shadow { box-shadow: var(--nce-shadow); }")
    lines.append(".shadow-theme { box-shadow: var(--nce-shadow); }")
    lines.append(".duration-theme { transition-duration: var(--nce-transition-speed); }")
    lines.append("")


def _emit_typography_classes(g, lines):
    """Font family + font size classes."""
    lines.append("/* ── Typography classes (font family + sizes) ── */")
    if g("font_family"):
        lines.append(".font-sans { font-family: var(--nce-font-family); }")
    if g("heading_font_family"):
        lines.append(".font-heading { font-family: var(--nce-font-heading); }")
    size_multipliers = [
        ("xs", "0.75"), ("sm", "0.875"),
        ("base", None),
        ("lg", "1.125"), ("xl", "1.25"),
        ("2xl", "1.5"), ("3xl", "1.875"), ("4xl", "2.25"),
    ]
    for name, mul in size_multipliers:
        if mul is None:
            lines.append(f".text-{name} {{ font-size: var(--nce-font-size); }}")
        else:
            lines.append(
                f".text-{name} {{ font-size: calc(var(--nce-font-size) * {mul}); }}"
            )
    lines.append("")


def _emit_spacing_classes(lines):
    """Uniform padding/margin/gap classes at xs/sm/md/lg/xl sizes."""
    lines.append("/* ── Spacing classes (uniform p/m/gap) ── */")
    spacing_multipliers = [
        ("xs", "0.25"), ("sm", "0.5"),
        ("md", None),
        ("lg", "1.5"), ("xl", "2"),
    ]
    for name, mul in spacing_multipliers:
        if mul is None:
            v = "var(--nce-spacing-base)"
        else:
            v = f"calc(var(--nce-spacing-base) * {mul})"
        lines.append(f".p-{name} {{ padding: {v}; }}")
        lines.append(f".m-{name} {{ margin: {v}; }}")
        lines.append(f".gap-{name} {{ gap: {v}; }}")
    lines.append("")


def _emit_bg_themed(lines):
    """Dynamic-shade escape hatch."""
    lines.append("/* ── Dynamic-shade escape hatch ── */")
    lines.append(".bg-themed { background-color: var(--bg, var(--nce-color-primary));")
    lines.append(
        "  color: oklch(from var(--bg, var(--nce-color-primary)) calc((l - 0.62) * -infinity) 0 0); }"
    )


def generate_css(payload: dict) -> str:
    """Build the full nce_theme.css content from a token payload dict."""
    g = payload.get
    lines = []
    _emit_root_block(g, lines)
    _emit_role_bg_classes(g, lines)
    _emit_role_text_border_classes(g, lines)
    _emit_role_shade_classes(g, lines)
    _emit_neutral_classes(g, lines)
    _emit_shape_classes(lines)
    _emit_typography_classes(g, lines)
    _emit_spacing_classes(lines)
    _emit_bg_themed(lines)
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
