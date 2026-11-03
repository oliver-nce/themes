// Unit tests for font weight clamping and display labels.
//
import { describe, expect, it } from "vitest"
import {
	BODY_WEIGHT_MAX,
	BODY_WEIGHT_MIN,
	clampBodyWeight,
	clampFontWeight,
	weightDisplayLabel,
} from "@/utils/fontWeight"

describe("clampFontWeight", () => {
	it("clamps to the body weight range", () => {
		expect(clampFontWeight(50)).toBe(BODY_WEIGHT_MIN)
		expect(clampFontWeight(999)).toBe(BODY_WEIGHT_MAX)
		expect(clampFontWeight("520", 400)).toBe(520)
	})

	it("uses fallback for non-numeric input", () => {
		expect(clampFontWeight("nope", 500)).toBe(500)
		expect(clampFontWeight(undefined, 600)).toBe(600)
	})
})

describe("clampBodyWeight", () => {
	it("defaults invalid input to 400", () => {
		expect(clampBodyWeight("nope")).toBe(400)
	})
})

describe("weightDisplayLabel", () => {
	it("maps bands to readable labels", () => {
		expect(weightDisplayLabel(300)).toContain("Light")
		expect(weightDisplayLabel(450)).toContain("Regular")
		expect(weightDisplayLabel(500)).toContain("Medium")
		expect(weightDisplayLabel(600)).toContain("Semi-bold")
		expect(weightDisplayLabel(800)).toContain("Bold")
	})
})
