import { ref } from "vue"
import { createResource } from "frappe-ui"

export const DESK_VAR_MAP: Record<string, string> = {
	primary_color: "--primary-color",
	brand_color: "--brand-color",
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
	awesomplete_hover_bg: "--awesomplete-hover-bg",
	btn_height: "--btn-height",
	border_radius: "--border-radius",
	border_radius_lg: "--border-radius-lg",
	border_radius_full: "--border-radius-full",
	g_bar_color: "--g-bar-color",
	g_bar_border: "--g-bar-border",
	g_progress_color: "--g-progress-color",
	g_header_background: "--g-header-background",
	g_row_color: "--g-row-color",
	g_today_highlight: "--g-today-highlight",
	// Typography — font_size and font_weight_body are direct values
	font_size: "--font-size-base",
	font_weight_body: "--nce-font-weight",
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
