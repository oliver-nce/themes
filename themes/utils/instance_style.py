"""Sparse instance-level style overrides for Design Mode (layered on component rules)."""
from __future__ import annotations

import json
import re
from typing import Any

from themes.utils.theme_class_catalog import (
	PROP_BACKGROUND,
	PROP_BUTTON_OUTLINE,
	_declarations_for_property,
	effective_style_overrides,
	hover_outline_declarations,
	outline_color_var,
	outline_declarations,
	parse_style_overrides,
)

INSTANCE_ATTR = "data-nce-instance"
_INSTANCE_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{8,64}$")

FINGERPRINT_FIELDS = ("route", "nce_key", "name_tag", "label_text", "context_key")


def parse_instance_style_overrides(raw: str | dict | None) -> dict[str, str]:
	"""Sparse map: only explicitly overridden property ids."""
	return parse_style_overrides(raw)


def is_instance_property_overridden(sparse: dict[str, str] | str | None, prop_id: str) -> bool:
	bag = parse_instance_style_overrides(sparse)
	return prop_id in bag


def effective_style_for_instance(component_row: dict, instance_sparse: dict[str, str] | str | None) -> dict[str, str]:
	"""Resolved values for display on This Instance (not the stored instance payload)."""
	base = effective_style_overrides(component_row)
	if component_row.get("keep_default"):
		base = {}
	sparse = parse_instance_style_overrides(instance_sparse)
	merged = dict(base)
	merged.update(sparse)
	return merged


def instance_override_declaration_blocks(
	component_row: dict,
	instance_sparse: dict[str, str] | str | None,
) -> list[tuple[str | None, list[str]]]:
	"""CSS blocks for overridden properties only."""
	sparse = parse_instance_style_overrides(instance_sparse)
	if not sparse:
		return []
	if component_row.get("keep_default"):
		merged = effective_style_for_instance(component_row, sparse)
	else:
		merged = dict(effective_style_overrides(component_row))
		merged.update(sparse)
	outline_mode = merged.get(PROP_BUTTON_OUTLINE) == "1" and (
		PROP_BUTTON_OUTLINE in sparse or PROP_BACKGROUND in sparse
	)
	blocks: list[tuple[str | None, list[str]]] = []
	if outline_mode:
		all_decls = outline_declarations(outline_color_var(merged.get(PROP_BACKGROUND)))
		for prop_id, value in sparse.items():
			if prop_id in (PROP_BACKGROUND, PROP_BUTTON_OUTLINE):
				continue
			all_decls.extend(_declarations_for_property(prop_id, value, component_row))
		if all_decls:
			blocks.append((None, all_decls))
		blocks.append((":hover:not(:disabled)", hover_outline_declarations()))
	else:
		all_decls: list[str] = []
		for prop_id, value in sparse.items():
			all_decls.extend(_declarations_for_property(prop_id, value, component_row))
		if all_decls:
			blocks.append((None, all_decls))
		if sparse.get(PROP_BUTTON_OUTLINE) == "1":
			blocks.append((":hover:not(:disabled)", hover_outline_declarations()))
	return blocks


def instance_css_selector(selector: str, instance_id: str) -> str:
	sel = (selector or "").strip()
	iid = (instance_id or "").strip()
	return f".{sel}.{sel}.{sel}[{INSTANCE_ATTR}=\"{iid}\"]"


def preview_css_for_instance(
	selector: str,
	instance_id: str,
	component_row: dict,
	instance_sparse: dict[str, str] | str | None,
) -> str:
	prefix = instance_css_selector(selector, instance_id)
	chunks: list[str] = []
	for pseudo, block in instance_override_declaration_blocks(component_row, instance_sparse):
		if not block:
			continue
		chunks.append(f"{prefix}{pseudo or ''} {{ {' '.join(block)} }}")
	return " ".join(chunks)


def normalize_instance_id(raw: str | None) -> str:
	value = (raw or "").strip()
	if not value or not _INSTANCE_ID_RE.match(value):
		return ""
	return value


def new_instance_id() -> str:
	import frappe

	return frappe.generate_hash(length=12)


def sparse_json(overrides: dict[str, str] | str | None) -> str:
	sparse = parse_instance_style_overrides(overrides)
	if not sparse:
		return ""
	return json.dumps(sparse, sort_keys=True)


def build_save_instance_payload(
	instance_id: str | None,
	instance_sparse: dict[str, str] | str | None,
) -> dict[str, Any]:
	"""Shape sent from Design Mode save (component values are saved separately)."""
	sparse = parse_instance_style_overrides(instance_sparse)
	out: dict[str, Any] = {"instance_style_overrides": sparse}
	iid = normalize_instance_id(instance_id)
	if iid:
		out["instance_id"] = iid
	return out


def normalize_route(route: str | None) -> str:
	s = (route or "").strip()
	if not s:
		return ""
	for sep in ("?", "#"):
		idx = s.find(sep)
		if idx != -1:
			s = s[:idx]
	while "//" in s:
		s = s.replace("//", "/")
	if not s.startswith("/"):
		s = "/" + s
	if s != "/" and s.endswith("/"):
		s = s.rstrip("/")
	return s


def normalize_words(text: str | None) -> str:
	s = re.sub(r"\s+", " ", (text or "").strip())
	if len(s) > 80:
		return ""
	return s


def clean_fingerprint(payload: dict | None) -> dict:
	payload = payload or {}
	route = normalize_route(payload.get("route"))
	if len(route) > 200:
		route = route[:200]
	label_text = normalize_words(payload.get("label_text"))
	nce_key = (payload.get("nce_key") or "").strip()
	if len(nce_key) > 140:
		nce_key = nce_key[:140]
	name_tag = (payload.get("name_tag") or "").strip()
	if len(name_tag) > 140:
		name_tag = name_tag[:140]
	context_key = (payload.get("context_key") or "").strip()
	if len(context_key) > 200:
		context_key = context_key[:200]
	try:
		fit_count = int(payload.get("fit_count"))
	except (TypeError, ValueError):
		fit_count = 0
	if fit_count < 0:
		fit_count = 0
	return {
		"route": route,
		"nce_key": nce_key,
		"name_tag": name_tag,
		"label_text": label_text,
		"context_key": context_key,
		"fit_count": fit_count,
	}


def note_fits(note: dict, candidate: dict) -> bool:
	if (note.get("selector_class") or "") != (candidate.get("selector_class") or ""):
		return False
	nce_key = note.get("nce_key") or ""
	if nce_key:
		return (candidate.get("nce_key") or "") == nce_key
	for key in ("name_tag", "label_text", "context_key"):
		note_val = note.get(key) or ""
		if note_val:
			if (candidate.get(key) or "") != note_val:
				return False
	return True


def note_strength(note: dict) -> int:
	if note.get("nce_key"):
		return 10
	return sum(1 for key in ("name_tag", "label_text", "context_key") if note.get(key))


def pick_note(candidate: dict, notes: list[dict]) -> str | None:
	fitting = [n for n in notes if note_fits(n, candidate)]
	if not fitting:
		return None
	best = max(fitting, key=lambda n: (note_strength(n), n.get("modified") or ""))
	return best.get("instance_id")
