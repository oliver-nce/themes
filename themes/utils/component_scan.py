"""Scan .vue files for themed template elements and component usage."""
from __future__ import annotations

import hashlib
import os
import re
from html.parser import HTMLParser
from pathlib import Path

from themes.utils.component_sync import SELECTOR_RE

SKIP_DIRS = {"node_modules", "dist", "build", ".git", "__pycache__", ".venv"}

UTILITY_RE = re.compile(
	r"^(flex|grid|block|inline|hidden|relative|absolute|fixed|sticky|items-|justify-|content-|"
	r"self-|gap-|space-|p[xytrbl]?-|m[xytrbl]?-|w-|h-|min-|max-|text-|font-|leading-|tracking-|"
	r"bg-|border|rounded|shadow|overflow-|z-|top-|left-|right-|bottom-|inset-|opacity-|cursor-|"
	r"select-|truncate|whitespace-|break-|col-|row-|order-|shrink|grow|basis-|transition|"
	r"duration-|ease-|sr-only|underline|uppercase|lowercase|capitalize|italic)"
)

VUE_BUILTINS = frozenset({
	"Transition",
	"TransitionGroup",
	"KeepAlive",
	"Teleport",
	"Suspense",
	"Component",
	"RouterView",
	"RouterLink",
})

_TEMPLATE_OPEN_RE = re.compile(r"<template(\s[^>]*)?>")


def iter_vue_files(root: Path) -> list[Path]:
	found: list[Path] = []
	for dirpath, dirnames, filenames in os.walk(root):
		dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
		for name in filenames:
			if name.endswith(".vue") and not name.endswith(".vue.bak"):
				found.append(Path(dirpath) / name)
	return sorted(found, key=str)


def extract_template(source: str) -> tuple[str, int]:
	match = _TEMPLATE_OPEN_RE.search(source)
	if not match:
		return ("", 0)
	start = match.end()
	end = source.rfind("</template>")
	if end < start:
		return ("", 0)
	return (source[start:end], source.count("\n", 0, start))


def extract_purpose(source: str) -> str:
	s = source.lstrip()
	if not s.startswith("<!--"):
		return ""
	close = s.find("-->")
	if close < 0:
		return ""
	body = s[4:close]
	purpose_match = re.search(r'"purpose"\s*:\s*"([^"]+)"', body)
	if purpose_match:
		return purpose_match.group(1).strip()
	for line in body.splitlines():
		stripped = line.strip()
		if stripped:
			return stripped[:200]
	return ""


def source_hash(source: str) -> str:
	return hashlib.sha1(source.encode("utf-8")).hexdigest()[:12]


def kebab_to_pascal(name: str) -> str:
	if "-" not in name:
		return name[0].upper() + name[1:] if name else name
	return "".join(part.capitalize() for part in name.split("-"))


class _TemplateParser(HTMLParser):
	def __init__(self, line_offset: int) -> None:
		super().__init__(convert_charrefs=True)
		self.line_offset = line_offset
		self.elements: list[dict] = []
		self.uses_components: set[str] = set()
		self._key_counts: dict[str, int] = {}

	def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
		self._on_tag(tag, attrs)

	def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
		self._on_tag(tag, attrs)

	def _on_tag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
		raw = self.get_starttag_text() or ""
		name_match = re.match(r"<\s*([A-Za-z][\w.-]*)", raw)
		if not name_match:
			return
		original_name = name_match.group(1)
		line = self.getpos()[0] + self.line_offset
		if original_name.lower() in ("template", "slot"):
			return
		pascal = kebab_to_pascal(original_name)
		if (original_name[0].isupper() or "-" in original_name) and pascal not in VUE_BUILTINS:
			self.uses_components.add(pascal)
		a: dict[str, str] = {}
		for key, value in attrs:
			norm_key = key
			if key == "v-bind:class":
				norm_key = ":class"
			elif key == "v-bind:style":
				norm_key = ":style"
			a[norm_key] = value if value is not None else ""
		tokens = a.get("class", "").split()
		theme_tokens = [t for t in tokens if t.startswith("theme-")]
		colour_tokens = [
			t for t in theme_tokens if re.match(r"^theme-(bg|text|border)(-|$)", t)
		]
		dyn_class = a.get(":class", "")
		dyn_style = a.get(":style", "")
		style = a.get("style", "")
		qualifies = bool(colour_tokens)
		if not qualifies and dyn_class:
			qualifies = bool(re.search(r"(bg|fg|colou?r|border|theme)", dyn_class, re.I))
		if not qualifies and "--nce-" in dyn_style + style:
			qualifies = True
		if not qualifies:
			return
		selector = ""
		for token in reversed(tokens):
			if token.startswith("theme-"):
				continue
			if not SELECTOR_RE.match(token):
				continue
			if UTILITY_RE.match(token):
				continue
			selector = token
			break
		base_key = selector or f"{original_name}@L{line}"
		self._key_counts[base_key] = self._key_counts.get(base_key, 0) + 1
		count = self._key_counts[base_key]
		element_key = base_key if count == 1 else f"{base_key}#{count}"
		parts: list[str] = []
		if dyn_class:
			parts.append(f":class={dyn_class}")
		if dyn_style:
			parts.append(f":style={dyn_style}")
		binding = "; ".join(parts)[:500]
		self.elements.append({
			"element_key": element_key,
			"tag": original_name,
			"line": line,
			"selector_class": selector,
			"source_classes": " ".join(theme_tokens),
			"binding": binding,
			"is_dynamic": 1 if (dyn_class or dyn_style) else 0,
		})


def scan_vue_source(source: str) -> dict:
	template, line_offset = extract_template(source)
	parser = _TemplateParser(line_offset)
	if template:
		parser.feed(template)
		parser.close()
	return {
		"elements": parser.elements,
		"uses_components": sorted(parser.uses_components),
		"purpose": extract_purpose(source),
	}


def scan_vue_file(path: Path) -> dict:
	text = path.read_text(encoding="utf-8", errors="replace")
	return {
		**scan_vue_source(text),
		"component_name": path.stem,
		"source_hash": source_hash(text),
	}
