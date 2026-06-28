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
			<div class="editor-section-header-end">
				<button
					v-if="panelHelp"
					type="button"
					class="editor-section-help-btn"
					:aria-label="`What does ${title} affect?`"
					@click="helpOpen = true"
				>
					?
				</button>
				<div v-if="$slots.actions" class="editor-section-actions">
					<slot name="actions" />
				</div>
			</div>
		</div>
		<p v-if="hint" class="editor-section-hint">{{ hint }}</p>
		<div v-show="!collapsible || open" class="editor-section-body">
			<slot />
		</div>
	</section>

	<Teleport to="body">
		<div
			v-if="helpOpen && panelHelp"
			class="editor-section-help-backdrop"
			@click.self="helpOpen = false"
		>
			<div
				class="editor-section-help-modal"
				role="dialog"
				:aria-labelledby="helpTitleId"
				aria-modal="true"
			>
				<div class="editor-section-help-modal-header">
					<h3 :id="helpTitleId" class="editor-section-help-modal-title">
						{{ title }} — what it affects
					</h3>
					<button
						type="button"
						class="editor-section-help-close"
						aria-label="Close"
						@click="helpOpen = false"
					>
						&times;
					</button>
				</div>
				<div class="editor-section-help-modal-body">
					<p v-if="panelHelp.intro" class="editor-section-help-intro">{{ panelHelp.intro }}</p>
					<p v-if="panelHelp.note" class="editor-section-help-note">{{ panelHelp.note }}</p>
					<ul v-if="panelHelp.items?.length" class="editor-section-help-list">
						<li v-for="item in panelHelp.items" :key="item.label">
							<strong>{{ item.label }}</strong>
							<span> — {{ item.affects }}</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { ref, watch, useId } from "vue"

export type PanelHelpContent = {
	intro?: string
	note?: string
	items?: { label: string; affects: string }[]
}

const props = withDefaults(
	defineProps<{
		title?: string
		hint?: string
		panelHelp?: PanelHelpContent
		collapsible?: boolean
		defaultOpen?: boolean
	}>(),
	{
		title: "",
		hint: "",
		panelHelp: undefined,
		collapsible: false,
		defaultOpen: true,
	},
)

const open = ref(props.defaultOpen)
const helpOpen = ref(false)
const helpTitleId = useId()

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

.editor-section-header-end {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-left: auto;
}

.editor-section-help-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.625rem;
	height: 1.625rem;
	padding: 0;
	border: 1px solid var(--nce-color-border, #d1d5db);
	border-radius: 999px;
	background: var(--nce-color-surface-elevated, #fff);
	color: var(--nce-color-text, #374151);
	font-size: 16px;
	font-weight: 700;
	line-height: 1;
	cursor: pointer;
	flex-shrink: 0;
}

.editor-section-help-btn:hover {
	background: var(--nce-color-row-alt, #f3f4f6);
	border-color: var(--nce-color-muted, #9ca3af);
}

.editor-section-help-backdrop {
	position: fixed;
	inset: 0;
	z-index: 50;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1rem;
	background: rgba(0, 0, 0, 0.3);
}

.editor-section-help-modal {
	width: 100%;
	max-width: 32rem;
	max-height: min(80vh, 36rem);
	overflow: auto;
	border-radius: var(--nce-border-radius-lg, 0.5rem);
	background: #fff;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.editor-section-help-modal-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 0.75rem;
	padding: 1rem 1.25rem;
	border-bottom: 1px solid var(--nce-color-border, #e5e7eb);
}

.editor-section-help-modal-title {
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: var(--nce-color-heading, #111827);
	line-height: 1.35;
}

.editor-section-help-close {
	padding: 0;
	border: none;
	background: transparent;
	color: var(--nce-color-muted, #6b7280);
	font-size: 1.5rem;
	line-height: 1;
	cursor: pointer;
}

.editor-section-help-modal-body {
	padding: 1rem 1.25rem 1.25rem;
	font-size: 0.875rem;
	line-height: 1.5;
	color: var(--nce-color-text, #374151);
}

.editor-section-help-intro,
.editor-section-help-note {
	margin: 0 0 0.75rem;
}

.editor-section-help-note {
	padding: 0.625rem 0.75rem;
	border-radius: var(--nce-border-radius, 0.375rem);
	background: var(--nce-color-row-alt, #f3f4f6);
	color: var(--nce-color-text, #374151);
}

.editor-section-help-list {
	margin: 0;
	padding-left: 1.125rem;
}

.editor-section-help-list li + li {
	margin-top: 0.5rem;
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
