// Unit tests for web and desk theme form schema modules.
//
import { describe, expect, it } from "vitest"
import {
	DENSITY_PRESET_KEYS,
	DENSITY_PRESETS,
	DENSITY_PRESET_IDS,
	DESK_THEME_DEFAULTS,
	DESK_THEME_FIELDS,
} from "@/domain/deskThemeForm"
import { parseFlipShade, WEB_THEME_DEFAULTS, WEB_THEME_FIELDS } from "@/domain/webThemeForm"

describe("parseFlipShade", () => {
	it("returns null for empty values", () => {
		expect(parseFlipShade(null)).toBe(null)
		expect(parseFlipShade(undefined)).toBe(null)
		expect(parseFlipShade("")).toBe(null)
	})

	it("rounds finite numbers", () => {
		expect(parseFlipShade(600)).toBe(600)
		expect(parseFlipShade("601.4")).toBe(601)
		expect(parseFlipShade("nope")).toBe(null)
	})
})

describe("WEB_THEME schema", () => {
	it("fields and defaults are non-empty", () => {
		expect(WEB_THEME_FIELDS.length).toBeGreaterThan(0)
		expect(Object.keys(WEB_THEME_DEFAULTS).length).toBeGreaterThan(0)
	})
})

describe("DESK_THEME schema and density presets", () => {
	it("every density preset has all preset keys", () => {
		for (const id of DENSITY_PRESET_IDS) {
			const preset = DENSITY_PRESETS[id]
			for (const key of DENSITY_PRESET_KEYS) {
				expect(preset[key]).toBeDefined()
			}
			expect(Object.keys(preset).sort()).toEqual([...DENSITY_PRESET_KEYS].sort())
		}
	})

	it("defaults keys cover every form field", () => {
		expect(DESK_THEME_FIELDS.length).toBeGreaterThan(0)
		expect(Object.keys(DESK_THEME_DEFAULTS).length).toBeGreaterThan(0)
		for (const key of DESK_THEME_FIELDS) {
			expect(DESK_THEME_DEFAULTS).toHaveProperty(key)
		}
	})
})
