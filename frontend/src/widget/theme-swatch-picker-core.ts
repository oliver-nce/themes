import {
	CURATED_SHADES,
	KINDS,
	OVERLAY_ROLES,
	ROLES,
	type ThemeFgType,
	type ThemeKind,
	type ThemeRole,
	type ThemeShade,
} from "./constants"
import {
	composeOverlayFgClass,
	composeThemeClass,
	parseFgType,
	resolveInitialState,
	shadesForRole,
	type ParsedThemeClass,
} from "./class-utils"
import { showThemePickerBlockedDialog } from "./blocked-dialog"
import pickerCss from "./theme-swatch-picker.css?raw"

export type ThemeSwatchPickerCoreOpts = {
	getThemeSlug: () => string
	getValue: () => string
	setValue: (className: string) => void
	getFgType?: () => string
	setFgType?: (fgType: ThemeFgType) => void
	onClose?: () => void
}

type PickerState = ParsedThemeClass

let rootEl: HTMLElement | null = null
let escHandler: ((e: KeyboardEvent) => void) | null = null
let closeCallback: (() => void) | null = null
let cssInjected = false

const KIND_LABELS: Record<ThemeKind, string> = {
	bg: "Bg",
	text: "Text",
	border: "Border",
}

const ROLE_LABELS: Record<ThemeRole, string> = {
	primary: "Primary",
	secondary: "Secondary",
	accent: "Accent",
	success: "Success",
	info: "Info",
	warning: "Warning",
	danger: "Danger",
}

const FG_TYPE_LABELS: Record<ThemeFgType, string> = {
	mono: "Mono",
	tonal: "Tonal",
}

function injectStyles() {
	if (cssInjected || typeof document === "undefined") return
	const style = document.createElement("style")
	style.setAttribute("data-nce-theme-swatch-picker", "")
	style.textContent = pickerCss
	document.head.appendChild(style)
	cssInjected = true
}

function warnCssMaybeMissing() {
	if (typeof document === "undefined") return
	const probe = document.createElement("div")
	probe.className = "theme-bg-primary-500"
	probe.style.display = "none"
	document.body.appendChild(probe)
	const bg = getComputedStyle(probe).backgroundColor
	probe.remove()
	const missing =
		!bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent"
	if (missing) {
		console.warn(
			"[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint.",
		)
	}
}

function normalizeSlug(raw: string): string {
	return (raw || "").trim()
}

function overlayForRole(role: ThemeRole, showAllRoles: boolean): boolean {
	return showAllRoles ? true : OVERLAY_ROLES.includes(role)
}

function buildModal(
	opts: ThemeSwatchPickerCoreOpts,
	initialSlug: string,
	state: PickerState,
	committedValue: string,
	initialFgType: ThemeFgType,
): {
	root: HTMLElement
	updateSelected: (preview: string) => void
	refreshThemeScope: (slug: string) => void
} {
	const persistFgType = !!(opts.getFgType && opts.setFgType)
	const chromePickMode = persistFgType
	const backdrop = document.createElement("div")
	backdrop.className = "nce-theme-swatch-picker__backdrop"
	backdrop.addEventListener("click", () => close())

	const modal = document.createElement("div")
	modal.className = "nce-theme-swatch-picker nce-theme-swatch-picker__modal"
	modal.setAttribute("role", "dialog")
	modal.setAttribute("aria-modal", "true")
	modal.setAttribute("aria-label", "Theme swatch picker")
	modal.addEventListener("click", (e) => e.stopPropagation())

	const scoped = document.createElement("div")
	if (initialSlug) {
		scoped.setAttribute("data-nce-theme", initialSlug)
	}

	const layout = document.createElement("div")
	layout.className = chromePickMode
		? "nce-theme-swatch-picker__layout nce-theme-swatch-picker__layout--chrome-pick"
		: "nce-theme-swatch-picker__layout"

	const kindField = document.createElement("fieldset")
	kindField.className = "nce-theme-swatch-picker__radios"
	const kindTitle = document.createElement("p")
	kindTitle.className = "nce-theme-swatch-picker__column-title"
	kindTitle.textContent = "Kind"
	kindField.appendChild(kindTitle)

	const roleField = document.createElement("fieldset")
	roleField.className = "nce-theme-swatch-picker__radios"
	const roleTitle = document.createElement("p")
	roleTitle.className = "nce-theme-swatch-picker__column-title"
	roleTitle.textContent = "Role"
	roleField.appendChild(roleTitle)

	const swatchHost = document.createElement("div")
	const swatchTitle = document.createElement("p")
	swatchTitle.className = "nce-theme-swatch-picker__column-title"
	swatchTitle.textContent = "Swatches"
	swatchHost.appendChild(swatchTitle)

	const swatchStrip = document.createElement("div")
	swatchStrip.className = "nce-theme-swatch-picker__swatch-strip"
	swatchHost.appendChild(swatchStrip)

	const kindInputs = new Map<ThemeKind, HTMLInputElement>()
	for (const kind of KINDS) {
		const label = document.createElement("label")
		label.className = "nce-theme-swatch-picker__radio"
		const input = document.createElement("input")
		input.type = "radio"
		input.name = "nce-tsp-kind"
		input.value = kind
		input.checked = state.kind === kind
		label.appendChild(input)
		label.append(" ", KIND_LABELS[kind])
		kindField.appendChild(label)
		kindInputs.set(kind, input)
	}

	const roleInputs = new Map<ThemeRole, HTMLInputElement>()
	for (const role of ROLES) {
		const label = document.createElement("label")
		label.className = "nce-theme-swatch-picker__radio"
		const input = document.createElement("input")
		input.type = "radio"
		input.name = "nce-tsp-role"
		input.value = role
		input.checked = state.role === role
		label.appendChild(input)
		label.append(" ", ROLE_LABELS[role])
		roleField.appendChild(label)
		roleInputs.set(role, input)
	}

	layout.append(kindField, roleField, swatchHost)
	if (chromePickMode) {
		kindField.hidden = true
		state = { ...state, kind: "bg" }
	}

	const fgTypeField = document.createElement("fieldset")
	fgTypeField.className =
		"nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type"
	if (!persistFgType) {
		fgTypeField.hidden = true
	}
	const fgTypeTitle = document.createElement("p")
	fgTypeTitle.className = "nce-theme-swatch-picker__column-title"
	fgTypeTitle.textContent = "Foreground Type"
	fgTypeField.appendChild(fgTypeTitle)

	const fgTypeInputs = new Map<ThemeFgType, HTMLInputElement>()
	let fgType: ThemeFgType = initialFgType

	for (const type of ["mono", "tonal"] as const) {
		const label = document.createElement("label")
		label.className = "nce-theme-swatch-picker__radio"
		const input = document.createElement("input")
		input.type = "radio"
		input.name = "nce-tsp-fg-type"
		input.value = type
		input.checked = fgType === type
		label.appendChild(input)
		label.append(" ", FG_TYPE_LABELS[type])
		fgTypeField.appendChild(label)
		fgTypeInputs.set(type, input)
	}

	if (persistFgType) {
		swatchHost.appendChild(fgTypeField)
	}

	const readFgType = (): ThemeFgType => {
		const selected =
			([...fgTypeInputs.entries()].find(([, el]) => el.checked)?.[0] as
				| ThemeFgType
				| undefined) || fgType
		fgType = selected
		return selected
	}

	const status = document.createElement("div")
	status.className = "nce-theme-swatch-picker__status"
	const selectedLabel = document.createElement("span")
	selectedLabel.className = "nce-theme-swatch-picker__selected-label"
	selectedLabel.textContent = "Selected:"
	const selectedValue = document.createElement("code")
	selectedValue.className = "nce-theme-swatch-picker__selected-value"
	status.append(selectedLabel, selectedValue)

	const actions = document.createElement("div")
	actions.className = "nce-theme-swatch-picker__actions"

	const cancelBtn = document.createElement("button")
	cancelBtn.type = "button"
	cancelBtn.className = "nce-theme-swatch-picker__btn"
	cancelBtn.textContent = "Cancel"
	cancelBtn.addEventListener("click", () => close())

	const saveBtn = document.createElement("button")
	saveBtn.type = "button"
	saveBtn.className = "nce-theme-swatch-picker__btn nce-theme-swatch-picker__btn--primary"
	saveBtn.textContent = "Save"
	saveBtn.addEventListener("click", () => {
		const current = readState()
		const picked = composeThemeClass(current.kind, current.role, current.shade)
		try {
			if (opts.setFgType) {
				opts.setFgType(readFgType())
			}
			opts.setValue(picked)
		} catch (err) {
			console.error("[themeSwatchPicker] setValue failed:", err)
			return
		}
		close()
	})

	actions.append(cancelBtn, saveBtn)

	const footer = document.createElement("div")
	footer.className = "nce-theme-swatch-picker__footer"

	const updateFooter = (slug: string) => {
		if (!slug) {
			footer.textContent = "Theme: (site default — no theme selected)"
			return
		}
		footer.textContent = `Theme: ${slug}`
	}
	updateFooter(initialSlug)

	scoped.append(layout, status, actions, footer)
	modal.appendChild(scoped)
	backdrop.appendChild(modal)

	let previewShade: ThemeShade | null = null

	const readState = (): PickerState => {
		const kind = chromePickMode
			? "bg"
			: (([...kindInputs.entries()].find(([, el]) => el.checked)?.[0] as ThemeKind) ||
					state.kind)
		const role =
			([...roleInputs.entries()].find(([, el]) => el.checked)?.[0] as ThemeRole) ||
			state.role
		const shade = previewShade ?? state.shade
		return { kind, role, shade }
	}

	const updateSelected = (preview?: string) => {
		const current = readState()
		const text =
			preview ??
			composeThemeClass(current.kind, current.role, current.shade)
		selectedValue.textContent = text
	}

	const selectShade = (shade: ThemeShade) => {
		state = { ...readState(), shade }
		previewShade = null
		renderSwatches()
	}

	const renderSwatches = () => {
		const current = readState()
		const currentFgType = readFgType()
		const showAllOverlayRoles = persistFgType
		previewShade = null
		swatchStrip.replaceChildren()
		for (const shade of shadesForRole(current.role)) {
			const btn = document.createElement("button")
			btn.type = "button"
			btn.className = "nce-theme-swatch-picker__swatch theme-bg-" + `${current.role}-${shade}`
			btn.title = composeThemeClass(current.kind, current.role, shade)
			if (current.shade === shade) {
				btn.classList.add("nce-theme-swatch-picker__swatch--preview")
			}
			if (overlayForRole(current.role, showAllOverlayRoles)) {
				const span = document.createElement("span")
				span.className =
					"nce-theme-swatch-picker__swatch-label " +
					composeOverlayFgClass(current.role, shade, currentFgType)
				span.textContent = "Text"
				btn.appendChild(span)
			}
			btn.addEventListener("mouseenter", () => {
				previewShade = shade
				updateSelected(composeThemeClass(current.kind, current.role, shade))
			})
			btn.addEventListener("mouseleave", () => {
				previewShade = null
				updateSelected()
			})
			btn.addEventListener("click", () => {
				selectShade(shade)
			})
			swatchStrip.appendChild(btn)
		}
		updateSelected()
	}

	for (const input of kindInputs.values()) {
		input.addEventListener("change", () => {
			state = readState()
			renderSwatches()
		})
	}
	for (const input of roleInputs.values()) {
		input.addEventListener("change", () => {
			state = readState()
			renderSwatches()
		})
	}
	for (const input of fgTypeInputs.values()) {
		input.addEventListener("change", () => {
			readFgType()
			renderSwatches()
		})
	}

	renderSwatches()

	return {
		root: backdrop,
		updateSelected,
		refreshThemeScope: (slug: string) => {
			if (slug) {
				scoped.setAttribute("data-nce-theme", slug)
			} else {
				scoped.removeAttribute("data-nce-theme")
			}
			updateFooter(slug)
		},
	}
}

export function close(): void {
	if (escHandler) {
		document.removeEventListener("keydown", escHandler)
		escHandler = null
	}
	if (rootEl) {
		rootEl.remove()
		rootEl = null
	}
	const cb = closeCallback
	closeCallback = null
	cb?.()
}

export function isOpen(): boolean {
	return rootEl !== null
}

export function open(opts: ThemeSwatchPickerCoreOpts): boolean {
	if (isOpen()) close()

	injectStyles()
	warnCssMaybeMissing()

	const slug = normalizeSlug(opts.getThemeSlug())
	if (!slug) {
		console.warn("[themeSwatchPicker] theme slug is empty — open cancelled.")
		showThemePickerBlockedDialog("no_theme_selected")
		return false
	}

	const committedValue = (opts.getValue() || "").trim()
	const state = resolveInitialState(committedValue)
	const initialFgType = opts.getFgType ? parseFgType(opts.getFgType()) : "mono"

	const { root, refreshThemeScope } = buildModal(
		opts,
		slug,
		state,
		committedValue,
		initialFgType,
	)

	document.body.appendChild(root)
	rootEl = root
	closeCallback = opts.onClose ?? null

	escHandler = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			e.preventDefault()
			close()
		}
	}
	document.addEventListener("keydown", escHandler)

	return true
}

export { CURATED_SHADES, KINDS, ROLES }
