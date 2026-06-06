import {
	showThemePickerBlockedDialog,
	themePickerBlockReason,
} from "../blocked-dialog"
import { open, close, type ThemeSwatchPickerCoreOpts } from "../theme-swatch-picker-core"
import type { ThemeFgType } from "../constants"

type FrappeDb = {
	exists: (doctype: string, name: string) => boolean
	get_value: (
		doctype: string,
		name: string,
		fieldname: string | string[],
	) => Promise<{ message?: Record<string, unknown> } | Record<string, unknown>>
}

function getFrappeDb(): FrappeDb | null {
	if (typeof window === "undefined") return null
	const frappe = (window as { frappe?: { db?: FrappeDb } }).frappe
	return frappe?.db ?? null
}

/**
 * Resolve an NCE Theme Link value (doc name / theme_name) to its slug.
 * Mirrors nce_events panel_data._resolve_theme_slug — Active themes with a slug only.
 */
export async function resolveNceThemeSlug(themeLink: string): Promise<string> {
	const theme = (themeLink || "").trim()
	if (!theme) return ""

	const db = getFrappeDb()
	if (!db) {
		console.warn(
			"[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug",
		)
		return ""
	}

	try {
		if (!db.exists("NCE Theme", theme)) {
			console.warn(`[themeSwatchPicker] NCE Theme "${theme}" not found`)
			return ""
		}
		const raw = await db.get_value("NCE Theme", theme, ["slug", "status"])
		const row =
			(raw as { message?: { slug?: string; status?: string } }).message ??
			(raw as { slug?: string; status?: string })
		const slug = (row?.slug || "").trim()
		const status = row?.status
		if (status === "Active" && slug) return slug
		console.warn(
			`[themeSwatchPicker] theme "${theme}" is not Active or has no slug`,
		)
		return ""
	} catch (err) {
		console.error("[themeSwatchPicker] slug lookup failed:", err)
		return ""
	}
}

export type DeskThemeSwatchPickerOpts = {
	frm: {
		doc: Record<string, unknown>
		set_value: (field: string, value: unknown) => void
	}
	/** Form field holding Link → NCE Theme (doc name); resolved to slug for data-nce-theme. */
	themeField: string
	valueField: string
	/** Optional; defaults to valueField with `_bg_class` → `_fg_type`. */
	fgTypeField?: string
	onClose?: () => void
}

function resolveFgTypeField(
	valueField: string,
	explicit?: string,
): string | undefined {
	if (explicit) return explicit
	if (valueField.endsWith("_bg_class")) {
		return valueField.replace(/_bg_class$/, "_fg_type")
	}
	return undefined
}

export async function openDeskThemeSwatchPicker(
	opts: DeskThemeSwatchPickerOpts,
): Promise<boolean> {
	const { frm, themeField, valueField } = opts
	const fgTypeField = resolveFgTypeField(valueField, opts.fgTypeField)

	const themeLink = String(frm.doc[themeField] ?? "")
	let cachedSlug = await resolveNceThemeSlug(themeLink)
	if (!cachedSlug) {
		console.warn(
			"[themeSwatchPicker] no Active theme slug for field — open cancelled.",
		)
		showThemePickerBlockedDialog(themePickerBlockReason(themeLink))
		return false
	}

	const coreOpts: ThemeSwatchPickerCoreOpts = {
		getThemeSlug: () => cachedSlug,
		getValue: () => String(frm.doc[valueField] ?? ""),
		setValue: (className: string) => {
			try {
				frm.set_value(valueField, className)
			} catch (err) {
				console.error("[themeSwatchPicker] frm.set_value failed:", err)
				throw err
			}
		},
	}

	if (fgTypeField) {
		coreOpts.getFgType = () => String(frm.doc[fgTypeField] ?? "mono")
		coreOpts.setFgType = (fgType: ThemeFgType) => {
			try {
				frm.set_value(fgTypeField, fgType)
			} catch (err) {
				console.error("[themeSwatchPicker] frm.set_value fg type failed:", err)
				throw err
			}
		}
	}

	return new Promise((resolve) => {
		coreOpts.onClose = (result) => {
			opts.onClose?.()
			resolve(result.saved)
		}
		const opened = open(coreOpts)
		if (!opened) {
			resolve(false)
		}
	})
}

export function mountDeskThemeSwatchPicker(frappe: {
	ui: Record<string, unknown>
}): void {
	frappe.ui.themeSwatchPicker = {
		open: openDeskThemeSwatchPicker,
		close,
	}
}
