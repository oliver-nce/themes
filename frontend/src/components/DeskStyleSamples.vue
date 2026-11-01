<!--
Sample elements for each Desk Theme Editor style, driven live by Desk CSS variables.

-->

<script setup lang="ts">
defineProps<{
	vars: Record<string, string>
}>()

const surfaceSwatches = [
	{ label: "Page Background", varName: "--bg-color" },
	{ label: "Card / Form Surface", varName: "--fg-color" },
	{ label: "Subtle Surface", varName: "--surface-gray-2" },
	{ label: "List Header Background", varName: "--subtle-fg" },
]

const textSamples = [
	{ label: "Body Text", varName: "--text-color", class: "sample-body" },
	{ label: "Muted", varName: "--text-muted", class: "sample-muted" },
	{ label: "Light", varName: "--text-light", class: "sample-light" },
	{ label: "Heading", varName: "--heading-color", class: "sample-heading" },
]

const listRows = [
	{ name: "Website Redesign", status: "In Progress", date: "01 Feb 2026" },
	{ name: "Q1 Sales Report", status: "Completed", date: "28 Jan 2026" },
	{ name: "Vendor Onboarding", status: "Open", date: "15 Jan 2026" },
	{ name: "Inventory Audit", status: "On Hold", date: "10 Jan 2026" },
	{ name: "Training Module", status: "In Progress", date: "05 Jan 2026" },
]

const ganttWeeks = ["W1", "W2", "W3", "W4", "W5", "W6"]

const ganttRows = [
	{ label: "Discovery", barLeft: "4%", barWidth: "28%", progressWidth: "70%" },
	{ label: "Design", barLeft: "22%", barWidth: "32%", progressWidth: "45%" },
	{ label: "Build", barLeft: "38%", barWidth: "40%", progressWidth: "20%" },
	{ label: "Launch", barLeft: "62%", barWidth: "24%", progressWidth: "0%" },
]

const formFields = [
	{ label: "Customer", value: "Acme Industries" },
	{ label: "Territory", value: "North America" },
	{ label: "Order Type", value: "Standard" },
	{ label: "Delivery Date", value: "15 Mar 2026" },
]
</script>

<template>
	<div class="desk-samples" :style="vars">

		<div class="samples-layout">
			<!-- 1. Backgrounds & Surfaces -->
			<section>
				<h2 class="section-label">Backgrounds &amp; Surfaces</h2>
				<div class="preview-surface">
					<div class="swatch-grid">
						<div v-for="s in surfaceSwatches" :key="s.varName" class="swatch-item">
							<div
								class="swatch-tile"
								:class="{
									'swatch-tile--bg': s.varName === '--bg-color',
									'swatch-tile--fg': s.varName === '--fg-color',
									'swatch-tile--gray2': s.varName === '--surface-gray-2',
									'swatch-tile--subtle': s.varName === '--subtle-fg',
								}"
							/>
							<div class="swatch-label">{{ s.label }}</div>
							<div class="swatch-var">{{ s.varName }}</div>
						</div>
					</div>
				</div>
			</section>

			<!-- 2. Text Colours -->
			<section>
				<h2 class="section-label">Text Colours</h2>
				<div class="preview-surface">
					<div class="text-colour-stack">
						<div v-for="t in textSamples" :key="t.varName" class="text-colour-row">
							<span class="text-colour-meta">{{ t.label }} · {{ t.varName }}</span>
							<span :class="t.class">The quick brown fox jumps over the lazy dog.</span>
						</div>
					</div>
				</div>
			</section>

			<!-- 3. Typography -->
			<section>
				<h2 class="section-label">Typography</h2>
				<div class="preview-surface type-stack">
					<p class="type-lg">Large heading sample (--text-lg)</p>
					<p class="type-base">Body text at base size (--text-base)</p>
					<p class="type-sm">Field label (--text-sm)</p>
					<p class="type-xs">Small print and captions (--text-xs)</p>
					<p class="type-medium">Medium weight sample (--font-weight-medium)</p>
					<p class="type-bold">Bold sample (--nce-weight-bold)</p>
					<p class="type-regular">
						Regular paragraph weight using --font-weight-regular / --weight-regular for
						longer descriptive copy in forms and list views.
					</p>
				</div>
			</section>

			<!-- 4. Controls & Borders -->
			<section>
				<h2 class="section-label">Controls &amp; Borders</h2>
				<div class="preview-surface controls-stack">
					<div class="controls-row">
						<input type="text" class="control-input" value="Text input" aria-label="Sample text input" />
						<select class="control-select" aria-label="Sample select">
							<option>Option A</option>
							<option>Option B</option>
						</select>
						<input
							type="text"
							class="control-input control-input--on-gray"
							value="Sidebar filter"
							aria-label="Sidebar filter input"
						/>
					</div>
					<div class="controls-row">
						<button type="button" class="btn-toolbar">Toolbar default</button>
						<button type="button" class="btn-quick">Refresh</button>
						<button type="button" class="btn-quick">Filter</button>
						<button type="button" class="btn-quick">Add New</button>
						<button type="button" class="btn-quick">See All</button>
						<label class="checkbox-wrap">
							<input type="checkbox" class="control-checkbox" checked />
							<span class="type-sm">Checkbox</span>
						</label>
						<button type="button" class="btn-primary">Primary</button>
					</div>
					<div class="border-demo">
						<div class="border-line border-line--default">
							<span class="type-xs">Border · --border-color</span>
						</div>
						<div class="border-line border-line--strong">
							<span class="type-xs">Strong Border · --dark-border-color</span>
						</div>
					</div>
				</div>
			</section>

			<!-- 5. Corners & Sizes -->
			<section>
				<h2 class="section-label">Corners &amp; Sizes</h2>
				<div class="preview-surface sizes-stack">
					<div class="sizes-row">
						<div class="exhibit">
							<div class="size-box size-box--radius"></div>
							<code class="exhibit-label">--radius</code>
						</div>
					</div>
					<div class="sizes-row sizes-row--align">
						<div class="exhibit">
							<button type="button" class="btn-size btn-size--height">Button</button>
							<code class="exhibit-label">--btn-height</code>
						</div>
						<div class="exhibit">
							<input type="text" class="input-size" value="Input" aria-label="Sized input" />
							<code class="exhibit-label">--input-height</code>
						</div>
						<div class="exhibit">
							<input type="checkbox" class="checkbox-size" checked aria-label="Sized checkbox" />
							<code class="exhibit-label">--checkbox-size</code>
						</div>
					</div>
				</div>
			</section>

			<!-- 6. Density -->
			<section>
				<h2 class="section-label">Density</h2>
				<div class="preview-surface density-stack">
					<div class="density-chips">
						<span class="density-chip">--padding-xs</span>
						<span class="density-chip">Chip B</span>
					</div>
					<div class="density-control-pad">
						<button type="button" class="btn-density">--padding-sm control</button>
					</div>
					<div class="density-section-box">
						Section padding uses <code class="inline-code">--padding-md</code>
					</div>
					<div class="density-margins">
						<div class="density-block density-block--xs">--margin-xs</div>
						<div class="density-block density-block--sm">--margin-sm below</div>
					</div>
				</div>
			</section>

			<!-- 7. List View -->
			<section>
				<h2 class="section-label">List View</h2>
				<div class="list-container">
					<div class="list-header">
						<span>Name</span>
						<span>Status</span>
						<span>Date</span>
					</div>
					<div v-for="row in listRows" :key="row.name" class="list-row">
						<span class="list-cell-name">{{ row.name }}</span>
						<span class="list-badge">{{ row.status }}</span>
						<span class="list-cell-muted">{{ row.date }}</span>
					</div>
				</div>
			</section>

			<!-- 8. Page Layout -->
			<section>
				<h2 class="section-label">Page Layout</h2>
				<div class="page-layout-mock">
					<div class="page-head">
						<h3 class="page-head-title">Sales Order</h3>
						<button type="button" class="btn-primary btn-primary--compact">Save</button>
					</div>
					<div class="page-form-card">
						<div class="form-grid">
							<div v-for="field in formFields" :key="field.label" class="form-field">
								<label class="form-field-label">{{ field.label }}</label>
								<div class="form-field-value">{{ field.value }}</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- 9. Gantt -->
			<section>
				<h2 class="section-label">Gantt</h2>
				<div class="preview-surface gantt-wrap">
					<div class="gantt-header">
						<div class="gantt-label-col" />
						<div class="gantt-weeks">
							<span v-for="w in ganttWeeks" :key="w" class="gantt-week">{{ w }}</span>
						</div>
					</div>
					<div
						v-for="(row, idx) in ganttRows"
						:key="row.label"
						class="gantt-row"
						:class="{ 'gantt-row--alt': idx % 2 === 1 }"
					>
						<div class="gantt-row-label">{{ row.label }}</div>
						<div class="gantt-track">
							<div
								class="gantt-bar"
								:style="{ left: row.barLeft, width: row.barWidth }"
							>
								<div class="gantt-progress" :style="{ width: row.progressWidth }" />
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	</div>
</template>

<style scoped>
.desk-samples {
	background-color: var(--bg-color, #f9fafb);
	color: var(--text-color, #1f2937);
	font-family: var(--font-stack, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
	font-size: var(--text-base, 14px);
	font-weight: var(--font-weight-regular, var(--weight-regular, 400));
	min-height: 100vh;
}

.samples-layout {
	max-width: 64rem;
	margin-left: auto;
	margin-right: auto;
	padding: 2.5rem 2rem;
	display: flex;
	flex-direction: column;
	gap: 3rem;
}

.section-label {
	font-size: 0.6875rem;
	font-weight: var(--nce-weight-bold, 600);
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: var(--text-muted, #6b7280);
	margin-bottom: 0.75rem;
}

.preview-surface {
	background-color: var(--fg-color, #fff);
	border: 1px solid var(--border-color, #e5e7eb);
	border-radius: var(--radius, 8px);
	padding: 2rem;
	box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

/* ── 1. Swatches ── */

.swatch-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
	gap: var(--margin-sm, 8px);
}

.swatch-tile {
	height: 3.5rem;
	border: 1px solid var(--border-color, #e5e7eb);
	border-radius: var(--radius, 8px);
	margin-bottom: var(--margin-xs, 4px);
}

.swatch-tile--bg {
	background-color: var(--bg-color, #f9fafb);
}

.swatch-tile--fg {
	background-color: var(--fg-color, #fff);
}

.swatch-tile--gray2 {
	background-color: var(--surface-gray-2, #f3f4f6);
}

.swatch-tile--subtle {
	background-color: var(--subtle-fg, #f3f4f6);
}

.swatch-label {
	font-size: var(--text-sm, 13px);
	font-weight: var(--font-weight-medium, 500);
	color: var(--text-color, #1f2937);
}

.swatch-var {
	font-size: var(--text-xs, 12px);
	color: var(--text-muted, #6b7280);
	font-family: ui-monospace, monospace;
}

/* ── 2. Text colours ── */

.text-colour-stack {
	display: flex;
	flex-direction: column;
	gap: var(--margin-sm, 8px);
}

.text-colour-row {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.text-colour-meta {
	font-size: var(--text-xs, 12px);
	color: var(--text-light, #9ca3af);
}

.sample-body {
	color: var(--text-color, #1f2937);
}

.sample-muted {
	color: var(--text-muted, #6b7280);
}

.sample-light {
	color: var(--text-light, #9ca3af);
}

.sample-heading {
	color: var(--heading-color, #111827);
	font-weight: var(--nce-weight-bold, 600);
}

/* ── 3. Typography ── */

.type-stack {
	display: flex;
	flex-direction: column;
	gap: var(--margin-sm, 8px);
}

.type-lg {
	font-size: var(--text-lg, 16px);
	color: var(--heading-color, #111827);
	margin: 0;
}

.type-base {
	font-size: var(--text-base, 14px);
	color: var(--text-color, #1f2937);
	margin: 0;
}

.type-sm {
	font-size: var(--text-sm, 13px);
	color: var(--text-color, #1f2937);
	margin: 0;
}

.type-xs {
	font-size: var(--text-xs, 12px);
	color: var(--text-muted, #6b7280);
	margin: 0;
}

.type-medium {
	font-size: var(--text-base, 14px);
	font-weight: var(--font-weight-medium, 500);
	color: var(--text-color, #1f2937);
	margin: 0;
}

.type-bold {
	font-size: var(--text-base, 14px);
	font-weight: var(--nce-weight-bold, 600);
	color: var(--heading-color, #111827);
	margin: 0;
}

.type-regular {
	font-size: var(--text-base, 14px);
	font-weight: var(--font-weight-regular, var(--weight-regular, 400));
	color: var(--text-color, #1f2937);
	margin: 0;
}

/* ── 4. Controls ── */

.controls-stack {
	display: flex;
	flex-direction: column;
	gap: var(--margin-sm, 8px);
}

.controls-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--margin-sm, 8px);
}

.control-input,
.control-select {
	background-color: var(--control-bg, #f3f4f6);
	height: var(--input-height, 28px);
	border-radius: var(--radius, 8px);
	border: none;
	padding: 0 var(--padding-sm, 8px);
	font-size: var(--text-sm, 13px);
	color: var(--text-color, #1f2937);
	font-family: inherit;
	min-width: 8rem;
}

.control-input--on-gray {
	background-color: var(--control-bg-on-gray, #e5e7eb);
}

.control-select {
	appearance: auto;
}

.btn-toolbar {
	background-color: var(--control-bg, #f3f4f6);
	height: var(--btn-height, 28px);
	border-radius: var(--radius, 8px);
	border: none;
	padding: 0 var(--padding-md, 12px);
	font-size: var(--text-sm, 13px);
	color: var(--text-color, #1f2937);
	cursor: pointer;
	font-family: inherit;
}

.btn-quick {
	background-color: var(--btn-default-bg, #f3f4f6);
	height: var(--btn-height, 28px);
	border-radius: var(--radius, 8px);
	border: 1px solid var(--border-color, #e5e7eb);
	padding: 0 var(--padding-sm, 8px);
	font-size: var(--text-xs, 12px);
	color: var(--text-color, #1f2937);
	cursor: pointer;
	font-family: inherit;
}

.checkbox-wrap {
	display: inline-flex;
	align-items: center;
	gap: var(--padding-xs, 4px);
	cursor: pointer;
}

.control-checkbox {
	width: var(--checkbox-size, 14px);
	height: var(--checkbox-size, 14px);
	accent-color: var(--heading-color, #111827);
}

.btn-primary {
	background-color: var(--heading-color, #111827);
	color: var(--fg-color, #fff);
	height: var(--btn-height, 28px);
	border-radius: var(--radius, 8px);
	border: none;
	padding: 0 var(--padding-md, 12px);
	font-size: var(--text-sm, 13px);
	font-weight: var(--font-weight-medium, 500);
	cursor: pointer;
	font-family: inherit;
}

.btn-primary--compact {
	flex-shrink: 0;
}

.border-demo {
	display: flex;
	flex-direction: column;
	gap: var(--margin-sm, 8px);
	margin-top: var(--margin-xs, 4px);
}

.border-line {
	padding: var(--padding-sm, 8px) 0;
}

.border-line--default {
	border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.border-line--strong {
	border-bottom: 1px solid var(--dark-border-color, #d1d5db);
}

/* ── 5. Corners & sizes ── */

.sizes-stack {
	display: flex;
	flex-direction: column;
	gap: var(--margin-sm, 8px);
}

.exhibit {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: var(--margin-xs, 4px);
}

.exhibit-label {
	font-size: var(--text-xs, 12px);
	color: var(--text-muted, #6b7280);
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.sizes-row {
	display: flex;
	flex-wrap: wrap;
	gap: 1.5rem;
}

.sizes-row--align {
	align-items: flex-start;
}

.size-box {
	width: 5rem;
	height: 3rem;
	background-color: var(--surface-gray-2, #f3f4f6);
	border: 1px solid var(--border-color, #e5e7eb);
	display: flex;
	align-items: flex-end;
	justify-content: center;
	padding-bottom: var(--padding-xs, 4px);
}

.size-box--radius {
	border-radius: var(--radius, 8px);
}

.btn-size {
	background-color: var(--btn-default-bg, #f3f4f6);
	height: var(--btn-height, 28px);
	border: 1px solid var(--border-color, #e5e7eb);
	border-radius: var(--radius, 8px);
	padding: 0 var(--padding-sm, 8px);
	font-size: var(--text-xs, 12px);
	cursor: pointer;
	font-family: inherit;
	color: var(--text-color, #1f2937);
}

.input-size {
	height: var(--input-height, 28px);
	width: 9rem;
	background-color: var(--control-bg, #f3f4f6);
	border: none;
	border-radius: var(--radius, 8px);
	padding: 0 var(--padding-sm, 8px);
	font-size: var(--text-xs, 12px);
	font-family: inherit;
	color: var(--text-color, #1f2937);
}

.checkbox-size {
	width: var(--checkbox-size, 14px);
	height: var(--checkbox-size, 14px);
	accent-color: var(--heading-color, #111827);
}

.checkbox-size-wrap {
	display: inline-flex;
	align-items: center;
	gap: var(--padding-xs, 4px);
}

/* ── 6. Density ── */

.density-stack {
	display: flex;
	flex-direction: column;
	gap: var(--margin-sm, 8px);
}

.density-chips {
	display: flex;
	flex-wrap: wrap;
	gap: var(--margin-xs, 4px);
}

.density-chip {
	display: inline-block;
	padding: var(--padding-xs, 4px) var(--padding-sm, 8px);
	background-color: var(--surface-gray-2, #f3f4f6);
	border-radius: var(--radius, 8px);
	font-size: var(--text-xs, 12px);
	color: var(--text-color, #1f2937);
}

.density-control-pad {
	padding: var(--padding-sm, 8px);
	background-color: var(--surface-gray-2, #f3f4f6);
	border-radius: var(--radius, 8px);
}

.btn-density {
	background-color: var(--control-bg, #f3f4f6);
	border: 1px solid var(--border-color, #e5e7eb);
	border-radius: var(--radius, 8px);
	padding: var(--padding-sm, 8px) var(--padding-md, 12px);
	font-size: var(--text-sm, 13px);
	cursor: pointer;
	font-family: inherit;
	color: var(--text-color, #1f2937);
}

.density-section-box {
	padding: var(--padding-md, 12px);
	border: 1px solid var(--border-color, #e5e7eb);
	border-radius: var(--radius, 8px);
	font-size: var(--text-sm, 13px);
	color: var(--text-color, #1f2937);
}

.inline-code {
	font-family: ui-monospace, monospace;
	font-size: var(--text-xs, 12px);
	color: var(--text-muted, #6b7280);
}

.density-margins {
	display: flex;
	flex-direction: column;
}

.density-block {
	background-color: var(--surface-gray-2, #f3f4f6);
	padding: var(--padding-xs, 4px) var(--padding-sm, 8px);
	font-size: var(--text-xs, 12px);
	border-radius: var(--radius, 8px);
}

.density-block--xs {
	margin-bottom: var(--margin-xs, 4px);
}

.density-block--sm {
	margin-top: 0;
}

/* ── 7. List view ── */

.list-container {
	background-color: var(--fg-color, #fff);
	border: 1px solid var(--border-color, #e5e7eb);
	border-radius: var(--radius, 8px);
	overflow: hidden;
}

.list-header {
	display: grid;
	grid-template-columns: 1fr auto auto;
	gap: var(--margin-sm, 8px);
	padding: 0 var(--padding-md, 12px);
	min-height: var(--list-row-height, 40px);
	align-items: center;
	background-color: var(--subtle-fg, #f3f4f6);
	border-bottom: 1px solid var(--dark-border-color, #d1d5db);
	font-size: var(--text-sm, 13px);
	color: var(--text-muted, #6b7280);
}

.list-row {
	display: grid;
	grid-template-columns: 1fr auto auto;
	gap: var(--margin-sm, 8px);
	padding: 0 var(--padding-md, 12px);
	min-height: var(--list-row-height, 40px);
	align-items: center;
	border-bottom: 1px solid var(--border-color, #e5e7eb);
	background-color: var(--fg-color, #fff);
}

.list-row:last-child {
	border-bottom: none;
}

.list-cell-name {
	font-size: var(--text-sm, 13px);
	color: var(--text-color, #1f2937);
}

.list-cell-muted {
	font-size: var(--text-sm, 13px);
	color: var(--text-muted, #6b7280);
}

.list-badge {
	font-size: var(--text-xs, 12px);
	padding: 2px var(--padding-xs, 4px);
	border-radius: var(--radius, 8px);
	background-color: var(--surface-gray-2, #f3f4f6);
	color: var(--text-color, #1f2937);
}

/* ── 8. Page layout ── */

.page-layout-mock {
	border: 1px solid var(--border-color, #e5e7eb);
	border-radius: var(--radius, 8px);
	overflow: hidden;
	background-color: var(--bg-color, #f9fafb);
}

.page-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: var(--page-head-height, 60px);
	padding: 0 var(--padding-md, 12px);
	border-bottom: 1px solid var(--border-color, #e5e7eb);
	background-color: var(--fg-color, #fff);
}

.page-head-title {
	margin: 0;
	font-size: var(--text-lg, 16px);
	font-weight: var(--nce-weight-bold, 600);
	color: var(--heading-color, #111827);
}

.page-form-card {
	max-width: var(--page-max-width, 900px);
	margin: var(--margin-sm, 8px) auto;
	padding: var(--padding-md, 12px);
	background-color: var(--fg-color, #fff);
	border: 1px solid var(--border-color, #e5e7eb);
	border-radius: var(--radius, 8px);
}

.form-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--margin-sm, 8px) var(--padding-md, 12px);
}

.form-field-label {
	display: block;
	font-size: var(--text-sm, 13px);
	color: var(--text-muted, #6b7280);
	margin-bottom: var(--margin-xs, 4px);
}

.form-field-value {
	font-size: var(--text-base, 14px);
	color: var(--text-color, #1f2937);
	padding: var(--padding-xs, 4px) 0;
	border-bottom: 1px solid var(--border-color, #e5e7eb);
}

/* ── 9. Gantt ── */

.gantt-wrap {
	padding: var(--padding-md, 12px);
}

.gantt-header {
	display: flex;
	border-bottom: 1px solid var(--dark-border-color, #d1d5db);
	background-color: var(--g-header-background, #f3f4f6);
	font-size: var(--text-xs, 12px);
	color: var(--text-muted, #6b7280);
}

.gantt-label-col {
	width: 5rem;
	flex-shrink: 0;
}

.gantt-weeks {
	flex: 1;
	display: grid;
	grid-template-columns: repeat(6, 1fr);
	text-align: center;
	padding: var(--padding-xs, 4px) 0;
}

.gantt-row {
	display: flex;
	min-height: calc(var(--list-row-height, 40px) - 4px);
	align-items: center;
	border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.gantt-row--alt {
	background-color: var(--g-row-color, #fafafa);
}

.gantt-row-label {
	width: 5rem;
	flex-shrink: 0;
	font-size: var(--text-xs, 12px);
	color: var(--text-color, #1f2937);
	padding-right: var(--padding-xs, 4px);
}

.gantt-track {
	flex: 1;
	position: relative;
	height: 1.25rem;
}

.gantt-bar {
	position: absolute;
	top: 0;
	height: 100%;
	background-color: var(--g-bar-color, #e5e7eb);
	border: 1px solid var(--g-bar-border, #d1d5db);
	border-radius: var(--radius, 8px);
	overflow: hidden;
	box-sizing: border-box;
}

.gantt-progress {
	height: 100%;
	background-color: var(--g-progress-color, #9ca3af);
}
</style>
