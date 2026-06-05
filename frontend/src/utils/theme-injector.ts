import {
	pickFgMono,
	pickFgTonal,
	generateShades,
	effectiveRoleHex,
} from "./color-shades"

const FG_ROLES = [
	"primary_color",
	"secondary_color",
	"accent_color",
	"success_color",
	"info_color",
	"warning_color",
	"danger_color",
] as const
const GAMMA_SAT_ROLES = new Set(["primary_color", "secondary_color"])
const CURATED_SHADES = [100, 200, 300, 500, 600, 700, 900] as const
const ROLE_VAR: Record<string, string> = {
	primary_color: "color-primary",
	secondary_color: "color-secondary",
	accent_color: "color-accent",
	success_color: "color-success",
	info_color: "color-info",
	warning_color: "color-warning",
	danger_color: "color-danger",
}

const RADIUS_MAP: Record<string, string> = {
	none: "0",
	sm: "0.125rem",
	md: "0.375rem",
	lg: "0.5rem",
	"x-lg": "0.75rem",
	full: "0.75rem",
}

const SPACING_MAP: Record<string, string> = {
	tight: "0.75rem",
	normal: "1rem",
	relaxed: "1.5rem",
}

function roleAdjustments(role: string, settings: Record<string, unknown>) {
	if (!GAMMA_SAT_ROLES.has(role)) return undefined
	return {
		gamma: Number(settings[`${role}_gamma`] ?? 0),
		saturation: Number(settings[`${role}_saturation`] ?? 100),
	}
}

export function generateCSSVars(settings: Record<string, any>): string {
	const lines: string[] = [":root {"]

	if (settings.primary_color) {
		const adj = roleAdjustments("primary_color", settings)
		const hex = adj
			? effectiveRoleHex(settings.primary_color, adj.gamma, adj.saturation)
			: settings.primary_color
		lines.push(`\t--nce-color-primary: ${hex};`)
	}
	if (settings.font_family) {
		lines.push(`\t--nce-font-family: '${settings.font_family}', sans-serif;`)
	}

	const radius = RADIUS_MAP[settings.border_radius || "md"] || "0.375rem"
	lines.push(`\t--nce-border-radius: ${radius};`)

	const spacing = SPACING_MAP[settings.spacing_scale || "normal"] || "1rem"
	lines.push(`\t--nce-spacing-base: ${spacing};`)

	lines.push("}")
	return lines.join("\n")
}

export function injectCSSVars(settings: Record<string, any>) {
	const root = document.documentElement

	if (settings.primary_color) {
		const adj = roleAdjustments("primary_color", settings)
		const hex = adj
			? effectiveRoleHex(settings.primary_color, adj.gamma, adj.saturation)
			: settings.primary_color
		root.style.setProperty("--nce-color-primary", hex)
	}
	for (const role of FG_ROLES) {
		const hex = settings[role]
		if (!hex) continue
		const v = ROLE_VAR[role]
		const adj = roleAdjustments(role, settings)
		const roleHex = adj
			? effectiveRoleHex(hex, adj.gamma, adj.saturation)
			: hex
		if (GAMMA_SAT_ROLES.has(role)) {
			root.style.setProperty(`--nce-${v}`, roleHex)
		}
		root.style.setProperty(`--nce-${v}-fg`, pickFgMono(roleHex))
		root.style.setProperty(`--nce-${v}-fg-tonal`, pickFgTonal(roleHex))
		const shades = generateShades(hex, adj)
		for (const s of shades) {
			if (!CURATED_SHADES.includes(s.shade as (typeof CURATED_SHADES)[number]))
				continue
			root.style.setProperty(`--nce-${v}-${s.shade}`, s.hex)
			root.style.setProperty(`--nce-${v}-${s.shade}-fg`, pickFgMono(s.hex))
			root.style.setProperty(`--nce-${v}-${s.shade}-fg-tonal`, pickFgTonal(s.hex))
		}
	}
	if (settings.font_family) {
		root.style.setProperty("--nce-font-family", `'${settings.font_family}', sans-serif`)
	}

	const radius = RADIUS_MAP[settings.border_radius || "md"] || "0.375rem"
	root.style.setProperty("--nce-border-radius", radius)

	const spacing = SPACING_MAP[settings.spacing_scale || "normal"] || "1rem"
	root.style.setProperty("--nce-spacing-base", spacing)
}
