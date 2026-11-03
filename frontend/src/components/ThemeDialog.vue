<!--
Modal frame used by the theme editors: overlay, card and title; body and buttons go in the default slot.

-->

// Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
<template>
	<div
		v-if="open"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
		@click.self="emit('close')"
	>
		<div
			class="bg-white rounded-lg shadow-xl p-5 w-full"
			:class="wide ? 'max-w-3xl' : 'max-w-md'"
		>
			<h3 class="text-base font-semibold text-gray-900">{{ title }}</h3>
			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{ open: boolean; title: string; wide?: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>
