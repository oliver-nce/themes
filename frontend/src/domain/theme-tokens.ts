/**
 * GENERATED from themes/utils/theme_tokens.py — do not edit by hand.
 * Regenerate: npm run export:tokens  (or python3 scripts/export_theme_tokens.py)
 */

export const CURATED_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type ThemeShade = (typeof CURATED_SHADES)[number]

export const ROLES = ["primary", "secondary", "accent", "success", "info", "warning", "danger", "neutral"] as const
export type ThemeRole = (typeof ROLES)[number]

export const FG_ROLES = ["primary_color", "secondary_color", "accent_color", "success_color", "info_color", "warning_color", "danger_color", "neutral_color"] as const
export const FG_SHADE_ROLES = ["primary_color", "secondary_color", "accent_color", "success_color", "info_color", "warning_color", "danger_color"] as const

export const GAMMA_SAT_ROLE_FIELDS = new Set<string>(["primary_color", "secondary_color"])

export const BORDER_RADIUS_MAP: Record<string, string> = {
"none": "0",
"sm": "0.125rem",
"md": "0.375rem",
"lg": "0.5rem",
"x-lg": "0.75rem",
"full": "0.75rem",
}
export const BORDER_WIDTH_MAP: Record<string, string> = {
"0.5px": "0.5px",
"1px": "1px",
"2px": "2px",
"3px": "3px",
}
export const SPACING_SCALE_MAP: Record<string, string> = {
"tight": "0.75rem",
"normal": "1rem",
"relaxed": "1.5rem",
}
export const LINE_HEIGHT_MAP: Record<string, string> = {
"tight": "1.25",
"snug": "1.375",
"normal": "1.5",
"relaxed": "1.625",
"loose": "2",
}
export const TRANSITION_MAP: Record<string, string> = {
"fast": "150ms",
"normal": "200ms",
"slow": "300ms",
}

export type ShadowLayer = [number, number, number, number, number]
export const SHADOW_DEFS: Record<string, ShadowLayer[]> = {
"none": [],
"sm": [[0, 1, 3, 0, 0.12], [0, 1, 2, -1, 0.08]],
"md": [[0, 4, 8, -1, 0.15], [0, 2, 4, -2, 0.1]],
"lg": [[0, 10, 20, -3, 0.18], [0, 4, 8, -4, 0.1]],
"xl": [[0, 20, 30, -5, 0.22], [0, 8, 12, -6, 0.12]],
"2xl": [[0, 25, 50, -12, 0.3]],
"3xl": [[0, 35, 60, -15, 0.35]],
}

export const COLOR_FIELDS: Record<string, string> = {
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
export const SHADE_SCALE_FIELDS: Record<string, string> = {
"primary_color": "color-primary",
"secondary_color": "color-secondary",
"accent_color": "color-accent",
"success_color": "color-success",
"info_color": "color-info",
"warning_color": "color-warning",
"danger_color": "color-danger",
"neutral_color": "color-neutral",
}
export const COLOR_VAR_MAP: Record<string, string> = {
"primary_color": "--nce-color-primary",
"secondary_color": "--nce-color-secondary",
"accent_color": "--nce-color-accent",
"success_color": "--nce-color-success",
"info_color": "--nce-color-info",
"warning_color": "--nce-color-warning",
"danger_color": "--nce-color-danger",
"neutral_color": "--nce-color-neutral",
"text_color": "--nce-color-text",
"heading_color": "--nce-color-heading",
"muted_color": "--nce-color-muted",
"link_color": "--nce-color-link",
"focus_color": "--nce-color-focus",
"background_color": "--nce-color-bg",
"surface_color": "--nce-color-surface",
"border_color": "--nce-color-border",
"row_alt_color": "--nce-color-row-alt",
}
export const ROLE_VAR_MAP: Record<string, string> = {
"primary_color": "color-primary",
"secondary_color": "color-secondary",
"accent_color": "color-accent",
"success_color": "color-success",
"info_color": "color-info",
"warning_color": "color-warning",
"danger_color": "color-danger",
}

export const SHADE_PREVIEW_FIELDS: ReadonlyArray<readonly [string, string]> = [["primary_color", "color-primary"], ["secondary_color", "color-secondary"], ["accent_color", "color-accent"], ["success_color", "color-success"], ["info_color", "color-info"], ["warning_color", "color-warning"], ["danger_color", "color-danger"]] as const

export const FONT_REGISTRY: Record<string, readonly [string, string]> = {"Inter": ["inter", "sans-serif"], "Source Sans 3": ["source-sans-3", "sans-serif"], "Public Sans": ["public-sans", "sans-serif"], "Open Sans": ["open-sans", "sans-serif"], "Roboto": ["roboto", "sans-serif"], "Nunito": ["nunito", "sans-serif"], "Source Serif 4": ["source-serif-4", "serif"], "JetBrains Mono": ["jetbrains-mono", "monospace"]}
export const RETIRED_FONT_ALIASES: Record<string, string> = {
"Work Sans": "Public Sans",
"DM Sans": "Public Sans",
}
export const FONT_OPTIONS: readonly string[] = ["Inter", "Source Sans 3", "Public Sans", "Open Sans", "Roboto", "Nunito", "Source Serif 4", "JetBrains Mono", "System Default"] as const
export const TOKEN_FIELDS: readonly string[] = ["primary_color", "secondary_color", "accent_color", "success_color", "info_color", "warning_color", "danger_color", "neutral_color", "text_color", "heading_color", "muted_color", "link_color", "focus_color", "background_color", "surface_color", "border_color", "row_alt_color", "font_family", "heading_font_family", "font_size", "line_height", "font_weight_body", "border_radius", "border_width_thin", "border_width", "border_width_strong", "spacing_scale", "shadow", "shadow_color", "shadow_opacity", "transition_speed", "sidebar_width", "container_max_width", "tailwind_overrides", "custom_css", "dark_mode", "primary_color_gamma", "primary_color_saturation", "secondary_color_gamma", "secondary_color_saturation", "neutral_color_warmth", "neutral_color_shades", "brand_palette_mode"] as const

