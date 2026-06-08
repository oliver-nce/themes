# Path B — Phase B5 results

**Date:** 2026-06-04  
**Commit tested locally:** `6bfcf03` (Path B `css_writer.py` on `master`)  
**Staging site:** `manager.ncesoccer.com`

---

## 1. Publish

| Environment | Command / action | Status |
|-------------|------------------|--------|
| **Local repo** | `generate_css(DEFAULT_THEME_PAYLOAD)` → `themes/public/css/nce_theme.css` | **Done** (32,014 bytes, hash `b1db5f61`) |
| **Staging server** | `git pull` in `apps/themes` + `bench --site manager.ncesoccer.com execute themes.utils.css_writer.publish_theme --args "['<active NCE Theme name>']"` | **Pending** — not run from this session (no local bench) |

**Server commands (run on staging bench):**

```bash
cd /home/frappe/frappe-bench/apps/themes && git pull
cd ~/frappe-bench
bench --site manager.ncesoccer.com migrate   # if needed
bench --site manager.ncesoccer.com execute themes.init_theme.execute
# OR, if you know the active theme name:
# bench --site manager.ncesoccer.com execute themes.utils.css_writer.publish_theme --args "['Default']"
bench --site manager.ncesoccer.com execute frappe.clear_cache
```

---

## 2. Asset check — staging (live URL)

| Field | Value |
|-------|--------|
| **URL** | https://manager.ncesoccer.com/assets/themes/css/nce_theme.css |
| **HTTP** | 200 |
| **Content-Length** | **9,093** bytes (pre–Path B; expect ~25–32 KB after publish) |
| **Last-Modified** | Thu, 04 Jun 2026 13:06:33 GMT |

**Grep on live file (2026-06-04):**

| Class / marker | Present on staging? |
|----------------|---------------------|
| `.bg-primary {` | Yes |
| `.bg-themed` | Yes |
| `.text-primary ` | **No** |
| `.bg-primary-100 ` | **No** |
| `.border-primary-300 ` | **No** |
| `.bg-surface ` | **No** |
| `.text-muted ` | **No** |
| `.rounded ` | **No** |
| `.p-md ` | **No** |

Live CSS ends after the seven `.bg-{role}` rules and `.bg-themed` — **Path B rules not deployed yet.**

---

## 3. Local generator verification (post–Path B code)

Generated with `DEFAULT_THEME_PAYLOAD` (566 lines, 32,014 bytes).

| Group | Classes checked | Result |
|-------|-----------------|--------|
| **A — Role bg** | `.bg-primary {` | PASS |
| **B — Role text/border** | `.text-primary `, `.border-primary-300 ` (via role rules) | PASS |
| **C — Shades** | `.bg-primary-100 ` | PASS |
| **D — Neutrals** | `.bg-surface `, `.text-muted `, `.text-link `, `.bg-header ` | PASS |
| **E — Shape / typo** | `.rounded `, `.shadow-theme `, `.text-base ` | PASS |
| **F — Spacing + escape** | `.p-md `, `.bg-themed` | PASS |

---

## 4. Browser inspector smoke test

| Test | Status |
|------|--------|
| `class="bg-surface text-muted rounded p-md"` on a Desk element | **Not run** — classes absent on staging until publish |
| `class="bg-primary-100 border border-primary-300 rounded p-sm"` | **Not run** — same blocker |

**Screenshots:** none (blocked on staging deploy).

After server publish, re-run in DevTools on any `<div>` and attach paths here:

- `docs/screenshots/path-b5-surface-muted.png`
- `docs/screenshots/path-b5-primary-shade-border.png`

---

## 5. Gaps

- Staging asset not regenerated after `6bfcf03` (size still ~9 KB).
- Visual smoke tests deferred until `publish_theme` on `manager.ncesoccer.com`.

---

## 6. Decision

**Gaps remain:** Staging `nce_theme.css` has not been republished with Path B emitters. Local `generate_css()` output passes the full class checklist (~32 KB).

**After successful server publish and browser smoke:** update this file to:

`Path B complete — downstream apps can lean on the full contract.`
