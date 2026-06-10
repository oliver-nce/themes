<template>
	<section class="editor-panel editor-section">
		<div class="editor-section-header">
			<button
				v-if="collapsible"
				type="button"
				class="editor-section-toggle"
				:aria-expanded="open"
				@click="open = !open"
			>
				<slot v-if="$slots.title" name="title" />
				<h2 v-else class="section-title editor-section-title">{{ title }}</h2>
				<span class="editor-section-chevron" :class="{ open }">&#9660;</span>
			</button>
			<template v-else>
				<slot v-if="$slots.title" name="title" />
				<h2 v-else class="section-title editor-section-title">{{ title }}</h2>
			</template>
			<div v-if="$slots.actions" class="editor-section-actions">
				<slot name="actions" />
			</div>
		</div>
		<p v-if="hint" class="editor-section-hint">{{ hint }}</p>
		<div v-show="!collapsible || open" class="editor-section-body">
			<slot />
		</div>
	</section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"

const props = withDefaults(
	defineProps<{
		title?: string
		hint?: string
		collapsible?: boolean
		defaultOpen?: boolean
	}>(),
	{
		title: "",
		hint: "",
		collapsible: false,
		defaultOpen: true,
	},
)

const open = ref(props.defaultOpen)

watch(
	() => props.defaultOpen,
	(val) => {
		open.value = val
	},
)
</script>

<style scoped>
.section-title {
	font-size: 0.875rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
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
}

.editor-section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	flex-wrap: wrap;
}

.editor-section-toggle {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0;
	border: none;
	background: transparent;
	cursor: pointer;
	color: inherit;
	text-align: left;
}

.editor-section-title {
	margin-bottom: 0;
}

.editor-section-chevron {
	font-size: 0.625rem;
	color: var(--nce-color-muted, #6b7280);
	transition: transform 0.15s ease;
}

.editor-section-chevron.open {
	transform: rotate(180deg);
}

.editor-section-hint {
	margin: 0.375rem 0 0;
	font-size: calc(var(--nce-font-size, 14px) * 0.8125);
	color: var(--nce-color-muted, #6b7280);
	line-height: 1.4;
}

.editor-section-body {
	margin-top: 1rem;
	padding-top: 1rem;
	border-top: 1px solid var(--nce-color-border, #e5e7eb);
}

.editor-section-actions :deep(.theme-btn) {
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

.editor-section-actions :deep(.theme-btn:disabled) {
	opacity: 0.45;
	cursor: not-allowed;
}
</style>
