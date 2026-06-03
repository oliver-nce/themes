# Themes

Frappe v15/v16 custom app for site-wide theming.

## Features

- **Site-wide theming** — CSS custom properties stored in a DocType, loaded on every page
- **Visual theme editor** — Configure colors, typography, layout, and custom CSS from a Vue 3 SPA

## Install

```bash
bench get-app https://github.com/YOUR_USERNAME/themes.git
bench --site your-site install-app themes
bench --site your-site migrate
```

## Theme Editor (Vue SPA)

Build the frontend after pulling changes:

```bash
cd apps/themes/frontend && yarn install && yarn build
cd ~/frappe-bench && bench build --app themes && bench restart
```

Open the editor at `/themes/theme-settings` or via Desk → Themes workspace → **Theme Editor**.

## License

MIT
