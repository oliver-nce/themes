"""Theme family descriptors — parameterize Web vs Desk CRUD without duplicating logic."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Optional, Sequence

from themes.utils.site_theme_config_helpers import (
    get_site_base_desk_theme_name,
    get_site_base_theme_name,
    set_site_base_desk_theme_name,
    set_site_base_theme_name,
)


@dataclass(frozen=True)
class ThemeFamily:
    """Configuration for one theme family (Web site tokens or Desk chrome)."""

    key: str
    doctype: str
    theme_exists_label: str
    get_base_theme_name: Callable[[], Optional[str]]
    set_base_theme_name: Callable[[str], None]
    parse_payload: Callable[[object], dict]
    load_seed_payload: Callable[[], dict]
    publish: Callable[[Optional[str]], dict]
    read_css_hash: Callable[[], Optional[str]]
    bundle_to_app: Optional[Callable[[dict], dict]]
    load_bundled_base_payload: Optional[Callable[[], dict]]
    # Web: is_active == is_base; Desk: is_active == status == Active
    is_active_is_base: bool
    include_site_active_theme_legacy: bool
    # Desk: enforce single Active theme on save/set_active
    single_active: bool
    default_create_status: str
    no_base_set_message: str
    duplicate_theme_name_message: str
    base_manage_error: str
    active_manage_error: str


def _web_parse_payload(payload):
    import json

    import frappe
    from frappe import _

    from themes.utils.theme_color_utils import resolve_neutral_into_payload
    from themes.utils.theme_tokens import TOKEN_FIELDS

    if isinstance(payload, str):
        payload = json.loads(payload)
    if not isinstance(payload, dict):
        frappe.throw(_("Invalid payload"))
    clean = {k: payload[k] for k in TOKEN_FIELDS if k in payload and payload[k] is not None}
    return resolve_neutral_into_payload(clean)


def _desk_parse_payload(payload):
    import json

    import frappe
    from frappe import _

    from themes.utils.desk_css_writer import DESK_TOKEN_FIELDS

    if isinstance(payload, str):
        payload = json.loads(payload)
    if not isinstance(payload, dict):
        frappe.throw(_("Invalid payload"))
    return {k: payload[k] for k in DESK_TOKEN_FIELDS if k in payload and payload[k] is not None}


def _web_seed_payload():
    import json

    import frappe

    base = get_site_base_theme_name()
    if base and frappe.db.exists("NCE Theme", base):
        return json.loads(frappe.db.get_value("NCE Theme", base, "theme_json") or "{}")
    return {}


def _desk_seed_payload():
    import json

    import frappe

    base = get_site_base_desk_theme_name()
    if base and frappe.db.exists("NCE Desk Theme", base):
        return json.loads(frappe.db.get_value("NCE Desk Theme", base, "theme_json") or "{}")
    return {}


def _web_css_hash():
    import frappe

    return frappe.db.get_single_value("Site Theme Config", "css_hash")


def read_web_css_hash() -> Optional[str]:
    return _web_css_hash()


def invoke_read_web_css_hash() -> Optional[str]:
    return read_web_css_hash()


def _desk_css_hash():
    from themes.utils.desk_css_writer import _read_desk_css_hash

    return _read_desk_css_hash()


def read_desk_css_hash() -> Optional[str]:
    return _desk_css_hash()


def invoke_read_desk_css_hash() -> Optional[str]:
    return read_desk_css_hash()


def _web_publish(theme_name: Optional[str]):
    from themes.utils.css_writer import publish_theme

    return publish_theme(theme_name)


def _desk_publish(theme_name: Optional[str]):
    from themes.utils.desk_css_writer import publish_desk_theme

    return publish_desk_theme(theme_name)


def _web_bundle(payload: dict):
    from themes.utils.bundle_base_theme import bundle_base_theme_to_app

    return bundle_base_theme_to_app(payload)


def _desk_bundle(payload: dict):
    from themes.utils.bundle_base_desk_theme import bundle_base_desk_theme_to_app

    return bundle_base_desk_theme_to_app(payload)


def _web_bundled_payload():
    from themes.utils.default_theme import load_bundled_base_theme_payload

    return load_bundled_base_theme_payload()


def _get_web_base() -> Optional[str]:
    return get_site_base_theme_name()


def _set_web_base(name: str) -> None:
    set_site_base_theme_name(name)


def _get_desk_base() -> Optional[str]:
    return get_site_base_desk_theme_name()


def _set_desk_base(name: str) -> None:
    set_site_base_desk_theme_name(name)


WEB_FAMILY = ThemeFamily(
    key="web",
    doctype="NCE Theme",
    theme_exists_label="NCE Theme {0} does not exist",
    get_base_theme_name=_get_web_base,
    set_base_theme_name=_set_web_base,
    parse_payload=_web_parse_payload,
    load_seed_payload=_web_seed_payload,
    publish=_web_publish,
    read_css_hash=invoke_read_web_css_hash,
    bundle_to_app=_web_bundle,
    load_bundled_base_payload=_web_bundled_payload,
    is_active_is_base=True,
    include_site_active_theme_legacy=True,
    single_active=False,
    default_create_status="Active",
    no_base_set_message="No base theme set. Configure Site Theme Config first.",
    duplicate_theme_name_message="A theme named {0} already exists",
    base_manage_error=(
        "The site base theme cannot be renamed or deleted. "
        "Choose another base theme in System first."
    ),
    active_manage_error="Set the theme to Inactive before renaming or deleting it.",
)

DESK_FAMILY = ThemeFamily(
    key="desk",
    doctype="NCE Desk Theme",
    theme_exists_label="NCE Desk Theme {0} does not exist",
    get_base_theme_name=_get_desk_base,
    set_base_theme_name=_set_desk_base,
    parse_payload=_desk_parse_payload,
    load_seed_payload=_desk_seed_payload,
    publish=_desk_publish,
    read_css_hash=invoke_read_desk_css_hash,
    bundle_to_app=_desk_bundle,
    load_bundled_base_payload=None,
    is_active_is_base=False,
    include_site_active_theme_legacy=False,
    single_active=True,
    default_create_status="Inactive",
    no_base_set_message="No base desk theme set. Configure Site Theme Config first.",
    duplicate_theme_name_message="A desk theme named {0} already exists",
    base_manage_error=(
        "The site base desk theme cannot be renamed or deleted. "
        "Choose another base desk theme in System first."
    ),
    active_manage_error="Set the desk theme to Inactive before renaming or deleting it.",
)

FAMILIES: dict[str, ThemeFamily] = {
    WEB_FAMILY.key: WEB_FAMILY,
    DESK_FAMILY.key: DESK_FAMILY,
}
