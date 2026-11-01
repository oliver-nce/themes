<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue"

type PickKind = "bg" | "text" | "border"

interface DialogModel {
	kind: "element" | "table"
	title: string
	subtitle: string
	notes: string[]
	disabled: boolean
	hasPart: boolean
	saving: boolean
	draft: Record<string, unknown>
	themeDefaults: Record<string, { label: string; css?: string }>
	x: number
	y: number
}

interface DialogHandlers {
	pick: (field: string, kind: PickKind, fgField: string | null) => void
	changed: (field: string) => void
	save: () => void
	cancel: () => void
	revert: () => void
	openRecord: () => void
	part: () => void
}

const props = defineProps<{
	model: DialogModel
	handlers: DialogHandlers
}>()

const box = ref<HTMLElement | null>(null)
const pos = reactive({ left: 0, top: 0 })

const BORDER_WIDTH_OPTIONS = [
	{ value: "", label: "Theme default" },
	{ value: "theme-border-thin", label: "Thin" },
	{ value: "theme-border", label: "Normal" },
	{ value: "theme-border-strong", label: "Strong" },
] as const

const TABLE_BG_ROWS = [
	{ label: "Header row", bgField: "table_header_bg_class", fgField: "table_header_fg_type" },
	{ label: "Rows", bgField: "table_row_bg_class", fgField: "table_row_fg_type" },
	{
		label: "Alternate rows",
		bgField: "table_row_alt_bg_class",
		fgField: "table_row_alt_fg_type",
	},
] as const

const TABLE_LINE_ROWS = [
	{
		label: "Header underline",
		widthField: "table_header_line_class",
		colorField: "table_header_line_color_class",
	},
	{
		label: "Row dividers",
		widthField: "table_row_divider_class",
		colorField: "table_row_divider_color_class",
	},
	{
		label: "Column dividers",
		widthField: "table_col_divider_class",
		colorField: "table_col_divider_color_class",
	},
] as const

function draftStr(field: string): string {
	const v = props.model.draft[field]
	return v == null ? "" : String(v)
}

function themeLabel(field: string): string {
	return props.model.themeDefaults?.[field]?.label || ""
}
function themeCss(field: string): string {
	return props.model.themeDefaults?.[field]?.css || ""
}
function themeText(field: string): string {
	const label = themeLabel(field)
	return label ? "Theme: " + label : "Theme default"
}
function widthOptionLabel(field: string, value: string, label: string): string {
	if (value !== "") return label
	const t = themeLabel(field)
	return t ? "Theme: " + t : label
}

function bgClassText(bgField: string, fgField: string): string {
	const bgClass = draftStr(bgField)
	if (!bgClass) return themeText(bgField)
	if (draftStr(fgField) === "tonal") return bgClass + " · tonal"
	return bgClass
}

function clampPosition(left: number, top: number) {
	const margin = 8
	const el = box.value
	const w = el ? el.offsetWidth : 560
	const h = el ? el.offsetHeight : 400
	let l = left
	let t = top
	if (l + w > window.innerWidth - margin) l = window.innerWidth - w - margin
	if (t + h > window.innerHeight - margin) t = window.innerHeight - h - margin
	if (l < margin) l = margin
	if (t < margin) t = margin
	pos.left = l
	pos.top = t
}

let dragStartX = 0
let dragStartY = 0
let dragStartLeft = 0
let dragStartTop = 0

function onMove(ev: MouseEvent) {
	const left = dragStartLeft + (ev.clientX - dragStartX)
	const top = dragStartTop + (ev.clientY - dragStartY)
	clampPosition(left, top)
}

function onUp() {
	window.removeEventListener("mousemove", onMove, true)
	window.removeEventListener("mouseup", onUp, true)
}

function startDrag(e: MouseEvent) {
	if (e.button !== 0) return
	e.preventDefault()
	dragStartX = e.clientX
	dragStartY = e.clientY
	dragStartLeft = pos.left
	dragStartTop = pos.top
	window.addEventListener("mousemove", onMove, true)
	window.addEventListener("mouseup", onUp, true)
}

function onKeep(e: Event) {
	const t = e.target as HTMLInputElement
	props.model.draft.keep_default = t.checked ? 1 : 0
	props.handlers.changed("keep_default")
}

onMounted(() => {
	nextTick(() => {
		clampPosition(props.model.x + 8, props.model.y + 8)
	})
})

onBeforeUnmount(() => {
	window.removeEventListener("mousemove", onMove, true)
	window.removeEventListener("mouseup", onUp, true)
})
</script>

<template>
	<div ref="box" class="dd" :style="{ left: pos.left + 'px', top: pos.top + 'px' }">
		<div class="dd-head" @mousedown="startDrag">
			<span class="dd-title">{{ model.title }}</span>
			<span class="dd-sub">{{ model.subtitle }}</span>
			<button
				class="dd-x"
				type="button"
				title="Cancel"
				@mousedown.stop
				@click="handlers.cancel()"
			>
				×
			</button>
		</div>
		<div class="dd-body">
			<div v-for="(note, i) in model.notes" :key="'n-' + i" class="dd-note">{{ note }}</div>
			<div
				v-if="model.kind === 'element' && model.draft.keep_default"
				class="dd-note"
			>
				Keep default is on: this part uses the theme's own colours. The page shows it after
				Save.
			</div>

			<template v-if="model.kind === 'element'">
				<div class="dd-section">Colours</div>
				<div class="dd-row">
					<span class="dd-row-label">Background</span>
					<div
						class="dd-chip"
						:class="
							draftStr('override_bg_class')
								? draftStr('override_bg_class')
								: themeCss('override_bg_class')
									? undefined
									: 'dd-chip-empty'
						"
						:style="
							!draftStr('override_bg_class') && themeCss('override_bg_class')
								? {
										background: themeCss('override_bg_class'),
										color: themeCss('override_text_class') || undefined,
									}
								: undefined
						"
					>
						Aa
					</div>
					<div class="dd-class">
						{{ bgClassText("override_bg_class", "override_fg_type") }}
					</div>
					<button
						type="button"
						class="dd-btn"
						:disabled="model.disabled"
						@click="handlers.pick('override_bg_class', 'bg', 'override_fg_type')"
					>
						Pick…
					</button>
				</div>
				<div class="dd-row">
					<span class="dd-row-label">Text</span>
					<div
						class="dd-chip"
						:class="draftStr('override_text_class') || undefined"
						:style="
							!draftStr('override_text_class') && themeCss('override_text_class')
								? {
										color: themeCss('override_text_class'),
										background: themeCss('override_bg_class') || undefined,
									}
								: undefined
						"
					>
						Aa
					</div>
					<div class="dd-class">
						{{ draftStr("override_text_class") || themeText("override_text_class") }}
					</div>
					<button
						type="button"
						class="dd-btn"
						:disabled="model.disabled"
						@click="handlers.pick('override_text_class', 'text', null)"
					>
						Pick…
					</button>
				</div>
				<div class="dd-row">
					<span class="dd-row-label">Border</span>
					<div
						class="dd-chip dd-chip-border"
						:class="
							draftStr('override_border_color_class')
								? draftStr('override_border_color_class')
								: themeCss('override_border_color_class')
									? undefined
									: 'dd-chip-empty'
						"
						:style="
							!draftStr('override_border_color_class') &&
							themeCss('override_border_color_class')
								? { borderColor: themeCss('override_border_color_class') }
								: undefined
						"
					></div>
					<div class="dd-class">
						<select
							class="dd-select"
							v-model="model.draft.override_border_width_class"
							:disabled="model.disabled"
							@change="handlers.changed('override_border_width_class')"
						>
							<option
								v-for="opt in BORDER_WIDTH_OPTIONS"
								:key="opt.value"
								:value="opt.value"
							>
								{{
									widthOptionLabel(
										"override_border_width_class",
										opt.value,
										opt.label,
									)
								}}
							</option>
						</select>
						<span>{{
							draftStr("override_border_color_class") ||
								themeText("override_border_color_class")
						}}</span>
					</div>
					<button
						type="button"
						class="dd-btn"
						:disabled="model.disabled"
						@click="handlers.pick('override_border_color_class', 'border', null)"
					>
						Pick…
					</button>
				</div>
				<label class="dd-check">
					<input
						type="checkbox"
						:checked="!!model.draft.keep_default"
						:disabled="model.disabled"
						@change="onKeep"
					/>
					Keep default
				</label>
			</template>

			<template v-else-if="model.kind === 'table'">
				<div class="dd-section">Rows</div>
				<div v-for="row in TABLE_BG_ROWS" :key="row.bgField" class="dd-row">
					<span class="dd-row-label">{{ row.label }}</span>
					<div
						class="dd-chip"
						:class="
							draftStr(row.bgField)
								? draftStr(row.bgField)
								: themeCss(row.bgField)
									? undefined
									: 'dd-chip-empty'
						"
						:style="
							!draftStr(row.bgField) && themeCss(row.bgField)
								? { background: themeCss(row.bgField) }
								: undefined
						"
					>
						Aa
					</div>
					<div class="dd-class">{{ bgClassText(row.bgField, row.fgField) }}</div>
					<button
						type="button"
						class="dd-btn"
						:disabled="model.disabled"
						@click="handlers.pick(row.bgField, 'bg', row.fgField)"
					>
						Pick…
					</button>
				</div>
				<div class="dd-section">Lines</div>
				<div v-for="row in TABLE_LINE_ROWS" :key="row.colorField" class="dd-row">
					<span class="dd-row-label">{{ row.label }}</span>
					<div
						class="dd-chip dd-chip-border"
						:class="
							draftStr(row.colorField)
								? draftStr(row.colorField)
								: themeCss(row.colorField)
									? undefined
									: 'dd-chip-empty'
						"
						:style="
							!draftStr(row.colorField) && themeCss(row.colorField)
								? { borderColor: themeCss(row.colorField) }
								: undefined
						"
					></div>
					<div class="dd-class">
						<select
							class="dd-select"
							v-model="model.draft[row.widthField]"
							:disabled="model.disabled"
							@change="handlers.changed(row.widthField)"
						>
							<option
								v-for="opt in BORDER_WIDTH_OPTIONS"
								:key="row.widthField + opt.value"
								:value="opt.value"
							>
								{{ widthOptionLabel(row.widthField, opt.value, opt.label) }}
							</option>
						</select>
						<span>{{ draftStr(row.colorField) || themeText(row.colorField) }}</span>
					</div>
					<button
						type="button"
						class="dd-btn"
						:disabled="model.disabled"
						@click="handlers.pick(row.colorField, 'border', null)"
					>
						Pick…
					</button>
				</div>
			</template>
		</div>
		<div class="dd-foot">
			<button
				type="button"
				class="dd-link"
				:disabled="model.disabled"
				@click="handlers.revert()"
			>
				Revert to theme defaults…
			</button>
			<button v-if="model.hasPart" type="button" class="dd-btn" @click="handlers.part()">
				Style this part instead
			</button>
			<button type="button" class="dd-btn" @click="handlers.openRecord()">Open record</button>
			<button type="button" class="dd-btn" @click="handlers.cancel()">Cancel</button>
			<button
				type="button"
				class="dd-btn dd-btn-primary"
				:disabled="model.disabled || model.saving"
				@click="handlers.save()"
			>
				{{ model.saving ? "Saving…" : "Save" }}
			</button>
		</div>
	</div>
</template>
