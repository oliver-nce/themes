// Deep-link lookup: Desk Theme Settings tab for each colour field key (?field=).
//

export type DeskFieldLocation = {
	tab: string
	label: string
}

const DESK_FIELD_LOCATIONS: Record<string, DeskFieldLocation> = {
	bg_color: { tab: "colors", label: "Page Background" },
	fg_color: { tab: "colors", label: "Card / Form Surface" },
	surface_gray_2: { tab: "colors", label: "Subtle Surface" },
	subtle_fg: { tab: "colors", label: "List Header Background" },
	text_color: { tab: "colors", label: "Body Text" },
	text_muted: { tab: "colors", label: "Muted Text" },
	text_light: { tab: "colors", label: "Light Text" },
	heading_color: { tab: "colors", label: "Headings" },
	control_bg: { tab: "colors", label: "Input Fields, Controls & Toolbar Buttons" },
	control_bg_on_gray: { tab: "colors", label: "Sidebar Filter Inputs" },
	border_color: { tab: "colors", label: "Border" },
	dark_border_color: { tab: "colors", label: "Strong Border" },
	btn_default_bg: { tab: "colors", label: "Workspace Quick List Buttons" },
	g_bar_color: { tab: "gantt", label: "Bar" },
	g_bar_border: { tab: "gantt", label: "Bar Border" },
	g_progress_color: { tab: "gantt", label: "Progress" },
	g_header_background: { tab: "gantt", label: "Header Background" },
	g_row_color: { tab: "gantt", label: "Row" },
}

export function locateDeskField(key: string): DeskFieldLocation | null {
	const trimmed = key.trim()
	if (!trimmed) return null
	return DESK_FIELD_LOCATIONS[trimmed] ?? null
}
