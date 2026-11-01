<!--
Theme editor shell with sidebar links for web and desk theme pages.

-->

<template>
	<!-- Standalone pages (e.g. preview) render without the shell -->
	<router-view v-if="isStandalone" />

	<div v-else id="themes-app" class="h-screen flex">
		<aside class="w-56 border-r bg-gray-50 dark:bg-gray-900 flex flex-col">
			<div class="px-4 py-3 font-semibold text-sm text-gray-700 dark:text-gray-200 border-b">
				Themes App
			</div>
			<nav class="flex-1 px-2 py-3">
				<div v-for="section in navSections" :key="section.label" class="mb-2">
					<div class="text-xs font-semibold uppercase text-gray-400 px-3 pt-4 pb-1">
						{{ section.label }}
					</div>
					<div class="space-y-1">
						<template v-for="link in section.links" :key="link.to ?? link.toggle">
							<div v-if="link.toggle" class="px-3 py-2">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ link.label }}</span>
									<button
										type="button"
										role="switch"
										:aria-checked="designMode.enabled"
										:disabled="designMode.busy || !designMode.loaded"
										class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50"
										:class="designMode.enabled ? 'bg-gray-900' : 'bg-gray-300'"
										@click="toggleDesignMode"
									>
										<span
											class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform"
											:class="designMode.enabled ? 'translate-x-5' : 'translate-x-0.5'"
										></span>
									</button>
								</div>
								<p class="mt-1 text-xs text-gray-500">
									{{
										designMode.busy
											? designMode.enabled
												? "Turning off…"
												: "Scanning Vue files…"
											: designMode.enabled
												? "On"
												: "Off"
									}}
								</p>
								<p
									v-if="designMode.message"
									class="mt-1 text-xs"
									:class="designMode.error ? 'text-red-600' : 'text-green-700'"
								>
									{{ designMode.message }}
								</p>
							</div>
							<a
								v-else-if="link.to && link.popup"
								:href="link.to"
								class="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
								@click.prevent="openPreviewPopup(link.to)"
							>
								{{ link.label }}
							</a>
							<router-link
								v-else-if="link.to"
								:to="link.to"
								class="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
								active-class="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
							>
								{{ link.label }}
							</router-link>
						</template>
					</div>
				</div>
			</nav>
		</aside>
		<main class="flex-1 overflow-y-auto">
			<router-view />
		</main>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from "vue"
import { useRoute } from "vue-router"
import { openPreviewPopup } from "@/utils/previewWindow"

const route = useRoute()
const isStandalone = computed(() => !!route.meta.standalone)

const designMode = reactive({
	enabled: false,
	loaded: false,
	busy: false,
	message: "",
	error: false,
})

const navSections = [
	{
		label: "Themes",
		links: [
			{ label: "Theme Editor", to: "/themes/theme-settings" },
			{ label: "Theme Preview", to: "/themes/preview", popup: true },
		],
	},
	{
		label: "Desk Themes",
		links: [
			{ label: "Desk Theme Editor", to: "/desk-themes/theme-settings" },
			{ label: "Desk Theme Preview", to: "/desk-themes/preview", popup: true },
		],
	},
	{
		label: "Vue Implementations",
		links: [{ label: "Design Mode", toggle: "design-mode" }],
	},
]

async function callApi(method: string, body: Record<string, unknown> = {}) {
	const res = await fetch(`/api/method/themes.component_api.${method}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			"X-Frappe-CSRF-Token": (window as Window & { csrf_token?: string }).csrf_token || "",
		},
		body: JSON.stringify(body),
	})
	const data = await res.json()
	if (!res.ok || data.exc_type) throw new Error(data.exc_type || "Request failed")
	return data.message
}

async function loadDesignMode() {
	try {
		const status = await callApi("get_design_mode_status")
		designMode.enabled = !!status?.enabled
		designMode.loaded = true
	} catch {
		designMode.message = "Could not read the Design Mode setting."
		designMode.error = true
	}
}

async function toggleDesignMode() {
	const next = !designMode.enabled
	designMode.busy = true
	designMode.message = ""
	designMode.error = false
	try {
		const res = await callApi("set_design_mode_enabled", { enabled: next ? 1 : 0 })
		designMode.enabled = !!res?.enabled
		if (res?.scan?.error) {
			designMode.message = "On, but the scan failed: " + res.scan.error
			designMode.error = true
		} else if (res?.scan) {
			designMode.message = `Scanned ${res.scan.found} Vue files (${res.scan.new} new). Reload a Vue page to see the button.`
		} else {
			designMode.message = "Off. The Design Mode button is hidden everywhere."
		}
	} catch (err) {
		designMode.message = (err as Error)?.message || "Could not change Design Mode."
		designMode.error = true
	} finally {
		designMode.busy = false
	}
}

onMounted(loadDesignMode)
</script>
