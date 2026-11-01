// Vite build that emits the Design Mode dialog as one self-contained IIFE (Vue bundled in).
//
import path from "node:path"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [vue()],
	define: { "process.env.NODE_ENV": JSON.stringify("production") },
	build: {
		lib: {
			entry: path.resolve(__dirname, "src/design-mode/index.ts"),
			name: "nceDesignDialog",
			formats: ["iife"],
			fileName: () => "design-dialog.js",
		},
		outDir: path.resolve(__dirname, "../themes/public/design_mode"),
		emptyOutDir: true,
		target: "es2017",
		sourcemap: false,
		cssCodeSplit: false,
	},
})
