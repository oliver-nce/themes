import { open, close, type ThemeSwatchPickerCoreOpts } from "../theme-swatch-picker-core"

function fieldValue(el: HTMLElement): string {
	if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
		return el.value
	}
	return el.textContent?.trim() ?? ""
}

function setFieldValue(el: HTMLElement, value: string): void {
	if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
		el.value = value
		el.dispatchEvent(new Event("input", { bubbles: true }))
		el.dispatchEvent(new Event("change", { bubbles: true }))
		return
	}
	el.textContent = value
}

export type StandaloneThemeSwatchPickerOpts = {
	themeFieldEl: HTMLElement
	valueFieldEl: HTMLElement
	onClose?: () => void
}

export function openStandaloneThemeSwatchPicker(
	opts: StandaloneThemeSwatchPickerOpts,
): boolean {
	const { themeFieldEl, valueFieldEl } = opts

	const coreOpts: ThemeSwatchPickerCoreOpts = {
		getThemeSlug: () => fieldValue(themeFieldEl),
		getValue: () => fieldValue(valueFieldEl),
		setValue: (className: string) => setFieldValue(valueFieldEl, className),
		onClose: opts.onClose,
	}

	return open(coreOpts)
}

export function mountStandaloneThemeSwatchPicker(
	win: Window & { themeSwatchPicker?: unknown },
): void {
	win.themeSwatchPicker = {
		open: openStandaloneThemeSwatchPicker,
		close,
	}
}
