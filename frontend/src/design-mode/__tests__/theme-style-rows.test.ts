import { describe, expect, it } from "vitest"
import {
	buildDesignModeSavePayload,
	clearInstanceStyleOverrides,
	instanceOverridesBag,
	isInstancePropertyOverridden,
	resetInstanceStyleProperty,
	setInstanceStyleOverride,
	setStyleOverride,
	styleRowsForDialog,
	styleValueForTab,
	TABLE_STYLE_TAB_IDS,
	tablePropertyIds,
} from "../theme-style-rows"

describe("instance style rows", () => {
	const component = { theme_style_overrides: {} as Record<string, string> }
	const instance = { instance_style_overrides: {} as Record<string, string> }

	it("does not copy inherited properties into instance payload", () => {
		setStyleOverride(component, "background", "theme-bg-primary-500")
		const { instancePayload } = buildDesignModeSavePayload(component, instance, "")
		expect(instancePayload.instance_style_overrides).toEqual({})
	})

	it("stores only explicit instance overrides", () => {
		setInstanceStyleOverride(instance, "background", "theme-bg-danger-500")
		setInstanceStyleOverride(instance, "border-radius", "theme-rounded-lg")
		expect(instanceOverridesBag(instance)).toEqual({
			background: "theme-bg-danger-500",
			"border-radius": "theme-rounded-lg",
		})
	})

	it("reset removes one key only", () => {
		setInstanceStyleOverride(instance, "background", "theme-bg-danger-500")
		setInstanceStyleOverride(instance, "border-radius", "theme-rounded-lg")
		resetInstanceStyleProperty(instance, "background")
		expect(isInstancePropertyOverridden(instance, "background")).toBe(false)
		expect(instanceOverridesBag(instance)).toEqual({ "border-radius": "theme-rounded-lg" })
	})

	it("tab switch shows component value when inherited on instance", () => {
		setStyleOverride(component, "background", "theme-bg-primary-500")
		expect(styleValueForTab(component, instance, "instance", "background")).toBe(
			"theme-bg-primary-500",
		)
	})

	it("save payload includes both drafts without merging", () => {
		const comp = { theme_style_overrides: {} as Record<string, string> }
		const inst = { instance_style_overrides: {} as Record<string, string> }
		setStyleOverride(comp, "background", "theme-bg-primary-500")
		setInstanceStyleOverride(inst, "background", "theme-bg-danger-500")
		const { componentValues, instancePayload } = buildDesignModeSavePayload(
			comp,
			inst,
			"inst-abc1234567",
		)
		expect(componentValues.theme_style_overrides).toEqual({ background: "theme-bg-primary-500" })
		expect(instancePayload).toEqual({
			instance_id: "inst-abc1234567",
			instance_style_overrides: { background: "theme-bg-danger-500" },
		})
	})

	it("clear instance overrides empties sparse map", () => {
		setInstanceStyleOverride(instance, "focus-ring", "1")
		clearInstanceStyleOverrides(instance)
		expect(instanceOverridesBag(instance)).toEqual({})
	})
})

describe("element design dialog rows", () => {
	it("returns every element-level property when sourceClasses is empty", () => {
		const rows = styleRowsForDialog("element", "")
		const ids = rows.map((r) => r.id)
		expect(ids).toContain("button-outline")
		expect(ids).toContain("focus-fill")
		expect(ids.some((id) => id.startsWith("table-"))).toBe(false)
		expect(ids.some((id) => tablePropertyIds().includes(id))).toBe(false)
	})

	it("lists class-derived rows first then remaining element properties", () => {
		const rows = styleRowsForDialog("element", "theme-border theme-bg-card")
		const ids = rows.map((r) => r.id)
		expect(ids.slice(0, 3)).toEqual(["border-width", "border-color", "background"])
		const outlineIdx = ids.indexOf("button-outline")
		const bgIdx = ids.indexOf("background")
		expect(outlineIdx).toBeGreaterThan(bgIdx)
	})

	it("does not duplicate property ids", () => {
		const rows = styleRowsForDialog("element", "theme-border theme-bg-card")
		const ids = rows.map((r) => r.id)
		expect(new Set(ids).size).toBe(ids.length)
	})
})

describe("table design dialog rows", () => {
	it("exposes component and instance tab ids", () => {
		expect(TABLE_STYLE_TAB_IDS).toEqual(["component", "instance"])
	})

	it("maps table kind to style rows for every table property id", () => {
		const rows = styleRowsForDialog("table", "")
		const ids = tablePropertyIds()
		expect(ids.length).toBeGreaterThan(0)
		const fromRows = new Set<string>()
		for (const row of rows) {
			if (row.kind === "table-divider") {
				fromRows.add(row.widthPropId)
				fromRows.add(row.colorPropId)
			} else {
				fromRows.add(row.id)
			}
		}
		expect(fromRows).toEqual(new Set(ids))
	})

	it("stores only one changed table property on instance tab", () => {
		const comp = { table_header_bg_class: "theme-bg-primary-500" }
		const inst = { instance_style_overrides: {} as Record<string, string> }
		setInstanceStyleOverride(inst, "table-header-row", "theme-bg-danger-500")
		expect(instanceOverridesBag(inst)).toEqual({
			"table-header-row": "theme-bg-danger-500",
		})
		expect(styleValueForTab(comp, inst, "instance", "table-header-row")).toBe(
			"theme-bg-danger-500",
		)
	})
})
