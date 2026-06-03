import { ref } from "vue"
import { createResource } from "frappe-ui"

const themeLoaded = ref(false)

export function useTheme() {
	const themeEditor = createResource({
		url: "themes.api.get_active_theme_editor",
	})

	async function loadTheme() {
		if (themeLoaded.value) return
		await themeEditor.reload()
		if (themeEditor.data?.payload) {
			applyThemeVars(themeEditor.data.payload)
			themeLoaded.value = true
		}
	}

	function applyThemeVars(settings: Record<string, any>) {
		const root = document.documentElement
		if (settings.primary_color) {
			root.style.setProperty("--nce-color-primary", settings.primary_color)
		}
		if (settings.font_family) {
			root.style.setProperty("--nce-font-family", `'${settings.font_family}', sans-serif`)
		}
	}

	return { themeEditor, loadTheme, themeLoaded }
}
