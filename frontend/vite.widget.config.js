// Vite library build that emits the theme swatch picker as ES and UMD bundles.
//
// code-index:begin
// {
//  "purpose": "Vite library build that emits the theme swatch picker as ES and UMD bundles.",
//  "read_when": "When the embeddable swatch picker bundle path or format needs to change.",
//  "gotchas": [],
//  "keywords": ["themeSwatchPicker", "theme-swatch-picker", "widget", "umd", "public/dist", "library build"],
//  "format": 1
// }
// code-index:end

import path from "node:path"
import { defineConfig } from "vite"

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
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
