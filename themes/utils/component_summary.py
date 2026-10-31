"""Rule-built summary text for Vue Component records."""
from __future__ import annotations

import re

from themes.utils.component_scan import kebab_to_pascal
from themes.utils.component_sync import BG_RE, BORDER_COLOR_RE, TEXT_RE, group_key, has_override

STRONG_TAGS = {"input", "select", "textarea", "button", "a", "label", "h1", "h2", "h3", "h4", "h5", "h6",
	"table", "th", "td", "tr", "li", "img"}
TAG_NOUNS = {"input": "input box", "select": "dropdown", "textarea": "long text box", "button": "button",
	"a": "link", "label": "label", "h1": "heading", "h2": "heading", "h3": "heading", "h4": "heading",
	"h5": "heading", "h6": "heading", "table": "table", "thead": "table header", "th": "column header",
	"tr": "table row", "td": "table cell", "li": "list item", "ul": "list", "ol": "list", "img": "image",
	"p": "paragraph", "span": "text", "div": "box", "section": "section", "header": "header",
	"footer": "footer", "nav": "navigation", "form": "form"}
CLASS_NOUNS = [("reqd", "required marker"), ("required", "required marker"), ("desc", "help text"),
	("hint", "help text"), ("placeholder", "placeholder note"), ("textarea", "long text box"),
	("select", "dropdown"), ("input", "input box"), ("btn", "button"), ("button", "button"),
	("link", "link"), ("badge", "badge"), ("chip", "chip"), ("toolbar", "toolbar"),
	("header", "header"), ("footer", "footer"), ("title", "title"), ("heading", "heading"),
	("label", "label"), ("muted", "secondary text"), ("cell", "table cell"), ("row", "row"),
	("table", "table"), ("dialog", "dialog"), ("modal", "dialog"), ("card", "card"),
	("panel", "panel"), ("icon", "icon")]


def _role_shade_phrase(role: str, shade: str | None, suffix: str) -> str:
	if shade:
		return f"{role} {shade} {suffix}"
	return f"{role} {suffix}"


def _phrase_for_token(token: str) -> str | None:
	bg_match = BG_RE.match(token)
	if bg_match:
		role, shade = bg_match.group(1), bg_match.group(2)
		return _role_shade_phrase(role, shade, "background")

	if token.startswith("theme-bg-"):
		x = token[len("theme-bg-"):].replace("-", " ")
		return f"{x} background"

	text_match = TEXT_RE.match(token)
	if text_match:
		role, shade, fg = text_match.group(1), text_match.group(2), text_match.group(3)
		if fg == "-fg-tonal":
			return _role_shade_phrase(role, shade, "tonal contrast text")
		if fg == "-fg":
			return _role_shade_phrase(role, shade, "contrast text")
		return _role_shade_phrase(role, shade, "text")

	if token.startswith("theme-text-"):
		x = token[len("theme-text-"):].replace("-", " ")
		return f"{x} text"

	if token == "theme-border-thin":
		return "thin border"
	if token == "theme-border":
		return "normal border"
	if token == "theme-border-strong":
		return "strong border"

	border_match = BORDER_COLOR_RE.match(token)
	if border_match:
		role, shade = border_match.group(1), border_match.group(2)
		return f"{role} {shade} border colour"

	if token.startswith("theme-border-"):
		x = token[len("theme-border-"):].replace("-", " ")
		return f"{x} border"

	if token == "theme-rounded":
		return "rounded corners"
	if token.startswith("theme-rounded-"):
		x = token[len("theme-rounded-"):]
		return f"{x} rounded corners"

	if token.startswith("theme-shadow"):
		return "shadow"

	return None


def describe_theme_classes(tokens: list[str]) -> str:
	seen_phrases: set[str] = set()
	phrases: list[str] = []
	for token in tokens:
		phrase = _phrase_for_token(token)
		if phrase and phrase not in seen_phrases:
			seen_phrases.add(phrase)
			phrases.append(phrase)
	if not phrases:
		return "no theme classes in the template"
	return ", ".join(phrases)


def element_noun(tag: str, selector: str) -> str:
	t = tag.lower()
	if t in STRONG_TAGS:
		return TAG_NOUNS[t]
	sel = selector.lower()
	for substring, noun in CLASS_NOUNS:
		if substring in sel:
			return noun
	if t in TAG_NOUNS:
		return TAG_NOUNS[t]
	if tag and (tag[0].isupper() or "-" in tag):
		return f"{kebab_to_pascal(tag)} component"
	return "element"


def build_summary(comp: dict, rows: list[dict], used_by: list[str]) -> str:
	component_name = comp.get("component_name") or ""
	app = comp.get("app") or ""
	file_path = comp.get("file_path") or ""
	purpose = (comp.get("purpose") or "").strip() or "not stated in the file."
	uses_raw = comp.get("uses_components") or ""
	uses = [u.strip() for u in uses_raw.split("\n") if u.strip()]

	present = [r for r in rows if r.get("element_status") == "Present"]
	lines = [
		f"{component_name} — {app}: {file_path}",
		f"Purpose: {purpose}",
		f"Used by: {', '.join(used_by) or 'no other scanned component.'}",
		f"Uses: {', '.join(uses) or 'no other components.'}",
	]

	if not present:
		lines.append("Themed elements: none found.")
		lines.append("Colours: 0 set, 0 kept at theme default, 0 still to choose.")
		return "\n".join(lines)

	group_order: list[str] = []
	groups: dict[str, list[dict]] = {}
	for row in sorted(present, key=lambda r: int(r.get("line") or 0)):
		key = group_key(row)
		if key not in groups:
			group_order.append(key)
			groups[key] = []
		groups[key].append(row)

	lines.append(f"Themed elements: {len(group_order)} ({len(present)} in the template)")

	count_a = count_b = count_c = 0
	for key in group_order:
		members = groups[key]
		first = min(members, key=lambda r: int(r.get("line") or 0))
		if has_override(first):
			count_a += 1
		elif first.get("keep_default"):
			count_b += 1
		else:
			count_c += 1

		nouns_seen: set[str] = set()
		noun_list: list[str] = []
		for row in sorted(members, key=lambda r: int(r.get("line") or 0)):
			noun = element_noun(row.get("tag") or "", row.get("selector_class") or "")
			if noun not in nouns_seen:
				nouns_seen.add(noun)
				noun_list.append(noun)
		nouns = " / ".join(noun_list)
		if len(members) > 1:
			nouns = f"{nouns} ×{len(members)}"

		all_tokens: list[str] = []
		for row in sorted(members, key=lambda r: int(r.get("line") or 0)):
			classes = (row.get("source_classes") or "").split()
			all_tokens.extend(classes)
		theme_words = describe_theme_classes(all_tokens)

		extras: list[str] = []
		if any(row.get("is_dynamic") for row in members):
			extras.append("colour also set by code")
		if not (first.get("selector_class") or "").strip():
			extras.append("!! no class")
		detail = theme_words
		if extras:
			detail = "; ".join([theme_words] + extras)
		lines.append(f"• {key} — {nouns}: {detail}")

	lines.append(f"Colours: {count_a} set, {count_b} kept at theme default, {count_c} still to choose.")
	return "\n".join(lines)
