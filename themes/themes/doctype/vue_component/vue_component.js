let _vc_preview = null;

frappe.ui.form.on("Vue Component", {
	refresh(frm) {
		frm.clear_custom_buttons();
		if (!frm.is_new()) {
			frm.add_custom_button(__("Refresh from file"), () => {
				frappe.call({
					method: "themes.component_api.refresh_component",
					args: { name: frm.doc.name },
					freeze: true,
					callback() {
						frm.reload_doc();
					},
				});
			});
		}
		frm._vc_saved = JSON.parse(JSON.stringify(frm.doc.elements || []));
		_vc_render_colours(frm);
	},
	after_save(frm) {
		_vc_reload_css();
	},
});

function _vc_reload_css() {
	document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
		const href = link.getAttribute("href") || "";
		if (href.indexOf("nce_component_overrides.css") === -1) {
			return;
		}
		const base = href.split("?")[0];
		link.setAttribute("href", base + "?v=" + Date.now());
	});
}

function _vc_preview_theme(cb) {
	if (_vc_preview) {
		cb(_vc_preview);
		return;
	}
	frappe.call({
		method: "themes.component_api.get_preview_theme",
		callback(r) {
			_vc_preview = r.message || {};
			cb(_vc_preview);
		},
	});
}

function _vc_groups(rows) {
	const present = (rows || []).filter((row) => row.element_status === "Present");
	const map = {};
	present.forEach((row) => {
		const key = (row.selector_class || "").trim() || row.element_key || "";
		if (!map[key]) {
			map[key] = [];
		}
		map[key].push(row);
	});
	const keys = Object.keys(map);
	keys.sort((a, b) => {
		const lineA = Math.min(...map[a].map((r) => cint(r.line) || 0));
		const lineB = Math.min(...map[b].map((r) => cint(r.line) || 0));
		return lineA - lineB;
	});
	return keys.map((key) => {
		const groupRows = map[key].slice().sort((a, b) => (cint(a.line) || 0) - (cint(b.line) || 0));
		return { key, rows: groupRows, first: groupRows[0] };
	});
}

function _vc_set_group(frm, group, values) {
	group.rows.forEach((row) => {
		Object.keys(values).forEach((field) => {
			frappe.model.set_value(row.doctype, row.name, field, values[field]);
		});
	});
	frm.dirty();
	_vc_render_colours(frm);
}

function _vc_fg_tonal_class(bgClass) {
	const m = (bgClass || "").match(/^theme-bg-([^-]+)(?:-(\d+))?$/);
	if (!m) {
		return "";
	}
	if (m[2]) {
		return "theme-text-" + m[1] + "-" + m[2] + "-fg-tonal";
	}
	return "theme-text-" + m[1] + "-fg-tonal";
}

function _vc_preview_bg_class(first) {
	if ((first.override_bg_class || "").trim()) {
		return first.override_bg_class.trim();
	}
	const tokens = (first.source_classes || "").split(/\s+/);
	for (let i = 0; i < tokens.length; i += 1) {
		if (/^theme-bg-/.test(tokens[i])) {
			return tokens[i];
		}
	}
	return "";
}

function _vc_class_cell_html(first) {
	const parts = [];
	if ((first.override_bg_class || "").trim()) {
		parts.push("<strong>" + frappe.utils.escape_html(first.override_bg_class.trim()) + "</strong>");
	}
	if ((first.override_text_class || "").trim()) {
		parts.push("<strong>" + frappe.utils.escape_html(first.override_text_class.trim()) + "</strong>");
	}
	if ((first.override_border_color_class || "").trim()) {
		parts.push("<strong>" + frappe.utils.escape_html(first.override_border_color_class.trim()) + "</strong>");
	}
	if (parts.length) {
		return parts.join(" ");
	}
	if ((first.source_classes || "").trim()) {
		return '<span class="vc-muted">' + frappe.utils.escape_html(first.source_classes.trim()) + "</span>";
	}
	return "—";
}

function _vc_show_revert(saved) {
	return (saved || []).some((row) => {
		if (row.keep_default) {
			return true;
		}
		return [
			"override_bg_class",
			"override_text_class",
			"override_border_width_class",
			"override_border_color_class",
		].some((f) => ((row[f] || "").trim()));
	});
}

function _vc_ensure_styles() {
	if (document.getElementById("vc-colours-style")) {
		return;
	}
	const style = document.createElement("style");
	style.id = "vc-colours-style";
	style.textContent =
		".vc-swatch{width:56px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;font-size:10px}" +
		".vc-warn{color:var(--red-600);font-weight:600}" +
		".vc-changed{background:var(--yellow-50)}" +
		".vc-colours-table{width:100%;border-collapse:collapse}" +
		".vc-colours-table td,.vc-colours-table th{border:1px solid var(--border-color);padding:6px 8px;vertical-align:middle}" +
		".vc-muted{color:var(--text-muted);font-size:12px}";
	document.head.appendChild(style);
}

function _vc_group_by_key(frm, key) {
	const groups = _vc_groups(frm.doc.elements || []);
	for (let i = 0; i < groups.length; i += 1) {
		if (groups[i].key === key) {
			return groups[i];
		}
	}
	return null;
}

function _vc_bind_colours_events(frm, $wrapper) {
	$wrapper.off("click.vc-colours change.vc-colours");

	$wrapper.on("click.vc-colours", ".vc-pick-bg", function () {
		const key = $(this).attr("data-group");
		const group = _vc_group_by_key(frm, key);
		if (group) {
			_vc_open_swatch_picker(frm, group, "bg");
		}
	});
	$wrapper.on("click.vc-colours", ".vc-pick-text", function () {
		const key = $(this).attr("data-group");
		const group = _vc_group_by_key(frm, key);
		if (group) {
			_vc_open_swatch_picker(frm, group, "text");
		}
	});
	$wrapper.on("click.vc-colours", ".vc-pick-border", function () {
		const key = $(this).attr("data-group");
		const group = _vc_group_by_key(frm, key);
		if (group) {
			_vc_open_swatch_picker(frm, group, "border");
		}
	});
	$wrapper.on("change.vc-colours", ".vc-border-width", function () {
		const key = $(this).attr("data-group");
		const group = _vc_group_by_key(frm, key);
		if (group) {
			_vc_set_group(frm, group, { override_border_width_class: $(this).val() || "" });
		}
	});
	$wrapper.on("change.vc-colours", ".vc-keep", function () {
		const key = $(this).attr("data-group");
		const group = _vc_group_by_key(frm, key);
		if (group) {
			_vc_set_group(frm, group, { keep_default: $(this).is(":checked") ? 1 : 0 });
		}
	});
	$wrapper.on("click.vc-colours", ".vc-revert", () => {
		frappe.confirm(
			__("Remove all saved colour changes for this component and go back to the theme defaults?"),
			() => {
				(frm.doc.elements || []).forEach((row) => {
					[
						"override_bg_class",
						"override_fg_type",
						"override_text_class",
						"override_border_width_class",
						"override_border_color_class",
					].forEach((f) => {
						frappe.model.set_value(row.doctype, row.name, f, "");
					});
					frappe.model.set_value(row.doctype, row.name, "keep_default", 0);
				});
				frm.save();
			},
		);
	});
	$wrapper.on("click.vc-colours", ".vc-preview", () => {
		_vc_open_preview(frm);
	});
}

function _vc_open_swatch_picker(frm, group, kind) {
	_vc_preview_theme((preview) => {
		const theme = (preview && preview.theme) || "";
		if (!theme) {
			frappe.msgprint(__("Set a Default NCE Theme first."));
			return;
		}
		if (!(frappe.ui && frappe.ui.themeSwatchPicker)) {
			frappe.msgprint({
				title: __("ThemeSwatchPicker unavailable"),
				message: __(
					"Install/build the Themes app widget (theme-swatch-picker.umd.js) and reload Desk.",
				),
				indicator: "orange",
			});
			return;
		}
		const shim = {
			doc: Object.assign({}, group.first, { __preview_theme: theme }),
			set_value: (f, v) => {
				group.rows.forEach((r) => {
					frappe.model.set_value(r.doctype, r.name, f, v);
				});
			},
		};
		const optsByKind = {
			bg: {
				valueField: "override_bg_class",
				fgTypeField: "override_fg_type",
				lockKind: "bg",
			},
			text: {
				valueField: "override_text_class",
				lockKind: "text",
			},
			border: {
				valueField: "override_border_color_class",
				lockKind: "border",
			},
		};
		const opts = optsByKind[kind];
		frappe.ui.themeSwatchPicker
			.open(Object.assign({ frm: shim, themeField: "__preview_theme" }, opts))
			.then((saved) => {
				if (saved) {
					frm.dirty();
					_vc_render_colours(frm);
				}
			});
	});
}

function _vc_render_colours(frm) {
	_vc_ensure_styles();
	const $wrapper = frm.fields_dict.colours_html.$wrapper;
	_vc_preview_theme((preview) => {
		const slug = (preview && preview.slug) || "";
		const groups = _vc_groups(frm.doc.elements || []);
		const missingCount = (frm.doc.elements || []).filter(
			(row) => row.element_status === "Missing",
		).length;
		let html = "";

		if (frm.doc.status === "Missing") {
			html +=
				'<p class="vc-warn">!! ' +
				frappe.utils.escape_html(
					__("The .vue file is missing. Delete this record or restore the file."),
				) +
				"</p>";
		} else if (frm.doc.needs_attention) {
			html +=
				'<p class="vc-warn">!! ' +
				frappe.utils.escape_html(
					__("Work to do: give each element a colour, or tick Keep default."),
				) +
				"</p>";
		}

		html += '<p class="vc-toolbar">';
		html +=
			'<button type="button" class="btn btn-default btn-sm vc-preview">' +
			frappe.utils.escape_html(__("Preview")) +
			"</button> ";
		if (_vc_show_revert(frm._vc_saved || [])) {
			html +=
				'<button type="button" class="btn btn-default btn-sm vc-revert">' +
				frappe.utils.escape_html(__("Revert to Theme Defaults")) +
				"</button> ";
		}
		html +=
			'<button type="button" class="btn btn-default btn-sm vc-edit-theme">' +
			frappe.utils.escape_html(__("Edit theme")) +
			"</button>";
		html += "</p>";

		if (slug) {
			html += '<div data-nce-theme="' + frappe.utils.escape_html(slug) + '">';
		} else {
			html += "<div>";
		}
		html += '<table class="vc-colours-table"><thead><tr>';
		html += "<th>" + frappe.utils.escape_html(__("Element")) + "</th>";
		html += "<th>" + frappe.utils.escape_html(__("Preview")) + "</th>";
		html += "<th>" + frappe.utils.escape_html(__("Class")) + "</th>";
		html += "<th>" + frappe.utils.escape_html(__("Text")) + "</th>";
		html += "<th>" + frappe.utils.escape_html(__("Border")) + "</th>";
		html += "<th></th>";
		html += "</tr></thead><tbody>";

		groups.forEach((group) => {
			const first = group.first;
			const escKey = frappe.utils.escape_html(group.key);
			const dataGroup = frappe.utils.escape_html(group.key);
			const bg = _vc_preview_bg_class(first);
			const tonal =
				first.override_fg_type === "tonal" && bg ? _vc_fg_tonal_class(bg) : "";
			const swatchClasses = ["vc-swatch", bg, tonal].filter(Boolean).join(" ");
			const textVal = (first.override_text_class || "").trim()
				? first.override_text_class.trim()
				: (first.override_fg_type || "mono");
			const borderWidth = first.override_border_width_class || "";
			const anyDynamic = group.rows.some((r) => r.is_dynamic);

			html += "<tr>";
			html += "<td>";
			html += "<div>" + escKey + "</div>";
			html +=
				'<div class="vc-muted">' +
				frappe.utils.escape_html(first.tag || "") +
				" · L" +
				frappe.utils.escape_html(String(first.line || "")) +
				(group.rows.length > 1
					? " · " + frappe.utils.escape_html(__("{0} places", [group.rows.length]))
					: "") +
				"</div>";
			if (anyDynamic) {
				html +=
					'<div class="vc-muted">' +
					frappe.utils.escape_html(__("colour also set by code")) +
					"</div>";
			}
			if (!(first.selector_class || "").trim()) {
				html +=
					'<div class="vc-warn">!! ' +
					frappe.utils.escape_html(
						__(
							"no class — add one in the .vue file, set Selector Class on the Elements tab, or tick Keep default",
						),
					) +
					"</div>";
			}
			html += "</td>";
			html +=
				'<td><span class="' +
				frappe.utils.escape_html(swatchClasses) +
				'">' +
				frappe.utils.escape_html(__("Text")) +
				"</span></td>";
			html += "<td>" + _vc_class_cell_html(first) + "</td>";
			html += "<td>" + frappe.utils.escape_html(textVal) + "</td>";
			html += "<td>";
			html +=
				'<select class="vc-border-width form-control input-sm" data-group="' +
				dataGroup +
				'">';
			html +=
				'<option value=""' +
				(borderWidth === "" ? " selected" : "") +
				">" +
				frappe.utils.escape_html(__("Theme default")) +
				"</option>";
			html +=
				'<option value="theme-border-thin"' +
				(borderWidth === "theme-border-thin" ? " selected" : "") +
				">" +
				frappe.utils.escape_html(__("Thin")) +
				"</option>";
			html +=
				'<option value="theme-border"' +
				(borderWidth === "theme-border" ? " selected" : "") +
				">" +
				frappe.utils.escape_html(__("Normal")) +
				"</option>";
			html +=
				'<option value="theme-border-strong"' +
				(borderWidth === "theme-border-strong" ? " selected" : "") +
				">" +
				frappe.utils.escape_html(__("Strong")) +
				"</option>";
			html += "</select> ";
			html +=
				'<button type="button" class="btn btn-default btn-xs vc-pick-border" data-group="' +
				dataGroup +
				'">' +
				frappe.utils.escape_html(__("Pick…")) +
				"</button>";
			if ((first.override_border_color_class || "").trim()) {
				html +=
					" " + frappe.utils.escape_html(first.override_border_color_class.trim());
			}
			html += "</td>";
			html += "<td>";
			html +=
				'<button type="button" class="btn btn-default btn-xs vc-pick-bg" data-group="' +
				dataGroup +
				'">' +
				frappe.utils.escape_html(__("Pick background…")) +
				"</button> ";
			html +=
				'<button type="button" class="btn btn-default btn-xs vc-pick-text" data-group="' +
				dataGroup +
				'">' +
				frappe.utils.escape_html(__("Pick text…")) +
				"</button> ";
			html +=
				'<label><input type="checkbox" class="vc-keep" data-group="' +
				dataGroup +
				'"' +
				(first.keep_default ? " checked" : "") +
				"> " +
				frappe.utils.escape_html(__("Keep default")) +
				"</label>";
			html += "</td>";
			html += "</tr>";
		});

		html += "</tbody></table></div>";

		if (missingCount) {
			html +=
				'<p class="vc-muted">' +
				frappe.utils.escape_html(
					__("{0} elements no longer in the file (kept on the Elements tab).", [missingCount]),
				) +
				"</p>";
		}

		$wrapper.html(html);

		$wrapper.find(".vc-edit-theme").on("click", () => {
			window.open("/themes/theme-settings", "_blank");
		});

		_vc_bind_colours_events(frm, $wrapper);
	});
}

function _vc_override_payload(row) {
	if (row.keep_default) {
		return {
			override_bg_class: "",
			override_fg_type: "",
			override_text_class: "",
			override_border_width_class: "",
			override_border_color_class: "",
			keep_default: 1,
		};
	}
	return {
		override_bg_class: row.override_bg_class || "",
		override_fg_type: row.override_fg_type || "",
		override_text_class: row.override_text_class || "",
		override_border_width_class: row.override_border_width_class || "",
		override_border_color_class: row.override_border_color_class || "",
		keep_default: row.keep_default || 0,
	};
}

function _vc_sample(row, decl) {
	const tag = (row.tag || "").toLowerCase();
	const classes = [row.source_classes, row.selector_class]
		.filter((c) => (c || "").trim())
		.join(" ")
		.trim();
	const classAttr = classes
		? ' class="' + frappe.utils.escape_html(classes) + '"'
		: "";
	const styleAttr = decl
		? ' style="' + frappe.utils.escape_html(decl) + '"'
		: "";

	if (tag === "input") {
		return (
			'<input type="text" value="Sample text" readonly' + classAttr + styleAttr + ">"
		);
	}
	if (tag === "select") {
		return (
			"<select" +
			classAttr +
			styleAttr +
			"><option>" +
			frappe.utils.escape_html(__("Option")) +
			"</option></select>"
		);
	}
	if (tag === "textarea") {
		return (
			"<textarea rows=\"2\" readonly" +
			classAttr +
			styleAttr +
			">" +
			frappe.utils.escape_html(__("Sample text")) +
			"</textarea>"
		);
	}
	if (tag === "a") {
		return (
			'<a href="#" onclick="return false"' +
			classAttr +
			styleAttr +
			">" +
			frappe.utils.escape_html(__("Link text")) +
			"</a>"
		);
	}
	if (tag === "button") {
		return (
			'<button type="button"' +
			classAttr +
			styleAttr +
			">" +
			frappe.utils.escape_html(__("Button")) +
			"</button>"
		);
	}
	if (tag === "label") {
		return (
			"<label" +
			classAttr +
			styleAttr +
			">" +
			frappe.utils.escape_html(__("Label")) +
			"</label>"
		);
	}
	const divStyle = decl ? "padding:6px 10px; " + decl : "padding:6px 10px";
	return (
		"<div" +
		classAttr +
		' style="' +
		frappe.utils.escape_html(divStyle) +
		'">' +
		frappe.utils.escape_html(__("Sample")) +
		"</div>"
	);
}

function _vc_open_preview(frm) {
	const groups = _vc_groups(frm.doc.elements || []);
	const savedGroups = _vc_groups(frm._vc_saved || []);
	const savedByKey = {};
	savedGroups.forEach((g) => {
		savedByKey[g.key] = g;
	});

	const list = [];
	groups.forEach((g) => {
		list.push(
			Object.assign({ key: "draft:" + g.key }, _vc_override_payload(g.first)),
		);
		if (savedByKey[g.key]) {
			list.push(
				Object.assign(
					{ key: "saved:" + g.key },
					_vc_override_payload(savedByKey[g.key].first),
				),
			);
		}
	});

	frappe.call({
		method: "themes.component_api.preview_declarations",
		args: { rows: JSON.stringify(list) },
		callback(r) {
			const decl = r.message || {};
			_vc_preview_theme((preview) => {
				const slug = (preview && preview.slug) || "";
				let bodyHtml =
					"<p>" +
					frappe.utils.escape_html(
						__(
							"Sample boxes using the Default theme. Changes are not saved until you press Save.",
						),
					) +
					"</p>";
				if (slug) {
					bodyHtml +=
						'<div data-nce-theme="' + frappe.utils.escape_html(slug) + '">';
				} else {
					bodyHtml += "<div>";
				}
				bodyHtml += '<table class="vc-colours-table"><thead><tr>';
				bodyHtml += "<th>" + frappe.utils.escape_html(__("Element")) + "</th>";
				bodyHtml +=
					"<th>" + frappe.utils.escape_html(__("Now (saved)")) + "</th>";
				bodyHtml +=
					"<th>" +
					frappe.utils.escape_html(__("With your changes")) +
					"</th>";
				bodyHtml += "</tr></thead><tbody>";

				groups.forEach((g) => {
					const draftKey = "draft:" + g.key;
					const savedKey = "saved:" + g.key;
					const draftDecl = decl[draftKey] || "";
					const savedDecl = decl[savedKey] || "";
					const changed = draftDecl !== savedDecl;
					bodyHtml += "<tr" + (changed ? ' class="vc-changed"' : "") + ">";
					bodyHtml +=
						"<td>" + frappe.utils.escape_html(g.key) + "</td>";
					bodyHtml +=
						"<td>" + _vc_sample(g.first, savedDecl) + "</td>";
					bodyHtml +=
						"<td>" + _vc_sample(g.first, draftDecl) + "</td>";
					bodyHtml += "</tr>";
				});

				bodyHtml += "</tbody></table></div>";

				const d = new frappe.ui.Dialog({
					title: __("Preview — {0}", [frm.doc.component_name]),
					size: "extra-large",
					fields: [{ fieldtype: "HTML", fieldname: "body" }],
					primary_action_label: __("Save"),
					primary_action() {
						d.hide();
						frm.save();
					},
				});
				d.set_secondary_action_label(__("Close"));
				d.set_secondary_action(() => {
					d.hide();
				});
				d.fields_dict.body.$wrapper.html(bodyHtml);
				d.show();
			});
		},
	});
}
