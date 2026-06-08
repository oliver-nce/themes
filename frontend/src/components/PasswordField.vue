<template>
	<div class="relative w-full max-w-sm mb-2">
		<input
			:type="showPassword ? 'text' : 'password'"
			:value="modelValue"
			autocomplete="current-password"
			class="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm"
			:placeholder="placeholder"
			@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
			@keyup.enter="$emit('enter')"
		/>
		<button
			type="button"
			class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
			:aria-label="showPassword ? 'Hide password' : 'Show password'"
			:aria-pressed="showPassword"
			tabindex="-1"
			@click="showPassword = !showPassword"
		>
			<svg
				v-if="showPassword"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="w-4 h-4"
				aria-hidden="true"
			>
				<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
				<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
				<line x1="1" y1="1" x2="23" y2="23" />
				<path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
			</svg>
			<svg
				v-else
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="w-4 h-4"
				aria-hidden="true"
			>
				<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
				<circle cx="12" cy="12" r="3" />
			</svg>
		</button>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue"

withDefaults(
	defineProps<{
		modelValue: string
		placeholder?: string
	}>(),
	{ placeholder: "Your password" },
)

defineEmits<{
	"update:modelValue": [value: string]
	enter: []
}>()

const showPassword = ref(false)
</script>
