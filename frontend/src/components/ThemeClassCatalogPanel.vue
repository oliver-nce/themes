<template>
	<EditorSection
		title="Published class values"
		hint="Values read directly from nce_theme.css on disk — the same file panels load. Reflects last save."
	>
		<!-- Loading -->
		<p v-if="loading" class="catalog-status">Loading nce_theme.css…</p>

		<!-- Error (not published yet, or network) -->
		<p v-else-if="error" class="catalog-status catalog-error">{{ error }}</p>

		<!-- Dirty warning -->
		<p v-else-if="isDirty" class="catalog-status catalog-warn">
			You have unsaved changes — values below are from the last save.
		</p>

		<!-- Filter + count -->
		<div v-if="!loading && !error" class="catalog-toolbar">
			<input
				v-model="filter"
				type="search"
				class="catalog-filter"
				placeholder="Filter classes, variables, or values…"
				aria-label="Filter class catalog"
			/>
			<span class="catalog-count">{{ totalRows }} classes</span>
		</div>

		<!-- No rows yet -->
		<p v-if="!loading && !error && !totalRows" class="catalog-status">
			No theme classes found — save the theme to publish nce_theme.css.
		</p>

		<!-- Accordion sections -->
		<div v-if="totalRows" class="catalog-sections">
			<EditorSection
				v-for="section in filteredSections"
				:key="section.id"
				:title="`${section.title} (${section.rows.length})`"
				collapsible
				:default-open="false"
			>
				<div class="catalog-table-wrap">
					<table class="catalog-table">
						<thead>
							<tr>
								<th scope="col">Class</th>
								<th scope="col">CSS variable(s)</th>
								<th scope="col">Value from nce_theme.css</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="(row, idx) in section.rows" :key="`${row.className}-${idx}`">
								<td><code class="catalog-class">{{ row.className }}</code></td>
								<td><code class="catalog-var">{{ row.cssVars }}</code></td>
								<td>
									<span class="catalog-value">
										<span
											v-if="row.swatch"
											class="catalog-swatch"
											:style="{ backgroundColor: row.swatch }"
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
import { computed, ref, watch } from "vue"
import EditorSection from "@/components/EditorSection.vue"
import {
	buildCatalogSections,
	fetchNceThemeCss,
	parseClassRules,
	resolveThemeVars,
	type CatalogSection,
} from "@/utils/nceThemeCssParser"

const props = defineProps<{
	cssHash?: string
	isDirty?: boolean
	themeSlug?: string
}>()

const loading = ref(false)
const error = ref("")
const sections = ref<CatalogSection[]>([])
const filter = ref("")

async function load() {
	loading.value = true
	error.value = ""
	try {
		const css = await fetchNceThemeCss(props.cssHash)
		const vars = resolveThemeVars(css, props.themeSlug)
		const rules = parseClassRules(css)
		sections.value = buildCatalogSections(rules, vars)
	} catch (e: any) {
		error.value = e?.message ?? "Could not load nce_theme.css."
		sections.value = []
	} finally {
		loading.value = false
	}
}

// Reload whenever the published file changes (css_hash bumps on save)
watch(() => props.cssHash, load, { immediate: true })

const filteredSections = computed(() => {
	const q = filter.value.trim().toLowerCase()
	if (!q) return sections.value
	return sections.value
		.map((s) => ({
			...s,
			rows: s.rows.filter(
				(r) =>
					r.className.includes(q) ||
					r.cssVars.includes(q) ||
					r.value.toLowerCase().includes(q),
			),
		}))
		.filter((s) => s.rows.length > 0)
})

const totalRows = computed(() =>
	filteredSections.value.reduce((n, s) => n + s.rows.length, 0),
)
</script>

<style scoped>
.catalog-status {
	margin: 0 0 0.75rem;
	font-size: calc(var(--nce-font-size, 14px) * 0.875);
	color: var(--nce-color-muted, #6b7280);
}

.catalog-error { color: #dc2626; }
.catalog-warn  { color: #d97706; }

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

.catalog-sections {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.catalog-sections :deep(.editor-panel) {
	background: var(--nce-color-bg, #fff);
}

.catalog-sections :deep(.editor-section-toggle) {
	width: 100%;
}

.catalog-table-wrap { overflow-x: auto; }

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
