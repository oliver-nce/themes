"""Single source of truth for Web theme token tables and editor field contracts.

Keep in sync with frontend/src/widget/constants.ts and inline maps in
ThemeSettingsPage.vue until Stage 2.2 generates the frontend contract.
"""
from __future__ import annotations

# ── Shape / typography / motion maps (formerly in theme_color_utils.py) ──

BORDER_RADIUS_MAP = {
	"none": "0",
	"sm": "0.125rem",
	"md": "0.375rem",
	"lg": "0.5rem",
	"x-lg": "0.75rem",
	"full": "0.75rem",  # legacy — was pill/circle; now maps to x-lg
}

BORDER_WIDTH_MAP = {
	"0.5px": "0.5px",
	"1px": "1px",
	"2px": "2px",
	"3px": "3px",
}

SPACING_SCALE_MAP = {
	"tight": "0.75rem",
	"normal": "1rem",
	"relaxed": "1.5rem",
}

LINE_HEIGHT_MAP = {
	"tight": "1.25",
	"snug": "1.375",
	"normal": "1.5",
	"relaxed": "1.625",
	"loose": "2",
}

SHADOW_DEFS = {
	"none": [],
	"sm": [(0, 1, 3, 0, 0.12), (0, 1, 2, -1, 0.08)],
	"md": [(0, 4, 8, -1, 0.15), (0, 2, 4, -2, 0.1)],
	"lg": [(0, 10, 20, -3, 0.18), (0, 4, 8, -4, 0.1)],
	"xl": [(0, 20, 30, -5, 0.22), (0, 8, 12, -6, 0.12)],
	"2xl": [(0, 25, 50, -12, 0.3)],
	"3xl": [(0, 35, 60, -15, 0.35)],
}

TRANSITION_MAP = {
	"fast": "150ms",
	"normal": "200ms",
	"slow": "300ms",
}

GAMMA_SAT_ROLE_FIELDS = frozenset({"primary_color", "secondary_color"})
BRAND_FG_FLIP_FIELDS = frozenset(
	{
		"primary_color_fg_flip_mono",
		"primary_color_fg_flip_tonal",
		"secondary_color_fg_flip_mono",
		"secondary_color_fg_flip_tonal",
	}
)

BRAND_PALETTE_MODES = frozenset({"corporate", "flexible"})
DEFAULT_BRAND_PALETTE_MODE = "corporate"

# ── Self-hosted variable fonts (formerly in css_writer.py) ──
# Each entry: display name -> (folder slug under public/fonts, generic fallback).

FONT_REGISTRY = {
	"Inter": ("inter", "sans-serif"),
	"Source Sans 3": ("source-sans-3", "sans-serif"),
	"Public Sans": ("public-sans", "sans-serif"),
	"Open Sans": ("open-sans", "sans-serif"),
	"Roboto": ("roboto", "sans-serif"),
	"Nunito": ("nunito", "sans-serif"),
	"Source Serif 4": ("source-serif-4", "serif"),
	"JetBrains Mono": ("jetbrains-mono", "monospace"),
}

FONT_SUBSETS = {
	"latin": (
		"U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
		"U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,"
		"U+2212,U+2215,U+FEFF,U+FFFD"
	),
	"latin-ext": (
		"U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,"
		"U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,"
		"U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF"
	),
}

FONT_BASE_URL = "/assets/themes/fonts"

RETIRED_FONT_ALIASES = {
	"Work Sans": "Public Sans",
	"DM Sans": "Public Sans",
}

# ── Color roles and shade scale (formerly in css_writer.py) ──

CURATED_SHADES = (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950)

FG_ROLES = (
	"primary_color",
	"secondary_color",
	"accent_color",
	"success_color",
	"info_color",
	"warning_color",
	"danger_color",
	"neutral_color",
)

COLOR_FIELDS = {
	"primary_color": "color-primary",
	"secondary_color": "color-secondary",
	"accent_color": "color-accent",
	"success_color": "color-success",
	"info_color": "color-info",
	"warning_color": "color-warning",
	"danger_color": "color-danger",
	"neutral_color": "color-neutral",
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
	"neutral_color": "color-neutral",
}

MIGRATED_FIELDS = list(COLOR_FIELDS.keys()) + [
	"font_family",
	"heading_font_family",
	"font_size",
	"line_height",
	"font_weight_body",
	"border_radius",
	"border_width_thin",
	"border_width",
	"border_width_strong",
	"spacing_scale",
	"shadow",
	"shadow_color",
	"shadow_opacity",
	"shadow_direction",
	"transition_speed",
	"sidebar_width",
	"container_max_width",
	"tailwind_overrides",
	"custom_css",
]

# SPA editor payload keys (MIGRATED_FIELDS + stored-but-not-CSS fields)
TOKEN_FIELDS = MIGRATED_FIELDS + [
	"dark_mode",
	"primary_color_gamma",
	"primary_color_saturation",
	"secondary_color_gamma",
	"secondary_color_saturation",
	"neutral_color_warmth",
	"neutral_color_shades",
	"brand_palette_mode",
	"primary_color_fg_flip_mono",
	"primary_color_fg_flip_tonal",
	"secondary_color_fg_flip_mono",
	"secondary_color_fg_flip_tonal",
]


def export_token_contract() -> dict:
	"""Return the Web theme token contract as JSON-serializable data for the frontend build."""
	roles = [css_var.replace("color-", "") for css_var in SHADE_SCALE_FIELDS.values()]
	color_var_map = {field: f"--nce-{css_var}" for field, css_var in COLOR_FIELDS.items()}
	shade_preview_fields = [
		[field, css_var]
		for field, css_var in SHADE_SCALE_FIELDS.items()
		if field != "neutral_color"
	]
	fg_shade_roles = [field for field in SHADE_SCALE_FIELDS if field != "neutral_color"]
	role_var_map = dict(SHADE_SCALE_FIELDS)
	role_var_map.pop("neutral_color", None)

	return {
		"borderRadiusMap": BORDER_RADIUS_MAP,
		"borderWidthMap": BORDER_WIDTH_MAP,
		"spacingScaleMap": SPACING_SCALE_MAP,
		"lineHeightMap": LINE_HEIGHT_MAP,
		"transitionMap": TRANSITION_MAP,
		"shadowDefs": {
			level: [list(layer) for layer in layers]
			for level, layers in SHADOW_DEFS.items()
		},
		"gammaSatRoleFields": sorted(GAMMA_SAT_ROLE_FIELDS),
		"brandFgFlipFields": sorted(BRAND_FG_FLIP_FIELDS),
		"fgPoleLightShade": 300,
		"fgPoleDarkShade": 800,
		"curatedShades": list(CURATED_SHADES),
		"colorFields": COLOR_FIELDS,
		"shadeScaleFields": SHADE_SCALE_FIELDS,
		"fgRoles": list(FG_ROLES),
		"fgShadeRoles": fg_shade_roles,
		"roles": roles,
		"colorVarMap": color_var_map,
		"shadePreviewFields": shade_preview_fields,
		"roleVarMap": role_var_map,
		"fontRegistry": {name: list(entry) for name, entry in FONT_REGISTRY.items()},
		"retiredFontAliases": RETIRED_FONT_ALIASES,
		"fontOptions": list(FONT_REGISTRY.keys()) + ["System Default"],
		"tokenFields": TOKEN_FIELDS,
	}
