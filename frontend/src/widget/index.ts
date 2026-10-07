// Widget entry that exports the swatch picker API and mounts it on window and frappe.ui.
//
// code-index:begin
// {
//  "purpose": "Widget entry that exports the swatch picker API and mounts it on window and frappe.ui.",
//  "read_when": "When changing what the theme swatch picker bundle exports or mounts on window.",
//  "gotchas": [],
//  "keywords": ["mountStandaloneThemeSwatchPicker", "mountDeskThemeSwatchPicker", "themeSwatchPicker", "parseThemeClass", "composeThemeClass", "isOpen"],
//  "format": 1
// }
// code-index:end

import { close, isOpen, open } from "./theme-swatch-picker-core"
import { composeThemeClass, parseThemeClass } from "./class-utils"
import {
	openDeskThemeSwatchPicker,
	mountDeskThemeSwatchPicker,
} from "./adapters/desk-adapter"
import {
	openStandaloneThemeSwatchPicker,
	mountStandaloneThemeSwatchPicker,
} from "./adapters/standalone-adapter"

export {
	open,
	close,
	isOpen,
	composeThemeClass,
	parseThemeClass,
	openDeskThemeSwatchPicker,
	openStandaloneThemeSwatchPicker,
}

const api = {
	open: openStandaloneThemeSwatchPicker,
	close,
	isOpen,
	parseThemeClass,
	composeThemeClass,
}

export default api

declare global {
	interface Window {
		themeSwatchPicker?: typeof api
		frappe?: { ui: Record<string, unknown> }
	}
}

if (typeof window !== "undefined") {
	mountStandaloneThemeSwatchPicker(window)
	const frappe = window.frappe
	if (frappe?.ui) {
		mountDeskThemeSwatchPicker(frappe)
	}
}
