<!--
Numeric range control for theme size/weight tokens with default marker and reset.

-->

// Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
<template>
	<div>
		<div class="flex items-center justify-between gap-2 mb-1.5">
			<label class="text-sm font-medium text-gray-700">{{ label }}</label>
			<div class="flex items-center gap-2 shrink-0">
				<span class="rounded bg-gray-100 px-2 text-xs font-mono">{{ displayValue }}</span>
				<button
					v-if="isDirty"
					type="button"
					class="text-xs text-blue-600 hover:underline"
					@click="reset"
				>
					Reset
				</button>
			</div>
		</div>
		<input
			type="range"
			class="w-full accent-blue-600"
			:min="min"
			:max="max"
			:step="step"
			:value="numericValue"
			@input="onInput"
		/>
		<div class="relative h-5 mt-0.5">
			<div
				class="absolute top-0 flex flex-col items-center -translate-x-1/2 pointer-events-none"
				:style="{ left: `${defaultPercent}%` }"
			>
				<span class="text-[10px] leading-none text-gray-300">|</span>
				<span class="text-[10px] text-gray-400 whitespace-nowrap">default {{ defaultValue }}</span>
			</div>
		</div>
		<p v-if="hint" class="text-xs text-gray-500 mt-1.5">{{ hint }}</p>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{
	label: string
	modelValue: string
	min: number
	max: number
	step: number
	unit: string
	defaultValue: string
	hint?: string
}>()

const emit = defineEmits<{
	"update:modelValue": [value: string]
}>()

function parseNumeric(raw: string, fallback: string): number {
	const n = parseFloat(raw)
	if (raw.trim() === "" || Number.isNaN(n)) {
		const fb = parseFloat(fallback)
		if (Number.isNaN(fb)) return props.min
		return Math.min(props.max, Math.max(props.min, fb))
	}
	return Math.min(props.max, Math.max(props.min, n))
}

function formatOutput(n: number): string {
	if (props.unit === "") return String(n)
	return `${n}${props.unit}`
}

const numericValue = computed(() => parseNumeric(props.modelValue, props.defaultValue))

const displayValue = computed(() => formatOutput(numericValue.value))

const defaultNumeric = computed(() => parseNumeric(props.defaultValue, props.defaultValue))

const defaultPercent = computed(() => {
	const span = props.max - props.min
	if (span <= 0) return 0
	return ((defaultNumeric.value - props.min) / span) * 100
})

const normalizedCurrent = computed(() =>
	formatOutput(parseNumeric(props.modelValue, props.defaultValue)),
)

const normalizedDefault = computed(() =>
	formatOutput(parseNumeric(props.defaultValue, props.defaultValue)),
)

const isDirty = computed(() => normalizedCurrent.value !== normalizedDefault.value)

function onInput(e: Event) {
	const n = Number((e.target as HTMLInputElement).value)
	emit("update:modelValue", formatOutput(n))
}

function reset() {
	emit("update:modelValue", props.defaultValue)
}
</script>
