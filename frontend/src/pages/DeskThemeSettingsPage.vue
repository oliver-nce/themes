<!--
Desk Theme Editor for NCE Desk Theme colours, shape, typography, Gantt, and live preview.

-->

// Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
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
							v-if="canSetAsDefaultTheme"
							variant="solid"
							class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							:loading="setDefaultBusy"
							:disabled="!canSetAsDefaultTheme"
							@click="requestSetAsDefaultTheme"
						>
							Set as Default desk theme
						</Button>
						<Button
							v-if="showRenameButton"
							variant="solid"
							class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							:disabled="!canRenameTheme"
							@click="openRenameDialog"
						>
							Rename
						</Button>
						<Button
							v-if="showDeleteButton"
							variant="solid"
							class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							:disabled="!canDeleteTheme"
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
				<EditorSection
					title="Palette (editor only)"
					hint="Sets the swatches offered in the colour pickers below. Not published to Desk."
					:panel-help="deskPanelHelp.brand"
				>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<SwatchPicker
							v-for="c in brandColors"
							:key="c.key"
							:label="c.label"
							:model-value="form[c.key]"
							:default-value="DEFAULTS[c.key]"
							:primary-color="form.primary_color"
							:secondary-color="form.brand_color"
							@update:model-value="form[c.key] = $event"
						/>
					</div>
				</EditorSection>

				<EditorSection
					title="Backgrounds"
					hint="The large background areas visible behind and around forms."
					:panel-help="deskPanelHelp.backgrounds"
				>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div v-for="c in backgroundColors" :key="c.key">
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
						<SwatchPicker
							v-for="c in textColors"
							:key="c.key"
							:label="c.label"
							:model-value="form[c.key]"
							:default-value="DEFAULTS[c.key]"
							:primary-color="form.primary_color"
							:secondary-color="form.brand_color"
							@update:model-value="form[c.key] = $event"
						/>
					</div>
				</EditorSection>

				<EditorSection
					title="Controls &amp; Borders"
					hint="Controls the colour of inputs, toolbar buttons, and the lines that structure forms and pages."
					:panel-help="deskPanelHelp.controlsBorders"
				>
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
						<SwatchPicker
							v-for="c in inputBorderColors"
							:key="c.key"
							:label="c.label"
							:model-value="form[c.key]"
							:default-value="DEFAULTS[c.key]"
							:primary-color="form.primary_color"
							:secondary-color="form.brand_color"
							@update:model-value="form[c.key] = $event"
						/>
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
						<SwatchPicker
							v-for="c in ganttColors"
							:key="c.key"
							:label="c.label"
							:model-value="form[c.key]"
							:default-value="DEFAULTS[c.key]"
							:primary-color="form.primary_color"
							:secondary-color="form.brand_color"
							@update:model-value="form[c.key] = $event"
						/>
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
import { ref, reactive, watch, computed, onUnmounted, onMounted } from "vue"
import { useRoute } from "vue-router"
import { createResource } from "frappe-ui"
import EditorSection, { type PanelHelpContent } from "@/components/EditorSection.vue"
import FontSelectField from "@/components/FontSelectField.vue"
import PasswordField from "@/components/PasswordField.vue"
import SizeSlider from "@/components/SizeSlider.vue"
import SwatchPicker from "@/components/SwatchPicker.vue"
import { applyDeskThemeVars, deskPayloadToCssVars, deskFontStack } from "@/composables/useDeskTheme"
import { useThemeEditor, type ThemeAvailabilityStatus } from "@/composables/useThemeEditor"

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
	"surface_gray_2",
	"subtle_fg",
	"heading_color",
	"btn_height",
	"radius",
	"input_height",
	"checkbox_size",
	"border_radius",
	"g_bar_color",
	"g_bar_border",
	"g_progress_color",
	"g_header_background",
	"g_row_color",
	// Typography
	"font_family",
	"font_weight_body",
	"font_weight_bold",
	"font_weight_medium",
	"font_size",
	"text_xs",
	"text_sm",
	"text_lg",
	"text_scale_mode",
	"spacing",
	"padding_xs",
	"padding_sm",
	"padding_md",
	"margin_xs",
	"margin_sm",
	"list_row_height",
	"page_max_width",
	"page_head_height",
	"density",
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
	surface_gray_2: "#f3f3f3",
	subtle_fg: "#f3f3f3",
	heading_color: "#0f0f0f",
	btn_height: "28px",
	radius: "8px",
	input_height: "28px",
	checkbox_size: "14px",
	border_radius: "6px",
	g_bar_color: "#2490EF",
	g_bar_border: "#007be0",
	g_progress_color: "#0070cc",
	g_header_background: "#f3f3f3",
	g_row_color: "#f8f8f8",
	// Typography
	font_family: "System Default",
	font_weight_body: "420",
	font_weight_bold: "600",
	font_weight_medium: "500",
	font_size: "14px",
	text_xs: "12px",
	text_sm: "13px",
	text_lg: "16px",
	text_scale_mode: "auto",
	spacing: ".25rem",
	padding_xs: "5px",
	padding_sm: "7px",
	padding_md: "15px",
	margin_xs: "5px",
	margin_sm: "10px",
	list_row_height: "30px",
	page_max_width: "900px",
	page_head_height: "48px",
	density: "default",
}

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

const route = useRoute()
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

const BODY_WEIGHT_MIN = 100
const BODY_WEIGHT_MAX = 900

function clampBodyWeight(raw: unknown): number {
	const n = Number.parseInt(String(raw ?? "400"), 10)
	if (!Number.isFinite(n)) return 400
	return Math.min(BODY_WEIGHT_MAX, Math.max(BODY_WEIGHT_MIN, n))
}

function weightDisplayLabel(n: number): string {
	if (n <= 350) return `${n} — Light`
	if (n <= 450) return `${n} — Regular`
	if (n <= 550) return `${n} — Medium`
	if (n <= 650) return `${n} — Semi-bold`
	return `${n} — Bold`
}

const bodyWeightDisplay = computed(() =>
	weightDisplayLabel(clampBodyWeight(form.font_weight_body)),
)

const boldWeightDisplay = computed(() =>
	weightDisplayLabel(clampBodyWeight(form.font_weight_bold)),
)

function fontCSS(name: string): string {
	return deskFontStack(name) || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
}

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

function themeFromQuery(): string {
	return String(route.query.theme || "").trim()
}

function tryLoadThemeFromQuery(themes: any[]): boolean {
	const q = themeFromQuery()
	if (!q || !themes?.length) return false
	if (!themes.some((t) => t.name === q)) return false
	loadTheme(q)
	return true
}

function themeOptionLabel(t: any): string {
	let label = t.theme_name || t.name
	if (t.is_default_theme ?? t.is_base_theme) label += " (Default)"
	if (t.is_active) label += " (active)"
	return label
}

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

const suppressTextScaleAuto = ref(false)
const suppressDensityAuto = ref(false)

const DENSITY_PRESET_IDS = ["compact", "default", "comfortable"] as const
type DensityPresetId = (typeof DENSITY_PRESET_IDS)[number]
type DensityMode = DensityPresetId | "custom"

const DENSITY_PRESET_KEYS = [
	"spacing",
	"padding_xs",
	"padding_sm",
	"padding_md",
	"margin_xs",
	"margin_sm",
	"list_row_height",
	"input_height",
] as const satisfies readonly FormKey[]

const DENSITY_PRESETS: Record<DensityPresetId, Record<(typeof DENSITY_PRESET_KEYS)[number], string>> = {
	compact: {
		spacing: ".2rem",
		padding_xs: "3px",
		padding_sm: "5px",
		padding_md: "10px",
		margin_xs: "3px",
		margin_sm: "6px",
		list_row_height: "26px",
		input_height: "24px",
	},
	default: {
		spacing: ".25rem",
		padding_xs: "5px",
		padding_sm: "7px",
		padding_md: "15px",
		margin_xs: "5px",
		margin_sm: "10px",
		list_row_height: "30px",
		input_height: "28px",
	},
	comfortable: {
		spacing: ".3rem",
		padding_xs: "7px",
		padding_sm: "10px",
		padding_md: "20px",
		margin_xs: "7px",
		margin_sm: "14px",
		list_row_height: "36px",
		input_height: "32px",
	},
}

const densityPresetOptions = [
	{ id: "compact" as const, label: "Compact" },
	{ id: "default" as const, label: "Default" },
	{ id: "comfortable" as const, label: "Comfortable" },
]

function densityPresetTokenEqual(
	key: (typeof DENSITY_PRESET_KEYS)[number],
	a: string,
	b: string,
): boolean {
	if (key === "spacing") return parseFloat(a) === parseFloat(b)
	return a === b
}

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

const {
	loadingTheme,
	saving,
	statusSaving,
	editorLoaded,
	editorError,
	switchError,
	listLoadError,
	selectedTheme,
	editingTheme,
	siteBaseTheme,
	savedThemeStatus,
	editorMeta,
	isDirty,
	savedSnapshot,
	themesList,
	saveResource,
	renameThemeResource,
	deleteThemeResource,
	createThemeResource,
	baseThemePayloadResource,
	saveAsBaseThemeResource,
	loadTheme,
} = useThemeEditor(
	{
		list: "themes.api.list_desk_themes",
		getEditor: "themes.api.get_desk_theme_editor",
		save: "themes.api.save_desk_theme",
		rename: "themes.api.rename_desk_theme",
		delete: "themes.api.delete_desk_theme",
		create: "themes.api.create_desk_theme",
		basePayload: "themes.api.get_base_desk_theme_payload",
		saveAsBase: "themes.api.save_as_base_desk_theme",
	},
	{
		applyPayloadToForm,
		buildPayloadFromForm,
		canonicalPayload,
		applyLiveThemeVars: () => applyDeskThemeVars(computeCSSVariables()),
		tryLoadThemeFromQuery,
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
		onCreateSuccess: (data) => {
			saveAsDialog.open = false
			saveAsDialog.busy = false
			themesList.reload()
			if (data?.theme) loadTheme(data.theme as string)
		},
		onCreateError: (err) => {
			saveAsDialog.error = err?.message || "Could not create desk theme."
			saveAsDialog.busy = false
		},
	},
)

const siteBaseThemeName = computed(() => {
	const row = themesList.data?.find((t: any) => t.name === siteBaseTheme.value)
	return row?.theme_name || siteBaseTheme.value || ""
})

const themeSelectWidth = computed(() => {
	const labels = (themesList.data || []).map((t: any) => themeOptionLabel(t))
	const chars = Math.max(20, ...labels.map((l: string) => l.length), 0)
	return `${Math.min(Math.max(chars * 0.62, 14), 26)}rem`
})

const canChangeStatus = computed(
	() => editorLoaded.value && !loadingTheme.value && !saving.value && !statusSaving.value && !isDirty.value,
)

const canRenameTheme = computed(
	() =>
		canChangeStatus.value &&
		(editorMeta.is_default_theme || savedThemeStatus.value === "Inactive"),
)

const canDeleteTheme = computed(
	() =>
		canChangeStatus.value &&
		savedThemeStatus.value === "Inactive" &&
		!editorMeta.is_default_theme,
)

const showRenameButton = computed(() => editorLoaded.value)

const showDeleteButton = computed(
	() => editorLoaded.value && !editorMeta.is_default_theme,
)

const canSetAsDefaultTheme = computed(
	() => canChangeStatus.value && !editorMeta.is_default_theme,
)

const setDefaultBusy = ref(false)

const setDefaultThemeResource = createResource({
	url: "themes.api.set_base_desk_theme",
	auto: false,
})

async function requestSetAsDefaultTheme() {
	if (!canSetAsDefaultTheme.value || !editingTheme.value) return
	setDefaultBusy.value = true
	switchError.value = ""
	try {
		const data = await setDefaultThemeResource.submit({ theme: editingTheme.value })
		siteBaseTheme.value = data?.theme || editingTheme.value
		editorMeta.is_default_theme = true
		if (data?.css_hash) editorMeta.css_hash = data.css_hash
		themesList.reload()
		await loadTheme(editingTheme.value)
	} catch (err: any) {
		switchError.value = err?.message || "Could not set Default desk theme."
	} finally {
		setDefaultBusy.value = false
	}
}

const canSaveAsDefaultTheme = computed(
	() => editorLoaded.value && editorMeta.is_default_theme && !loadingTheme.value,
)

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
	if (!canRenameTheme.value) return
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
	if (!canDeleteTheme.value) return
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
			themesList.data?.find((t: any) => t.is_default_theme || t.is_base_theme)?.name ||
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
	if (!canSaveAsDefaultTheme.value || !systemTab.password) return
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
		editorMeta.is_default_theme = true
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
