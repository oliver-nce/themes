/**
 * ThemeSwatchPicker constants — keep in sync with themes/utils/css_writer.py:
 * CURATED_SHADES (line 51), SHADE_SCALE_FIELDS (line 76).
 */

export const KINDS = ["bg", "text", "border"] as const
export type ThemeKind = (typeof KINDS)[number]

/** Role slugs from SHADE_SCALE_FIELDS value names (color-primary → primary). */
export const ROLES = [
	"primary",
	"secondary",
	"accent",
	"success",
	"info",
	"warning",
	"danger",
] as const
export type ThemeRole = (typeof ROLES)[number]

export const CURATED_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type ThemeShade = (typeof CURATED_SHADES)[number]

/** Primary / Secondary only — spec §6. Add "gray" when gray_color lands. */
export const OVERLAY_ROLES: readonly ThemeRole[] = ["primary", "secondary"]

export const DEFAULT_KIND: ThemeKind = "bg"
export const DEFAULT_ROLE: ThemeRole = "primary"

export const FG_TYPES = ["mono", "tonal"] as const
export type ThemeFgType = (typeof FG_TYPES)[number]
export const DEFAULT_FG_TYPE: ThemeFgType = "mono"

const ROLE_SET = new Set<string>(ROLES)
const KIND_SET = new Set<string>(KINDS)
const SHADE_SET = new Set<number>(CURATED_SHADES)

export function isThemeKind(value: string): value is ThemeKind {
	return KIND_SET.has(value)
}

export function isThemeRole(value: string): value is ThemeRole {
	return ROLE_SET.has(value)
}

export function isThemeShade(value: number): value is ThemeShade {
	return SHADE_SET.has(value)
}

/** GRAY_ROW_STUB — uncomment when gray_color is in SHADE_SCALE_FIELDS. */
// export const GRAY_ROLE: ThemeRole = "gray"
