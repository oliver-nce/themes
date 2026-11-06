<!--
Desk Theme Editor for NCE Desk Theme colours, shape, typography, Gantt, and live preview.

-->

// Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
<template>
	<div class="max-w-6xl mx-auto px-6 py-4">
		<ThemeEditorHeader
			:manager="manager"
			title="Desk Theme Editor"
			noun="desk theme"
			status-label="For Desk:"
			radio-name="desk-theme-availability"
			restore-target="Desk Theme"
			:has-default-theme="true"
			restore-blocked-on-base
			:theme-option-label="themeOptionLabel"
			@preview="openPreview"
			@restore="requestRestoreToBase"
		/>

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
							: 'border-transparent editor-tab-idle'
					"
					@click="activeTab = tab.id"
				>
					{{ tab.label }}
				</button>
			</nav>

			<div v-show="activeTab === 'colors'" class="editor-tab">
				<EditorSection
					title="Palette (editor only)"
					hint="Sets the swatches offered in the colour pickers below. Not published to Desk."
					:panel-help="deskPanelHelp.brand"
				>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div
							v-for="c in brandColors"
							:key="c.key"
							:id="`desk-field-${c.key}`"
						>
							<SwatchPicker
								:label="c.label"
								:model-value="form[c.key]"
								:default-value="DEFAULTS[c.key]"
								:primary-color="form.primary_color"
								:secondary-color="form.brand_color"
								@update:model-value="form[c.key] = $event"
							/>
						</div>
					</div>
				</EditorSection>

				<EditorSection
					title="Backgrounds"
					hint="The large background areas visible behind and around forms."
					:panel-help="deskPanelHelp.backgrounds"
				>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div v-for="c in backgroundColors" :key="c.key" :id="`desk-field-${c.key}`">
							<SwatchPicker
								:label="c.label"
								:model-value="form[c.key]"
								:default-value="DEFAULTS[c.key]"
								:primary-color="form.primary_color"
								:secondary-color="form.brand_color"
								@update:model-value="form[c.key] = $event"
							/>
							<p v-if="c.hint" class="text-xs text-gray-500 mt-1">{{ c.hint }}</p>
						</div>
					</div>
				</EditorSection>

				<EditorSection
					title="Text"
					hint="Colour of labels, body copy, and helper text."
					:panel-help="deskPanelHelp.text"
				>
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<div
							v-for="c in textColors"
							:key="c.key"
							:id="`desk-field-${c.key}`"
						>
							<SwatchPicker
								:label="c.label"
								:model-value="form[c.key]"
								:default-value="DEFAULTS[c.key]"
								:primary-color="form.primary_color"
								:secondary-color="form.brand_color"
								@update:model-value="form[c.key] = $event"
							/>
						</div>
					</div>
				</EditorSection>

				<EditorSection
					title="Controls &amp; Borders"
					hint="Controls the colour of inputs, toolbar buttons, and the lines that structure forms and pages."
					:panel-help="deskPanelHelp.controlsBorders"
				>
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
						<div
							v-for="c in inputBorderColors"
							:key="c.key"
							:id="`desk-field-${c.key}`"
						>
							<SwatchPicker
								:label="c.label"
								:model-value="form[c.key]"
								:default-value="DEFAULTS[c.key]"
								:primary-color="form.primary_color"
								:secondary-color="form.brand_color"
								@update:model-value="form[c.key] = $event"
							/>
						</div>
					</div>
				</EditorSection>
			</div>

			<div v-show="activeTab === 'shape'" class="editor-tab">
				<EditorSection
					title="Corners"
					hint="Rounding of buttons, inputs, cards and the list header."
					:panel-help="deskPanelHelp.corners"
				>
					<SizeSlider
						label="Corner radius"
						v-model="form.radius"
						:min="0"
						:max="20"
						:step="1"
						unit="px"
						default-value="8px"
					/>
					<details class="mt-4">
						<summary class="text-xs text-gray-500 cursor-pointer">Older components</summary>
						<div class="mt-3">
							<SizeSlider
								label="Legacy border radius"
								v-model="form.border_radius"
								:min="0"
								:max="20"
								:step="1"
								unit="px"
								default-value="6px"
								hint="Only a few older Desk elements use this."
							/>
						</div>
					</details>
				</EditorSection>

				<EditorSection
					title="Sizes"
					hint="Heights of buttons and form fields, and checkbox size."
					:panel-help="deskPanelHelp.sizes"
				>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<SizeSlider
							label="Button height"
							v-model="form.btn_height"
							:min="20"
							:max="44"
							:step="1"
							unit="px"
							default-value="28px"
						/>
						<SizeSlider
							label="Input height"
							v-model="form.input_height"
							:min="20"
							:max="48"
							:step="1"
							unit="px"
							default-value="28px"
						/>
						<SizeSlider
							label="Checkbox size"
							v-model="form.checkbox_size"
							:min="10"
							:max="24"
							:step="1"
							unit="px"
							default-value="14px"
						/>
					</div>
				</EditorSection>

				<EditorSection title="Preview">
					<div class="bg-white rounded-lg border border-gray-200 p-5">
						<div class="flex flex-row flex-wrap gap-4 items-center">
							<button
								type="button"
								class="text-sm text-white bg-gray-900 border-0"
								:style="{
									height: form.btn_height,
									borderRadius: form.radius,
									padding: '0 14px',
								}"
							>
								Primary
							</button>
							<button
								type="button"
								class="text-sm bg-gray-100 border-0"
								:style="{
									height: form.btn_height,
									borderRadius: form.radius,
									padding: '0 14px',
								}"
							>
								Default
							</button>
							<input
								type="text"
								placeholder="Input"
								class="text-sm border border-gray-300 px-2"
								:style="{
									height: form.input_height,
									borderRadius: form.radius,
								}"
							/>
							<label class="inline-flex items-center gap-2 text-sm cursor-default">
								<span
									class="inline-block border-2 border-gray-500 shrink-0"
									:style="{
										width: form.checkbox_size,
										height: form.checkbox_size,
										borderRadius: '4px',
									}"
								/>
								Checkbox
							</label>
							<div
								class="text-xs border border-gray-200 p-3"
								:style="{ borderRadius: form.radius }"
							>
								Card
							</div>
						</div>
					</div>
				</EditorSection>
			</div>

			<div v-show="activeTab === 'layout'" class="editor-tab">
				<EditorSection
					title="Density"
					hint="How tightly Desk packs lists, forms and toolbars."
					:panel-help="deskPanelHelp.density"
				>
					<div class="flex flex-wrap items-center gap-2">
						<div class="inline-flex rounded-lg border border-gray-200 bg-white p-1">
							<button
								v-for="preset in densityPresetOptions"
								:key="preset.id"
								type="button"
								class="px-4 py-1.5 text-sm rounded-md transition-colors"
								:class="
									form.density === preset.id
										? 'bg-gray-900 text-white'
										: 'text-gray-700 hover:bg-gray-100'
								"
								@click="applyDensityPreset(preset.id)"
							>
								{{ preset.label }}
							</button>
						</div>
						<span
							v-if="form.density === 'custom'"
							class="text-xs bg-amber-100 text-amber-800 rounded px-2 py-0.5"
						>
							Custom
						</span>
					</div>
					<details class="mt-4">
						<summary class="text-sm text-gray-600 cursor-pointer">Fine-tune</summary>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
							<SizeSlider
								label="Base spacing"
								v-model="form.spacing"
								:min="0.15"
								:max="0.4"
								:step="0.01"
								unit="rem"
								default-value=".25rem"
							/>
							<SizeSlider
								label="Padding — small items"
								v-model="form.padding_xs"
								:min="0"
								:max="16"
								:step="1"
								unit="px"
								default-value="5px"
							/>
							<SizeSlider
								label="Padding — controls"
								v-model="form.padding_sm"
								:min="0"
								:max="20"
								:step="1"
								unit="px"
								default-value="7px"
							/>
							<SizeSlider
								label="Padding — sections"
								v-model="form.padding_md"
								:min="4"
								:max="32"
								:step="1"
								unit="px"
								default-value="15px"
							/>
							<SizeSlider
								label="Margin — tight"
								v-model="form.margin_xs"
								:min="0"
								:max="16"
								:step="1"
								unit="px"
								default-value="5px"
							/>
							<SizeSlider
								label="Margin — blocks"
								v-model="form.margin_sm"
								:min="0"
								:max="24"
								:step="1"
								unit="px"
								default-value="10px"
							/>
						</div>
					</details>
				</EditorSection>

				<EditorSection
					title="Lists"
					hint="Rows in list views."
					:panel-help="deskPanelHelp.lists"
				>
					<SizeSlider
						label="Row height"
						v-model="form.list_row_height"
						:min="22"
						:max="48"
						:step="1"
						unit="px"
						default-value="30px"
					/>
				</EditorSection>

				<EditorSection
					title="Pages"
					hint="Width of forms and height of the page title bar."
					:panel-help="deskPanelHelp.pages"
				>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<SizeSlider
							label="Form max width"
							v-model="form.page_max_width"
							:min="700"
							:max="1600"
							:step="10"
							unit="px"
							default-value="900px"
						/>
						<SizeSlider
							label="Page header height"
							v-model="form.page_head_height"
							:min="36"
							:max="72"
							:step="1"
							unit="px"
							default-value="48px"
						/>
					</div>
				</EditorSection>
			</div>

			<div v-show="activeTab === 'typography'" class="editor-tab">
				<EditorSection
					title="Body text"
					hint="Font, size and weight of everyday Desk text."
					:panel-help="deskPanelHelp.bodyText"
				>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FontSelectField
							label="Body Font"
							:options="fontOptions"
							v-model="form.font_family"
						/>
						<SizeSlider
							label="Body Size"
							v-model="form.font_size"
							:min="11"
							:max="18"
							:step="1"
							unit="px"
							default-value="14px"
							hint="Applies to Frappe v16 (--text-base)."
						/>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
						<SizeSlider
							:label="`Body Weight (${bodyWeightDisplay})`"
							v-model="form.font_weight_body"
							:min="100"
							:max="900"
							:step="1"
							unit=""
							default-value="420"
						/>
						<SizeSlider
							:label="`Bold Weight (${boldWeightDisplay})`"
							v-model="form.font_weight_bold"
							:min="100"
							:max="900"
							:step="1"
							unit=""
							default-value="600"
							hint="Fields and list rows Frappe marks as bold."
						/>
					</div>
					<div class="mt-4 rounded-lg border border-gray-200 p-5 bg-white">
						<p
							class="text-base text-gray-600"
							:style="{
								fontFamily: fontCSS(form.font_family),
								fontWeight: form.font_weight_body || '420',
								fontSize: form.font_size || '14px',
							}"
						>
							Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!
							The five boxing wizards jump quickly.
						</p>
						<p class="mt-2">
							<strong
								:style="{
									fontFamily: fontCSS(form.font_family),
									fontWeight: form.font_weight_bold || '600',
									fontSize: form.font_size || '14px',
								}"
							>Bold field sample</strong>
						</p>
					</div>
				</EditorSection>

				<EditorSection
					title="Text scale"
					hint="Small print, labels and titles."
					:panel-help="deskPanelHelp.textScale"
				>
					<label class="inline-flex items-center gap-3 cursor-pointer select-none mb-4">
						<input
							type="checkbox"
							class="sr-only peer"
							style="position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none"
							:checked="form.text_scale_mode === 'auto'"
							@change="setTextScaleAuto(($event.target as HTMLInputElement).checked)"
						/>
						<span
							class="relative inline-flex h-6 w-11 shrink-0 rounded-full bg-gray-200 transition-colors peer-checked:bg-blue-600 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
							aria-hidden="true"
						/>
						<span class="text-sm font-medium text-gray-700">Scale with body size</span>
					</label>
					<p
						v-if="form.text_scale_mode === 'auto'"
						class="text-sm text-gray-600 font-mono"
					>
						{{ textScaleSummary }}
					</p>
					<div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<SizeSlider
							label="Small print"
							v-model="form.text_xs"
							:min="9"
							:max="16"
							:step="1"
							unit="px"
							default-value="12px"
						/>
						<SizeSlider
							label="Labels & sidebar"
							v-model="form.text_sm"
							:min="10"
							:max="18"
							:step="1"
							unit="px"
							default-value="13px"
						/>
						<SizeSlider
							label="Titles"
							v-model="form.text_lg"
							:min="12"
							:max="24"
							:step="1"
							unit="px"
							default-value="16px"
						/>
					</div>
				</EditorSection>

				<EditorSection title="Other weights" :panel-help="deskPanelHelp.otherWeights">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<SizeSlider
							label="Medium weight"
							v-model="form.font_weight_medium"
							:min="100"
							:max="900"
							:step="1"
							unit=""
							default-value="500"
							hint="Buttons, tabs and other medium-weight text."
						/>
					</div>
				</EditorSection>
			</div>

		<div v-show="activeTab === 'gantt'" class="editor-tab">
				<EditorSection title="Gantt chart" :panel-help="deskPanelHelp.gantt">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<div
							v-for="c in ganttColors"
							:key="c.key"
							:id="`desk-field-${c.key}`"
						>
							<SwatchPicker
								:label="c.label"
								:model-value="form[c.key]"
								:default-value="DEFAULTS[c.key]"
								:primary-color="form.primary_color"
								:secondary-color="form.brand_color"
								@update:model-value="form[c.key] = $event"
							/>
						</div>
					</div>
				</EditorSection>
			</div>

			<div v-show="activeTab === 'system'" class="editor-tab">
				<EditorSection
					title="Save as base desk theme"
					hint="Rare release action: sets the site base desk theme, rebuilds CSS, and writes bundled files into the app for new installs. Commit and push after running."
				>
					<p v-if="!canSaveAsDefaultTheme" class="text-sm text-gray-500 mb-3">
						Only available when editing the Default (site base desk) theme.
					</p>
					<p class="text-sm text-gray-600 mb-3">
						Editing <strong>{{ editorMeta.theme_name || "—" }}</strong>.
						Requires your account password.
					</p>
					<PasswordField
						v-model="systemTab.password"
						@enter="submitSaveAsBaseTheme"
					/>
					<p v-if="systemTab.error" class="text-sm text-red-600 mb-2">{{ systemTab.error }}</p>
					<p v-if="systemTab.success" class="text-sm text-green-700 mb-2">{{ systemTab.success }}</p>
					<Button
						variant="solid"
						class="bg-primary text-primary-fg border border-primary"
						:loading="systemTab.busy"
						:disabled="!canSaveAsDefaultTheme || !systemTab.password"
						@click="submitSaveAsBaseTheme"
					>
						Save as base desk theme
					</Button>
				</EditorSection>
			</div>
		</template>

		<Teleport to="body">
			<ThemeDialog :open="confirmDialog.open" :title="confirmDialog.title" @close="closeConfirmDialog">
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
			</ThemeDialog>

			<ThemeDialog :open="saveAsDialog.open" title="Save as new desk theme" @close="closeSaveAsDialog">
				<input v-model="saveAsDialog.name" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-3" placeholder="Desk theme name" />
				<p v-if="saveAsDialog.error" class="text-sm text-red-600 mt-2">{{ saveAsDialog.error }}</p>
				<div class="flex gap-2 justify-end mt-5">
					<Button variant="solid" class="bg-primary-100 text-primary-100-fg border border-border" @click="closeSaveAsDialog">Cancel</Button>
					<Button variant="solid" class="bg-primary text-primary-fg border border-primary" :loading="saveAsDialog.busy" @click="submitSaveAs">Create</Button>
				</div>
			</ThemeDialog>

			<ThemeDialog :open="renameDialog.open" title="Rename desk theme" @close="closeRenameDialog">
				<input v-model="renameDialog.name" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-3" />
				<p v-if="renameDialog.error" class="text-sm text-red-600 mt-2">{{ renameDialog.error }}</p>
				<div class="flex gap-2 justify-end mt-5">
					<Button variant="solid" class="bg-primary-100 text-primary-100-fg border border-border" @click="closeRenameDialog">Cancel</Button>
					<Button variant="solid" class="bg-primary text-primary-fg border border-primary" :loading="renameDialog.busy" @click="submitRename">Rename</Button>
				</div>
			</ThemeDialog>

			<ThemeDialog :open="deleteDialog.open" title="Delete desk theme?" @close="closeDeleteDialog">
				<p class="text-sm text-gray-600 mt-2">This cannot be undone.</p>
				<p v-if="deleteDialog.error" class="text-sm text-red-600 mt-2">{{ deleteDialog.error }}</p>
				<div class="flex gap-2 justify-end mt-5">
					<Button variant="solid" class="bg-primary-100 text-primary-100-fg border border-border" @click="closeDeleteDialog">Cancel</Button>
					<Button variant="solid" class="bg-primary text-primary-fg border border-primary" :loading="deleteDialog.busy" @click="submitDelete">Delete</Button>
				</div>
			</ThemeDialog>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onUnmounted, onMounted, nextTick } from "vue"
import { useRoute } from "vue-router"
import EditorSection, { type PanelHelpContent } from "@/components/EditorSection.vue"
import FontSelectField from "@/components/FontSelectField.vue"
import PasswordField from "@/components/PasswordField.vue"
import SizeSlider from "@/components/SizeSlider.vue"
import SwatchPicker from "@/components/SwatchPicker.vue"
import ThemeEditorHeader from "@/components/ThemeEditorHeader.vue"
import ThemeDialog from "@/components/ThemeDialog.vue"
import { applyDeskThemeVars, deskPayloadToCssVars } from "@/composables/useDeskTheme"
import { useThemeManagement } from "@/composables/useThemeManagement"
import { fontStack as fontCSS } from "@/utils/fonts"
import {
	BODY_WEIGHT_MAX,
	BODY_WEIGHT_MIN,
	clampBodyWeight,
	weightDisplayLabel,
} from "@/utils/fontWeight"
import { PREVIEW_POPUP_FEATURES } from "@/utils/previewWindow"
import {
	DENSITY_PRESET_IDS,
	DENSITY_PRESET_KEYS,
	DENSITY_PRESETS,
	DESK_THEME_DEFAULTS,
	DESK_THEME_FIELDS,
	densityPresetTokenEqual,
	type DensityPresetId,
	type DeskThemeFormKey,
} from "@/domain/deskThemeForm"
import { locateDeskField } from "@/domain/deskFieldLocations"

const ALL_FIELDS = DESK_THEME_FIELDS
const PAYLOAD_FIELDS = ALL_FIELDS.filter((k) => k !== "theme_name")
type FormKey = DeskThemeFormKey
const DEFAULTS = DESK_THEME_DEFAULTS

const COLOR_FIELDS = new Set(
	PAYLOAD_FIELDS.filter(
		(k) =>
			k.endsWith("_color") ||
			k.endsWith("_fg") ||
			k.includes("_bg") ||
			k.includes("text_") ||
			k.includes("border") ||
			k.startsWith("g_") ||
			k.startsWith("surface_"),
	),
)

let previewWin: Window | null = null

const activeTab = ref("colors")
const tabs = [
	{ id: "colors", label: "Colours" },
	{ id: "typography", label: "Typography" },
	{ id: "shape", label: "Shape" },
	{ id: "layout", label: "Layout" },
	{ id: "gantt", label: "Gantt" },
	{ id: "system", label: "System" },
]

const FONT_OPTIONS = ["Inter", "Source Sans 3", "Public Sans", "Open Sans", "Roboto", "Nunito", "Source Serif 4", "JetBrains Mono", "System Default"]
const fontOptions = FONT_OPTIONS

const bodyWeightDisplay = computed(() =>
	weightDisplayLabel(clampBodyWeight(form.font_weight_body)),
)

const boldWeightDisplay = computed(() =>
	weightDisplayLabel(clampBodyWeight(form.font_weight_bold)),
)

const brandColors = [
	{ key: "primary_color" as FormKey, label: "Primary" },
	{ key: "brand_color" as FormKey, label: "Brand" },
]

const deskPanelHelp = {
	brand: {
		intro:
			"Primary and Brand set the shade grids offered in every colour picker below. Saved with the theme but not published to Desk CSS.",
		note:
			"Changing palette colours does not recolour Desk directly — it changes the swatches available in the published colour pickers below.",
		items: [
			{
				label: "Primary",
				affects: "Palette anchor for shade grids in the colour pickers below (editor only).",
			},
			{
				label: "Brand",
				affects: "Secondary palette anchor for shade grids in the colour pickers below (editor only).",
			},
		],
	},
	backgrounds: {
		items: [
			{
				label: "Page Background",
				affects: "Desk page backdrop behind lists and forms (`--bg-color`).",
			},
			{
				label: "Card / Form Surface",
				affects:
					"Form card/sheet fill, dropdown menus, and Form Builder editable field patches in normal view (`--fg-color` / `--card-bg`).",
			},
			{
				label: "Subtle Surface",
				affects:
					"List header row, toolbar surfaces, and paging buttons (`--surface-gray-2`).",
			},
			{
				label: "List Header Background",
				affects: "List view column header row background (`--subtle-fg`).",
			},
		],
	},
	text: {
		items: [
			{
				label: "Body Text",
				affects: "Field labels and body copy (`--text-color`).",
			},
			{
				label: "Muted Text",
				affects: "Secondary labels, helper text, and timestamps (`--text-muted`).",
			},
			{
				label: "Light Text",
				affects: "De-emphasised text on tinted or dark surfaces (`--text-light`).",
			},
			{
				label: "Headings",
				affects: "Page and section headings (`--heading-color`).",
			},
		],
	},
	controlsBorders: {
		note:
			"Frappe's flat design removes borders from individual input fields — the Border tokens affect structural lines around sections and pages, not field edges.",
		items: [
			{
				label: "Input Fields, Controls & Toolbar Buttons",
				affects:
					"Text inputs, dropdowns, and the neutral toolbar buttons you see on every list page — List View, Filter, Resize Columns, and similar controls throughout Desk (`--control-bg`).",
			},
			{
				label: "Sidebar Filter Inputs",
				affects:
					"The small text boxes in the list sidebar — the filter inputs under \"Filter By\" and the \"Filter Name\" box under \"Save Filter\". Has no effect outside the sidebar (`--control-bg-on-gray`).",
			},
			{
				label: "Border",
				affects:
					"Section dividers, the outer edge of form pages, tab underlines, and sidebar separator lines (`--border-color`).",
			},
			{
				label: "Strong Border",
				affects: "Heavier dividing lines — table header edges and emphasis separators (`--dark-border-color`).",
			},
			{
				label: "Workspace Quick List Buttons",
				affects:
					"The Refresh, Filter, Add New, and See All controls inside Quick List widgets on your Desk Home workspace. Has no effect on standard list or form pages (`--btn-default-bg`).",
			},
		],
	},
	corners: {
		items: [
			{
				label: "Corner radius",
				affects:
					"Primary rounding token on Frappe v16 Desk (`--radius`) — buttons, inputs, cards, and the list header.",
			},
			{
				label: "Legacy border radius",
				affects: "Older Desk components that still read `--border-radius` (not `--radius`).",
			},
		],
	},
	sizes: {
		items: [
			{ label: "Button height", affects: "Default button control height (`--btn-height`)." },
			{ label: "Input height", affects: "Text inputs, selects, and similar form controls (`--input-height`)." },
			{ label: "Checkbox size", affects: "Checkbox control width and height (`--checkbox-size`)." },
		],
	},
	density: {
		note:
			"Compact, Default and Comfortable apply coordinated spacing, padding, margins, list row height and input height. Fine-tune any value to switch to Custom.",
		items: [
			{
				label: "Density presets",
				affects: "Editor preference only — not published to Desk CSS (`density`).",
			},
			{ label: "Base spacing", affects: "Root spacing multiplier used across Desk layout (`--spacing`)." },
			{ label: "Padding — small items", affects: "Tight padding on chips, badges and compact controls (`--padding-xs`)." },
			{ label: "Padding — controls", affects: "Padding inside buttons, inputs and toolbar controls (`--padding-sm`)." },
			{ label: "Padding — sections", affects: "Padding around form sections and panels (`--padding-md`)." },
			{ label: "Margin — tight", affects: "Small gaps between related controls (`--margin-xs`)." },
			{ label: "Margin — blocks", affects: "Spacing between blocks and stacked sections (`--margin-sm`)." },
		],
	},
	lists: {
		items: [
			{ label: "Row height", affects: "Height of rows in list views (`--list-row-height`)." },
		],
	},
	pages: {
		items: [
			{ label: "Form max width", affects: "Maximum width of form layouts (`--page-max-width`)." },
			{ label: "Page header height", affects: "Height of the page title bar (`--page-head-height`)." },
		],
	},
	bodyText: {
		items: [
			{
				label: "Body Font",
				affects: "Desk typeface stack for body text and UI copy (`--font-stack`).",
			},
			{
				label: "Body Size",
				affects: "Base body text size on Frappe v16 Desk (`--text-base`).",
			},
			{
				label: "Body Weight",
				affects: "Regular body text weight across Desk (`--weight-regular` / `--font-weight-regular`).",
			},
			{
				label: "Bold Weight",
				affects:
					"Fields and list rows Frappe marks bold (`.bold`, `.form-control.bold`) via `--nce-weight-bold`.",
			},
		],
	},
	textScale: {
		note:
			"When “Scale with body size” is on, small, label, and title sizes track Body Size (14px defaults → 12 / 13 / 16px). Turn off to set each size manually.",
		items: [
			{
				label: "Scale with body size",
				affects: "Editor preference only — not published to Desk CSS (`text_scale_mode`).",
			},
			{
				label: "Small print",
				affects: "Fine print and compact UI text (`--text-xs`).",
			},
			{
				label: "Labels & sidebar",
				affects: "Sidebar labels, field labels, and secondary UI copy (`--text-sm`).",
			},
			{
				label: "Titles",
				affects: "Section titles and prominent headings (`--text-lg`).",
			},
		],
	},
	otherWeights: {
		items: [
			{
				label: "Medium weight",
				affects: "Buttons, tabs, and other medium-weight UI text (`--font-weight-medium`).",
			},
		],
	},
	gantt: {
		items: [
			{ label: "Bar", affects: "Gantt task bar fill (`--g-bar-color`)." },
			{ label: "Bar Border", affects: "Gantt task bar outline (`--g-bar-border`)." },
			{ label: "Progress", affects: "Completed portion of a Gantt bar (`--g-progress-color`)." },
			{ label: "Header Background", affects: "Gantt timeline header row (`--g-header-background`)." },
			{ label: "Row", affects: "Alternating Gantt grid row background (`--g-row-color`)." },
		],
	},
} satisfies Record<string, PanelHelpContent>

const backgroundColors: { key: FormKey; label: string; hint?: string }[] = [
	{ key: "bg_color", label: "Page Background" },
	{ key: "fg_color", label: "Card / Form Surface" },
	{
		key: "surface_gray_2",
		label: "Subtle Surface",
		hint: "List header row, toolbar and paging buttons",
	},
	{ key: "subtle_fg", label: "List Header Background" },
]

const textColors = [
	{ key: "text_color" as FormKey, label: "Body Text" },
	{ key: "text_muted" as FormKey, label: "Muted Text" },
	{ key: "text_light" as FormKey, label: "Light Text" },
	{ key: "heading_color" as FormKey, label: "Headings" },
]

const inputBorderColors = [
	{ key: "control_bg" as FormKey, label: "Input Fields, Controls & Toolbar Buttons" },
	{ key: "control_bg_on_gray" as FormKey, label: "Sidebar Filter Inputs" },
	{ key: "border_color" as FormKey, label: "Border" },
	{ key: "dark_border_color" as FormKey, label: "Strong Border" },
	{ key: "btn_default_bg" as FormKey, label: "Workspace Quick List Buttons" },
]

const ganttColors = [
	{ key: "g_bar_color" as FormKey, label: "Bar" },
	{ key: "g_bar_border" as FormKey, label: "Bar Border" },
	{ key: "g_progress_color" as FormKey, label: "Progress" },
	{ key: "g_header_background" as FormKey, label: "Header Background" },
	{ key: "g_row_color" as FormKey, label: "Row" },
]

const form = reactive<Record<FormKey, string>>({ ...DEFAULTS })

function themeOptionLabel(t: any): string {
	let label = t.theme_name || t.name
	if (t.is_default_theme ?? t.is_base_theme) label += " (Default)"
	if (t.is_active) label += " (active)"
	return label
}

function computeCSSVariables(): Record<string, string> {
	return deskPayloadToCssVars(buildPayloadFromForm())
}

// Live updates go over a BroadcastChannel so any open preview window gets them,
// however it was opened (editor button, sidebar link, home card) or reloaded.
const previewChannel = new BroadcastChannel("nce-desk-theme-preview")
previewChannel.onmessage = (event) => {
	if (event.data?.type === "nce-desk-preview-ready") pushToPreview()
}

function pushToPreview() {
	const message = { type: "nce-desk-theme-update", variables: computeCSSVariables() }
	previewChannel.postMessage(message)
	if (previewWin && !previewWin.closed) previewWin.postMessage(message, "*")
}

function openPreview() {
	if (previewWin && !previewWin.closed) {
		previewWin.focus()
		pushToPreview()
		return
	}
	previewWin = window.open("/desk-themes/preview", "desk-themes-preview", PREVIEW_POPUP_FEATURES)
	if (previewWin) previewWin.addEventListener("load", () => pushToPreview())
}

// A reloaded preview window asks the editor for the current (possibly unsaved) values.
function handlePreviewReady(event: MessageEvent) {
	if (event.data?.type !== "nce-desk-preview-ready") return
	;(event.source as Window | null)?.postMessage(
		{ type: "nce-desk-theme-update", variables: computeCSSVariables() },
		"*",
	)
}
window.addEventListener("message", handlePreviewReady)

onUnmounted(() => {
	window.removeEventListener("message", handlePreviewReady)
	previewChannel.close()
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

const suppressTextScaleAuto = ref(false)
const suppressDensityAuto = ref(false)

type DensityMode = DensityPresetId | "custom"

const densityPresetOptions = [
	{ id: "compact" as const, label: "Compact" },
	{ id: "default" as const, label: "Default" },
	{ id: "comfortable" as const, label: "Comfortable" },
]

function densityPresetMatches(presetId: DensityPresetId): boolean {
	const preset = DENSITY_PRESETS[presetId]
	return DENSITY_PRESET_KEYS.every((key) =>
		densityPresetTokenEqual(key, form[key], preset[key]),
	)
}

function inferDensityFromForm(): DensityMode {
	for (const id of DENSITY_PRESET_IDS) {
		if (densityPresetMatches(id)) return id
	}
	return "custom"
}

function normalizeDensityMode(raw: unknown): DensityMode {
	const s = String(raw ?? "").trim()
	if (s === "compact" || s === "default" || s === "comfortable" || s === "custom") return s
	return DEFAULTS.density as DensityMode
}

function applyDensityPreset(presetId: DensityPresetId) {
	suppressDensityAuto.value = true
	try {
		form.density = presetId
		const preset = DENSITY_PRESETS[presetId]
		for (const key of DENSITY_PRESET_KEYS) form[key] = preset[key]
	} finally {
		suppressDensityAuto.value = false
	}
}

function parseBodySizePx(raw: string): number {
	const b = parseFloat(raw)
	return Number.isFinite(b) ? b : 14
}

function applyAutoTextScale() {
	const b = parseBodySizePx(form.font_size)
	form.text_xs = `${Math.round((b * 12) / 14)}px`
	form.text_sm = `${Math.round((b * 13) / 14)}px`
	form.text_lg = `${Math.round((b * 16) / 14)}px`
}

function setTextScaleAuto(auto: boolean) {
	form.text_scale_mode = auto ? "auto" : "manual"
}

const textScaleSummary = computed(() => {
	if (form.text_scale_mode === "auto") {
		const b = parseBodySizePx(form.font_size)
		return `Small ${Math.round((b * 12) / 14)}px · Labels ${Math.round((b * 13) / 14)}px · Titles ${Math.round((b * 16) / 14)}px`
	}
	const xs = form.text_xs || DEFAULTS.text_xs
	const sm = form.text_sm || DEFAULTS.text_sm
	const lg = form.text_lg || DEFAULTS.text_lg
	return `Small ${xs} · Labels ${sm} · Titles ${lg}`
})

function applyPayloadToForm(payload: Record<string, any>) {
	suppressTextScaleAuto.value = true
	suppressDensityAuto.value = true
	try {
		for (const key of ALL_FIELDS) form[key] = DEFAULTS[key]
		for (const key of ALL_FIELDS) {
			if (key === "theme_name") continue
			const val = payload[key]
			if (val !== undefined && val !== null) form[key] = String(val)
		}
		if (form.text_scale_mode !== "auto" && form.text_scale_mode !== "manual") {
			form.text_scale_mode = DEFAULTS.text_scale_mode
		}
		const hadDensity =
			payload.density !== undefined && payload.density !== null && String(payload.density).trim() !== ""
		form.density = hadDensity ? normalizeDensityMode(form.density) : inferDensityFromForm()
	} finally {
		suppressTextScaleAuto.value = false
		suppressDensityAuto.value = false
	}
}

watch(
	() => form.font_size,
	() => {
		if (suppressTextScaleAuto.value) return
		if (form.text_scale_mode === "auto") applyAutoTextScale()
	},
)

watch(
	() => form.text_scale_mode,
	(mode) => {
		if (suppressTextScaleAuto.value) return
		if (mode === "auto") applyAutoTextScale()
	},
)

watch(
	() => DENSITY_PRESET_KEYS.map((key) => form[key]),
	() => {
		if (suppressDensityAuto.value) return
		const mode = form.density
		if (mode === "compact" || mode === "default" || mode === "comfortable") {
			if (!densityPresetMatches(mode)) form.density = "custom"
		}
	},
)

// ─── AGENT:theme-management ─── useThemeManagement (dialogs, permissions, CRUD; shared with web page)

const manager = useThemeManagement(
	{
		list: "themes.api.list_desk_themes",
		getEditor: "themes.api.get_desk_theme_editor",
		save: "themes.api.save_desk_theme",
		rename: "themes.api.rename_desk_theme",
		delete: "themes.api.delete_desk_theme",
		create: "themes.api.create_desk_theme",
		basePayload: "themes.api.get_base_desk_theme_payload",
		saveAsBase: "themes.api.save_as_base_desk_theme",
		getLastSelection: "themes.api.get_editor_desk_theme_selection",
		setLastSelection: "themes.api.set_editor_desk_theme_selection",
	},
	{
		applyPayloadToForm,
		buildPayloadFromForm,
		canonicalPayload,
		applyLiveThemeVars: () => applyDeskThemeVars(computeCSSVariables()),
		selectionStorageKey: "nce-themes-editor-desk-theme",
		pickInitialTheme: (data) =>
			(data.find((t) => t.is_default_theme || t.is_base_theme)?.name as string | undefined) ||
			(data.find((t) => t.is_active)?.name as string | undefined) ||
			(data[0]?.name as string | undefined),
		defaultSavedStatus: "Inactive",
		notFoundMessage: "Desk theme not found.",
		loadErrorMessage:
			"Could not load desk themes. Check System Manager permissions and that migrate has run.",
		onEditorLoaded: (data) => {
			if (data.theme_name) form.theme_name = data.theme_name as string
		},
	},
	{
		noun: "desk theme",
		untitledName: "Desk Theme",
		hasDefaultTheme: true,
		setBaseUrl: "themes.api.set_base_desk_theme",
		themeOptionLabel,
		switchConfirmMessage: () => "Save your changes before switching desk themes?",
		pickAfterDelete: (themes) =>
			themes.find((t) => t.is_active)?.name ||
			themes.find((t) => t.is_default_theme || t.is_base_theme)?.name ||
			themes[0]?.name,
	},
)

const {
	loadingTheme,
	editorLoaded,
	editorError,
	switchError,
	listLoadError,
	editingTheme,
	siteBaseTheme,
	editorMeta,
	isDirty,
	themesList,
	confirmDialog,
	saveAsDialog,
	renameDialog,
	deleteDialog,
	systemTab,
	canSaveAsDefaultTheme,
	openConfirmDialog,
	closeConfirmDialog,
	confirmSaveAndContinue,
	confirmDiscardAndContinue,
	closeSaveAsDialog,
	submitSaveAs,
	closeRenameDialog,
	submitRename,
	closeDeleteDialog,
	submitDelete,
	restoreToBaseConfirmed,
	saveAsBaseTheme,
	tryLoadThemeFromQuery,
} = manager

function requestRestoreToBase() {
	if (!siteBaseTheme.value || editingTheme.value === siteBaseTheme.value) return
	if (isDirty.value) {
		openConfirmDialog("restore")
		return
	}
	restoreToBaseConfirmed()
}

async function submitSaveAsBaseTheme() {
	if (!canSaveAsDefaultTheme.value || !systemTab.password) return
	try {
		await saveAsBaseTheme()
	} catch {
		/* shown in systemTab.error */
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

const route = useRoute()

// Deep link: ?theme= and ?field= open the tab and scroll to that colour field.
let queryHighlightDone = false

function editorShowsQueryTheme(): boolean {
	const want = String(route.query.theme || "").trim().toLowerCase()
	if (!want) return true
	return (
		editorMeta.theme.toLowerCase() === want ||
		String(editorMeta.slug || "").toLowerCase() === want
	)
}

async function scrollToQueryField() {
	const fieldKey = String(route.query.field || "").trim()
	const loc = locateDeskField(fieldKey)
	if (!loc) return
	activeTab.value = loc.tab
	await nextTick()
	const el = document.getElementById(`desk-field-${fieldKey}`)
	if (!el) return
	el.scrollIntoView({ behavior: "smooth", block: "center" })
	const ring = "var(--nce-color-primary, #2563eb)"
	el.animate(
		[
			{ boxShadow: `0 0 0 3px ${ring}`, offset: 0 },
			{ boxShadow: `0 0 0 3px ${ring}`, offset: 0.7 },
			{ boxShadow: `0 0 0 3px transparent`, offset: 1 },
		],
		{ duration: 2500, delay: 400, easing: "ease-out" },
	)
}

watch(
	[editorLoaded, () => editorMeta.theme, () => editorMeta.slug],
	() => {
		if (queryHighlightDone || !editorLoaded.value) return
		if (!route.query.field) return
		if (!editorShowsQueryTheme()) return
		queryHighlightDone = true
		void scrollToQueryField()
	},
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

.editor-tab-idle {
	color: var(--nce-color-text, #374151);
}

.editor-tab-idle:hover {
	color: var(--nce-color-text, #374151);
}
.editor-header {
	margin-bottom: 1.25rem;
}
.editor-header :deep(.editor-title) {
	font-size: calc(var(--nce-font-size, 14px) * 1.375);
	font-weight: 600;
	color: var(--nce-color-heading, #111827);
}
.editor-header :deep(.editor-subtitle) {
	font-size: calc(var(--nce-font-size, 14px) * 0.875);
	color: var(--nce-color-text, #374151);
}
.editor-header :deep(.editor-status-label),
.editor-header :deep(.editor-status-option),
.editor-header :deep(.editor-status-hint) {
	font-size: calc(var(--nce-font-size, 14px) * 0.875);
}
.editor-header :deep(.editor-status-hint-warn),
.editor-header :deep(.editor-warn) {
	color: var(--nce-color-warning, #d97706);
}
.editor-header :deep(.editor-muted) {
	color: var(--nce-color-text, #374151);
}
.editor-header :deep(.theme-select) {
	flex: 1 1 auto;
	max-width: 26rem;
	width: 100%;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	padding: 0.5625rem 2.5rem 0.5625rem 0.875rem;
	font-size: 14px;
}
</style>
