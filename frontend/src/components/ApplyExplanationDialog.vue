<!--
Modal for the Applications tab: shows the apply-theme explanation HTML and records acknowledgement.

-->

// Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
<template>
	<ThemeDialog :open="open" :title="dialogTitle" wide @close="emit('close')">
		<p v-if="loading" class="text-sm text-gray-500 mt-3">Loading explanation…</p>
		<p v-else-if="loadError" class="text-sm text-red-600 mt-3">{{ loadError }}</p>
		<div
			v-else
			class="mt-3 max-h-[65vh] overflow-y-auto text-base leading-relaxed text-gray-800 border border-gray-100 rounded-md p-5 apply-explanation-html"
			v-html="html"
		/>
		<p v-if="actionError" class="text-sm text-red-600 mt-3">{{ actionError }}</p>
		<div class="flex flex-wrap gap-2 justify-end mt-5">
			<Button
				variant="solid"
				class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
				:disabled="acknowledging"
				@click="emit('close')"
			>
				Close
			</Button>
			<Button
				variant="solid"
				class="bg-primary text-primary-fg border border-primary"
				:loading="acknowledging"
				:disabled="loading || !!loadError || !fingerprint"
				@click="onUnderstand"
			>
				I Understand
			</Button>
		</div>
	</ThemeDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { createResource } from "frappe-ui"
import ThemeDialog from "@/components/ThemeDialog.vue"

const props = defineProps<{
	open: boolean
	app: string
	appTitle: string
}>()

const emit = defineEmits<{
	close: []
	acknowledged: [app: string]
}>()

const dialogTitle = computed(() => `Before you apply a theme to ${props.appTitle}`)

const loading = ref(false)
const loadError = ref("")
const actionError = ref("")
const html = ref("")
const fingerprint = ref("")

const getExplanationResource = createResource({
	url: "themes.component_api.get_apply_explanation",
	auto: false,
})

const acknowledgeResource = createResource({
	url: "themes.component_api.acknowledge_apply_explanation",
	auto: false,
})

async function loadExplanation() {
	if (!props.app) return
	loading.value = true
	loadError.value = ""
	actionError.value = ""
	html.value = ""
	fingerprint.value = ""
	try {
		const data = (await getExplanationResource.submit({ app: props.app })) as {
			html?: string
			fingerprint?: string
			acknowledged?: boolean
		}
		html.value = data?.html ?? ""
		fingerprint.value = data?.fingerprint ?? ""
		if (data?.acknowledged) {
			emit("acknowledged", props.app)
		}
	} catch (err) {
		loadError.value =
			(err as { message?: string })?.message || "Could not load the explanation."
	} finally {
		loading.value = false
	}
}

watch(
	() => [props.open, props.app] as const,
	([open, app]) => {
		if (open && app) {
			void loadExplanation()
		}
	},
)

const acknowledging = ref(false)

async function onUnderstand() {
	if (!props.app || !fingerprint.value) return
	acknowledging.value = true
	actionError.value = ""
	try {
		await acknowledgeResource.submit({ app: props.app, fingerprint: fingerprint.value })
		emit("acknowledged", props.app)
		emit("close")
	} catch (err) {
		actionError.value =
			(err as { message?: string })?.message || "Could not save acknowledgement."
		await loadExplanation()
	} finally {
		acknowledging.value = false
	}
}
</script>

<style scoped>
.apply-explanation-html :deep(p) {
	margin-top: 0.5em;
	margin-bottom: 0.5em;
}

.apply-explanation-html :deep(p:first-child) {
	margin-top: 0;
}

.apply-explanation-html :deep(li) {
	margin: 0.4em 0;
}

.apply-explanation-html :deep(ul),
.apply-explanation-html :deep(ol) {
	margin: 0.5em 0;
	padding-left: 1.5rem;
	list-style: disc;
}
</style>
