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
						<template v-for="link in section.links" :key="link.to ?? link.action">
							<router-link
								v-if="link.to"
								:to="link.to"
								class="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
								active-class="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
							>
								{{ link.label }}
							</router-link>
							<button
								v-else-if="link.action"
								type="button"
								class="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
								:disabled="openingVueComponents"
								@click="openVueComponents"
							>
								{{ link.label }}
							</button>
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
import { computed, ref } from "vue"
import { useRoute } from "vue-router"

const route = useRoute()
const isStandalone = computed(() => !!route.meta.standalone)
const openingVueComponents = ref(false)

const navSections = [
	{
		label: "Themes",
		links: [
			{ label: "Theme Editor", to: "/themes/theme-settings" },
			{ label: "Theme Preview", to: "/themes/preview" },
		],
	},
	{
		label: "Desk Themes",
		links: [
			{ label: "Desk Theme Editor", to: "/desk-themes/theme-settings" },
			{ label: "Desk Theme Preview", to: "/desk-themes/preview" },
		],
	},
	{
		label: "Vue Implementations",
		links: [{ label: "Apply to Vue Files", action: "vue-components" }],
	},
]

function vueComponentsErrorMessage(data: Record<string, unknown>): string {
	let detail = ""
	if (data.exc_type) {
		detail = String(data.exc_type)
	} else if (data.exception) {
		detail = String(data.exception)
	} else if (data._server_messages) {
		try {
			const parsed = JSON.parse(String(data._server_messages)) as unknown[]
			detail = parsed
				.map((m) => {
					if (typeof m === "string") {
						const inner = JSON.parse(m) as { message?: string }
						return inner.message ?? m
					}
					return String(m)
				})
				.join(" ")
		} catch {
			detail = String(data._server_messages)
		}
	}
	return detail
		? `Could not open Vue Components. ${detail}`
		: "Could not open Vue Components."
}

async function openVueComponents() {
	const tab = window.open("about:blank", "_blank")
	openingVueComponents.value = true
	try {
		const res = await fetch("/api/method/themes.component_api.open_vue_components", {
			method: "POST",
			headers: {
				"X-Frappe-CSRF-Token":
					(window as Window & { csrf_token?: string }).csrf_token || "",
				Accept: "application/json",
			},
		})
		const data = (await res.json()) as Record<string, unknown> & {
			message?: { url?: string }
		}
		const failed = !res.ok || data.exc_type || data.exception
		if (failed) {
			tab?.close()
			window.alert(vueComponentsErrorMessage(data))
			return
		}
		const url = data.message?.url || "/app/vue-component"
		if (tab) {
			tab.location.href = url
		} else {
			window.open(url, "_blank")
		}
	} catch {
		tab?.close()
		window.alert("Could not open Vue Components.")
	} finally {
		openingVueComponents.value = false
	}
}
</script>
