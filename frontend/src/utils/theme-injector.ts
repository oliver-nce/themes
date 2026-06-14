import {
	pickFgMono,
	pickFgTonal,
	generateShades,
	generateNeutralShades,
	neutral600Hex,
	effectiveRoleHex,
} from "./color-shades"
import {
	BORDER_RADIUS_MAP,
	BORDER_WIDTH_MAP,
	CURATED_SHADES,
	FG_SHADE_ROLES,
	GAMMA_SAT_ROLE_FIELDS,
	ROLE_VAR_MAP,
	SPACING_SCALE_MAP,
} from "@/domain/theme-tokens"

function roleAdjustments(role: string, settings: Record<string, unknown>) {
	if (!GAMMA_SAT_ROLE_FIELDS.has(role)) return undefined
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

	const radius = BORDER_RADIUS_MAP[settings.border_radius || "md"] || "0.375rem"
	lines.push(`\t--nce-border-radius: ${radius};`)

	const bwThin = BORDER_WIDTH_MAP[settings.border_width_thin || "0.5px"] || "0.5px"
	lines.push(`\t--nce-border-width-thin: ${bwThin};`)
	const bw = BORDER_WIDTH_MAP[settings.border_width || "1px"] || "1px"
	lines.push(`\t--nce-border-width: ${bw};`)
	const bwStrong = BORDER_WIDTH_MAP[settings.border_width_strong || "2px"] || "2px"
	lines.push(`\t--nce-border-width-strong: ${bwStrong};`)

	const spacing = SPACING_SCALE_MAP[settings.spacing_scale || "normal"] || "1rem"
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
	for (const role of FG_SHADE_ROLES) {
		const hex = settings[role]
		if (!hex) continue
		const v = ROLE_VAR_MAP[role]
		const adj = roleAdjustments(role, settings)
		let roleHex = hex
		if (GAMMA_SAT_ROLE_FIELDS.has(role) && adj && "saturation" in adj) {
			roleHex = effectiveRoleHex(hex, adj.gamma, adj.saturation)
			root.style.setProperty(`--nce-${v}`, roleHex)
		}
		root.style.setProperty(`--nce-${v}-fg`, pickFgMono(roleHex))
		// Cross-brand tonal: primary bg → secondary text, secondary bg → primary text
		let tonalHex: string
		if (role === "primary_color" && settings.secondary_color) {
			tonalHex = String(settings.secondary_color)
		} else if (role === "secondary_color" && settings.primary_color) {
			tonalHex = String(settings.primary_color)
		} else {
			tonalHex = pickFgTonal(roleHex)
		}
		root.style.setProperty(`--nce-${v}-fg-tonal`, tonalHex)
		const shades = generateShades(hex, adj && "saturation" in adj ? adj : undefined)
		for (const s of shades) {
			if (!CURATED_SHADES.includes(s.shade as (typeof CURATED_SHADES)[number]))
				continue
			root.style.setProperty(`--nce-${v}-${s.shade}`, s.hex)
			root.style.setProperty(`--nce-${v}-${s.shade}-fg`, pickFgMono(s.hex))
			root.style.setProperty(`--nce-${v}-${s.shade}-fg-tonal`, pickFgTonal(s.hex))
		}
	}
	const neutralShades = settings.neutral_color_shades as Record<string, string> | undefined
	const neutralWarmth = Number(settings.neutral_color_warmth ?? 0)
	const shadeList = neutralShades
		? Object.entries(neutralShades).map(([shade, hex]) => ({
				shade: Number(shade),
				hex: String(hex),
			}))
		: generateNeutralShades(neutralWarmth)
	const n600 = String(settings.neutral_color ?? neutral600Hex(neutralWarmth))
	root.style.setProperty("--nce-color-neutral", n600)
	root.style.setProperty("--nce-color-neutral-fg", pickFgMono(n600))
	root.style.setProperty("--nce-color-neutral-fg-tonal", pickFgTonal(n600))
	for (const s of shadeList) {
		root.style.setProperty(`--nce-color-neutral-${s.shade}`, s.hex)
		root.style.setProperty(`--nce-color-neutral-${s.shade}-fg`, pickFgMono(s.hex))
		root.style.setProperty(`--nce-color-neutral-${s.shade}-fg-tonal`, pickFgTonal(s.hex))
	}
	if (settings.font_family) {
		root.style.setProperty("--nce-font-family", `'${settings.font_family}', sans-serif`)
	}

	const radius = BORDER_RADIUS_MAP[settings.border_radius || "md"] || "0.375rem"
	root.style.setProperty("--nce-border-radius", radius)

	const bwThin = BORDER_WIDTH_MAP[settings.border_width_thin || "0.5px"] || "0.5px"
	root.style.setProperty("--nce-border-width-thin", bwThin)
	const bw = BORDER_WIDTH_MAP[settings.border_width || "1px"] || "1px"
	root.style.setProperty("--nce-border-width", bw)
	const bwStrong = BORDER_WIDTH_MAP[settings.border_width_strong || "2px"] || "2px"
	root.style.setProperty("--nce-border-width-strong", bwStrong)

	const spacing = SPACING_SCALE_MAP[settings.spacing_scale || "normal"] || "1rem"
	root.style.setProperty("--nce-spacing-base", spacing)
}
