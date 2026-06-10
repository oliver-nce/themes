<template>
	<EditorSection
		title="Published class values"
		hint="Live values for this theme — each theme-* class and what it resolves to after your editor settings (matches nce_theme.css on save)."
	>
		<div class="catalog-toolbar">
			<input
				v-model="filter"
				type="search"
				class="catalog-filter"
				placeholder="Filter classes, variables, or values…"
				aria-label="Filter class catalog"
			/>
			<span class="catalog-count">{{ totalRows }} classes</span>
		</div>

		<p v-if="!totalRows" class="catalog-empty">
			No resolved values yet — set colours and layout on the other tabs.
		</p>

		<div v-else class="catalog-sections">
			<EditorSection
				v-for="section in filteredSections"
				:key="section.id"
				collapsible
				:default-open="false"
			>
				<template #title>
					<span class="catalog-section-title">{{ section.title }}</span>
					<span class="catalog-section-count">({{ section.rows.length }})</span>
				</template>
				<div class="catalog-table-wrap">
					<table class="catalog-table">
						<thead>
							<tr>
								<th scope="col">Class</th>
								<th scope="col">CSS variable(s)</th>
								<th scope="col">Resolved value</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="(row, idx) in section.rows" :key="`${row.className}-${idx}`">
								<td>
									<code class="catalog-class">{{ row.className }}</code>
								</td>
								<td>
									<code class="catalog-var">{{ row.cssVars }}</code>
								</td>
								<td>
									<span class="catalog-value">
										<span
											v-if="row.swatch"
											class="catalog-swatch"
											:style="{ backgroundColor: row.swatch }"
											:aria-label="`Colour ${row.swatch}`"
										/>
										<span>{{ row.value }}</span>
									</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</EditorSection>
		</div>
	</EditorSection>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import EditorSection from "@/components/EditorSection.vue"
import {
	buildThemeClassCatalog,
	catalogRowCount,
	filterThemeClassCatalog,
} from "@/utils/themeClassCatalog"

const props = defineProps<{
	variables: Record<string, string>
}>()

const filter = ref("")

const sections = computed(() => buildThemeClassCatalog(props.variables))

const filteredSections = computed(() =>
	filterThemeClassCatalog(sections.value, filter.value),
)

const totalRows = computed(() => catalogRowCount(filteredSections.value))
</script>

<style scoped>
.catalog-toolbar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
}

.catalog-filter {
	flex: 1 1 14rem;
	min-width: 0;
	padding: 0.5rem 0.75rem;
	font-size: calc(var(--nce-font-size, 14px) * 0.875);
	border: 1px solid var(--nce-color-border, #e5e7eb);
	border-radius: var(--nce-border-radius, 0.375rem);
	background: var(--nce-color-bg, #fff);
	color: var(--nce-color-text, #111827);
}

.catalog-count {
	font-size: calc(var(--nce-font-size, 14px) * 0.8125);
	color: var(--nce-color-muted, #6b7280);
	white-space: nowrap;
}

.catalog-empty {
	margin: 0;
	font-size: calc(var(--nce-font-size, 14px) * 0.875);
	color: var(--nce-color-muted, #6b7280);
}

.catalog-sections {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.catalog-sections :deep(.editor-panel) {
	background: var(--nce-color-bg, #fff);
}

.catalog-section-title {
	font-size: 0.875rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--nce-color-muted, #6b7280);
}

.catalog-section-count {
	margin-left: 0.35rem;
	font-size: 0.8125rem;
	font-weight: 500;
	color: var(--nce-color-muted, #9ca3af);
	text-transform: none;
	letter-spacing: normal;
}

.catalog-table-wrap {
	overflow-x: auto;
}

.catalog-table {
	width: 100%;
	border-collapse: collapse;
	font-size: calc(var(--nce-font-size, 14px) * 0.8125);
}

.catalog-table th,
.catalog-table td {
	padding: 0.4rem 0.5rem;
	text-align: left;
	vertical-align: top;
	border-bottom: 1px solid var(--nce-color-border, #e5e7eb);
}

.catalog-table th {
	font-weight: 600;
	color: var(--nce-color-muted, #6b7280);
	white-space: nowrap;
}

.catalog-class,
.catalog-var {
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 0.95em;
	word-break: break-all;
}

.catalog-value {
	display: inline-flex;
	align-items: flex-start;
	gap: 0.5rem;
	word-break: break-word;
}

.catalog-swatch {
	flex-shrink: 0;
	width: 1rem;
	height: 1rem;
	margin-top: 0.1rem;
	border-radius: 0.125rem;
	border: 1px solid var(--nce-color-border, #d1d5db);
}
</style>
