// Design Mode dialog bundle: mounts DesignDialog.vue in an isolated shadow root and exposes window.nceDesignDialog.
//

import { createApp, reactive, type App } from "vue"
import DesignDialog from "./DesignDialog.vue"
import css from "./design-dialog.css?inline"

type PickKind = "bg" | "text" | "border"

export interface DesignDialogHandlers {
	pick: (field: string, kind: PickKind, fgField: string | null) => void
	changed: (field: string) => void
	save: () => void
	cancel: () => void
	revert: () => void
	openRecord: () => void
	part: () => void
}

export interface DesignDialogOpenOptions {
	container?: HTMLElement
	kind: "element" | "table"
	title: string
	subtitle: string
	notes?: string[]
	disabled?: boolean
	hasPart?: boolean
	themeDefaults?: Record<string, { label: string; css?: string }>
	draft: Record<string, unknown>
	x: number
	y: number
	handlers: DesignDialogHandlers
}

export interface DesignDialogHandle {
	draft: Record<string, unknown>
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
		themeDefaults: opts.themeDefaults || {},
		saving: false,
		draft: Object.assign({}, opts.draft),
		x: opts.x,
		y: opts.y,
	})

	app = createApp(DesignDialog, { model, handlers: opts.handlers })
	app.mount(mountEl)

	const dialogHost = host
	return {
		draft: model.draft,
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
