/**
 * Build live class → resolved-value rows for the Theme Editor System tab.
 * Class names and var bindings mirror themes/utils/css_writer.py emitters.
 */
import { CURATED_SHADES, SHADE_SCALE_FIELDS } from "@/domain/theme-tokens"

export type ThemeClassCatalogRow = {
	className: string
	cssVars: string
	value: string
	swatch?: string
}

export type ThemeClassCatalogSection = {
	id: string
	title: string
	rows: ThemeClassCatalogRow[]
}

type Vars = Record<string, string>

function varVal(vars: Vars, name: string): string | undefined {
	const v = vars[name]
	return v && v.trim() ? v : undefined
}

function roleFromPrefix(prefix: string): string {
	return prefix.replace(/^color-/, "")
}

function evalScaled(base: string | undefined, factor: number): string {
	if (!base) return "—"
	const m = base.trim().match(/^([\d.]+)(px|rem|em|%)?$/)
	if (!m) return `calc(${base} × ${factor})`
	const num = parseFloat(m[1]) * factor
	const unit = m[2] ?? ""
	return `${Number(num.toFixed(4))}${unit}`
}

function pushRow(
	rows: ThemeClassCatalogRow[],
	className: string,
	cssVars: string,
	value: string,
	swatch?: string,
) {
	if (!value || value === "—") return
	rows.push({ className, cssVars, value, swatch })
}

function pushColorRow(
	rows: ThemeClassCatalogRow[],
	className: string,
	cssVar: string,
	vars: Vars,
) {
	const hex = varVal(vars, cssVar)
	if (!hex) return
	pushRow(rows, className, cssVar, hex, hex)
}

function pushBgFgRow(
	rows: ThemeClassCatalogRow[],
	className: string,
	bgVar: string,
	fgVar: string,
	vars: Vars,
) {
	const bg = varVal(vars, bgVar)
	if (!bg) return
	const fg = varVal(vars, fgVar) ?? "—"
	pushRow(rows, className, `${bgVar}, ${fgVar}`, `background ${bg}; color ${fg}`, bg)
}

function buildRoleSection(role: string, varPrefix: string, vars: Vars): ThemeClassCatalogSection {
	const rows: ThemeClassCatalogRow[] = []
	const baseVar = `--nce-${varPrefix}`
	const fgVar = `${baseVar}-fg`
	const fgTonalVar = `${baseVar}-fg-tonal`

	pushBgFgRow(rows, `theme-bg-${role}`, baseVar, fgVar, vars)
	pushColorRow(rows, `theme-text-${role}`, baseVar, vars)
	pushColorRow(rows, `theme-border-${role}`, baseVar, vars)
	pushColorRow(rows, `theme-text-${role}-fg`, fgVar, vars)
	pushColorRow(rows, `theme-text-${role}-fg-tonal`, fgTonalVar, vars)

	for (const shade of CURATED_SHADES) {
		const shadeVar = `${baseVar}-${shade}`
		const shadeFg = `${shadeVar}-fg`
		const shadeFgTonal = `${shadeVar}-fg-tonal`
		if (!varVal(vars, shadeVar)) continue
		pushBgFgRow(rows, `theme-bg-${role}-${shade}`, shadeVar, shadeFg, vars)
		pushColorRow(rows, `theme-text-${role}-${shade}`, shadeVar, vars)
		pushColorRow(rows, `theme-text-${role}-${shade}-fg`, shadeFg, vars)
		pushColorRow(rows, `theme-text-${role}-${shade}-fg-tonal`, shadeFgTonal, vars)
		pushColorRow(rows, `theme-border-${role}-${shade}`, shadeVar, vars)
	}

	const title = role.charAt(0).toUpperCase() + role.slice(1)
	return { id: `role-${role}`, title, rows }
}

function buildSurfacesSection(vars: Vars): ThemeClassCatalogSection {
	const rows: ThemeClassCatalogRow[] = []
	pushColorRow(rows, "theme-bg-bg-page", "--nce-color-bg", vars)
	pushColorRow(rows, "theme-bg-surface", "--nce-color-surface", vars)
	pushColorRow(rows, "theme-bg-card", "--nce-color-surface", vars)
	pushColorRow(rows, "theme-bg-row-alt", "--nce-color-row-alt", vars)
	pushBgFgRow(
		rows,
		"theme-bg-header",
		"--nce-color-primary",
		"--nce-color-primary-fg",
		vars,
	)
	pushColorRow(rows, "theme-text-text-header", "--nce-color-primary-fg", vars)
	return { id: "surfaces", title: "Surfaces & chrome", rows }
}

function buildTextSection(vars: Vars): ThemeClassCatalogSection {
	const rows: ThemeClassCatalogRow[] = []
	pushColorRow(rows, "theme-text-heading", "--nce-color-heading", vars)
	pushColorRow(rows, "theme-text-muted", "--nce-color-muted", vars)
	pushColorRow(rows, "theme-text-link", "--nce-color-link", vars)
	const body = varVal(vars, "--nce-color-text")
	if (body) {
		pushRow(rows, "(body default)", "--nce-color-text", body, body)
	}
	return { id: "text", title: "Text roles", rows }
}

function buildBordersSection(vars: Vars): ThemeClassCatalogSection {
	const rows: ThemeClassCatalogRow[] = []
	const border = varVal(vars, "--nce-color-border")
	const thin = varVal(vars, "--nce-border-width-thin")
	const normal = varVal(vars, "--nce-border-width")
	const strong = varVal(vars, "--nce-border-width-strong")
	const focus = varVal(vars, "--nce-color-focus")

	if (border && thin) {
		pushRow(
			rows,
			"theme-border-thin",
			"--nce-border-width-thin, --nce-color-border",
			`${thin} solid ${border}`,
		)
	}
	if (border && normal) {
		pushRow(
			rows,
			"theme-border",
			"--nce-border-width, --nce-color-border",
			`${normal} solid ${border}`,
		)
	}
	if (border && strong) {
		pushRow(
			rows,
			"theme-border-strong",
			"--nce-border-width-strong, --nce-color-border",
			`${strong} solid ${border}`,
		)
	}
	if (border) {
		pushColorRow(rows, "theme-border-input-border", "--nce-color-border", vars)
	}
	if (focus) {
		pushColorRow(rows, "theme-border-input-focus", "--nce-color-focus", vars)
	}

	if (thin) pushRow(rows, "(var)", "--nce-border-width-thin", thin)
	if (normal) pushRow(rows, "(var)", "--nce-border-width", normal)
	if (strong) pushRow(rows, "(var)", "--nce-border-width-strong", strong)

	return { id: "borders", title: "Borders & focus", rows }
}

function buildTypographySection(vars: Vars): ThemeClassCatalogSection {
	const rows: ThemeClassCatalogRow[] = []
	const bodyFont = varVal(vars, "--nce-font-family")
	const headingFont = varVal(vars, "--nce-font-heading")
	const baseSize = varVal(vars, "--nce-font-size")
	const lineHeight = varVal(vars, "--nce-line-height")
	const weight = varVal(vars, "--nce-font-weight")

	if (bodyFont) pushRow(rows, "theme-font-sans", "--nce-font-family", bodyFont)
	if (headingFont) pushRow(rows, "theme-font-heading", "--nce-font-heading", headingFont)

	const sizes: Array<[string, number | null]> = [
		["xs", 0.75],
		["sm", 0.875],
		["base", null],
		["lg", 1.125],
		["xl", 1.25],
		["2xl", 1.5],
		["3xl", 1.875],
		["4xl", 2.25],
	]
	for (const [name, mul] of sizes) {
		if (!baseSize) continue
		const value = mul === null ? baseSize : evalScaled(baseSize, mul)
		const cssVars =
			mul === null ? "--nce-font-size" : `--nce-font-size × ${mul}`
		pushRow(rows, `theme-text-${name}`, cssVars, value)
	}

	if (lineHeight) pushRow(rows, "(var)", "--nce-line-height", lineHeight)
	if (weight) pushRow(rows, "(var)", "--nce-font-weight", weight)

	return { id: "typography", title: "Typography", rows }
}

function buildShapeSection(vars: Vars): ThemeClassCatalogSection {
	const rows: ThemeClassCatalogRow[] = []
	const radius = varVal(vars, "--nce-border-radius")
	const shadow = varVal(vars, "--nce-shadow")
	const speed = varVal(vars, "--nce-transition-speed")

	if (radius) {
		pushRow(rows, "theme-rounded", "--nce-border-radius", radius)
		pushRow(rows, "theme-rounded-sm", "--nce-border-radius × 0.5", evalScaled(radius, 0.5))
		pushRow(rows, "theme-rounded-md", "--nce-border-radius", radius)
		pushRow(rows, "theme-rounded-lg", "--nce-border-radius × 1.5", evalScaled(radius, 1.5))
		pushRow(rows, "theme-rounded-xl", "--nce-border-radius × 2", evalScaled(radius, 2))
	}
	if (shadow) {
		pushRow(rows, "theme-shadow", "--nce-shadow", shadow)
		pushRow(rows, "theme-shadow-theme", "--nce-shadow", shadow)
	}
	if (speed) pushRow(rows, "theme-duration-theme", "--nce-transition-speed", speed)

	return { id: "shape", title: "Shape & motion", rows }
}

function buildSpacingSection(vars: Vars): ThemeClassCatalogSection {
	const rows: ThemeClassCatalogRow[] = []
	const base = varVal(vars, "--nce-spacing-base")
	if (!base) return { id: "spacing", title: "Spacing", rows }

	const scales: Array<[string, number | null]> = [
		["xs", 0.25],
		["sm", 0.5],
		["md", null],
		["lg", 1.5],
		["xl", 2],
	]
	for (const [name, mul] of scales) {
		const value = mul === null ? base : evalScaled(base, mul)
		const cssVars = mul === null ? "--nce-spacing-base" : `--nce-spacing-base × ${mul}`
		pushRow(rows, `theme-p-${name}`, cssVars, value)
		pushRow(rows, `theme-m-${name}`, cssVars, value)
		pushRow(rows, `theme-gap-${name}`, cssVars, value)
	}

	return { id: "spacing", title: "Spacing", rows }
}

function buildEscapeHatchSection(vars: Vars): ThemeClassCatalogSection {
	const rows: ThemeClassCatalogRow[] = []
	const primary = varVal(vars, "--nce-color-primary")
	if (primary) {
		pushRow(
			rows,
			"theme-bg-themed",
			"--bg (runtime), --nce-color-primary fallback",
			`background var(--bg, ${primary}); fg computed from --bg`,
			primary,
		)
	}
	return { id: "escape", title: "Dynamic shade", rows }
}

/** Build accordion sections from live --nce-* variables (same source as preview/publish). */
export function buildThemeClassCatalog(vars: Vars): ThemeClassCatalogSection[] {
	const sections: ThemeClassCatalogSection[] = []

	for (const [, varPrefix] of Object.entries(SHADE_SCALE_FIELDS)) {
		const role = roleFromPrefix(varPrefix)
		const section = buildRoleSection(role, varPrefix, vars)
		if (section.rows.length) sections.push(section)
	}

	const fixed = [
		buildSurfacesSection,
		buildTextSection,
		buildBordersSection,
		buildTypographySection,
		buildShapeSection,
		buildSpacingSection,
		buildEscapeHatchSection,
	]
	for (const build of fixed) {
		const section = build(vars)
		if (section.rows.length) sections.push(section)
	}

	return sections
}

export function filterThemeClassCatalog(
	sections: ThemeClassCatalogSection[],
	query: string,
): ThemeClassCatalogSection[] {
	const q = query.trim().toLowerCase()
	if (!q) return sections
	return sections
		.map((section) => ({
			...section,
			rows: section.rows.filter(
				(row) =>
					row.className.toLowerCase().includes(q) ||
					row.cssVars.toLowerCase().includes(q) ||
					row.value.toLowerCase().includes(q),
			),
		}))
		.filter((section) => section.rows.length > 0)
}

export function catalogRowCount(sections: ThemeClassCatalogSection[]): number {
	return sections.reduce((n, s) => n + s.rows.length, 0)
}
