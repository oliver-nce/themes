# Vue Component Colours — coding plan (Themes app, Frappe v16)

Status: plan only, not started. Owner review required before Stage 1.
Revision 3 (2026-10-31): shared-class grouping, Preview popup (sample boxes), rule-built summary
text, text-colour picker, the PanelFormField test, and a single reset (Revert to Theme Defaults).

## 1. Goal

Add a **Vue Component** DocType to the Themes app. Each record is one `.vue` file found in an
installed app on the bench. A scan reads the file's `<template>`, lists the UI elements that take
Themes colours, and the record's **Colours** tab lets an admin pick a theme class for each element
(same swatch picker and look as the Page Panel Colours tab). Saving writes
`themes/public/css/nce_component_overrides.css`, which loads on every Desk page and recolours those
elements site-wide, under every theme. No `.vue` file is edited.

- **List view:** **Rescan** button (rescans every file) and a single red **!! Work to do** indicator.
- **Form view:** **Refresh from file** button, a rule-built **Summary** text, and a **Colours** tab
  with Pick… buttons (background, text, border), **Preview** and **Revert to Theme Defaults**.
- **Scanned:** `.vue` files of every app installed on the current site, except `frappe`, `themes` and
  apps listed in **Theme Component Settings**. `node_modules`, `dist`, `build`, `.git`,
  `__pycache__`, `.venv` folders are always skipped (so Frappe UI library components never appear).
- Records live in the site database; files are read from the bench (`frappe.get_app_path(app)`).

### Going back to defaults

One reset, for after a customisation has been saved: the **Revert to Theme Defaults** button on the
Colours tab clears every override of the component, saves, and republishes the CSS in one click.
"Default" means: no rule for the component in `nce_component_overrides.css`. Nothing in a `.vue`
file is ever changed, so reverting is just "write the CSS without this component's rules".
(Unsaved picks are undone the normal Frappe way: reload the form without saving. Deleting a record
also drops its rules, so the CSS never keeps rules for records that no longer exist.)

Out of scope (later): Preview showing the real page in a frame; replacing the Page Panel Colours tab
(NCE Events) with this method; the v15 port.

**Known limitation (document in the manual):** an override set here uses a triple-class selector
and wins over a per-panel colour set in Page Panel on the same element. Do not set overrides on
Page Panel chrome elements until Page Panel moves to this method.

## 2. Rules for the coder

- Do only the stage you are given. Do not change files that the stage does not list.
- New Python files: tabs for indentation, double quotes, type hints, `from __future__ import annotations`
  at the top. First line of each new Python file is a module docstring of one sentence.
- New JS files: tabs, double quotes, `__()` around every user-visible string,
  `frappe.utils.escape_html()` around every value inserted into HTML.
- Pure modules (`component_scan.py`, `component_sync.py`, `component_summary.py`, and
  `generate_component_css` / `declarations_for` in `component_css_writer.py`) must **not** import `frappe`
  at module level.
- Do not run `bench` commands, do not commit. The supervisor runs tests and builds.
- Copy names, field names, regexes and messages exactly as written here.

## 3. File map

| File | Stage | New/changed |
|---|---|---|
| `themes/themes/doctype/vue_component_element/__init__.py` | 1 | new (empty) |
| `themes/themes/doctype/vue_component_element/vue_component_element.json` | 1 | new |
| `themes/themes/doctype/vue_component_element/vue_component_element.py` | 1 | new |
| `themes/themes/doctype/vue_component/__init__.py` | 1 | new (empty) |
| `themes/themes/doctype/vue_component/vue_component.json` | 1 | new |
| `themes/themes/doctype/vue_component/vue_component.py` | 1 (stub), 4 (full) | new |
| `themes/themes/doctype/theme_component_settings/__init__.py` | 1 | new (empty) |
| `themes/themes/doctype/theme_component_settings/theme_component_settings.json` | 1 | new |
| `themes/themes/doctype/theme_component_settings/theme_component_settings.py` | 1 | new |
| `themes/utils/component_scan.py` | 2 | new |
| `themes/tests/fixtures/vue/*.vue` | 2 | new |
| `themes/tests/test_component_scan.py` | 2 | new |
| `themes/utils/component_sync.py` | 3 | new |
| `themes/tests/test_component_sync.py` | 3 | new |
| `themes/utils/component_css_writer.py` | 3 | new |
| `themes/tests/test_component_css_writer.py` | 3 | new |
| `themes/utils/component_summary.py` | 3 | new |
| `themes/tests/test_component_summary.py` | 3 | new |
| `themes/public/css/nce_component_overrides.css` | 3 | new (header comment only) |
| `themes/component_api.py` | 4 | new |
| `themes/hooks.py` | 4 | changed (one line) |
| `themes/themes/doctype/vue_component/vue_component_list.js` | 5 | new |
| `themes/themes/doctype/vue_component/vue_component.js` | 5 | new |

## 4. Shared constants

Put these in `themes/utils/component_sync.py`; other modules import them from there.

```python
ROLES = ("primary", "secondary", "accent", "success", "info", "warning", "danger", "neutral")
SHADES = ("50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950")
BORDER_WIDTHS = {
	"theme-border-thin": "--nce-border-width-thin",
	"theme-border": "--nce-border-width",
	"theme-border-strong": "--nce-border-width-strong",
}
ALWAYS_EXCLUDED_APPS = frozenset({"frappe", "themes"})
OVERRIDE_FIELDS = ("override_bg_class", "override_fg_type", "override_text_class",
	"override_border_width_class", "override_border_color_class")

ROLE_ALT = "|".join(ROLES)
SHADE_ALT = "|".join(SHADES)
BG_RE = re.compile(rf"^theme-bg-({ROLE_ALT})(?:-({SHADE_ALT}))?$")
TEXT_RE = re.compile(rf"^theme-text-({ROLE_ALT})(?:-({SHADE_ALT}))?(-fg(?:-tonal)?)?$")
BORDER_COLOR_RE = re.compile(rf"^theme-border-({ROLE_ALT})-({SHADE_ALT})$")
SELECTOR_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_-]*$")
```

`SKIP_DIRS = {"node_modules", "dist", "build", ".git", "__pycache__", ".venv"}` lives in `component_scan.py`.

**Group key** (used by UI, CSS writer, summary): `row.selector_class` if non-empty, else `row.element_key`.
Rows of one component with the same non-empty `selector_class` form one **group** and always share the
same override values.

---

## Stage 0 — Backup copy (supervisor, before Stage 6)

In `NCE_Events-v16`, copy
`nce_events/public/js/panel_page_v2/components/PanelFormField.vue` to
`nce_events/public/js/panel_page_v2/components/PanelFormField.vue.bak` (the `.bak` extension keeps it
out of the scan and the build). Nothing uses the copy; it is a restore point. The test runs on the real
`PanelFormField.vue`.

---

## Stage 1 — DocTypes

Create three DocTypes in module **Themes** (`"module": "Themes"`). Model each JSON file on
`themes/themes/doctype/nce_theme/nce_theme.json` (same top-level keys: `actions`, `creation`,
`doctype`, `engine`, `field_order`, `fields`, `modified`, `modified_by`, `module`, `name`, `owner`,
`permissions`, `sort_field`, `sort_order`, `states`). Use `"creation"` and `"modified"`:
`"2026-10-31 00:00:00.000000"`. Permissions: one row, role `System Manager`, with `create`,
`delete`, `read`, `write`, `export`, `print`, `share` = 1 (child table: `"permissions": []`).

### 1a. Vue Component Element (child table)

`vue_component_element.json`: `"name": "Vue Component Element"`, `"istable": 1`,
`"editable_grid": 1`. Fields, in this order:

| fieldname | fieldtype | label | options / flags |
|---|---|---|---|
| element_key | Data | Element | read_only 1, in_list_view 1, columns 2 |
| tag | Data | Tag | read_only 1, in_list_view 1, columns 1 |
| line | Int | Line | read_only 1 |
| selector_class | Data | Selector Class | in_list_view 1, columns 2, description "CSS class used to target this element. Edit only if the scanned class is not unique." |
| scanned_selector | Data | Scanned Selector | read_only 1, hidden 1 |
| source_classes | Small Text | Theme Classes In File | read_only 1 |
| binding | Small Text | Dynamic Binding | read_only 1 |
| is_dynamic | Check | Dynamic | read_only 1, default "0" |
| element_status | Select | Status | options "Present\nMissing", default "Present", read_only 1, in_list_view 1, columns 1 |
| column_break_overrides | Column Break | | |
| keep_default | Check | Keep Theme Default | default "0", in_list_view 1, columns 1 |
| override_bg_class | Data | Background | in_list_view 1, columns 2 |
| override_fg_type | Select | Text Pairing | options "\nmono\ntonal" |
| override_text_class | Data | Text Colour | |
| override_border_width_class | Select | Border Width | options "\ntheme-border-thin\ntheme-border\ntheme-border-strong" |
| override_border_color_class | Data | Border Colour | |

`vue_component_element.py`:

```python
"""Child row of Vue Component: one themed UI element found in a .vue template."""
from __future__ import annotations

from frappe.model.document import Document


class VueComponentElement(Document):
	pass
```

### 1b. Theme Component Settings (single)

`theme_component_settings.json`: `"name": "Theme Component Settings"`, `"issingle": 1`. Fields:

| fieldname | fieldtype | label | options / flags |
|---|---|---|---|
| excluded_apps | Small Text | Excluded Apps | description "One app name per line. frappe and themes are always excluded." |

`theme_component_settings.py`: same pattern as 1a, class `ThemeComponentSettings`, docstring
"Settings for the Vue Component scan (extra apps to exclude)."

### 1c. Vue Component

`vue_component.json`: `"name": "Vue Component"`, `"autoname": "hash"`,
`"title_field": "component_name"`, `"show_title_field_in_link": 1`,
`"search_fields": "component_name,app,file_path"`, `"sort_field": "modified"`,
`"sort_order": "DESC"`, `"track_changes": 1`. Fields, in this order:

| fieldname | fieldtype | label | options / flags |
|---|---|---|---|
| component_name | Data | Component | read_only 1, in_list_view 1, bold 1 |
| app | Data | App | read_only 1, in_list_view 1, in_standard_filter 1 |
| file_path | Data | File Path | read_only 1 |
| component_key | Data | Component Key | read_only 1, unique 1, hidden 1 |
| column_break_status | Column Break | | |
| status | Select | File Status | options "Present\nMissing", default "Present", read_only 1, in_standard_filter 1 |
| needs_attention | Check | Work To Do | read_only 1, default "0", in_standard_filter 1 |
| element_count | Int | Elements | read_only 1, in_list_view 1 |
| last_scanned | Datetime | Last Scanned | read_only 1 |
| source_hash | Data | Source Hash | read_only 1, hidden 1 |
| purpose | Small Text | Purpose | read_only 1, hidden 1 |
| uses_components | Small Text | Components Used | read_only 1, hidden 1 |
| section_summary | Section Break | Summary | |
| summary | Long Text | Summary | read_only 1, description "Built by fixed rules from the .vue file on every refresh. Not written by AI." |
| tab_colours | Tab Break | Colours | |
| colours_html | HTML | Colours Panel | |
| tab_elements | Tab Break | Elements | |
| elements | Table | Elements | options "Vue Component Element" |

`vue_component.py` stub: class `VueComponent(Document): pass`, docstring
"Vue Component: one scanned .vue file and the colour overrides chosen for its UI elements."

**Done when:** `bench --site <site> migrate` creates the three DocTypes without error (supervisor).

---

## Stage 2 — Scanner (pure Python)

File `themes/utils/component_scan.py`. No `frappe` import. Use only `hashlib`, `os`, `re`,
`html.parser.HTMLParser`, `pathlib.Path`.

### Public functions (exact signatures)

```python
def iter_vue_files(root: Path) -> list[Path]
def extract_template(source: str) -> tuple[str, int]
def extract_purpose(source: str) -> str
def scan_vue_source(source: str) -> dict
def scan_vue_file(path: Path) -> dict
def source_hash(source: str) -> str
def kebab_to_pascal(name: str) -> str
```

### Behaviour

**`iter_vue_files(root)`** — `os.walk(root)`; before descending, remove from `dirnames` every name in
`SKIP_DIRS`. Collect files ending in `.vue` (not `.vue.bak`). Return the list sorted by `str(path)`.

**`extract_template(source)`** — find the first match of `re.compile(r"<template(\s[^>]*)?>")`.
If none, return `("", 0)`. `start = match.end()`. `end = source.rfind("</template>")`; if
`end < start` return `("", 0)`. Return `(source[start:end], source.count("\n", 0, start))`.

**`extract_purpose(source)`** — `s = source.lstrip()`. If `s` does not start with `<!--`, return `""`.
`body = s[4 : s.find("-->")]` (return `""` if there is no `-->`). If
`re.search(r'"purpose"\s*:\s*"([^"]+)"', body)` matches, return group 1 stripped. Otherwise return the
first non-empty line of `body`, stripped, cut to 200 characters.

**`source_hash(source)`** — `hashlib.sha1(source.encode("utf-8")).hexdigest()[:12]`.

**`kebab_to_pascal(name)`** — `"panel-table"` → `"PanelTable"`; a name with no `-` is returned with
its first letter upper-cased and the rest unchanged.

**`scan_vue_source(source)`** — calls `extract_template`, feeds the template into a private
`_TemplateParser(HTMLParser)` created with `convert_charrefs=True`, and returns:

```python
{"elements": [<element dict>, ...], "uses_components": sorted list of str,
 "purpose": extract_purpose(source)}
```

`_TemplateParser` handles both `handle_starttag` and `handle_startendtag` with one method
`_on_tag(tag, attrs)`:

1. `raw = self.get_starttag_text() or ""`; original tag name =
   `re.match(r"<\s*([A-Za-z][\w.-]*)", raw).group(1)` (HTMLParser lower-cases `tag`, so always use
   the original). `line = self.getpos()[0] + self.line_offset`.
2. If the original name lower-cased is `template` or `slot`: return.
3. **Component detection.** If the original name starts with an upper-case letter or contains `-`,
   and `kebab_to_pascal(name)` is not in
   `VUE_BUILTINS = {"Transition", "TransitionGroup", "KeepAlive", "Teleport", "Suspense", "Component", "RouterView", "RouterLink"}`,
   add `kebab_to_pascal(name)` to `self.uses_components` (a set).
4. Build `a = {}` from `attrs`: key `v-bind:class` → `:class`, `v-bind:style` → `:style`; value
   `None` → `""`.
5. `tokens = a.get("class", "").split()`;
   `theme_tokens = [t for t in tokens if t.startswith("theme-")]`;
   `colour_tokens = [t for t in theme_tokens if re.match(r"^theme-(bg|text|border)(-|$)", t)]`.
6. `dyn_class = a.get(":class", "")`, `dyn_style = a.get(":style", "")`, `style = a.get("style", "")`.
7. Qualifies if any of:
   - `colour_tokens` is not empty
   - `re.search(r"(bg|fg|colou?r|border|theme)", dyn_class, re.I)`
   - `"--nce-" in dyn_style + style`

   If it does not qualify, return.
8. **Selector.** The **last** token in `tokens` that: does not start with `theme-`, matches
   `SELECTOR_RE`, and does **not** match `UTILITY_RE`. (Last, because the more specific class comes
   last: `ppv2-fd-input ppv2-fd-select` → `ppv2-fd-select`.) If none, `""`.

   ```python
   UTILITY_RE = re.compile(
   	r"^(flex|grid|block|inline|hidden|relative|absolute|fixed|sticky|items-|justify-|content-|"
   	r"self-|gap-|space-|p[xytrbl]?-|m[xytrbl]?-|w-|h-|min-|max-|text-|font-|leading-|tracking-|"
   	r"bg-|border|rounded|shadow|overflow-|z-|top-|left-|right-|bottom-|inset-|opacity-|cursor-|"
   	r"select-|truncate|whitespace-|break-|col-|row-|order-|shrink|grow|basis-|transition|"
   	r"duration-|ease-|sr-only|underline|uppercase|lowercase|capitalize|italic)"
   )
   ```
9. `element_key = selector or f"{original_name}@L{line}"`. If that key was already used in this file,
   append `#2`, `#3`, … (count per base key).
10. `binding` = `"; ".join` of the non-empty parts `f":class={dyn_class}"`, `f":style={dyn_style}"`,
    cut to 500 characters.
11. Append:

    ```python
    {"element_key": ..., "tag": original_name, "line": line, "selector_class": selector,
     "source_classes": " ".join(theme_tokens), "binding": binding,
     "is_dynamic": 1 if (dyn_class or dyn_style) else 0}
    ```

**`scan_vue_file(path)`** — read with `encoding="utf-8", errors="replace"`, return
`{**scan_vue_source(text), "component_name": path.stem, "source_hash": source_hash(text)}`.

### Fixtures (`themes/tests/fixtures/vue/`)

- `static_theme.vue`: starts with `<!--\nShows a card.\n-->`, then a `<template>` with
  `<div class="card theme-bg-surface theme-rounded">`, inside it `<h3 class="card-title theme-text-heading">`,
  and `<p class="text-sm">plain</p>` (must NOT qualify). A `<script setup>` block after the template.
- `dynamic_float.vue`: same shape as NCE Events `PanelFloat.vue`:
  root `<div class="ppv2-float theme-rounded theme-shadow-theme" :class="[frameBgClass, ...frameBorderClasses]" :style="floatStyle">`,
  child `<div class="ppv2-float-header">` with `<PanelHeaderToolbar />` inside,
  `<div class="ppv2-float-footer" :class="[footerBgClass, footerFgTextClass]">` containing
  `<span :class="footerFgExplicitClass"><slot name="footer" /></span>`.
- `no_selector.vue`: `<div class="flex p-4 theme-bg-primary-100">` and two `<li class="row theme-border">`.
- `nested_templates.vue`: outer template containing
  `<template v-if="x"><span class="badge theme-bg-success-400">ok</span></template>`,
  `<panel-table class="tbl theme-border" />` and `<select class="fd-input fd-select theme-border">`.
- `with_purpose.vue`: starts with the NCE code-index header block
  (`<!--\nRenders things.\n\ncode-index:begin\n{\n "purpose": "Renders individual form fields.",\n "format": 1\n}\ncode-index:end\n-->`)
  then a minimal template.
- `no_template.vue`: only a `<script>` block.

### Tests (`themes/tests/test_component_scan.py`, `unittest`)

Fixtures path: `Path(__file__).resolve().parent / "fixtures" / "vue"`.

1. `static_theme.vue` → keys `["card", "card-title"]`; `card.source_classes == "theme-bg-surface theme-rounded"`;
   `is_dynamic == 0`; `purpose == "Shows a card."`.
2. `dynamic_float.vue` → keys include `ppv2-float`, `ppv2-float-footer`; footer `is_dynamic == 1`, `binding`
   starts with `:class=`; `ppv2-float-header` is NOT an element; a key matching `^span@L\d+$` IS an element;
   `uses_components == ["PanelHeaderToolbar"]`.
3. `no_selector.vue` → first key matches `^div@L\d+$` with `selector_class == ""`; the two rows get keys
   `row` and `row#2`.
4. `nested_templates.vue` → `badge` found; `tbl` with tag `panel-table`; the select's key is `fd-select`
   (last-token rule); `uses_components == ["PanelTable"]`.
5. `with_purpose.vue` → `purpose == "Renders individual form fields."`.
6. `no_template.vue` → `elements == []`, `uses_components == []`.
7. `card.line` equals the 1-based line of `<div class="card` in the file.
8. `iter_vue_files` on a temp dir with `a.vue`, `a.vue.bak`, `node_modules/b.vue`, `dist/c.vue`, `sub/d.vue`
   returns only `a.vue` and `sub/d.vue`.

Run: `python3 -m unittest themes.tests.test_component_scan` from the repo root.

---

## Stage 3 — Merge logic, CSS writer, summary

### 3a. `themes/utils/component_sync.py` (pure)

Contains the shared constants of section 4 and:

```python
def group_key(row: dict) -> str
def has_override(row: dict) -> bool
def normalise_groups(rows: list[dict]) -> list[dict]
def merge_elements(existing: list[dict], scanned: list[dict]) -> list[dict]
def needs_attention(rows: list[dict], file_status: str) -> bool
```

- `group_key(row)` — `(row.get("selector_class") or "").strip() or row["element_key"]`.
- `has_override(row)` — true if any of `OVERRIDE_FIELDS` except `override_fg_type` is non-empty after
  `.strip()` (a pairing alone is not an override).
- `normalise_groups(rows)` — for each group key, take the first row (lowest `line`, rows with
  `element_status == "Present"` first) and copy its `OVERRIDE_FIELDS` and `keep_default` to every other
  row with the same group key. Return the rows in their original order.
- `merge_elements(existing, scanned)` — `existing` are current child rows as dicts (may contain `name`;
  keep it). Index existing by `element_key`. For each scanned element, in scanned order:
  - Key exists: copy the row; set `tag`, `line`, `source_classes`, `binding`, `is_dynamic` from the scan;
    `element_status = "Present"`. Selector: if `row["selector_class"] == row.get("scanned_selector", "")`
    (owner never edited it), set both `selector_class` and `scanned_selector` to the scanned selector;
    otherwise keep `selector_class` and set only `scanned_selector`. Keep override fields and `keep_default`.
  - New key: a dict with the scanned fields, `scanned_selector = selector_class`,
    `element_status = "Present"`, `keep_default = 0`, all override fields `""`.

  Then append every existing row whose key was not scanned, with `element_status = "Missing"` (keep its
  overrides). Present rows (scan order) first, then missing rows (original order). Finally return
  `normalise_groups(result)` (so a new row joining an existing group takes the group's values).
- `needs_attention(rows, file_status)` — `True` if `file_status == "Missing"`; else `True` if any
  `Present` row has an empty `selector_class`, or has neither `keep_default` truthy nor `has_override(row)`;
  else `False`.

Tests `themes/tests/test_component_sync.py`: new rows get empty overrides; an existing row keeps its
overrides after a rescan; an edited selector survives a rescan; a vanished row becomes `Missing` and goes
last; a new row with a selector shared by an existing overridden row takes that row's overrides;
`normalise_groups` copies the first row's values;
`needs_attention`: all keep_default → False; one untouched row → True; empty selector + keep_default → True;
file Missing → True; only missing rows → False.

### 3b. `themes/utils/component_css_writer.py`

```python
HEADER = "/* Generated by Themes — Vue Component colour overrides. Do not edit; change them in Desk → Vue Component. */\n"

def declarations_for(row: dict) -> list[str]           # pure
def generate_component_css(rows: list[dict]) -> str    # pure
def publish_component_css() -> dict                    # uses frappe
```

`frappe` and `write_published_css` are imported **inside** `publish_component_css` only.

**`declarations_for(row)`** — returns CSS declarations (strings ending in `;`), in this order:

- Background `override_bg_class` matching `BG_RE` (role `r`, shade `s`, `s` may be `None`):
  `v = f"--nce-color-{r}-{s}" if s else f"--nce-color-{r}"`; add `background-color: var({v});` and, unless a
  valid text override exists, `color: var({v}-fg-tonal);` when `override_fg_type == "tonal"`, else
  `color: var({v}-fg);`.
- Text `override_text_class` matching `TEXT_RE`: `rest = cls[len("theme-text-"):]`; add
  `color: var(--nce-color-{rest});`.
- Border width in `BORDER_WIDTHS`: add `border-style: solid;` and `border-width: var({BORDER_WIDTHS[cls]});`.
- Border colour matching `BORDER_COLOR_RE`: add `border-color: var(--nce-color-{r}-{s});`.
- Values that do not match their regex are ignored.

**`generate_component_css(rows)`** — each row has `component_name`, `element_key`,
`selector_class`, `line`, `element_status`, `keep_default` and the override fields.

1. Skip a row if `element_status != "Present"`, `keep_default` truthy, `selector_class` does not match
   `SELECTOR_RE`, or not `has_override(row)`.
2. Keep one row per `(component_name, selector_class)` — the one with the lowest `line`.
3. Sort by `(component_name, selector_class)`. For each row with a non-empty `declarations_for(row)` emit:

   ```
   /* {component_name} › {selector_class} */
   .{c}.{c}.{c} {
   	{declaration}
   	...
   }
   ```
   (`c = selector_class`; one declaration per line, tab-indented; a blank line between rules.)
4. Output is `HEADER` followed by the rules. No rules → just `HEADER`.

**`publish_component_css()`**:

```python
import frappe
from themes.utils.css_publish import write_published_css

parents = {p.name: p for p in frappe.get_all("Vue Component",
	fields=["name", "component_name", "status"])}
rows = []
for r in frappe.get_all("Vue Component Element",
	filters={"parenttype": "Vue Component"},
	fields=["parent", "element_key", "selector_class", "line", "element_status", "keep_default",
		"override_bg_class", "override_fg_type", "override_text_class",
		"override_border_width_class", "override_border_color_class"]):
	p = parents.get(r.parent)
	if not p or p.status != "Present":
		continue
	rows.append({**r, "component_name": p.component_name})
css = generate_component_css(rows)
css_hash = write_published_css("nce_component_overrides.css", css)
frappe.cache.delete_value("assets_json")
frappe.clear_cache()
return {"status": "ok", "css_hash": css_hash, "rules": css.count(" › ")}
```

Also create `themes/public/css/nce_component_overrides.css` containing only `HEADER`.

Tests `themes/tests/test_component_css_writer.py`: bg mono → `var(--nce-color-primary-300-fg)`; bg tonal →
`-fg-tonal`; `theme-bg-primary` → `var(--nce-color-primary)`; text override replaces the bg's `color:`
(exactly one `color:` line); border width + colour; keep_default skipped; Missing skipped;
bad selector `"my class"` skipped; invalid class `theme-bg-pink-300`
emits nothing; two rows with the same selector in one component → one rule; same input twice → same string; empty input → `HEADER`; selector tripled
(`.card.card.card {`).

### 3c. `themes/utils/component_summary.py` (pure)

```python
def describe_theme_classes(tokens: list[str]) -> str
def element_noun(tag: str, selector: str) -> str
def build_summary(comp: dict, rows: list[dict], used_by: list[str]) -> str
```

**`describe_theme_classes(tokens)`** — map each token, keep the first occurrence of each phrase, join
with `", "`; return `"no theme classes in the template"` when nothing maps. Rules, first match wins:

| Token | Phrase |
|---|---|
| `theme-bg-{role}[-{shade}]` (role in ROLES) | `{role}[ {shade}] background` |
| `theme-bg-{x}` | `{x with - → space} background` |
| `theme-text-{role}[-{shade}]-fg-tonal` | `{role}[ {shade}] tonal contrast text` |
| `theme-text-{role}[-{shade}]-fg` | `{role}[ {shade}] contrast text` |
| `theme-text-{role}[-{shade}]` | `{role}[ {shade}] text` |
| `theme-text-{x}` | `{x with - → space} text` |
| `theme-border-thin` / `theme-border` / `theme-border-strong` | `thin border` / `normal border` / `strong border` |
| `theme-border-{role}-{shade}` | `{role} {shade} border colour` |
| `theme-border-{x}` | `{x with - → space} border` |
| `theme-rounded` | `rounded corners` |
| `theme-rounded-{x}` | `{x} rounded corners` |
| `theme-shadow…` | `shadow` |
| anything else | (ignored) |

**`element_noun(tag, selector)`** — with `t = tag.lower()`:

1. If `t` in `STRONG_TAGS` → `TAG_NOUNS[t]`.
2. Else the first `(substring, noun)` in `CLASS_NOUNS` whose substring is in `selector.lower()`.
3. Else `TAG_NOUNS.get(t)`; else if `tag[0].isupper()` or `"-" in tag` → `f"{kebab_to_pascal(tag)} component"`;
   else `"element"`.

```python
STRONG_TAGS = {"input", "select", "textarea", "button", "a", "label", "h1", "h2", "h3", "h4", "h5", "h6",
	"table", "th", "td", "tr", "li", "img"}
TAG_NOUNS = {"input": "input box", "select": "dropdown", "textarea": "long text box", "button": "button",
	"a": "link", "label": "label", "h1": "heading", "h2": "heading", "h3": "heading", "h4": "heading",
	"h5": "heading", "h6": "heading", "table": "table", "thead": "table header", "th": "column header",
	"tr": "table row", "td": "table cell", "li": "list item", "ul": "list", "ol": "list", "img": "image",
	"p": "paragraph", "span": "text", "div": "box", "section": "section", "header": "header",
	"footer": "footer", "nav": "navigation", "form": "form"}
CLASS_NOUNS = [("reqd", "required marker"), ("required", "required marker"), ("desc", "help text"),
	("hint", "help text"), ("placeholder", "placeholder note"), ("textarea", "long text box"),
	("select", "dropdown"), ("input", "input box"), ("btn", "button"), ("button", "button"),
	("link", "link"), ("badge", "badge"), ("chip", "chip"), ("toolbar", "toolbar"),
	("header", "header"), ("footer", "footer"), ("title", "title"), ("heading", "heading"),
	("label", "label"), ("muted", "secondary text"), ("cell", "table cell"), ("row", "row"),
	("table", "table"), ("dialog", "dialog"), ("modal", "dialog"), ("card", "card"),
	("panel", "panel"), ("icon", "icon")]
```

**`build_summary(comp, rows, used_by)`** — `comp` has `component_name`, `app`, `file_path`, `purpose`,
`uses_components` (newline-separated). Uses only rows with
`element_status == "Present"`, grouped by `group_key` in order of first `line`. Output, lines joined
with `"\n"`:

```
{component_name} — {app}: {file_path}
Purpose: {purpose or "not stated in the file."}
Used by: {", ".join(used_by) or "no other scanned component."}
Uses: {", ".join(uses) or "no other components."}
Themed elements: {number of groups} ({number of rows} in the template)
• {group key} — {nouns}{" ×N" if N > 1}: {theme words}{"; colour also set by code" if any row in the group is_dynamic}{"; !! no class" if selector empty}
...
Colours: {a} set, {b} kept at theme default, {c} still to choose.
```

- `nouns` = distinct `element_noun(row.tag, row.selector_class)` of the group's rows, in order, joined by `" / "`.
- `theme words` = `describe_theme_classes` of all tokens of the group's `source_classes`, in order.
- Counts per group: `a` = groups whose first row `has_override`; `b` = groups whose first row has
  `keep_default` truthy and no override; `c` = the rest.
- With no present rows, the "Themed elements" line reads `Themed elements: none found.` and no bullet lines follow.

Tests `themes/tests/test_component_summary.py`: the theme-word table (one assertion per row); noun
rules (`select` + `fd-input` → `dropdown`; `span` + `ppv2-fd-reqd` → `required marker`; `p` +
`ppv2-fd-desc` → `help text`; `div` + `ppv2-float-footer` → `footer`; `PanelTable` → `PanelTable component`);
a full `build_summary` against an exact expected string; same input twice → same string.

Run: `python3 -m unittest themes.tests.test_component_sync themes.tests.test_component_css_writer themes.tests.test_component_summary`.

---

## Stage 4 — Server API, controllers, hooks

### 4a. `themes/component_api.py`

Docstring: "Whitelisted API for Vue Component: rescan, refresh, preview and publish CSS."

Private helpers:

- `ELEMENT_FIELDS` — tuple of the Stage 1a fieldnames, without `column_break_overrides`.
- `_excluded_apps() -> set[str]` — `ALWAYS_EXCLUDED_APPS` plus the non-empty stripped lines of
  `frappe.db.get_single_value("Theme Component Settings", "excluded_apps") or ""`.
- `_app_root(app: str) -> Path` — `Path(frappe.get_app_path(app)).parent` (`frappe-bench/apps/<app>`).
- `_set_rows(doc, rows: list[dict])` — `doc.set("elements", [])`, then
  `doc.append("elements", {k: v for k, v in row.items() if k in ELEMENT_FIELDS})` per row.
- `_apply_scan(doc, scan: dict | None)` — `scan is None` (file gone): `doc.status = "Missing"` and every
  row `element_status = "Missing"`. Otherwise: set `component_name`, `source_hash`, `purpose`,
  `uses_components = "\n".join(scan["uses_components"])`, `status = "Present"`, and
  `_set_rows(doc, merge_elements([r.as_dict() for r in doc.elements], scan["elements"]))`.
  Always `doc.last_scanned = frappe.utils.now_datetime()`.
- `_used_by(component_name: str, exclude_name: str) -> list[str]` — sorted `component_name`s of
  `Vue Component` records with `status == "Present"`, `name != exclude_name`, whose
  `uses_components.split("\n")` contains `component_name`.
- `_refresh_all_summaries()` — for every `Vue Component`, load the doc, build
  `build_summary(doc.as_dict(), [r.as_dict() for r in doc.elements], _used_by(doc.component_name, doc.name))`
  and write it with `frappe.db.set_value("Vue Component", doc.name, "summary", text, update_modified=False)`.

Whitelisted (each starts with `frappe.only_for("System Manager")`):

1. **`rescan_all() -> dict`**
   - `seen = set()`; counters `found`, `new`, `missing`.
   - For each `app` in `frappe.get_installed_apps()` not in `_excluded_apps()`, each `path` in
     `iter_vue_files(_app_root(app))`: `rel = path.relative_to(_app_root(app)).as_posix()`,
     `key = f"{app}:{rel}"`, `seen.add(key)`, `found += 1`. Look up
     `frappe.db.get_value("Vue Component", {"component_key": key})`; load it, or
     `frappe.new_doc("Vue Component")` with `app`, `file_path = rel`, `component_key = key` (`new += 1`).
     `_apply_scan(doc, scan_vue_file(path))`; `doc.flags.skip_css_publish = True`;
     `doc.save(ignore_permissions=True)`.
   - Every existing record whose `component_key` is not in `seen` and `status != "Missing"`:
     `_apply_scan(doc, None)`, set the flag, save, `missing += 1`.
   - `_refresh_all_summaries()`, then `publish_component_css()` once.
   - Return `{"found": found, "new": new, "missing": missing,
     "with_work": frappe.db.count("Vue Component", {"needs_attention": 1})}`.
2. **`refresh_component(name: str) -> dict`** — load; `path = _app_root(doc.app) / doc.file_path`;
   `_apply_scan(doc, scan_vue_file(path) if path.is_file() else None)`; `doc.save()`;
   `_refresh_all_summaries()` (other components' "Used by" may change);
   return `{"status": doc.status, "needs_attention": doc.needs_attention}`.
3. **`get_preview_theme() -> dict`** — `get_site_default_theme_name()` from
   `themes.utils.site_theme_config_helpers`; slug from `NCE Theme`; return `{"theme": name or "", "slug": slug or ""}`.
4. **`preview_declarations(rows) -> dict`** — `rows` is a JSON list of dicts, each with a `key` plus the
   override fields. Return `{row["key"]: " ".join(declarations_for(row)) for row in rows}`. No DB writes.
5. **`publish_css() -> dict`** — returns `publish_component_css()`.

### 4b. `vue_component.py` (replace the stub)

```python
class VueComponent(Document):
	def validate(self):
		# 1. For each row, validate non-empty values; on failure
		#    frappe.throw(_("Row {0}: {1} is not a valid {2}.").format(row.idx, value, label)):
		#      override_bg_class → BG_RE, "background class"
		#      override_text_class → TEXT_RE, "text class"
		#      override_border_color_class → BORDER_COLOR_RE, "border colour class"
		#      selector_class → SELECTOR_RE, "selector class"
		# 2. Normalise groups: rows = normalise_groups([r.as_dict() for r in self.elements]);
		#    copy OVERRIDE_FIELDS and keep_default back onto self.elements by position.
		# 3. self.element_count = number of rows with element_status == "Present".
		# 4. self.needs_attention = 1 if needs_attention(rows, self.status) else 0
		# 5. self.summary = build_summary(self.as_dict(), rows, _used_by(self.component_name, self.name))
		#    (import _used_by from themes.component_api inside the method to avoid a circular import)
	def on_update(self):
		if not self.flags.get("skip_css_publish"):
			publish_component_css()
	def after_delete(self):
		publish_component_css()
```

### 4c. `themes/hooks.py`

In `app_include_css`, add `_css_url("nce_component_overrides.css"),` as the **second** item
(directly after `_css_url("nce_theme.css"),`). Change nothing else.

**Done when (supervisor):** `bench --site <site> migrate`; in `bench --site <site> console`:
`frappe.set_user("Administrator"); from themes.component_api import rescan_all; rescan_all()` returns
counts; records exist for NCE Events files and none for `frappe` or `themes`; summaries are filled;
`nce_component_overrides.css` was rewritten.

---

## Stage 5 — Desk UI

### 5a. `vue_component_list.js`

```js
frappe.listview_settings["Vue Component"] = {
	add_fields: ["needs_attention", "status"],
	get_indicator(doc) {
		if (doc.needs_attention) {
			return [__("!! Work to do"), "red", "needs_attention,=,1"];
		}
		return [__("Done"), "green", "needs_attention,=,0"];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Rescan"), () => {
			frappe.call({
				method: "themes.component_api.rescan_all",
				freeze: true,
				freeze_message: __("Scanning .vue files…"),
				callback(r) {
					const m = r.message || {};
					frappe.show_alert({
						message: __("{0} files: {1} new, {2} missing, {3} with work to do", [
							m.found, m.new, m.missing, m.with_work,
						]),
						indicator: m.with_work ? "orange" : "green",
					});
					listview.refresh();
				},
			});
		});
	},
};
```

### 5b. `vue_component.js` (form)

Top-level functions are prefixed `_vc_`. A module-level `let _vc_preview = null;` caches the preview theme.

- `frappe.ui.form.on("Vue Component", { refresh(frm) {...}, after_save(frm) {...} })`
  - `refresh`: unless `frm.is_new()`, add button `__("Refresh from file")` →
    `frappe.call({ method: "themes.component_api.refresh_component", args: { name: frm.doc.name }, freeze: true, callback: () => frm.reload_doc() })`.
    Then `frm._vc_saved = JSON.parse(JSON.stringify(frm.doc.elements || []))` (snapshot of the saved
    rows, used by Preview), then `_vc_render_colours(frm)`.
  - `after_save`: `_vc_reload_css()`.
- `_vc_reload_css()` — for every `link[rel="stylesheet"]` whose `href` contains
  `nce_component_overrides.css`, set `href = base + "?v=" + Date.now()` (`base` = href before `?`).
  Same pattern as `_reload_nce_theme_stylesheet` in NCE Events `page_panel.js`.
- `_vc_preview_theme(cb)` — if `_vc_preview` is set, `cb(_vc_preview)`; else call
  `themes.component_api.get_preview_theme`, store the result, `cb(result)`.
- `_vc_groups(rows)` — `Present` rows grouped by group key (`selector_class || element_key`), in order of
  lowest `line`. Returns `[{ key, rows, first }]` where `first` is the lowest-line row.
- `_vc_set_group(frm, group, values)` — for every row in `group.rows`, `frappe.model.set_value(row.doctype, row.name, field, value)`
  for each `field` in `values`; then `frm.dirty()` and `_vc_render_colours(frm)`.
- `_vc_fg_tonal_class(bgClass)` — `theme-bg-{role}[-{shade}]` → `theme-text-{role}[-{shade}]-fg-tonal`, else `""`.

**`_vc_render_colours(frm)`** — target `frm.fields_dict.colours_html.$wrapper`. HTML, top to bottom:

1. Warnings (class `vc-warn`):
   - `frm.doc.status === "Missing"` → `"!! " + __("The .vue file is missing. Delete this record or restore the file.")`
   - else `frm.doc.needs_attention` → `"!! " + __("Work to do: give each element a colour, or tick Keep default.")`
2. Toolbar buttons: `__("Preview")` (`vc-preview`), `__("Revert to Theme Defaults")` (`vc-revert`),
   `__("Edit theme")` (`vc-edit-theme`, opens `/themes/theme-settings` in a new tab).
   Show `vc-revert` only when the saved rows (`frm._vc_saved`) contain at least one override or
   `keep_default` — it is for undoing a saved customisation.
3. `<div data-nce-theme="{slug}">` (attribute omitted when slug is empty) containing a table with
   header columns: Element, Preview, Class, Text, Border, (actions). One `<tr>` per **group**:
   - **Element:** group key; then small grey `tag · L{line}` of the first row, plus `" · " + __("{0} places", [n])`
     when the group has more than one row. If any row `is_dynamic`: grey `__("colour also set by code")`.
     If `first.selector_class` is empty: red `"!! " + __("no class — add one in the .vue file, set Selector Class on the Elements tab, or tick Keep default")`.
   - **Preview:** `<span class="vc-swatch {bg} {tonal}">Text</span>` with
     `bg = first.override_bg_class || first token of first.source_classes matching /^theme-bg-/ || ""`
     and `tonal = first.override_fg_type === "tonal" ? _vc_fg_tonal_class(bg) : ""`.
   - **Class:** the overrides (bg, text, border colour) in bold if any; else `first.source_classes` in grey; else `—`.
   - **Text:** `first.override_text_class` if set, else `mono`/`tonal` from `first.override_fg_type` (default `mono`).
   - **Border:** `<select class="vc-border-width" data-group="{key}">` with options `""` → `__("Theme default")`,
     `theme-border-thin` → `__("Thin")`, `theme-border` → `__("Normal")`, `theme-border-strong` → `__("Strong")`,
     then a `Pick…` button (`vc-pick-border`) and `first.override_border_color_class` if set.
   - **Actions:** `__("Pick background…")` (`vc-pick-bg`), `__("Pick text…")` (`vc-pick-text`),
     a `Keep default` checkbox (`vc-keep`, checked when `first.keep_default`).
   - All controls carry `data-group="{key}"`.
4. If any rows are `Missing`: grey `__("{0} elements no longer in the file (kept on the Elements tab).", [n])`.

**Events** (delegate with `$wrapper.off(...).on(...)`, as `_bind_colours_tab_pickers` does in `page_panel.js`).
Find the group by `data-group` from `_vc_groups(frm.doc.elements)`.

- `vc-pick-bg`, `vc-pick-text`, `vc-pick-border`: get the preview theme; if `!theme`,
  `frappe.msgprint(__("Set a Default NCE Theme first."))` and stop. If
  `!(frappe.ui && frappe.ui.themeSwatchPicker)`, show the same "ThemeSwatchPicker unavailable" msgprint as
  `page_panel.js`. Otherwise open the picker with a form shim for the group's first row; the shim writes
  to every row in the group:

  ```js
  const first = group.first;
  const shim = {
  	doc: Object.assign({}, first, { __preview_theme: theme }),
  	set_value: (f, v) => {
  		group.rows.forEach((r) => frappe.model.set_value(r.doctype, r.name, f, v));
  	},
  };
  const opts = {
  	"vc-pick-bg": { valueField: "override_bg_class", fgTypeField: "override_fg_type", lockKind: "bg" },
  	"vc-pick-text": { valueField: "override_text_class", lockKind: "text" },
  	"vc-pick-border": { valueField: "override_border_color_class", lockKind: "border" },
  }[which];
  frappe.ui.themeSwatchPicker
  	.open(Object.assign({ frm: shim, themeField: "__preview_theme" }, opts))
  	.then((saved) => { if (saved) { frm.dirty(); _vc_render_colours(frm); } });
  ```
- `vc-border-width` change: `_vc_set_group(frm, group, { override_border_width_class: val })`.
- `vc-keep` change: `_vc_set_group(frm, group, { keep_default: checked ? 1 : 0 })`.
- `vc-revert`: `frappe.confirm(__("Remove all saved colour changes for this component and go back to the theme defaults?"), () => { every Present and Missing row: set the five override fields to "" and keep_default 0 via frappe.model.set_value; then frm.save() })`.
  (Saving runs `on_update`, which republishes the CSS; `after_save` reloads it.)
- `vc-preview`: `_vc_open_preview(frm)`.

**`_vc_open_preview(frm)`** — Preview v1 (sample boxes, no real page):

1. `groups = _vc_groups(frm.doc.elements)`; `saved = _vc_groups(frm._vc_saved || [])` indexed by key.
2. Build the request rows: for each group, `{ key: "draft:" + g.key, ...overrideFields(g.first) }` and,
   when the group exists in `saved`, `{ key: "saved:" + g.key, ...overrideFields(saved.first) }`.
3. `frappe.call("themes.component_api.preview_declarations", { rows: JSON.stringify(list) })` → `decl` map.
4. Open `new frappe.ui.Dialog({ title: __("Preview — {0}", [frm.doc.component_name]), size: "extra-large", fields: [{ fieldtype: "HTML", fieldname: "body" }] })`.
5. Body: a note `__("Sample boxes using the Default theme. Changes are not saved until you press Save.")`, then a
   table inside `<div data-nce-theme="{slug}">` with columns Element, Now (saved), With your changes. Each cell
   holds one sample built by `_vc_sample(group.first, declString)`:
   - Classes: `first.source_classes` (the element's own theme classes), plus `first.selector_class`.
   - `style` attribute: the declaration string from `decl` (inline style beats the classes, same result as the
     generated CSS).
   - Element by `first.tag` lower-cased: `input` → `<input type="text" value="Sample text" readonly>`;
     `select` → `<select><option>Option</option></select>`; `textarea` → `<textarea rows="2" readonly>Sample text</textarea>`;
     `a` → `<a href="#" onclick="return false">Link text</a>`; `button` → `<button type="button">Button</button>`;
     `label` → `<label>Label</label>`; anything else → `<div style="padding:6px 10px">Sample</div>`
     (put the classes and style on that element).
   - A row whose draft and saved declarations differ gets a `vc-changed` class (light yellow background).
6. Dialog buttons: `primary_action_label: __("Save")` → `d.hide(); frm.save();`; secondary `__("Close")` → `d.hide()`.

**Styles:** inject one `<style id="vc-colours-style">` (only if not already in `document.head`): table borders,
`.vc-swatch{width:56px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;font-size:10px}`,
`.vc-warn{color:var(--red-600);font-weight:600}`, `.vc-changed{background:var(--yellow-50)}`. Copy the look of
`_colours_tab_styles_html()` in NCE Events `page_panel.js` where convenient.

**Done when (supervisor):** list shows **!! Work to do** on new records; Rescan works; in a record, each Pick…
opens the swatch picker; Preview shows saved vs changed samples; saving rewrites the CSS and the live element
changes after a page reload; Revert to Theme Defaults undoes it.

---

## Stage 6 — Verification on PanelFormField (supervisor only)

Do Stage 0 first. Test site: the owner's NCE Events dev site.

1. **Unit tests:** `python3 -m unittest themes.tests.test_component_scan themes.tests.test_component_sync themes.tests.test_component_css_writer themes.tests.test_component_summary`
   plus the existing suite (`test_css_snapshots`, `test_api_contract`, `test_color_math_parity`,
   `test_theme_service_default`, `test_token_contract_export`). All must pass.
2. `bench --site <site> migrate`, `bench build --app themes`; Desk loads with no console errors.
3. **Rescan.** Records exist for `panel_page_v2` components; none for `frappe`/`themes`; no record for
   `PanelFormField.vue.bak`.
4. **PanelFormField record.**
   - Summary: `Purpose:` is "Renders individual form dialog fields including find-mode criteria controls.";
     `Used by:` contains `PanelFormDialogBody`; `Uses:` contains `PanelFormLinkField` and `PanelFormDateTimeField`.
   - Colours tab lists at least the groups `ppv2-fd-reqd` (required marker), `ppv2-fd-desc` (help text, 2 places),
     `ppv2-fd-select` (dropdown) and `ppv2-fd-url-link` (link).
5. **Change and preview.** `ppv2-fd-reqd` → Pick text… → `theme-text-primary-600`; `ppv2-fd-select` → border
   Strong + Pick… `theme-border-primary-500`. Preview shows both rows marked changed. Save.
6. **Live check.** Open Panel Page V2, open a record's Form Dialog: the mandatory `*` is primary-coloured; dropdowns
   have a strong primary border; nothing else changed.
7. **Revert.** Press Revert to Theme Defaults → the record saves, every override and Keep default on
   PanelFormField is empty, `nce_component_overrides.css` has no `PanelFormField ›` rule, and after a reload the
   Form Dialog looks exactly as before step 5. The Revert button is hidden again (nothing saved to undo).
8. **No regressions.** `git diff themes/public/css/nce_theme.css` is empty; the Page Panel Colours tab still works;
   `PanelFormField.vue` is byte-identical to `PanelFormField.vue.bak`.
9. Update the code index: `python3 "$TOOL" --root . --write`.

## Stage 7 — Manual and screenshots (after Stage 6)

Install Playwright + Chromium; capture the Vue Component list (with !! rows), the PanelFormField record
(Summary + Colours tab), the picker, the Preview popup, and a before/after of the Form Dialog; write the
manual's section 7 around this tool, including Revert to Theme Defaults and a short section on the
Page Panel Colours tab marked "to be replaced".
