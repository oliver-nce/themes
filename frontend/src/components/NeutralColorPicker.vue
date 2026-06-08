<template>
	<div class="relative">
		<label class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>

		<button
			type="button"
			class="flex items-center gap-2 px-2 py-1.5 rounded-md border border-gray-200 hover:border-gray-300 bg-white transition-colors w-full"
			@click="open = true"
		>
			<span
				class="w-6 h-6 rounded shrink-0 border border-gray-100"
				:style="{ backgroundColor: currentHex }"
			/>
			<span class="text-xs font-mono text-gray-600 truncate">{{ currentHex }}</span>
			<span class="ml-auto text-gray-400 text-[10px]">&#9660;</span>
		</button>

		<div v-if="currentShades.length" class="flex gap-px mt-1.5 rounded overflow-hidden">
			<div v-for="s in currentShades" :key="s.shade" class="flex-1 group relative">
				<div class="h-5" :style="{ backgroundColor: s.hex }" />
				<div class="text-center mt-0.5 text-[8px] text-gray-400">{{ s.shade }}</div>
				<div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">{{ s.hex }}</div>
			</div>
		</div>

		<div class="adjust-sliders mt-2">
			<div class="adjust-row">
				<label>Lightness</label>
				<input type="range" min="-100" max="100" :value="gamma" @input="onGammaInput($event)" />
				<span class="adjust-value">{{ gamma }}</span>
			</div>
			<div class="adjust-row">
				<label>Warmth</label>
				<input
					type="range"
					min="-100"
					max="100"
					:value="warmth"
					class="warmth-slider"
					@input="onWarmthInput($event)"
				/>
				<span class="adjust-value warmth-label">{{ warmthLabel }}</span>
			</div>
			<button type="button" class="reset-btn" :disabled="!canReset" @click="resetAdjustments">
				Reset to base scale
			</button>
		</div>

		<Teleport to="body">
			<div v-if="open" class="fixed inset-0 z-40" @click="open = false" />
			<div v-if="open" class="picker-panel">
				<div class="swatch-large" :style="{ backgroundColor: dialogHex }" />
				<div class="hex-row">
					<input
						type="text"
						v-model="dialogHex"
						maxlength="7"
						class="hex-input"
						placeholder="#RRGGBB"
						@input="onDialogHexInput"
					/>
					<button class="hex-btn" title="Copy hex" @click="copyHex(dialogHex)">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
					</button>
					<span v-if="showCopied" class="copied-text">Copied</span>
					<button v-if="hasEyeDropper" class="hex-btn" title="Pick from screen" @click="useEyeDropper">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4"/></svg>
					</button>
				</div>
				<button class="apply-btn" @click="applyHex">Apply</button>
			</div>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { generateNeutralShades, parseHexInput } from "@/utils/color-shades"

const props = withDefaults(defineProps<{
	label: string
	modelValue: string
	gamma?: number
	warmth?: number
}>(), {
	gamma: 0,
	warmth: 0,
})

const emit = defineEmits<{
	"update:modelValue": [value: string]
	"update:gamma": [value: number]
	"update:warmth": [value: number]
}>()

const open = ref(false)
const showCopied = ref(false)
const dialogHex = ref("#9CA3AF")
const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window

const gamma = computed(() => props.gamma ?? 0)
const warmth = computed(() => props.warmth ?? 0)

const currentHex = computed(() => props.modelValue || "#9CA3AF")

const currentShades = computed(() =>
	generateNeutralShades(currentHex.value, {
		gamma: gamma.value,
		warmth: warmth.value,
		base600Hex: currentHex.value,
	}),
)

const canReset = computed(() => gamma.value !== 0 || warmth.value !== 0)

const warmthLabel = computed(() => {
	if (warmth.value === 0) return "neutral"
	if (warmth.value > 0) return `warm ${warmth.value}`
	return `cool ${warmth.value}`
})

watch(open, (val) => {
	if (val) dialogHex.value = (props.modelValue || "#9CA3AF").toUpperCase()
})

function emitAdjustments(nextGamma: number, nextWarmth: number) {
	emit("update:gamma", nextGamma)
	emit("update:warmth", nextWarmth)
}

function onGammaInput(e: Event) {
	emitAdjustments(+((e.target as HTMLInputElement).value), warmth.value)
}

function onWarmthInput(e: Event) {
	emitAdjustments(gamma.value, +((e.target as HTMLInputElement).value))
}

function resetAdjustments() {
	emitAdjustments(0, 0)
}

function onDialogHexInput() {
	const parsed = parseHexInput(dialogHex.value)
	if (parsed) dialogHex.value = parsed
}

function applyHex() {
	const parsed = parseHexInput(dialogHex.value)
	if (!parsed) return
	emit("update:modelValue", parsed)
	emitAdjustments(0, 0)
	open.value = false
}

function copyHex(hex: string) {
	navigator.clipboard.writeText(hex)
	showCopied.value = true
	setTimeout(() => { showCopied.value = false }, 2000)
}

async function useEyeDropper() {
	try {
		const dropper = new (window as any).EyeDropper()
		const result = await dropper.open()
		const parsed = parseHexInput(result.sRGBHex)
		if (parsed) dialogHex.value = parsed
	} catch { /* cancelled */ }
}
</script>

<style scoped>
.picker-panel {
	position: fixed;
	z-index: 50;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: white;
	border: 1px solid rgba(0,0,0,0.12);
	border-radius: 12px;
	padding: 16px;
	box-shadow: 0 2px 24px rgba(0,0,0,0.08), 0 1px 6px rgba(0,0,0,0.05);
	width: 280px;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.swatch-large {
	width: 100%;
	height: 56px;
	border-radius: 8px;
	border: 1px solid rgba(0,0,0,0.15);
	box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.adjust-sliders {
	display: flex;
	flex-direction: column;
	gap: 6px;
}
.adjust-row {
	display: flex;
	align-items: center;
	gap: 6px;
}
.adjust-row label {
	width: 56px;
	font-size: 10px;
	font-weight: 600;
	color: #666;
	flex-shrink: 0;
}
.adjust-row input[type="range"] {
	flex: 1;
	height: 8px;
	border-radius: 4px;
	-webkit-appearance: none;
	cursor: pointer;
}
.adjust-row input[type="range"]::-webkit-slider-thumb {
	-webkit-appearance: none;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: white;
	border: 2px solid #666;
	box-shadow: 0 1px 2px rgba(0,0,0,0.25);
}
.warmth-slider {
	background: linear-gradient(to right, #93c5fd, #d1d5db 50%, #fcd34d);
}
.adjust-value {
	width: 56px;
	font-size: 9px;
	color: #666;
	text-align: right;
	font-variant-numeric: tabular-nums;
	flex-shrink: 0;
}
.warmth-label {
	width: 72px;
}

.reset-btn {
	align-self: flex-start;
	padding: 3px 8px;
	font-size: 10px;
	border: 1px solid #ddd;
	border-radius: 4px;
	background: #fafafa;
	color: #444;
	cursor: pointer;
}
.reset-btn:hover:not(:disabled) {
	background: #f0f0f0;
	border-color: #ccc;
}
.reset-btn:disabled {
	opacity: 0.45;
	cursor: default;
}

.hex-row {
	display: flex;
	align-items: center;
	gap: 4px;
}
.hex-input {
	flex: 1;
	padding: 5px 7px;
	border: 1px solid #ccc;
	border-radius: 4px;
	font-family: monospace;
	font-size: 12px;
	background: #fff;
}
.hex-btn {
	width: 28px;
	height: 28px;
	padding: 0;
	border: none;
	border-radius: 4px;
	background: transparent;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #666;
}
.hex-btn:hover {
	background: #e5e5e5;
	color: #333;
}
.copied-text {
	font-size: 10px;
	color: #10b981;
	white-space: nowrap;
}

.apply-btn {
	width: 100%;
	padding: 7px 0;
	background: #111;
	color: white;
	border: none;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s;
}
.apply-btn:hover {
	background: #333;
}
</style>
