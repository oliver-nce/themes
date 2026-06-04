<template>
	<div class="relative swatch-picker" ref="wrapper">
		<label class="swatch-picker-label">{{ label }}</label>

		<div class="swatch-picker-control">
			<div class="swatch-current">
				<span
					class="swatch-preview"
					:style="{ backgroundColor: modelValue || '#ffffff' }"
				/>
				<span class="swatch-hex">{{ modelValue || "—" }}</span>
			</div>
			<div class="swatch-picker-actions">
				<button
					type="button"
					class="picker-btn"
					:disabled="isDefault"
					@click="useDefault"
				>
					Use default
				</button>
				<button type="button" class="picker-btn" @click="open = true">
					Other
				</button>
			</div>
		</div>

		<Teleport to="body">
			<div v-if="open" class="fixed inset-0 z-40" @click="open = false" />
			<div
				v-if="open"
				class="swatch-popover fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
			>
				<div class="swatch-popover-title">Pick a colour</div>
				<div class="mb-2">
					<div class="swatch-row-label">Primary</div>
					<div class="swatch-grid">
						<button
							v-for="s in primaryShades"
							:key="'p-' + s.shade"
							type="button"
							class="swatch"
							:class="{ 'swatch-active': isActive(s.hex) }"
							:style="{ backgroundColor: s.hex }"
							:title="s.shade + ' — ' + s.hex"
							@click="pick(s.hex)"
						/>
					</div>
				</div>

				<div class="mb-2">
					<div class="swatch-row-label">Secondary</div>
					<div class="swatch-grid">
						<button
							v-for="s in secondaryShades"
							:key="'s-' + s.shade"
							type="button"
							class="swatch"
							:class="{ 'swatch-active': isActive(s.hex) }"
							:style="{ backgroundColor: s.hex }"
							:title="s.shade + ' — ' + s.hex"
							@click="pick(s.hex)"
						/>
					</div>
				</div>

				<div>
					<div class="swatch-row-label">Gray</div>
					<div class="swatch-grid">
						<button
							v-for="s in grayShades"
							:key="'g-' + s.shade"
							type="button"
							class="swatch"
							:class="{ 'swatch-active': isActive(s.hex) }"
							:style="{ backgroundColor: s.hex }"
							:title="s.shade + ' — ' + s.hex"
							@click="pick(s.hex)"
						/>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { generateShades } from "@/utils/color-shades"

const props = defineProps<{
	label: string
	modelValue: string
	defaultValue: string
	primaryColor: string
	secondaryColor: string
	primaryGamma?: number
	primarySaturation?: number
	secondaryGamma?: number
	secondarySaturation?: number
}>()

const emit = defineEmits<{
	"update:modelValue": [value: string]
}>()

const open = ref(false)

function norm(hex: string) {
	return (hex || "").toUpperCase()
}

const isDefault = computed(
	() => norm(props.modelValue) === norm(props.defaultValue),
)

function isActive(hex: string) {
	return norm(props.modelValue) === norm(hex)
}

function useDefault() {
	emit("update:modelValue", props.defaultValue)
}

function pick(hex: string) {
	emit("update:modelValue", hex)
	open.value = false
}

const primaryShades = computed(() =>
	generateShades(props.primaryColor, {
		gamma: props.primaryGamma ?? 0,
		saturation: props.primarySaturation ?? 100,
	}),
)
const secondaryShades = computed(() =>
	generateShades(props.secondaryColor, {
		gamma: props.secondaryGamma ?? 0,
		saturation: props.secondarySaturation ?? 100,
	}),
)

const grayShades = [
	{ shade: 50, hex: "#F9FAFB" },
	{ shade: 100, hex: "#F3F4F6" },
	{ shade: 200, hex: "#E5E7EB" },
	{ shade: 300, hex: "#D1D5DB" },
	{ shade: 400, hex: "#9CA3AF" },
	{ shade: 500, hex: "#6B7280" },
	{ shade: 600, hex: "#4B5563" },
	{ shade: 700, hex: "#374151" },
	{ shade: 800, hex: "#1F2937" },
	{ shade: 900, hex: "#111827" },
	{ shade: 950, hex: "#030712" },
]
</script>

<style scoped>
.swatch-picker-label {
	display: block;
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--nce-color-text, #374151);
	margin-bottom: 0.375rem;
}

.swatch-picker-control {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 0.5rem 0.625rem;
	border: 1px solid var(--nce-color-border, #e5e7eb);
	border-radius: var(--nce-border-radius, 0.375rem);
	background: var(--nce-color-bg, #ffffff);
}

.swatch-current {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	min-width: 0;
}

.swatch-preview {
	width: 1.5rem;
	height: 1.5rem;
	border-radius: 0.25rem;
	border: 1px solid var(--nce-color-border, #e5e7eb);
	flex-shrink: 0;
}

.swatch-hex {
	font-size: 0.75rem;
	font-family: ui-monospace, monospace;
	color: var(--nce-color-muted, #6b7280);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.swatch-picker-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.375rem;
}

.picker-btn {
	font-family: var(--nce-font-family, inherit);
	font-size: calc(var(--nce-font-size, 14px) * 0.8125);
	font-weight: 500;
	border-radius: var(--nce-border-radius, 0.375rem);
	padding: 0.375rem 0.625rem;
	background: var(--nce-color-bg, #ffffff);
	border: 1px solid var(--nce-color-border, #d1d5db);
	color: var(--nce-color-text, #374151);
	cursor: pointer;
	transition:
		background-color var(--nce-transition-speed, 200ms),
		border-color var(--nce-transition-speed, 200ms),
		color var(--nce-transition-speed, 200ms);
	white-space: nowrap;
}

.picker-btn:hover:not(:disabled) {
	border-color: var(--nce-color-primary, #3b82f6);
	color: var(--nce-color-primary, #3b82f6);
	background: var(--nce-color-surface, #f9fafb);
}

.picker-btn:disabled {
	opacity: 0.45;
	cursor: default;
}

.swatch-popover {
	background: var(--nce-color-bg, #ffffff);
	border: 1px solid var(--nce-color-border, #e5e7eb);
	border-radius: calc(var(--nce-border-radius, 0.375rem) + 2px);
	box-shadow: var(--nce-shadow, 0 4px 16px rgba(0, 0, 0, 0.12));
	padding: 0.875rem;
	width: 18rem;
	max-width: calc(100vw - 2rem);
}

.swatch-popover-title {
	font-size: 0.8125rem;
	font-weight: 600;
	color: var(--nce-color-heading, #111827);
	margin-bottom: 0.625rem;
}

.swatch-row-label {
	font-size: 0.625rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: var(--nce-color-muted, #9ca3af);
	margin-bottom: 0.25rem;
}

.swatch-grid {
	display: grid;
	grid-template-columns: repeat(11, minmax(0, 1fr));
	gap: 5px;
}

.swatch {
	aspect-ratio: 1;
	width: 100%;
	border-radius: 3px;
	cursor: pointer;
	border: 2px solid transparent;
	padding: 0;
	transition: transform 80ms ease, border-color 80ms ease;
}

.swatch:hover {
	transform: scale(1.25);
	z-index: 1;
	border-color: rgba(255, 255, 255, 0.7);
	box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
}

.swatch-active {
	border-color: white;
	box-shadow: 0 0 0 2px #111;
	transform: scale(1.2);
	z-index: 2;
}
</style>
