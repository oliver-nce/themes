import path from "node:path"
import { defineConfig } from "vite"

export default defineConfig({
	build: {
		lib: {
			entry: path.resolve(__dirname, "src/widget/index.ts"),
			name: "themeSwatchPicker",
			formats: ["es", "umd"],
			fileName: (format) =>
				format === "es"
					? "theme-swatch-picker.es.js"
					: "theme-swatch-picker.umd.js",
		},
		outDir: path.resolve(__dirname, "../themes/public/dist"),
		emptyOutDir: true,
		target: "es2015",
		sourcemap: true,
		rollupOptions: {
			output: {
				exports: "named",
				assetFileNames: "theme-swatch-picker.[ext]",
			},
		},
	},
})
