---
title: "Using NCE Themes in your app"
subtitle: "Developer guide for the theme bundle exported from the Themes app"
---

**What you have:** a snapshot of one or more themes from the Themes app, ready to drop into your own app. It works without the Themes app being installed. Nothing here changes your app until you add it.

## What's in this folder

| File | What it does |
|---|---|
| `nce-themes.css` | The colours, fonts, sizes and `theme-*` classes of every theme you exported |
| `nce-theme-switcher.js` | A tiny helper so your app, or your users, can switch theme |
| `fonts/` | The font files the themes use, so nothing loads from outside |
| `README` (this document) | The steps below |

## Step 1: Add the folder to your app

Copy the whole `nce-themes` folder into your app's `public` folder:

```
your_app/public/nce-themes/
```

## Step 2: Load the stylesheet and the helper

In your app's `hooks.py`:

```python
app_include_css = ["/assets/your_app/nce-themes/nce-themes.css"]
app_include_js  = ["/assets/your_app/nce-themes/nce-theme-switcher.js"]
```

If your app serves its own HTML instead, add the same two lines there:

```html
<link rel="stylesheet" href="/assets/your_app/nce-themes/nce-themes.css">
<script src="/assets/your_app/nce-themes/nce-theme-switcher.js"></script>
```

Then run `bench build` and clear the cache.

## Step 3: Use the theme in your screens

The theme gives you variables and ready-made classes.

- **Classes** (simplest): `theme-bg-primary`, `theme-text-primary`, `theme-border`, `theme-rounded`, and so on. Example: `<button class="theme-bg-primary theme-rounded">Save</button>`
- **Variables**, when you write your own CSS: `var(--nce-color-primary)`, `var(--nce-color-neutral-200)`, `var(--nce-font-family)`, `var(--nce-border-radius)`.
- **Don't hard-code colours.** A fixed colour won't change when the theme does.

## Step 4: Let people pick a theme (optional)

The first theme you exported is the starting theme. Everyone sees it until they choose another.

```js
nceSetTheme("ocean");   // switch to the theme with slug "ocean"
nceSetTheme("");        // back to the starting theme
```

- The helper remembers the choice in the browser, so it is still there next visit.
- `window.nceThemes` lists the exported themes (`slug` and `name`), so you can build your own picker.
- If you would rather keep the choice on the user's account, save the slug there and call `nceSetTheme` when your app loads.

## Step 5: Make Frappe UI parts follow the theme (optional)

Frappe and Frappe UI components take their colours from Frappe's own list of greys, blues, reds and so on. `nce-themes.css` includes a mapping that points those at your theme. It is switched off until you turn it on:

```js
document.documentElement.setAttribute("data-nce-bridge", "on");
```

- Do this **only on your own app's screens**, and remove it when the user leaves them. Setting it everywhere would also recolour Frappe's own screens.
- It covers light mode only. Dark mode is left as Frappe has it.
- If your app already defines variables named `--gray-500`, `--blue-500` and similar, the mapping would replace them while it is on. Leave it off in that case.

## If the Themes app is also installed on the site

The Themes app's own theme wins over this snapshot, so a site administrator can restyle your app without touching your files. In that case choose themes in the Themes app, not with `nceSetTheme`.

## Good to know

- **It is a snapshot.** If a theme changes later, export again and replace the files. Each file starts with a header showing when it was made.
- **Fonts are included,** so your app works offline and does not call an outside service.
- **Only what you export is included.** Themes you did not pick are not in the file.

## If something does not work

- **Nothing changes.** Check that the stylesheet is loading, using your browser's developer tools network list, and that you ran `bench build` and cleared the cache.
- **Fonts look wrong.** Check that the `fonts` folder is next to `nce-themes.css`.
- **A theme does not switch.** Check the slug is spelled as in `window.nceThemes`.
- **Frappe UI parts look unchanged.** Check the `data-nce-bridge` setting is on for that screen (Step 5).
