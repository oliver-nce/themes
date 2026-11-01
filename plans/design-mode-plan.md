# Design Mode — implementation plan

> Part 1 (stages 1–6 below) is done. Part 2 (stages 7–10, at the end) is the table popup, the scan on shortcut save, and removing the read-only list.

Status: plan only. No code until the owner OKs it.

Repo: `/Users/oliver3/Documents/_NCE_projects/Themes-v16` (branch `version-16`). Bench: `/Users/oliver3/frappe-bench-16`, site `v16.localhost`.

## What it does

- Works on any Desk page and any Frappe website page that extends `templates/web.html`.
- The owner picks a key combo in the Theme Editor (System tab). Pressing it turns Design Mode on or off. Esc also turns it off.
- While on: a badge shows, the part under the pointer gets an outline and a label, and **right-click** opens a colour popup for that part. **Shift+right-click** gives the normal browser menu.
- The popup edits the five colour fields plus Keep default of the Vue Component Element rows with that CSS class, previews live, and Save republishes `nce_component_overrides.css`.

## Fixed decisions (do not change)

- The only reset is "Revert to Theme Defaults" for a whole component (same as the form button).
- The published CSS rule for a class has no component scope, so Save writes the same values to **every** Present component that has a Present row with that `selector_class`.
- Classes in the "Protected Classes" setting (Page Panel chrome) are shown read-only.
- Never edit any `.vue` file in NCE Events. Never edit Frappe core.
- Use tabs for indentation in Python and JS (match the repo).

## Existing code you will call (do not change unless a stage says so)

| Name | Where | What it does |
|---|---|---|
| `get_preview_theme()` | `themes/component_api.py` | Returns `{"theme": str, "slug": str}` for the site default theme. |
| `preview_declarations(rows)` | `themes/component_api.py` | Takes `[{"key": k, override fields...}]`, returns `{k: "background-color: …; color: …;"}`. |
| `publish_component_css()` | `themes/utils/component_css_writer.py` | Writes the CSS file, returns `{"status": "ok", "css_hash": str, "rules": int}`. |
| `OVERRIDE_FIELDS`, `SELECTOR_RE`, `BORDER_WIDTHS` | `themes/utils/component_sync.py` | The five override field names, selector regex, border width classes. |
| `VueComponent.validate` / `on_update` | `themes/themes/doctype/vue_component/vue_component.py` | Validates classes; publishes CSS unless `doc.flags.skip_css_publish` is set. |
| `window.themeSwatchPicker` | built from `frontend/src/widget/index.ts` | Colour picker. Set by `mountStandaloneThemeSwatchPicker` in `frontend/src/widget/adapters/standalone-adapter.ts`. |
| Core picker `open(opts)` | `frontend/src/widget/theme-swatch-picker-core.ts` | `opts = {getThemeSlug, getValue, setValue, getFgType?, setFgType?, lockKind?: "bg"|"text"|"border", onClose?}`. Its backdrop has z-index 10000. |

The five override fields: `override_bg_class`, `override_fg_type`, `override_text_class`, `override_border_width_class`, `override_border_color_class`. Plus `keep_default` (Check).

The parent table fields cleared by Revert:
- Class fields, set to `""`: `table_header_bg_class`, `table_row_bg_class`, `table_row_alt_bg_class`, `table_header_line_class`, `table_header_line_color_class`, `table_row_divider_class`, `table_row_divider_color_class`, `table_col_divider_class`, `table_col_divider_color_class`.
- Fg-type fields, set to `"mono"`: `table_header_fg_type`, `table_row_fg_type`, `table_row_alt_fg_type`.

---

## Stage 1 — Settings, pure helpers, tests

### 1a. `themes/themes/doctype/theme_component_settings/theme_component_settings.json`

Set `field_order` to `["excluded_apps", "design_mode_section", "design_mode_shortcut", "protected_classes"]`. Append these three objects to `fields`:

```json
{
 "fieldname": "design_mode_section",
 "fieldtype": "Section Break",
 "label": "Design Mode"
},
{
 "default": "Ctrl+Alt+D",
 "description": "Press it on any Vue page to turn Design Mode on or off. Must include Ctrl, Alt or Meta (Cmd).",
 "fieldname": "design_mode_shortcut",
 "fieldtype": "Data",
 "label": "Design Mode Shortcut"
},
{
 "default": "ppv2-float\nppv2-float-header\nppv2-float-footer\nppv2-header-right\nppv2-title\nppv2-click-hint\nppv2-hdr-btn\nppv2-hdr-btn--new\nppv2-close-btn\nppv2-filter-widget\nppv2-fd-header\nppv2-fd-title\nppv2-table\nppv2-action-th\ncol-header",
 "description": "One class per line. Design Mode shows these but does not change them (Page Panel sets their colours per panel).",
 "fieldname": "protected_classes",
 "fieldtype": "Small Text",
 "label": "Protected Classes"
}
```

Set `"modified": "2026-11-01 12:00:00.000000"`.

### 1b. New file `themes/utils/design_mode.py`

No `frappe` import. Exact content to implement:

```python
"""Design Mode helpers: shortcut parsing, clash warnings and the CSS-class map sent to the page."""
from __future__ import annotations

import re

from themes.utils.component_sync import OVERRIDE_FIELDS, SELECTOR_RE

MODIFIER_ORDER = ("Ctrl", "Alt", "Shift", "Meta")
_MODIFIER_ALIASES = {
	"ctrl": "Ctrl", "control": "Ctrl",
	"alt": "Alt", "option": "Alt", "opt": "Alt",
	"shift": "Shift",
	"meta": "Meta", "cmd": "Meta", "command": "Meta",
}
_NAMED_KEYS = {"period": "Period", ".": "Period", "slash": "Slash", "/": "Slash"}
_F_KEY_RE = re.compile(r"^f([1-9]|1[0-2])$")

DEFAULT_PROTECTED = (
	"ppv2-float", "ppv2-float-header", "ppv2-float-footer", "ppv2-header-right", "ppv2-title",
	"ppv2-click-hint", "ppv2-hdr-btn", "ppv2-hdr-btn--new", "ppv2-close-btn", "ppv2-filter-widget",
	"ppv2-fd-header", "ppv2-fd-title", "ppv2-table", "ppv2-action-th", "col-header",
)

KNOWN_CLASHES = {
	"Ctrl+S": "save", "Meta+S": "save",
	"Ctrl+K": "Frappe search", "Meta+K": "Frappe search",
	"Ctrl+G": "Frappe go to", "Meta+G": "Frappe go to",
	"Ctrl+B": "new document", "Meta+B": "new document",
	"Ctrl+Shift+I": "browser developer tools", "Alt+Meta+I": "browser developer tools",
	"Ctrl+R": "reload", "Meta+R": "reload",
	"Ctrl+P": "print", "Meta+P": "print",
	"Ctrl+F": "find in page", "Meta+F": "find in page",
	"Ctrl+Z": "undo", "Meta+Z": "undo", "Ctrl+Y": "redo",
	"Ctrl+W": "close tab", "Meta+W": "close tab",
	"Ctrl+T": "new tab", "Meta+T": "new tab",
}

ROW_VALUE_FIELDS = (*OVERRIDE_FIELDS, "keep_default")


def normalize_shortcut(text: str) -> str:
	"""Return e.g. "Ctrl+Alt+D". Raise ValueError with a short reason when invalid."""
	tokens = [t.strip() for t in (text or "").split("+") if t.strip()]
	mods: set[str] = set()
	keys: list[str] = []
	for token in tokens:
		low = token.lower()
		if low in _MODIFIER_ALIASES:
			mods.add(_MODIFIER_ALIASES[low])
		elif low in _NAMED_KEYS:
			keys.append(_NAMED_KEYS[low])
		elif _F_KEY_RE.match(low):
			keys.append(low.upper())
		elif len(token) == 1 and token.isalnum():
			keys.append(token.upper())
		else:
			raise ValueError(f"unknown key: {token}")
	if not mods & {"Ctrl", "Alt", "Meta"}:
		raise ValueError("needs Ctrl, Alt or Meta")
	if len(keys) != 1:
		raise ValueError("needs one key")
	return "+".join([m for m in MODIFIER_ORDER if m in mods] + keys)


def clash_for(shortcut: str) -> str:
	return KNOWN_CLASHES.get(shortcut, "")


def parse_protected(text: str | None) -> set[str]:
	return {line.strip() for line in (text or "").splitlines() if line.strip()}


def build_selector_map(rows: list[dict], protected: set[str]) -> dict:
	"""Group element rows by selector_class for the page script.

	rows: dicts with parent, component_name, app, file_path, selector_class, tag, line,
	is_dynamic, the five override fields and keep_default.
	"""
	ordered = sorted(rows, key=lambda r: ((r.get("component_name") or ""), int(r.get("line") or 0)))
	result: dict[str, dict] = {}
	for row in ordered:
		sel = (row.get("selector_class") or "").strip()
		if not sel or not SELECTOR_RE.match(sel):
			continue
		entry = result.get(sel)
		if entry is None:
			entry = {
				"components": [],
				"tag": row.get("tag") or "",
				"is_dynamic": 0,
				"protected": 1 if sel in protected else 0,
				"values": {f: (row.get(f) or "") for f in OVERRIDE_FIELDS},
			}
			entry["values"]["keep_default"] = 1 if row.get("keep_default") else 0
			result[sel] = entry
		if row.get("is_dynamic"):
			entry["is_dynamic"] = 1
		name = row.get("parent")
		if name and name not in [c["name"] for c in entry["components"]]:
			entry["components"].append({
				"name": name,
				"component_name": row.get("component_name") or "",
				"app": row.get("app") or "",
				"file_path": row.get("file_path") or "",
			})
	return result
```

### 1c. New file `themes/tests/test_design_mode.py`

Plain `unittest.TestCase` (same style as `themes/tests/test_component_scan.py`). Tests:

1. `normalize_shortcut("ctrl+alt+d") == "Ctrl+Alt+D"`
2. `normalize_shortcut("Cmd+Shift+k") == "Shift+Meta+K"`
3. `normalize_shortcut("Option+Control+5") == "Ctrl+Alt+5"`
4. `normalize_shortcut("Meta+f5") == "Meta+F5"`
5. `normalize_shortcut("Ctrl+/") == "Ctrl+Slash"`
6. `normalize_shortcut("Shift+D")` raises ValueError, message contains "Ctrl, Alt or Meta".
7. `normalize_shortcut("Ctrl+Alt")` raises ValueError "needs one key"; `"Ctrl+A+B"` too.
8. `normalize_shortcut("Ctrl+Tab")` raises ValueError starting "unknown key".
9. `clash_for("Ctrl+K") == "Frappe search"`, `clash_for("Ctrl+Alt+D") == ""`.
10. `parse_protected(" a\n\nb \n") == {"a", "b"}`, `parse_protected(None) == set()`.
11. `build_selector_map`: two rows with `selector_class "x"` from parents `P1` (component_name "Beta", line 5) and `P2` (component_name "Alpha", line 9), plus one row with empty selector and one with selector `"1bad"`. Result has only key `"x"`; `components` names in order `["P2", "P1"]` (sorted by component_name); `values` come from the Alpha row.
12. `build_selector_map` with `protected={"x"}` gives `protected == 1`; a row with `is_dynamic=1` gives `is_dynamic == 1`.

Run: `cd /Users/oliver3/frappe-bench-16 && bench --site v16.localhost run-tests --app themes --module themes.tests.test_design_mode`.

---

## Stage 2 — APIs, boot, hooks, patch

### 2a. Append to `themes/component_api.py`

Add the import at the top with the other `themes.utils` imports:
`from themes.utils.design_mode import build_selector_map, clash_for, normalize_shortcut, parse_protected`

Append these functions at the end of the file:

```python
_TABLE_CLASS_FIELDS = (
	"table_header_bg_class", "table_row_bg_class", "table_row_alt_bg_class",
	"table_header_line_class", "table_header_line_color_class",
	"table_row_divider_class", "table_row_divider_color_class",
	"table_col_divider_class", "table_col_divider_color_class",
)
_TABLE_FG_FIELDS = ("table_header_fg_type", "table_row_fg_type", "table_row_alt_fg_type")
_DESIGN_VALUE_FIELDS = (
	"override_bg_class", "override_fg_type", "override_text_class",
	"override_border_width_class", "override_border_color_class",
)


def _design_shortcut() -> str:
	return frappe.db.get_single_value("Theme Component Settings", "design_mode_shortcut") or "Ctrl+Alt+D"


def _protected_classes() -> set[str]:
	return parse_protected(frappe.db.get_single_value("Theme Component Settings", "protected_classes"))


@frappe.whitelist()
def get_design_mode_shortcut() -> dict:
	frappe.only_for("System Manager")
	return {"shortcut": _design_shortcut()}


@frappe.whitelist()
def set_design_mode_shortcut(shortcut: str) -> dict:
	frappe.only_for("System Manager")
	try:
		value = normalize_shortcut(shortcut)
	except ValueError as e:
		frappe.throw(_("Shortcut {0}: {1}").format(shortcut, str(e)))
	frappe.db.set_single_value("Theme Component Settings", "design_mode_shortcut", value)
	return {"shortcut": value, "clash": clash_for(value)}


@frappe.whitelist()
def get_design_mode_map() -> dict:
	frappe.only_for("System Manager")
	parents = {
		p.name: p
		for p in frappe.get_all(
			"Vue Component",
			filters={"status": "Present"},
			fields=["name", "component_name", "app", "file_path"],
		)
	}
	rows = []
	for r in frappe.get_all(
		"Vue Component Element",
		filters={"parenttype": "Vue Component", "element_status": "Present"},
		fields=["parent", "selector_class", "tag", "line", "is_dynamic", "keep_default", *_DESIGN_VALUE_FIELDS],
	):
		p = parents.get(r.parent)
		if not p:
			continue
		rows.append({**r, "component_name": p.component_name, "app": p.app, "file_path": p.file_path})
	theme = get_preview_theme()
	return {
		"theme": theme["theme"],
		"slug": theme["slug"],
		"selectors": build_selector_map(rows, _protected_classes()),
	}


def _components_with_selector(selector: str) -> list[str]:
	names = frappe.get_all(
		"Vue Component Element",
		filters={"parenttype": "Vue Component", "element_status": "Present", "selector_class": selector},
		pluck="parent",
	)
	present = set(frappe.get_all("Vue Component", filters={"status": "Present", "name": ["in", list(set(names)) or [""]]}, pluck="name"))
	return sorted(present)


@frappe.whitelist()
def save_design_change(selector: str, values) -> dict:
	frappe.only_for("System Manager")
	if isinstance(values, str):
		values = frappe.parse_json(values)
	selector = (selector or "").strip()
	if selector in _protected_classes():
		frappe.throw(_("{0} is set per panel on the Page Panel's Colours tab.").format(selector))
	names = _components_with_selector(selector)
	if not names:
		frappe.throw(_("No Vue Component uses the class {0}.").format(selector))
	for name in names:
		doc = frappe.get_doc("Vue Component", name)
		for row in doc.elements:
			if row.element_status != "Present" or (row.selector_class or "").strip() != selector:
				continue
			for f in _DESIGN_VALUE_FIELDS:
				row.set(f, (values.get(f) or "").strip())
			row.keep_default = 1 if values.get("keep_default") else 0
		doc.flags.skip_css_publish = True
		doc.save()
	result = publish_component_css()
	return {"components": names, "css_hash": result.get("css_hash") or ""}


@frappe.whitelist()
def revert_design_components(names) -> dict:
	frappe.only_for("System Manager")
	if isinstance(names, str):
		names = frappe.parse_json(names)
	reverted = []
	for name in names or []:
		if not frappe.db.exists("Vue Component", name):
			continue
		doc = frappe.get_doc("Vue Component", name)
		for row in doc.elements:
			for f in _DESIGN_VALUE_FIELDS:
				row.set(f, "")
			row.keep_default = 0
		for f in _TABLE_CLASS_FIELDS:
			doc.set(f, "")
		for f in _TABLE_FG_FIELDS:
			doc.set(f, "mono")
		doc.flags.skip_css_publish = True
		doc.save()
		reverted.append(name)
	result = publish_component_css()
	return {"reverted": reverted, "css_hash": result.get("css_hash") or ""}
```

Before writing, check that `Vue Component` really has fields `app` and `file_path` (read `themes/themes/doctype/vue_component/vue_component.json`). If a name differs, use the real name and say so in your report.

### 2b. `themes/boot.py`

Add at the end of `extend_bootinfo(bootinfo)`:

```python
	import frappe

	if "System Manager" in frappe.get_roles():
		shortcut = frappe.db.get_single_value("Theme Component Settings", "design_mode_shortcut") or "Ctrl+Alt+D"
		bootinfo.nce_design_mode = {"shortcut": shortcut}
```

Wrap the new block in `try/except Exception: pass` so a missing DocType can never break boot.

### 2c. `themes/hooks.py`

1. Change `app_include_js` to:
```python
app_include_js = [
    "/assets/themes/dist/theme-swatch-picker.umd.js",
    "/assets/themes/js/desk_theme_loader.js",
    "/assets/themes/js/design_mode.js",
]
```
2. Directly after it add:
```python
web_include_js = [
    "/assets/themes/dist/theme-swatch-picker.umd.js",
    "/assets/themes/js/design_mode.js",
]
web_include_css = [
    _css_url("nce_theme.css"),
    _css_url("nce_component_overrides.css"),
    "/assets/themes/dist/theme-swatch-picker.css",
]
```

### 2d. Placeholder `themes/public/js/design_mode.js`

Content for now (Stage 4 replaces it):
```js
// Design Mode: right-click a Vue part to change its colours. Turned on with the shortcut set in the Theme Editor.
(function () {})();
```

### 2e. Patch `themes/patches/v1_0/design_mode_defaults.py`

```python
import frappe

from themes.utils.design_mode import DEFAULT_PROTECTED


def execute():
	if not frappe.db.exists("DocType", "Theme Component Settings"):
		return
	if not frappe.db.get_single_value("Theme Component Settings", "design_mode_shortcut"):
		frappe.db.set_single_value("Theme Component Settings", "design_mode_shortcut", "Ctrl+Alt+D")
	if not frappe.db.get_single_value("Theme Component Settings", "protected_classes"):
		frappe.db.set_single_value("Theme Component Settings", "protected_classes", "\n".join(DEFAULT_PROTECTED))
```

Append `themes.patches.v1_0.design_mode_defaults` as the last line under `[post_model_sync]` in `themes/patches.txt`.

---

## Stage 3 — Picker: expose the core `open`

### 3a. `frontend/src/widget/adapters/standalone-adapter.ts`

Change the import line to `import { open, close, isOpen, type ThemeSwatchPickerCoreOpts } from "../theme-swatch-picker-core"` and `mountStandaloneThemeSwatchPicker` to:

```ts
	win.themeSwatchPicker = {
		open: openStandaloneThemeSwatchPicker,
		openCore: open,
		close,
		isOpen,
	}
```

### 3b. `frontend/src/widget/index.ts`

Add `openCore: open,` to the `api` object (after `open:`).

### 3c. Build

`cd /Users/oliver3/Documents/_NCE_projects/Themes-v16/frontend && npx vite build -c vite.widget.config.js`

Then check: `rg -c "openCore" ../themes/public/dist/theme-swatch-picker.umd.js` prints 1 or more.

---

## Stage 4 — `themes/public/js/design_mode.js`

Plain JavaScript, one IIFE, no imports, no build step, ES2017. Tabs. Everything it adds to the page lives in **one** element `div#nce-design-mode` appended to `document.body`, plus two `<style>` elements in `<head>`: `#nce-design-mode-style` (UI) and `#nce-design-preview` (live preview). All UI class names start with `ndm-`.

### 4a. Module state (top of the IIFE)

```js
const METHOD = "/api/method/themes.component_api.";
const state = {
	shortcut: "",       // e.g. "Ctrl+Alt+D"
	on: false,
	map: null,          // result of get_design_mode_map
	hoverEl: null,      // element currently outlined
	popup: null,        // { selector, entry, draft } while popup is open
};
```

### 4b. Helpers (write each as a named function)

1. `csrf()` → `(window.frappe && window.frappe.csrf_token) || window.csrf_token || ""`.
2. `async call(method, args)` → `fetch(METHOD + method, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "X-Frappe-CSRF-Token": csrf() }, body: JSON.stringify(args || {}) })`. Parse JSON. If `!res.ok` or `data.exc_type`: build a message from `data._server_messages` (it is a JSON string holding a JSON array of JSON strings, each with a `message` key; take the first one's `message`, strip HTML tags) or else `"Request failed"`, and `throw new Error(message)`. Otherwise return `data.message`.
3. `comboFromEvent(e)` → string or `""`. Parts in this order: `e.ctrlKey` "Ctrl", `e.altKey` "Alt", `e.shiftKey` "Shift", `e.metaKey` "Meta". Key from `e.code`: `/^Key([A-Z])$/` gives the letter; `/^Digit([0-9])$/` gives the digit; `/^F([1-9]|1[0-2])$/` gives `"F" + n`; `"Period"` and `"Slash"` as is; anything else returns `""`. Join with `"+"`. Must give the same string as `normalize_shortcut` in Python.
4. `toast(text, kind)` → shows a small fixed message bottom-centre inside `#nce-design-mode` for 2500 ms; `kind` is `"ok"` or `"err"` (green or red left border).
5. `findTarget(el)` → walk `el`, `el.parentElement`, … up to `document.body`. Return `null` if an element is inside `#nce-design-mode` or matches `.closest('[class*="nce-theme-swatch-picker"]')`. For each element, for each class in `el.classList`, if `state.map.selectors[cls]` exists return `{ el, selector: cls, entry: state.map.selectors[cls] }`. Return `null` if none.
6. `label(entry, selector)` → `entry.components[0].component_name + " › " + selector + (entry.components.length > 1 ? " (+" + (entry.components.length - 1) + ")" : "")`.
7. `reloadOverridesCss(hash)` → for each `document.querySelectorAll('link[rel="stylesheet"]')` whose `href` contains `nce_component_overrides.css`: set `link.href = link.href.split("?")[0] + "?v=" + encodeURIComponent(hash || Date.now())`.

### 4c. Styles (inject once, `ensureStyles()`)

Write CSS for these classes. Use theme variables with fallbacks, e.g. `var(--nce-color-surface, #fff)`.

- `#nce-design-mode` — no size, `position: fixed; top: 0; left: 0; z-index: 9990;`.
- `.ndm-badge` — fixed bottom 16px right 16px; padding 6px 10px; border-radius 6px; background `#1f2937`; colour `#fff`; font 12px system-ui; `pointer-events: none`.
- `.ndm-outline` — fixed; `pointer-events: none`; `border: 2px solid #f59e0b`; `border-radius: 3px`; `box-shadow: 0 0 0 1px rgba(0,0,0,.25)`.
- `.ndm-label` — fixed; `pointer-events: none`; background `#f59e0b`; colour `#111`; font 11px/1.4 system-ui; padding 1px 6px; border-radius 3px; `white-space: nowrap`.
- `.ndm-popup` — fixed; width 380px; background `#fff`; colour `#111`; border 1px solid `#d1d5db`; border-radius 8px; `box-shadow: 0 10px 30px rgba(0,0,0,.2)`; font 13px system-ui.
- `.ndm-title` — padding 8px 12px; border-bottom 1px solid `#e5e7eb`; font-weight 600; `cursor: move`; plus `.ndm-sub` (font-weight 400, colour `#6b7280`, font-size 12px).
- `.ndm-note` — margin 8px 12px 0; padding 6px 8px; border-radius 4px; background `#fef3c7`; font-size 12px.
- `.ndm-table` — width calc(100% - 24px); margin 8px 12px; `border-collapse: collapse`; cells padding 4px 6px; header row font-size 11px uppercase colour `#6b7280`.
- `.ndm-swatch` — inline-block 28×18px; border 1px solid `#d1d5db`; border-radius 3px; and `.ndm-swatch-empty` (diagonal stripe `repeating-linear-gradient(45deg,#fff 0 4px,#e5e7eb 4px 8px)`).
- `.ndm-class` — font-family monospace; font-size 11px; colour `#374151`.
- `.ndm-actions` — display flex; gap 6px; justify-content flex-end; padding 8px 12px; border-top 1px solid `#e5e7eb`.
- `.ndm-btn` — padding 4px 10px; border 1px solid `#d1d5db`; border-radius 4px; background `#fff`; cursor pointer. `.ndm-btn-primary` — background `#111827`; colour `#fff`; border-colour `#111827`. `.ndm-link` — background none; border none; colour `#b91c1c`; text-decoration underline; cursor pointer; `margin-right: auto`.
- `.ndm-btn[disabled]`, `.ndm-link[disabled]` — opacity .4; cursor default.
- `.ndm-toast` — fixed bottom 56px; left 50%; transform translateX(-50%); padding 6px 12px; background `#fff`; border 1px solid `#d1d5db`; border-left 4px solid; border-radius 4px; `.ndm-toast-ok` border-left-colour `#16a34a`; `.ndm-toast-err` `#dc2626`.

### 4d. Start-up (`init()`, called at the end of the IIFE)

1. If `window.__nceDesignModeLoaded` is set, return; set it to `true`.
2. Desk: if `window.frappe && frappe.boot && frappe.boot.nce_design_mode` → `state.shortcut = frappe.boot.nce_design_mode.shortcut`.
3. Otherwise, website page: if `document.cookie` contains `system_user=yes`:
   - use `sessionStorage.getItem("nce_design_mode_shortcut")` if set;
   - else `call("get_design_mode_shortcut")` and store `result.shortcut` in `state.shortcut` and in sessionStorage; on any error stop silently.
4. If `state.shortcut` is empty, return (do nothing at all).
5. `window.addEventListener("keydown", onKeyDown, true)`.

Desk boot may not be ready when the script runs. Run `init` on `DOMContentLoaded` if `document.readyState === "loading"`, otherwise straight away.

### 4e. `onKeyDown(e)`

1. If `comboFromEvent(e) === state.shortcut`: `e.preventDefault(); e.stopPropagation();` then `state.on ? turnOff() : turnOn()`; return.
2. If `e.key === "Escape" && state.on`:
   - if `window.themeSwatchPicker && themeSwatchPicker.isOpen && themeSwatchPicker.isOpen()` → return (the picker handles Esc);
   - else if `state.popup` → `cancelPopup()`;
   - else `turnOff()`.

### 4f. `async turnOn()`

1. `ensureStyles()`; create `#nce-design-mode` if missing.
2. `state.map = await call("get_design_mode_map")`. On error: `toast(err.message, "err")` and return.
3. `state.on = true`.
4. Add the badge: `<div class="ndm-badge">Design Mode — right-click a part to change its colours · {shortcut} or Esc to leave</div>`.
5. Add one `div.ndm-outline` and one `div.ndm-label`, both `display: none`.
6. `document.addEventListener("mousemove", onMouseMove, true)`, `document.addEventListener("contextmenu", onContextMenu, true)`, `window.addEventListener("scroll", hideOutline, true)`.

### 4g. `turnOff()`

`cancelPopup()`; remove the three listeners added in turnOn; remove `#nce-design-mode` and `#nce-design-preview`; `state.on = false; state.map = null; state.hoverEl = null`. Keep the keydown listener.

### 4h. Hover outline

- `onMouseMove(e)`: if `state.popup` return. Throttle with `requestAnimationFrame` (keep one pending frame flag). In the frame: `const hit = findTarget(e.target)`. No hit → `hideOutline()`. Hit → `showOutline(hit)`.
- `showOutline(hit)`: `const r = hit.el.getBoundingClientRect()`; outline `left = r.left - 2, top = r.top - 2, width = r.width + 4, height = r.height + 4` (px), `display: block`. Label text `label(hit.entry, hit.selector)` + (`hit.entry.protected ? " · locked" : ""`); place at `left = r.left`, `top = r.top - 20` (if that is < 0 use `r.bottom + 4`), `display: block`. Set `state.hoverEl = hit.el`.
- `hideOutline()`: both `display: none`; `state.hoverEl = null`.
- Never change the target element's own style or classes.

### 4i. `onContextMenu(e)`

1. If `!state.on || e.shiftKey` return (browser menu).
2. If the event target is inside `.ndm-popup`, `e.preventDefault()` and return.
3. `e.preventDefault(); e.stopPropagation();`
4. `const hit = findTarget(e.target)`. No hit → `toast("Nothing here comes from a scanned Vue component.", "err")`; return.
5. `openPopup(hit, e.clientX, e.clientY)`.

### 4j. Popup

`openPopup(hit, x, y)`:

1. `cancelPopup()` first (closes an older one).
2. `state.popup = { selector: hit.selector, entry: hit.entry, draft: Object.assign({}, hit.entry.values) }`. If `draft.override_fg_type` is empty, set it to `"mono"`.
3. Build `div.ndm-popup` and append it to `#nce-design-mode`. Position at `left = x + 8, top = y + 8`, then clamp so the popup stays fully inside `window.innerWidth/innerHeight` (8px margin). Call `renderPopup()`.
4. Title drag: `mousedown` on `.ndm-title` starts a drag that moves the popup with the pointer until `mouseup`.
5. Close on outside click: `document.addEventListener("mousedown", onOutsideMouseDown, true)`. In that handler, if the target is not inside `.ndm-popup` and not inside `[class*="nce-theme-swatch-picker"]`, call `cancelPopup()`.
6. `hideOutline()`.

`renderPopup()` writes the popup's `innerHTML` (escape every inserted string with an `esc()` helper that replaces `& < > " '`). Layout, top to bottom:

1. Title: `<div class="ndm-title">{component_name of first component} › {selector} <span class="ndm-sub">&lt;{tag}&gt;</span></div>`.
2. Notes, each a `div.ndm-note`, only when they apply:
   - `components.length > 1`: "Also used in {other component_names joined with ", "}. Your change applies to all of them."
   - `is_dynamic`: "This part's colour is also set by code, which may override your change."
   - `protected`: "Page Panel sets this colour per panel. Change it on the Page Panel's Colours tab."
   - `draft.keep_default`: "Keep default is on: this part uses the theme's own colours. The page shows it after Save."
3. `table.ndm-table` with header `Surface | Preview | Class | (blank)` and three rows:
   - **Background** — preview `span.ndm-swatch` with class `draft.override_bg_class` (or `ndm-swatch-empty` when empty); class cell shows the class plus ` · tonal` when `override_fg_type === "tonal"` and bg is set, or "Theme default"; button `Pick…` with `data-act="pick-bg"`.
   - **Text** — preview `span` reading "Aa" with class `draft.override_text_class` (empty → no class); class cell; button `Pick…` `data-act="pick-text"`.
   - **Border** — preview `span.ndm-swatch` with inline style `border: 2px solid` and class `draft.override_border_color_class`; class cell has a `<select data-act="border-width">` with options value `""` "Theme default", `"theme-border-thin"` "Thin", `"theme-border"` "Normal", `"theme-border-strong"` "Strong" (selected = `draft.override_border_width_class`), then the colour class text; button `Pick…` `data-act="pick-border"`.
4. A row with `<label><input type="checkbox" data-act="keep-default"> Keep default</label>`.
5. `div.ndm-actions`: `button.ndm-link[data-act="revert"]` "Revert to Theme Defaults…", `button.ndm-btn[data-act="open"]` "Open record", `button.ndm-btn[data-act="cancel"]` "Cancel", `button.ndm-btn.ndm-btn-primary[data-act="save"]` "Save".
6. When `entry.protected`: every `Pick…`, the select, the checkbox, Save and Revert get the `disabled` attribute.

Wire events once on the popup element (event delegation on `click` and `change`, using `data-act`):

- `pick-bg` → `openPicker("bg")`; `pick-text` → `openPicker("text")`; `pick-border` → `openPicker("border")`.
- `border-width` change → `draft.override_border_width_class = select.value; afterDraftChange()`.
- `keep-default` change → `draft.keep_default = checkbox.checked ? 1 : 0; afterDraftChange()`.
- `open` → for the first component: `window.open("/app/vue-component/" + encodeURIComponent(name), "_blank")`.
- `cancel` → `cancelPopup()`.
- `save` → `savePopup()`.
- `revert` → `revertPopup()`.

`openPicker(kind)`:

```js
const field = { bg: "override_bg_class", text: "override_text_class", border: "override_border_color_class" }[kind];
const d = state.popup.draft;
const opts = {
	getThemeSlug: () => state.map.slug,
	getValue: () => d[field] || "",
	setValue: (cls) => { d[field] = cls || ""; afterDraftChange(); },
	lockKind: kind,
};
if (kind === "bg") {
	opts.getFgType = () => d.override_fg_type || "mono";
	opts.setFgType = (t) => { d.override_fg_type = t || "mono"; afterDraftChange(); };
}
window.themeSwatchPicker.openCore(opts);
```

If `window.themeSwatchPicker` or `.openCore` is missing → `toast("The colour picker is not loaded on this page.", "err")`.

`afterDraftChange()` → `renderPopup()` then `updatePreview()`.

`async updatePreview()`:

1. `const s = state.popup.selector; const d = state.popup.draft;`
2. If `d.keep_default` → set `#nce-design-preview` text to `""` and return.
3. `const res = await call("preview_declarations", { rows: [Object.assign({ key: s }, d)] });`
4. `const decls = (res && res[s]) || "";`
5. Create `<style id="nce-design-preview">` in `<head>` if missing; set its `textContent` to `decls ? "." + s + "." + s + "." + s + "." + s + " { " + decls + " }" : ""`. (Four classes beat the published three.)
6. Errors → `toast(err.message, "err")`.

`async savePopup()`:

1. Disable the Save button.
2. `const res = await call("save_design_change", { selector, values: draft })`.
3. `reloadOverridesCss(res.css_hash)`; `entry.values = Object.assign({}, draft)` (so reopening shows the saved values); remove `#nce-design-preview`; close the popup (as in `cancelPopup`, but the preview is already gone).
4. `toast("Saved for " + res.components.length + " component(s).", "ok")`.
5. On error: `toast(err.message, "err")` and re-enable Save.

`async revertPopup()`:

1. `const names = entry.components.map((c) => c.name)`, `const labels = entry.components.map((c) => c.component_name).join(", ")`.
2. `if (!window.confirm("This resets every colour on " + labels + ", not just this part. Continue?")) return;`
3. `const res = await call("revert_design_components", { names })`.
4. `reloadOverridesCss(res.css_hash)`; remove `#nce-design-preview`; close the popup. Then refresh the map: `state.map = await call("get_design_mode_map")`.
5. `toast("Reverted " + labels + " to theme defaults.", "ok")`. Errors → `toast(err.message, "err")`.

`cancelPopup()`: if no popup, return. Remove the popup element, remove `#nce-design-preview`, remove the outside-mousedown listener, close the picker if open (`themeSwatchPicker.close && themeSwatchPicker.close()`), `state.popup = null`.

### 4k. Self-check before handing back

- `node --check themes/public/js/design_mode.js` passes.
- No `frappe.call`, no jQuery, no `import`.
- Every string put into `innerHTML` goes through `esc()`.

---

## Stage 5 — Theme Editor: shortcut recorder

File: `frontend/src/pages/ThemeSettingsPage.vue`.

### 5a. Template

Inside `<div v-show="activeTab === 'system'" class="editor-tab">`, insert directly **before** `<EditorSection title="Save as base theme"`:

```html
<EditorSection
	title="Design Mode"
	hint="Turn Design Mode on and off with this shortcut on any Vue page. Right-click a part to change its colours. Shift+right-click gives the normal browser menu."
>
	<div class="flex items-center gap-2 mb-3">
		<span class="text-sm text-gray-600">Shortcut</span>
		<kbd class="px-2 py-1 text-sm border rounded bg-gray-50 min-w-[8rem] text-center">
			{{ designMode.recording ? "Press keys…" : (designMode.pending || designMode.shortcut || "—") }}
		</kbd>
		<Button @click="startShortcutRecording" :disabled="designMode.busy">
			{{ designMode.recording ? "Cancel" : "Record shortcut" }}
		</Button>
		<Button
			variant="solid"
			class="bg-primary text-primary-fg border border-primary"
			:loading="designMode.busy"
			:disabled="!designMode.pending || designMode.pending === designMode.shortcut"
			@click="saveDesignShortcut"
		>
			Save shortcut
		</Button>
	</div>
	<p v-if="designMode.error" class="text-sm text-red-600 mb-2">{{ designMode.error }}</p>
	<p v-if="designMode.warning" class="text-sm text-amber-700 mb-2">{{ designMode.warning }}</p>
	<p v-if="designMode.success" class="text-sm text-green-700 mb-2">{{ designMode.success }}</p>
</EditorSection>
```

### 5b. Script

Put this block directly after `const systemTab = reactive({ … })`:

```ts
// ─── AGENT:design-mode-shortcut ─── System tab shortcut recorder for Design Mode

const designMode = reactive({
	shortcut: "",
	pending: "",
	recording: false,
	busy: false,
	error: "",
	warning: "",
	success: "",
})

const getDesignShortcutResource = createResource({
	url: "themes.component_api.get_design_mode_shortcut",
	auto: false,
})
const setDesignShortcutResource = createResource({
	url: "themes.component_api.set_design_mode_shortcut",
	auto: false,
})

function comboFromEvent(e: KeyboardEvent): string {
	const parts: string[] = []
	if (e.ctrlKey) parts.push("Ctrl")
	if (e.altKey) parts.push("Alt")
	if (e.shiftKey) parts.push("Shift")
	if (e.metaKey) parts.push("Meta")
	let key = ""
	const code = e.code || ""
	let m = code.match(/^Key([A-Z])$/)
	if (m) key = m[1]
	if (!key && (m = code.match(/^Digit([0-9])$/))) key = m[1]
	if (!key && /^F([1-9]|1[0-2])$/.test(code)) key = code
	if (!key && (code === "Period" || code === "Slash")) key = code
	if (!key) return ""
	parts.push(key)
	return parts.join("+")
}

function onShortcutKeydown(e: KeyboardEvent) {
	if (!designMode.recording) return
	e.preventDefault()
	e.stopPropagation()
	if (e.key === "Escape") {
		stopShortcutRecording()
		return
	}
	const combo = comboFromEvent(e)
	if (!combo) return
	if (!e.ctrlKey && !e.altKey && !e.metaKey) {
		designMode.error = "The shortcut needs Ctrl, Alt or Cmd."
		return
	}
	designMode.pending = combo
	designMode.error = ""
	designMode.success = ""
	stopShortcutRecording()
}

function startShortcutRecording() {
	if (designMode.recording) {
		stopShortcutRecording()
		return
	}
	designMode.recording = true
	designMode.error = ""
	designMode.warning = ""
	designMode.success = ""
	window.addEventListener("keydown", onShortcutKeydown, true)
}

function stopShortcutRecording() {
	designMode.recording = false
	window.removeEventListener("keydown", onShortcutKeydown, true)
}

async function loadDesignShortcut() {
	try {
		const data = await getDesignShortcutResource.submit()
		designMode.shortcut = data?.shortcut || ""
		designMode.pending = designMode.shortcut
	} catch (err: any) {
		designMode.error = err?.message || "Could not load the Design Mode shortcut."
	}
}

async function saveDesignShortcut() {
	if (!designMode.pending) return
	designMode.busy = true
	designMode.error = ""
	designMode.warning = ""
	designMode.success = ""
	try {
		const data = await setDesignShortcutResource.submit({ shortcut: designMode.pending })
		designMode.shortcut = data?.shortcut || designMode.pending
		designMode.pending = designMode.shortcut
		designMode.success = "Saved. Reload other open pages to use the new shortcut."
		if (data?.clash) {
			designMode.warning = `Frappe or the browser already uses this for ${data.clash}. It will still work, but that action will not.`
		}
		try { sessionStorage.removeItem("nce_design_mode_shortcut") } catch {}
	} catch (err: any) {
		designMode.error = err?.message || "Could not save the shortcut."
	} finally {
		designMode.busy = false
	}
}
```

In the existing `onMounted(() => { … })` (around line 2155) add a call to `loadDesignShortcut()`. In the existing `onUnmounted` add `stopShortcutRecording()`; if there is no `onUnmounted` call yet, add `onUnmounted(stopShortcutRecording)` next to `onMounted` (`onUnmounted` is already imported).

### 5c. Build

`cd /Users/oliver3/Documents/_NCE_projects/Themes-v16/frontend && npm run build`. It must finish without type errors.

---

## Stage 6 — Supervisor checks (done by the supervising agent, not the coder)

1. Tests: `bench --site v16.localhost run-tests --app themes --module themes.tests.test_design_mode`, plus `test_component_scan` and `test_component_css_writer`.
2. `bench --site v16.localhost migrate`, `bench build --app themes`, `bench --site v16.localhost clear-cache`.
3. Theme Component Settings shows the shortcut `Ctrl+Alt+D` and the protected list.
4. Desk panel page, logged in as Administrator:
   - Ctrl+Alt+D shows the badge, and pressing it again hides it.
   - Hovering outlines parts with a label.
   - Right-click on a form-dialog tab button (`ppv2-fd-tab-btn`) opens the popup with the "Also used in" note.
   - Picking a text colour changes the page live; Cancel restores it.
   - Save persists after reload; the CSS file has the rule; all three components hold the value.
   - Revert clears it.
5. Right-click on the panel header shows "locked" with every control disabled; a direct API call `save_design_change("ppv2-float-header", …)` is refused.
6. Shift+right-click shows the browser menu. With Design Mode off, right-click is normal. Esc with the picker open closes only the picker.
7. Theme Editor System tab: record Ctrl+K and the clash warning shows; record Shift+D and the error shows; set it back to Ctrl+Alt+D.
8. A classic Desk form: no console errors; right-click while on shows "Nothing here comes from a scanned Vue component."
9. A website page (e.g. `/themes`): the script loads with no console errors and the combo shows the badge.
10. `git status` in NCE_Events-v16 shows no changed `.vue` files. Run `codeindex.py --root /Users/oliver3/Documents/_NCE_projects/Themes-v16 --write`.

---

# Part 2 — Table popup, scan on shortcut save, no read-only list

Owner decisions:
- Design Mode works only on Frappe UI elements in custom apps (anyone's), never on Desk screens.
- A change applies everywhere that component draws (for the panel table: every table drawn by PanelTable). There is no "this panel only".
- No app code is touched. Refresh happens by reloading the published CSS.
- No part is read-only any more; nothing redirects to Page Panel.
- Saving a Design Mode shortcut runs the full scan (refreshing existing records, keeping colours).

## Stage 7 — Server

### 7a. `themes/utils/design_mode.py`

1. Change `DEFAULT_PROTECTED` to an empty tuple: `DEFAULT_PROTECTED: tuple[str, ...] = ()`.
2. Add these constants and function at the end:

```python
TABLE_CLASS_FIELDS = (
	"table_header_bg_class", "table_row_bg_class", "table_row_alt_bg_class",
	"table_header_line_class", "table_header_line_color_class",
	"table_row_divider_class", "table_row_divider_color_class",
	"table_col_divider_class", "table_col_divider_color_class",
)
TABLE_FG_FIELDS = ("table_header_fg_type", "table_row_fg_type", "table_row_alt_fg_type")
TABLE_VALUE_FIELDS = (*TABLE_CLASS_FIELDS, *TABLE_FG_FIELDS)


def clean_table_values(values: dict | None) -> dict:
	"""Keep only table fields; strip strings; empty fg type becomes mono."""
	out: dict[str, str] = {}
	for f in TABLE_VALUE_FIELDS:
		if values is None or f not in values:
			continue
		v = (values.get(f) or "").strip()
		if f in TABLE_FG_FIELDS and not v:
			v = "mono"
		out[f] = v
	return out


def build_table_map(rows: list[dict]) -> dict:
	"""Map table_selector → owning component, for components with owns_table=1.

	rows: dicts with name, component_name, table_selector, table_scope_class and TABLE_VALUE_FIELDS.
	When two components own the same selector the first by component_name wins.
	"""
	result: dict[str, dict] = {}
	for row in sorted(rows, key=lambda r: r.get("component_name") or ""):
		sel = (row.get("table_selector") or "").strip()
		if not sel or not SELECTOR_RE.match(sel) or sel in result:
			continue
		values = {f: (row.get(f) or "") for f in TABLE_CLASS_FIELDS}
		for f in TABLE_FG_FIELDS:
			values[f] = (row.get(f) or "mono") or "mono"
		result[sel] = {
			"name": row.get("name") or "",
			"component_name": row.get("component_name") or "",
			"scope": (row.get("table_scope_class") or "").strip(),
			"values": values,
		}
	return result
```

### 7b. `themes/tests/test_design_mode.py` — add tests

- `build_table_map`: rows for components "Beta" (selector `t1`) and "Alpha" (selector `t1`) and "Gamma" (selector empty) → only key `t1`, owner name is Alpha's `name`; fg types default to `"mono"` when missing.
- `build_table_map` skips selector `"1bad"`.
- `clean_table_values({"table_row_bg_class": " theme-bg-primary-100 ", "table_row_fg_type": "", "junk": "x"})` returns `{"table_row_bg_class": "theme-bg-primary-100", "table_row_fg_type": "mono"}`.
- `clean_table_values(None) == {}`.

### 7c. `themes/component_api.py`

1. Extend the design_mode import to: `from themes.utils.design_mode import TABLE_VALUE_FIELDS, build_selector_map, build_table_map, clash_for, clean_table_values, normalize_shortcut, parse_protected`
2. Add `table_css_for` to the existing import from `themes.utils.component_css_writer`.
3. Replace `set_design_mode_shortcut` with:

```python
@frappe.whitelist()
def set_design_mode_shortcut(shortcut: str) -> dict:
	frappe.only_for("System Manager")
	try:
		value = normalize_shortcut(shortcut)
	except ValueError as e:
		frappe.throw(_("Shortcut {0}: {1}").format(shortcut, str(e)))
	frappe.db.set_single_value("Theme Component Settings", "design_mode_shortcut", value)
	frappe.db.commit()
	try:
		scan = rescan_all()
	except Exception as e:
		frappe.log_error(title="Design Mode scan failed")
		scan = {"error": str(e)}
	return {"shortcut": value, "clash": clash_for(value), "scan": scan}
```

4. In `get_design_mode_map`, before `theme = get_preview_theme()`, add:

```python
	table_rows = frappe.get_all(
		"Vue Component",
		filters={"status": "Present", "owns_table": 1},
		fields=["name", "component_name", "table_selector", "table_scope_class", *TABLE_VALUE_FIELDS],
	)
```
and add `"tables": build_table_map(table_rows),` to the returned dict.

5. Append these three functions:

```python
def _table_parent(name: str) -> dict:
	if not frappe.db.exists("Vue Component", name):
		frappe.throw(_("Vue Component {0} not found.").format(name))
	return frappe.db.get_value(
		"Vue Component",
		name,
		["name", "component_name", "status", "has_table", "table_selector", "table_scope_class", *TABLE_VALUE_FIELDS],
		as_dict=True,
	)


@frappe.whitelist()
def preview_design_table(name: str, values) -> dict:
	frappe.only_for("System Manager")
	if isinstance(values, str):
		values = frappe.parse_json(values)
	parent = dict(_table_parent(name))
	parent.update(clean_table_values(values))
	parent["status"] = "Present"
	parent["has_table"] = 1
	return {"css": table_css_for(parent)}


@frappe.whitelist()
def save_design_table(name: str, values) -> dict:
	frappe.only_for("System Manager")
	if isinstance(values, str):
		values = frappe.parse_json(values)
	_table_parent(name)
	doc = frappe.get_doc("Vue Component", name)
	for f, v in clean_table_values(values).items():
		doc.set(f, v)
	doc.flags.skip_css_publish = True
	doc.save()
	result = publish_component_css()
	return {"name": name, "css_hash": result.get("css_hash") or ""}
```

### 7d. Read-only list

1. `theme_component_settings.json`: set the `protected_classes` field `"default": ""` and its description to "One class per line. Design Mode shows these but does not change them. Empty by default." Update `"modified"` to `"2026-11-01 13:00:00.000000"`.
2. New patch `themes/patches/v1_0/clear_design_mode_protected.py`:

```python
import frappe


def execute():
	if not frappe.db.exists("DocType", "Theme Component Settings"):
		return
	frappe.db.set_single_value("Theme Component Settings", "protected_classes", "")
```
Register it as the last line of `themes/patches.txt`.

### 7e. Row colours must not hide the app's selected/hover row highlight

In `themes/utils/component_css_writer.py`, `table_css_for`: for the **row** and **alternate row** rules only, use a lower-specificity prefix:

```python
	scope = (parent.get("table_scope_class") or "").strip()
	row_prefix = f".{scope} .{sel}" if scope else f".{sel}"
```
and change the two targets to `f"{row_prefix} tbody tr:nth-child(even)"` and `f"{row_prefix} tbody tr:nth-child(odd)"`. Leave header, header line, row divider and column divider rules on the tripled `prefix`.

Update `themes/tests/test_component_css_writer.py`:
- `test_table_row_even`: assert `".ppv2-table tbody tr:nth-child(even)"` in css and `".ppv2-table.ppv2-table.ppv2-table tbody tr"` not in css.
- `test_table_row_odd`: same with `odd`.
- Add `test_table_row_scoped`: `table_scope_class="wrap", table_row_bg_class="theme-bg-primary-100"` → `".wrap .ppv2-table tbody tr:nth-child(even)"` in css.

Run: `bench --site v16.localhost run-tests --app themes --module themes.tests.test_design_mode` and the same with `themes.tests.test_component_css_writer`.

## Stage 8 — Table popup in `themes/public/js/design_mode.js`

Keep every existing behaviour. Add the table popup.

1. **Popup state** gets a `kind`: `"element"` (the existing popup) or `"table"`. In `openPopup` set `kind: "element"`. `renderPopup()` calls `renderTablePopup()` when `state.popup.kind === "table"`, otherwise renders as now.
2. **Right-click routing** in `onContextMenu`, after the Shift check and the "inside .ndm-popup" check, and before `findTarget`:

```js
const tbl = e.target.closest ? e.target.closest("table") : null;
if (tbl && state.map && state.map.tables) {
	for (let i = 0; i < tbl.classList.length; i++) {
		const cls = tbl.classList[i];
		if (state.map.tables[cls]) {
			e.preventDefault();
			e.stopPropagation();
			const partHit = findTarget(e.target);
			const part = partHit && partHit.el !== tbl && tbl.contains(partHit.el) ? partHit : null;
			openTablePopup(cls, part, e.clientX, e.clientY);
			return;
		}
	}
}
```
3. **Hover label**: in `onMouseMoveFrame`, if the pointer is inside a `table` whose class is in `state.map.tables`, outline the table element and label it `"{component_name} › table"`; otherwise behave as now.
4. **`openTablePopup(selector, partHit, x, y)`**: same positioning, drag, outside-click and Esc behaviour as `openPopup`. State:
```js
state.popup = { kind: "table", selector, entry: state.map.tables[selector], draft: Object.assign({}, state.map.tables[selector].values), partHit };
```
Then `updateTablePreview()`.
5. **`renderTablePopup()`** — HTML (escape every string with `esc()`):
   - Title: `{component_name} › table` + `<span class="ndm-sub">.{selector}</span>`.
   - Note: `Applies to every table drawn by {component_name}.`
   - Section heading `<div class="ndm-section">Rows</div>` then `table.ndm-table` with header `Surface | Preview | Class | (blank)` and rows:
     - `Header row` — field `table_header_bg_class`, fg `table_header_fg_type`, button `data-act="tpick" data-field="table_header_bg_class" data-kind="bg"`.
     - `Rows` — `table_row_bg_class`, fg `table_row_fg_type`.
     - `Alternate rows` — `table_row_alt_bg_class`, fg `table_row_alt_fg_type`.
     - Preview cell: `span.ndm-swatch` with the bg class (or `ndm-swatch-empty`) and the text `Aa` inside it. Class cell: the class plus ` · tonal` when that fg type is `tonal`, or `Theme default`.
   - Section heading `Lines` then `table.ndm-table` with rows:
     - `Header underline` — width select `data-act="twidth" data-field="table_header_line_class"`, colour `table_header_line_color_class` with Pick `data-act="tpick" data-kind="border"`.
     - `Row dividers` — `table_row_divider_class` / `table_row_divider_color_class`.
     - `Column dividers` — `table_col_divider_class` / `table_col_divider_color_class`.
     - Width select options are the same four as the element popup (`""` Theme default, `theme-border-thin` Thin, `theme-border` Normal, `theme-border-strong` Strong).
   - Actions row: `Revert to Theme Defaults…` (`data-act="revert"`), and, only when `partHit` is set, `Style this part instead` (`data-act="part"`, class `ndm-btn`), then `Open record`, `Cancel`, `Save`.
   - Add CSS: `.ndm-section{margin:10px 12px 0;font-size:11px;font-weight:600;text-transform:uppercase;color:#6b7280;}`.
6. **Events** (extend the existing delegated handlers; read `data-field` / `data-kind` from the clicked element):
   - `tpick`: open `themeSwatchPicker.openCore` with `getValue/setValue` on `draft[field]`, `lockKind` = `data-kind`; for `bg`, also `getFgType/setFgType` on the matching fg field (`table_header_bg_class`→`table_header_fg_type`, `table_row_bg_class`→`table_row_fg_type`, `table_row_alt_bg_class`→`table_row_alt_fg_type`). After each change: `renderPopup(); updateTablePreview();`.
   - `twidth` (change): `draft[field] = select.value`, then re-render and preview.
   - `part`: `const hit = state.popup.partHit; cancelPopup(); openPopup(hit, x, y)` using the popup's current left/top.
   - `save` when `kind === "table"`: `call("save_design_table", { name: entry.name, values: draft })`, then `reloadOverridesCss(res.css_hash)`, `entry.values = Object.assign({}, draft)`, remove the preview style, close, `toast("Saved. Every table drawn by " + entry.component_name + " is updated.", "ok")`.
   - `revert` when `kind === "table"`: confirm `"This resets every colour on " + entry.component_name + ", not just its table. Continue?"`, then `call("revert_design_components", { names: [entry.name] })`, reload CSS, close, `state.map = await call("get_design_mode_map")`, toast.
   - `open`: `/app/vue-component/{entry.name}` in a new tab.
7. **`updateTablePreview()`**: `call("preview_design_table", { name: entry.name, values: draft })` → put `res.css` into `#nce-design-preview` (create it at the end of `<head>` if missing). Errors → toast.
8. `node --check` must pass. ES2017 only: no `?.`, no `??`.

## Stage 9 — Theme Editor message after saving the shortcut

In `frontend/src/pages/ThemeSettingsPage.vue`, `saveDesignShortcut()`:
- After a successful save, if `data?.scan?.error`: `designMode.warning = "Shortcut saved, but the scan failed: " + data.scan.error`.
- Else if `data?.scan`: `designMode.success = \`Saved. Scanned ${data.scan.found} components: ${data.scan.new} new, ${data.scan.missing} missing.\``.
- Keep the existing clash warning (if both apply, put the clash text first, then a space, then the scan warning).
- Change the Save button label to show `Saving and scanning…` while `designMode.busy` is true.
- Rebuild: `cd frontend && npm run build`.

## Stage 10 — Supervisor checks

- Tests for design_mode and component_css_writer pass.
- Migrate; protected list is empty.
- Panel page: right-click a table cell → table popup for PanelTable; change Header row and Rows colours → live; Save → CSS has the rules; the panel redraws; selected and hovered rows still show their highlight; Revert clears it.
- Right-click the panel header → element popup is editable (no "locked").
- Theme Editor: save a new shortcut → message shows the scan counts.
