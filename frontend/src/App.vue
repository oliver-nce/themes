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
						<router-link
							v-for="link in section.links"
							:key="link.to"
							:to="link.to"
							class="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
							active-class="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
						>
							{{ link.label }}
						</router-link>
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
import { computed } from "vue"
import { useRoute } from "vue-router"

const route = useRoute()
const isStandalone = computed(() => !!route.meta.standalone)

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
]
</script>
