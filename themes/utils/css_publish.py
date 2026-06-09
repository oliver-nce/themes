"""Shared CSS publish plumbing for Web and Desk theme writers.

Extracted from css_writer.py / desk_css_writer.py (Stage 2 #3) to remove duplicated
file-write + hash-sidecar logic. Cache busting and Site Theme Config css_hash updates
stay in the callers because their ordering and DB side-effects differ between Web and Desk.

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


def write_published_css(css_filename: str, css: str) -> str:
    """Write <css_filename> and its .hash sidecar; return the css_hash.

    css_filename is a bare name like "nce_theme.css" or "nce_desk_theme.css".
    The sidecar is written alongside as "<css_filename>.hash". A plain file
    (not the DB) keeps hooks.py import-time and DB-free, so a missing/unreadable
    hash can never break boot — hooks.py just falls back to the bare CSS path.
    """
    css_dir = _public_css_dir()
    css_path = os.path.join(css_dir, css_filename)
    with open(css_path, "w") as f:
        f.write(css)

    css_hash = css_hash_for(css)
    with open(css_path + ".hash", "w") as f:
        f.write(css_hash)
    return css_hash
