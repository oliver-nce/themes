// PostCSS setup that runs Tailwind CSS and Autoprefixer for the theme editor frontend.
//
// code-index:begin
// {
//  "purpose": "PostCSS setup that runs Tailwind CSS and Autoprefixer for the theme editor frontend.",
//  "read_when": "When the frontend CSS pipeline or Tailwind processing stops applying.",
//  "gotchas": [],
//  "keywords": ["plugins", "tailwindcss", "autoprefixer", "postcss", "css build"],
//  "format": 1
// }
// code-index:end

export default {
	plugins: {
		tailwindcss: {},
		autoprefixer: {},
	},
}
