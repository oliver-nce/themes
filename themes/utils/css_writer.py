# Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
"""Web theme CSS generation and publish (nce_theme.css → --nce-* tokens).

AGENT NAVIGATION — key emitters:
  _emit_var_block           — :root --nce-* CSS variables
  _emit_role_shade_classes  — theme-bg-{role}-{shade} utility classes
  _emit_neutral_classes     — theme-bg-surface, theme-bg-row-alt (+ legacy bg-* aliases)
  generate_css / publish_theme — entry points

Paired module: themes.utils.desk_css_writer (Desk chrome → native --*-color vars).

Shared with desk_css_writer: css_publish.write_published_css(), SHA-1 css_hash,
cache.delete_value("assets_json"), frappe.clear_cache() — publish tail only; content
generation differs (OKLCH shade classes vs flat Desk var blocks).

Token tables live in theme_tokens.py; color math in theme_color_utils.py. Keep in sync with
frontend/src/utils/color-shades.ts and src/widget/constants.ts.
"""
import json
import os
import frappe
from themes.utils.css_publish import write_published_css
from themes.utils.theme_color_utils import (
    _build_shadow, _generate_shades, generate_neutral_shades,
    _effective_role_hex,
    pick_fg_mono, pick_fg_tonal,
    BRAND_COLOR_FIELDS, OPPOSITE_BRAND_FIELD,
    brand_shade_foreground,
)
from themes.utils.theme_tokens import (
    BORDER_RADIUS_MAP, BORDER_WIDTH_MAP, SPACING_SCALE_MAP, LINE_HEIGHT_MAP, TRANSITION_MAP,
    FONT_REGISTRY, FONT_SUBSETS, FONT_BASE_URL, RETIRED_FONT_ALIASES,
    CURATED_SHADES, FG_ROLES, COLOR_FIELDS, SHADE_SCALE_FIELDS,
    GAMMA_SAT_ROLE_FIELDS, MIGRATED_FIELDS, TOKEN_FIELDS,
)

# Re-export token contract symbols for backward compatibility (api.py, patches, tests).
__all__ = [
    "BORDER_RADIUS_MAP", "BORDER_WIDTH_MAP", "SPACING_SCALE_MAP", "LINE_HEIGHT_MAP", "TRANSITION_MAP",
    "FONT_REGISTRY", "FONT_SUBSETS", "FONT_BASE_URL", "RETIRED_FONT_ALIASES",
    "CURATED_SHADES", "FG_ROLES", "COLOR_FIELDS", "SHADE_SCALE_FIELDS",
    "GAMMA_SAT_ROLE_FIELDS", "MIGRATED_FIELDS", "TOKEN_FIELDS",
    "generate_css", "generate_site_css", "publish_theme",
]


def _resolve_font_name(name):
    """Map retired font names to their replacement for publish/load."""
    if not name or name == "System Default":
        return name
    return RETIRED_FONT_ALIASES.get(name, name)


def _font_stack(name):
    """Build a CSS font-family stack for a configured font name.

    Returns the system stack for empty / "System Default", otherwise the named
    font followed by its registered generic fallback (sans-serif/serif/monospace).
    """
    name = _resolve_font_name(name)
    if not name or name == "System Default":
        return "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    generic = FONT_REGISTRY.get(name, (None, "sans-serif"))[1]
    return f"'{name}', {generic}"


def _font_face_blocks(name):
    """Return @font-face rule lines for one registered variable font (both subsets).

    Unregistered names (e.g. "System Default" or a legacy font) yield nothing.
    """
    entry = FONT_REGISTRY.get(name)
    if not entry:
        return []
    slug = entry[0]
    out = []
    for subset, unicode_range in FONT_SUBSETS.items():
        out += [
            "@font-face {",
            f"\tfont-family: '{name}';",
            "\tfont-style: normal;",
            "\tfont-display: swap;",
            "\tfont-weight: 100 900;",
            f"\tsrc: url('{FONT_BASE_URL}/{slug}/{subset}-wght-normal.woff2') format('woff2');",
            f"\tunicode-range: {unicode_range};",
            "}",
        ]
    return out


def _collect_font_names(payloads):
    """Return de-duplicated registered font names across payload dicts."""
    names = []
    for payload in payloads:
        g = payload.get
        for field in ("font_family", "heading_font_family"):
            n = _resolve_font_name(g(field))
            if n and n != "System Default" and n in FONT_REGISTRY and n not in names:
                names.append(n)
    return names


def _emit_font_faces(g, lines):
    """Emit @font-face rules for the active body + heading fonts (deduplicated)."""
    names = _collect_font_names([{"get": g}])
    if not names:
        return
    lines.append("/* ── Self-hosted variable fonts (active body + heading) ── */")
    for n in names:
        lines += _font_face_blocks(n)
    lines.append("")


def _emit_font_faces_multi(payloads, lines):
    """Emit @font-face rules for fonts used across multiple theme payloads."""
    names = _collect_font_names(payloads)
    if not names:
        return
    lines.append("/* ── Self-hosted variable fonts (active body + heading) ── */")
    for n in names:
        lines += _font_face_blocks(n)
    lines.append("")


def generate_fonts_css() -> str:
    """Full @font-face stylesheet for every curated font (used by the editor only)."""
    lines = ["/* Curated variable fonts — generated for the Theme Editor picker. */"]
    for name in FONT_REGISTRY:
        lines += _font_face_blocks(name)
        lines.append("")
    return "\n".join(lines)


def _role_gamma_sat(g, field):
    if field not in GAMMA_SAT_ROLE_FIELDS:
        return 0.0, 100.0
    gamma = float(g(f"{field}_gamma") or 0)
    saturation = g(f"{field}_saturation")
    if saturation is None:
        saturation = 100
    return gamma, float(saturation)


def _brand_palette_mode(g):
    mode = (g("brand_palette_mode") or "corporate").strip().lower()
    return mode if mode == "flexible" else "corporate"


def _pin_stop_600_for_role(g, field):
    if field not in GAMMA_SAT_ROLE_FIELDS:
        return True
    if _brand_palette_mode(g) != "flexible":
        return True
    gamma, saturation = _role_gamma_sat(g, field)
    return gamma == 0 and saturation == 100


def _parse_shades_map(raw):
    if not raw:
        return None
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            return None
    if not isinstance(raw, dict):
        return None
    out = []
    for shade_str, hex_val in raw.items():
        if not hex_val:
            continue
        try:
            out.append((int(shade_str), hex_val))
        except (TypeError, ValueError):
            continue
    return sorted(out, key=lambda item: item[0]) if out else None


def _get_role_shades(g, field):
    """Return [(shade, hex), …] for any shade-scale role."""
    pre = _parse_shades_map(g(f"{field}_shades"))
    if pre:
        return pre
    if field == "neutral_color":
        return list(generate_neutral_shades(float(g("neutral_color_warmth") or 0)))
    value = g(field)
    if not value:
        return []
    gamma, saturation = _role_gamma_sat(g, field)
    if _brand_palette_mode(g) != "flexible":
        gamma, saturation = 0.0, 100.0
    pin_600 = _pin_stop_600_for_role(g, field)
    return _generate_shades(
        value, gamma=gamma, saturation=saturation, pin_600_to_base=pin_600,
    )


def _role_base_hex(g, field):
    """Base hex for a role token (stop 600 for shade-scale roles)."""
    value = g(field)
    if value:
        if field in GAMMA_SAT_ROLE_FIELDS and _brand_palette_mode(g) == "flexible":
            gamma, saturation = _role_gamma_sat(g, field)
            return _effective_role_hex(value, gamma, saturation)
        return value
    shades = dict(_get_role_shades(g, field))
    return shades.get(600)


def _role_is_configured(g, field):
    if field == "neutral_color":
        return True
    if _parse_shades_map(g(f"{field}_shades")):
        return True
    return bool(g(field))


def _fg_flip_mono(g, field):
    """Single mono flip with fallback from dual-field themes."""
    for key in (f"{field}_fg_flip_mono", f"{field}_fg_flip_mono_2", f"{field}_fg_flip_mono_1"):
        val = g(key)
        if val is not None and val != "":
            return val
    return None


def _fg_flip_tonal(g, field):
    """Single tonal flip with fallback from dual-field themes."""
    for key in (f"{field}_fg_flip_tonal", f"{field}_fg_flip_tonal_2", f"{field}_fg_flip_tonal_1"):
        val = g(key)
        if val is not None and val != "":
            return val
    return None


def _emit_var_block(g, lines, selector=":root", include_custom_css=True):
    """Emit a `selector { --nce-* }` variable block and optional custom_css.

    `selector` defaults to ":root" (the published default palette). Scoped
    palettes pass e.g. '[data-nce-theme="ocean"]'. `custom_css` is global and
    only appended when `include_custom_css` is True (it cannot be safely scoped).
    """
    lines.extend([f"{selector} {{", "", "\t/* ── Theme: canonical variables ── */"])
    for f, var in COLOR_FIELDS.items():
        if f in SHADE_SCALE_FIELDS:
            v = _role_base_hex(g, f)
        else:
            v = g(f)
            if not v:
                continue
            if f in GAMMA_SAT_ROLE_FIELDS and _brand_palette_mode(g) == "flexible":
                gamma, saturation = _role_gamma_sat(g, f)
                v = _effective_role_hex(v, gamma, saturation)
        if not v:
            continue
        lines.append(f"\t--nce-{var}: {v};")
    for f, var in COLOR_FIELDS.items():
        if f not in FG_ROLES:
            continue
        fg_hex = _role_base_hex(g, f)
        if not fg_hex:
            continue
        if f in BRAND_COLOR_FIELDS:
            role_shades = _get_role_shades(g, f)
            opp_field = OPPOSITE_BRAND_FIELD[f]
            opp_shades = _get_role_shades(g, opp_field) if _role_is_configured(g, opp_field) else []
            flip_mono = _fg_flip_mono(g, f)
            flip_tonal = _fg_flip_tonal(g, f)
            pole_dark = g(f"{f}_fg_pole_tonal_dark")
            pole_light = g(f"{f}_fg_pole_tonal_light")
            fg_mono = brand_shade_foreground(600, role_shades, "mono", flip_mono, None, opp_shades)
            fg_tonal = brand_shade_foreground(
                600, role_shades, "tonal", flip_tonal, None, opp_shades, pole_dark, pole_light,
            )
            lines.append(f"\t--nce-{var}-fg: {fg_mono};")
            lines.append(f"\t--nce-{var}-fg-tonal: {fg_tonal};")
        else:
            lines.append(f"\t--nce-{var}-fg: {pick_fg_mono(fg_hex)};")
            lines.append(f"\t--nce-{var}-fg-tonal: {pick_fg_tonal(fg_hex)};")
    lines += ["", "\t/* ── Shade scales (50–950) ── */"]
    for f, var in SHADE_SCALE_FIELDS.items():
        if not _role_is_configured(g, f):
            continue
        role_shades = _get_role_shades(g, f)
        opp_shades: list[tuple[int, str]] = []
        flip_mono = flip_tonal = pole_dark = pole_light = None
        if f in BRAND_COLOR_FIELDS:
            opp_field = OPPOSITE_BRAND_FIELD[f]
            if _role_is_configured(g, opp_field):
                opp_shades = _get_role_shades(g, opp_field)
            flip_mono = _fg_flip_mono(g, f)
            flip_tonal = _fg_flip_tonal(g, f)
            pole_dark = g(f"{f}_fg_pole_tonal_dark")
            pole_light = g(f"{f}_fg_pole_tonal_light")
        for shade_num, shade_hex in role_shades:
            lines.append(f"\t--nce-{var}-{shade_num}: {shade_hex};")
            if shade_num in CURATED_SHADES:
                if f in BRAND_COLOR_FIELDS:
                    fg_mono = brand_shade_foreground(
                        shade_num, role_shades, "mono", flip_mono, None, opp_shades,
                    )
                    fg_tonal = brand_shade_foreground(
                        shade_num, role_shades, "tonal", flip_tonal, None, opp_shades,
                        pole_dark, pole_light,
                    )
                    lines.append(f"\t--nce-{var}-{shade_num}-fg: {fg_mono};")
                    lines.append(f"\t--nce-{var}-{shade_num}-fg-tonal: {fg_tonal};")
                else:
                    lines.append(f"\t--nce-{var}-{shade_num}-fg: {pick_fg_mono(shade_hex)};")
                    lines.append(f"\t--nce-{var}-{shade_num}-fg-tonal: {pick_fg_tonal(shade_hex)};")
    lines.append(f"\t--nce-font-family: {_font_stack(g('font_family'))};")
    lines.append(f"\t--nce-font-heading: {_font_stack(g('heading_font_family'))};")
    lines.append(f"\t--nce-font-size: {g('font_size') or '14px'};")
    lines.append(f"\t--nce-font-weight: {g('font_weight_body') or '400'};")
    lines.append(f"\t--nce-line-height: {LINE_HEIGHT_MAP.get(g('line_height') or 'normal', '1.5')};")
    lines.append(f"\t--nce-border-radius: {BORDER_RADIUS_MAP.get(g('border_radius') or 'md', '0.375rem')};")
    lines.append(f"\t--nce-border-width-thin: {BORDER_WIDTH_MAP.get(g('border_width_thin') or '0.5px', '0.5px')};")
    lines.append(f"\t--nce-border-width: {BORDER_WIDTH_MAP.get(g('border_width') or '1px', '1px')};")
    lines.append(f"\t--nce-border-width-strong: {BORDER_WIDTH_MAP.get(g('border_width_strong') or '2px', '2px')};")
    lines.append(f"\t--nce-spacing-base: {SPACING_SCALE_MAP.get(g('spacing_scale') or 'normal', '1rem')};")
    sc = g("shadow_color") or "#000000"
    lines.append(f"\t--nce-shadow-color: {sc};")
    opacity = g("shadow_opacity")
    if opacity is None:
        opacity = 100
    direction = g("shadow_direction")
    if direction is None:
        direction = 180
    lines.append(f"\t--nce-shadow: {_build_shadow(g('shadow') or 'md', sc, opacity, direction)};")
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
    if include_custom_css and g("custom_css"):
        lines += ["", g("custom_css")]
    lines.append("")


def _emit_role_bg_classes(g, lines):
    """Default fg pairing for bare .bg-{role} classes."""
    lines.append("/* ── Default fg pairing for bare role classes ── */")
    for f, var in COLOR_FIELDS.items():
        if f not in FG_ROLES or not _role_is_configured(g, f):
            continue
        role = var.replace("color-", "")
        lines.append(
            f".theme-bg-{role} {{ background-color: var(--nce-{var}); color: var(--nce-{var}-fg); }}"
        )
    lines.append("")


def _emit_role_text_border_classes(g, lines):
    """Per-role text-color, border-color, and explicit fg variants."""
    lines.append("/* ── Per-role text/border + explicit fg classes ── */")
    for field, var in COLOR_FIELDS.items():
        if field not in FG_ROLES or not _role_is_configured(g, field):
            continue
        role = var.replace("color-", "")
        lines.append(f".theme-text-{role} {{ color: var(--nce-{var}); }}")
        lines.append(f".theme-border-{role} {{ border-color: var(--nce-{var}); }}")
        lines.append(f".theme-text-{role}-fg {{ color: var(--nce-{var}-fg); }}")
        lines.append(f".theme-text-{role}-fg-tonal {{ color: var(--nce-{var}-fg-tonal); }}")
    lines.append("")


def _emit_role_shade_classes(g, lines):
    """Per-role per-curated-shade utility classes."""
    lines.append("/* ── Per-role per-curated-shade utility classes ── */")
    for field, var in SHADE_SCALE_FIELDS.items():
        if not _role_is_configured(g, field):
            continue
        role = var.replace("color-", "")
        for shade in CURATED_SHADES:
            lines.append(
                f".theme-bg-{role}-{shade} {{ "
                f"background-color: var(--nce-{var}-{shade}); "
                f"color: var(--nce-{var}-{shade}-fg); }}"
            )
            lines.append(f".theme-text-{role}-{shade} {{ color: var(--nce-{var}-{shade}); }}")
            lines.append(f".theme-text-{role}-{shade}-fg {{ color: var(--nce-{var}-{shade}-fg); }}")
            lines.append(f".theme-text-{role}-{shade}-fg-tonal {{ color: var(--nce-{var}-{shade}-fg-tonal); }}")
            lines.append(f".theme-border-{role}-{shade} {{ border-color: var(--nce-{var}-{shade}); }}")
    lines.append("")


def _emit_prefixed_rule(lines, theme_class: str, legacy_class: str, declarations: str) -> None:
    """Emit theme- class plus legacy unprefixed alias (Desk consumers may use either)."""
    lines.append(f".{theme_class}, .{legacy_class} {{ {declarations} }}")


def _emit_neutral_classes(g, lines):
    """Neutral surfaces, semantic chrome aliases, text/border roles."""
    lines.append("/* ── Neutral surfaces, semantic chrome aliases, text/border roles ── */")
    if g("background_color"):
        _emit_prefixed_rule(
            lines, "theme-bg-bg-page", "bg-bg-page", "background-color: var(--nce-color-bg);"
        )
    if g("surface_color"):
        _emit_prefixed_rule(
            lines, "theme-bg-surface", "bg-surface", "background-color: var(--nce-color-surface);"
        )
        _emit_prefixed_rule(
            lines, "theme-bg-card", "bg-card", "background-color: var(--nce-color-surface);"
        )
    if g("row_alt_color"):
        _emit_prefixed_rule(
            lines,
            "theme-bg-row-alt",
            "bg-row-alt",
            "background-color: var(--nce-color-row-alt);",
        )
    if g("primary_color"):
        _emit_prefixed_rule(
            lines,
            "theme-bg-header",
            "bg-header",
            "background-color: var(--nce-color-primary); color: var(--nce-color-primary-fg);",
        )
        _emit_prefixed_rule(
            lines, "theme-text-text-header", "text-text-header", "color: var(--nce-color-primary-fg);"
        )
    if g("heading_color"):
        _emit_prefixed_rule(lines, "theme-text-heading", "text-heading", "color: var(--nce-color-heading);")
    if g("muted_color"):
        _emit_prefixed_rule(lines, "theme-text-muted", "text-muted", "color: var(--nce-color-muted);")
    if g("link_color"):
        _emit_prefixed_rule(lines, "theme-text-link", "text-link", "color: var(--nce-color-link);")
    if g("border_color"):
        _emit_prefixed_rule(
            lines,
            "theme-border-thin",
            "border-thin",
            "border-width: var(--nce-border-width-thin); border-style: solid; border-color: var(--nce-color-border);",
        )
        _emit_prefixed_rule(
            lines,
            "theme-border",
            "border",
            "border-width: var(--nce-border-width); border-style: solid; border-color: var(--nce-color-border);",
        )
        _emit_prefixed_rule(
            lines,
            "theme-border-strong",
            "border-strong",
            "border-width: var(--nce-border-width-strong); border-style: solid; border-color: var(--nce-color-border);",
        )
        _emit_prefixed_rule(
            lines,
            "theme-border-input-border",
            "border-input-border",
            "border-color: var(--nce-color-border);",
        )
    if g("focus_color"):
        _emit_prefixed_rule(
            lines,
            "theme-border-input-focus",
            "border-input-focus",
            "border-color: var(--nce-color-focus);",
        )
    lines.append("")


def _emit_shape_classes(lines):
    """Border-radius, box-shadow, and transition-duration classes."""
    lines.append("/* ── Shape + motion classes ── */")
    lines.append(".theme-rounded { border-radius: var(--nce-border-radius); }")
    lines.append(".theme-rounded-sm { border-radius: calc(var(--nce-border-radius) * 0.5); }")
    lines.append(".theme-rounded-md { border-radius: var(--nce-border-radius); }")
    lines.append(".theme-rounded-lg { border-radius: calc(var(--nce-border-radius) * 1.5); }")
    lines.append(".theme-rounded-xl { border-radius: calc(var(--nce-border-radius) * 2); }")
    lines.append(".theme-shadow { box-shadow: var(--nce-shadow); }")
    lines.append(".theme-shadow-theme { box-shadow: var(--nce-shadow); }")
    lines.append(".theme-duration-theme { transition-duration: var(--nce-transition-speed); }")
    lines.append("")


def _emit_typography_classes(g, lines):
    """Font family + font size classes."""
    lines.append("/* ── Typography classes (font family + sizes) ── */")
    if g("font_family"):
        lines.append(".theme-font-sans { font-family: var(--nce-font-family); }")
    if g("heading_font_family"):
        lines.append(".theme-font-heading { font-family: var(--nce-font-heading); }")
    size_multipliers = [
        ("xs", "0.75"), ("sm", "0.875"),
        ("base", None),
        ("lg", "1.125"), ("xl", "1.25"),
        ("2xl", "1.5"), ("3xl", "1.875"), ("4xl", "2.25"),
    ]
    for name, mul in size_multipliers:
        if mul is None:
            lines.append(f".theme-text-{name} {{ font-size: var(--nce-font-size); }}")
        else:
            lines.append(
                f".theme-text-{name} {{ font-size: calc(var(--nce-font-size) * {mul}); }}"
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
        lines.append(f".theme-p-{name} {{ padding: {v}; }}")
        lines.append(f".theme-m-{name} {{ margin: {v}; }}")
        lines.append(f".theme-gap-{name} {{ gap: {v}; }}")
    lines.append("")


def _emit_bg_themed(lines):
    """Dynamic-shade escape hatch."""
    lines.append("/* ── Dynamic-shade escape hatch ── */")
    lines.append(".theme-bg-themed { background-color: var(--bg, var(--nce-color-primary));")
    lines.append(
        "  color: oklch(from var(--bg, var(--nce-color-primary)) calc((l - 0.62) * -infinity) 0 0); }"
    )


def generate_css(payload: dict) -> str:
    """Build the full nce_theme.css content from a token payload dict."""
    g = payload.get
    lines = []
    _emit_font_faces(g, lines)
    _emit_var_block(g, lines)
    _emit_role_bg_classes(g, lines)
    _emit_role_text_border_classes(g, lines)
    _emit_role_shade_classes(g, lines)
    _emit_neutral_classes(g, lines)
    _emit_shape_classes(lines)
    _emit_typography_classes(g, lines)
    _emit_spacing_classes(lines)
    _emit_bg_themed(lines)
    return "\n".join(lines)


def generate_site_css(default_payload: dict, active_themes: list[tuple[str, dict]]) -> str:
    """default_payload → :root + class layer; active_themes = [(slug, payload), …] → scoped var blocks."""
    g = default_payload.get
    lines = []
    _emit_font_faces_multi([default_payload] + [p for _, p in active_themes], lines)
    _emit_var_block(g, lines, ":root", include_custom_css=True)
    # Classes are gated by fields present in the default payload — the default defines all standard roles.
    _emit_role_bg_classes(g, lines)
    _emit_role_text_border_classes(g, lines)
    _emit_role_shade_classes(g, lines)
    _emit_neutral_classes(g, lines)
    _emit_shape_classes(lines)
    _emit_typography_classes(g, lines)
    _emit_spacing_classes(lines)
    _emit_bg_themed(lines)
    for slug, payload in active_themes:
        _emit_var_block(
            payload.get,
            lines,
            f'[data-nce-theme="{slug}"]',
            include_custom_css=False,
        )
    return "\n".join(lines)


def _write_fonts_css() -> str:
    """Write the all-curated-fonts stylesheet consumed only by the editor page."""
    app_path = frappe.get_app_path("themes")
    css_dir = os.path.join(app_path, "public", "css")
    os.makedirs(css_dir, exist_ok=True)
    path = os.path.join(css_dir, "fonts.css")
    with open(path, "w") as f:
        f.write(generate_fonts_css())
    return path


def publish_theme(theme_name: str) -> dict:
    """Rebuild nce_theme.css from current DB state (default :root + all Active scoped palettes)."""
    from themes.utils.site_theme_config_helpers import get_site_base_theme_name

    default_name = get_site_base_theme_name()
    if default_name and frappe.db.exists("NCE Theme", default_name):
        default_payload = json.loads(
            frappe.db.get_value("NCE Theme", default_name, "theme_json") or "{}"
        )
    else:
        default_name = theme_name
        default_payload = json.loads(
            frappe.db.get_value("NCE Theme", theme_name, "theme_json") or "{}"
        )

    active_themes = []
    for row in frappe.get_all(
        "NCE Theme",
        filters={"status": "Active"},
        fields=["slug", "theme_json"],
    ):
        slug = (row.slug or "").strip()
        if not slug:
            continue
        active_themes.append((slug, json.loads(row.theme_json or "{}")))

    css = generate_site_css(default_payload, active_themes)
    _write_fonts_css()
    css_hash = write_published_css("nce_theme.css", css)
    frappe.db.set_single_value("Site Theme Config", "css_hash", css_hash)
    frappe.cache.delete_value("assets_json")
    frappe.clear_cache()
    return {"status": "ok", "theme": default_name, "css_hash": css_hash, "bytes": len(css)}
