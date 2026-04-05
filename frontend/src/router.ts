import { createRouter, createWebHistory } from "vue-router"

const routes = [
	{
		path: "/themes/theme-settings",
		name: "ThemeSettings",
		component: () => import("@/pages/ThemeSettingsPage.vue"),
	},
	{
		path: "/themes/preview",
		name: "ThemePreview",
		component: () => import("@/pages/ThemePreviewPage.vue"),
		meta: { standalone: true },
	},
	{
		path: "/themes",
		name: "Home",
		component: () => import("@/pages/HomePage.vue"),
	},
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})

export default router
