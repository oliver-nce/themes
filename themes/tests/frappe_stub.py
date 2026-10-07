"""Minimal frappe stub for unit tests outside a Frappe bench.

code-index:begin
{
 "purpose": "Installs a minimal frappe module mock so unit tests can run outside a bench.",
 "read_when": "When a test imports frappe and fails because no bench is running.",
 "gotchas": [],
 "keywords": ["install_frappe_stub", "MagicMock", "frappe.utils.password", "check_password", "sys.modules"],
 "format": 1
}
code-index:end
"""
from __future__ import annotations

import sys
from unittest.mock import MagicMock


def install_frappe_stub() -> MagicMock:
    frappe_mock = MagicMock()
    frappe_mock._ = lambda s: s
    password_mod = MagicMock()
    password_mod.check_password = MagicMock()
    utils_mod = MagicMock()
    utils_mod.password = password_mod
    frappe_mock.utils = utils_mod
    sys.modules["frappe"] = frappe_mock
    sys.modules["frappe.utils"] = utils_mod
    sys.modules["frappe.utils.password"] = password_mod
    return frappe_mock
