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
	{
		path: "/desk-themes/theme-settings",
		alias: "/app-themes/theme-settings",
		name: "DeskThemeSettings",
		component: () => import("@/pages/DeskThemeSettingsPage.vue"),
	},
	{
		path: "/desk-themes/preview",
		alias: "/app-themes/preview",
		name: "DeskThemePreview",
		component: () => import("@/pages/DeskThemePreviewPage.vue"),
		meta: { standalone: true },
	},
	{
		path: "/desk-themes",
		alias: "/app-themes",
		name: "DeskHome",
		component: () => import("@/pages/DeskThemeHomePage.vue"),
	},
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})

export default router
