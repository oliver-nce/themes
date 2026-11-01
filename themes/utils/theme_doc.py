"""Shared helpers for the NCE Theme and NCE Desk Theme controllers and services."""

from __future__ import annotations

import re
from typing import Optional

import frappe

_SLUG_RE = re.compile(r"[^a-z0-9]+")


def slugify_theme_name(theme_name: Optional[str]) -> str:
    """Lower-case, hyphen-separated slug used to scope Active theme CSS."""
    return _SLUG_RE.sub("-", (theme_name or "").lower()).strip("-")


def in_setup() -> bool:
    """True during bench install or migrate, when controllers must not republish CSS."""
    return bool(getattr(frappe.flags, "in_install", False) or getattr(frappe.flags, "in_migrate", False))


def base_theme_json(doctype: str, base_name: Optional[str]) -> Optional[str]:
    """theme_json of the base theme record, or None when there is no such record."""
    if base_name and frappe.db.exists(doctype, base_name):
        return frappe.db.get_value(doctype, base_name, "theme_json")
    return None


def other_record(doctype: str, filters: dict, exclude_name: str) -> Optional[str]:
    """Name of the first record matching filters other than exclude_name."""
    others = frappe.db.get_all(doctype, filters={**filters, "name": ["!=", exclude_name]}, pluck="name")
    return others[0] if others else None
