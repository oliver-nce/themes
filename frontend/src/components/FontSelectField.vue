<template>
	<div ref="rootEl" class="font-select">
		<label class="block text-sm font-medium text-gray-700 mb-1.5">{{ label }}</label>
		<button
			type="button"
			class="font-select__trigger w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white text-left flex items-center justify-between focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			:aria-expanded="open"
			aria-haspopup="listbox"
			@click="toggle"
			@keydown.down.prevent="open = true"
			@keydown.esc="open = false"
		>
			<span :style="{ fontFamily: fontStack(modelValue) }">{{ modelValue || "—" }}</span>
			<svg class="font-select__caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
		</button>

		<ul v-if="open" class="font-select__menu" role="listbox">
			<li
				v-for="opt in options"
				:key="opt"
				role="option"
				:aria-selected="opt === modelValue"
				class="font-select__option"
				:class="{ 'font-select__option--active': opt === modelValue }"
				:style="{ fontFamily: fontStack(opt) }"
				@click="select(opt)"
			>
				{{ opt }}
			</li>
		</ul>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue"

defineProps<{
	label: string
	options: string[]
	modelValue: string
}>()

const emit = defineEmits<{
	"update:modelValue": [value: string]
}>()

// Generic fallback per curated family — mirrors FONT_REGISTRY in css_writer.py.
const FONT_GENERIC: Record<string, string> = {
	Inter: "sans-serif",
	"Source Sans 3": "sans-serif",
	"Public Sans": "sans-serif",
	"Open Sans": "sans-serif",
	Roboto: "sans-serif",
	Nunito: "sans-serif",
	"Source Serif 4": "serif",
	"JetBrains Mono": "monospace",
}

function fontStack(name: string): string {
	if (!name || name === "System Default") {
		return "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
	}
	return `'${name}', ${FONT_GENERIC[name] || "sans-serif"}`
}

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

function toggle() {
	open.value = !open.value
}

function select(opt: string) {
	emit("update:modelValue", opt)
	open.value = false
}

function onDocClick(e: MouseEvent) {
	if (rootEl.value && !rootEl.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener("click", onDocClick))
onBeforeUnmount(() => document.removeEventListener("click", onDocClick))
</script>

<style scoped>
.font-select {
	position: relative;
}

.font-select__trigger {
	cursor: pointer;
}

.font-select__caret {
	flex: none;
	color: #6b7280;
}

.font-select__menu {
	position: absolute;
	z-index: 30;
	left: 0;
	right: 0;
	margin-top: 0.25rem;
	max-height: 18rem;
	overflow-y: auto;
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 0.375rem;
	box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.18), 0 4px 8px -4px rgba(0, 0, 0, 0.1);
	padding: 0.25rem;
}

.font-select__option {
	padding: 0.5rem 0.625rem;
	border-radius: 0.25rem;
	font-size: 1rem;
	line-height: 1.3;
	cursor: pointer;
}

.font-select__option:hover {
	background: #f3f4f6;
}

.font-select__option--active {
	background: #eff6ff;
	color: #1d4ed8;
}
</style>
