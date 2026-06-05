import path from "node:path"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"

const STUB_ICON = path.resolve(__dirname, "src/stub-icon.vue")

function stubIconsPlugin() {
	return {
		name: "stub-lucide-icons",
		resolveId(id) {
			if (id.startsWith("~icons/")) return STUB_ICON
		},
	}
}

export default defineConfig({
	base: "/assets/themes/frontend/",
	plugins: [stubIconsPlugin(), vue()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
			"tailwind.config.js": path.resolve(__dirname, "tailwind.config.js"),
		},
	},
	build: {
		chunkSizeWarningLimit: 1500,
		outDir: "../themes/public/frontend",
		emptyOutDir: true,
		target: "es2015",
		sourcemap: true,
		rollupOptions: {
			output: {
				// Entry is cache-busted via ?v= in themes.html; chunks need content hashes
				// or browsers keep serving stale lazy-loaded bundles after deploy.
				entryFileNames: "assets/themes.js",
				chunkFileNames: "assets/themes-[name]-[hash].js",
				assetFileNames: "assets/themes[extname]",
			},
		},
	},
	optimizeDeps: {
		include: ["feather-icons", "showdown"],
	},
	server: {
		port: 8080,
		allowedHosts: true,
	},
})
