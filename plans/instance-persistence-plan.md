# Design Mode: make "This Instance" changes stick (first pass: clues)

## Goal

A This Instance change saved in Design Mode stays on its element after a reload, a Vue
redraw or a move between Desk screens, in any app, with Design Mode on or off, and with
no change to the consuming apps.

## How it works (plain words)

1. **Save.** The This Instance note (`Vue Component Instance Style`) records a
   description of the element: the screen it was on, its class, its name tag, its words
   and its surroundings.
2. **Draw.** A small script, `instance_apply.js`, runs on every Desk and website screen.
   It loads the notes for the screen in the browser tab, finds every element that fits
   each description, and writes `data-nce-instance="<id>"` on it. The existing rule in
   `nce_component_overrides.css` then applies the style.
3. **Redraw.** The script runs again after every Vue redraw and every move between
   screens.

## Decisions already agreed

- Clues, in this order of strength:
  - a `data-nce-instance` the app wrote itself (never touched by Themes)
  - a `data-nce-key` the app wrote itself
  - the screen
  - the class
  - the name tag
  - the words
  - the surroundings
- **Position is not a clue.** Moving an element must not move its style to another one.
- **If several elements fit, all of them get the style.** The popup shows how many
  before Save.
- **If nothing fits,** the note is reported when Design Mode is turned on.
- **Repeated lines (`v-for`):** every copy that fits gets the same style, which is
  accepted.
- **Plain Frappe JavaScript screens** are out of scope. Only elements the scan finds in
  `.vue` files can be picked.
- **Not in this pass:** writing `data-nce-key` tags into apps' `.vue` files during
  Apply. That is a later pass.

## Words used in this plan

- **Note:** one `Vue Component Instance Style` record.
- **Description:** the clue fields of a note: `route`, `nce_key`, `name_tag`,
  `label_text`, `context_key`.
- **Candidate:** an element in the browser tab's document that has the note's
  `selector_class`.
- **Fits:** a candidate matches the note's description (rules in Stage 1, step 3).
- **Auto stamp:** a `data-nce-instance` written by `instance_apply.js`. It is always
  written together with `data-nce-instance-auto="1"`. An element with
  `data-nce-instance` but without `data-nce-instance-auto` was stamped by the app and
  is never changed.

## Owner step needed (not done by the agent)

Stage 1 adds fields to the `Vue Component Instance Style` doctype. The site's database
needs a migrate before those fields exist. Bench is not used by the agent: the owner
runs the migrate, or says how it is normally done on this site.

---

## Stage 1: description fields, server rules and the read API

**Files:**

- `themes/themes/doctype/vue_component_instance_style/vue_component_instance_style.json`
- `themes/utils/instance_style.py`
- `themes/component_api.py`
- `themes/tests/test_instance_style.py`

1. **Doctype JSON.** Append the fields below to `field_order` after
   `instance_style_overrides`, and to `fields`. Keep every existing field unchanged.
   Bump `modified` to `2026-11-03 12:00:00.000000`.
   - `route`: Data. Label "Screen". `search_index: 1`, `in_list_view: 1`. Description
     "Browser path the change was saved on, e.g. /desk/nce-events/panel-page-mirrored."
   - `nce_key`: Data. Label "App Key (data-nce-key)".
   - `name_tag`: Data. Label "Name Tag". Description "title, aria-label or name of
     the element at save."
   - `label_text`: Small Text. Label "Words".
   - `context_key`: Data. Label "Surroundings". Description "Nearest identified
     container, e.g. heading:Products."
   - `fit_count`: Int. Label "Fits At Save". `read_only: 1`.

2. **`instance_style.py`: add these pure functions.** Use no `frappe` import at module
   level. Keep every existing function unchanged.
   - `FINGERPRINT_FIELDS = ("route", "nce_key", "name_tag", "label_text", "context_key")`
   - `normalize_route(route: str | None) -> str`
     1. Strip whitespace.
     2. Drop everything from the first `?` or `#`.
     3. Collapse repeated `/`.
     4. Ensure a leading `/`.
     5. Drop a trailing `/` unless the result is `/`.
     6. Return `""` for empty input.
   - `normalize_words(text: str | None) -> str`: collapse all whitespace runs to one
     space and strip. If the result is longer than 80 characters, return `""`.
   - `clean_fingerprint(payload: dict | None) -> dict`: return a dict with every key in
     `FINGERPRINT_FIELDS` plus `fit_count`.
     - `route` goes through `normalize_route`, truncated to 200 characters.
     - `label_text` goes through `normalize_words`.
     - `nce_key` and `name_tag` are stripped and truncated to 140 characters.
     - `context_key` is stripped and truncated to 200 characters.
     - `fit_count` is `int(value)` clamped to ≥ 0, or 0 when missing or invalid.
     - Missing keys become `""`.
   - `note_fits(note: dict, candidate: dict) -> bool`. This is the reference rule; the
     JavaScript in Stage 2 must follow it exactly. `note` and `candidate` both carry the
     fingerprint keys plus `selector_class`.
     1. If `selector_class` values differ, return `False`.
     2. If `note["nce_key"]` is non-empty, return
        `candidate.get("nce_key") == note["nce_key"]`.
     3. Otherwise, for each of `name_tag`, `label_text` and `context_key` that is
        non-empty on the note, the candidate value must be equal. If a value differs,
        return `False`.
     4. Return `True`. A note with no clues fits every candidate with its class.
   - `note_strength(note: dict) -> int`: 10 when `nce_key` is set, otherwise the count
     of non-empty values among `name_tag`, `label_text` and `context_key`.
   - `pick_note(candidate: dict, notes: list[dict]) -> str | None`
     1. Among the notes where `note_fits` is true, take the one with the highest
        `note_strength`.
     2. On a tie, take the latest `modified` (an ISO string compares correctly).
     3. Return its `instance_id`, or `None` when no note fits.

3. **`component_api._save_instance_style`.**
   - After parsing `instance_payload`, compute
     `fp = clean_fingerprint(instance_payload)`.
   - When inserting a new doc, include `**fp`.
   - When updating an existing doc, `doc.update(fp)` before `save`.
   - Leave the deletion branch unchanged.

4. **`component_api.get_instance_style`.** Add the five fingerprint fields and
   `fit_count` to the returned dict. Use `""` or `0` for a missing doc.

5. **New whitelisted method in `component_api.py`,** placed after
   `get_instance_style`:

   ```python
   @frappe.whitelist(allow_guest=True)
   def get_instances_for_route(route: str) -> list[dict]:
   ```

   - Normalise `route` with `normalize_route`. Return `[]` if it is empty, or if
     `frappe.db.table_exists("tabVue Component Instance Style")` is false.
   - Read with `frappe.get_all("Vue Component Instance Style", filters={"route": r},
     fields=["instance_id", "selector_class", "nce_key", "name_tag", "label_text",
     "context_key", "instance_style_overrides", "modified"])`.
   - Drop rows whose parsed overrides are empty.
   - Return dicts without `instance_style_overrides`, with `modified` as `str`.
   - No `_require_design()`. The data is read-only, and everything in it is already
     visible on screen.

6. **Tests** in `themes/tests/test_instance_style.py`. Add a new class
   `TestInstanceFingerprint`.
   - `normalize_route`: cases `"/desk/x/"` → `"/desk/x"`; `"desk//x?a=1#b"` →
     `"/desk/x"`; `"/"` → `"/"`; `""` → `""`.
   - `normalize_words`: whitespace collapse; an 81-character string → `""`.
   - `clean_fingerprint`:
     - every key is always present
     - truncation applies
     - `fit_count` handles `"3"`, `-1` and `None`
   - `note_fits`:
     - a different class is false
     - `nce_key` match is true even when the words differ
     - `nce_key` mismatch is false
     - every stored clue must match
     - a clue that is empty on the note is ignored
     - a note with no clues fits every candidate of that class
   - `pick_note`:
     - the stronger note wins
     - a tie is broken by the later `modified`
     - no fit gives `None`
   - Do not change the existing tests.

**Done when:**

- `python3 -m unittest themes.tests.test_instance_style` passes
- `python3 -m unittest discover -s themes/tests -t .` passes as before
- the JSON is valid

---

## Stage 2: `instance_apply.js` (always loaded)

**Files:**

- new `themes/public/js/instance_apply.js`
- `themes/hooks.py`

1. **Shape.** A plain IIFE in the same style as `design_mode.js`, with no build step.
   Guard with `if (window.nceInstanceApply) return;`. Constants:
   - `INSTANCE_ATTR = "data-nce-instance"`
   - `AUTO_ATTR = "data-nce-instance-auto"`
   - `KEY_ATTR = "data-nce-key"`
   - `OVERLAY_ID = "nce-design-mode"`
   - `DEBOUNCE_MS = 150`

2. **`currentRoute()`.** Normalise `location.pathname` with the same steps as
   `normalize_route` in Stage 1.

3. **`describe(el)`** returns `{route, nce_key, name_tag, label_text, context_key}`.
   - `route`: `currentRoute()`.
   - `nce_key`: the element's own `data-nce-key`, trimmed.
   - `name_tag`: the first non-empty trimmed value of `title`, `aria-label`, `name`.
   - `label_text`: `textContent` with whitespace collapsed and trimmed. `""` if longer
     than 80 characters.
   - `context_key`: walk up from `el.parentElement`, at most 8 levels, stopping at
     `document.body`. For each ancestor, the first rule that applies wins:
     1. `data-nce-key` gives `"key:<value>"`.
     2. An `id` that does not match `/\d{4,}/` and does not start with `headlessui-`,
        `radix-` or `reka-` gives `"id:<id>"`.
     3. `aria-label` gives `"aria:<value>"`.
     4. A direct child `h1`–`h4` that does not contain `el`, with normalised text of
        1–60 characters, gives `"heading:<text>"`.

     If nothing applies, return `""`.

4. **`fits(note, el)`.** Mirror `note_fits` from Stage 1 exactly, using `describe(el)`
   as the candidate. The class check is
   `el.classList.contains(note.selector_class)`.

5. **Candidates for a note.**
   `document.querySelectorAll("." + CSS.escape(note.selector_class))`, skipping:
   - elements inside `#nce-design-mode`
   - elements with `data-nce-instance` but no `data-nce-instance-auto`. These are
     app-owned: never change them, and count them as fitting only when their value
     equals `note.instance_id`.

6. **`run()`.**
   1. If the route changed since the last load, call `load(route)` and return. `load`
      calls `run` again when it finishes.
   2. Build `desired`, a `Map` from element to `instance_id`. For each candidate across
      all notes, pick the note with `pick_note` semantics (strength, then `modified`).
      If more than one note fits one element, log
      `console.debug("[nce-instance] several notes fit", el, ids)`.
   3. For every element currently carrying `data-nce-instance-auto`:
      - not in `desired`: remove both attributes
      - in `desired` with a different id: set the new id
   4. For every element in `desired` without the right id, set `data-nce-instance` and
      `data-nce-instance-auto="1"`. Only set an attribute when its value differs, so
      the step is idempotent.
   5. Record `lastMissing`: the notes with zero fitting elements.

7. **`load(route)`.**
   - POST to `/api/method/themes.component_api.get_instances_for_route` with
     `{route}`. Send JSON headers, plus `X-Frappe-CSRF-Token` when `frappe.csrf_token`
     or `window.csrf_token` exists.
   - Cache the result per route in memory. Network errors leave an empty list and log
     once with `console.debug`.
   - After loading, call `run()`.

8. **Observer.**
   - `MutationObserver` on `document.body` with
     `{childList: true, subtree: true, characterData: true}` calls `schedule()`, a
     150 ms debounce of `run()`.
   - Do not observe attributes. Stamping only changes attributes, so it can't
     retrigger the observer.
   - Also call `schedule()` on `popstate`.
   - Start on `DOMContentLoaded`, or straight away if the document is already loaded,
     by calling `load(currentRoute())`.

9. **Public API:**

   ```js
   window.nceInstanceApply = {
     describe,
     countFits(note), // number of fitting candidates now
     refresh(),       // drop the cache for the current route, load and run; returns a Promise
     missing(),       // a copy of lastMissing
     currentRoute,
   };
   ```

   `countFits` takes `{selector_class, ...describe(el)}`.

10. **`hooks.py`.**
    - Insert `"/assets/themes/js/instance_apply.js?v=20261103a"` immediately before the
      `design_mode.js` entry, in both `app_include_js` and `web_include_js`.
    - Bump the `design_mode.js` query string to `?v=20261103c` in both lists.

**Done when:**

- `node --check themes/public/js/instance_apply.js` passes
- `test_hooks_dynamic_css` still passes
- the matching rules agree with the Stage 1 tests, checked line by line in review

---

## Stage 3: Design Mode uses the description

**File:** `themes/public/js/design_mode.js`

1. **`buildInstanceSavePayload`.** When a payload is returned and
   `state.popup.targetEl` and `window.nceInstanceApply` exist:
   - merge `nceInstanceApply.describe(state.popup.targetEl)` into the payload
   - set `payload.fit_count` to
     `nceInstanceApply.countFits(Object.assign({selector_class: <popup selector>}, desc))`
   - The popup selector is `state.popup.selector` for elements, and the table selector
     for tables.

2. **`savePopup`, both branches.**
   - Wherever `INSTANCE_ATTR` is set on `targetEl`, also set
     `data-nce-instance-auto="1"`.
   - Wherever it is removed, also remove `data-nce-instance-auto`.
   - After `reloadOverridesCss(...)`, call
     `window.nceInstanceApply && window.nceInstanceApply.refresh()` without awaiting
     it. This puts the id on every element that fits and drops it from elements no
     longer covered.

3. **Popup notes** in `openElementPopup` and `openTablePopup`, before the dialog
   opens:
   1. Compute `desc` for the target element and `n = countFits(...)`.
   2. Push one note:
      - `n === 1`: `"This Instance is recognised by " + <clue list> + "."`. The clue
        list joins the non-empty clues as "its app key", "its name tag", "its words
        'X'" and "its surroundings (Y)".
      - `n > 1`: `"This Instance description fits " + n + " elements on this screen.
        A This Instance change applies to all " + n + "."`
      - No clues at all:
        `"Nothing on this element tells it apart: a This Instance change applies to
        every ." + selector + " on this screen."`
   3. If `openTablePopup` does not pass `notes` yet, pass the array.

4. **`turnOn`.** After the map has loaded and the overlay is mounted, call
   `nceInstanceApply.refresh()`. When it finishes, if `missing().length > 0`:
   - `toast(n + " This Instance change(s) saved for this screen fit no element. Details in the browser console.", "err")`
   - `console.table` the missing notes: `instance_id`, `selector_class`, `name_tag`,
     `label_text` and `context_key`

5. Make no other behaviour changes. Do not touch the Vue dialog bundle, so no
   `npm run build:design` is needed.

**Done when:**

- `node --check themes/public/js/design_mode.js` passes
- the existing Python tests still pass

---

## Stage 4: docs and manual check

1. **`docs/theme-system/07-using-in-vue.md`.** Add a section titled "Keeping This
   Instance changes" before "Frappe Desk vs SPA". In plain words, cover:
   - how notes find elements (the clues)
   - that position is not used
   - that several fitting elements all get the style
   - that an app's own `data-nce-instance` is never changed
   - that `data-nce-key="<stable key>"` is the strongest way for an app to name an
     element, with a one-line example
   - that elements inside a `v-for` share their changes unless each has its own
     `data-nce-key`
2. **Code index.** Run `python3 "$TOOL" --root . --write`.

---

## Checks run by the supervising agent after each stage

- **Python:** `python3 -m unittest discover -s themes/tests -t .`. Compare against a
  baseline run taken before Stage 1.
- **JS:** `node --check` on both scripts.
- **Diff review** for unrelated changes. These must stay untouched:
  - `THEME_CLASS_CONTRACT.json`
  - consuming apps
  - the dialog bundle
- **Specificity.** Confirm `nce_component_overrides.css` still has no `!important` in
  component rules. The instance rule `.sel.sel.sel[data-nce-instance]` (0,4,0) beats
  component rules and `theme-*` utilities (0,1,0).

## Manual acceptance check (after the owner's migrate)

1. Open `/desk/nce-events/panel-page-mirrored` (the Panel Page Mirrored screen).
   Turn Design Mode on. Pick the "New Woo Commerce Product" button and choose This
   Instance. The popup shows the "recognised by" or "fits N" note.
2. Set a background and Save. The button changes.
3. Turn Design Mode off and hard-reload the Panel Page Mirrored screen. The button
   keeps the background, and no other button gets it unless the popup said it fits
   several.
4. Make the actions list redraw, for example by refreshing its data. The style stays.
5. Open another Desk screen, then come back. The style stays.
6. In a second app's Vue screen, repeat steps 1–3 on a different component. No change
   to that app is needed.
7. In Design Mode, clear the This Instance changes on that button and Save. The style
   goes away. Reload: it stays gone.
8. Rename the button's words in the data, then reload with Design Mode on. The toast
   reports one change that fits no element.

## Known limits of this pass

- **Words or a name tag change:** the note stops fitting and shows as missing.
- **Notes saved before this change** have no screen recorded. They are not applied
  and stay as they behave today.
- **Desk form screens** such as `/desk/product/PROD-0042` include the record in the
  route. A note saved there applies only to that record's form.
