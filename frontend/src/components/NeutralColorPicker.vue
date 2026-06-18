// Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
<template>
	<div>
		<label class="block text-sm font-medium text-gray-700 mb-2">{{ label }}</label>

		<!-- Swatch strip -->
		<div class="color-shade-strip flex gap-px rounded overflow-hidden mb-3">
			<div v-for="s in shades" :key="s.shade" class="flex-1 group relative">
				<div class="color-shade-swatch" :style="{ backgroundColor: s.hex }" />
				<div class="text-center mt-0.5 text-[8px] text-gray-400 leading-none">{{ s.shade }}</div>
				<div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">
					{{ s.hex }}
				</div>
			</div>
		</div>

		<!-- 600 hex badge -->
		<div class="flex items-center gap-2 mb-2">
			<span class="w-5 h-5 rounded border border-gray-200 shrink-0" :style="{ backgroundColor: hex600 }" />
			<span class="text-xs font-mono text-gray-500">{{ hex600 }}</span>
			<span class="ml-auto text-[10px] font-medium" :class="warmthLabelClass">{{ warmthLabel }}</span>
		</div>

		<!-- Warmth slider -->
		<div class="flex items-center gap-3">
			<span class="text-[10px] font-semibold text-gray-500 w-12 shrink-0">Warmth</span>
			<input
				type="range"
				min="-100"
				max="100"
				:value="warmth"
				class="warmth-slider flex-1"
				@input="onWarmthInput"
			/>
			<button
				type="button"
				class="reset-btn"
				:disabled="warmth === 0"
				@click="$emit('update:warmth', 0)"
			>Reset</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { generateNeutralShades, neutral600Hex } from "@/utils/color-shades"

const props = withDefaults(defineProps<{
	label: string
	warmth?: number
}>(), { warmth: 0 })

const emit = defineEmits<{ "update:warmth": [value: number] }>()

const shades = computed(() => generateNeutralShades(props.warmth))
const hex600 = computed(() => neutral600Hex(props.warmth))

const warmthLabel = computed(() => {
	if (props.warmth === 0) return "neutral"
	return props.warmth > 0 ? `warm +${props.warmth}` : `cool ${props.warmth}`
})

const warmthLabelClass = computed(() => {
	if (props.warmth === 0) return "text-gray-400"
	return props.warmth > 0 ? "text-amber-600" : "text-blue-500"
})

function onWarmthInput(e: Event) {
	emit("update:warmth", +((e.target as HTMLInputElement).value))
}
</script>

<style scoped>
.color-shade-strip {
	width: 75%;
}
.color-shade-swatch {
	height: 2.5rem;
}

.warmth-slider {
	height: 8px;
	border-radius: 4px;
	-webkit-appearance: none;
	cursor: pointer;
	background: linear-gradient(to right, #93c5fd, #d1d5db 50%, #fcd34d);
}
.warmth-slider::-webkit-slider-thumb {
	-webkit-appearance: none;
	width: 14px;
	height: 14px;
	border-radius: 50%;
	background: white;
	border: 2px solid #666;
	box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.reset-btn {
	padding: 3px 8px;
	font-size: 10px;
	border: 1px solid #ddd;
	border-radius: 4px;
	background: #fafafa;
	color: #444;
	cursor: pointer;
	white-space: nowrap;
	flex-shrink: 0;
}
.reset-btn:hover:not(:disabled) { background: #f0f0f0; border-color: #ccc; }
.reset-btn:disabled { opacity: 0.4; cursor: default; }
</style>
