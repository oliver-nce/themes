<template>
	<div class="max-w-6xl mx-auto px-6 py-4">
		<!-- Header -->
		<div class="editor-header editor-panel">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<h1 class="editor-title">Theme Editor</h1>
					<p class="editor-subtitle mt-0.5">
						Editing <strong>{{ editorMeta.theme_name || "—" }}</strong>
						<span v-if="editingTheme && siteBaseTheme && editingTheme !== siteBaseTheme" class="editor-warn">
							· not the site base theme
						</span>
						<span v-if="siteBaseThemeName" class="editor-muted">
							· Site base: <strong>{{ siteBaseThemeName }}</strong>
						</span>
					</p>
					<div
						v-if="editorLoaded"
						class="editor-status-row mt-2 flex flex-wrap items-center gap-x-4 gap-y-1"
					>
						<span class="editor-status-label">For panels:</span>
						<label class="editor-status-option">
							<input
								type="radio"
								name="theme-availability"
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
								name="theme-availability"
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
							Restore to Base Theme
						</Button>
						<Button
							variant="solid"
							class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							:disabled="loadingTheme"
							@click="openSaveAsDialog"
						>
							Save as new theme
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

		<!-- Loading -->
		<div v-if="editorResource.loading" class="py-12 text-center text-gray-400 text-sm">
			Loading theme editor…
		</div>

		<!-- Error -->
		<div
			v-else-if="editorError"
			class="py-12 text-center text-red-600 text-sm"
		>
			{{ editorError }}
		</div>

		<!-- Main content -->
		<template v-else-if="editorLoaded">
			<!-- Tab bar -->
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

			<!-- ==================== COLORS TAB ==================== -->
			<div v-show="activeTab === 'colors'" class="editor-tab">
				<EditorSection title="Brand Colours">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<BrandColorPicker
							v-for="c in brandColors"
							:key="c.key"
							:label="c.label"
							:model-value="form[c.key]"
							:gamma="form[c.gammaKey]"
							:saturation="form[c.satKey]"
							@update:model-value="form[c.key] = $event"
							@update:gamma="form[c.gammaKey] = $event"
							@update:saturation="form[c.satKey] = $event"
							show-shades
						/>
					</div>
				</EditorSection>

				<EditorSection
					title="Status Colours"
					hint="Standard success, info, warning, and danger colours. Pick from primary, secondary, or gray swatches to override."
					collapsible
					:default-open="true"
				>
					<template #actions>
						<Button
							variant="solid"
							class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							@click="applyStatusColorDefaults"
						>
							Use defaults
						</Button>
					</template>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<SwatchPicker
							v-for="c in statusColors"
							:key="c.key"
							:label="c.label"
							:model-value="form[c.key]"
							:default-value="DEFAULTS[c.key]"
							@update:model-value="form[c.key] = $event"
							:primary-color="form.primary_color"
							:secondary-color="form.secondary_color"
							:primary-gamma="form.primary_color_gamma"
							:primary-saturation="form.primary_color_saturation"
							:secondary-gamma="form.secondary_color_gamma"
							:secondary-saturation="form.secondary_color_saturation"
						/>
					</div>
				</EditorSection>

				<EditorSection title="Text Colours">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<SwatchPicker
							v-for="c in textColors"
							:key="c.key"
							:label="c.label"
							:model-value="form[c.key]"
							:default-value="DEFAULTS[c.key]"
							@update:model-value="form[c.key] = $event"
							:primary-color="form.primary_color"
							:secondary-color="form.secondary_color"
							:primary-gamma="form.primary_color_gamma"
							:primary-saturation="form.primary_color_saturation"
							:secondary-gamma="form.secondary_color_gamma"
							:secondary-saturation="form.secondary_color_saturation"
						/>
					</div>
				</EditorSection>

				<EditorSection title="Surfaces">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<SwatchPicker
							v-for="c in surfaceColors"
							:key="c.key"
							:label="c.label"
							:model-value="form[c.key]"
							:default-value="DEFAULTS[c.key]"
							@update:model-value="form[c.key] = $event"
							:primary-color="form.primary_color"
							:secondary-color="form.secondary_color"
							:primary-gamma="form.primary_color_gamma"
							:primary-saturation="form.primary_color_saturation"
							:secondary-gamma="form.secondary_color_gamma"
							:secondary-saturation="form.secondary_color_saturation"
						/>
					</div>
				</EditorSection>
			</div>

			<!-- ==================== TYPOGRAPHY TAB ==================== -->
			<div v-show="activeTab === 'typography'" class="editor-tab">
				<EditorSection title="Fonts">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FontSelectField
							label="Body Font"
							:options="fontOptions"
							v-model="form.font_family"
						/>
						<FontSelectField
							label="Heading Font"
							:options="fontOptions"
							v-model="form.heading_font_family"
						/>
					</div>

					<div class="mt-4 rounded-lg border border-gray-200 p-5 bg-white">
						<p
							class="text-2xl font-semibold mb-1"
							:style="{ fontFamily: fontCSS(form.heading_font_family) }"
						>
							The quick brown fox jumps over the lazy dog
						</p>
						<p
							class="text-base text-gray-600"
							:style="{
								fontFamily: fontCSS(form.font_family),
								fontSize: form.font_size || '14px',
								lineHeight: lineHeightCSS,
								fontWeight: form.font_weight_body || '400',
							}"
						>
							Pack my box with five dozen liquor jugs. How vexingly quick
							daft zebras jump! The five boxing wizards jump quickly.
						</p>
					</div>
				</EditorSection>

				<EditorSection title="Size &amp; Weight">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<SelectField
							label="Base Font Size"
							:options="sizeOptions"
							v-model="form.font_size"
						/>
						<SelectField
							label="Line Height"
							:options="lineHeightOptions"
							v-model="form.line_height"
						/>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1.5">
								Body Weight
								<span class="font-normal text-gray-500">({{ bodyWeightDisplay }})</span>
							</label>
							<input
								type="range"
								class="body-weight-slider w-full"
								min="100"
								max="900"
								step="1"
								:value="bodyWeightNumber"
								@input="onBodyWeightInput"
							/>
							<div class="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
								<span>100</span>
								<span>400</span>
								<span>700</span>
								<span>900</span>
							</div>
						</div>
					</div>
				</EditorSection>
			</div>

			<!-- ==================== LAYOUT TAB ==================== -->
			<div v-show="activeTab === 'layout'" class="editor-tab">
				<EditorSection title="Corners">
					<div class="flex flex-wrap gap-3">
						<div
							v-for="r in radiusOptions"
							:key="r"
							class="w-16 h-16 border-2 cursor-pointer transition-all"
							:class="form.border_radius === r ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'"
							:style="{ borderRadius: radiusMap[r] }"
							@click="form.border_radius = r"
						>
							<span class="flex items-center justify-center h-full text-xs text-gray-500 font-medium">{{ r }}</span>
						</div>
					</div>
				</EditorSection>

				<EditorSection title="Spacing &amp; Shadows">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<SelectField
							label="Spacing Scale"
							:options="spacingOptions"
							v-model="form.spacing_scale"
						/>
						<SelectField
							label="Shadow Depth"
							:options="shadowOptions"
							v-model="form.shadow"
						/>
						<SwatchPicker
							label="Shadow Color"
							:model-value="form.shadow_color"
							:default-value="DEFAULTS.shadow_color"
							@update:model-value="form.shadow_color = $event"
							:primary-color="form.primary_color"
							:secondary-color="form.secondary_color"
							:primary-gamma="form.primary_color_gamma"
							:primary-saturation="form.primary_color_saturation"
							:secondary-gamma="form.secondary_color_gamma"
							:secondary-saturation="form.secondary_color_saturation"
						/>
					</div>
				</EditorSection>

				<EditorSection title="Dimensions">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<SelectField
							label="Sidebar Width"
							:options="sidebarOptions"
							v-model="form.sidebar_width"
						/>
						<SelectField
							label="Container Max Width"
							:options="containerOptions"
							v-model="form.container_max_width"
						/>
						<SelectField
							label="Transition Speed"
							:options="transitionOptions"
							v-model="form.transition_speed"
						/>
					</div>
				</EditorSection>

				<EditorSection title="Dark Mode">
					<div class="flex items-center gap-3">
						<input
							type="checkbox"
							id="dark_mode"
							v-model="form.dark_mode"
							class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<label for="dark_mode" class="text-sm font-medium text-gray-700">
							Enable Dark Mode
						</label>
					</div>
				</EditorSection>
			</div>

			<!-- ==================== ADVANCED TAB ==================== -->
			<div v-show="activeTab === 'advanced'" class="editor-tab">
				<EditorSection title="Custom CSS">
					<textarea
						v-model="form.custom_css"
						class="w-full font-mono text-sm border border-gray-200 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						rows="8"
						placeholder="/* Your custom CSS rules */"
					/>
				</EditorSection>

				<EditorSection
					title="Extra CSS Variables (JSON)"
					hint="Each key becomes --nce-{key} in the stylesheet."
				>
					<textarea
						v-model="form.tailwind_overrides"
						class="w-full font-mono text-sm border border-gray-200 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						rows="5"
						placeholder='{ "my-var": "value" }'
					/>
				</EditorSection>

				<EditorSection title="Published CSS">
					<p v-if="editorMeta.is_base_theme && editorMeta.css_hash" class="text-sm text-gray-600">
						Site base theme published to <code>nce_theme.css</code>
						(hash: {{ editorMeta.css_hash }})
					</p>
					<p v-else-if="editorMeta.is_base_theme" class="text-sm text-gray-400">
						Save to publish CSS to the site
					</p>
					<p v-else class="text-sm text-gray-500">
						Saving updates this theme only. Active themes are included in the shared CSS file.
					</p>
				</EditorSection>
			</div>

			<!-- ==================== SYSTEM TAB ==================== -->
			<div v-show="activeTab === 'system'" class="editor-tab">
				<EditorSection
					title="Save as base theme"
					hint="Rare release action: sets the site base theme, rebuilds CSS, and writes bundled files into the app for new installs. Commit and push after running."
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
						Save as base theme
					</Button>
				</EditorSection>
			</div>
		</template>

		<!-- Unsaved changes prompt -->
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
						<Button
							variant="solid"
							class="bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							@click="closeConfirmDialog"
						>
							Cancel
						</Button>
						<Button
							variant="solid"
							class="bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							@click="confirmDiscardAndContinue"
						>
							Discard changes
						</Button>
						<Button
							variant="solid"
							class="bg-primary text-primary-fg border border-primary"
							:loading="confirmDialog.busy"
							@click="confirmSaveAndContinue"
						>
							Save &amp; continue
						</Button>
					</div>
				</div>
			</div>

			<div
				v-if="saveAsDialog.open"
				class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
				@click.self="closeSaveAsDialog"
			>
				<div class="bg-white rounded-lg shadow-xl p-5 max-w-md w-full">
					<h3 class="text-base font-semibold text-gray-900">Save as new theme</h3>
					<p class="text-sm text-gray-600 mt-2">Create a new theme from the current settings.</p>
					<input
						v-model="saveAsDialog.name"
						type="text"
						class="mt-3 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
						placeholder="Theme name"
						@keyup.enter="submitSaveAs"
					/>
					<p v-if="saveAsDialog.error" class="text-sm text-red-600 mt-2">{{ saveAsDialog.error }}</p>
					<div class="flex gap-2 justify-end mt-4">
						<Button
							variant="solid"
							class="bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							@click="closeSaveAsDialog"
						>
							Cancel
						</Button>
						<Button
							variant="solid"
							class="bg-primary text-primary-fg border border-primary"
							:loading="saveAsDialog.busy"
							@click="submitSaveAs"
						>
							Create theme
						</Button>
					</div>
				</div>
			</div>

			<div
				v-if="renameDialog.open"
				class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
				@click.self="closeRenameDialog"
			>
				<div class="bg-white rounded-lg shadow-xl p-5 max-w-md w-full">
					<h3 class="text-base font-semibold text-gray-900">Rename theme</h3>
					<p class="text-sm text-gray-600 mt-2">Only inactive themes that are not the site base can be renamed.</p>
					<input
						v-model="renameDialog.name"
						type="text"
						class="mt-3 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
						placeholder="Theme name"
						@keyup.enter="submitRename"
					/>
					<p v-if="renameDialog.error" class="text-sm text-red-600 mt-2">{{ renameDialog.error }}</p>
					<div class="flex gap-2 justify-end mt-4">
						<Button
							variant="solid"
							class="bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							@click="closeRenameDialog"
						>
							Cancel
						</Button>
						<Button
							variant="solid"
							class="bg-primary text-primary-fg border border-primary"
							:loading="renameDialog.busy"
							@click="submitRename"
						>
							Rename
						</Button>
					</div>
				</div>
			</div>

			<div
				v-if="deleteDialog.open"
				class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
				@click.self="closeDeleteDialog"
			>
				<div class="bg-white rounded-lg shadow-xl p-5 max-w-md w-full">
					<h3 class="text-base font-semibold text-gray-900">Delete theme</h3>
					<p class="text-sm text-gray-600 mt-2">
						Delete <strong>{{ editorMeta.theme_name }}</strong>? This cannot be undone.
					</p>
					<p v-if="deleteDialog.error" class="text-sm text-red-600 mt-2">{{ deleteDialog.error }}</p>
					<div class="flex gap-2 justify-end mt-4">
						<Button
							variant="solid"
							class="bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							@click="closeDeleteDialog"
						>
							Cancel
						</Button>
						<Button
							variant="solid"
							class="bg-primary text-primary-fg border border-primary"
							:loading="deleteDialog.busy"
							@click="submitDelete"
						>
							Delete
						</Button>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onUnmounted, nextTick } from "vue"
import { createResource } from "frappe-ui"
import { generateShades, effectiveRoleHex, pickFgMono, pickFgTonal, isDark, type ColorShade } from "@/utils/color-shades"
import { STATUS_COLOR_DEFAULTS, STATUS_COLOR_KEYS } from "@/composables/useThemeDefaults"
import EditorSection from "@/components/EditorSection.vue"
import BrandColorPicker from "@/components/BrandColorPicker.vue"
import SelectField from "@/components/SelectField.vue"
import FontSelectField from "@/components/FontSelectField.vue"
import SwatchPicker from "@/components/SwatchPicker.vue"

// ─── Preview window ───────────────────────────────────────────────

let previewWin: Window | null = null

function openPreview() {
	if (previewWin && !previewWin.closed) {
		previewWin.focus()
		pushToPreview()
		return
	}
	previewWin = window.open(
		"/themes/preview",
		"themes-preview",
		"width=1200,height=900,scrollbars=yes",
	)
	if (previewWin) {
		previewWin.addEventListener("load", () => pushToPreview())
	}
}

const COLOR_VAR_MAP: Record<string, string> = {
	primary_color: "--nce-color-primary",
	secondary_color: "--nce-color-secondary",
	accent_color: "--nce-color-accent",
	success_color: "--nce-color-success",
	info_color: "--nce-color-info",
	warning_color: "--nce-color-warning",
	danger_color: "--nce-color-danger",
	text_color: "--nce-color-text",
	heading_color: "--nce-color-heading",
	muted_color: "--nce-color-muted",
	link_color: "--nce-color-link",
	focus_color: "--nce-color-focus",
	background_color: "--nce-color-bg",
	surface_color: "--nce-color-surface",
	border_color: "--nce-color-border",
	row_alt_color: "--nce-color-row-alt",
}

const BORDER_RADIUS_CSS: Record<string, string> = {
	none: "0", sm: "0.125rem", md: "0.375rem", lg: "0.5rem", "x-lg": "0.75rem", full: "0.75rem",
}

const SHADOW_DEFS: Record<string, Array<[number,number,number,number,number]>> = {
	none: [],
	sm: [[0,1,3,0,0.12],[0,1,2,-1,0.08]],
	md: [[0,4,8,-1,0.15],[0,2,4,-2,0.1]],
	lg: [[0,10,20,-3,0.18],[0,4,8,-4,0.1]],
	xl: [[0,20,30,-5,0.22],[0,8,12,-6,0.12]],
	"2xl": [[0,25,50,-12,0.3]],
	"3xl": [[0,35,60,-15,0.35]],
}

function hexToRgb(hex: string): string {
	if (!hex || hex.length < 7) return "0,0,0"
	const r = parseInt(hex.slice(1,3), 16)
	const g = parseInt(hex.slice(3,5), 16)
	const b = parseInt(hex.slice(5,7), 16)
	return `${r},${g},${b}`
}

function buildShadow(level: string, color: string): string {
	const defs = SHADOW_DEFS[level] || SHADOW_DEFS.md
	if (!defs.length) return "none"
	const rgb = hexToRgb(color)
	return defs.map(([x,y,b,s,a]) => `${x}px ${y}px ${b}px ${s}px rgba(${rgb},${a})`).join(", ")
}

const TRANSITION_CSS: Record<string, string> = { fast: "150ms", normal: "200ms", slow: "300ms" }
const LINE_HEIGHT_CSS: Record<string, string> = { tight: "1.25", snug: "1.375", normal: "1.5", relaxed: "1.625", loose: "2" }

const GAMMA_SAT_COLOR_FIELDS = new Set(["primary_color", "secondary_color"])

function computeCSSVariables(): Record<string, string> {
	const vars: Record<string, string> = {}
	for (const [field, cssVar] of Object.entries(COLOR_VAR_MAP)) {
		const hex = form[field as FormKey]
		if (!hex) continue
		if (GAMMA_SAT_COLOR_FIELDS.has(field)) {
			const gamma = form[`${field}_gamma` as FormKey] ?? 0
			const saturation = form[`${field}_saturation` as FormKey] ?? 100
			vars[cssVar] = effectiveRoleHex(hex, Number(gamma), Number(saturation))
		} else {
			vars[cssVar] = hex
		}
	}
	const ff = form.font_family
	if (ff) vars["--nce-font-family"] = fontCSS(ff)

	const hf = form.heading_font_family
	if (hf) vars["--nce-font-heading"] = fontCSS(hf)

	if (form.font_size) vars["--nce-font-size"] = form.font_size
	if (form.font_weight_body) vars["--nce-font-weight"] = form.font_weight_body
	if (form.line_height) vars["--nce-line-height"] = LINE_HEIGHT_CSS[form.line_height] || "1.5"
	if (form.border_radius) vars["--nce-border-radius"] = BORDER_RADIUS_CSS[form.border_radius] || "0.375rem"
	if (form.spacing_scale) {
		const m: Record<string, string> = { tight: "0.75rem", normal: "1rem", relaxed: "1.5rem" }
		vars["--nce-spacing-base"] = m[form.spacing_scale] || "1rem"
	}
	if (form.shadow_color) vars["--nce-shadow-color"] = form.shadow_color
	if (form.shadow) vars["--nce-shadow"] = buildShadow(form.shadow, form.shadow_color || "#000000")
	if (form.transition_speed) vars["--nce-transition-speed"] = TRANSITION_CSS[form.transition_speed] || "200ms"
	if (form.sidebar_width) vars["--nce-sidebar-width"] = form.sidebar_width
	if (form.container_max_width) {
		vars["--nce-container-max-width"] = form.container_max_width === "full" ? "100%" : form.container_max_width
	}
	// Shade scales for brand/status colors (live preview)
	const SHADE_FIELDS: Array<[string, string]> = [
		["primary_color", "color-primary"],
		["secondary_color", "color-secondary"],
		["accent_color", "color-accent"],
		["success_color", "color-success"],
		["info_color", "color-info"],
		["warning_color", "color-warning"],
		["danger_color", "color-danger"],
	]
	for (const [field, varPrefix] of SHADE_FIELDS) {
		const hex = form[field as FormKey]
		if (!hex) continue
		const gammaKey = `${field}_gamma` as FormKey
		const satKey = `${field}_saturation` as FormKey
		const hasAdjust = GAMMA_SAT_COLOR_FIELDS.has(field)
		const gamma = hasAdjust ? Number(form[gammaKey] ?? 0) : 0
		const saturation = hasAdjust ? Number(form[satKey] ?? 100) : 100
		const roleHex = hasAdjust ? effectiveRoleHex(hex, gamma, saturation) : hex
		vars[`--nce-${varPrefix}-fg`] = pickFgMono(roleHex)
		vars[`--nce-${varPrefix}-fg-tonal`] = pickFgTonal(roleHex)
		const shades = generateShades(hex, hasAdjust ? { gamma, saturation } : undefined)
		for (const s of shades) {
			vars[`--nce-${varPrefix}-${s.shade}`] = s.hex
			vars[`--${varPrefix}-${s.shade}`] = s.hex
			if ([100, 200, 300, 500, 600, 700, 900].includes(s.shade)) {
				vars[`--nce-${varPrefix}-${s.shade}-fg`] = pickFgMono(s.hex)
				vars[`--nce-${varPrefix}-${s.shade}-fg-tonal`] = pickFgTonal(s.hex)
			}
		}
	}
	return vars
}

function pushToPreview() {
	if (!previewWin || previewWin.closed) return
	previewWin.postMessage({ type: "nce-theme-update", variables: computeCSSVariables() }, "*")
}

onUnmounted(() => {
	if (previewWin && !previewWin.closed) previewWin.close()
})

// ─── State ────────────────────────────────────────────────────────

const activeTab = ref("colors")

const tabs = [
	{ id: "colors", label: "Colours" },
	{ id: "typography", label: "Typography" },
	{ id: "layout", label: "Layout" },
	{ id: "advanced", label: "Advanced" },
	{ id: "system", label: "System" },
]

const ALL_FIELDS = [
	"theme_name",
	"primary_color",
	"primary_color_gamma",
	"primary_color_saturation",
	"secondary_color",
	"secondary_color_gamma",
	"secondary_color_saturation",
	"accent_color",
	"success_color",
	"info_color",
	"warning_color",
	"danger_color",
	"text_color",
	"heading_color",
	"muted_color",
	"link_color",
	"focus_color",
	"background_color",
	"surface_color",
	"border_color",
	"row_alt_color",
	"font_family",
	"heading_font_family",
	"font_size",
	"line_height",
	"font_weight_body",
	"border_radius",
	"spacing_scale",
	"shadow",
	"shadow_color",
	"sidebar_width",
	"container_max_width",
	"transition_speed",
	"dark_mode",
	"custom_css",
	"tailwind_overrides",
] as const

const PAYLOAD_FIELDS = ALL_FIELDS.filter((k) => k !== "theme_name")

type FormKey = (typeof ALL_FIELDS)[number]

const DEFAULTS: Record<FormKey, any> = {
	theme_name: "Default",
	primary_color: "#3B82F6",
	primary_color_gamma: 0,
	primary_color_saturation: 100,
	secondary_color: "#10B981",
	secondary_color_gamma: 0,
	secondary_color_saturation: 100,
	...STATUS_COLOR_DEFAULTS,
	text_color: "#1F2937",
	heading_color: "#111827",
	muted_color: "#6B7280",
	link_color: "#3B82F6",
	focus_color: "#3B82F6",
	background_color: "#FFFFFF",
	surface_color: "#F9FAFB",
	border_color: "#E5E7EB",
	row_alt_color: "#F3F4F6",
	font_family: "Inter",
	heading_font_family: "Inter",
	font_size: "14px",
	line_height: "normal",
	font_weight_body: "400",
	border_radius: "md",
	spacing_scale: "normal",
	shadow: "md",
	shadow_color: "#000000",
	sidebar_width: "240px",
	container_max_width: "1280px",
	transition_speed: "normal",
	dark_mode: false,
	custom_css: "",
	tailwind_overrides: "",
}

const form = reactive<Record<FormKey, any>>({ ...DEFAULTS })

// ─── Colour group definitions ─────────────────────────────────────

const brandColors = [
	{
		key: "primary_color",
		gammaKey: "primary_color_gamma",
		satKey: "primary_color_saturation",
		label: "Primary",
	},
	{
		key: "secondary_color",
		gammaKey: "secondary_color_gamma",
		satKey: "secondary_color_saturation",
		label: "Secondary",
	},
]

const statusColors = [
	{ key: "accent_color", label: "Accent" },
	{ key: "success_color", label: "Success" },
	{ key: "info_color", label: "Info" },
	{ key: "warning_color", label: "Warning" },
	{ key: "danger_color", label: "Danger" },
]

function applyStatusColorDefaults() {
	for (const key of STATUS_COLOR_KEYS) {
		form[key] = STATUS_COLOR_DEFAULTS[key]
	}
}

const textColors = [
	{ key: "text_color", label: "Body Text" },
	{ key: "heading_color", label: "Heading" },
	{ key: "muted_color", label: "Muted" },
	{ key: "link_color", label: "Links" },
	{ key: "focus_color", label: "Focus Ring" },
]

const surfaceColors = [
	{ key: "background_color", label: "Page Background" },
	{ key: "surface_color", label: "Card / Panel" },
	{ key: "border_color", label: "Borders" },
	{ key: "row_alt_color", label: "Alternate Row" },
]

// ─── Select options ───────────────────────────────────────────────

// Retired picker options — map to Public Sans when loading saved themes.
const RETIRED_FONT_ALIASES: Record<string, string> = {
	"Work Sans": "Public Sans",
	"DM Sans": "Public Sans",
}

function normalizeFontChoice(name: string): string {
	return RETIRED_FONT_ALIASES[name] || name
}

// Curated self-hosted variable fonts (all respond to the Body Weight slider).
// Must stay in sync with FONT_REGISTRY in themes/utils/css_writer.py.
const fontOptions = [
	"Inter",
	"Source Sans 3",
	"Public Sans",
	"Open Sans",
	"Roboto",
	"Nunito",
	"Source Serif 4",
	"JetBrains Mono",
	"System Default",
]
const sizeOptions = ["12px", "13px", "14px", "15px", "16px", "18px"]
const lineHeightOptions = ["tight", "snug", "normal", "relaxed", "loose"]
const BODY_WEIGHT_MIN = 100
const BODY_WEIGHT_MAX = 900

function clampBodyWeight(raw: unknown): number {
	const n = Number.parseInt(String(raw ?? "400"), 10)
	if (!Number.isFinite(n)) return 400
	return Math.min(BODY_WEIGHT_MAX, Math.max(BODY_WEIGHT_MIN, n))
}

const bodyWeightNumber = computed(() => clampBodyWeight(form.font_weight_body))

const bodyWeightDisplay = computed(() => {
	const n = bodyWeightNumber.value
	if (n <= 350) return `${n} — Light`
	if (n <= 450) return `${n} — Regular`
	if (n <= 550) return `${n} — Medium`
	if (n <= 650) return `${n} — Semi-bold`
	return `${n} — Bold`
})

function onBodyWeightInput(e: Event) {
	form.font_weight_body = String((e.target as HTMLInputElement).value)
}
const radiusOptions = ["none", "sm", "md", "lg", "x-lg"]
const spacingOptions = ["tight", "normal", "relaxed"]
const shadowOptions = ["none", "sm", "md", "lg", "xl", "2xl", "3xl"]
const sidebarOptions = ["200px", "220px", "240px", "260px", "280px"]
const containerOptions = ["960px", "1024px", "1152px", "1280px", "1440px", "full"]
const transitionOptions = ["fast", "normal", "slow"]

const radiusMap: Record<string, string> = {
	none: "0",
	sm: "0.125rem",
	md: "0.375rem",
	lg: "0.5rem",
	"x-lg": "0.75rem",
	full: "0.75rem",
}

const lineHeightMap: Record<string, string> = {
	tight: "1.25",
	snug: "1.375",
	normal: "1.5",
	relaxed: "1.625",
	loose: "2",
}

// ─── Computed helpers ─────────────────────────────────────────────

const FONT_GENERIC: Record<string, string> = {
	Inter: "sans-serif",
	"Source Sans 3": "sans-serif",
	"Public Sans": "sans-serif",
	"Open Sans": "sans-serif",
	Roboto: "sans-serif",
	Nunito: "sans-serif",
	"Source Serif 4": "serif",
	"JetBrains Mono": "monospace",
}

function fontCSS(name: string): string {
	if (!name || name === "System Default") {
		return "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
	}
	return `'${name}', ${FONT_GENERIC[name] || "sans-serif"}`
}

const lineHeightCSS = computed(
	() => lineHeightMap[form.line_height] || "1.5",
)

// ─── Data fetching ────────────────────────────────────────────────

type ThemeAvailabilityStatus = "Active" | "Inactive"

const saving = ref(false)
const statusSaving = ref(false)
const loadingTheme = ref(false)
const savedThemeStatus = ref<ThemeAvailabilityStatus>("Active")
const editorLoaded = ref(false)
const editorError = ref("")
const switchError = ref("")
const selectedTheme = ref("")
const editingTheme = ref("")
const siteBaseTheme = ref("")
const savedSnapshot = ref<Record<string, any>>({})
const dirtyBaselineReady = ref(false)

const editorMeta = reactive({
	theme: "",
	theme_name: "",
	css_hash: "",
	is_base_theme: false,
})

const confirmDialog = reactive({
	open: false,
	title: "",
	message: "",
	action: "" as "" | "switch" | "restore",
	pendingTheme: "",
	busy: false,
})

const saveAsDialog = reactive({
	open: false,
	name: "",
	error: "",
	busy: false,
})

const renameDialog = reactive({
	open: false,
	name: "",
	error: "",
	busy: false,
})

const deleteDialog = reactive({
	open: false,
	error: "",
	busy: false,
})

const systemTab = reactive({
	password: "",
	error: "",
	success: "",
	busy: false,
})

const siteBaseThemeName = computed(() => {
	const row = themesList.data?.find((t: any) => t.name === siteBaseTheme.value)
	return row?.theme_name || siteBaseTheme.value || ""
})

function themeOptionLabel(t: { theme_name: string; is_base_theme?: boolean; is_active?: boolean }) {
	const isBase = t.is_base_theme ?? t.is_active
	return isBase ? `${t.theme_name} · site base` : t.theme_name
}

const themeSelectWidth = computed(() => {
	const labels = (themesList.data || []).map((t: any) => themeOptionLabel(t))
	const chars = Math.max(20, ...labels.map((l: string) => l.length), 0)
	return `${Math.min(Math.max(chars * 0.62, 14), 26)}rem`
})

function buildPayloadFromForm(): Record<string, any> {
	const payload: Record<string, any> = {}
	for (const key of PAYLOAD_FIELDS) {
		payload[key] = key === "dark_mode" ? (form[key] ? 1 : 0) : form[key]
	}
	for (const field of GAMMA_SAT_COLOR_FIELDS) {
		const hex = payload[field]
		const gamma = Number(payload[`${field}_gamma`] ?? 0)
		const saturation = Number(payload[`${field}_saturation`] ?? 100)
		if (typeof hex === "string" && (gamma !== 0 || saturation !== 100)) {
			payload[field] = effectiveRoleHex(hex, gamma, saturation)
		}
	}
	return payload
}

function canonicalPayload(source: Record<string, any>): Record<string, any> {
	const payload: Record<string, any> = {}
	for (const key of PAYLOAD_FIELDS) {
		let val = source[key]
		if (val === undefined || val === null) {
			val = DEFAULTS[key as FormKey]
		}
		if (key === "dark_mode") {
			payload[key] = val === true || val === 1 || val === "1" ? 1 : 0
		} else if (key.endsWith("_gamma")) {
			payload[key] = Number(val) || 0
		} else if (key.endsWith("_saturation")) {
			const n = Number(val)
			payload[key] = Number.isFinite(n) ? n : 100
		} else if (key.endsWith("_color") && typeof val === "string") {
			payload[key] = val.toUpperCase()
		} else if (key === "font_weight_body") {
			payload[key] = String(clampBodyWeight(val ?? DEFAULTS.font_weight_body))
		} else if (key === "custom_css" || key === "tailwind_overrides") {
			payload[key] = String(val ?? "")
		} else {
			payload[key] = val
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
	const current = canonicalPayload(buildPayloadFromForm())
	const saved = canonicalPayload(savedSnapshot.value)
	return JSON.stringify(current) !== JSON.stringify(saved)
})

function normalizeThemeStatus(status: string | undefined | null): ThemeAvailabilityStatus {
	return status === "Active" ? "Active" : "Inactive"
}

const canChangeStatus = computed(
	() =>
		editorLoaded.value &&
		!loadingTheme.value &&
		!saving.value &&
		!statusSaving.value &&
		!isDirty.value,
)

const canRenameOrDelete = computed(
	() =>
		canChangeStatus.value &&
		savedThemeStatus.value === "Inactive" &&
		!editorMeta.is_base_theme,
)

function applyPayloadToForm(payload: Record<string, any>) {
	for (const key of ALL_FIELDS) {
		form[key] = DEFAULTS[key]
	}
	for (const key of ALL_FIELDS) {
		if (key === "theme_name") continue
		const val = payload[key]
		if (key === "dark_mode") {
			form[key] = !!val
		} else if (key === "border_radius" && val === "full") {
			form[key] = "x-lg"
		} else if (
			(key === "font_family" || key === "heading_font_family") &&
			typeof val === "string"
		) {
			form[key] = normalizeFontChoice(val)
		} else if (key === "font_weight_body") {
			form[key] = String(clampBodyWeight(val))
		} else if (val !== undefined && val !== null) {
			form[key] = val
		}
	}
	for (const field of GAMMA_SAT_COLOR_FIELDS) {
		const hex = form[field as FormKey]
		if (typeof hex !== "string") continue
		const gamma = Number(form[`${field}_gamma` as FormKey] ?? 0)
		const saturation = Number(form[`${field}_saturation` as FormKey] ?? 100)
		if (gamma !== 0 || saturation !== 100) {
			form[field as FormKey] = effectiveRoleHex(hex, gamma, saturation)
		}
	}
}

const themesList = createResource({
	url: "themes.api.list_themes",
	auto: true,
	onSuccess(data: any[]) {
		if (!data?.length || editingTheme.value) return
		const base = data.find((t) => t.is_base_theme || t.is_active)?.name || data[0].name
		if (base) loadTheme(base)
	},
})

const editorResource = createResource({
	url: "themes.api.get_theme_editor",
	auto: false,
	async onSuccess(data: any) {
		loadingTheme.value = false
		editorError.value = ""
		switchError.value = ""
		editorLoaded.value = false
		dirtyBaselineReady.value = false
		if (!data) {
			editorError.value = "Theme not found."
			return
		}
		editingTheme.value = data.theme || ""
		selectedTheme.value = data.theme || ""
		siteBaseTheme.value = data.site_base_theme || data.site_active_theme || siteBaseTheme.value
		editorMeta.theme = data.theme || ""
		editorMeta.theme_name = data.theme_name || data.theme || ""
		editorMeta.css_hash = data.css_hash || ""
		editorMeta.is_base_theme = !!(data.is_base_theme ?? data.is_active)
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
		editorError.value =
			err?.message || "Failed to load theme. Check permissions."
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
		// onError sets editorError
	}
}

const saveResource = createResource({
	url: "themes.api.save_theme",
	onSuccess(data: any) {
		if (data?.css_hash) editorMeta.css_hash = data.css_hash
		editorMeta.is_base_theme = !!(data?.is_base_theme ?? data?.is_active)
		if (data?.theme_status) savedThemeStatus.value = normalizeThemeStatus(data.theme_status)
		captureSnapshot()
		themesList.reload()
	},
})

const renameThemeResource = createResource({
	url: "themes.api.rename_theme",
	auto: false,
})

const deleteThemeResource = createResource({
	url: "themes.api.delete_theme",
	auto: false,
})

const createThemeResource = createResource({
	url: "themes.api.create_theme",
	onSuccess(data: any) {
		saveAsDialog.open = false
		saveAsDialog.busy = false
		themesList.reload()
		if (data?.theme) loadTheme(data.theme)
	},
	onError(err: any) {
		saveAsDialog.error = err?.message || "Could not create theme."
		saveAsDialog.busy = false
	},
})

const baseThemePayloadResource = createResource({
	url: "themes.api.get_base_theme_payload",
	auto: false,
})

const saveAsBaseThemeResource = createResource({
	url: "themes.api.save_as_base_theme",
	auto: false,
})

function openConfirmDialog(action: "switch" | "restore", pendingTheme = "") {
	confirmDialog.action = action
	confirmDialog.pendingTheme = pendingTheme
	confirmDialog.title = "Unsaved changes"
	if (action === "switch") {
		const name =
			themesList.data?.find((t: any) => t.name === pendingTheme)?.theme_name || pendingTheme
		confirmDialog.message = `Save your changes before switching to "${name}"?`
	} else {
		confirmDialog.message = "Save your changes before restoring from the base theme?"
	}
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
		if (confirmDialog.action === "switch") {
			await loadTheme(confirmDialog.pendingTheme)
		} else if (confirmDialog.action === "restore") {
			await restoreToBaseConfirmed()
		}
		closeConfirmDialog()
	} catch {
		// keep dialog open
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
		const payload = buildPayloadFromForm()
		await saveResource.submit({ theme: editingTheme.value, payload })
	} catch (err) {
		console.error("Save error:", err)
		throw err
	} finally {
		saving.value = false
	}
}

async function setThemeStatus(next: ThemeAvailabilityStatus) {
	if (!canChangeStatus.value || next === savedThemeStatus.value) return
	statusSaving.value = true
	switchError.value = ""
	try {
		await saveResource.submit({
			theme: editingTheme.value,
			payload: savedSnapshot.value,
			status: next,
		})
	} catch (err: any) {
		switchError.value = err?.message || "Could not update theme availability."
	} finally {
		statusSaving.value = false
	}
}

function openSaveAsDialog() {
	saveAsDialog.name = `${editorMeta.theme_name || "Theme"} copy`
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
		saveAsDialog.error = "Enter a theme name."
		return
	}
	saveAsDialog.busy = true
	saveAsDialog.error = ""
	try {
		const payload = buildPayloadFromForm()
		await createThemeResource.submit({ theme_name: name, payload })
	} catch {
		// onError sets saveAsDialog.error
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
	renameDialog.name = ""
	renameDialog.error = ""
}

async function submitRename() {
	const name = renameDialog.name.trim()
	if (!name) {
		renameDialog.error = "Enter a theme name."
		return
	}
	renameDialog.busy = true
	renameDialog.error = ""
	try {
		const data = await renameThemeResource.submit({
			theme: editingTheme.value,
			theme_name: name,
		})
		closeRenameDialog()
		await themesList.reload()
		await loadTheme(data?.theme || name)
	} catch (err: any) {
		renameDialog.error = err?.message || "Could not rename theme."
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
	deleteDialog.error = ""
}

async function submitDelete() {
	deleteDialog.busy = true
	deleteDialog.error = ""
	const deleted = editingTheme.value
	try {
		await deleteThemeResource.submit({ theme: deleted })
		closeDeleteDialog()
		editingTheme.value = ""
		await themesList.reload()
		const base =
			themesList.data?.find((t: any) => t.is_base_theme || t.is_active)?.name ||
			themesList.data?.[0]?.name
		if (base) await loadTheme(base)
	} catch (err: any) {
		deleteDialog.error = err?.message || "Could not delete theme."
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
		switchError.value = err?.message || "Could not load base theme."
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
			"Base theme saved and bundled into the app. Commit and push the themes app to ship it on new installs."
		siteBaseTheme.value = data?.theme || editingTheme.value
		editorMeta.is_base_theme = true
		if (data?.css_hash) editorMeta.css_hash = data.css_hash
		themesList.reload()
	} catch (err: any) {
		systemTab.error = err?.message || "Could not save as base theme."
	} finally {
		systemTab.busy = false
	}
}

// Push live theme vars to the page + preview window (debounced preview)
function applyLiveThemeVars() {
	if (!editorLoaded.value) return
	const vars = computeCSSVariables()
	const root = document.documentElement
	for (const [key, value] of Object.entries(vars)) {
		if (value) root.style.setProperty(key, value)
	}
}

let pushTimer: ReturnType<typeof setTimeout> | null = null
watch(form, () => {
	applyLiveThemeVars()
	if (pushTimer) clearTimeout(pushTimer)
	pushTimer = setTimeout(pushToPreview, 80)
}, { deep: true })
</script>

<style scoped>
.section-title {
	@apply text-sm font-semibold uppercase tracking-wide;
	color: var(--nce-color-muted, #6b7280);
	font-family: var(--nce-font-heading, inherit);
}

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
	font-family: var(--nce-font-heading, inherit);
	color: var(--nce-color-heading, #111827);
}

.editor-subtitle {
	font-size: calc(var(--nce-font-size, 14px) * 0.875);
	font-family: var(--nce-font-family, inherit);
	color: var(--nce-color-text, #374151);
}

.editor-subtitle strong {
	color: var(--nce-color-heading, #111827);
	font-weight: 600;
}

.editor-status-label {
	font-size: calc(var(--nce-font-size, 14px) * 0.875);
	color: var(--nce-color-muted, #6b7280);
	font-family: var(--nce-font-family, inherit);
}

.editor-status-option {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	font-size: calc(var(--nce-font-size, 14px) * 0.875);
	color: var(--nce-color-text, #374151);
	font-family: var(--nce-font-family, inherit);
	cursor: pointer;
}

.editor-status-option input:disabled {
	cursor: not-allowed;
}

.editor-status-hint {
	font-size: calc(var(--nce-font-size, 14px) * 0.75);
	color: var(--nce-color-muted, #6b7280);
}

.editor-status-hint-warn {
	color: var(--nce-color-warning, #d97706);
}

.editor-warn {
	color: var(--nce-color-warning, #d97706);
	font-weight: 500;
}

.editor-muted {
	color: var(--nce-color-muted, #9ca3af);
}

.theme-select {
	flex: 1 1 auto;
	max-width: 26rem;
	width: 100%;
	appearance: none;
	cursor: pointer;
	background-color: var(--nce-color-surface, #ffffff);
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
	background-repeat: no-repeat;
	background-position: right 0.75rem center;
	background-size: 1rem;
	border: 1px solid var(--nce-color-border, #d1d5db);
	border-radius: var(--nce-border-radius, 0.375rem);
	color: var(--nce-color-text, #1f2937);
	font-family: var(--nce-font-family, inherit);
	font-size: var(--nce-font-size, 14px);
	line-height: 1.45;
	padding: 0.5625rem 2.5rem 0.5625rem 0.875rem;
	transition:
		border-color var(--nce-transition-speed, 200ms),
		box-shadow var(--nce-transition-speed, 200ms),
		background-color var(--nce-transition-speed, 200ms);
}

.theme-select:hover:not(:disabled) {
	border-color: var(--nce-color-primary, #3b82f6);
	background-color: var(--nce-color-surface, #f9fafb);
}

.theme-select:focus {
	outline: none;
	border-color: var(--nce-color-focus, #3b82f6);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--nce-color-focus, #3b82f6) 22%, transparent);
}

.theme-select:disabled {
	opacity: 0.55;
	cursor: not-allowed;
}

.editor-actions :deep(.theme-btn) {
	font-family: var(--nce-font-family, inherit) !important;
	font-size: calc(var(--nce-font-size, 14px) * 0.875) !important;
	font-weight: 500 !important;
	border-radius: var(--nce-border-radius, 0.375rem) !important;
	transition:
		background-color var(--nce-transition-speed, 200ms),
		border-color var(--nce-transition-speed, 200ms),
		color var(--nce-transition-speed, 200ms),
		filter var(--nce-transition-speed, 200ms) !important;
	white-space: nowrap;
	padding-inline: 0.875rem !important;
	padding-block: 0.5rem !important;
	box-shadow: none !important;
}

.editor-actions :deep(.theme-btn-primary:hover:not(:disabled)) {
	filter: brightness(1.08);
}

.editor-actions :deep(.theme-btn:disabled) {
	opacity: 0.45;
	cursor: not-allowed;
}

.body-weight-slider {
	accent-color: var(--nce-color-primary, #3b82f6);
	height: 0.375rem;
	cursor: pointer;
}
</style>
