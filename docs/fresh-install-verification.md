<!--
Staging checklist that a fresh Themes install creates Site Theme Config, Default, and nce_theme.css.

-->

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
| Migration patch | Creates **NCE Theme** `Default` via `after_install` (legacy Theme Settings removed) |
| `active_theme` | Set to `Default` |
| `nce_theme.css` | File exists under `apps/themes/themes/public/css/` |

Phase 5 note: **Theme Version** and **Theme Settings** DocTypes are removed.

## 3. Automated checks

```bash
# scripts/ is not a Python package, so `bench execute` cannot import it.
# Run the script through the bench console instead:
echo 'import runpy; runpy.run_path(frappe.get_app_path("themes", "..", "scripts", "verify_fresh_install.py"))["run"]()' \
  | bench --site themes-fresh-test.local console
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

After running, note the date, bench host, and pass/fail in your release notes or the pull request description.
