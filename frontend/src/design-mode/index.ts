// Design Mode dialog bundle: mounts DesignDialog.vue in an isolated shadow root and exposes window.nceDesignDialog.
//

import { createApp, reactive, type App } from "vue"
import DesignDialog from "./DesignDialog.vue"
import css from "./design-dialog.css?inline"

type PickKind = "bg" | "text" | "border"

export type StyleScopeTab = "component" | "instance" | "original"

export interface OriginalStylesDecl {
	prop: string
	value: string
	important: boolean
}

export interface OriginalStylesRule {
	file: string
	selector: string
	decls: OriginalStylesDecl[]
}

export interface OriginalStylesComputed {
	label: string
	value: string
}

export interface OriginalStyles {
	classes: { theme: string[]; other: string[] }
	inline: OriginalStylesDecl[]
	rules: OriginalStylesRule[]
	unreadable: string[]
	computed: OriginalStylesComputed[]
	warnings: string[]
	conflicts?: { label: string; line1: string; line2: string }[]
}

export interface DesignDialogHandlers {
	pick: (field: string, kind: PickKind, fgField: string | null) => void
	changed: (field: string) => void
	setStyleTab: (tab: StyleScopeTab) => void
	save: () => void
	cancel: () => void
	revert: () => void
	revertInstance: () => void
	resetInstanceProperty: (propId: string) => void
	openRecord: () => void
	part: () => void
}

export interface DeskThemeInfo {
	name: string
	theme_name: string
}

export interface DeskSourceInfo {
	cssVar: string
	field: string
	label: string
}

export interface DesignDialogOpenOptions {
	container?: HTMLElement
	kind: "element" | "table"
	title: string
	subtitle: string
	notes?: string[]
	disabled?: boolean
	hasPart?: boolean
	sourceClasses?: string
	themeDefaults?: Record<string, { label: string; css?: string }>
	deskSources?: Record<string, DeskSourceInfo>
	deskTheme?: DeskThemeInfo | null
	draft: Record<string, unknown>
	instanceDraft?: Record<string, unknown>
	styleTab?: StyleScopeTab
	instanceIdentity?: string
	originalStyles?: OriginalStyles | null
	buttonSizes?: Record<string, string>
	x: number
	y: number
	handlers: DesignDialogHandlers
}

export interface DesignDialogHandle {
	draft: Record<string, unknown>
	instanceDraft: Record<string, unknown>
	getStyleTab: () => StyleScopeTab
	setSaving: (v: boolean) => void
	close: () => void
	host: HTMLElement
}

let app: App | null = null
let host: HTMLElement | null = null

function themeCssHref(): string {
	const links = document.querySelectorAll('link[rel="stylesheet"]')
	for (let i = 0; i < links.length; i++) {
		const link = links[i] as HTMLLinkElement
		if (link.href && link.href.indexOf("nce_theme") !== -1) {
			return link.href
		}
	}
	return "/assets/themes/css/nce_theme.css"
}

const STOP = [
	"mousedown",
	"mouseup",
	"click",
	"dblclick",
	"contextmenu",
	"pointerdown",
	"pointerup",
	"keydown",
	"keyup",
	"keypress",
	"wheel",
	"touchstart",
] as const

export function close(): void {
	if (app) {
		app.unmount()
		app = null
	}
	if (host) {
		host.remove()
		host = null
	}
}

export function isOpen(): boolean {
	return !!app
}

export function open(opts: DesignDialogOpenOptions): DesignDialogHandle {
	close()
	host = document.createElement("div")
	host.id = "nce-design-dialog-host"
	host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:1;"
	const parent = opts.container || document.body
	parent.appendChild(host)

	for (let i = 0; i < STOP.length; i++) {
		const name = STOP[i]
		const passive = name === "wheel" || name === "touchstart"
		host.addEventListener(
			name,
			(e) => {
				e.stopPropagation()
			},
			passive ? { passive: true } : undefined
		)
	}

	const shadow = host.attachShadow({ mode: "open" })
	const themeLink = document.createElement("link")
	themeLink.rel = "stylesheet"
	themeLink.href = themeCssHref()
	shadow.appendChild(themeLink)
	const styleEl = document.createElement("style")
	styleEl.textContent = css
	shadow.appendChild(styleEl)
	const mountEl = document.createElement("div")
	shadow.appendChild(mountEl)

	const model = reactive({
		kind: opts.kind,
		title: opts.title,
		subtitle: opts.subtitle,
		notes: opts.notes || [],
		disabled: !!opts.disabled,
		hasPart: !!opts.hasPart,
		sourceClasses: opts.sourceClasses || "",
		themeDefaults: opts.themeDefaults || {},
		deskSources: opts.deskSources || {},
		deskTheme: opts.deskTheme || null,
		saving: false,
		draft: (() => {
			const draft = Object.assign({}, opts.draft)
			const rawSize = String(draft.override_button_size_class ?? "")
			if (rawSize === "theme-btn-sm") draft.override_button_size_class = "sm"
			else if (rawSize === "theme-btn-lg") draft.override_button_size_class = "lg"
			const rawOverrides = draft.theme_style_overrides
			if (typeof rawOverrides === "string" && rawOverrides.trim()) {
				try {
					draft.theme_style_overrides = JSON.parse(rawOverrides)
				} catch {
					draft.theme_style_overrides = {}
				}
			} else if (!rawOverrides || typeof rawOverrides !== "object") {
				draft.theme_style_overrides = {}
			}
			return draft
		})(),
		instanceDraft: (() => {
			const inst = Object.assign({}, opts.instanceDraft || {})
			const raw = inst.instance_style_overrides
			if (typeof raw === "string" && raw.trim()) {
				try {
					inst.instance_style_overrides = JSON.parse(raw)
				} catch {
					inst.instance_style_overrides = {}
				}
			} else if (!raw || typeof raw !== "object") {
				inst.instance_style_overrides = {}
			}
			return inst
		})(),
		styleTab: opts.styleTab || "component",
		instanceIdentity: opts.instanceIdentity || "",
		originalStyles: opts.originalStyles || null,
		buttonSizes: opts.buttonSizes || {},
		x: opts.x,
		y: opts.y,
	})

	app = createApp(DesignDialog, { model, handlers: opts.handlers })
	app.mount(mountEl)

	const dialogHost = host
	return {
		draft: model.draft,
		instanceDraft: model.instanceDraft,
		getStyleTab() {
			return model.styleTab
		},
		setSaving(v: boolean) {
			model.saving = !!v
		},
		close,
		host: dialogHost,
	}
}

const api = { open, close, isOpen }

declare global {
	interface Window {
		nceDesignDialog?: typeof api
	}
}

if (typeof window !== "undefined") {
	;(window as Window).nceDesignDialog = api
}

export default api
