# Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
"""HTML copy and acknowledgement tracking for the Applications tab Must read popup."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import frappe
from frappe.utils import escape_html

DEFAULT_EXPLANATION = """\
<p>When you tick <strong>Apply</strong> for {app}, Themes adds the following to that app on this bench:</p>
<ul>
<li>A folder at <strong>{path}/public/nce-themes/</strong> containing the theme stylesheet, theme switcher script, font files, and a developer guide.</li>
<li>Two marked lines at the end of <strong>{path}/hooks.py</strong>, between <code># BEGIN nce-themes (managed)</code> and <code># END nce-themes</code>, so Frappe loads those assets on the app&apos;s own screens.</li>
</ul>
<p>Unticking <strong>Apply</strong> reverses all of this and removes only what Apply added.</p>
<h4>If your site is in developer mode</h4>
<ul>
<li><strong>Commit the current state of your app before ticking Apply.</strong> That gives you a clean point to go back to.</li>
<li>The changes appear in your app&apos;s source files, so you can see them in <code>git status</code> and commit them like any other change.</li>
<li>If you commit them, they stay in your app, survive updates, and reach anyone who pulls your code. Untick Apply first if you do not want that.</li>
<li>If you do not commit them, a <code>git checkout</code>, <code>git stash</code> or app update can remove them. Untick and re-tick Apply afterward.</li>
</ul>
<h4>If your site is live (not in developer mode)</h4>
<ul>
<li>The changes still go into the app&apos;s files on this bench. Nothing is committed anywhere.</li>
<li>An app update or reinstall (for example <code>bench update</code>) replaces the app&apos;s files and removes the changes. The row then shows &ldquo;tick Apply again&rdquo;. Untick and re-tick Apply, then clear the cache so browsers pick up the change.</li>
<li>Apply needs permission to write to the app&apos;s folder and its <code>hooks.py</code> on this bench. Developer mode is not required. If the server cannot write there, Apply stops with a message and changes nothing. In that case use <strong>Download theme bundle</strong> in the export section of the Themes editor and follow the developer guide. That download does not reverse itself when you untick Apply.</li>
</ul>
<h4>For both</h4>
<ul>
<li>The files live in the app&apos;s source tree on this bench, not just this site. If another site on the same bench uses {app}, it sees the same changes.</li>
<li>The app&apos;s own fixed colours, fonts, and corner styles are not changed. Only Frappe UI parts that use Frappe&apos;s colour palette, and anything using <code>theme-*</code> classes or <code>--nce-*</code> CSS variables, follow the theme.</li>
<li>The theme applies only on {app}&apos;s own screens, not on other apps.</li>
<li>If the Themes app is later removed from the site, {app} looks as it did before Themes was installed.</li>
</ul>
"""


def _setting(fieldname: str):
	"""Read a Theme Component Settings value; None until `bench migrate` adds the field."""
	if not frappe.get_meta("Theme Component Settings").has_field(fieldname):
		return None
	return frappe.db.get_single_value("Theme Component Settings", fieldname)


def _raw_template(text: str | None = None) -> str:
	if text is None:
		text = _setting("apply_explanation")
	if not text or not str(text).strip():
		return DEFAULT_EXPLANATION
	return str(text)


def _fingerprint(raw: str) -> str:
	return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def render_explanation(app: str, text: str | None = None) -> dict:
	raw = _raw_template(text)
	fp = _fingerprint(raw)
	app_path = escape_html(str(Path(frappe.get_app_path(app))))
	app_esc = escape_html(app)
	body = raw.replace("{app}", app_esc).replace("{path}", app_path)
	return {
		"html": body,
		"fingerprint": fp,
		"developer_mode": bool(frappe.conf.developer_mode),
	}


def read_acks() -> dict[str, str]:
	raw = _setting("apply_acknowledgements")
	if not raw or not str(raw).strip():
		return {}
	try:
		data = json.loads(raw)
	except (TypeError, ValueError):
		return {}
	if not isinstance(data, dict):
		return {}
	return {str(k): str(v) for k, v in data.items()}


def write_ack(app: str, fingerprint: str) -> None:
	acks = read_acks()
	acks[app] = fingerprint
	frappe.db.set_single_value(
		"Theme Component Settings",
		"apply_acknowledgements",
		json.dumps(acks, sort_keys=True),
	)


def is_acknowledged(app: str) -> bool:
	stored = read_acks().get(app)
	if not stored:
		return False
	return stored == render_explanation(app)["fingerprint"]
