// Unit tests for live site theme CSS variable helpers.
//
import { describe, expect, it } from "vitest"
import { BORDER_RADIUS_MAP, LINE_HEIGHT_MAP } from "@/domain/theme-tokens"
import { WEB_THEME_DEFAULTS } from "@/domain/webThemeForm"
import { fontStack } from "@/utils/fonts"
import {
	computeThemeCssVariables,
	isCorporateBrandPaletteMode,
	normalizeBrandPaletteMode,
	normalizeTableWidthTier,
	roleShadeAdjustments,
	tableWidthTierCssVar,
} from "../themeCssVariables"

describe("normalizeTableWidthTier", () => {
	it("passes through thin, normal, and strong", () => {
		expect(normalizeTableWidthTier("thin")).toBe("thin")
		expect(normalizeTableWidthTier("normal")).toBe("normal")
		expect(normalizeTableWidthTier("strong")).toBe("strong")
	})

	it("maps legacy pixel strings", () => {
		expect(normalizeTableWidthTier("0.5px")).toBe("thin")
		expect(normalizeTableWidthTier("1px")).toBe("normal")
		expect(normalizeTableWidthTier("2px")).toBe("strong")
		expect(normalizeTableWidthTier("3px")).toBe("strong")
	})

	it("falls back to thin for junk or empty", () => {
		expect(normalizeTableWidthTier("")).toBe("thin")
		expect(normalizeTableWidthTier("bogus")).toBe("thin")
	})
})

describe("tableWidthTierCssVar", () => {
	it("maps tiers to border-width CSS variables", () => {
		expect(tableWidthTierCssVar("thin")).toBe("var(--nce-border-width-thin)")
		expect(tableWidthTierCssVar("normal")).toBe("var(--nce-border-width)")
		expect(tableWidthTierCssVar("strong")).toBe("var(--nce-border-width-strong)")
	})
})

describe("brand palette mode", () => {
	it("isCorporateBrandPaletteMode treats flexible as non-corporate", () => {
		expect(isCorporateBrandPaletteMode("flexible")).toBe(false)
		expect(isCorporateBrandPaletteMode("corporate")).toBe(true)
		expect(isCorporateBrandPaletteMode(undefined)).toBe(true)
	})

	it("normalizeBrandPaletteMode coerces to corporate or flexible", () => {
		expect(normalizeBrandPaletteMode("flexible")).toBe("flexible")
		expect(normalizeBrandPaletteMode("corporate")).toBe("corporate")
		expect(normalizeBrandPaletteMode("other")).toBe("corporate")
	})
})

describe("roleShadeAdjustments", () => {
	it("returns zero gamma and full saturation in corporate mode", () => {
		expect(
			roleShadeAdjustments({ brand_palette_mode: "corporate" }, "primary_color"),
		).toEqual({ gamma: 0, saturation: 100 })
	})

	it("reads field gamma and saturation in flexible mode", () => {
		expect(
			roleShadeAdjustments(
				{
					brand_palette_mode: "flexible",
					primary_color_gamma: 12,
					primary_color_saturation: 88,
				},
				"primary_color",
			),
		).toEqual({ gamma: 12, saturation: 88 })
	})
})

describe("computeThemeCssVariables", () => {
	it("derives key tokens from defaults and maps container full to 100%", () => {
		const form = { ...WEB_THEME_DEFAULTS }
		const vars = computeThemeCssVariables(form, WEB_THEME_DEFAULTS)

		expect(vars["--nce-line-height"]).toBe(
			LINE_HEIGHT_MAP[WEB_THEME_DEFAULTS.line_height],
		)
		expect(vars["--nce-border-radius"]).toBe(
			BORDER_RADIUS_MAP[WEB_THEME_DEFAULTS.border_radius],
		)
		expect(vars["--nce-font-family"]).toBe(fontStack(WEB_THEME_DEFAULTS.font_family))

		const fullWidth = computeThemeCssVariables(
			{ ...WEB_THEME_DEFAULTS, container_max_width: "full" },
			WEB_THEME_DEFAULTS,
		)
		expect(fullWidth["--nce-container-max-width"]).toBe("100%")

		expect(vars).toMatchSnapshot()
	})
})
