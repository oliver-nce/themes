<template>
	<div class="relative" ref="wrapper">
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

		<template v-if="showShades">
			<div v-if="currentShades.length" class="shade-strip-row mt-1.5">
				<div class="shade-strip-wrap">
					<div
						class="flip-controls-grid"
						:style="{ gridTemplateColumns: `repeat(${currentShades.length}, minmax(0, 1fr))` }"
					>
						<div
							v-for="s in currentShades"
							:key="'flip-' + s.shade"
							class="flip-cell"
						>
							<div
								v-if="fgPreviewMode === 'mono' && s.shade === effectiveFlipShade"
								class="flip-arrows"
							>
								<button
									type="button"
									class="flip-arrow-btn"
									:disabled="!canNudgeMonoFlip(-1)"
									title="Move flip point lighter"
									@click="nudgeMonoFlip(-1)"
								>&#9664;</button>
								<button
									type="button"
									class="flip-arrow-btn"
									:disabled="!canNudgeMonoFlip(1)"
									title="Move flip point darker"
									@click="nudgeMonoFlip(1)"
								>&#9654;</button>
							</div>
							<div
								v-else-if="fgPreviewMode === 'tonal' && (s.shade === effectiveFlip1 || s.shade === effectiveFlip2)"
								class="flip-arrows"
							>
								<template v-if="s.shade === effectiveFlip1">
									<button
										type="button"
										class="flip-arrow-btn"
										:disabled="!canNudgeFlip(1, -1)"
										title="Move first flip point lighter"
										@click="nudgeFlip(1, -1)"
									>&#9664;</button>
									<button
										type="button"
										class="flip-arrow-btn"
										:disabled="!canNudgeFlip(1, 1)"
										title="Move first flip point darker"
										@click="nudgeFlip(1, 1)"
									>&#9654;</button>
								</template>
								<template v-if="s.shade === effectiveFlip2">
									<button
										type="button"
										class="flip-arrow-btn"
										:disabled="!canNudgeFlip(2, -1)"
										title="Move second flip point lighter"
										@click="nudgeFlip(2, -1)"
									>&#9664;</button>
									<button
										type="button"
										class="flip-arrow-btn"
										:disabled="!canNudgeFlip(2, 1)"
										title="Move second flip point darker"
										@click="nudgeFlip(2, 1)"
									>&#9654;</button>
								</template>
							</div>
						</div>
					</div>
					<div class="color-shade-strip flex gap-px rounded overflow-hidden">
						<div
							v-for="s in currentShades"
							:key="s.shade"
							class="flex-1 group relative"
						>
							<div
								class="color-shade-swatch flex items-center justify-center"
								:class="{
									'swatch-flip-halo': fgPreviewMode === 'mono'
										? s.shade === effectiveFlipShade
										: s.shade === effectiveFlip1 || s.shade === effectiveFlip2,
									'swatch-flip-halo--first': fgPreviewMode === 'tonal' && s.shade === effectiveFlip1,
									'swatch-flip-halo--second': fgPreviewMode === 'tonal' && s.shade === effectiveFlip2,
								}"
								:style="{ backgroundColor: s.hex }"
							>
								<span
									class="shade-text-sample"
									:style="{ color: fgColorForShade(s) }"
								>Text</span>
								<span
									v-if="isLowContrast(s)"
									class="contrast-warn"
									title="Low contrast at this flip setting"
								>!</span>
							</div>
							<div class="text-center mt-0.5 text-[8px] text-gray-400">{{ s.shade }}</div>
							<div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">{{ s.hex }}</div>
						</div>
					</div>
					<button
						v-if="hasFlipOverride"
						type="button"
						class="flip-reset-btn"
						@click="resetFlip"
					>
						{{ fgPreviewMode === 'mono' ? 'Reset flip to auto' : 'Reset flip to 300 / 600' }}
					</button>
				</div>
				<fieldset class="fg-mode-picker">
					<legend class="sr-only">Foreground preview</legend>
					<label class="fg-mode-option">
						<input v-model="fgPreviewMode" type="radio" value="mono" />
						Mono
					</label>
					<label class="fg-mode-option">
						<input v-model="fgPreviewMode" type="radio" value="tonal" />
						Tonal
					</label>
				</fieldset>
			</div>

			<div v-if="showAdjustSliders" class="adjust-sliders mt-2">
				<div class="adjust-row">
					<label>Lightness</label>
					<input
						type="range"
						min="-100"
						max="100"
						:value="gamma"
						@input="onGammaInput($event)"
					/>
					<span class="adjust-value">{{ gamma }}</span>
				</div>
				<div class="adjust-row">
					<label>Saturation</label>
					<input
						type="range"
						min="0"
						max="200"
						:value="saturation"
						:style="{ background: satGradient }"
						@input="onSaturationInput($event)"
					/>
					<span class="adjust-value">{{ saturation }}%</span>
				</div>
				<button
					type="button"
					class="reset-btn"
					:disabled="!canReset"
					@click="resetAdjustments"
				>
					Reset to base scale
				</button>
			</div>
		</template>

		<Teleport to="body">
			<div v-if="open" class="fixed inset-0 z-40" @click="open = false" />
			<div
				v-if="open"
				class="picker-panel"
				:style="panelStyle"
				@click.stop
			>
				<div class="swatch-large" :style="{ backgroundColor: previewHex }" />

				<div
					v-if="!isCorporate"
					class="hue-strip"
					:style="hueStripStyle"
					@click.stop
				>
					<button
						v-for="(sq, i) in HUE_SQUARES"
						:key="sq.hue"
						type="button"
						class="hue-square"
						:class="{ 'hue-square--selected': i === selectedSquareIndex }"
						:style="{ backgroundColor: sq.hex }"
						:title="Math.round(sq.hue) + '° — ' + sq.hex"
						@click.stop="selectHueSquare(sq.hue)"
					/>
				</div>

				<div v-if="!isCorporate" class="hue-only">
					<label>Hue</label>
					<input
						type="range"
						class="hue-slider"
						:min="fineMin"
						:max="fineMax"
						step="0.5"
						:value="dialogHue"
						:style="{ background: fineGradient }"
						@input="onHueInput($event)"
					/>
					<span class="adjust-value">{{ hueDisplayDeg }}°</span>
				</div>

				<div class="hex-row">
					<input
						type="text"
						v-model="dialogHex"
						maxlength="7"
						class="hex-input"
						placeholder="#RRGGBB"
						@input="onDialogHexInput"
					/>
					<button class="hex-btn" title="Copy hex" @click="copyHex(previewHex)">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
					</button>
					<span v-if="showCopied" class="copied-text">Copied</span>
					<button
						v-if="hasEyeDropper"
						class="hex-btn"
						title="Pick from screen"
						@click="useEyeDropper"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4"/></svg>
					</button>
				</div>

				<button class="apply-btn" @click="applyHue">Apply</button>
			</div>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue"
import {
	color600FromParams,
	generateShades,
	generateShadesFromParams,
	hexToOklch,
	paramsFromHex,
	parseHexInput,
	brandShadeForeground,
	isLowContrastFg,
	resolveFgFlipShade,
	resolveFgFlipPair,
	DEFAULT_FG_FLIP_1,
	DEFAULT_FG_FLIP_2,
	type ColorShade,
	type OklchColorParams,
} from "@/utils/color-shades"

export type BrandPaletteMode = "corporate" | "flexible"
export type FgPreviewMode = "mono" | "tonal"

const props = withDefaults(defineProps<{
	label: string
	modelValue: string
	gamma?: number
	saturation?: number
	showShades?: boolean
	paletteMode?: BrandPaletteMode
	/** Opposite brand colour for cross-brand tonal preview (secondary on primary, primary on secondary). */
	oppositeBrandColor?: string
	oppositeBrandGamma?: number
	oppositeBrandSaturation?: number
	/** Shade stop where mono text flips light; null = auto. */
	flipMono?: number | null
	flipTonal1?: number | null
	flipTonal2?: number | null
}>(), {
	gamma: 0,
	saturation: 100,
	showShades: false,
	paletteMode: "flexible",
	oppositeBrandColor: "",
	oppositeBrandGamma: 0,
	oppositeBrandSaturation: 100,
	flipMono: null,
	flipTonal1: null,
	flipTonal2: null,
})

const fgPreviewMode = ref<FgPreviewMode>("mono")

const emit = defineEmits<{
	"update:modelValue": [value: string]
	"update:gamma": [value: number]
	"update:saturation": [value: number]
	"update:flipMono": [value: number | null]
	"update:flipTonal1": [value: number | null]
	"update:flipTonal2": [value: number | null]
}>()

const HUE_SQUARE_COUNT = 36
const HUE_SQUARE_STEP = 360 / HUE_SQUARE_COUNT
/** Fine-tune slider half-range in degrees around the selected square. */
const FINE_RANGE = 20
const PANEL_MIN_WIDTH = 480
const PANEL_H_PADDING = 32
const HUE_STRIP_GAP = 3
const HUE_SQUARE_MAX = 32
const HUE_SQUARE_MIN = 10
/** Strip swatches use a lighter stop so hues are easier to tell apart. */
const HUE_STRIP_PREVIEW_SHADE = 400
/** Measure this ancestor for popup width and horizontal alignment. */
const PANEL_ANCHOR_SELECTOR = ".editor-panel"

/** Strip preview hex at the lighter preview stop (hue selection still commits at 600). */
function hueStripDisplayHex(hue: number): string {
	const params = { hue, gamma: 0, saturation: 100 }
	return (
		generateShadesFromParams(params).find((s) => s.shade === HUE_STRIP_PREVIEW_SHADE)?.hex ??
		color600FromParams(params)
	)
}

/** Static strip — lighter OKLCH preview at shade 400 for each hue step. */
const HUE_SQUARES: ReadonlyArray<{ hue: number; hex: string }> = Array.from(
	{ length: HUE_SQUARE_COUNT },
	(_, i) => {
		const hue = i * HUE_SQUARE_STEP
		return { hue, hex: hueStripDisplayHex(hue) }
	},
)

function normalizeHue(h: number): number {
	return ((h % 360) + 360) % 360
}

function nearestSquareHue(hue: number): number {
	const idx = Math.round(normalizeHue(hue) / HUE_SQUARE_STEP) % HUE_SQUARE_COUNT
	return idx * HUE_SQUARE_STEP
}

const wrapper = ref<HTMLElement | null>(null)
const open = ref(false)
const showCopied = ref(false)
const dialogHue = ref(250)
const dialogHex = ref("#3B82F6")
const pinned600Hex = ref<string | null>(null)
const fineCenter = ref(250)
const panelWidth = ref(PANEL_MIN_WIDTH)
const panelLeft = ref(16)
const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window

const isCorporate = computed(() => props.paletteMode !== "flexible")
const showAdjustSliders = computed(() => !isCorporate.value && props.showShades)

const gamma = computed(() => (isCorporate.value ? 0 : props.gamma ?? 0))
const saturation = computed(() => (isCorporate.value ? 100 : props.saturation ?? 100))

const pinStop600 = computed(
	() => isCorporate.value || (gamma.value === 0 && saturation.value === 100),
)

function currentParams(): OklchColorParams {
	return paramsFromHex(
		props.modelValue || "#3B82F6",
		gamma.value,
		saturation.value,
	)
}

const currentHex = computed(() => props.modelValue || color600FromParams(currentParams()))

const currentShades = computed(() => {
	if (!props.showShades) return []
	const hex = props.modelValue || undefined
	// Pin 600 to picked hex when corporate, or when flexible but sliders are at default
	// (i.e. user hasn't moved the curve yet). When sliders are active in flexible mode,
	// let 600 shift freely with the curve so the strip reflects what will be published.
	const shouldAnchor = isCorporate.value || (gamma.value === 0 && saturation.value === 100)
	return generateShadesFromParams(currentParams(), shouldAnchor && hex ? { base600Hex: hex } : undefined)
})

const canReset = computed(
	() => !isCorporate.value && (gamma.value !== 0 || saturation.value !== 100),
)

const oppositeShades = computed((): ColorShade[] => {
	const hex = (props.oppositeBrandColor || "").trim()
	if (!hex) return []
	return generateShades(hex, {
		gamma: props.oppositeBrandGamma ?? 0,
		saturation: props.oppositeBrandSaturation ?? 100,
	})
})

const effectiveFlipShade = computed(() =>
	resolveFgFlipShade(props.flipMono, currentShades.value),
)

const effectiveFlipPair = computed(() =>
	resolveFgFlipPair(props.flipTonal1, props.flipTonal2, currentShades.value),
)
const effectiveFlip1 = computed(() => effectiveFlipPair.value[0])
const effectiveFlip2 = computed(() => effectiveFlipPair.value[1])

const hasFlipOverride = computed(() => {
	if (fgPreviewMode.value === "mono") return props.flipMono != null
	const [f1, f2] = effectiveFlipPair.value
	return (
		f1 !== DEFAULT_FG_FLIP_1 ||
		f2 !== DEFAULT_FG_FLIP_2 ||
		props.flipTonal1 != null ||
		props.flipTonal2 != null
	)
})

const monoFlipIndex = computed(() =>
	currentShades.value.findIndex((s) => s.shade === effectiveFlipShade.value),
)

function canNudgeMonoFlip(delta: number): boolean {
	const idx = monoFlipIndex.value
	if (idx < 0) return false
	const next = idx + delta
	return next >= 0 && next < currentShades.value.length
}

function flipIndex(which: 1 | 2): number {
	const shade = which === 1 ? effectiveFlip1.value : effectiveFlip2.value
	return currentShades.value.findIndex((s) => s.shade === shade)
}

function canNudgeFlip(which: 1 | 2, delta: number): boolean {
	const shades = currentShades.value
	const idx = flipIndex(which)
	if (idx < 0) return false
	const next = idx + delta
	if (next < 0 || next >= shades.length) return false
	if (which === 1 && next >= flipIndex(2)) return false
	if (which === 2 && next <= flipIndex(1)) return false
	return true
}

function fgColorForShade(s: ColorShade): string {
	if (fgPreviewMode.value === "mono") {
		return brandShadeForeground(
			s.shade,
			currentShades.value,
			"mono",
			props.flipMono,
			null,
			oppositeShades.value,
		)
	}
	return brandShadeForeground(
		s.shade,
		currentShades.value,
		"tonal",
		props.flipTonal1,
		props.flipTonal2,
		oppositeShades.value,
	)
}

function isLowContrast(s: ColorShade): boolean {
	return isLowContrastFg(s.hex, fgColorForShade(s))
}

function nudgeMonoFlip(delta: number) {
	const shades = currentShades.value
	const idx = monoFlipIndex.value
	if (idx < 0) return
	const next = Math.max(0, Math.min(shades.length - 1, idx + delta))
	const nextShade = shades[next]?.shade
	if (nextShade == null) return
	emit("update:flipMono", nextShade)
}

function nudgeFlip(which: 1 | 2, delta: number) {
	const shades = currentShades.value
	const idx = flipIndex(which)
	if (idx < 0) return
	const next = Math.max(0, Math.min(shades.length - 1, idx + delta))
	if (which === 1 && next >= flipIndex(2)) return
	if (which === 2 && next <= flipIndex(1)) return
	const nextShade = shades[next]?.shade
	if (nextShade == null) return
	emit(which === 1 ? "update:flipTonal1" : "update:flipTonal2", nextShade)
}

function resetFlip() {
	if (fgPreviewMode.value === "mono") {
		emit("update:flipMono", null)
	} else {
		emit("update:flipTonal1", DEFAULT_FG_FLIP_1)
		emit("update:flipTonal2", DEFAULT_FG_FLIP_2)
	}
}

const previewHex = computed(() => {
	if (pinned600Hex.value) return pinned600Hex.value
	if (isCorporate.value) {
		const parsed = parseHexInput(dialogHex.value)
		return parsed || props.modelValue || "#3B82F6"
	}
	return color600FromParams({
		hue: dialogHue.value,
		gamma: 0,
		saturation: 100,
	})
})

const satGradient = computed(() => {
	const p = currentParams()
	const mid = color600FromParams({ ...p, saturation: 100 })
	const low = color600FromParams({ ...p, saturation: 0 })
	return `linear-gradient(to right, ${low}, ${mid})`
})

const fineMin = computed(() => fineCenter.value - FINE_RANGE)
const fineMax = computed(() => fineCenter.value + FINE_RANGE)

const selectedSquareIndex = computed(
	() => Math.round(normalizeHue(dialogHue.value) / HUE_SQUARE_STEP) % HUE_SQUARE_COUNT,
)

const hueDisplayDeg = computed(() => Math.round(normalizeHue(dialogHue.value)))

/** Cell height derived from inner panel width so 36 squares always fit exactly. */
const hueCellSize = computed(() => {
	const inner = panelWidth.value - PANEL_H_PADDING
	const gaps = (HUE_SQUARE_COUNT - 1) * HUE_STRIP_GAP
	const cell = (inner - gaps) / HUE_SQUARE_COUNT
	return Math.max(HUE_SQUARE_MIN, Math.min(HUE_SQUARE_MAX, cell))
})

const panelStyle = computed(() => ({
	width: `${panelWidth.value}px`,
	left: `${panelLeft.value}px`,
}))

const hueStripStyle = computed(() => ({
	gridTemplateColumns: `repeat(${HUE_SQUARE_COUNT}, minmax(0, 1fr))`,
	gap: `${HUE_STRIP_GAP}px`,
	"--hue-cell-size": `${hueCellSize.value}px`,
}))

/** Track gradient — lighter preview colors matching the strip. */
const fineGradient = computed(() => {
	const samples = 11
	const span = fineMax.value - fineMin.value
	const stops: string[] = []
	for (let i = 0; i < samples; i++) {
		const hue = fineMin.value + (span * i) / (samples - 1)
		stops.push(hueStripDisplayHex(hue))
	}
	return `linear-gradient(to right, ${stops.join(", ")})`
})

function measurePanelLayout() {
	if (typeof window === "undefined") return
	const anchor =
		(wrapper.value?.closest(PANEL_ANCHOR_SELECTOR) as HTMLElement | null) ??
		wrapper.value
	if (!anchor) return
	const rect = anchor.getBoundingClientRect()
	const viewportCap = window.innerWidth - 32
	const w = Math.min(Math.max(rect.width, PANEL_MIN_WIDTH), viewportCap)
	panelWidth.value = w
	panelLeft.value = Math.max(16, Math.min(rect.left, window.innerWidth - w - 16))
}

watch(open, async (val) => {
	if (val) {
		const hex = (props.modelValue || "#3B82F6").toUpperCase()
		const hue = hexToOklch(hex).h
		const snapped = nearestSquareHue(hue)
		dialogHue.value = hue
		fineCenter.value = snapped
		dialogHex.value = hex
		pinned600Hex.value = hex
		await nextTick()
		measurePanelLayout()
	}
})

function setDialogHue(hue: number) {
	pinned600Hex.value = null
	dialogHue.value = hue
	dialogHex.value = color600FromParams({
		hue: normalizeHue(hue),
		gamma: 0,
		saturation: 100,
	})
}

function selectHueSquare(hue: number) {
	setDialogHue(hue)
	fineCenter.value = hue
}

function onHueInput(e: Event) {
	// Do not re-center fineCenter while dragging — keeps the track stable under the thumb.
	setDialogHue(+((e.target as HTMLInputElement).value))
}

function onDialogHexInput() {
	const parsed = parseHexInput(dialogHex.value)
	if (!parsed) return
	pinned600Hex.value = parsed
	dialogHue.value = hexToOklch(parsed).h
	fineCenter.value = dialogHue.value
	dialogHex.value = parsed
}

function emitAll(params: OklchColorParams) {
	if (isCorporate.value) return
	const nextHex = color600FromParams(params)
	const currentHexValue = (props.modelValue || "").toUpperCase()
	if (
		nextHex === currentHexValue &&
		params.gamma === gamma.value &&
		params.saturation === saturation.value
	) {
		return
	}
	emit("update:modelValue", nextHex)
	emit("update:gamma", params.gamma)
	emit("update:saturation", params.saturation)
}

function onGammaInput(e: Event) {
	const next = +((e.target as HTMLInputElement).value)
	emitAll({ ...currentParams(), gamma: next })
}

function onSaturationInput(e: Event) {
	const next = +((e.target as HTMLInputElement).value)
	emitAll({ ...currentParams(), saturation: next })
}

function resetAdjustments() {
	emitAll({ ...currentParams(), gamma: 0, saturation: 100 })
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
		if (!parsed) return
		pinned600Hex.value = parsed
		dialogHue.value = hexToOklch(parsed).h
		fineCenter.value = dialogHue.value
		dialogHex.value = parsed
	} catch { /* cancelled */ }
}

function applyHue() {
	const parsed = parseHexInput(dialogHex.value)
	const hex =
		pinned600Hex.value ??
		parsed ??
		(isCorporate.value
			? props.modelValue || "#3B82F6"
			: color600FromParams({
					hue: normalizeHue(dialogHue.value),
					gamma: 0,
					saturation: 100,
				}))
	emit("update:modelValue", hex)
	emit("update:gamma", 0)
	emit("update:saturation", 100)
	open.value = false
}
</script>

<style scoped>
.shade-strip-row {
	display: flex;
	align-items: flex-start;
	gap: 1rem;
}
.shade-strip-wrap {
	width: 75%;
	flex-shrink: 0;
}
.flip-controls-grid {
	display: grid;
	width: 100%;
	margin-bottom: 2px;
	min-height: 1.25rem;
}
.flip-cell {
	display: flex;
	justify-content: center;
	align-items: flex-end;
}
.flip-arrows {
	display: flex;
	gap: 2px;
}
.flip-arrow-btn {
	width: 1.1rem;
	height: 1.1rem;
	padding: 0;
	border: 1px solid #ccc;
	border-radius: 3px;
	background: #fafafa;
	color: #333;
	font-size: 9px;
	line-height: 1;
	cursor: pointer;
}
.flip-arrow-btn:hover:not(:disabled) {
	background: #eee;
	border-color: #999;
}
.flip-arrow-btn:disabled {
	opacity: 0.35;
	cursor: default;
}
.color-shade-strip {
	width: 100%;
}
.color-shade-swatch {
	height: 2.5rem;
	position: relative;
}
.swatch-flip-halo {
	box-shadow: 0 0 0 2px #fff, 0 0 0 3px #111;
	z-index: 1;
}
.swatch-flip-halo--second {
	box-shadow: 0 0 0 2px #fff, 0 0 0 3px #2563eb;
}
.contrast-warn {
	position: absolute;
	top: 2px;
	right: 2px;
	font-size: 8px;
	font-weight: 700;
	color: #ef4444;
	line-height: 1;
	pointer-events: none;
}
.flip-reset-btn {
	margin-top: 0.35rem;
	padding: 2px 6px;
	font-size: 10px;
	border: 1px solid #ddd;
	border-radius: 4px;
	background: #fafafa;
	color: #555;
	cursor: pointer;
}
.flip-reset-btn:hover {
	background: #f0f0f0;
	border-color: #ccc;
}
.shade-text-sample {
	font-size: 9px;
	font-weight: 600;
	line-height: 1;
	pointer-events: none;
	user-select: none;
}
.fg-mode-picker {
	margin: 0;
	padding: 0;
	border: none;
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	flex-shrink: 0;
}
.fg-mode-option {
	display: flex;
	align-items: center;
	gap: 0.35rem;
	font-size: 11px;
	font-weight: 500;
	color: #444;
	cursor: pointer;
	white-space: nowrap;
}
.fg-mode-option input {
	margin: 0;
	cursor: pointer;
}
.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}

.picker-panel {
	position: fixed;
	z-index: 50;
	top: 50%;
	transform: translateY(-50%);
	background: white;
	border: 1px solid rgba(0,0,0,0.12);
	border-radius: 12px;
	padding: 16px;
	box-shadow: 0 2px 24px rgba(0,0,0,0.08), 0 1px 6px rgba(0,0,0,0.05);
	display: flex;
	flex-direction: column;
	gap: 12px;
	overflow: hidden;
	box-sizing: border-box;
}

.hue-strip {
	display: grid;
	width: 100%;
}
.hue-square {
	width: 100%;
	height: var(--hue-cell-size, 24px);
	padding: 0;
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 3px;
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;
	box-sizing: border-box;
}
.hue-square:hover {
	border-color: rgba(0, 0, 0, 0.25);
	filter: brightness(1.08);
}
.hue-square--selected {
	border-color: #111;
	box-shadow: 0 0 0 2px #fff, 0 0 0 3px #111;
	z-index: 1;
}

.swatch-large {
	width: 100%;
	height: 56px;
	border-radius: 8px;
	border: 1px solid rgba(0,0,0,0.15);
	box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.hue-only {
	display: flex;
	align-items: center;
	gap: 8px;
}
.hue-only label {
	font-size: 11px;
	font-weight: 600;
	color: #666;
	width: 28px;
	flex-shrink: 0;
}
.hue-only input[type="range"] {
	flex: 1;
	height: 12px;
	border-radius: 6px;
	-webkit-appearance: none;
	cursor: pointer;
}
.hue-only input[type="range"]::-webkit-slider-thumb {
	-webkit-appearance: none;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: white;
	border: 2px solid #666;
	box-shadow: 0 1px 3px rgba(0,0,0,0.3);
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
.adjust-value {
	width: 36px;
	font-size: 9px;
	color: #666;
	text-align: right;
	font-variant-numeric: tabular-nums;
	flex-shrink: 0;
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
