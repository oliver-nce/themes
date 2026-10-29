// Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
//
import { ref } from "vue"
import { createResource } from "frappe-ui"

export const DESK_VAR_MAP: Record<string, string> = {
	bg_color: "--bg-color",
	fg_color: "--fg-color",
	text_color: "--text-color",
	text_muted: "--text-muted",
	text_light: "--text-light",
	border_color: "--border-color",
	dark_border_color: "--dark-border-color",
	control_bg: "--control-bg",
	control_bg_on_gray: "--control-bg-on-gray",
	btn_default_bg: "--btn-default-bg",
	surface_gray_2: "--surface-gray-2",
	subtle_fg: "--subtle-fg",
	heading_color: "--heading-color",
	btn_height: "--btn-height",
	radius: "--radius",
	input_height: "--input-height",
	checkbox_size: "--checkbox-size",
	border_radius: "--border-radius",
	g_bar_color: "--g-bar-color",
	g_bar_border: "--g-bar-border",
	g_progress_color: "--g-progress-color",
	g_header_background: "--g-header-background",
	g_row_color: "--g-row-color",
	// Typography — font_weight_body targets Frappe v15's --weight-regular (body text weight token)
	font_weight_body: "--weight-regular",
	font_weight_bold: "--nce-weight-bold",
	font_size: "--text-base",
	text_xs: "--text-xs",
	text_sm: "--text-sm",
	text_lg: "--text-lg",
	font_weight_medium: "--font-weight-medium",
	spacing: "--spacing",
	padding_xs: "--padding-xs",
	padding_sm: "--padding-sm",
	padding_md: "--padding-md",
	margin_xs: "--margin-xs",
	margin_sm: "--margin-sm",
	list_row_height: "--list-row-height",
	page_max_width: "--page-max-width",
	page_head_height: "--page-head-height",
	// font_family is handled separately (needs CSS stack conversion)
}

const DESK_FONT_GENERIC: Record<string, string> = {
	Inter: "sans-serif",
	"Source Sans 3": "sans-serif",
	"Public Sans": "sans-serif",
	"Open Sans": "sans-serif",
	Roboto: "sans-serif",
	Nunito: "sans-serif",
	"Source Serif 4": "serif",
	"JetBrains Mono": "monospace",
}

export function deskFontStack(name: string): string {
	if (!name || name === "System Default") return ""
	return `'${name}', ${DESK_FONT_GENERIC[name] || "sans-serif"}`
}

const themeLoaded = ref(false)

export function deskPayloadToCssVars(payload: Record<string, unknown>): Record<string, string> {
	const vars: Record<string, string> = {}
	for (const [key, cssVar] of Object.entries(DESK_VAR_MAP)) {
		const value = payload[key]
		if (value !== undefined && value !== null && String(value).trim()) {
			vars[cssVar] = String(value)
		}
	}
	// Auto text scale (the default): small/label/title sizes follow body size at Frappe's 12/13/16 : 14
	const base = parseFloat(String(payload.font_size ?? ""))
	if ((payload.text_scale_mode || "auto") === "auto" && Number.isFinite(base)) {
		vars["--text-xs"] = `${Math.round((base * 12) / 14)}px`
		vars["--text-sm"] = `${Math.round((base * 13) / 14)}px`
		vars["--text-lg"] = `${Math.round((base * 16) / 14)}px`
	}
	// v16 regular text (list cells, labels) reads --font-weight-regular, not --weight-regular
	if (vars["--weight-regular"]) vars["--font-weight-regular"] = vars["--weight-regular"]
	// Font family requires CSS stack conversion
	const fontName = String(payload.font_family || "").trim()
	const stack = deskFontStack(fontName)
	if (stack) vars["--font-stack"] = stack
	return vars
}

export function applyDeskThemeVars(
	vars: Record<string, string>,
	root: HTMLElement = document.documentElement,
) {
	for (const [key, value] of Object.entries(vars)) {
		if (value) root.style.setProperty(key, value)
	}
}

export function useDeskTheme() {
	const themeEditor = createResource({
		url: "themes.api.get_active_desk_theme_editor",
	})

	async function loadTheme() {
		if (themeLoaded.value) return
		await themeEditor.reload()
		if (themeEditor.data?.payload) {
			applyDeskThemeVars(deskPayloadToCssVars(themeEditor.data.payload))
			themeLoaded.value = true
		}
	}

	function applyThemeVars(settings: Record<string, unknown>) {
		applyDeskThemeVars(deskPayloadToCssVars(settings))
	}

	return { themeEditor, loadTheme, themeLoaded, applyThemeVars }
}
