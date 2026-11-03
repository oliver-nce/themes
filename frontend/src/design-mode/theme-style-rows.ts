import { THEME_CLASS_CATALOG } from "../domain/theme-class-catalog"

export type StyleRow = {
	id: string
	label: string
	kind: "choice" | "color-role" | "switch"
	options: readonly { value: string; label: string }[]
	pickKind?: "bg" | "text" | "border"
	fgField?: string
	legacyField?: string
}

export type TableDividerStyleRow = {
	id: string
	label: string
	kind: "table-divider"
	widthPropId: string
	colorPropId: string
	options: readonly { value: string; label: string }[]
}

export type DialogStyleRow = StyleRow | TableDividerStyleRow

export function isTableDividerRow(row: DialogStyleRow): row is TableDividerStyleRow {
	return row.kind === "table-divider"
}

const { properties, classes } = THEME_CLASS_CATALOG

const TABLE_PROPERTY_ID_SET = new Set(
	(THEME_CLASS_CATALOG as { tablePropertyIds?: readonly string[] }).tablePropertyIds ?? [],
)

function isElementLevelPropertyId(id: string): boolean {
	if (id.startsWith("table-")) return false
	if (TABLE_PROPERTY_ID_SET.has(id)) return false
	return Object.prototype.hasOwnProperty.call(properties, id)
}

const BORDER_WIDTH_OPTIONS = [
	{ value: "", label: "Theme default" },
	{ value: "theme-border-thin", label: "Thin" },
	{ value: "theme-border", label: "Normal" },
	{ value: "theme-border-strong", label: "Strong" },
] as const

export const TABLE_STYLE_TAB_IDS = ["component", "instance"] as const

export function themeClassTokens(sourceClasses: string): string[] {
	return (sourceClasses || "")
		.split(/\s+/)
		.filter((t) => t.startsWith("theme-"))
}

export function styleRowsForClasses(sourceClasses: string): StyleRow[] {
	const tokens = themeClassTokens(sourceClasses)
	const seen = new Set<string>()
	const ordered: string[] = []
	for (const cls of tokens) {
		const ids = classes[cls as keyof typeof classes]
		if (!ids) continue
		for (const id of ids) {
			if (!seen.has(id)) {
				seen.add(id)
				ordered.push(id)
			}
		}
	}
	for (const id of Object.keys(properties)) {
		if (seen.has(id) || !isElementLevelPropertyId(id)) continue
		seen.add(id)
		ordered.push(id)
	}
	return ordered
		.map((id) => properties[id as keyof typeof properties])
		.filter(Boolean)
		.map((prop) => {
			const row: StyleRow = {
				id: prop.id,
				label: prop.label,
				kind: prop.kind as StyleRow["kind"],
				options: prop.options,
			}
			if (prop.kind === "color-role") {
				if (prop.id === "background") {
					row.pickKind = "bg"
					row.fgField = "override_fg_type"
				} else if (prop.id === "text-color") {
					row.pickKind = "text"
				} else {
					row.pickKind = "border"
				}
			}
			const legacyField = (prop as { legacyField?: string }).legacyField
			if (legacyField) row.legacyField = legacyField
			const legacyFg = (prop as { legacyFgField?: string }).legacyFgField
			if (legacyFg && prop.kind === "color-role") {
				row.fgField = legacyFg
				if (prop.id.startsWith("table-")) row.pickKind = "bg"
			}
			return row
		})
}

export function styleRowsForTable(): DialogStyleRow[] {
	const specs = (THEME_CLASS_CATALOG as { tableStyleRowSpecs?: readonly Record<string, string>[] })
		.tableStyleRowSpecs
	if (!specs || !specs.length) return []
	const rows: DialogStyleRow[] = []
	for (const spec of specs) {
		if (spec.rowKind === "table-divider") {
			const widthPropId = spec.widthPropId || ""
			const colorPropId = spec.colorPropId || ""
			rows.push({
				id: `divider:${widthPropId}`,
				label: spec.label || "",
				kind: "table-divider",
				widthPropId,
				colorPropId,
				options: BORDER_WIDTH_OPTIONS,
			})
			continue
		}
		const propId = spec.propId || ""
		const prop = properties[propId as keyof typeof properties]
		if (!prop) continue
		const row: StyleRow = {
			id: prop.id,
			label: prop.label,
			kind: prop.kind as StyleRow["kind"],
			options: prop.options,
			legacyField: (prop as { legacyField?: string }).legacyField,
		}
		if (prop.kind === "color-role") {
			row.pickKind = "bg"
			const legacyFg = (prop as { legacyFgField?: string }).legacyFgField
			if (legacyFg) row.fgField = legacyFg
		}
		rows.push(row)
	}
	return rows
}

export function styleRowsForDialog(
	kind: "element" | "table",
	sourceClasses: string,
): DialogStyleRow[] {
	if (kind === "table") return styleRowsForTable()
	return styleRowsForClasses(sourceClasses)
}

export function tablePropertyIds(): string[] {
	const ids = (THEME_CLASS_CATALOG as { tablePropertyIds?: readonly string[] }).tablePropertyIds
	return ids ? [...ids] : []
}

export function parseStyleOverrides(raw: unknown): Record<string, string> {
	if (raw && typeof raw === "object" && !Array.isArray(raw)) {
		const out: Record<string, string> = {}
		for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
			if (v != null && String(v).trim()) out[k] = String(v).trim()
		}
		return out
	}
	if (typeof raw === "string" && raw.trim()) {
		try {
			return parseStyleOverrides(JSON.parse(raw))
		} catch {
			return {}
		}
	}
	return {}
}

export function styleOverrideValue(
	draft: Record<string, unknown>,
	propId: string,
): string {
	const bag = parseStyleOverrides(draft.theme_style_overrides)
	const fromJson = bag[propId]
	if (fromJson != null && fromJson !== "") return fromJson
	const prop = properties[propId as keyof typeof properties] as
		| { legacyField?: string }
		| undefined
	const field = prop?.legacyField
	if (!field) return ""
	return String(draft[field] ?? "").trim()
}

export function setStyleOverride(
	draft: Record<string, unknown>,
	propId: string,
	value: string,
): void {
	const bag = parseStyleOverrides(draft.theme_style_overrides)
	const trimmed = (value || "").trim()
	if (trimmed) bag[propId] = trimmed
	else delete bag[propId]
	draft.theme_style_overrides = bag
	const prop = properties[propId as keyof typeof properties] as
		| { legacyField?: string }
		| undefined
	const field = prop?.legacyField
	if (field) draft[field] = trimmed
}

export type StyleScopeTab = "component" | "instance" | "original"

export function instanceOverridesBag(instanceDraft: Record<string, unknown>): Record<string, string> {
	return parseStyleOverrides(instanceDraft.instance_style_overrides)
}

export function isInstancePropertyOverridden(
	instanceDraft: Record<string, unknown>,
	propId: string,
): boolean {
	return Object.prototype.hasOwnProperty.call(instanceOverridesBag(instanceDraft), propId)
}

export function setInstanceStyleOverride(
	instanceDraft: Record<string, unknown>,
	propId: string,
	value: string,
): void {
	const bag = instanceOverridesBag(instanceDraft)
	const trimmed = (value || "").trim()
	if (trimmed) bag[propId] = trimmed
	else delete bag[propId]
	instanceDraft.instance_style_overrides = bag
}

export function resetInstanceStyleProperty(
	instanceDraft: Record<string, unknown>,
	propId: string,
): void {
	const bag = instanceOverridesBag(instanceDraft)
	delete bag[propId]
	instanceDraft.instance_style_overrides = bag
}

export function clearInstanceStyleOverrides(instanceDraft: Record<string, unknown>): void {
	instanceDraft.instance_style_overrides = {}
}

/** Value shown in the control for the active tab (instance tab uses component when inherited). */
export function styleValueForTab(
	componentDraft: Record<string, unknown>,
	instanceDraft: Record<string, unknown>,
	tab: StyleScopeTab,
	propId: string,
): string {
	if (tab === "instance" && isInstancePropertyOverridden(instanceDraft, propId)) {
		return instanceOverridesBag(instanceDraft)[propId] || ""
	}
	return styleOverrideValue(componentDraft, propId)
}

export function buildDesignModeSavePayload(
	componentDraft: Record<string, unknown>,
	instanceDraft: Record<string, unknown>,
	instanceId: string,
): {
	componentValues: Record<string, unknown>
	instancePayload: { instance_id?: string; instance_style_overrides: Record<string, string> }
} {
	const componentValues = Object.assign({}, componentDraft)
	const sparse = instanceOverridesBag(instanceDraft)
	const instancePayload: {
		instance_id?: string
		instance_style_overrides: Record<string, string>
	} = { instance_style_overrides: sparse }
	const id = (instanceId || "").trim()
	if (id) instancePayload.instance_id = id
	return { componentValues, instancePayload }
}
