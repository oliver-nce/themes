<!--
Iframe preview that applies Desk Theme Editor CSS variables onto live Frappe Desk pages.

-->

<template>
	<div class="desk-preview-shell">
		<div class="desk-preview-toolbar">
			<div class="desk-preview-heading">
				<span class="desk-preview-title">Live Desk Preview</span>
				<span class="desk-preview-subtitle">Changes from the Desk Theme Editor appear here instantly</span>
				<span v-if="!isSamples" class="desk-preview-badge">View only</span>
			</div>
			<div class="desk-preview-field" role="radiogroup" aria-label="Choose View">
				<span class="desk-preview-label">Choose View</span>
				<div class="desk-preview-segments" :style="lastVariables">
					<label
						v-for="target in previewTargets"
						:key="target.path"
						class="desk-preview-segment"
						:class="{ 'is-active': selectedTarget === target.path }"
					>
						<input
							v-model="selectedTarget"
							type="radio"
							name="desk-preview-target"
							:value="target.path"
							class="desk-preview-radio"
						/>
						{{ target.label }}
					</label>
				</div>
			</div>
		</div>
		<div v-if="isSamples" class="desk-preview-samples">
			<DeskStyleSamples :vars="lastVariables" />
		</div>
		<iframe
			v-else
			ref="deskFrame"
			:key="selectedTarget"
			class="desk-preview-frame"
			:src="selectedTarget"
			title="Frappe Desk preview"
			@load="onFrameLoad"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue"
import { createResource } from "frappe-ui"
import { applyDeskThemeVars, deskPayloadToCssVars } from "@/composables/useDeskTheme"
import DeskStyleSamples from "@/components/DeskStyleSamples.vue"

const SAMPLES_PATH = "__samples__"
const previewTargets = [
	{ label: "Style samples", path: SAMPLES_PATH },
	{ label: "Activity Log", path: "/app/activity-log" },
	{ label: "System Settings", path: "/app/system-settings" },
]

const selectedTarget = ref(previewTargets[0].path)
const isSamples = computed(() => selectedTarget.value === SAMPLES_PATH)
const deskFrame = ref<HTMLIFrameElement | null>(null)
const lastVariables = ref<Record<string, string>>({})

function applyVarsToIframe(vars: Record<string, string>) {
	const root = deskFrame.value?.contentDocument?.documentElement
	if (!root) return
	applyDeskThemeVars(vars, root)
}

const SAVE_LABELS = new Set(["save", "update"])
const FORM_CONTROLS = "input, textarea, select, [contenteditable='true'], .ql-editor, .frappe-control"
const INERT_AREAS = ".body-sidebar-container, #desk-dock, .dock, .layout-side-section"
const LIST_TOOLS =
	".standard-filter-section, .filter-section, .filter-selector, .sort-selector, .filter-popover, .popover, .awesomplete, .datepicker"
const SAFE_UI = ".form-tabs, .nav-link, .section-head, .collapse-indicator, .dropdown-toggle, .dropdown-menu-toggle"

type DeskWindow = Window & {
	frappe?: {
		get_route?: () => string[]
		set_route?: (...route: string[]) => void
		router?: { slug?: (name: string) => string }
	}
}

function controlLabel(el: Element): string {
	const raw = el.getAttribute("data-label")
	const text = raw ? decodeURIComponent(raw) : el.textContent || ""
	return text.replace(/\s+/g, " ").trim().toLowerCase()
}

function trimPath(path: string): string {
	return path.replace(/\/+$/, "") || "/"
}

// The iframe shows a real Desk page in view-only mode: the user may open
// records from the list and come back, but nothing else navigates or edits.
function lockLivePage(frame: HTMLIFrameElement) {
	const win = frame.contentWindow as DeskWindow | null
	const doc = frame.contentDocument
	if (!win || !doc?.body) return
	const root = doc.documentElement
	if (root.dataset.ncePreviewLock) return
	root.dataset.ncePreviewLock = "1"

	const inertStyle = doc.createElement("style")
	inertStyle.textContent = `
		.body-sidebar-container, #desk-dock, .dock, .layout-side-section, .navbar {
			pointer-events: none !important;
			user-select: none !important;
		}`
	doc.head.appendChild(inertStyle)

	// Routes are compared by Frappe route, not URL: v16 serves the same list
	// under /app/<doctype>, /desk/<workspace>/<doctype> and /desk/<doctype>/<name>.
	const lockedAt = Date.now()
	const getRoute = () => win.frappe?.get_route?.() ?? []
	const routeKey = (route: string[]) => JSON.stringify(route)
	let baseDoctype: string | null = null
	let baseRoute: string | null = null
	let lastAllowed: string[] = []

	const adoptBase = () => {
		const route = getRoute()
		if (baseRoute || !route.length) return
		baseRoute = routeKey(route)
		if (route[0] === "List" || route[0] === "Form") baseDoctype = route[1]
		lastAllowed = route
	}
	const isAllowedRoute = (route: string[]) => {
		if (!route.length) return true
		if (baseDoctype) return (route[0] === "List" || route[0] === "Form") && route[1] === baseDoctype
		return routeKey(route) === baseRoute
	}
	const slug = (name: string) =>
		win.frappe?.router?.slug?.(name) ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
	const isAllowedLink = (url: URL) => {
		if (url.origin !== win.location.origin) return false
		if (!baseDoctype) return trimPath(url.pathname) === trimPath(win.location.pathname)
		const segs = url.pathname.split("/").filter(Boolean)
		const i = segs.lastIndexOf(slug(baseDoctype))
		return i >= 0 && segs.length - i <= 2
	}
	const isFormView = () => win.frappe?.get_route?.()[0] === "Form"
	const block = (event: Event) => {
		event.preventDefault()
		event.stopImmediatePropagation()
	}

	doc.addEventListener(
		"click",
		(event) => {
			const target = event.target as Element | null
			if (!target?.closest) return
			if (target.closest(INERT_AREAS)) return block(event)
			if (!isFormView() && target.closest(LIST_TOOLS)) return
			if (target.closest(".nce-cannot-save, .dropdown-item, .list-row-checkbox, .like-action")) return block(event)
			const anchor = target.closest("a[href]") as HTMLAnchorElement | null
			if (anchor) {
				const url = new URL(anchor.href, win.location.href)
				if (!isAllowedLink(url)) return block(event)
				return
			}
			if (target.closest(".list-row-container")) return
			if (target.closest(SAFE_UI)) return
			if (isFormView() && target.closest(FORM_CONTROLS)) return block(event)
			if (target.closest("button, .btn, [role='button'], [data-action]")) return block(event)
		},
		true,
	)

	const blockEditing = (event: Event) => {
		if (isFormView() || (event.target as Element | null)?.closest?.(".form-layout")) block(event)
	}
	for (const type of ["mousedown", "beforeinput", "paste", "drop", "change"]) {
		doc.addEventListener(
			type,
			(event) => {
				const target = event.target as Element | null
				if (type === "mousedown" && !target?.closest?.(FORM_CONTROLS)) return
				blockEditing(event)
			},
			true,
		)
	}
	doc.addEventListener(
		"keydown",
		(event) => {
			const copyKeys = ["c", "a"]
			if ((event.ctrlKey || event.metaKey) && copyKeys.includes(event.key.toLowerCase())) return
			if (event.ctrlKey || event.metaKey || event.altKey) return block(event)
			if (isFormView() && (event.target as Element | null)?.closest?.(FORM_CONTROLS)) block(event)
		},
		true,
	)

	const style = doc.createElement("style")
	style.textContent = `${INERT_AREAS} { pointer-events: none !important; cursor: default !important; }`
	doc.head.appendChild(style)

	const lockSaveButtons = () => {
		doc.querySelectorAll(INERT_AREAS).forEach((el) => {
			if (!el.hasAttribute("inert")) el.setAttribute("inert", "")
		})
		let found = false
		doc.querySelectorAll("[data-label]").forEach((el) => {
			if (!SAVE_LABELS.has(controlLabel(el))) return
			found = true
			const node = el as HTMLElement
			if (node.style.display !== "none") node.style.display = "none"
			node.setAttribute("aria-hidden", "true")
		})
		const actions = doc.querySelector(".standard-actions")
		if (!actions) return
		let stub = actions.querySelector(".nce-cannot-save") as HTMLButtonElement | null
		if (found && !stub) {
			stub = doc.createElement("button")
			stub.type = "button"
			stub.className = "btn btn-default btn-sm nce-cannot-save"
			stub.disabled = true
			stub.textContent = "Cannot Save"
			stub.title = "This is a preview. Changes cannot be saved."
			actions.appendChild(stub)
		}
		if (stub) stub.hidden = !found
	}
	lockSaveButtons()
	new MutationObserver(lockSaveButtons).observe(doc.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["data-label", "class"],
	})

	const routeTimer = win.setInterval(() => {
		if (!baseRoute) {
			if (Date.now() - lockedAt < 5000) adoptBase()
			return
		}
		const route = getRoute()
		if (routeKey(route) === routeKey(lastAllowed)) return
		if (isAllowedRoute(route)) {
			lastAllowed = route
			applyVarsToIframe(lastVariables.value)
			return
		}
		win.frappe?.set_route?.(...lastAllowed)
	}, 250)
	win.addEventListener("pagehide", () => win.clearInterval(routeTimer))
}

function onFrameLoad() {
	if (Object.keys(lastVariables.value).length) {
		applyVarsToIframe(lastVariables.value)
	}
	if (deskFrame.value) lockLivePage(deskFrame.value)
}

function handleMessage(event: MessageEvent) {
	if (event.data?.type !== "nce-desk-theme-update") return
	const vars = (event.data.variables || {}) as Record<string, string>
	lastVariables.value = vars
	applyVarsToIframe(vars)
}

// After a reload there is no editor message yet: start from the saved theme,
// then ask the editor window (if any) for its current unsaved values.
const savedTheme = createResource({
	url: "themes.api.get_active_desk_theme_editor",
	auto: true,
	onSuccess(data: { payload?: Record<string, unknown> } | null) {
		if (data?.payload && !Object.keys(lastVariables.value).length) {
			lastVariables.value = deskPayloadToCssVars(data.payload)
			applyVarsToIframe(lastVariables.value)
		}
	},
})

const channel = new BroadcastChannel("nce-desk-theme-preview")
channel.onmessage = handleMessage

onMounted(() => {
	window.addEventListener("message", handleMessage)
	window.opener?.postMessage({ type: "nce-desk-preview-ready" }, "*")
	channel.postMessage({ type: "nce-desk-preview-ready" })
})
onUnmounted(() => {
	window.removeEventListener("message", handleMessage)
	channel.close()
})
</script>

<style scoped>
.desk-preview-shell {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: #111827;
}

.desk-preview-toolbar {
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1.5rem;
	padding: 0 1.25rem;
	height: 48px;
	background: #0f172a;
	border-bottom: 1px solid #1e293b;
}

.desk-preview-heading {
	display: flex;
	align-items: baseline;
	gap: 0.75rem;
	min-width: 0;
}

.desk-preview-title {
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #ffffff;
	white-space: nowrap;
}

.desk-preview-subtitle {
	font-size: 0.75rem;
	color: #e2e8f0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.desk-preview-badge {
	flex: 0 0 auto;
	padding: 0 0.5rem;
	line-height: 1.25rem;
	border: 1px solid #334155;
	border-radius: 999px;
	font-size: 0.6875rem;
	color: #cbd5e1;
	white-space: nowrap;
}

.desk-preview-field {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex: 0 0 auto;
}

.desk-preview-label {
	display: flex;
	align-items: center;
	line-height: 1;
	font-size: 0.8125rem;
	font-weight: 500;
	color: #ffffff;
}

.desk-preview-segments {
	display: flex;
	align-items: center;
	height: 30px;
	padding: 3px;
	gap: 2px;
	background: var(--fg-color, #ffffff);
	border-radius: var(--radius, 8px);
	box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.12);
}

.desk-preview-segment {
	position: relative;
	display: flex;
	align-items: center;
	height: 100%;
	margin: 0;
	padding: 0 0.75rem;
	font-size: 0.8125rem;
	line-height: 1;
	color: #1f2937;
	border-radius: calc(var(--radius, 8px) - 3px);
	cursor: pointer;
	white-space: nowrap;
	transition: background-color 120ms ease, color 120ms ease;
}

.desk-preview-segment:not(.is-active):hover {
	color: #000000;
}

.desk-preview-segment.is-active {
	background: var(--text-color, #1f2937);
	color: var(--fg-color, #ffffff);
	font-weight: 500;
	box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
}

.desk-preview-segment:has(.desk-preview-radio:focus-visible) {
	outline: 2px solid #60a5fa;
	outline-offset: 1px;
}

.desk-preview-radio {
	position: absolute;
	opacity: 0;
	pointer-events: none;
}

.desk-preview-samples {
	flex: 1 1 auto;
	overflow-y: auto;
	background: #fff;
}

.desk-preview-frame {
	flex: 1 1 auto;
	width: 100%;
	border: 0;
	background: #fff;
}
</style>
