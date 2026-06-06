import {
	CURATED_SHADES,
	DEFAULT_KIND,
	DEFAULT_ROLE,
	isThemeKind,
	isThemeRole,
	isThemeShade,
	type ThemeKind,
	type ThemeRole,
	type ThemeShade,
} from "./constants"

export type ParsedThemeClass = {
	kind: ThemeKind
	role: ThemeRole
	shade: ThemeShade
}

const CLASS_RE =
	/^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/

export function parseThemeClass(value: string): ParsedThemeClass | null {
	const raw = (value || "").trim()
	if (!raw) return null
	const match = CLASS_RE.exec(raw)
	if (!match) return null
	const kind = match[1]
	const role = match[2]
	const shade = Number(match[3])
	if (!isThemeKind(kind) || !isThemeRole(role) || !isThemeShade(shade)) return null
	return { kind, role, shade }
}

export function composeThemeClass(
	kind: ThemeKind,
	role: ThemeRole,
	shade: ThemeShade,
): string {
	return `theme-${kind}-${role}-${shade}`
}

export function isValidCombination(
	kind: ThemeKind,
	role: ThemeRole,
	shade: ThemeShade,
): boolean {
	return (
		isThemeKind(kind) &&
		isThemeRole(role) &&
		isThemeShade(shade)
	)
}

export function defaultPickerState(): ParsedThemeClass {
	return {
		kind: DEFAULT_KIND,
		role: DEFAULT_ROLE,
		shade: 500,
	}
}

export function resolveInitialState(value: string): ParsedThemeClass {
	return parseThemeClass(value) ?? defaultPickerState()
}

export function shadesForRole(_role: ThemeRole): readonly ThemeShade[] {
	return CURATED_SHADES
}
