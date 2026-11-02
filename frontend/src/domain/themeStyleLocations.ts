// Reverse lookup: which Theme Settings tab and section edit a given theme style class.
//

import data from "./themeStyleLocations.json"

export type ThemeStyleLocation = {
	tab: string
	section: string
	label: string
	field?: string
}

export function locateThemeStyle(kind: string, role: string): ThemeStyleLocation | null {
	const styles = data.styles as Record<string, ThemeStyleLocation>
	return styles[`${kind.toLowerCase()}.${role.toLowerCase()}`] ?? null
}

/** Look up by the Themes style key a host passes (e.g. "table_header_bg_color"). */
export function locateThemeStyleField(styleKey: string): ThemeStyleLocation | null {
	const fields = (data as { fields: Record<string, ThemeStyleLocation> }).fields
	return fields[styleKey] ?? null
}
