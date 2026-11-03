// Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
// Live --nce CSS variable map from site theme form values.
//
import type { BrandPaletteMode } from "@/components/BrandColorPicker.vue"
import {
	BORDER_RADIUS_MAP,
	BORDER_WIDTH_MAP,
	COLOR_VAR_MAP,
	CURATED_SHADES,
	GAMMA_SAT_ROLE_FIELDS,
	LINE_HEIGHT_MAP,
	SHADE_PREVIEW_FIELDS,
	SPACING_SCALE_MAP,
	TRANSITION_MAP,
} from "@/domain/theme-tokens"
import {
	brandShadeForeground,
	effectiveRoleHex,
	generateNeutralShades,
	generateShades,
	neutral600Hex,
	pickFgMono,
	pickFgTonal,
	type ColorShade,
} from "@/utils/color-shades"
import { clampFontWeight } from "@/utils/fontWeight"
import { fontStack } from "@/utils/fonts"
import { buildThemeShadow } from "@/utils/shadowBuild"

export type ThemeForm = Record<string, any>

/** Theme Settings Check fields: empty / unset means on (default). */
export function focusCheckEnabled(raw: unknown): boolean {
	if (raw === undefined || raw === null || raw === "") return true
	if (raw === false || raw === 0 || raw === "0") return false
	return true
}

export function isCorporateBrandPaletteMode(mode: unknown): boolean {
	return mode !== "flexible"
}

export function normalizeBrandPaletteMode(mode: unknown): BrandPaletteMode {
	return mode === "flexible" ? "flexible" : "corporate"
}

export function roleShadeAdjustments(form: ThemeForm, field: string) {
	if (isCorporateBrandPaletteMode(form.brand_palette_mode)) {
		return { gamma: 0, saturation: 100 }
	}
	return {
		gamma: Number(form[`${field}_gamma`] ?? 0),
		saturation: Number(form[`${field}_saturation`] ?? 100),
	}
}

export function tableHeaderForeground(form: ThemeForm, header: string): string {
	const target = header.trim().toLowerCase()
	const corporateBrand = isCorporateBrandPaletteMode(form.brand_palette_mode)
	for (const field of ["primary_color", "secondary_color"] as const) {
		const base = form[field] as string
		if (!base) continue
		const adjust = roleShadeAdjustments(form, field)
		const shades = generateShades(base, corporateBrand ? undefined : adjust)
		const match = shades.find((s) => s.hex.toLowerCase() === target)
		if (!match) continue
		const oppField = field === "primary_color" ? "secondary_color" : "primary_color"
		const oppBase = form[oppField] as string
		const oppShades = oppBase
			? generateShades(oppBase, corporateBrand ? undefined : roleShadeAdjustments(form, oppField))
			: []
		const flipMono = form[`${field}_fg_flip_mono`] as number | null
		return brandShadeForeground(match.shade, shades, "mono", flipMono, null, oppShades)
	}
	return pickFgMono(header)
}

function applyTableCssVars(form: ThemeForm, vars: Record<string, string>) {
	const row = (form.row_color as string) || (form.surface_color as string)
	if (row) vars["--nce-color-row"] = row
	if (form.row_alt_color) vars["--nce-color-row-alt"] = form.row_alt_color as string
	const header =
		(form.table_header_bg_color as string) || (form.secondary_color as string)
	if (header) {
		vars["--nce-color-table-header"] = header
		vars["--nce-color-table-header-fg"] = tableHeaderForeground(form, header)
	}
	const rowDiv =
		(form.table_row_divider_color as string) || (form.border_color as string)
	if (rowDiv) vars["--nce-color-table-row-divider"] = rowDiv
	const colDiv =
		(form.table_col_divider_color as string) || (form.border_color as string)
	if (colDiv) vars["--nce-color-table-col-divider"] = colDiv
	vars["--nce-border-width-table-row"] = tableWidthTierCssVar(
		form.table_row_divider_width as string
	)
	vars["--nce-border-width-table-col"] = tableWidthTierCssVar(
		form.table_col_divider_width as string
	)
}

export function normalizeTableWidthTier(raw: unknown): "thin" | "normal" | "strong" {
	const legacy: Record<string, "thin" | "normal" | "strong"> = {
		"0.5px": "thin",
		"1px": "normal",
		"2px": "strong",
		"3px": "strong",
	}
	const s = String(raw || "thin").trim().toLowerCase()
	if (s === "normal" || s === "strong" || s === "thin") return s
	return legacy[s] || "thin"
}

export function tableWidthTierCssVar(raw: unknown): string {
	const tier = normalizeTableWidthTier(raw)
	if (tier === "strong") return "var(--nce-border-width-strong)"
	if (tier === "normal") return "var(--nce-border-width)"
	return "var(--nce-border-width-thin)"
}

export function computeThemeCssVariables(
	form: ThemeForm,
	fallbacks: { shadow_opacity: unknown; shadow_direction: unknown },
): Record<string, string> {
	const vars: Record<string, string> = {}
	const corporateBrand = isCorporateBrandPaletteMode(form.brand_palette_mode)
	for (const [field, cssVar] of Object.entries(COLOR_VAR_MAP)) {
		const hex = form[field]
		if (!hex) continue
		if (GAMMA_SAT_ROLE_FIELDS.has(field)) {
			if (corporateBrand) {
				vars[cssVar] = hex
			} else {
				const { gamma, saturation } = roleShadeAdjustments(form, field)
				vars[cssVar] = effectiveRoleHex(hex, gamma, saturation)
			}
		} else {
			vars[cssVar] = hex
		}
	}
	// Neutral: always emit from warmth alone
	const nWarmth = Number(form.neutral_color_warmth ?? 0)
	vars["--nce-color-neutral"] = neutral600Hex(nWarmth)
	const ff = form.font_family
	if (ff) vars["--nce-font-family"] = fontStack(ff)

	const hf = form.heading_font_family
	if (hf) vars["--nce-font-heading"] = fontStack(hf)

	if (form.font_size) vars["--nce-font-size"] = form.font_size
	if (form.font_weight_body) {
		vars["--nce-font-weight"] = String(clampFontWeight(form.font_weight_body, 400))
	}
	if (form.font_weight_medium) {
		vars["--nce-font-weight-medium"] = String(clampFontWeight(form.font_weight_medium, 500))
	}
	if (form.font_weight_semibold) {
		vars["--nce-font-weight-semibold"] = String(clampFontWeight(form.font_weight_semibold, 600))
	}
	if (form.font_weight_bold) {
		vars["--nce-font-weight-bold"] = String(clampFontWeight(form.font_weight_bold, 700))
	}
	if (form.hover_bg_shade) vars["--nce-hover-bg-shade"] = String(form.hover_bg_shade)
	if (form.hover_border_shade) vars["--nce-hover-border-shade"] = String(form.hover_border_shade)
	if (form.focus_ring_width) vars["--nce-focus-ring-width"] = String(form.focus_ring_width)
	if (form.focus_ring_offset) vars["--nce-focus-ring-offset"] = String(form.focus_ring_offset)
	vars["--nce-focus-ring-enabled"] = focusCheckEnabled(form.focus_ring_enabled) ? "1" : "0"
	vars["--nce-focus-fill-enabled"] = focusCheckEnabled(form.focus_fill_enabled) ? "1" : "0"
	if (form.disabled_opacity != null && form.disabled_opacity !== "") {
		vars["--nce-disabled-opacity"] = String(form.disabled_opacity)
	}
	if (form.pressed_shift) vars["--nce-pressed-shift"] = String(form.pressed_shift)
	if (form.btn_sm_font_size) vars["--nce-btn-sm-font-size"] = String(form.btn_sm_font_size)
	if (form.btn_sm_pad_y) vars["--nce-btn-sm-pad-y"] = String(form.btn_sm_pad_y)
	if (form.btn_sm_pad_x) vars["--nce-btn-sm-pad-x"] = String(form.btn_sm_pad_x)
	if (form.btn_sm_min_height) vars["--nce-btn-sm-min-height"] = String(form.btn_sm_min_height)
	if (form.btn_md_font_size) vars["--nce-btn-md-font-size"] = String(form.btn_md_font_size)
	if (form.btn_md_pad_y) vars["--nce-btn-md-pad-y"] = String(form.btn_md_pad_y)
	if (form.btn_md_pad_x) vars["--nce-btn-md-pad-x"] = String(form.btn_md_pad_x)
	if (form.btn_md_min_height) vars["--nce-btn-md-min-height"] = String(form.btn_md_min_height)
	if (form.btn_lg_font_size) vars["--nce-btn-lg-font-size"] = String(form.btn_lg_font_size)
	if (form.btn_lg_pad_y) vars["--nce-btn-lg-pad-y"] = String(form.btn_lg_pad_y)
	if (form.btn_lg_pad_x) vars["--nce-btn-lg-pad-x"] = String(form.btn_lg_pad_x)
	if (form.btn_lg_min_height) vars["--nce-btn-lg-min-height"] = String(form.btn_lg_min_height)
	if (form.line_height) vars["--nce-line-height"] = LINE_HEIGHT_MAP[form.line_height] || "1.5"
	if (form.border_radius) vars["--nce-border-radius"] = BORDER_RADIUS_MAP[form.border_radius] || "0.375rem"
	if (form.border_width_thin) vars["--nce-border-width-thin"] = BORDER_WIDTH_MAP[form.border_width_thin] || "0.5px"
	if (form.border_width) vars["--nce-border-width"] = BORDER_WIDTH_MAP[form.border_width] || "1px"
	if (form.border_width_strong) vars["--nce-border-width-strong"] = BORDER_WIDTH_MAP[form.border_width_strong] || "2px"
	if (form.spacing_scale) {
		vars["--nce-spacing-base"] = SPACING_SCALE_MAP[form.spacing_scale] || "1rem"
	}
	if (form.shadow_color) vars["--nce-shadow-color"] = form.shadow_color
	if (form.shadow) {
		vars["--nce-shadow"] = buildThemeShadow(
			form.shadow,
			form.shadow_color || "#000000",
			form.shadow_opacity ?? fallbacks.shadow_opacity,
			form.shadow_direction ?? fallbacks.shadow_direction,
		)
	}
	if (form.transition_speed) vars["--nce-transition-speed"] = TRANSITION_MAP[form.transition_speed] || "200ms"
	if (form.sidebar_width) vars["--nce-sidebar-width"] = form.sidebar_width
	if (form.container_max_width) {
		vars["--nce-container-max-width"] = form.container_max_width === "full" ? "100%" : form.container_max_width
	}
	applyTableCssVars(form, vars)
	// Shade scales for brand/status colors (live preview)
	for (const [field, varPrefix] of SHADE_PREVIEW_FIELDS) {
		const hex = form[field]
		if (!hex) continue
		const hasAdjust = GAMMA_SAT_ROLE_FIELDS.has(field)
		const { gamma, saturation } = hasAdjust
			? roleShadeAdjustments(form, field)
			: { gamma: 0, saturation: 100 }
		const roleHex =
			hasAdjust && !corporateBrand && (gamma !== 0 || saturation !== 100)
				? effectiveRoleHex(hex, gamma, saturation)
				: hex
		const shades = generateShades(hex, hasAdjust ? { gamma, saturation } : undefined)
		const isBrand = field === "primary_color" || field === "secondary_color"
		let oppShades: ColorShade[] = []
		if (field === "primary_color" && form.secondary_color) {
			const oppAdj = roleShadeAdjustments(form, "secondary_color")
			oppShades = generateShades(form.secondary_color, oppAdj)
		} else if (field === "secondary_color" && form.primary_color) {
			const oppAdj = roleShadeAdjustments(form, "primary_color")
			oppShades = generateShades(form.primary_color, oppAdj)
		}
		if (isBrand) {
			const flipMono = form[`${field}_fg_flip_mono`] as number | null
			const flipTonal = form[`${field}_fg_flip_tonal`] as number | null
			const poleDark = form[`${field}_fg_pole_tonal_dark`] as number | null
			const poleLight = form[`${field}_fg_pole_tonal_light`] as number | null
			vars[`--nce-${varPrefix}-fg`] = brandShadeForeground(
				600, shades, "mono", flipMono, null, oppShades,
			)
			vars[`--nce-${varPrefix}-fg-tonal`] = brandShadeForeground(
				600, shades, "tonal", flipTonal, null, oppShades, poleDark, poleLight,
			)
		} else {
			vars[`--nce-${varPrefix}-fg`] = pickFgMono(roleHex)
			vars[`--nce-${varPrefix}-fg-tonal`] = pickFgTonal(roleHex)
		}
		for (const s of shades) {
			vars[`--nce-${varPrefix}-${s.shade}`] = s.hex
			vars[`--${varPrefix}-${s.shade}`] = s.hex
			if (CURATED_SHADES.includes(s.shade as (typeof CURATED_SHADES)[number])) {
				if (isBrand) {
					const flipMono = form[`${field}_fg_flip_mono`] as number | null
					const flipTonal = form[`${field}_fg_flip_tonal`] as number | null
					const poleDark = form[`${field}_fg_pole_tonal_dark`] as number | null
					const poleLight = form[`${field}_fg_pole_tonal_light`] as number | null
					vars[`--nce-${varPrefix}-${s.shade}-fg`] = brandShadeForeground(
						s.shade, shades, "mono", flipMono, null, oppShades,
					)
					vars[`--nce-${varPrefix}-${s.shade}-fg-tonal`] = brandShadeForeground(
						s.shade, shades, "tonal", flipTonal, null, oppShades, poleDark, poleLight,
					)
				} else {
					vars[`--nce-${varPrefix}-${s.shade}-fg`] = pickFgMono(s.hex)
					vars[`--nce-${varPrefix}-${s.shade}-fg-tonal`] = pickFgTonal(s.hex)
				}
			}
		}
	}
	const nWarmth2 = Number(form.neutral_color_warmth ?? 0)
	const n600 = neutral600Hex(nWarmth2)
	vars["--nce-color-neutral-fg"] = pickFgMono(n600)
	vars["--nce-color-neutral-fg-tonal"] = pickFgTonal(n600)
	for (const s of generateNeutralShades(nWarmth2)) {
		vars[`--nce-color-neutral-${s.shade}`] = s.hex
		vars[`--nce-color-neutral-${s.shade}-fg`] = pickFgMono(s.hex)
		vars[`--nce-color-neutral-${s.shade}-fg-tonal`] = pickFgTonal(s.hex)
	}
	return vars
}
