# Fresh Install Verification (Task 13, Step 6)

Run on the **staging bench** (`manager.ncesoccer.com` server). There is no local bench.

## 1. Create throwaway site

```bash
cd ~/frappe-bench

# Use a unique site name; drop if re-running
bench drop-site themes-fresh-test.local --force --no-backup 2>/dev/null || true

bench new-site themes-fresh-test.local --admin-password admin --no-mariadb-socket
bench --site themes-fresh-test.local install-app themes
bench --site themes-fresh-test.local migrate
```

## 2. Expected outcomes

| Check | Expected |
|-------|----------|
| `install-app themes` | Completes with no traceback |
| `after_install` | Empty **Site Theme Config** row exists |
| Migration patch | Creates **NCE Theme** `Default` (from empty legacy Theme Settings) |
| `active_theme` | Set to `Default` |
| `nce_theme.css` | File exists under `apps/themes/themes/public/css/` |

Phase 4 note: **Theme Version is not required.** Do not create Theme Version records.

## 3. Automated checks

```bash
bench --site themes-fresh-test.local execute themes.verify_fresh_install.run
```

Expect printed `PASS` lines and exit code 0.

## 4. Manual smoke test

```bash
bench --site themes-fresh-test.local console
```

```python
import frappe
frappe.get_single("Site Theme Config").as_dict()
frappe.get_doc("NCE Theme", "Default").as_dict()
```

Create a second theme and switch:

```python
t = frappe.new_doc("NCE Theme")
t.theme_name = "Fresh Test Alt"
t.flags.ignore_permissions = True
t.insert()  # auto-copies Default theme_json

cfg = frappe.get_single("Site Theme Config")
cfg.active_theme = t.name
cfg.save()
```

Confirm CSS regenerated:

```bash
ls -la apps/themes/themes/public/css/nce_theme.css
bench --site themes-fresh-test.local execute frappe.clear_cache
```

## 5. Cleanup

```bash
bench drop-site themes-fresh-test.local --force --no-backup
```

## Record results

After running, note date, bench host, and pass/fail in `docs/themes-app-agent-handoff.md` under **Verification**.
