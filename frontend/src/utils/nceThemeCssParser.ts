/**
 * Parse nce_theme.css from disk to build the System tab class catalog.
 *
 * The file has two parts:
 *   Part 1 — :root { --nce-*: value; }          (the actual values)
 *   Part 2 — .theme-* { prop: var(--nce-*); }   (the class → var mapping)
 *
 * We fetch the published file so values always match what the consuming app sees —
 * no JS reimplementation, no drift from Python css_writer.py.
 */

const CSS_PATH = "/assets/themes/css/nce_theme.css"

/** Fetch published nce_theme.css. cssHash is used as a cache-buster only. */
export async function fetchNceThemeCss(cssHash?: string): Promise<string> {
	const url = cssHash ? `${CSS_PATH}?v=${cssHash}` : CSS_PATH
	const res = await fetch(url)
	if (!res.ok) throw new Error(`nce_theme.css not found (${res.status}) — save the theme to publish it.`)
	return res.text()
}

/** Extract the content inside a selector's { } block (brace-counting, handles nested). */
function extractBlock(css: string, selector: string): string | null {
	const idx = css.indexOf(selector)
	if (idx === -1) return null
	const open = css.indexOf("{", idx)
	if (open === -1) return null
	let depth = 1
	let i = open + 1
	while (i < css.length && depth > 0) {
		if (css[i] === "{") depth++
		else if (css[i] === "}") depth--
		i++
	}
	return css.slice(open + 1, i - 1)
}

/**
 * Parse --nce-* variable declarations from a selector block.
 * selector defaults to ":root" (Default / site base theme vars).
 * Pass '[data-nce-theme="slug"]' for a named theme's scoped vars.
 */
export function parseVarBlock(css: string, selector = ":root"): Record<string, string> {
	const block = extractBlock(css, selector)
	if (!block) return {}
	const vars: Record<string, string> = {}
	// Each --nce-* declaration is on its own line from _emit_var_block
	const re = /^\s*(--nce-[\w-]+)\s*:\s*(.+?)\s*;/gm
	for (const m of block.matchAll(re)) {
		vars[m[1]] = m[2]
	}
	return vars
}

export type ClassRule = {
	className: string   // e.g. "theme-bg-primary"
	vars: string[]      // --nce-* var names referenced, in order
	rawDecl: string     // raw CSS declarations inside {}
}

/**
 * Parse .theme-* class rules from the class layer of nce_theme.css.
 * Each rule is emitted on a single line by css_writer.py.
 */
export function parseClassRules(css: string): ClassRule[] {
	const rules: ClassRule[] = []
	// Match single-line rules: .theme-foo { ... } or .theme-foo, .legacy { ... }
	const re = /^(\.theme-[\w-]+(?:\s*,\s*\.[\w-]+)*)\s*\{([^}]+)\}/gm
	for (const m of css.matchAll(re)) {
		const selectorPart = m[1]
		const rawDecl = m[2].trim()
		const themeMatch = selectorPart.match(/\.theme-[\w-]+/)
		if (!themeMatch) continue
		const className = themeMatch[0].slice(1) // strip leading dot
		const varRe = /var\((--nce-[\w-]+)\)/g
		const vars: string[] = []
		for (const vm of rawDecl.matchAll(varRe)) {
			if (!vars.includes(vm[1])) vars.push(vm[1])
		}
		rules.push({ className, rawDecl, vars })
	}
	return rules
}

/** Replace var(--nce-*) references in a declaration string with actual values. */
export function resolveVars(decl: string, vars: Record<string, string>): string {
	return decl.replace(/var\((--nce-[\w-]+)\)/g, (_, name) => vars[name] ?? `var(${name})`)
}

/** Extract first hex color from a resolved value string (for swatches). */
export function swatchFromValue(value: string): string | undefined {
	const m = value.match(/#[0-9a-fA-F]{6}\b/)
	return m ? m[0] : undefined
}

// ── Section grouping ───────────────────────────────────────────────────────

const ROLES = ["primary", "secondary", "accent", "success", "info", "warning", "danger", "neutral"]

function getSectionId(className: string): string {
	for (const role of ROLES) {
		if (
			className.startsWith(`theme-bg-${role}`) ||
			className.startsWith(`theme-text-${role}`) ||
			className.startsWith(`theme-border-${role}`)
		) return `role-${role}`
	}
	if (
		className === "theme-bg-bg-page" ||
		className === "theme-bg-surface" ||
		className === "theme-bg-card" ||
		className === "theme-bg-row-alt" ||
		className === "theme-bg-header" ||
		className === "theme-text-text-header" ||
		className === "theme-bg-themed"
	) return "surfaces"
	if (
		className === "theme-text-heading" ||
		className === "theme-text-muted" ||
		className === "theme-text-link"
	) return "text"
	if (className.startsWith("theme-border")) return "borders"
	if (
		className.startsWith("theme-font") ||
		/^theme-text-(xs|sm|base|lg|xl|2xl|3xl|4xl)$/.test(className)
	) return "typography"
	if (
		className.startsWith("theme-rounded") ||
		className.startsWith("theme-shadow") ||
		className.startsWith("theme-duration")
	) return "shape"
	if (
		className.startsWith("theme-p-") ||
		className.startsWith("theme-m-") ||
		className.startsWith("theme-gap-")
	) return "spacing"
	return "other"
}

const SECTION_META: Record<string, { title: string; order: number }> = {
	"role-primary":   { title: "Primary",          order: 0 },
	"role-secondary": { title: "Secondary",         order: 1 },
	"role-accent":    { title: "Accent",            order: 2 },
	"role-success":   { title: "Success",           order: 3 },
	"role-info":      { title: "Info",              order: 4 },
	"role-warning":   { title: "Warning",           order: 5 },
	"role-danger":    { title: "Danger",            order: 6 },
	"role-neutral":   { title: "Neutral",           order: 7 },
	"surfaces":       { title: "Surfaces & chrome", order: 8 },
	"text":           { title: "Text roles",        order: 9 },
	"borders":        { title: "Borders & focus",   order: 10 },
	"typography":     { title: "Typography",        order: 11 },
	"shape":          { title: "Shape & motion",    order: 12 },
	"spacing":        { title: "Spacing",           order: 13 },
	"other":          { title: "Other",             order: 14 },
}

export type CatalogRow = {
	className: string
	cssVars: string        // comma-joined var names
	value: string          // resolved declarations (var() replaced with values)
	swatch?: string        // first hex color, if any
}

export type CatalogSection = {
	id: string
	title: string
	rows: CatalogRow[]
}

/**
 * Resolve the full var map for a theme.
 * Always starts from :root (Default / site base values).
 * If a slug is provided, merges the scoped block on top — named theme overrides win.
 */
export function resolveThemeVars(css: string, themeSlug?: string): Record<string, string> {
	const root = parseVarBlock(css, ":root")
	if (!themeSlug) return root
	const scoped = parseVarBlock(css, `[data-nce-theme="${themeSlug}"]`)
	return { ...root, ...scoped }
}

/** Build accordion sections from parsed class rules + resolved var values. */
export function buildCatalogSections(
	rules: ClassRule[],
	vars: Record<string, string>,
): CatalogSection[] {
	const map = new Map<string, CatalogRow[]>()

	for (const rule of rules) {
		if (!rule.vars.length) continue
		const value = resolveVars(rule.rawDecl, vars)
		const row: CatalogRow = {
			className: rule.className,
			cssVars: rule.vars.join(", "),
			value,
			swatch: swatchFromValue(value),
		}
		const id = getSectionId(rule.className)
		if (!map.has(id)) map.set(id, [])
		map.get(id)!.push(row)
	}

	return [...map.entries()]
		.map(([id, rows]) => ({
			id,
			title: SECTION_META[id]?.title ?? id,
			rows,
			order: SECTION_META[id]?.order ?? 99,
		}))
		.sort((a, b) => a.order - b.order)
		.map(({ id, title, rows }) => ({ id, title, rows }))
}
