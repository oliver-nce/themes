<template>
	<div class="max-w-6xl mx-auto px-6 py-4">
		<div class="editor-header editor-panel">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<h1 class="editor-title">Desk Theme Editor</h1>
					<p class="editor-subtitle mt-0.5">
						Editing <strong>{{ editorMeta.theme_name || "—" }}</strong>
						<span v-if="editingTheme && siteBaseTheme && editingTheme !== siteBaseTheme" class="editor-warn">
							· not the site base desk theme
						</span>
						<span v-if="siteBaseThemeName" class="editor-muted">
							· Site base: <strong>{{ siteBaseThemeName }}</strong>
						</span>
					</p>
					<div
						v-if="editorLoaded"
						class="editor-status-row mt-2 flex flex-wrap items-center gap-x-4 gap-y-1"
					>
						<span class="editor-status-label">For Desk:</span>
						<label class="editor-status-option">
							<input
								type="radio"
								name="desk-theme-availability"
								value="Active"
								:checked="savedThemeStatus === 'Active'"
								:disabled="!canChangeStatus"
								@change="setThemeStatus('Active')"
							/>
							Active
						</label>
						<label class="editor-status-option">
							<input
								type="radio"
								name="desk-theme-availability"
								value="Inactive"
								:checked="savedThemeStatus === 'Inactive'"
								:disabled="!canChangeStatus"
								@change="setThemeStatus('Inactive')"
							/>
							Inactive
						</label>
						<span v-if="statusSaving" class="editor-status-hint">Saving…</span>
						<span v-else-if="isDirty" class="editor-status-hint editor-status-hint-warn">
							Save or revert changes before changing availability
						</span>
					</div>
				</div>
				<div class="editor-toolbar flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 lg:justify-end lg:max-w-[70%]">
					<select
						v-if="themesList.data?.length"
						v-model="selectedTheme"
						class="theme-select"
						:style="{ minWidth: themeSelectWidth }"
						:disabled="loadingTheme"
						@change="onThemeChange"
					>
						<option v-for="t in themesList.data" :key="t.name" :value="t.name">
							{{ themeOptionLabel(t) }}
						</option>
					</select>
					<div class="editor-actions flex flex-wrap gap-2 justify-end">
						<Button
							variant="solid"
							class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							@click="openPreview"
						>
							Open Preview ↗
						</Button>
						<Button
							variant="solid"
							class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							:disabled="!isDirty || loadingTheme"
							@click="revertChanges"
						>
							Revert
						</Button>
						<Button
							variant="solid"
							class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							:loading="saving"
							:disabled="!isDirty || loadingTheme"
							@click="handleSave"
						>
							Save Changes
						</Button>
						<Button
							variant="solid"
							class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							:disabled="loadingTheme || !siteBaseTheme || editingTheme === siteBaseTheme"
							@click="requestRestoreToBase"
						>
							Restore to Base Desk Theme
						</Button>
						<Button
							variant="solid"
							class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							:disabled="loadingTheme"
							@click="openSaveAsDialog"
						>
							Save as new desk theme
						</Button>
						<Button
							variant="solid"
							class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							:disabled="!canRenameOrDelete"
							@click="openRenameDialog"
						>
							Rename
						</Button>
						<Button
							variant="solid"
							class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							:disabled="!canRenameOrDelete"
							@click="openDeleteDialog"
						>
							Delete
						</Button>
					</div>
				</div>
			</div>
		</div>

		<div v-if="switchError" class="mb-4 rounded-md bg-red-50 text-red-700 text-sm px-4 py-2">
			{{ switchError }}
		</div>

		<div v-if="themesList.loading || loadingTheme" class="py-12 text-center text-gray-400 text-sm">
			Loading desk theme editor…
		</div>

		<div v-else-if="listLoadError" class="py-12 text-center text-red-600 text-sm max-w-lg mx-auto">
			{{ listLoadError }}
		</div>

		<div v-else-if="!themesList.data?.length" class="py-12 text-center text-gray-600 text-sm max-w-lg mx-auto space-y-3">
			<p class="font-medium text-gray-800">No desk themes found on this site.</p>
			<p>
				The database needs a Default <code class="text-xs bg-gray-100 px-1 py-0.5 rounded">NCE Desk Theme</code>
				record before the editor can load colour and shape settings.
			</p>
			<p class="text-xs text-gray-500">
				On the server, after <code class="bg-gray-100 px-1 py-0.5 rounded">bench migrate</code>, run:
				<br />
				<code class="block mt-2 bg-gray-100 px-2 py-1 rounded text-left">bench --site &lt;site&gt; execute themes.init_desk_theme.execute</code>
			</p>
		</div>

		<div v-else-if="editorError" class="py-12 text-center text-red-600 text-sm">
			{{ editorError }}
		</div>

		<template v-else-if="editorLoaded">
			<nav class="flex gap-1 border-b border-gray-200 mb-6">
				<button
					v-for="tab in tabs"
					:key="tab.id"
					class="px-4 pb-2.5 pt-1 text-sm font-medium border-b-2 transition-colors"
					:class="
						activeTab === tab.id
							? 'border-blue-600 text-blue-600'
							: 'border-transparent text-gray-500 hover:text-gray-700'
					"
					@click="activeTab = tab.id"
				>
					{{ tab.label }}
				</button>
			</nav>

			<div v-show="activeTab === 'colors'" class="editor-tab">
				<EditorSection title="Brand">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<SwatchPicker
							v-for="c in brandColors"
							:key="c.key"
							:label="c.label"
							:model-value="form[c.key]"
							@update:model-value="form[c.key] = $event"
						/>
					</div>
				</EditorSection>

				<EditorSection title="Surfaces &amp; Text">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<SwatchPicker
							v-for="c in surfaceColors"
							:key="c.key"
							:label="c.label"
							:model-value="form[c.key]"
							@update:model-value="form[c.key] = $event"
						/>
					</div>
				</EditorSection>

				<EditorSection title="Controls &amp; Borders">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<SwatchPicker
							v-for="c in controlColors"
							:key="c.key"
							:label="c.label"
							:model-value="form[c.key]"
							@update:model-value="form[c.key] = $event"
						/>
					</div>
				</EditorSection>
			</div>

			<div v-show="activeTab === 'shape'" class="editor-tab">
				<EditorSection title="Shape" hint="Frappe Desk layout tokens (--btn-height, --border-radius*).">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div v-for="field in shapeFields" :key="field.key">
							<label class="block text-sm font-medium text-gray-700 mb-1">{{ field.label }}</label>
							<input
								v-model="form[field.key]"
								type="text"
								class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
								:placeholder="field.placeholder"
							/>
						</div>
					</div>
				</EditorSection>
			</div>

			<div v-show="activeTab === 'gantt'" class="editor-tab">
				<EditorSection title="Gantt chart">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<SwatchPicker
							v-for="c in ganttColors"
							:key="c.key"
							:label="c.label"
							:model-value="form[c.key]"
							@update:model-value="form[c.key] = $event"
						/>
					</div>
				</EditorSection>
			</div>

			<div v-show="activeTab === 'advanced'" class="editor-tab">
				<EditorSection title="Advanced">
					<p class="text-sm text-gray-500">No advanced options in v1.</p>
				</EditorSection>
			</div>

			<div v-show="activeTab === 'system'" class="editor-tab">
				<EditorSection
					title="Save as base desk theme"
					hint="Sets the site base desk theme, rebuilds nce_desk_theme.css, and bundles defaults into the app for new installs."
				>
					<p class="text-sm text-gray-600 mb-3">
						Editing <strong>{{ editorMeta.theme_name || "—" }}</strong>.
						Requires your account password.
					</p>
					<input
						v-model="systemTab.password"
						type="password"
						autocomplete="current-password"
						class="w-full max-w-sm border border-gray-300 rounded-md px-3 py-2 text-sm mb-2"
						placeholder="Your password"
						@keyup.enter="submitSaveAsBaseTheme"
					/>
					<p v-if="systemTab.error" class="text-sm text-red-600 mb-2">{{ systemTab.error }}</p>
					<p v-if="systemTab.success" class="text-sm text-green-700 mb-2">{{ systemTab.success }}</p>
					<Button
						variant="solid"
						class="bg-primary text-primary-fg border border-primary"
						:loading="systemTab.busy"
						:disabled="!systemTab.password || loadingTheme"
						@click="submitSaveAsBaseTheme"
					>
						Save as base desk theme
					</Button>
				</EditorSection>
			</div>
		</template>

		<Teleport to="body">
			<div
				v-if="confirmDialog.open"
				class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
				@click.self="closeConfirmDialog"
			>
				<div class="bg-white rounded-lg shadow-xl p-5 max-w-md w-full">
					<h3 class="text-base font-semibold text-gray-900">{{ confirmDialog.title }}</h3>
					<p class="text-sm text-gray-600 mt-2">{{ confirmDialog.message }}</p>
					<div class="flex flex-wrap gap-2 justify-end mt-5">
						<Button variant="solid" class="bg-primary-100 text-primary-100-fg border border-border" @click="closeConfirmDialog">
							Cancel
						</Button>
						<Button variant="solid" class="bg-primary-100 text-primary-100-fg border border-border" @click="confirmDiscardAndContinue">
							Discard changes
						</Button>
						<Button variant="solid" class="bg-primary text-primary-fg border border-primary" :loading="confirmDialog.busy" @click="confirmSaveAndContinue">
							Save &amp; continue
						</Button>
					</div>
				</div>
			</div>

			<div v-if="saveAsDialog.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" @click.self="closeSaveAsDialog">
				<div class="bg-white rounded-lg shadow-xl p-5 max-w-md w-full">
					<h3 class="text-base font-semibold text-gray-900">Save as new desk theme</h3>
					<input v-model="saveAsDialog.name" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-3" placeholder="Desk theme name" />
					<p v-if="saveAsDialog.error" class="text-sm text-red-600 mt-2">{{ saveAsDialog.error }}</p>
					<div class="flex gap-2 justify-end mt-5">
						<Button variant="solid" class="bg-primary-100 text-primary-100-fg border border-border" @click="closeSaveAsDialog">Cancel</Button>
						<Button variant="solid" class="bg-primary text-primary-fg border border-primary" :loading="saveAsDialog.busy" @click="submitSaveAs">Create</Button>
					</div>
				</div>
			</div>

			<div v-if="renameDialog.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" @click.self="closeRenameDialog">
				<div class="bg-white rounded-lg shadow-xl p-5 max-w-md w-full">
					<h3 class="text-base font-semibold text-gray-900">Rename desk theme</h3>
					<input v-model="renameDialog.name" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-3" />
					<p v-if="renameDialog.error" class="text-sm text-red-600 mt-2">{{ renameDialog.error }}</p>
					<div class="flex gap-2 justify-end mt-5">
						<Button variant="solid" class="bg-primary-100 text-primary-100-fg border border-border" @click="closeRenameDialog">Cancel</Button>
						<Button variant="solid" class="bg-primary text-primary-fg border border-primary" :loading="renameDialog.busy" @click="submitRename">Rename</Button>
					</div>
				</div>
			</div>

			<div v-if="deleteDialog.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" @click.self="closeDeleteDialog">
				<div class="bg-white rounded-lg shadow-xl p-5 max-w-md w-full">
					<h3 class="text-base font-semibold text-gray-900">Delete desk theme?</h3>
					<p class="text-sm text-gray-600 mt-2">This cannot be undone.</p>
					<p v-if="deleteDialog.error" class="text-sm text-red-600 mt-2">{{ deleteDialog.error }}</p>
					<div class="flex gap-2 justify-end mt-5">
						<Button variant="solid" class="bg-primary-100 text-primary-100-fg border border-border" @click="closeDeleteDialog">Cancel</Button>
						<Button variant="solid" class="bg-primary text-primary-fg border border-primary" :loading="deleteDialog.busy" @click="submitDelete">Delete</Button>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onUnmounted, onMounted, nextTick } from "vue"
import { useRoute } from "vue-router"
import { createResource } from "frappe-ui"
import EditorSection from "@/components/EditorSection.vue"
import SwatchPicker from "@/components/SwatchPicker.vue"
import { applyDeskThemeVars, deskPayloadToCssVars } from "@/composables/useDeskTheme"

type ThemeAvailabilityStatus = "Active" | "Inactive"

const ALL_FIELDS = [
	"theme_name",
	"primary_color",
	"brand_color",
	"bg_color",
	"fg_color",
	"text_color",
	"text_muted",
	"text_light",
	"border_color",
	"dark_border_color",
	"control_bg",
	"control_bg_on_gray",
	"btn_default_bg",
	"awesomplete_hover_bg",
	"btn_height",
	"border_radius",
	"border_radius_lg",
	"border_radius_full",
	"g_bar_color",
	"g_bar_border",
	"g_progress_color",
	"g_header_background",
	"g_row_color",
	"g_today_highlight",
] as const

const PAYLOAD_FIELDS = ALL_FIELDS.filter((k) => k !== "theme_name")
type FormKey = (typeof ALL_FIELDS)[number]

const DEFAULTS: Record<FormKey, string> = {
	theme_name: "Default",
	primary_color: "#2490EF",
	brand_color: "#0089FF",
	bg_color: "#f5f5f6",
	fg_color: "#ffffff",
	text_color: "#1f272e",
	text_muted: "#687178",
	text_light: "#b0bac0",
	border_color: "#d1d8dd",
	dark_border_color: "#8d99a6",
	control_bg: "#f7fafc",
	control_bg_on_gray: "#ffffff",
	btn_default_bg: "#f7fafc",
	awesomplete_hover_bg: "#f0f4f7",
	btn_height: "28px",
	border_radius: "6px",
	border_radius_lg: "12px",
	border_radius_full: "999px",
	g_bar_color: "#2490EF",
	g_bar_border: "#007be0",
	g_progress_color: "#0070cc",
	g_header_background: "#f3f3f3",
	g_row_color: "#f8f8f8",
	g_today_highlight: "#edf6fd",
}

const COLOR_FIELDS = new Set(
	PAYLOAD_FIELDS.filter((k) => k.endsWith("_color") || k.includes("_bg") || k.includes("text_") || k.includes("border") || k.startsWith("g_")),
)

const route = useRoute()
let previewWin: Window | null = null

const activeTab = ref("colors")
const tabs = [
	{ id: "colors", label: "Colours" },
	{ id: "shape", label: "Shape" },
	{ id: "gantt", label: "Gantt" },
	{ id: "advanced", label: "Advanced" },
	{ id: "system", label: "System" },
]

const brandColors = [
	{ key: "primary_color" as FormKey, label: "Primary" },
	{ key: "brand_color" as FormKey, label: "Brand" },
]

const surfaceColors = [
	{ key: "bg_color" as FormKey, label: "Page Background" },
	{ key: "fg_color" as FormKey, label: "Foreground" },
	{ key: "text_color" as FormKey, label: "Text" },
	{ key: "text_muted" as FormKey, label: "Muted Text" },
	{ key: "text_light" as FormKey, label: "Light Text" },
]

const controlColors = [
	{ key: "border_color" as FormKey, label: "Border" },
	{ key: "dark_border_color" as FormKey, label: "Dark Border" },
	{ key: "control_bg" as FormKey, label: "Control Background" },
	{ key: "control_bg_on_gray" as FormKey, label: "Control on Gray" },
	{ key: "btn_default_bg" as FormKey, label: "Default Button" },
	{ key: "awesomplete_hover_bg" as FormKey, label: "Search Hover" },
]

const shapeFields = [
	{ key: "btn_height" as FormKey, label: "Button Height", placeholder: "28px" },
	{ key: "border_radius" as FormKey, label: "Border Radius", placeholder: "6px" },
	{ key: "border_radius_lg" as FormKey, label: "Large Border Radius", placeholder: "12px" },
	{ key: "border_radius_full" as FormKey, label: "Full Border Radius", placeholder: "999px" },
]

const ganttColors = [
	{ key: "g_bar_color" as FormKey, label: "Bar" },
	{ key: "g_bar_border" as FormKey, label: "Bar Border" },
	{ key: "g_progress_color" as FormKey, label: "Progress" },
	{ key: "g_header_background" as FormKey, label: "Header Background" },
	{ key: "g_row_color" as FormKey, label: "Row" },
	{ key: "g_today_highlight" as FormKey, label: "Today Highlight" },
]

const form = reactive<Record<FormKey, string>>({ ...DEFAULTS })
const editingTheme = ref("")
const selectedTheme = ref("")
const siteBaseTheme = ref("")
const loadingTheme = ref(false)
const saving = ref(false)
const statusSaving = ref(false)
const editorLoaded = ref(false)
const editorError = ref("")
const listLoadError = ref("")
const switchError = ref("")
const dirtyBaselineReady = ref(false)
const savedSnapshot = ref<Record<string, any>>({})
const savedThemeStatus = ref<ThemeAvailabilityStatus>("Inactive")

const editorMeta = reactive({
	theme: "",
	theme_name: "",
	css_hash: "",
	is_base_theme: false,
})

const systemTab = reactive({ password: "", busy: false, error: "", success: "" })
const confirmDialog = reactive({
	open: false,
	busy: false,
	title: "",
	message: "",
	action: "" as "" | "switch" | "restore",
	pendingTheme: "",
})
const saveAsDialog = reactive({ open: false, name: "", error: "", busy: false })
const renameDialog = reactive({ open: false, name: "", error: "", busy: false })
const deleteDialog = reactive({ open: false, error: "", busy: false })

const siteBaseThemeName = computed(() => {
	const row = themesList.data?.find((t: any) => t.name === siteBaseTheme.value)
	return row?.theme_name || siteBaseTheme.value || ""
})

function themeFromQuery(): string {
	return String(route.query.theme || "").trim()
}

function themeOptionLabel(t: any): string {
	let label = t.theme_name || t.name
	if (t.is_base_theme) label += " (base)"
	if (t.is_active) label += " (active)"
	return label
}

const themeSelectWidth = computed(() => {
	const labels = (themesList.data || []).map((t: any) => themeOptionLabel(t))
	const chars = Math.max(20, ...labels.map((l: string) => l.length), 0)
	return `${Math.min(Math.max(chars * 0.62, 14), 26)}rem`
})

function computeCSSVariables(): Record<string, string> {
	return deskPayloadToCssVars(buildPayloadFromForm())
}

function pushToPreview() {
	if (!previewWin || previewWin.closed) return
	previewWin.postMessage({ type: "nce-desk-theme-update", variables: computeCSSVariables() }, "*")
}

function openPreview() {
	if (previewWin && !previewWin.closed) {
		previewWin.focus()
		pushToPreview()
		return
	}
	previewWin = window.open("/desk-themes/preview", "desk-themes-preview", "width=1200,height=900,scrollbars=yes")
	if (previewWin) previewWin.addEventListener("load", () => pushToPreview())
}

onUnmounted(() => {
	if (previewWin && !previewWin.closed) previewWin.close()
})

function buildPayloadFromForm(): Record<string, any> {
	const payload: Record<string, any> = {}
	for (const key of PAYLOAD_FIELDS) payload[key] = form[key]
	return payload
}

function canonicalPayload(source: Record<string, any>): Record<string, any> {
	const payload: Record<string, any> = {}
	for (const key of PAYLOAD_FIELDS) {
		let val = source[key]
		if (val === undefined || val === null) val = DEFAULTS[key]
		if (COLOR_FIELDS.has(key) && typeof val === "string" && val.startsWith("#")) {
			payload[key] = val.toUpperCase()
		} else {
			payload[key] = String(val ?? "")
		}
	}
	return payload
}

function captureSnapshot(payload?: Record<string, any>) {
	savedSnapshot.value = canonicalPayload(payload || buildPayloadFromForm())
}

async function establishDirtyBaseline() {
	dirtyBaselineReady.value = false
	captureSnapshot()
	await nextTick()
	captureSnapshot()
	dirtyBaselineReady.value = true
}

const isDirty = computed(() => {
	if (!editorLoaded.value || !dirtyBaselineReady.value || loadingTheme.value) return false
	return JSON.stringify(canonicalPayload(buildPayloadFromForm())) !== JSON.stringify(canonicalPayload(savedSnapshot.value))
})

function normalizeThemeStatus(status: string | undefined | null): ThemeAvailabilityStatus {
	return status === "Active" ? "Active" : "Inactive"
}

const canChangeStatus = computed(
	() => editorLoaded.value && !loadingTheme.value && !saving.value && !statusSaving.value && !isDirty.value,
)

const canRenameOrDelete = computed(
	() => canChangeStatus.value && savedThemeStatus.value === "Inactive" && !editorMeta.is_base_theme,
)

function applyPayloadToForm(payload: Record<string, any>) {
	for (const key of ALL_FIELDS) form[key] = DEFAULTS[key]
	for (const key of ALL_FIELDS) {
		if (key === "theme_name") continue
		const val = payload[key]
		if (val !== undefined && val !== null) form[key] = String(val)
	}
}

const themesList = createResource({
	url: "themes.api.list_desk_themes",
	auto: true,
	onSuccess(data: any[]) {
		listLoadError.value = ""
		if (!data?.length || editingTheme.value) return
		if (tryLoadThemeFromQuery(data)) return
		const pick =
			data.find((t) => t.is_base_theme)?.name ||
			data.find((t) => t.is_active)?.name ||
			data[0].name
		if (pick) loadTheme(pick)
	},
	onError(err: any) {
		listLoadError.value =
			err?.message || "Could not load desk themes. Check System Manager permissions and that migrate has run."
	},
})

const editorResource = createResource({
	url: "themes.api.get_desk_theme_editor",
	auto: false,
	async onSuccess(data: any) {
		loadingTheme.value = false
		editorError.value = ""
		switchError.value = ""
		editorLoaded.value = false
		dirtyBaselineReady.value = false
		if (!data) {
			editorError.value = "Desk theme not found."
			return
		}
		editingTheme.value = data.theme || ""
		selectedTheme.value = data.theme || ""
		siteBaseTheme.value = data.site_base_theme || siteBaseTheme.value
		editorMeta.theme = data.theme || ""
		editorMeta.theme_name = data.theme_name || data.theme || ""
		editorMeta.css_hash = data.css_hash || ""
		editorMeta.is_base_theme = !!data.is_base_theme
		savedThemeStatus.value = normalizeThemeStatus(data.status)
		if (data.theme_name) form.theme_name = data.theme_name
		applyPayloadToForm(data.payload || {})
		editorLoaded.value = true
		await establishDirtyBaseline()
		applyLiveThemeVars()
	},
	onError(err: any) {
		loadingTheme.value = false
		editorLoaded.value = false
		editorError.value = err?.message || "Failed to load desk theme."
	},
})

async function loadTheme(theme: string) {
	if (!theme) return
	loadingTheme.value = true
	dirtyBaselineReady.value = false
	editorError.value = ""
	try {
		await editorResource.submit({ theme })
	} catch {
		// onError
	}
}

function tryLoadThemeFromQuery(themes: any[]): boolean {
	const q = themeFromQuery()
	if (!q || !themes?.length) return false
	if (!themes.some((t) => t.name === q)) return false
	loadTheme(q)
	return true
}

const saveResource = createResource({
	url: "themes.api.save_desk_theme",
	onSuccess(data: any) {
		if (data?.css_hash) editorMeta.css_hash = data.css_hash
		editorMeta.is_base_theme = !!data?.is_base_theme
		if (data?.theme_status) savedThemeStatus.value = normalizeThemeStatus(data.theme_status)
		captureSnapshot()
		themesList.reload()
	},
})

const renameThemeResource = createResource({ url: "themes.api.rename_desk_theme", auto: false })
const deleteThemeResource = createResource({ url: "themes.api.delete_desk_theme", auto: false })
const createThemeResource = createResource({
	url: "themes.api.create_desk_theme",
	onSuccess(data: any) {
		saveAsDialog.open = false
		saveAsDialog.busy = false
		themesList.reload()
		if (data?.theme) loadTheme(data.theme)
	},
	onError(err: any) {
		saveAsDialog.error = err?.message || "Could not create desk theme."
		saveAsDialog.busy = false
	},
})
const baseThemePayloadResource = createResource({ url: "themes.api.get_base_desk_theme_payload", auto: false })
const saveAsBaseThemeResource = createResource({ url: "themes.api.save_as_base_desk_theme", auto: false })

function openConfirmDialog(action: "switch" | "restore", pendingTheme = "") {
	confirmDialog.action = action
	confirmDialog.pendingTheme = pendingTheme
	confirmDialog.title = "Unsaved changes"
	confirmDialog.message =
		action === "switch"
			? `Save your changes before switching desk themes?`
			: "Save your changes before restoring from the base desk theme?"
	confirmDialog.open = true
}

function closeConfirmDialog() {
	if (confirmDialog.busy) return
	confirmDialog.open = false
	confirmDialog.action = ""
	confirmDialog.pendingTheme = ""
}

async function confirmSaveAndContinue() {
	confirmDialog.busy = true
	try {
		await handleSave()
		if (confirmDialog.action === "switch") await loadTheme(confirmDialog.pendingTheme)
		else if (confirmDialog.action === "restore") await restoreToBaseConfirmed()
		closeConfirmDialog()
	} finally {
		confirmDialog.busy = false
	}
}

async function confirmDiscardAndContinue() {
	const action = confirmDialog.action
	const pendingTheme = confirmDialog.pendingTheme
	closeConfirmDialog()
	if (action === "switch") {
		await loadTheme(pendingTheme)
		return
	}
	revertChanges()
	await restoreToBaseConfirmed()
}

function onThemeChange() {
	const next = selectedTheme.value
	const current = editingTheme.value
	if (!next || next === current) return
	if (isDirty.value) {
		selectedTheme.value = current
		openConfirmDialog("switch", next)
		return
	}
	loadTheme(next)
}

function revertChanges() {
	applyPayloadToForm(savedSnapshot.value)
}

async function handleSave() {
	saving.value = true
	try {
		await saveResource.submit({ theme: editingTheme.value, payload: buildPayloadFromForm() })
	} finally {
		saving.value = false
	}
}

async function setThemeStatus(next: ThemeAvailabilityStatus) {
	if (!canChangeStatus.value || next === savedThemeStatus.value) return
	statusSaving.value = true
	switchError.value = ""
	try {
		await saveResource.submit({ theme: editingTheme.value, payload: savedSnapshot.value, status: next })
	} catch (err: any) {
		switchError.value = err?.message || "Could not update desk theme availability."
	} finally {
		statusSaving.value = false
	}
}

function openSaveAsDialog() {
	saveAsDialog.name = `${editorMeta.theme_name || "Desk Theme"} copy`
	saveAsDialog.error = ""
	saveAsDialog.open = true
}

function closeSaveAsDialog() {
	if (saveAsDialog.busy) return
	saveAsDialog.open = false
	saveAsDialog.name = ""
	saveAsDialog.error = ""
}

async function submitSaveAs() {
	const name = saveAsDialog.name.trim()
	if (!name) {
		saveAsDialog.error = "Enter a desk theme name."
		return
	}
	saveAsDialog.busy = true
	saveAsDialog.error = ""
	try {
		await createThemeResource.submit({ theme_name: name, payload: buildPayloadFromForm() })
	} catch {
		// onError
	}
}

function openRenameDialog() {
	if (!canRenameOrDelete.value) return
	renameDialog.name = editorMeta.theme_name || ""
	renameDialog.error = ""
	renameDialog.open = true
}

function closeRenameDialog() {
	if (renameDialog.busy) return
	renameDialog.open = false
}

async function submitRename() {
	const name = renameDialog.name.trim()
	if (!name) {
		renameDialog.error = "Enter a theme name."
		return
	}
	renameDialog.busy = true
	try {
		const data = await renameThemeResource.submit({ theme: editingTheme.value, theme_name: name })
		renameDialog.open = false
		await themesList.reload()
		await loadTheme(data?.theme || editingTheme.value)
	} catch (err: any) {
		renameDialog.error = err?.message || "Could not rename desk theme."
	} finally {
		renameDialog.busy = false
	}
}

function openDeleteDialog() {
	if (!canRenameOrDelete.value) return
	deleteDialog.error = ""
	deleteDialog.open = true
}

function closeDeleteDialog() {
	if (deleteDialog.busy) return
	deleteDialog.open = false
}

async function submitDelete() {
	deleteDialog.busy = true
	const deleted = editingTheme.value
	try {
		await deleteThemeResource.submit({ theme: deleted })
		deleteDialog.open = false
		editingTheme.value = ""
		await themesList.reload()
		const pick =
			themesList.data?.find((t: any) => t.is_active)?.name ||
			themesList.data?.find((t: any) => t.is_base_theme)?.name ||
			themesList.data?.[0]?.name
		if (pick) await loadTheme(pick)
	} catch (err: any) {
		deleteDialog.error = err?.message || "Could not delete desk theme."
	} finally {
		deleteDialog.busy = false
	}
}

function requestRestoreToBase() {
	if (!siteBaseTheme.value || editingTheme.value === siteBaseTheme.value) return
	if (isDirty.value) {
		openConfirmDialog("restore")
		return
	}
	restoreToBaseConfirmed()
}

async function restoreToBaseConfirmed() {
	switchError.value = ""
	try {
		const data = await baseThemePayloadResource.submit({})
		applyPayloadToForm(data?.payload || {})
		applyLiveThemeVars()
	} catch (err: any) {
		switchError.value = err?.message || "Could not load base desk theme."
	}
}

async function submitSaveAsBaseTheme() {
	systemTab.busy = true
	systemTab.error = ""
	systemTab.success = ""
	try {
		const data = await saveAsBaseThemeResource.submit({
			theme: editingTheme.value,
			password: systemTab.password,
		})
		systemTab.password = ""
		systemTab.success =
			"Base desk theme saved and bundled into the app. Commit and push the themes app to ship it on new installs."
		siteBaseTheme.value = data?.theme || editingTheme.value
		editorMeta.is_base_theme = true
		if (data?.css_hash) editorMeta.css_hash = data.css_hash
		themesList.reload()
	} catch (err: any) {
		systemTab.error = err?.message || "Could not save as base desk theme."
	} finally {
		systemTab.busy = false
	}
}

function applyLiveThemeVars() {
	if (!editorLoaded.value) return
	applyDeskThemeVars(computeCSSVariables())
}

let pushTimer: ReturnType<typeof setTimeout> | null = null
watch(
	form,
	() => {
		applyLiveThemeVars()
		if (pushTimer) clearTimeout(pushTimer)
		pushTimer = setTimeout(pushToPreview, 80)
	},
	{ deep: true },
)

onMounted(() => {
	if (themesList.data?.length) tryLoadThemeFromQuery(themesList.data)
})
</script>

<style scoped>
.editor-panel {
	padding: 1rem 1.25rem;
	border-radius: var(--nce-border-radius, 0.375rem);
	border: 1px solid var(--nce-color-border, #e5e7eb);
	background: var(--nce-color-surface, #f9fafb);
	box-shadow: var(--nce-shadow, 0 1px 2px rgba(0, 0, 0, 0.06));
	width: 100%;
	box-sizing: border-box;
}
.editor-tab {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	width: 100%;
}
.editor-header {
	margin-bottom: 1.25rem;
}
.editor-title {
	font-size: calc(var(--nce-font-size, 14px) * 1.375);
	font-weight: 600;
	color: var(--nce-color-heading, #111827);
}
.editor-subtitle {
	font-size: calc(var(--nce-font-size, 14px) * 0.875);
	color: var(--nce-color-text, #374151);
}
.editor-status-label,
.editor-status-option,
.editor-status-hint {
	font-size: calc(var(--nce-font-size, 14px) * 0.875);
}
.editor-status-hint-warn,
.editor-warn {
	color: var(--nce-color-warning, #d97706);
}
.editor-muted {
	color: var(--nce-color-muted, #9ca3af);
}
.theme-select {
	flex: 1 1 auto;
	max-width: 26rem;
	width: 100%;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	padding: 0.5625rem 2.5rem 0.5625rem 0.875rem;
	font-size: 14px;
}
</style>
