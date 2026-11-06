<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue"
import { THEME_CLASS_CATALOG } from "../domain/theme-class-catalog"
import {
	isInstancePropertyOverridden,
	isTableDividerRow,
	resetInstanceStyleProperty,
	setInstanceStyleOverride,
	setStyleOverride,
	styleRowsForDialog,
	styleValueForTab,
	type DialogStyleRow,
	type StyleRow,
	type StyleScopeTab,
} from "./theme-style-rows"

type PickKind = "bg" | "text" | "border"

interface DeskThemeInfo {
	name: string
	theme_name: string
}

interface DeskSourceInfo {
	cssVar: string
	field: string
	label: string
}

interface OriginalStylesDecl {
	prop: string
	value: string
	important: boolean
}

interface OriginalStylesRule {
	file: string
	selector: string
	decls: OriginalStylesDecl[]
}

interface OriginalStylesComputed {
	label: string
	value: string
}

interface OriginalStyles {
	classes: { theme: string[]; other: string[] }
	inline: OriginalStylesDecl[]
	rules: OriginalStylesRule[]
	unreadable: string[]
	computed: OriginalStylesComputed[]
	warnings: string[]
	conflicts?: { label: string; line1: string; line2: string }[]
}

interface DialogModel {
	kind: "element" | "table"
	title: string
	subtitle: string
	notes: string[]
	disabled: boolean
	hasPart: boolean
	saving: boolean
	sourceClasses?: string
	draft: Record<string, unknown>
	instanceDraft: Record<string, unknown>
	styleTab: StyleScopeTab
	instanceIdentity: string
	themeDefaults: Record<string, { label: string; css?: string }>
	deskSources: Record<string, DeskSourceInfo>
	deskTheme: DeskThemeInfo | null
	originalStyles: OriginalStyles | null
	buttonSizes?: Record<string, string>
	x: number
	y: number
}

interface DialogHandlers {
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

const props = defineProps<{
	model: DialogModel
	handlers: DialogHandlers
}>()

const box = ref<HTMLElement | null>(null)
const pos = reactive({ left: 0, top: 0 })

const catalogProperties = THEME_CLASS_CATALOG.properties

const styleRows = computed(() =>
	styleRowsForDialog(props.model.kind, props.model.sourceClasses || ""),
)

const showKeepDefault = computed(
	() => props.model.kind === "element" && Object.prototype.hasOwnProperty.call(props.model.draft, "keep_default"),
)

const appStylesOnly = computed(
	() => showKeepDefault.value && !!props.model.draft.keep_default,
)

const rowsDisabled = computed(() => props.model.disabled || appStylesOnly.value)

const onOriginalTab = computed(() => props.model.styleTab === "original")

const catalogClasses = THEME_CLASS_CATALOG.classes

function themeClassInfo(cls: string): string {
	const propIds = catalogClasses[cls as keyof typeof catalogClasses]
	if (!propIds) return " — (not a Themes style class)"
	const labels = propIds.map(
		(id) => catalogProperties[id as keyof typeof catalogProperties]?.label ?? id,
	)
	return " — " + labels.join(", ")
}

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

function deskSource(field: string): DeskSourceInfo | undefined {
	return props.model.deskSources?.[field]
}

function showDeskSource(field: string): boolean {
	return !!deskSource(field) && !draftStr(field)
}

function deskSourceLine(field: string): string {
	const s = deskSource(field)
	if (!s) return ""
	return "Desk theme · " + s.label + " (" + s.cssVar + ")"
}

function openDeskThemeField(field: string) {
	const theme = props.model.deskTheme
	const s = deskSource(field)
	if (!theme?.name || !s) return
	const url =
		window.location.origin +
		"/desk-themes/theme-settings?theme=" +
		encodeURIComponent(theme.name) +
		"&field=" +
		encodeURIComponent(s.field)
	const w = window.open(url, "nce-themes-app")
	if (w) w.focus()
}
function legacyFieldForProp(propId: string): string {
	const prop = catalogProperties[propId as keyof typeof catalogProperties] as
		| { legacyField?: string }
		| undefined
	return prop?.legacyField || ""
}

function widthOptionLabel(propId: string, value: string, label: string): string {
	if (value !== "") return label
	const t = themeLabel(legacyFieldForProp(propId))
	return t ? "Theme: " + t : label
}

const onInstanceTab = computed(() => props.model.styleTab === "instance")

function styleValueForProp(propId: string): string {
	return styleValueForTab(
		props.model.draft,
		props.model.instanceDraft,
		props.model.styleTab,
		propId,
	)
}

function styleValue(row: StyleRow): string {
	return styleValueForProp(row.id)
}

function propInherited(propId: string): boolean {
	return onInstanceTab.value && !isInstancePropertyOverridden(props.model.instanceDraft, propId)
}

function styleRowInherited(row: DialogStyleRow): boolean {
	if (isTableDividerRow(row)) {
		return propInherited(row.widthPropId) && propInherited(row.colorPropId)
	}
	return propInherited(row.id)
}

function onStyleChoice(row: StyleRow, ev: Event) {
	const t = ev.target as HTMLSelectElement
	if (onInstanceTab.value) {
		if (!t.value.trim()) resetInstanceStyleProperty(props.model.instanceDraft, row.id)
		else setInstanceStyleOverride(props.model.instanceDraft, row.id, t.value)
		props.handlers.changed("instance_style_overrides")
		return
	}
	setStyleOverride(props.model.draft, row.id, t.value)
	props.handlers.changed("theme_style_overrides")
}

function pickStyle(row: StyleRow) {
	props.handlers.pick("style:" + row.id, row.pickKind || "border", row.fgField || null)
}

function pickDividerColor(row: DialogStyleRow & { kind: "table-divider" }) {
	props.handlers.pick("style:" + row.colorPropId, "border", null)
}

function styleDisplayForProp(propId: string, inherited: boolean): string {
	const v = styleValueForProp(propId)
	if (inherited) {
		return v ? "Component: " + v : "Component default"
	}
	if (v) return v
	return "Theme default"
}

function styleDisplay(row: StyleRow): string {
	return styleDisplayForProp(row.id, styleRowInherited(row))
}

function resetPropToComponent(propId: string) {
	resetInstanceStyleProperty(props.model.instanceDraft, propId)
	props.handlers.changed("instance_style_overrides")
}

function resetRowToComponent(row: StyleRow) {
	resetPropToComponent(row.id)
}

function onDividerWidthChoice(row: DialogStyleRow & { kind: "table-divider" }, ev: Event) {
	const t = ev.target as HTMLSelectElement
	const propId = row.widthPropId
	if (onInstanceTab.value) {
		if (!t.value.trim()) resetInstanceStyleProperty(props.model.instanceDraft, propId)
		else setInstanceStyleOverride(props.model.instanceDraft, propId, t.value)
		props.handlers.changed("instance_style_overrides")
		return
	}
	setStyleOverride(props.model.draft, propId, t.value)
	props.handlers.changed("theme_style_overrides")
}

function setTab(tab: StyleScopeTab) {
	if (props.model.styleTab === tab) return
	props.model.styleTab = tab
	props.handlers.setStyleTab(tab)
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

function sizeInfo(row: StyleRow): string {
	if (row.id !== "button-size") return ""
	return props.model.buttonSizes?.[styleValue(row) || "md"] || ""
}

function onKeep(e: Event) {
	const t = e.target as HTMLInputElement
	props.model.draft.keep_default = t.checked ? 1 : 0
	props.handlers.changed("keep_default")
}

function onImportant(e: Event) {
	const t = e.target as HTMLInputElement
	props.model.draft.override_important = t.checked ? 1 : 0
	props.handlers.changed("override_important")
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
			<template v-if="model.styleTab === 'component'">
				<div v-for="(note, i) in model.notes" :key="'n-' + i" class="dd-note">{{ note }}</div>
			</template>
			<div v-if="styleRows.length" class="dd-tabs">
				<button
					type="button"
					class="dd-tab"
					:class="{ 'dd-tab-active': model.styleTab === 'component' }"
					@click="setTab('component')"
				>
					This Component
				</button>
				<button
					type="button"
					class="dd-tab"
					:class="{ 'dd-tab-active': model.styleTab === 'instance' }"
					@click="setTab('instance')"
				>
					This Instance
				</button>
				<button
					type="button"
					class="dd-tab"
					:class="{ 'dd-tab-active': model.styleTab === 'original' }"
					@click="setTab('original')"
				>
					Original styles
				</button>
			</div>
			<template v-if="onOriginalTab">
				<div
					v-for="(warn, wi) in model.originalStyles?.warnings || []"
					:key="'ow-' + wi"
					class="dd-note"
				>
					{{ warn }}
				</div>
				<div v-if="!model.originalStyles" class="dd-note">
					Original styles are not available for this element.
				</div>
				<div v-else class="dd-orig">
					<div class="dd-section">Where the app overrides a Themes style</div>
					<div v-if="!(model.originalStyles.conflicts || []).length">
						None. The app does not set any style that Themes controls on this element.
					</div>
					<div
						v-for="cf in model.originalStyles.conflicts || []"
						:key="'cf-' + cf.label"
						class="dd-orig-conflict"
					>
						<strong>{{ cf.label }}</strong>
						<div>{{ cf.line1 }}</div>
						<div>{{ cf.line2 }}</div>
					</div>
					<details class="dd-orig-all">
					<summary>Show every original style</summary>
					<div class="dd-section">Classes</div>
					<div>Theme classes:</div>
					<div v-if="model.originalStyles.classes.theme.length">
						<div v-for="c in model.originalStyles.classes.theme" :key="'tc-' + c">
							<code>{{ c }}</code>{{ themeClassInfo(c) }}
						</div>
					</div>
					<div v-else>None</div>
					<div>App classes:</div>
					<div v-if="model.originalStyles.classes.other.length">
						<code v-for="c in model.originalStyles.classes.other" :key="'ac-' + c">{{ c }}</code>
					</div>
					<div v-else>None</div>
					<div class="dd-section">Inline style</div>
					<template v-if="model.originalStyles.inline.length">
						<div v-for="d in model.originalStyles.inline" :key="'in-' + d.prop">
							{{ d.prop }}: {{ d.value }}
							<span v-if="d.important" class="dd-orig-badge">!important</span>
						</div>
					</template>
					<div v-else>None</div>
					<div class="dd-section">App CSS rules</div>
					<template v-if="model.originalStyles.rules.length">
						<div v-for="(rule, ri) in model.originalStyles.rules" :key="'ru-' + ri">
							<div class="dd-orig-file">{{ rule.file }}</div>
							<div><code>{{ rule.selector }}</code></div>
							<div v-for="d in rule.decls" :key="rule.selector + d.prop">
								{{ d.prop }}: {{ d.value }}
								<span v-if="d.important" class="dd-orig-badge">!important</span>
							</div>
						</div>
					</template>
					<div v-else>None found</div>
					<template v-if="model.originalStyles.unreadable.length">
						<div class="dd-section">Could not be read</div>
						<div v-for="(href, ui) in model.originalStyles.unreadable" :key="'un-' + ui">
							{{ href || "stylesheet on another site" }}
						</div>
					</template>
					<div class="dd-section">Browser uses now</div>
					<div
						v-for="row in model.originalStyles.computed"
						:key="'cs-' + row.label"
						class="dd-orig-row"
					>
						<span>{{ row.label }}</span>
						<span>{{ row.value }}</span>
					</div>
					</details>
				</div>
			</template>
			<template v-else>
				<div v-if="appStylesOnly" class="dd-note">
					Use original app styles only is on: Themes adds no styles to this element. Its look
					comes from the app's own code.
				</div>
				<div
					v-if="model.styleTab === 'instance' && model.instanceIdentity"
					class="dd-instance-id"
				>
					{{ model.instanceIdentity }}
				</div>
				<div v-if="styleRows.length" class="dd-section">Theme styles</div>
				<table v-if="styleRows.length" class="theme-table dd-style-table">
					<tbody>
						<tr
							v-for="row in styleRows"
							:key="row.id"
							:class="{
								'dd-row-inherited': styleRowInherited(row),
								'dd-rows-off': appStylesOnly,
							}"
						>
							<td class="dd-row-label">{{ row.label }}</td>
							<template v-if="isTableDividerRow(row)">
								<td class="dd-swatch-cell">
									<div
										class="dd-chip dd-chip-border"
										:class="styleValueForProp(row.colorPropId) || 'dd-chip-empty'"
									></div>
								</td>
								<td>
									<div class="dd-class">
										<select
											class="dd-select"
											:value="styleValueForProp(row.widthPropId)"
											:disabled="rowsDisabled"
											@change="onDividerWidthChoice(row, $event)"
										>
											<option
												v-for="opt in row.options"
												:key="row.widthPropId + (opt.value || 'default')"
												:value="opt.value"
											>
												{{ widthOptionLabel(row.widthPropId, opt.value, opt.label) }}
											</option>
										</select>
										<span>{{
											styleDisplayForProp(row.colorPropId, propInherited(row.colorPropId))
										}}</span>
									</div>
								</td>
								<td class="dd-actions">
									<button
										v-if="onInstanceTab && !propInherited(row.widthPropId)"
										type="button"
										class="dd-btn dd-btn-reset"
										:disabled="rowsDisabled"
										@click="resetPropToComponent(row.widthPropId)"
									>
										Reset
									</button>
									<button
										v-if="onInstanceTab && !propInherited(row.colorPropId)"
										type="button"
										class="dd-btn dd-btn-reset"
										:disabled="rowsDisabled"
										@click="resetPropToComponent(row.colorPropId)"
									>
										Reset
									</button>
									<button
										type="button"
										class="dd-btn"
										:disabled="rowsDisabled"
										@click="pickDividerColor(row)"
									>
										Colour…
									</button>
								</td>
							</template>
							<template v-else-if="row.kind === 'color-role'">
								<td class="dd-swatch-cell">
									<div class="dd-chip" :class="styleValue(row) || 'dd-chip-empty'">Aa</div>
								</td>
								<td>
									<div class="dd-class">{{ styleDisplay(row) }}</div>
								</td>
								<td class="dd-actions">
									<button
										v-if="onInstanceTab && !propInherited(row.id)"
										type="button"
										class="dd-btn dd-btn-reset"
										:disabled="rowsDisabled"
										@click="resetRowToComponent(row)"
									>
										Reset
									</button>
									<button
										type="button"
										class="dd-btn"
										:disabled="rowsDisabled"
										@click="pickStyle(row)"
									>
										Colour…
									</button>
								</td>
							</template>
							<template v-else>
								<td colspan="2">
									<div class="dd-class">
										<select
											class="dd-select"
											:value="styleValue(row)"
											:disabled="rowsDisabled"
											@change="onStyleChoice(row, $event)"
										>
											<option
												v-for="opt in row.options"
												:key="row.id + (opt.value || 'default')"
												:value="opt.value"
											>
												{{ opt.label }}
											</option>
										</select>
										<div v-if="sizeInfo(row)" class="dd-size-info">{{ sizeInfo(row) }}</div>
									</div>
								</td>
								<td class="dd-actions">
									<button
										v-if="onInstanceTab && !propInherited(row.id)"
										type="button"
										class="dd-btn dd-btn-reset"
										:disabled="rowsDisabled"
										@click="resetRowToComponent(row)"
									>
										Reset
									</button>
								</td>
							</template>
						</tr>
					</tbody>
				</table>
			</template>
		</div>
		<div v-if="showKeepDefault" class="dd-opts">
			<label class="dd-check">
				<input
					type="checkbox"
					:checked="!!model.draft.keep_default"
					:disabled="model.disabled"
					@change="onKeep"
				/>
				Use original app styles only
			</label>
			<label v-if="!appStylesOnly" class="dd-check">
				<input
					type="checkbox"
					:checked="!!model.draft.override_important"
					:disabled="model.disabled"
					@change="onImportant"
				/>
				Override the app's !important (also for every instance)
			</label>
		</div>
		<div class="dd-foot">
			<button
				v-if="model.styleTab === 'instance'"
				type="button"
				class="dd-link"
				:disabled="model.disabled"
				@click="handlers.revertInstance()"
			>
				Clear instance overrides…
			</button>
			<button
				v-else
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
