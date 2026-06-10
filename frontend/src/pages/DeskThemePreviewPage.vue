<template>
	<div class="desk-preview-shell">
		<div class="desk-preview-banner">
			LIVE DESK PREVIEW — changes from Desk Theme Editor apply to the iframe instantly
		</div>
		<div class="desk-preview-toolbar">
			<label class="desk-preview-label" for="desk-preview-target">Preview page</label>
			<select id="desk-preview-target" v-model="selectedTarget" class="desk-preview-select">
				<option v-for="target in previewTargets" :key="target.path" :value="target.path">
					{{ target.label }}
				</option>
			</select>
		</div>
		<iframe
			ref="deskFrame"
			:key="selectedTarget"
			class="desk-preview-frame"
			:src="selectedTarget"
			title="Frappe Desk preview"
			@load="onFrameLoad"
		/>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue"
import { applyDeskThemeVars } from "@/composables/useDeskTheme"

const previewTargets = [
	{ label: "Desk", path: "/app" },
	{ label: "User", path: "/app/user" },
	{ label: "System Settings", path: "/app/system-settings" },
]

const selectedTarget = ref(previewTargets[0].path)
const deskFrame = ref<HTMLIFrameElement | null>(null)
const lastVariables = ref<Record<string, string>>({})

function applyVarsToIframe(vars: Record<string, string>) {
	const root = deskFrame.value?.contentDocument?.documentElement
	if (!root) return
	applyDeskThemeVars(vars, root)
}

function onFrameLoad() {
	if (Object.keys(lastVariables.value).length) {
		applyVarsToIframe(lastVariables.value)
	}
}

function handleMessage(event: MessageEvent) {
	if (event.data?.type !== "nce-desk-theme-update") return
	const vars = (event.data.variables || {}) as Record<string, string>
	lastVariables.value = vars
	applyVarsToIframe(vars)
}

onMounted(() => window.addEventListener("message", handleMessage))
onUnmounted(() => window.removeEventListener("message", handleMessage))
</script>

<style scoped>
.desk-preview-shell {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: #111827;
}

.desk-preview-banner {
	flex: 0 0 auto;
	background: #111827;
	color: #f9fafb;
	text-align: center;
	font-size: 0.75rem;
	letter-spacing: 0.04em;
	padding: 0.45rem 0.75rem;
}

.desk-preview-toolbar {
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.5rem 0.75rem;
	background: #1f2937;
	border-bottom: 1px solid #374151;
}

.desk-preview-label {
	font-size: 0.75rem;
	color: #d1d5db;
}

.desk-preview-select {
	min-width: 12rem;
	border: 1px solid #4b5563;
	border-radius: 0.375rem;
	background: #111827;
	color: #f9fafb;
	font-size: 0.875rem;
	padding: 0.35rem 0.6rem;
}

.desk-preview-frame {
	flex: 1 1 auto;
	width: 100%;
	border: 0;
	background: #fff;
}
</style>
