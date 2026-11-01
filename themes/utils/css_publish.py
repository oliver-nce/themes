# Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
"""Shared CSS publish plumbing for Web and Desk theme writers.

Extracted from css_writer.py / desk_css_writer.py (Stage 2 #3) to remove duplicated
file-write + hash-sidecar logic. publish_css() writes CSS and sidecar, optionally
stores the hash on Site Theme Config, and busts Frappe asset caches.

write_published_css writes <css_filename> and its .hash sidecar under public/css and
returns the 8-char SHA-1 hash used by hooks._css_url() for cache-busting.

"""
from __future__ import annotations

import hashlib
import os

import frappe


def css_hash_for(css: str) -> str:
    """Return the 8-char SHA-1 hash used as the published CSS cache-buster."""
    return hashlib.sha1(css.encode("utf-8")).hexdigest()[:8]


def _public_css_dir() -> str:
    css_dir = os.path.join(frappe.get_app_path("themes"), "public", "css")
    os.makedirs(css_dir, exist_ok=True)
    return css_dir


def public_css_path(css_filename: str) -> str:
    """Absolute path of public/css/<css_filename> (does not create the folder)."""
    return os.path.join(frappe.get_app_path("themes"), "public", "css", css_filename)


def write_public_css_file(css_filename: str, css: str) -> str:
    """Write public/css/<css_filename> without a hash sidecar; return its path."""
    path = os.path.join(_public_css_dir(), css_filename)
    with open(path, "w") as f:
        f.write(css)
    return path


def read_published_css_hash(css_filename: str) -> str | None:
    """Hash from the <css_filename>.hash sidecar, or None when missing or empty."""
    try:
        with open(public_css_path(f"{css_filename}.hash")) as f:
            return f.read().strip() or None
    except OSError:
        return None


def bust_asset_cache() -> None:
    """Drop Frappe's cached assets map and caches so new CSS URLs are served."""
    frappe.cache.delete_value("assets_json")
    frappe.clear_cache()


def write_published_css(css_filename: str, css: str) -> str:
    """Write <css_filename> and its .hash sidecar; return the css_hash.

    css_filename is a bare name like "nce_theme.css" or "nce_desk_theme.css".
    The sidecar is written alongside as "<css_filename>.hash". A plain file
    (not the DB) keeps hooks.py import-time and DB-free, so a missing/unreadable
    hash can never break boot — hooks.py just falls back to the bare CSS path.
    """
    css_path = write_public_css_file(css_filename, css)

    css_hash = css_hash_for(css)
    with open(css_path + ".hash", "w") as f:
        f.write(css_hash)
    return css_hash


def publish_css(css_filename: str, css: str, hash_field: str | None = None) -> str:
    """Write the CSS and sidecar, store the hash on Site Theme Config.<hash_field> if given, bust caches."""
    css_hash = write_published_css(css_filename, css)
    if hash_field:
        frappe.db.set_single_value("Site Theme Config", hash_field, css_hash)
    bust_asset_cache()
    return css_hash
