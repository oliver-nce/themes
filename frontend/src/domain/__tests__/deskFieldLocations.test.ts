// Unit tests for desk theme field deep-link locations.
//
import { describe, expect, it } from "vitest"
import { DESK_THEME_FIELDS } from "@/domain/deskThemeForm"
import { locateDeskField } from "@/domain/deskFieldLocations"

const MAPPED_KEYS = [
	"bg_color",
	"fg_color",
	"surface_gray_2",
	"subtle_fg",
	"text_color",
	"text_muted",
	"text_light",
	"heading_color",
	"control_bg",
	"control_bg_on_gray",
	"border_color",
	"dark_border_color",
	"btn_default_bg",
	"g_bar_color",
	"g_bar_border",
	"g_progress_color",
	"g_header_background",
	"g_row_color",
] as const

describe("locateDeskField", () => {
	it("every mapped key is in DESK_THEME_FIELDS", () => {
		const fieldSet = new Set<string>(DESK_THEME_FIELDS)
		for (const key of MAPPED_KEYS) {
			expect(fieldSet.has(key)).toBe(true)
			expect(locateDeskField(key)).not.toBeNull()
		}
	})

	it("returns null for unknown keys", () => {
		expect(locateDeskField("not_a_field")).toBeNull()
		expect(locateDeskField("primary_color")).toBeNull()
		expect(locateDeskField("")).toBeNull()
		expect(locateDeskField("   ")).toBeNull()
	})
})
