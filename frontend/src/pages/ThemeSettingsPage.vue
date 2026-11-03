<!--
Site Theme Editor for colours, typography, layout, live CSS variables, and base theme publishing.

-->

// Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
<template>
	<div class="max-w-6xl mx-auto px-6 py-4">
		<ThemeEditorHeader
			:manager="manager"
			title="Theme Editor"
			noun="theme"
			status-label="For panels:"
			radio-name="theme-availability"
			restore-target="Theme"
			:has-default-theme="false"
			:theme-option-label="themeOptionLabel"
			@preview="openPreview"
			@restore="requestRestoreToBase"
		/>

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

			<!-- AGENT:TAB colours — brand (primary/secondary panels), neutral warmth, status, surface pickers -->
			<div v-show="activeTab === 'colors'" class="editor-tab">
				<EditorSection id="theme-style-primary" title="Primary">
					<template #actions>
						<label
							class="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 shrink-0"
							for="brand_palette_mode"
						>
							<input
								id="brand_palette_mode"
								type="checkbox"
								class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								:checked="isCorporateBrandPalette"
								@change="onBrandPaletteModeChange"
							/>
							These are from a Brand Palette
						</label>
					</template>
					<BrandColorPicker
						label="Primary"
						v-model:fg-preview-mode="primaryFgPreviewMode"
						:show-pole-markers="secondaryFgPreviewMode === 'tonal'"
						:model-value="form.primary_color"
						:gamma="form.primary_color_gamma"
						:saturation="form.primary_color_saturation"
						:palette-mode="brandPaletteMode"
						:opposite-brand-color="form.secondary_color"
						:opposite-brand-gamma="secondaryShadeAdjust.gamma"
						:opposite-brand-saturation="secondaryShadeAdjust.saturation"
						:flip-mono="form.primary_color_fg_flip_mono"
						:flip-tonal="form.primary_color_fg_flip_tonal"
						:pole-tonal-dark="form.primary_color_fg_pole_tonal_dark"
						:pole-tonal-light="form.primary_color_fg_pole_tonal_light"
						:linked-pole-tonal-dark="form.secondary_color_fg_pole_tonal_dark"
						:linked-pole-tonal-light="form.secondary_color_fg_pole_tonal_light"
						@update:model-value="form.primary_color = $event"
						@update:gamma="form.primary_color_gamma = $event"
						@update:saturation="form.primary_color_saturation = $event"
						@update:flip-mono="form.primary_color_fg_flip_mono = $event"
						@update:flip-tonal="form.primary_color_fg_flip_tonal = $event"
						@update:pole-tonal-dark="form.primary_color_fg_pole_tonal_dark = $event"
						@update:pole-tonal-light="form.primary_color_fg_pole_tonal_light = $event"
						@update:linked-pole-tonal-dark="form.secondary_color_fg_pole_tonal_dark = $event"
						@update:linked-pole-tonal-light="form.secondary_color_fg_pole_tonal_light = $event"
						show-shades
					/>
				</EditorSection>

				<EditorSection id="theme-style-secondary" title="Secondary">
					<BrandColorPicker
						label="Secondary"
						v-model:fg-preview-mode="secondaryFgPreviewMode"
						:show-pole-markers="primaryFgPreviewMode === 'tonal'"
						:model-value="form.secondary_color"
						:gamma="form.secondary_color_gamma"
						:saturation="form.secondary_color_saturation"
						:palette-mode="brandPaletteMode"
						:opposite-brand-color="form.primary_color"
						:opposite-brand-gamma="primaryShadeAdjust.gamma"
						:opposite-brand-saturation="primaryShadeAdjust.saturation"
						:flip-mono="form.secondary_color_fg_flip_mono"
						:flip-tonal="form.secondary_color_fg_flip_tonal"
						:pole-tonal-dark="form.secondary_color_fg_pole_tonal_dark"
						:pole-tonal-light="form.secondary_color_fg_pole_tonal_light"
						:linked-pole-tonal-dark="form.primary_color_fg_pole_tonal_dark"
						:linked-pole-tonal-light="form.primary_color_fg_pole_tonal_light"
						@update:model-value="form.secondary_color = $event"
						@update:gamma="form.secondary_color_gamma = $event"
						@update:saturation="form.secondary_color_saturation = $event"
						@update:flip-mono="form.secondary_color_fg_flip_mono = $event"
						@update:flip-tonal="form.secondary_color_fg_flip_tonal = $event"
						@update:pole-tonal-dark="form.secondary_color_fg_pole_tonal_dark = $event"
						@update:pole-tonal-light="form.secondary_color_fg_pole_tonal_light = $event"
						@update:linked-pole-tonal-dark="form.primary_color_fg_pole_tonal_dark = $event"
						@update:linked-pole-tonal-light="form.primary_color_fg_pole_tonal_light = $event"
						show-shades
					/>
				</EditorSection>

				<EditorSection id="theme-style-neutral" title="Neutral" hint="Greyscale for structural surfaces, dividers, and body content that should not carry brand meaning.">
					<NeutralColorPicker
						label="Neutral"
						:warmth="form.neutral_color_warmth"
						@update:warmth="form.neutral_color_warmth = $event"
					/>
				</EditorSection>

				<EditorSection
					id="theme-style-status"
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
							:id="`theme-style-field-${c.key}`"
							:label="c.label"
							:model-value="form[c.key]"
							:default-value="DEFAULTS[c.key]"
							@update:model-value="form[c.key] = $event"
							:primary-color="form.primary_color"
							:secondary-color="form.secondary_color"
							:primary-gamma="primaryShadeAdjust.gamma"
							:primary-saturation="primaryShadeAdjust.saturation"
							:secondary-gamma="secondaryShadeAdjust.gamma"
							:secondary-saturation="secondaryShadeAdjust.saturation"
						/>
					</div>
				</EditorSection>

				<EditorSection id="theme-style-surfaces" title="Surfaces">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<SwatchPicker
							v-for="c in surfaceColors"
							:key="c.key"
							:id="`theme-style-field-${c.key}`"
							:label="c.label"
							:model-value="form[c.key]"
							:default-value="DEFAULTS[c.key]"
							@update:model-value="form[c.key] = $event"
							:primary-color="form.primary_color"
							:secondary-color="form.secondary_color"
							:primary-gamma="primaryShadeAdjust.gamma"
							:primary-saturation="primaryShadeAdjust.saturation"
							:secondary-gamma="secondaryShadeAdjust.gamma"
							:secondary-saturation="secondaryShadeAdjust.saturation"
						/>
					</div>
				</EditorSection>
			</div>

			<!-- AGENT:TAB typography — fonts, text colours, sizes, line height, body weight -->
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

				<EditorSection id="theme-style-text" title="Text Colours">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<SwatchPicker
							v-for="c in textColors"
							:key="c.key"
							:id="`theme-style-field-${c.key}`"
							:label="c.label"
							:model-value="form[c.key]"
							:default-value="DEFAULTS[c.key]"
							@update:model-value="form[c.key] = $event"
							:primary-color="form.primary_color"
							:secondary-color="form.secondary_color"
							:primary-gamma="primaryShadeAdjust.gamma"
							:primary-saturation="primaryShadeAdjust.saturation"
							:secondary-gamma="secondaryShadeAdjust.gamma"
							:secondary-saturation="secondaryShadeAdjust.saturation"
						/>
					</div>
				</EditorSection>

				<EditorSection id="theme-style-font-weights" title="Size &amp; Weight">
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
								@input="onFontWeightInput('font_weight_body', $event)"
							/>
							<div class="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
								<span>100</span>
								<span>400</span>
								<span>700</span>
								<span>900</span>
							</div>
						</div>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6" :style="liveVars">
						<div v-for="w in extraFontWeightControls" :key="w.key">
							<label class="block text-sm font-medium text-gray-700 mb-1.5">
								{{ w.label }}
								<span class="font-normal text-gray-500">({{ fontWeightDisplay(w.key) }})</span>
							</label>
							<input
								type="range"
								class="body-weight-slider w-full"
								min="100"
								max="900"
								step="1"
								:value="fontWeightNumber(w.key)"
								@input="onFontWeightInput(w.key, $event)"
							/>
							<p
								class="mt-2 text-sm text-gray-600"
								:class="w.sampleClass"
								:style="{ fontFamily: fontCSS(form.font_family) }"
							>
								{{ w.sampleText }}
							</p>
						</div>
					</div>
				</EditorSection>
			</div>

			<!-- AGENT:TAB layout — border radius, spacing, shadow, sidebar, container -->
			<div v-show="activeTab === 'layout'" class="editor-tab">
			<EditorSection title="Corners">
					<div class="flex flex-wrap gap-3">
						<div
							v-for="r in radiusOptions"
							:key="r"
							class="w-16 h-16 border-2 cursor-pointer transition-all"
							:class="form.border_radius === r ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'"
							:style="{ borderRadius: BORDER_RADIUS_MAP[r] }"
							@click="form.border_radius = r"
						>
							<span class="flex items-center justify-center h-full text-xs text-gray-500 font-medium">{{ r }}</span>
						</div>
					</div>
				</EditorSection>

				<EditorSection title="Line Widths" hint="Controls border and divider thickness. 'Normal' is used for cards and inputs; 'Strong' for table headers and tab underlines; 'Thin' for subtle hairlines on high-density screens.">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<SelectField
							label="Thin"
							:options="borderWidthOptions"
							v-model="form.border_width_thin"
						/>
						<SelectField
							label="Normal"
							:options="borderWidthOptions"
							v-model="form.border_width"
						/>
						<SelectField
							label="Strong"
							:options="borderWidthOptions"
							v-model="form.border_width_strong"
						/>
					</div>
				</EditorSection>

				<EditorSection
					id="theme-style-tables"
					title="Tables"
					hint="Row striping, header, and cell dividers. Class theme-table on a &lt;table&gt; applies the full bundle. Line thickness uses Thin / Normal / Strong — the same tiers as Line Widths above."
				>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<SwatchPicker
							v-for="c in tableColors"
							:key="c.key"
							:id="`theme-style-field-${c.key}`"
							:label="c.label"
							:model-value="form[c.key]"
							:default-value="DEFAULTS[c.key]"
							@update:model-value="form[c.key] = $event"
							:primary-color="form.primary_color"
							:secondary-color="form.secondary_color"
							:primary-gamma="primaryShadeAdjust.gamma"
							:primary-saturation="primaryShadeAdjust.saturation"
							:secondary-gamma="secondaryShadeAdjust.gamma"
							:secondary-saturation="secondaryShadeAdjust.saturation"
						/>
						<SelectField
							v-for="w in tableWidths"
							:key="w.key"
							:label="w.label"
							:options="borderWidthTierOptions"
							v-model="form[w.key]"
						/>
					</div>
					<div class="mt-4 overflow-hidden rounded-lg border border-gray-200">
						<table
							class="theme-table nce-editor-table-preview w-full text-sm"
							:style="liveVars"
						>
							<thead>
								<tr>
									<th class="px-3 py-2 text-left font-semibold">ID</th>
									<th class="px-3 py-2 text-left font-semibold">Name</th>
									<th class="px-3 py-2 text-left font-semibold">Status</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="row in tablePreviewRows" :key="row.id">
									<td class="px-3 py-2">{{ row.id }}</td>
									<td class="px-3 py-2">{{ row.name }}</td>
									<td class="px-3 py-2">{{ row.status }}</td>
								</tr>
							</tbody>
							<tfoot>
								<tr>
									<th colspan="3" class="px-3 py-2 text-center font-semibold">Footer</th>
								</tr>
							</tfoot>
						</table>
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
							:primary-gamma="primaryShadeAdjust.gamma"
							:primary-saturation="primaryShadeAdjust.saturation"
							:secondary-gamma="secondaryShadeAdjust.gamma"
							:secondary-saturation="secondaryShadeAdjust.saturation"
						/>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1.5">
								Shadow Opacity
								<span class="font-normal text-gray-500">({{ shadowOpacityDisplay }})</span>
							</label>
							<input
								type="range"
								class="shadow-opacity-slider w-full"
								min="0"
								max="100"
								step="1"
								:value="shadowOpacityNumber"
								@input="onShadowOpacityInput"
							/>
							<div class="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
								<span>0%</span>
								<span>50%</span>
								<span>100%</span>
							</div>
							<p class="text-xs text-gray-500 mt-1">Direct alpha — 96% → rgba(…, 0.96)</p>
						</div>
						<ShadowDirectionDial v-model="form.shadow_direction" />
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

			<!-- AGENT:TAB interaction — hover shades, focus ring, disabled opacity, pressed shift -->
			<div v-show="activeTab === 'interaction'" class="editor-tab">
				<EditorSection
					id="theme-style-interaction-hover"
					title="Hover"
					hint="Background and border shades applied on :hover for buttons and controls that use the theme-hover-* classes."
				>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<SelectField
							label="Hover background shade"
							:options="hoverBgShadeOptions"
							v-model="form.hover_bg_shade"
						/>
						<SelectField
							label="Hover border shade"
							:options="hoverBorderShadeOptions"
							v-model="form.hover_border_shade"
						/>
					</div>
					<div class="flex items-center gap-3 mt-4">
						<input
							type="checkbox"
							id="button_outline_enabled"
							v-model="form.button_outline_enabled"
							class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<div>
							<label for="button_outline_enabled" class="text-sm font-medium text-gray-700">
								Outline buttons
							</label>
							<p class="text-xs text-gray-500 mt-1">
								Draw every button in apps using this theme as an outline button (transparent fill,
								primary border and text). Design Mode changes and "Use original app styles only"
								still win.
							</p>
						</div>
					</div>
				</EditorSection>

				<EditorSection
					id="theme-style-interaction-focus"
					title="Focus Ring"
					hint="Width and offset for theme-focus-ring; ring colour is the Focus Ring colour in the Colours tab (Typography > Text Colours)."
				>
					<div class="flex flex-col gap-4 mb-6">
						<div class="flex items-center gap-3">
							<input
								type="checkbox"
								id="focus_ring_enabled"
								v-model="form.focus_ring_enabled"
								class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<label for="focus_ring_enabled" class="text-sm font-medium text-gray-700">
								Show focus ring
							</label>
						</div>
						<div class="flex items-center gap-3">
							<input
								type="checkbox"
								id="focus_fill_enabled"
								v-model="form.focus_fill_enabled"
								class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<label for="focus_fill_enabled" class="text-sm font-medium text-gray-700">
								Fill button on focus
							</label>
						</div>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<SelectField
							label="Ring width"
							:options="focusRingWidthOptions"
							v-model="form.focus_ring_width"
						/>
						<SelectField
							label="Ring offset"
							:options="focusRingOffsetOptions"
							v-model="form.focus_ring_offset"
						/>
					</div>
				</EditorSection>

				<EditorSection
					id="theme-style-interaction-disabled"
					title="Disabled"
					hint="Opacity for theme-disabled and theme-disabled-auto on inactive controls."
				>
					<SelectField
						label="Disabled opacity"
						:options="disabledOpacityOptions"
						v-model="form.disabled_opacity"
					/>
				</EditorSection>

				<EditorSection
					id="theme-style-interaction-pressed"
					title="Pressed"
					hint="Vertical shift on :active for theme-pressed (simulates a pressed button)."
				>
					<SelectField
						label="Pressed shift"
						:options="pressedShiftOptions"
						v-model="form.pressed_shift"
					/>
				</EditorSection>

				<EditorSection id="theme-style-interaction-preview" title="Live preview">
					<p class="text-sm text-gray-600 mb-3">
						Hover or Tab onto a button to preview hover and focus styles.
					</p>
					<div
						class="rounded-lg border border-gray-200 p-5 bg-white space-y-4 nce-interaction-preview"
						v-bind="interactionFocusPreviewAttrs"
						:style="interactionPreviewVars"
					>
						<div class="flex flex-wrap gap-3">
							<button
								type="button"
								class="theme-bg-primary-100 theme-border theme-rounded theme-hover-bg-primary theme-focus-ring theme-pressed theme-p-sm text-sm cursor-pointer"
							>
								Primary
							</button>
							<button
								type="button"
								disabled
								class="theme-bg-primary-100 theme-border theme-rounded theme-hover-bg-primary theme-focus-ring theme-pressed theme-disabled-auto theme-p-sm text-sm"
							>
								Primary (disabled)
							</button>
							<button
								type="button"
								class="theme-bg-neutral-100 theme-border theme-rounded theme-hover-bg-neutral theme-focus-ring theme-pressed theme-p-sm text-sm cursor-pointer"
							>
								Neutral
							</button>
							<button
								type="button"
								disabled
								class="theme-bg-neutral-100 theme-border theme-rounded theme-hover-bg-neutral theme-focus-ring theme-pressed theme-disabled-auto theme-p-sm text-sm"
							>
								Neutral (disabled)
							</button>
						</div>
						<div class="flex flex-wrap gap-4 text-sm" :style="{ fontFamily: fontCSS(form.font_family) }">
							<span class="theme-font-normal">Normal weight</span>
							<span class="theme-font-medium">Medium weight</span>
							<span class="theme-font-semibold">Semibold weight</span>
							<span class="theme-font-bold">Bold weight</span>
						</div>
					</div>
				</EditorSection>

				<EditorSection
					id="theme-style-interaction-buttons"
					title="Buttons"
					hint="Choose a size on the left. The buttons update immediately when you change these settings, or Hover, Focus Ring, Disabled and Pressed above."
				>
					<div class="flex flex-row items-start gap-6">
						<div
							class="flex flex-col items-start gap-3 w-56 shrink-0 rounded-lg border border-gray-200 bg-white p-4 nce-interaction-preview"
							v-bind="interactionFocusPreviewAttrs"
							:style="interactionPreviewVars"
						>
							<button
								v-for="row in buttonSizeRows"
								:key="row.prefix"
								type="button"
								class="nce-size-choice"
								:class="{ 'is-selected': selectedButtonSize === row.prefix }"
								:style="buttonSizeStyle(row.prefix)"
								@click="selectedButtonSize = row.prefix"
							>
								{{ row.label }}
							</button>
						</div>
						<div class="flex-1 min-w-0 grid grid-cols-2 gap-4 content-start">
							<div v-for="field in selectedButtonRow.fields" :key="field.key">
								<label class="block text-sm font-medium text-gray-700 mb-1.5">{{
									field.label
								}}</label>
								<select
									class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									:value="sizeChoice(field)"
									@change="onSizeChoice(field, ($event.target as HTMLSelectElement).value)"
								>
									<option v-for="opt in buttonSizeOptions(field.kind)" :key="opt" :value="opt">
										{{ opt }}
									</option>
									<option value="other">Other</option>
								</select>
								<input
									v-if="sizeChoice(field) === 'other'"
									v-model="form[field.key]"
									type="text"
									class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white mt-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									@blur="ensureCssPx(field.key)"
								/>
							</div>
						</div>
					</div>
				</EditorSection>
			</div>

			<!-- AGENT:TAB advanced — custom_css, tailwind_overrides, dark_mode -->
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
					<p v-if="editorMeta.css_hash" class="text-sm text-gray-600">
						Stylesheet hash: {{ editorMeta.css_hash }}
					</p>
					<p class="text-sm text-gray-500">
						Saving updates this theme only. Active themes are included in the shared CSS file.
					</p>
				</EditorSection>
			</div>

			<!-- AGENT:TAB applications — per-app Apply theme toggle -->
			<div v-show="activeTab === 'applications'" class="editor-tab">
				<EditorSection
					title="Apply theme"
					hint="Choose a theme for each app, read the explanation, then turn Apply on. Apply copies the theme files into the app; unticking Apply removes them. An app with Apply off, or with no theme chosen, keeps the stock Frappe look."
				>
					<p v-if="themeAppsError" class="text-sm text-red-600 mb-2">{{ themeAppsError }}</p>
					<p
						v-if="themeAppsResource.loading && !themeApps.length"
						class="text-sm text-gray-400"
					>
						Loading applications…
					</p>
					<p v-else-if="!themeApps.length && !themeAppsError" class="text-sm text-gray-400">
						No applications to list.
					</p>
					<ul v-else-if="themeApps.length" class="divide-y divide-gray-200">
						<li
							v-for="row in themeApps"
							:key="row.app"
							class="py-2"
						>
							<div class="flex items-center justify-between gap-4">
								<div class="min-w-0">
									<span class="text-sm text-gray-800">
										{{ row.title }}
										<span v-if="row.title !== row.app" class="text-gray-400"> {{ row.app }}</span>
									</span>
									<p
										v-if="row.files_status === 'removed_by_update'"
										class="text-xs text-amber-700 mt-0.5"
									>
										Removed by an update - tick Apply again
									</p>
								</div>
								<div class="flex items-center gap-3 shrink-0">
									<select
										class="text-sm border border-gray-200 rounded-md px-2 py-1 pr-8 bg-white w-56"
										:value="row.theme_slug"
										:disabled="row.busy"
										@change="onThemeAppTheme(row, ($event.target as HTMLSelectElement).value)"
									>
										<option value="" disabled>Choose a theme…</option>
										<option
											v-for="t in activeThemes"
											:key="t.slug"
											:value="t.slug"
										>
											{{ t.theme_name }}
										</option>
										<option
											v-if="row.theme_slug && !activeThemes.some((t) => t.slug === row.theme_slug)"
											:value="row.theme_slug"
										>
											{{ row.theme_slug }}
										</option>
									</select>
									<Button
										variant="solid"
										class="theme-btn theme-btn-quiet text-xs px-2 py-1 bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt shrink-0 w-24 justify-center"
										:class="
											!row.acknowledged
												? 'font-semibold ring-1 ring-amber-400/80'
												: ''
										"
										:disabled="row.busy"
										@click="openApplyExplanationDialog(row)"
									>
										<template v-if="!row.acknowledged">
											<span class="inline-flex items-center gap-1">
												Must read
												<span
													class="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
													aria-hidden="true"
												/>
											</span>
										</template>
										<template v-else>Read ✓</template>
									</Button>
									<label class="flex items-center gap-2 text-sm text-gray-700">
										Apply
										<input
											type="checkbox"
											class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
											:class="{ 'opacity-50': themeAppApplyCheckboxMuted(row) }"
											:checked="themeAppApplyChecked(row)"
											:disabled="themeAppApplyCheckboxDisabled(row)"
											:title="themeAppApplyCheckboxTitle(row)"
											@change="onThemeAppApply(row, ($event.target as HTMLInputElement).checked)"
										/>
									</label>
								</div>
							</div>
						</li>
					</ul>
				</EditorSection>

				<EditorSection
					title="Export for developers"
					hint="Download a small bundle a developer can save in their own app so it can use these themes without the Themes app. Nothing in any app is changed."
				>
					<p v-if="exportThemesError" class="text-sm text-red-600 mb-2">{{ exportThemesError }}</p>
					<p
						v-if="exportThemesResource.loading && !exportThemes.length"
						class="text-sm text-gray-400"
					>
						Loading themes for export…
					</p>
					<p v-else-if="!exportThemes.length && !exportThemesError" class="text-sm text-gray-400">
						No themes available to export.
					</p>
					<template v-else-if="exportThemes.length">
						<ul class="divide-y divide-gray-200 mb-4">
							<li
								v-for="theme in exportThemes"
								:key="theme.name"
								class="py-2"
							>
								<label
									class="flex items-start gap-2 text-sm"
									:class="exportCheckboxDisabled(theme) ? 'text-gray-400' : 'text-gray-800'"
								>
									<input
										type="checkbox"
										class="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
										:checked="isExportThemeSelected(theme.name)"
										:disabled="exportCheckboxDisabled(theme)"
										@change="onExportThemeToggle(theme, ($event.target as HTMLInputElement).checked)"
									/>
									<span>
										{{ theme.theme_name }}
										<span v-if="theme.slug" class="block text-xs text-gray-400">{{
											theme.slug
										}}</span>
										<span
											v-if="exportCheckboxDisabled(theme)"
											class="block text-xs text-gray-400"
										>
											needs a slug to be chosen by users
										</span>
									</span>
								</label>
							</li>
						</ul>

						<p
							v-if="exportSelectedNames.length"
							class="text-sm text-gray-500 mb-4"
						>
							{{ exportStartsWithLine }}
						</p>

						<label class="flex items-start gap-2 text-sm text-gray-800 mb-4">
							<input
								v-model="exportIncludeFrappeUiBridge"
								type="checkbox"
								class="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<span>
								Also include the Frappe UI colour mapping
								<span class="block text-xs text-gray-500">
									Makes Frappe UI components in your app follow the theme.
								</span>
							</span>
						</label>

						<Button
							variant="solid"
							class="bg-primary text-primary-fg border border-primary"
							:disabled="exportDownloadDisabled"
							@click="downloadExportBundle"
						>
							Download bundle
						</Button>
						<p v-if="exportDownloadDisabled" class="text-sm text-gray-500 mt-2">
							Tick at least one theme to export.
						</p>
						<p v-if="exportDownloadMessage" class="text-sm text-gray-600 mt-2">
							{{ exportDownloadMessage }}
						</p>
					</template>
				</EditorSection>
			</div>

			<!-- AGENT:TAB system — class catalog + Save as base theme to app -->
			<div v-show="activeTab === 'system'" class="editor-tab">
				<ThemeClassCatalogPanel
					:css-hash="editorMeta.css_hash"
					:is-dirty="isDirty"
					:theme-slug="editorMeta.slug"
				/>

				<EditorSection
					title="Save as base theme"
					hint="Rare release action: bundles the current theme as the app base theme, rebuilds CSS, and writes install fixtures for new sites. Commit and push after running."
				>
					<p class="text-sm text-gray-600 mb-3">
						Editing <strong>{{ editorMeta.theme_name || "—" }}</strong>.
						Requires your account password.
					</p>
					<PasswordField
						v-model="systemTab.password"
						@enter="requestSaveAsBaseTheme"
					/>
					<p v-if="systemTab.error" class="text-sm text-red-600 mb-2">{{ systemTab.error }}</p>
					<p v-if="systemTab.success" class="text-sm text-green-700 mb-2">{{ systemTab.success }}</p>
					<Button
						variant="solid"
						class="bg-primary text-primary-fg border border-primary"
						:loading="systemTab.busy"
						:disabled="!canSaveAsDefaultTheme || !systemTab.password"
						@click="requestSaveAsBaseTheme"
					>
						Save as base theme
					</Button>
				</EditorSection>
			</div>
		</template>

		<!-- Unsaved changes prompt -->
		<Teleport to="body">
			<ThemeDialog :open="confirmDialog.open" :title="confirmDialog.title" @close="closeConfirmDialog">
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
			</ThemeDialog>

			<ThemeDialog :open="saveBaseThemeDialog.open" title="Save as Base Theme" @close="closeSaveBaseThemeDialog">
				<div class="text-sm text-gray-600 mt-2 space-y-3">
					<p>
						This action saves any current editor changes, then writes the bundled base theme into the Themes application code.
					</p>
					<p>
						New installs (or sites that restore from that bundle) load this base theme when you use Restore to Base Theme.
					</p>
				</div>
				<p v-if="saveBaseThemeDialog.error" class="text-sm text-red-600 mt-3">{{ saveBaseThemeDialog.error }}</p>
				<div class="flex flex-wrap gap-2 justify-end mt-5">
					<Button
						variant="solid"
						class="bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
						:disabled="saveBaseThemeDialog.busy"
						@click="closeSaveBaseThemeDialog"
					>
						Cancel
					</Button>
					<Button
						variant="solid"
						class="bg-primary text-primary-fg border border-primary"
						:loading="saveBaseThemeDialog.busy"
						@click="confirmSaveAsBaseTheme"
					>
						Continue
					</Button>
				</div>
			</ThemeDialog>

			<ThemeDialog :open="restoreToBaseDialog.open" title="Replace unsaved changes?" @close="closeRestoreToBaseDialog">
				<p class="text-sm text-gray-600 mt-2">
					Restore to Base Theme will replace your unsaved changes in the editor with the base theme. Nothing is saved until you click Save Changes. Revert returns to the saved theme.
				</p>
				<p v-if="restoreToBaseDialog.error" class="text-sm text-red-600 mt-3">{{ restoreToBaseDialog.error }}</p>
				<div class="flex flex-wrap gap-2 justify-end mt-5">
					<Button
						variant="solid"
						class="bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
						:disabled="restoreToBaseDialog.busy"
						@click="closeRestoreToBaseDialog"
					>
						Cancel
					</Button>
					<Button
						variant="solid"
						class="bg-primary text-primary-fg border border-primary"
						:loading="restoreToBaseDialog.busy"
						@click="confirmRestoreToBaseReplace"
					>
						Replace
					</Button>
				</div>
			</ThemeDialog>

			<ThemeDialog :open="saveAsDialog.open" title="Save as new theme" @close="closeSaveAsDialog">
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
			</ThemeDialog>

			<ThemeDialog :open="renameDialog.open" title="Rename theme" @close="closeRenameDialog">
				<p class="text-sm text-gray-600 mt-2">Only inactive themes can be renamed.</p>
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
			</ThemeDialog>

			<ApplyExplanationDialog
				:open="applyExplanationDialog.open"
				:app="applyExplanationDialog.app"
				:app-title="applyExplanationDialog.title"
				@close="closeApplyExplanationDialog"
				@acknowledged="onApplyExplanationAcknowledged"
			/>

			<ThemeDialog :open="deleteDialog.open" title="Delete theme" @close="closeDeleteDialog">
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
			</ThemeDialog>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router"
import { locateThemeStyle, locateThemeStyleField } from "@/domain/themeStyleLocations"
import { ref, reactive, watch, computed, onUnmounted, onMounted, nextTick } from "vue"
import { createResource } from "frappe-ui"
import { useThemeManagement } from "@/composables/useThemeManagement"
import { effectiveRoleHex, resolveNeutralIntoPayload } from "@/utils/color-shades"
import { STATUS_COLOR_DEFAULTS, STATUS_COLOR_KEYS } from "@/composables/useThemeDefaults"
import EditorSection from "@/components/EditorSection.vue"
import BrandColorPicker, { type BrandPaletteMode, type FgPreviewMode } from "@/components/BrandColorPicker.vue"
import NeutralColorPicker from "@/components/NeutralColorPicker.vue"
import SelectField from "@/components/SelectField.vue"
import FontSelectField from "@/components/FontSelectField.vue"
import PasswordField from "@/components/PasswordField.vue"
import SwatchPicker from "@/components/SwatchPicker.vue"
import ShadowDirectionDial from "@/components/ShadowDirectionDial.vue"
import ThemeClassCatalogPanel from "@/components/ThemeClassCatalogPanel.vue"
import ThemeEditorHeader from "@/components/ThemeEditorHeader.vue"
import ThemeDialog from "@/components/ThemeDialog.vue"
import ApplyExplanationDialog from "@/components/ApplyExplanationDialog.vue"
import { fontStack as fontCSS } from "@/utils/fonts"
import {
	WEB_THEME_DEFAULTS,
	WEB_THEME_FIELDS,
	parseFlipShade,
	type WebThemeFormKey,
} from "@/domain/webThemeForm"
import {
	computeThemeCssVariables,
	focusCheckEnabled,
	isCorporateBrandPaletteMode,
	normalizeBrandPaletteMode,
	normalizeTableWidthTier,
	roleShadeAdjustments,
} from "@/utils/themeCssVariables"
import {
	BODY_WEIGHT_MAX,
	BODY_WEIGHT_MIN,
	clampFontWeight,
	weightDisplayLabel,
} from "@/utils/fontWeight"
import { PREVIEW_POPUP_FEATURES } from "@/utils/previewWindow"
import {
	BORDER_RADIUS_MAP,
	FONT_OPTIONS,
	GAMMA_SAT_ROLE_FIELDS,
	LINE_HEIGHT_MAP,
	RETIRED_FONT_ALIASES,
} from "@/domain/theme-tokens"

/*
 * AGENT NAVIGATION — ThemeSettingsPage.vue (~1750 lines, single-file editor)
 *
 * Template: grep "AGENT:TAB" for tab panels (colours | typography | layout | advanced | system)
 * Script:   grep "AGENT:" below for logic sections
 *
 * Related files:
 *   composables/useThemeManagement.ts — dialogs, permissions, CRUD (shared with Desk page)
 *   composables/useThemeEditor.ts     — load/save/dirty/list wiring (used by useThemeManagement)
 *   domain/theme-tokens.ts         — token maps (generated from theme_tokens.py)
 *   utils/color-shades.ts          — OKLCH preview math (keep in sync with theme_color_utils.py)
 *   themes/api.py                    — whitelisted save/get/restore endpoints
 *   themes/data/base_theme.json      — app fixture loaded by Restore to Base Theme
 */

// ─── AGENT:preview-window ─── openPreview, postMessage to ThemePreviewPage popup

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
		PREVIEW_POPUP_FEATURES,
	)
	if (previewWin) {
		previewWin.addEventListener("load", () => pushToPreview())
	}
}

// ─── AGENT:live-css-vars ─── computeCSSVariables (wrapper), resetBrandPaletteAdjustments, pushToPreview

function computeCSSVariables(): Record<string, string> {
	return computeThemeCssVariables(form, DEFAULTS)
}

function resetBrandPaletteAdjustments() {
	for (const field of GAMMA_SAT_ROLE_FIELDS) {
		form[`${field}_gamma` as FormKey] = 0
		form[`${field}_saturation` as FormKey] = 100
	}
}

function pushToPreview() {
	if (!previewWin || previewWin.closed) return
	previewWin.postMessage({ type: "nce-theme-update", variables: computeCSSVariables() }, "*")
}

onUnmounted(() => {
	if (previewWin && !previewWin.closed) previewWin.close()
})

// ─── AGENT:form-state ─── form reactive, DEFAULTS, ALL_FIELDS, tabs, activeTab

const activeTab = ref("colors")

const primaryFgPreviewMode = ref<FgPreviewMode>("mono")
const secondaryFgPreviewMode = ref<FgPreviewMode>("mono")

const tabs = [
	{ id: "colors", label: "Colours" },
	{ id: "typography", label: "Typography" },
	{ id: "layout", label: "Layout" },
	{ id: "interaction", label: "Interaction" },
	{ id: "advanced", label: "Advanced" },
	{ id: "applications", label: "Applications" },
	{ id: "system", label: "System" },
]

type ThemeAppRow = {
	app: string
	title: string
	apply: boolean
	theme_slug: string
	busy: boolean
	acknowledged: boolean
	files_status: string
}

const themeApps = ref<ThemeAppRow[]>([])
const themeAppsError = ref("")
const activeThemes = ref<Array<{ slug: string; theme_name: string }>>([])

const themeAppsResource = createResource({
	url: "themes.component_api.list_theme_apps",
	auto: true,
	onSuccess(data: {
		apps?: Array<{
			app: string
			title: string
			apply: boolean
			theme_slug?: string
			acknowledged?: boolean
			files_status?: string
		}>
		active_themes?: Array<{ slug: string; theme_name: string }>
	}) {
		themeAppsError.value = ""
		activeThemes.value = data?.active_themes || []
		themeApps.value = (data?.apps || []).map((row) => ({
			app: row.app,
			title: row.title,
			apply: row.apply,
			theme_slug: row.theme_slug ?? "",
			busy: false,
			acknowledged: row.acknowledged ?? false,
			files_status: row.files_status ?? "not_applied",
		}))
	},
	onError(err: { message?: string }) {
		themeAppsError.value = err?.message || "Could not load applications."
	},
})

const setThemeAppResource = createResource({
	url: "themes.component_api.set_theme_app_apply",
	auto: false,
})

const setThemeSlugResource = createResource({
	url: "themes.component_api.set_theme_app_theme",
	auto: false,
})

function themeAppApplyChecked(row: ThemeAppRow): boolean {
	return row.apply && row.files_status !== "removed_by_update"
}

function themeAppApplyCheckboxDisabled(row: ThemeAppRow): boolean {
	if (row.busy) return true
	if (themeAppApplyChecked(row)) return false
	return !row.theme_slug || !row.acknowledged
}

function themeAppApplyCheckboxMuted(row: ThemeAppRow): boolean {
	if (row.busy) return false
	if (themeAppApplyChecked(row)) return false
	return !row.theme_slug || !row.acknowledged
}

function themeAppApplyCheckboxTitle(row: ThemeAppRow): string {
	if (row.busy || themeAppApplyChecked(row)) return ""
	if (!row.theme_slug) return "Choose a theme first"
	if (!row.acknowledged) return "Read the explanation first"
	return ""
}

const applyExplanationDialog = reactive({
	open: false,
	app: "",
	title: "",
})

function openApplyExplanationDialog(row: ThemeAppRow) {
	applyExplanationDialog.app = row.app
	applyExplanationDialog.title = row.title
	applyExplanationDialog.open = true
}

function closeApplyExplanationDialog() {
	applyExplanationDialog.open = false
}

function onApplyExplanationAcknowledged(app: string) {
	const row = themeApps.value.find((r) => r.app === app)
	if (row) row.acknowledged = true
}

async function onThemeAppApply(row: ThemeAppRow, apply: boolean) {
	const previous = row.apply
	row.apply = apply
	row.busy = true
	themeAppsError.value = ""
	try {
		await setThemeAppResource.submit({ app: row.app, apply: apply ? 1 : 0 })
		await themeAppsResource.reload()
	} catch (err) {
		row.apply = previous
		themeAppsError.value = (err as { message?: string })?.message || "Could not update " + row.title
	} finally {
		row.busy = false
	}
}

async function onThemeAppTheme(row: ThemeAppRow, slug: string) {
	const previous = row.theme_slug
	row.theme_slug = slug
	row.busy = true
	themeAppsError.value = ""
	try {
		await setThemeSlugResource.submit({ app: row.app, slug })
	} catch (err) {
		row.theme_slug = previous
		themeAppsError.value =
			(err as { message?: string })?.message || "Could not update theme for " + row.title
	} finally {
		row.busy = false
	}
}

type ExportThemeRow = {
	name: string
	theme_name: string
	slug: string
	status: string
}

const exportThemes = ref<ExportThemeRow[]>([])
const exportThemesError = ref("")
const exportSelectedNames = ref<string[]>([])
const exportIncludeFrappeUiBridge = ref(false)
const exportDownloadMessage = ref("")
const exportThemesTabLoaded = ref(false)

const exportThemesResource = createResource({
	url: "themes.api.list_export_themes",
	auto: false,
	onSuccess(data: ExportThemeRow[] | null | undefined) {
		exportThemesError.value = ""
		const list = Array.isArray(data) ? data : []
		exportThemes.value = list
		initExportSelection(list)
	},
	onError(err: { message?: string }) {
		exportThemesError.value = err?.message || "Could not load themes for export."
	},
})

watch(activeTab, (tab) => {
	if (tab === "applications" && !exportThemesTabLoaded.value) {
		exportThemesTabLoaded.value = true
		exportThemesResource.reload()
	}
})

function exportThemeHasSlug(theme: ExportThemeRow): boolean {
	return Boolean(theme.slug?.trim())
}

function isExportThemeSelected(name: string): boolean {
	return exportSelectedNames.value.includes(name)
}

// A theme without a slug can only be the starting theme (the first one ticked), because
// users can only switch to themes that have a slug.
function exportCheckboxDisabled(theme: ExportThemeRow): boolean {
	if (exportThemeHasSlug(theme)) return false
	if (isExportThemeSelected(theme.name)) return false
	return exportSelectedNames.value.length > 0
}

const exportDownloadDisabled = computed(() => exportSelectedNames.value.length === 0)

// The starting theme is the first theme ticked.
const exportDefaultThemeName = computed(() => exportSelectedNames.value[0] ?? "")

const exportStartsWithLine = computed(() => {
	const defaultName = exportDefaultThemeName.value
	if (!defaultName) return ""
	const theme = exportThemes.value.find((row) => row.name === defaultName)
	const label = theme?.theme_name ?? defaultName
	if (exportSelectedNames.value.length === 1) {
		return `Starts with: ${label}.`
	}
	return `Starts with: ${label}. Users can switch to the others.`
})

function initExportSelection(themes: ExportThemeRow[]) {
	void themes
	exportSelectedNames.value = []
	exportDownloadMessage.value = ""
}

function onExportThemeToggle(theme: ExportThemeRow, checked: boolean) {
	const names = new Set(exportSelectedNames.value)
	if (checked) {
		names.add(theme.name)
	} else {
		names.delete(theme.name)
	}
	exportSelectedNames.value = [...names]
	exportDownloadMessage.value = ""
}

function downloadExportBundle() {
	const defaultTheme = exportDefaultThemeName.value
	if (!exportSelectedNames.value.length || !defaultTheme) return
	const themesJson = JSON.stringify(exportSelectedNames.value)
	const bridge = exportIncludeFrappeUiBridge.value ? 1 : 0
	const url =
		"/api/method/themes.api.export_theme_bundle?themes=" +
		encodeURIComponent(themesJson) +
		"&default_theme=" +
		encodeURIComponent(defaultTheme) +
		"&include_frappe_ui_bridge=" +
		String(bridge)
	const link = document.createElement("a")
	link.href = url
	link.download = ""
	document.body.appendChild(link)
	link.click()
	link.remove()
	exportDownloadMessage.value =
		"Downloading nce-themes zip. Open README.txt inside for the three steps."
}

const ALL_FIELDS = WEB_THEME_FIELDS
type FormKey = WebThemeFormKey
const DEFAULTS = WEB_THEME_DEFAULTS

const PAYLOAD_FIELDS = [
	...ALL_FIELDS.filter((k) => k !== "theme_name"),
	"neutral_color",
	"neutral_color_shades",
] as const

const form = reactive<Record<FormKey, any>>({ ...DEFAULTS })

const brandPaletteMode = computed(
	(): BrandPaletteMode => normalizeBrandPaletteMode(form.brand_palette_mode),
)
const isCorporateBrandPalette = computed(() => brandPaletteMode.value === "corporate")

const primaryShadeAdjust = computed(() => roleShadeAdjustments(form, "primary_color"))
const secondaryShadeAdjust = computed(() => roleShadeAdjustments(form, "secondary_color"))

function onBrandPaletteModeChange(event: Event) {
	const checked = (event.target as HTMLInputElement).checked
	form.brand_palette_mode = checked ? "corporate" : "flexible"
	if (checked) {
		resetBrandPaletteAdjustments()
	}
}

// ─── AGENT:colour-fields ─── statusColors, textColors (typography tab), surfaceColors (Colours tab)

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
]

const tableColors = [
	{ key: "table_header_bg_color", label: "Header row" },
	{ key: "row_color", label: "Row (main / even)" },
	{ key: "row_alt_color", label: "Row (alternate / odd)" },
	{ key: "table_row_divider_color", label: "Horizontal line" },
	{ key: "table_col_divider_color", label: "Vertical line" },
]

const tableWidths = [
	{ key: "table_row_divider_width", label: "Horizontal thickness" },
	{ key: "table_col_divider_width", label: "Vertical thickness" },
]

const borderWidthTierOptions = [
	{ value: "thin", label: "Thin" },
	{ value: "normal", label: "Normal" },
	{ value: "strong", label: "Strong" },
]

const tablePreviewRows = [
	{ id: "101", name: "Alpha", status: "Active" },
	{ id: "102", name: "Beta", status: "Pending" },
	{ id: "103", name: "Gamma", status: "Active" },
	{ id: "104", name: "Delta", status: "Closed" },
]

// ─── AGENT:select-options ─── fontOptions, radiusOptions, normalizeFontChoice, body weight

// Retired picker options — map to Public Sans when loading saved themes.
function normalizeFontChoice(name: string): string {
	return RETIRED_FONT_ALIASES[name] || name
}

const fontOptions = [...FONT_OPTIONS]
const sizeOptions = ["12px", "13px", "14px", "15px", "16px", "18px"]
const lineHeightOptions = ["tight", "snug", "normal", "relaxed", "loose"]
const FONT_WEIGHT_KEYS = new Set<FormKey>([
	"font_weight_body",
	"font_weight_medium",
	"font_weight_semibold",
	"font_weight_bold",
])

const extraFontWeightControls: Array<{
	key: FormKey
	label: string
	sampleClass: string
	sampleText: string
}> = [
	{
		key: "font_weight_medium",
		label: "Medium Weight",
		sampleClass: "theme-font-medium",
		sampleText: "Medium weight sample line",
	},
	{
		key: "font_weight_semibold",
		label: "Semibold Weight",
		sampleClass: "theme-font-semibold",
		sampleText: "Semibold weight sample line",
	},
	{
		key: "font_weight_bold",
		label: "Bold Weight",
		sampleClass: "theme-font-bold",
		sampleText: "Bold weight sample line",
	},
]

function fontWeightFallback(key: FormKey): number {
	return Number(DEFAULTS[key]) || 400
}

function fontWeightNumber(key: FormKey): number {
	return clampFontWeight(form[key], fontWeightFallback(key))
}

function fontWeightDisplay(key: FormKey): string {
	return weightDisplayLabel(fontWeightNumber(key))
}

const bodyWeightNumber = computed(() => fontWeightNumber("font_weight_body"))

const bodyWeightDisplay = computed(() => fontWeightDisplay("font_weight_body"))

function onFontWeightInput(key: FormKey, e: Event) {
	form[key] = String((e.target as HTMLInputElement).value)
}

const hoverBgShadeOptions = ["50", "100", "200", "300"]
const hoverBorderShadeOptions = ["400", "500", "600", "700"]
const focusRingWidthOptions = ["1px", "2px", "3px", "4px"]
const focusRingOffsetOptions = ["0px", "1px", "2px", "3px", "4px"]
const disabledOpacityOptions = ["0.3", "0.4", "0.5", "0.6", "0.7"]
const pressedShiftOptions = ["0px", "1px", "2px"]

const selectedButtonSize = ref<"sm" | "md" | "lg">("md")

const buttonSizeRows = [
	{
		label: "Small",
		prefix: "sm" as const,
		fields: [
			{ key: "btn_sm_font_size" as const, label: "Font size", kind: "font" as const },
			{ key: "btn_sm_min_height" as const, label: "Min height", kind: "min" as const },
			{ key: "btn_sm_pad_y" as const, label: "Padding top/bottom", kind: "padY" as const },
			{ key: "btn_sm_pad_x" as const, label: "Padding left/right", kind: "padX" as const },
		],
	},
	{
		label: "Medium",
		prefix: "md" as const,
		fields: [
			{ key: "btn_md_font_size" as const, label: "Font size", kind: "font" as const },
			{ key: "btn_md_min_height" as const, label: "Min height", kind: "min" as const },
			{ key: "btn_md_pad_y" as const, label: "Padding top/bottom", kind: "padY" as const },
			{ key: "btn_md_pad_x" as const, label: "Padding left/right", kind: "padX" as const },
		],
	},
	{
		label: "Large",
		prefix: "lg" as const,
		fields: [
			{ key: "btn_lg_font_size" as const, label: "Font size", kind: "font" as const },
			{ key: "btn_lg_min_height" as const, label: "Min height", kind: "min" as const },
			{ key: "btn_lg_pad_y" as const, label: "Padding top/bottom", kind: "padY" as const },
			{ key: "btn_lg_pad_x" as const, label: "Padding left/right", kind: "padX" as const },
		],
	},
]

const selectedButtonRow = computed(
	() => buttonSizeRows.find((row) => row.prefix === selectedButtonSize.value) ?? buttonSizeRows[1],
)

function cssLength(raw: unknown, fallback: string): string {
	const value = String(raw ?? "").trim()
	if (!value) return fallback
	return /^-?\d+(\.\d+)?$/.test(value) ? value + "px" : value
}

const sizeOptionLists = {
	font: ["10px", "12px", "13px", "14px", "15px", "16px", "18px", "20px", "24px"],
	padY: ["0px", "2px", "4px", "6px", "8px", "10px", "12px", "16px"],
	padX: ["8px", "12px", "16px", "20px", "24px", "28px", "32px"],
	min: ["24px", "28px", "32px", "36px", "40px", "44px", "48px", "56px"],
} as const

type SizeField = (typeof buttonSizeRows)[number]["fields"][number]

function buttonSizeOptions(kind: SizeField["kind"]): readonly string[] {
	return sizeOptionLists[kind]
}

const sizeOther = ref<Partial<Record<SizeField["key"], boolean>>>({})

function sizeChoice(field: SizeField): string {
	if (sizeOther.value[field.key]) return "other"
	const value = cssLength(form[field.key], "")
	return buttonSizeOptions(field.kind).includes(value) ? value : "other"
}

function onSizeChoice(field: SizeField, value: string) {
	if (value === "other") {
		sizeOther.value = { ...sizeOther.value, [field.key]: true }
		return
	}
	sizeOther.value = { ...sizeOther.value, [field.key]: false }
	form[field.key] = value
}

function ensureCssPx(key: SizeField["key"]) {
	const current = String(form[key] ?? "").trim()
	if (!current) return
	form[key] = cssLength(current, current)
}

function buttonSizeStyle(prefix: "sm" | "md" | "lg") {
	const fontKey = `btn_${prefix}_font_size` as const
	const padYKey = `btn_${prefix}_pad_y` as const
	const padXKey = `btn_${prefix}_pad_x` as const
	const minKey = `btn_${prefix}_min_height` as const
	return {
		fontSize: cssLength(form[fontKey], DEFAULTS[fontKey]),
		padding: `${cssLength(form[padYKey], DEFAULTS[padYKey])} ${cssLength(form[padXKey], DEFAULTS[padXKey])}`,
		minHeight: cssLength(form[minKey], DEFAULTS[minKey]),
	}
}

const buttonPreviewVars = computed(() => ({
	"--nce-btn-sm-font-size": String(form.btn_sm_font_size || DEFAULTS.btn_sm_font_size),
	"--nce-btn-sm-pad-y": String(form.btn_sm_pad_y || DEFAULTS.btn_sm_pad_y),
	"--nce-btn-sm-pad-x": String(form.btn_sm_pad_x || DEFAULTS.btn_sm_pad_x),
	"--nce-btn-sm-min-height": String(form.btn_sm_min_height || DEFAULTS.btn_sm_min_height),
	"--nce-btn-md-font-size": String(form.btn_md_font_size || DEFAULTS.btn_md_font_size),
	"--nce-btn-md-pad-y": String(form.btn_md_pad_y || DEFAULTS.btn_md_pad_y),
	"--nce-btn-md-pad-x": String(form.btn_md_pad_x || DEFAULTS.btn_md_pad_x),
	"--nce-btn-md-min-height": String(form.btn_md_min_height || DEFAULTS.btn_md_min_height),
	"--nce-btn-lg-font-size": String(form.btn_lg_font_size || DEFAULTS.btn_lg_font_size),
	"--nce-btn-lg-pad-y": String(form.btn_lg_pad_y || DEFAULTS.btn_lg_pad_y),
	"--nce-btn-lg-pad-x": String(form.btn_lg_pad_x || DEFAULTS.btn_lg_pad_x),
	"--nce-btn-lg-min-height": String(form.btn_lg_min_height || DEFAULTS.btn_lg_min_height),
}))

/** Map hover token shades onto the shades baked into published theme-hover-* rules (100 / 500). */
const interactionFocusPreviewAttrs = computed(() => ({
	"data-focus-ring-enabled": focusCheckEnabled(form.focus_ring_enabled) ? "1" : "0",
	"data-focus-fill-enabled": focusCheckEnabled(form.focus_fill_enabled) ? "1" : "0",
	"data-button-outline-enabled": form.button_outline_enabled ? "1" : "0",
}))

const interactionPreviewVars = computed(() => {
	const vars: Record<string, string> = { ...liveVars.value }
	const bgShade = String(form.hover_bg_shade || DEFAULTS.hover_bg_shade)
	const borderShade = String(form.hover_border_shade || DEFAULTS.hover_border_shade)
	for (const role of [
		"primary",
		"secondary",
		"accent",
		"success",
		"info",
		"warning",
		"danger",
		"neutral",
	] as const) {
		const bgHex = vars[`--nce-color-${role}-${bgShade}`]
		const bgFg = vars[`--nce-color-${role}-${bgShade}-fg`]
		if (bgHex) {
			vars[`--nce-color-${role}-100`] = bgHex
			if (bgFg) vars[`--nce-color-${role}-100-fg`] = bgFg
		}
		const borderHex = vars[`--nce-color-${role}-${borderShade}`]
		if (borderHex) vars[`--nce-color-${role}-500`] = borderHex
	}
	return vars
})
const radiusOptions = ["none", "sm", "md", "lg", "x-lg"]
const borderWidthOptions = ["0.5px", "1px", "2px", "3px"]
const spacingOptions = ["tight", "normal", "relaxed"]
const shadowOptions = ["none", "sm", "md", "lg", "xl", "2xl", "3xl"]

function clampShadowOpacity(raw: unknown): number {
	const n = Number(raw)
	if (!Number.isFinite(n)) return DEFAULTS.shadow_opacity
	return Math.max(0, Math.min(100, Math.round(n)))
}

const shadowOpacityNumber = computed(() => clampShadowOpacity(form.shadow_opacity))

const shadowOpacityDisplay = computed(() => `${shadowOpacityNumber.value}%`)

function onShadowOpacityInput(e: Event) {
	form.shadow_opacity = clampShadowOpacity((e.target as HTMLInputElement).value)
}

function clampShadowDirection(raw: unknown): number {
	const n = Number(raw)
	if (!Number.isFinite(n)) return DEFAULTS.shadow_direction
	return Math.max(0, Math.min(360, Math.round(n)))
}
const sidebarOptions = ["200px", "220px", "240px", "260px", "280px"]
const containerOptions = ["960px", "1024px", "1152px", "1280px", "1440px", "full"]
const transitionOptions = ["fast", "normal", "slow"]

// ─── AGENT:computed-ui ─── fontCSS, lineHeightCSS

const lineHeightCSS = computed(
	() => LINE_HEIGHT_MAP[form.line_height] || "1.5",
)

// ─── AGENT:save-base-theme-dialog ─── confirm before bundling base_theme.json (web page only)

const saveBaseThemeDialog = reactive({
	open: false,
	busy: false,
	error: "",
})

const restoreToBaseDialog = reactive({
	open: false,
	busy: false,
	error: "",
})

function themeOptionLabel(t: { theme_name: string }) {
	return t.theme_name
}

// ─── AGENT:payload-serialization ─── buildPayloadFromForm, canonicalPayload, applyPayloadToForm

function buildPayloadFromForm(): Record<string, any> {
	const payload: Record<string, any> = {}
	for (const key of PAYLOAD_FIELDS) {
		if (key === "neutral_color" || key === "neutral_color_shades") continue
		payload[key] =
			key === "dark_mode" ||
			key === "focus_ring_enabled" ||
			key === "focus_fill_enabled" ||
			key === "button_outline_enabled"
				? form[key]
					? 1
					: 0
				: form[key]
	}
	payload.brand_palette_mode = normalizeBrandPaletteMode(payload.brand_palette_mode)
	if (isCorporateBrandPaletteMode(payload.brand_palette_mode)) {
		for (const field of GAMMA_SAT_ROLE_FIELDS) {
			payload[`${field}_gamma`] = 0
			payload[`${field}_saturation`] = 100
		}
	} else {
		for (const field of GAMMA_SAT_ROLE_FIELDS) {
			const hex = payload[field]
			const gamma = Number(payload[`${field}_gamma`] ?? 0)
			const saturation = Number(payload[`${field}_saturation`] ?? 100)
			if (typeof hex === "string" && (gamma !== 0 || saturation !== 100)) {
				payload[field] = effectiveRoleHex(hex, gamma, saturation)
			}
		}
	}
	return resolveNeutralIntoPayload(payload)
}

function canonicalPayload(source: Record<string, any>): Record<string, any> {
	const payload: Record<string, any> = {}
	for (const key of PAYLOAD_FIELDS) {
		let val = source[key]
		if (val === undefined || val === null) {
			val = DEFAULTS[key as FormKey]
		}
		if (key === "dark_mode" || key === "button_outline_enabled") {
			payload[key] = val === true || val === 1 || val === "1" ? 1 : 0
		} else if (key === "focus_ring_enabled" || key === "focus_fill_enabled") {
			payload[key] =
				val === undefined || val === null || val === ""
					? 1
					: val === true || val === 1 || val === "1"
						? 1
						: 0
		} else if (key.endsWith("_gamma")) {
			payload[key] = Number(val) || 0
		} else if (key.endsWith("_saturation")) {
			const n = Number(val)
			payload[key] = Number.isFinite(n) ? n : 100
		} else if (key.endsWith("_warmth")) {
			const n = Number(val)
			payload[key] = Number.isFinite(n) ? n : 0
		} else if (key === "neutral_color_shades") {
			const raw =
				val && typeof val === "object" && !Array.isArray(val)
					? (val as Record<string, string>)
					: (resolveNeutralIntoPayload({
							neutral_color_warmth: source.neutral_color_warmth ?? DEFAULTS.neutral_color_warmth,
						}).neutral_color_shades as Record<string, string>)
			const norm: Record<string, string> = {}
			for (const [shade, hex] of Object.entries(raw)) {
				norm[String(shade)] = String(hex).toUpperCase()
			}
			payload[key] = norm
		} else if (key === "neutral_color") {
			payload[key] = String(
				val ??
					resolveNeutralIntoPayload({
						neutral_color_warmth: source.neutral_color_warmth ?? DEFAULTS.neutral_color_warmth,
					}).neutral_color,
			).toUpperCase()
		} else if (key.endsWith("_color") && typeof val === "string") {
			payload[key] = val.toUpperCase()
		} else if (FONT_WEIGHT_KEYS.has(key as FormKey)) {
			payload[key] = String(
				clampFontWeight(val ?? DEFAULTS[key as FormKey], fontWeightFallback(key as FormKey)),
			)
		} else if (key === "shadow_opacity") {
			payload[key] = clampShadowOpacity(val ?? DEFAULTS.shadow_opacity)
		} else if (key === "shadow_direction") {
			payload[key] = clampShadowDirection(val ?? DEFAULTS.shadow_direction)
		} else if (key === "brand_palette_mode") {
			payload[key] = normalizeBrandPaletteMode(val ?? DEFAULTS.brand_palette_mode)
		} else if (
			key.endsWith("_fg_flip_mono") ||
			key.endsWith("_fg_flip_tonal") ||
			key.endsWith("_fg_pole_tonal_dark") ||
			key.endsWith("_fg_pole_tonal_light")
		) {
			if (val === null || val === undefined || val === "") {
				payload[key] = null
			} else {
				const n = Number(val)
				payload[key] = Number.isFinite(n) ? Math.round(n) : null
			}
		} else if (key === "custom_css" || key === "tailwind_overrides") {
			payload[key] = String(val ?? "")
		} else {
			payload[key] = val
		}
	}
	return payload
}

function applyPayloadToForm(payload: Record<string, any>) {
	for (const key of ALL_FIELDS) {
		form[key] = DEFAULTS[key]
	}
	for (const key of ALL_FIELDS) {
		if (key === "theme_name") continue
		const val = payload[key]
		if (key === "dark_mode") {
			form[key] = !!val
		} else if (key === "button_outline_enabled") {
			form[key] = val === true || val === 1 || val === "1"
		} else if (key === "focus_ring_enabled" || key === "focus_fill_enabled") {
			form[key] = focusCheckEnabled(val)
		} else if (key === "border_radius" && val === "full") {
			form[key] = "x-lg"
		} else if (
			(key === "font_family" || key === "heading_font_family") &&
			typeof val === "string"
		) {
			form[key] = normalizeFontChoice(val)
		} else if (FONT_WEIGHT_KEYS.has(key)) {
			form[key] = String(clampFontWeight(val, fontWeightFallback(key)))
		} else if (key === "shadow_opacity") {
			form[key] = clampShadowOpacity(val ?? DEFAULTS.shadow_opacity)
		} else if (key === "shadow_direction") {
			form[key] = clampShadowDirection(val ?? DEFAULTS.shadow_direction)
		} else if (key === "table_row_divider_width" || key === "table_col_divider_width") {
			form[key] = normalizeTableWidthTier(val ?? DEFAULTS[key])
		} else if (
			key.endsWith("_fg_flip_mono") ||
			key.endsWith("_fg_flip_tonal") ||
			key.endsWith("_fg_pole_tonal_dark") ||
			key.endsWith("_fg_pole_tonal_light")
		) {
			if (val === null || val === undefined || val === "") {
				form[key] = null
			} else {
				const n = Number(val)
				form[key] = Number.isFinite(n) ? Math.round(n) : null
			}
		} else if (val !== undefined && val !== null) {
			form[key] = val
		}
	}
	for (const field of GAMMA_SAT_ROLE_FIELDS) {
		if (isCorporateBrandPaletteMode(form.brand_palette_mode)) {
			form[`${field}_gamma` as FormKey] = 0
			form[`${field}_saturation` as FormKey] = 100
			continue
		}
		const hex = form[field as FormKey]
		if (typeof hex !== "string") continue
		const gamma = Number(form[`${field}_gamma` as FormKey] ?? 0)
		const saturation = Number(form[`${field}_saturation` as FormKey] ?? 100)
		if (gamma !== 0 || saturation !== 100) {
			form[field as FormKey] = effectiveRoleHex(hex, gamma, saturation)
		}
	}
	form.brand_palette_mode = normalizeBrandPaletteMode(form.brand_palette_mode)
	migrateFgFlipFields(payload)
}

function migrateFgFlipFields(payload: Record<string, any>) {
	for (const role of ["primary_color", "secondary_color"] as const) {
		const monoKey = `${role}_fg_flip_mono` as FormKey
		if (form[monoKey] == null) {
			const direct = parseFlipShade(payload[monoKey])
			if (direct != null) {
				form[monoKey] = direct
			} else {
				const dual2 = parseFlipShade(payload[`${role}_fg_flip_mono_2`])
				const dual1 = parseFlipShade(payload[`${role}_fg_flip_mono_1`])
				const migrated = dual2 ?? dual1
				if (migrated != null) form[monoKey] = migrated
			}
		}

		const tonalKey = `${role}_fg_flip_tonal` as FormKey
		if (form[tonalKey] == null) {
			const direct = parseFlipShade(payload[tonalKey])
			if (direct != null) {
				form[tonalKey] = direct
			} else {
				const dual2 = parseFlipShade(payload[`${role}_fg_flip_tonal_2`])
				const dual1 = parseFlipShade(payload[`${role}_fg_flip_tonal_1`])
				const migrated = dual2 ?? dual1
				if (migrated != null) form[tonalKey] = migrated
			}
		}

		const darkKey = `${role}_fg_pole_tonal_dark` as FormKey
		if (form[darkKey] == null) {
			const v = parseFlipShade(payload[darkKey])
			if (v != null) form[darkKey] = v
		}

		const lightKey = `${role}_fg_pole_tonal_light` as FormKey
		if (form[lightKey] == null) {
			const v = parseFlipShade(payload[lightKey])
			if (v != null) form[lightKey] = v
		}
	}
}

// ─── AGENT:theme-management ─── useThemeManagement (dialogs, permissions, CRUD; shared with Desk page)

const manager = useThemeManagement(
	{
		list: "themes.api.list_themes",
		getEditor: "themes.api.get_theme_editor",
		save: "themes.api.save_theme",
		rename: "themes.api.rename_theme",
		delete: "themes.api.delete_theme",
		create: "themes.api.create_theme",
		basePayload: "themes.api.get_base_theme_payload",
		saveAsBase: "themes.api.save_as_base_theme",
		getLastSelection: "themes.api.get_editor_theme_selection",
		setLastSelection: "themes.api.set_editor_theme_selection",
	},
	{
		applyPayloadToForm,
		buildPayloadFromForm,
		canonicalPayload,
		applyLiveThemeVars: () => applyLiveThemeVars(),
		defaultSavedStatus: "Active",
		notFoundMessage: "Theme not found.",
		loadErrorMessage: "Failed to load theme. Check permissions.",
		selectionStorageKey: "nce-themes-editor-theme",
		pickInitialTheme: (data) =>
			(data.find((t) => t.is_active)?.name as string | undefined) ||
			(data[0]?.name as string | undefined),
		onEditorLoaded: (data) => {
			if (data.theme_name) form.theme_name = data.theme_name as string
		},
	},
	{
		noun: "theme",
		untitledName: "Theme",
		hasDefaultTheme: false,
		themeOptionLabel,
		switchConfirmMessage: (p, themes) =>
			`Save your changes before switching to "${themes.find((t) => t.name === p)?.theme_name || p}"?`,
		pickAfterDelete: (themes) =>
			themes.find((t) => t.is_active)?.name || themes[0]?.name,
	},
)

const {
	loadingTheme,
	editorLoaded,
	editorError,
	switchError,
	editorMeta,
	isDirty,
	themesList,
	editorResource,
	confirmDialog,
	saveAsDialog,
	renameDialog,
	deleteDialog,
	systemTab,
	canSaveAsDefaultTheme,
	closeConfirmDialog,
	confirmSaveAndContinue,
	confirmDiscardAndContinue,
	handleSave,
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

const submitSaveAsBaseTheme = saveAsBaseTheme

// ─── AGENT:restore-to-app-fixture ─── loads data/base_theme.json into editor (unsaved preview)

async function requestRestoreToBase() {
	// Load bundled base theme payload into the Site Theme Editor form without saving.
	// If the editor has unsaved changes, confirm before replacing them.
	if (isDirty.value) {
		restoreToBaseDialog.error = ""
		restoreToBaseDialog.open = true
		return
	}
	await restoreToBaseConfirmed()
}

function closeRestoreToBaseDialog() {
	if (restoreToBaseDialog.busy) return
	restoreToBaseDialog.open = false
	restoreToBaseDialog.error = ""
}

async function confirmRestoreToBaseReplace() {
	restoreToBaseDialog.busy = true
	restoreToBaseDialog.error = ""
	try {
		await restoreToBaseConfirmed()
		restoreToBaseDialog.open = false
	} catch (err: any) {
		const msg = err?.message || "Could not restore base theme."
		restoreToBaseDialog.error = msg
	} finally {
		restoreToBaseDialog.busy = false
	}
}

// ─── AGENT:save-default-to-app ─── bundle base_theme.json + publish nce_theme.css (System tab)

function requestSaveAsBaseTheme() {
	if (!canSaveAsDefaultTheme.value || !systemTab.password) return
	saveBaseThemeDialog.error = ""
	saveBaseThemeDialog.open = true
}

function closeSaveBaseThemeDialog() {
	if (saveBaseThemeDialog.busy) return
	saveBaseThemeDialog.open = false
	saveBaseThemeDialog.error = ""
}

async function confirmSaveAsBaseTheme() {
	saveBaseThemeDialog.busy = true
	saveBaseThemeDialog.error = ""
	systemTab.error = ""
	systemTab.success = ""
	try {
		await handleSave()
		await submitSaveAsBaseTheme()
		saveBaseThemeDialog.open = false
	} catch (err: any) {
		const msg = err?.message || "Could not save as base theme."
		saveBaseThemeDialog.error = msg
		systemTab.error = msg
	} finally {
		saveBaseThemeDialog.busy = false
	}
}

// Live --nce-* vars for in-editor samples + preview window (debounced preview push)
let pushTimer: ReturnType<typeof setTimeout> | null = null
const liveVars = ref<Record<string, string>>({})

function applyLiveThemeVars() {
	if (!editorLoaded.value) return
	const vars = computeCSSVariables()
	const next: Record<string, string> = {}
	for (const [key, value] of Object.entries(vars)) {
		if (value) next[key] = value
	}
	liveVars.value = next
	if (pushTimer) clearTimeout(pushTimer)
	pushTimer = setTimeout(pushToPreview, 80)
}

// ─── AGENT:form-watch ─── deep watch form → applyLiveThemeVars (includes preview sync)

watch(form, () => {
	applyLiveThemeVars()
}, { deep: true })

const route = useRoute()

// Deep link from the swatch picker's "Show in Themes App": ?kind= and ?role= pick the
// tab and section that edit that style.
let queryHighlightDone = false

// The link's ?theme= is a slug (or a theme name). The editor must be showing that theme
// before anything is scrolled to or highlighted.
function editorShowsQueryTheme(): boolean {
	const want = String(route.query.theme || "").trim().toLowerCase()
	if (!want) return true
	return (
		editorMeta.theme.toLowerCase() === want ||
		String(editorMeta.slug || "").toLowerCase() === want
	)
}

async function scrollToQueryRole() {
	const loc =
		locateThemeStyleField(String(route.query.style || "")) ||
		locateThemeStyle(String(route.query.kind || "bg"), String(route.query.role || ""))
	if (!loc) return
	activeTab.value = loc.tab
	await nextTick()
	const el =
		(loc.field && document.getElementById(`theme-style-field-${loc.field}`)) ||
		document.getElementById(loc.section)
	if (!el) return
	el.scrollIntoView({ behavior: "smooth", block: "center" })
	// Pulse an outline on the target so it is easy to spot (no CSS needed).
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
		if (!route.query.role && !route.query.style) return
		if (!editorShowsQueryTheme()) return
		queryHighlightDone = true
		void scrollToQueryRole()
	},
)

onMounted(() => {
	if (themesList.data?.length) {
		tryLoadThemeFromQuery(themesList.data)
	}
})
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

.editor-header :deep(.editor-title) {
	font-size: calc(var(--nce-font-size, 14px) * 1.375);
	font-weight: 600;
	font-family: var(--nce-font-heading, inherit);
	color: var(--nce-color-heading, #111827);
}

.editor-header :deep(.editor-subtitle) {
	font-size: calc(var(--nce-font-size, 14px) * 0.875);
	font-family: var(--nce-font-family, inherit);
	color: var(--nce-color-text, #374151);
}

.editor-header :deep(.editor-subtitle strong) {
	color: var(--nce-color-heading, #111827);
	font-weight: 600;
}

.editor-header :deep(.editor-status-label) {
	font-size: calc(var(--nce-font-size, 14px) * 0.875);
	color: var(--nce-color-muted, #6b7280);
	font-family: var(--nce-font-family, inherit);
}

.editor-header :deep(.editor-status-option) {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	font-size: calc(var(--nce-font-size, 14px) * 0.875);
	color: var(--nce-color-text, #374151);
	font-family: var(--nce-font-family, inherit);
	cursor: pointer;
}

.editor-header :deep(.editor-status-option input:disabled) {
	cursor: not-allowed;
}

.editor-header :deep(.editor-status-hint) {
	font-size: calc(var(--nce-font-size, 14px) * 0.75);
	color: var(--nce-color-muted, #6b7280);
}

.editor-header :deep(.editor-status-hint-warn) {
	color: var(--nce-color-warning, #d97706);
}

.editor-header :deep(.editor-warn) {
	color: var(--nce-color-warning, #d97706);
	font-weight: 500;
}

.editor-header :deep(.editor-muted) {
	color: var(--nce-color-muted, #9ca3af);
}

.editor-header :deep(.theme-select) {
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

.editor-header :deep(.theme-select:hover:not(:disabled)) {
	border-color: var(--nce-color-primary, #3b82f6);
	background-color: var(--nce-color-surface, #f9fafb);
}

.editor-header :deep(.theme-select:focus) {
	outline: none;
	border-color: var(--nce-color-focus, #3b82f6);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--nce-color-focus, #3b82f6) 22%, transparent);
}

.editor-header :deep(.theme-select:disabled) {
	opacity: 0.55;
	cursor: not-allowed;
}

.editor-header :deep(.editor-actions .theme-btn) {
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

.editor-header :deep(.editor-actions .theme-btn-primary:hover:not(:disabled)) {
	filter: brightness(1.08);
}

.editor-header :deep(.editor-actions .theme-btn:disabled) {
	opacity: 0.45;
	cursor: not-allowed;
}

.nce-size-choice {
	box-sizing: border-box;
	width: 100%;
	text-align: center;
	line-height: 1.4;
	cursor: pointer;
	background: var(--nce-color-primary, #1d4ed8);
	color: var(--nce-color-primary-fg, #fff);
	border: 1px solid var(--nce-color-primary, #1d4ed8);
	border-radius: var(--nce-border-radius, 0.375rem);
	transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.1s;
}
.nce-interaction-preview[data-button-outline-enabled="1"] .nce-size-choice:not(.is-selected) {
	background-color: transparent;
	border-color: var(--nce-color-primary, #1d4ed8);
	color: var(--nce-color-primary, #1d4ed8);
}
.nce-size-choice:hover {
	background: var(--nce-color-primary-100, #dbeafe);
	color: var(--nce-color-primary-100-fg, var(--nce-color-primary, #1d4ed8));
	border-color: var(--nce-color-primary-500, var(--nce-color-primary, #1d4ed8));
}
.nce-interaction-preview[data-focus-ring-enabled="1"] .nce-size-choice:focus-visible,
.nce-interaction-preview[data-focus-ring-enabled="1"] .nce-size-choice.is-selected {
	outline: var(--nce-focus-ring-width, 2px) solid var(--nce-color-focus, #3b82f6);
	outline-offset: var(--nce-focus-ring-offset, 2px);
}
.nce-interaction-preview[data-focus-ring-enabled="0"] .nce-size-choice:focus-visible,
.nce-interaction-preview[data-focus-ring-enabled="0"] .nce-size-choice.is-selected {
	outline: none;
	outline-offset: 0;
}
.nce-interaction-preview[data-focus-fill-enabled="1"] .nce-size-choice:focus-visible:not(:disabled) {
	background-color: var(--nce-color-primary, #1d4ed8);
	color: var(--nce-color-primary-fg, #fff);
	border-color: var(--nce-color-primary, #1d4ed8);
}
.nce-interaction-preview[data-focus-ring-enabled="0"] .theme-focus-ring:focus-visible,
.nce-interaction-preview[data-focus-ring-enabled="0"] .focus-ring:focus-visible,
.nce-interaction-preview[data-focus-ring-enabled="0"] [class*="theme-focus-ring-"]:focus-visible,
.nce-interaction-preview[data-focus-ring-enabled="0"] [class*="focus-ring-"]:focus-visible {
	outline: none !important;
	outline-offset: 0 !important;
}
.nce-size-choice:active {
	transform: translateY(var(--nce-pressed-shift, 1px));
}

.body-weight-slider {
	accent-color: var(--nce-color-primary, #3b82f6);
	height: 0.375rem;
	cursor: pointer;
}
:deep(.nce-editor-table-preview.theme-table) {
	border-collapse: collapse;
	width: 100%;
}
:deep(.nce-editor-table-preview.theme-table tbody tr:nth-child(even)) {
	background-color: var(--nce-color-row, var(--nce-color-surface));
}
:deep(.nce-editor-table-preview.theme-table tbody tr:nth-child(odd)) {
	background-color: var(--nce-color-row-alt, #f3f4f6);
}
:deep(.nce-editor-table-preview.theme-table td) {
	border-bottom: var(--nce-border-width-table-row, var(--nce-border-width-thin)) solid
		var(--nce-color-table-row-divider, var(--nce-color-border));
	border-right: var(--nce-border-width-table-col, var(--nce-border-width-thin)) solid
		var(--nce-color-table-col-divider, var(--nce-color-border));
}
:deep(.nce-editor-table-preview.theme-table td:last-child) {
	border-right: none;
}
:deep(.nce-editor-table-preview.theme-table thead th),
:deep(.nce-editor-table-preview.theme-table tfoot th),
:deep(.nce-editor-table-preview.theme-table tfoot td) {
	background-color: var(--nce-color-table-header, var(--nce-color-secondary));
	color: var(--nce-color-table-header-fg, var(--nce-color-text));
	border-right: var(--nce-border-width-table-col, var(--nce-border-width-thin)) solid
		var(--nce-color-table-col-divider, var(--nce-color-border));
}
:deep(.nce-editor-table-preview.theme-table thead th:last-child),
:deep(.nce-editor-table-preview.theme-table tfoot th:last-child),
:deep(.nce-editor-table-preview.theme-table tfoot td:last-child) {
	border-right: none;
}
:deep(.nce-editor-table-preview.theme-table tfoot td) {
	border-bottom: none;
}
</style>
