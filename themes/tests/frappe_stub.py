"""Minimal frappe stub for unit tests outside a Frappe bench."""
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
