<template>
	<div class="relative" ref="wrapper">
		<label class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>

		<button
			type="button"
			class="flex items-center gap-2 px-2 py-1.5 rounded-md border border-gray-200 hover:border-gray-300 bg-white transition-colors w-full"
			@click="openPicker"
		>
			<span
				class="w-6 h-6 rounded shrink-0 border border-gray-100"
				:style="{ backgroundColor: modelValue || '#ffffff' }"
			/>
			<span class="text-xs font-mono text-gray-600 truncate">{{ modelValue || "—" }}</span>
			<span class="ml-auto text-gray-400 text-[10px]">&#9660;</span>
		</button>

		<Teleport to="body">
			<div v-if="open" class="fixed inset-0 z-40" @click="closePicker" />
			<div
				v-if="open"
				class="swatch-popover fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
			>
				<template v-if="view === 'grid'">
					<div class="mb-2">
						<div class="row-label">Primary</div>
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
						<div class="row-label">Secondary</div>
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

					<div class="mb-3">
						<div class="row-label">Gray</div>
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

					<div class="popover-footer">
						<Button
							variant="solid"
							class="popover-btn bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							:disabled="isDefault"
							@click="useDefault"
						>
							Use Default
						</Button>
						<Button
							variant="solid"
							class="popover-btn bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							@click="openCustom"
						>
							Other
							<span class="popover-btn-chevron">&#9660;</span>
						</Button>
					</div>
				</template>

				<template v-else>
					<div class="custom-title">Custom colour</div>
					<div class="custom-preview" :style="{ backgroundColor: customHex }" />
					<label class="custom-field-label">
						<span>Pick</span>
						<input
							type="color"
							class="custom-native"
							:value="customHex"
							@input="onNativeInput"
						/>
					</label>
					<label class="custom-field-label">
						<span>Hex</span>
						<input
							type="text"
							class="custom-hex"
							v-model="customHex"
							maxlength="7"
							placeholder="#000000"
							@change="normalizeCustomHex"
						/>
					</label>
					<div class="popover-footer">
						<Button
							variant="solid"
							class="popover-btn bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
							@click="view = 'grid'"
						>
							Back
						</Button>
						<Button
							variant="solid"
							class="popover-btn bg-primary text-primary-fg border border-primary"
							@click="applyCustom"
						>
							Apply
						</Button>
					</div>
				</template>
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
const view = ref<"grid" | "custom">("grid")
const customHex = ref("#000000")

function norm(hex: string) {
	return (hex || "").toUpperCase()
}

function isActive(hex: string) {
	return norm(props.modelValue) === norm(hex)
}

const isDefault = computed(
	() => norm(props.modelValue) === norm(props.defaultValue),
)

function openPicker() {
	customHex.value = norm(props.modelValue || props.defaultValue || "#000000")
	view.value = "grid"
	open.value = true
}

function closePicker() {
	open.value = false
	view.value = "grid"
}

function pick(hex: string) {
	emit("update:modelValue", hex)
	closePicker()
}

function useDefault() {
	emit("update:modelValue", props.defaultValue)
	closePicker()
}

function openCustom() {
	customHex.value = norm(props.modelValue || props.defaultValue || "#000000")
	view.value = "custom"
}

function onNativeInput(e: Event) {
	customHex.value = norm((e.target as HTMLInputElement).value)
}

function normalizeCustomHex() {
	const raw = customHex.value.trim()
	if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
		customHex.value = norm(raw)
		return
	}
	customHex.value = norm(props.modelValue || props.defaultValue || "#000000")
}

function applyCustom() {
	normalizeCustomHex()
	if (!/^#[0-9A-F]{6}$/.test(customHex.value)) return
	emit("update:modelValue", customHex.value)
	closePicker()
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
.swatch-popover {
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
	padding: 0.75rem;
	width: 18rem;
	max-width: calc(100vw - 2rem);
}

.row-label {
	font-size: 0.625rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: #9ca3af;
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

.popover-footer {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.5rem;
	padding-top: 0.625rem;
	border-top: 1px solid var(--nce-color-border, #e5e7eb);
}

.popover-footer :deep(.popover-btn) {
	font-family: var(--nce-font-family, inherit) !important;
	font-size: calc(var(--nce-font-size, 14px) * 0.8125) !important;
	font-weight: 500 !important;
	border-radius: var(--nce-border-radius, 0.375rem) !important;
	padding-inline: 0.75rem !important;
	padding-block: 0.4375rem !important;
	box-shadow: none !important;
	min-height: unset !important;
	height: auto !important;
	line-height: 1.25 !important;
}

.popover-footer :deep(.popover-btn:disabled) {
	opacity: 0.45;
	cursor: not-allowed;
}

.popover-footer :deep(.border-primary:hover:not(:disabled)) {
	filter: brightness(1.08);
}

.popover-btn-chevron {
	margin-left: 0.25rem;
	font-size: 0.5625rem;
	opacity: 0.65;
}

.custom-title {
	font-size: 0.8125rem;
	font-weight: 600;
	color: #111827;
	margin-bottom: 0.625rem;
}

.custom-preview {
	height: 3rem;
	border-radius: 0.375rem;
	border: 1px solid #e5e7eb;
	margin-bottom: 0.75rem;
}

.custom-field-label {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	margin-bottom: 0.625rem;
	font-size: 0.75rem;
	font-weight: 500;
	color: #374151;
}

.custom-native {
	width: 3rem;
	height: 2rem;
	padding: 0;
	border: 1px solid #e5e7eb;
	border-radius: 0.25rem;
	cursor: pointer;
	background: transparent;
}

.custom-hex {
	flex: 1;
	font-family: ui-monospace, monospace;
	font-size: 0.8125rem;
	border: 1px solid #e5e7eb;
	border-radius: 0.25rem;
	padding: 0.375rem 0.5rem;
}
</style>
