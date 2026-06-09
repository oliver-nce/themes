#!/usr/bin/env bash
# Run Themes app unit tests (no Frappe bench required).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PYTHONPATH="$ROOT"

echo "=== Python: CSS snapshots ==="
python3 -m unittest themes.tests.test_css_snapshots -v

echo "=== Python: API contract ==="
python3 -m unittest themes.tests.test_api_contract -v

echo "=== Python: Color math parity ==="
python3 -m unittest themes.tests.test_color_math_parity -v

echo "=== Frontend: color-shades parity ==="
(cd "$ROOT/frontend" && npm run test:parity)

echo "All tests passed."
