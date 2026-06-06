import { open, close, type ThemeSwatchPickerCoreOpts } from "../theme-swatch-picker-core"

export type DeskThemeSwatchPickerOpts = {
	frm: {
		doc: Record<string, unknown>
		set_value: (field: string, value: unknown) => void
		fields_dict?: Record<
			string,
			{ $input?: { on: (ev: string, fn: () => void) => void; off: (ev: string, fn: () => void) => void } }
		>
	}
	themeField: string
	valueField: string
	onClose?: () => void
}

export function openDeskThemeSwatchPicker(
	opts: DeskThemeSwatchPickerOpts,
): boolean {
	const { frm, themeField, valueField } = opts

	const coreOpts: ThemeSwatchPickerCoreOpts = {
		getThemeSlug: () => String(frm.doc[themeField] ?? ""),
		getValue: () => String(frm.doc[valueField] ?? ""),
		setValue: (className: string) => {
			try {
				frm.set_value(valueField, className)
			} catch (err) {
				console.error("[themeSwatchPicker] frm.set_value failed:", err)
				throw err
			}
		},
		onClose: opts.onClose,
		watchThemeSlug: (cb) => {
			const field = frm.fields_dict?.[themeField]
			const listener = () => cb(String(frm.doc[themeField] ?? ""))
			field?.$input?.on("change", listener)
			return () => field?.$input?.off("change", listener)
		},
	}

	return open(coreOpts)
}

export function mountDeskThemeSwatchPicker(frappe: {
	ui: Record<string, unknown>
}): void {
	frappe.ui.themeSwatchPicker = {
		open: openDeskThemeSwatchPicker,
		close,
	}
}
