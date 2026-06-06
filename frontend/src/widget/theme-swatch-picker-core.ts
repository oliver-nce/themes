import {
	CURATED_SHADES,
	KINDS,
	OVERLAY_ROLES,
	ROLES,
	type ThemeKind,
	type ThemeRole,
	type ThemeShade,
} from "./constants"
import {
	composeThemeClass,
	resolveInitialState,
	shadesForRole,
	type ParsedThemeClass,
} from "./class-utils"
import pickerCss from "./theme-swatch-picker.css?raw"

export type ThemeSwatchPickerCoreOpts = {
	getThemeSlug: () => string
	getValue: () => string
	setValue: (className: string) => void
	onClose?: () => void
	watchThemeSlug?: (cb: (slug: string) => void) => () => void
}

type PickerState = ParsedThemeClass

let rootEl: HTMLElement | null = null
let escHandler: ((e: KeyboardEvent) => void) | null = null
let themeUnsubscribe: (() => void) | null = null
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

function overlayForRole(role: ThemeRole): boolean {
	return OVERLAY_ROLES.includes(role)
}

function buildModal(
	opts: ThemeSwatchPickerCoreOpts,
	initialSlug: string,
	state: PickerState,
	committedValue: string,
): {
	root: HTMLElement
	updateSelected: (preview: string) => void
	refreshThemeScope: (slug: string) => void
} {
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
	layout.className = "nce-theme-swatch-picker__layout"

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

	const status = document.createElement("div")
	status.className = "nce-theme-swatch-picker__status"
	const selectedLabel = document.createElement("span")
	selectedLabel.className = "nce-theme-swatch-picker__selected-label"
	selectedLabel.textContent = "Selected:"
	const selectedValue = document.createElement("code")
	selectedValue.className = "nce-theme-swatch-picker__selected-value"
	status.append(selectedLabel, selectedValue)

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

	scoped.append(layout, status, footer)
	modal.appendChild(scoped)
	backdrop.appendChild(modal)

	let previewShade: ThemeShade | null = null

	const readState = (): PickerState => {
		const kind =
			([...kindInputs.entries()].find(([, el]) => el.checked)?.[0] as ThemeKind) ||
			state.kind
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

	const renderSwatches = () => {
		const current = readState()
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
			if (overlayForRole(current.role)) {
				const span = document.createElement("span")
				span.className =
					"nce-theme-swatch-picker__swatch-label theme-text-" +
					`${current.role}-${shade}-fg`
				span.textContent = "Text"
				btn.appendChild(span)
			}
			btn.addEventListener("mouseenter", () => {
				previewShade = shade
				updateSelected(composeThemeClass(current.kind, current.role, shade))
			})
			btn.addEventListener("mouseleave", () => {
				previewShade = null
				updateSelected(committedValue || composeThemeClass(current.kind, current.role, current.shade))
			})
			btn.addEventListener("click", () => {
				const picked = composeThemeClass(current.kind, current.role, shade)
				try {
					opts.setValue(picked)
				} catch (err) {
					console.error("[themeSwatchPicker] setValue failed:", err)
					return
				}
				close()
			})
			swatchStrip.appendChild(btn)
		}
		updateSelected(
			committedValue ||
				composeThemeClass(current.kind, current.role, current.shade),
		)
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
	if (themeUnsubscribe) {
		themeUnsubscribe()
		themeUnsubscribe = null
	}
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
		return false
	}

	const committedValue = (opts.getValue() || "").trim()
	const state = resolveInitialState(committedValue)

	const { root, refreshThemeScope } = buildModal(
		opts,
		slug,
		state,
		committedValue,
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

	if (opts.watchThemeSlug) {
		themeUnsubscribe = opts.watchThemeSlug((next) => {
			refreshThemeScope(normalizeSlug(next))
		})
	}

	return true
}

export { CURATED_SHADES, KINDS, ROLES }
