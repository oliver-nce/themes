let _vc_preview = null;

const VC_TABLE_CLASS_FIELDS = [
	"table_header_bg_class",
	"table_row_bg_class",
	"table_row_alt_bg_class",
	"table_header_line_class",
	"table_header_line_color_class",
	"table_row_divider_class",
	"table_row_divider_color_class",
	"table_col_divider_class",
	"table_col_divider_color_class",
];

const VC_TABLE_ROW_SLOTS = [
	{
		label: __("Header row"),
		field: "table_header_bg_class",
		fgField: "table_header_fg_type",
		fallback: "theme-bg-table-header",
	},
	{
		label: __("Row (main / even)"),
		field: "table_row_bg_class",
		fgField: "table_row_fg_type",
		fallback: "theme-bg-row",
	},
	{
		label: __("Row (alternate / odd)"),
		field: "table_row_alt_bg_class",
		fgField: "table_row_alt_fg_type",
		fallback: "theme-bg-row-alt",
	},
];

const VC_TABLE_LINE_SLOTS = [
	{
		label: __("Column header underline"),
		widthField: "table_header_line_class",
		colorField: "table_header_line_color_class",
	},
	{
		label: __("Horizontal dividers"),
		widthField: "table_row_divider_class",
		colorField: "table_row_divider_color_class",
	},
	{
		label: __("Vertical dividers"),
		widthField: "table_col_divider_class",
		colorField: "table_col_divider_color_class",
	},
];

frappe.ui.form.on("Vue Component", {
	refresh(frm) {
		frm.clear_custom_buttons();
		if (!frm.is_new()) {
			frm.add_custom_button(__("Refresh from file"), () => {
				_vc_refresh_from_file(frm);
			});
		}
		frm._vc_saved = JSON.parse(JSON.stringify(frm.doc.elements || []));
		frm._vc_table_saved = _vc_table_saved_from_doc(frm.doc);
		_vc_render_colours(frm);
		_vc_render_inside(frm);
	},
	after_save(frm) {
		_vc_reload_css();
	},
});

function _vc_refresh_from_file(frm) {
	frappe.call({
		method: "themes.component_api.refresh_component",
		args: { name: frm.doc.name },
		freeze: true,
		callback() {
			frm.reload_doc();
		},
	});
}

function _vc_table_saved_from_doc(doc) {
	const snap = {};
	VC_TABLE_CLASS_FIELDS.forEach((f) => {
		snap[f] = doc[f] || "";
	});
	return snap;
}

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

function _vc_show_revert(savedElements, savedTable) {
	const elementsDirty = (savedElements || []).some((row) => {
		if (row.keep_default) {
			return true;
		}
		return [
			"override_bg_class",
			"override_text_class",
			"override_border_width_class",
			"override_border_color_class",
			"override_button_size_class",
		].some((f) => ((row[f] || "").trim()));
	});
	if (elementsDirty) {
		return true;
	}
	return VC_TABLE_CLASS_FIELDS.some((f) => ((savedTable[f] || "").trim()));
}

function _vc_ensure_styles() {
	const css =
		".vc-colours-wrap .vc-chrome-table{width:100%;max-width:760px;background:#fff;table-layout:fixed;margin:0}" +
		".vc-colours-wrap .vc-chrome-table thead th{padding:6px 10px;background:#f7f7f7;font-weight:600;font-size:13px;vertical-align:middle}" +
		".vc-colours-wrap .vc-chrome-table tbody td{padding:8px 10px;font-size:12px;vertical-align:middle}" +
		".vc-colours-wrap .vc-class-default{color:#8d99a6}" +
		".vc-colours-wrap .vc-class-custom{color:#36414c;font-weight:600}" +
		".vc-colours-wrap .vc-class-cell{font-family:monospace;font-size:12px}" +
		".vc-colours-wrap .vc-section-title{margin:18px 0 8px;font-weight:600;font-size:13px}" +
		".vc-colours-wrap .vc-section-title:first-child{margin-top:0}" +
		".vc-colours-wrap .vc-theme-row{display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap;margin-bottom:8px}" +
		".vc-colours-wrap .vc-theme-label{font-weight:600;font-size:13px;margin-bottom:4px;display:block}" +
		".vc-colours-wrap .vc-theme-name{display:block;min-width:220px;border:1px solid #d1d8dd;background:#f4f5f6;border-radius:4px;padding:4px 8px;font-size:13px}" +
		".vc-colours-wrap .vc-muted{color:#8d99a6;font-size:12px}" +
		".vc-colours-wrap .vc-warn{color:#e24c4c;font-weight:600}" +
		".vc-colours-wrap .vc-swatch{width:36px;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;border:1px solid #d1d8dd;font-size:10px;box-sizing:border-box}" +
		".vc-colours-wrap .vc-swatch-empty{background:#f4f5f6;color:#8d99a6}" +
		".vc-colours-wrap .vc-quiet{margin-top:4px;display:flex;align-items:center;flex-wrap:wrap;gap:6px}" +
		".vc-colours-wrap .vc-revert{padding-left:0;margin:0 0 10px}" +
		".vc-colours-wrap .vc-table-preview-wrap{margin:10px 0 14px;overflow:hidden;border-radius:6px;border:1px solid #d1d8dd;max-width:420px}" +
		".vc-colours-wrap .vc-table-preview{width:100%;border-collapse:collapse;font-size:12px}" +
		".vc-colours-wrap .vc-table-preview th:not([class*='theme-bg-']){background:var(--nce-color-table-header);color:var(--nce-color-table-header-fg,var(--nce-color-text))}" +
		".vc-colours-wrap .vc-table-preview tbody tr:nth-child(odd):not([class*='theme-bg-']){background:var(--nce-color-row-alt)}" +
		".vc-colours-wrap .vc-table-preview tbody tr:nth-child(even):not([class*='theme-bg-']){background:var(--nce-color-row)}" +
		".vc-colours-wrap .vc-table-preview th,.vc-colours-wrap .vc-table-preview td{padding:5px 8px;text-align:left;border-bottom:var(--nce-border-width-table-row,1px) solid var(--nce-color-table-row-divider,#d1d8dd);border-right:var(--nce-border-width-table-col,1px) solid var(--nce-color-table-col-divider,#d1d8dd)}" +
		".vc-colours-wrap .vc-table-preview th:last-child,.vc-colours-wrap .vc-table-preview td:last-child{border-right:none}" +
		".vc-colours-wrap .vc-line-preview{display:block;width:48px;border-bottom-style:solid;border-bottom-color:var(--nce-color-table-row-divider,#d1d8dd)}" +
		".vc-colours-wrap .vc-changed{background:var(--yellow-50)}" +
		".vc-colours-wrap .vc-border-width,.vc-colours-wrap .vc-table-width{font-size:11px;height:24px;padding:2px 4px;max-width:120px;display:inline-block;width:auto}" +
		".vc-inside .vc-inside-link{margin-right:12px}" +
		".vc-inside .vc-section-title{margin:8px 0;font-weight:600;font-size:13px}";
	let style = document.getElementById("vc-colours-style-v2");
	if (!style) {
		style = document.createElement("style");
		style.id = "vc-colours-style-v2";
		document.head.appendChild(style);
	}
	style.textContent = css;
}

function _vc_render_inside(frm) {
	if (frm.is_new() || !frm.fields_dict.inside_html) {
		return;
	}
	const field = frm.fields_dict.inside_html;
	const $wrapper = field.$wrapper;
	_vc_ensure_styles();
	frappe.call({
		method: "themes.component_api.components_inside",
		args: { name: frm.doc.name },
		callback(r) {
			const children = r.message || [];
			if (!children.length) {
				frm.toggle_display("inside_html", false);
				$wrapper.empty();
				return;
			}
			frm.toggle_display("inside_html", true);
			const links = children
				.map((child) => {
					const docname = frappe.utils.escape_html(child.name);
					const label = frappe.utils.escape_html(child.component_name);
					return (
						'<a href="#" class="vc-inside-link" data-name="' +
						docname +
						'">' +
						label +
						"</a>"
					);
				})
				.join(" ");
			$wrapper.html(
				'<div class="vc-inside">' +
					'<div class="vc-section-title">' +
					__("Inside this component") +
					"</div>" +
					links +
					"</div>"
			);
			$wrapper
				.off("click.vc-inside")
				.on("click.vc-inside", ".vc-inside-link", (e) => {
					e.preventDefault();
					const name = $(e.currentTarget).data("name");
					if (name) {
						frappe.set_route("Form", "Vue Component", name);
					}
				});
		},
	});
}

function _vc_element_swatch_html(first) {
	const overrideBg = (first.override_bg_class || "").trim();
	const bg = overrideBg || _vc_preview_bg_class(first);
	const overrideText = (first.override_text_class || "").trim();
	let classes = ["vc-swatch"];
	if (bg) {
		const tonal = first.override_fg_type === "tonal" ? _vc_fg_tonal_class(bg) : "";
		classes = classes.concat([bg, tonal].filter(Boolean));
	} else if (overrideText) {
		classes.push(overrideText);
	} else {
		classes.push("vc-swatch-empty");
	}
	return (
		'<span class="' +
		frappe.utils.escape_html(classes.join(" ")) +
		'">' +
		frappe.utils.escape_html(__("Text")) +
		"</span>"
	);
}

function _vc_width_select_html(className, attrString, current) {
	const w = current || "";
	let html =
		'<select class="form-control input-xs ' +
		frappe.utils.escape_html(className) +
		'" ' +
		attrString +
		">";
	html +=
		'<option value=""' +
		(w === "" ? " selected" : "") +
		">" +
		frappe.utils.escape_html(__("Theme default")) +
		"</option>";
	html +=
		'<option value="theme-border-thin"' +
		(w === "theme-border-thin" ? " selected" : "") +
		">" +
		frappe.utils.escape_html(__("Thin")) +
		"</option>";
	html +=
		'<option value="theme-border"' +
		(w === "theme-border" ? " selected" : "") +
		">" +
		frappe.utils.escape_html(__("Normal")) +
		"</option>";
	html +=
		'<option value="theme-border-strong"' +
		(w === "theme-border-strong" ? " selected" : "") +
		">" +
		frappe.utils.escape_html(__("Strong")) +
		"</option>";
	html += "</select>";
	return html;
}

function _vc_line_width_px(widthClass) {
	if (widthClass === "theme-border-thin") {
		return 1;
	}
	if (widthClass === "theme-border") {
		return 2;
	}
	if (widthClass === "theme-border-strong") {
		return 3;
	}
	return 1;
}

function _vc_line_preview_html(widthClass, colorClass) {
	const px = _vc_line_width_px((widthClass || "").trim());
	const color = (colorClass || "").trim();
	const cls = color ? "vc-line-preview " + color : "vc-line-preview";
	return (
		'<span class="' +
		frappe.utils.escape_html(cls) +
		'" style="border-bottom-width:' +
		px +
		'px;"></span>'
	);
}

function _vc_element_class_cell_html(first, dataGroup) {
	const bgRaw = (first.override_bg_class || "").trim();
	const mainLine = bgRaw
		? '<span class="vc-class-custom">' + frappe.utils.escape_html(bgRaw) + "</span>"
		: '<span class="vc-class-default">—</span>';
	const tonalSuffix =
		first.override_fg_type === "tonal"
			? ' <span class="vc-muted">(' + frappe.utils.escape_html(__("tonal")) + ")</span>"
			: "";
	const textVal = (first.override_text_class || "").trim()
		? first.override_text_class.trim()
		: first.override_fg_type || "mono";
	const borderWidth = first.override_border_width_class || "";
	const borderColor = (first.override_border_color_class || "").trim();
	const borderColorHtml = borderColor
		? frappe.utils.escape_html(borderColor)
		: '<span class="vc-muted">' + frappe.utils.escape_html(__("Theme default")) + "</span>";

	let html = '<div class="vc-class-cell">';
	html += "<div>" + mainLine + tonalSuffix + "</div>";
	html += '<div class="vc-quiet vc-muted">';
	html += frappe.utils.escape_html(textVal);
	html +=
		' <button type="button" class="btn btn-xs btn-default vc-pick-text" data-group="' +
		dataGroup +
		'">' +
		frappe.utils.escape_html(__("Pick text")) +
		"</button>";
	html += "</div>";
	html += '<div class="vc-quiet">';
	html += _vc_width_select_html(
		"vc-border-width",
		'data-group="' + dataGroup + '"',
		borderWidth,
	);
	html += " " + borderColorHtml;
	html +=
		' <button type="button" class="btn btn-xs btn-default vc-pick-border" data-group="' +
		dataGroup +
		'">' +
		frappe.utils.escape_html(__("Pick")) +
		"</button>";
	html += "</div>";
	html += '<div class="vc-quiet">';
	html +=
		'<label class="vc-muted" style="font-weight:400;margin:0;"><input type="checkbox" class="vc-keep" data-group="' +
		dataGroup +
		'"' +
		(first.keep_default ? " checked" : "") +
		"> " +
		frappe.utils.escape_html(__("Keep default")) +
		"</label>";
	html += "</div></div>";
	return html;
}

function _vc_chrome_table_head_html() {
	return (
		"<thead><tr>" +
		'<th style="width:24%;">' +
		frappe.utils.escape_html(__("Surface")) +
		"</th>" +
		'<th style="width:80px;">' +
		frappe.utils.escape_html(__("Preview")) +
		"</th>" +
		"<th>" +
		frappe.utils.escape_html(__("Class")) +
		"</th>" +
		'<th style="width:72px;"></th>' +
		"</tr></thead>"
	);
}

function _vc_table_row_swatch_html(effectiveClass, fgType) {
	let classes = ["vc-swatch", effectiveClass];
	if (fgType === "tonal") {
		const tonal = _vc_fg_tonal_class(effectiveClass);
		if (tonal) {
			classes.push(tonal);
		}
	}
	return (
		'<span class="' +
		frappe.utils.escape_html(classes.join(" ")) +
		'">' +
		frappe.utils.escape_html(__("Text")) +
		"</span>"
	);
}

function _vc_build_tables_section_html(frm) {
	let html = '<div class="vc-section-title">' + frappe.utils.escape_html(__("Tables")) + "</div>";
	html +=
		'<p class="vc-muted" style="margin:-4px 0 10px;">' +
		frappe.utils.escape_html(
			__(
				"Empty slots use the assigned theme's Tables tokens (same as the Theme Editor). Row 1 is alternate/odd; row 2 is main/even — matching theme-table striping.",
			),
		) +
		"</p>";

	const tableSelector = (frm.doc.table_selector || "").trim();
	if (!tableSelector) {
		html +=
			'<p class="vc-warn">!! ' +
			frappe.utils.escape_html(__("no class — add a class on the table in the .vue file.")) +
			"</p>";
	} else if (
		!cint(frm.doc.owns_table) &&
		!(frm.doc.table_scope_class || "").trim()
	) {
		html +=
			'<p class="vc-muted">' +
			frappe.utils.escape_html(
				__(
					"Add a class on this component's outer element so these colours apply only to its tables.",
				),
			) +
			"</p>";
	}

	html += '<table class="vc-chrome-table table table-bordered">';
	html += _vc_chrome_table_head_html();
	html += "<tbody>";

	VC_TABLE_ROW_SLOTS.forEach((slot) => {
		const raw = (frm.doc[slot.field] || "").trim();
		const effective = raw || slot.fallback;
		const fgType = frm.doc[slot.fgField] || "mono";
		const display = raw
			? '<span class="vc-class-custom">' + frappe.utils.escape_html(raw) + "</span>"
			: '<span class="vc-class-default">' + frappe.utils.escape_html(slot.fallback) + "</span>";
		const fgLabel =
			fgType === "tonal"
				? ' <span class="vc-muted">(' + frappe.utils.escape_html(__("tonal")) + ")</span>"
				: "";
		html += "<tr>";
		html += "<td>" + frappe.utils.escape_html(slot.label) + "</td>";
		html += "<td>" + _vc_table_row_swatch_html(effective, fgType) + "</td>";
		html +=
			'<td class="vc-class-cell">' +
			display +
			fgLabel +
			"</td>";
		html +=
			'<td style="text-align:right;"><button type="button" class="btn btn-xs btn-default vc-table-pick" data-field="' +
			frappe.utils.escape_html(slot.field) +
			'" data-fg-type-field="' +
			frappe.utils.escape_html(slot.fgField) +
			'">' +
			frappe.utils.escape_html(__("Pick…")) +
			"</button></td>";
		html += "</tr>";
	});

	html += "</tbody></table>";

	const previewRows = [
		{ id: "101", name: "Alpha", status: "Active" },
		{ id: "102", name: "Beta", status: "Pending" },
		{ id: "103", name: "Gamma", status: "Active" },
	];
	const thClass = (frm.doc.table_header_bg_class || "").trim();
	html += '<div class="vc-table-preview-wrap"><table class="vc-table-preview"><thead><tr>';
	["ID", "Name", "Status"].forEach((col) => {
		const thCls = thClass ? ' class="' + frappe.utils.escape_html(thClass) + '"' : "";
		html += "<th" + thCls + ">" + frappe.utils.escape_html(col) + "</th>";
	});
	html += "</tr></thead><tbody>";
	previewRows.forEach((row, ri) => {
		const rowField = ri % 2 === 0 ? "table_row_alt_bg_class" : "table_row_bg_class";
		const trClass = (frm.doc[rowField] || "").trim();
		const trAttr = trClass ? ' class="' + frappe.utils.escape_html(trClass) + '"' : "";
		html +=
			"<tr" +
			trAttr +
			"><td>" +
			frappe.utils.escape_html(row.id) +
			"</td><td>" +
			frappe.utils.escape_html(row.name) +
			"</td><td>" +
			frappe.utils.escape_html(row.status) +
			"</td></tr>";
	});
	html += "</tbody></table></div>";

	html += '<table class="vc-chrome-table table table-bordered">';
	html +=
		"<thead><tr>" +
		'<th style="width:24%;">' +
		frappe.utils.escape_html(__("Line")) +
		"</th>" +
		'<th style="width:80px;">' +
		frappe.utils.escape_html(__("Preview")) +
		"</th>" +
		'<th style="width:100px;">' +
		frappe.utils.escape_html(__("Width")) +
		"</th>" +
		"<th>" +
		frappe.utils.escape_html(__("Color class")) +
		"</th>" +
		'<th style="width:88px;"></th>' +
		"</tr></thead><tbody>";

	VC_TABLE_LINE_SLOTS.forEach((slot) => {
		const widthVal = frm.doc[slot.widthField] || "";
		const colorRaw = (frm.doc[slot.colorField] || "").trim();
		const colorDisplay = colorRaw
			? '<span class="vc-class-custom">' + frappe.utils.escape_html(colorRaw) + "</span>"
			: '<span class="vc-class-default">' + frappe.utils.escape_html(__("theme")) + "</span>";
		html += "<tr>";
		html += "<td>" + frappe.utils.escape_html(slot.label) + "</td>";
		html += "<td>" + _vc_line_preview_html(widthVal, colorRaw) + "</td>";
		html +=
			"<td>" +
			_vc_width_select_html(
				"vc-table-width",
				'data-field="' + frappe.utils.escape_html(slot.widthField) + '"',
				widthVal,
			) +
			"</td>";
		html += '<td class="vc-class-cell">' + colorDisplay + "</td>";
		html +=
			'<td style="text-align:right;"><button type="button" class="btn btn-xs btn-default vc-table-color" data-field="' +
			frappe.utils.escape_html(slot.colorField) +
			'">' +
			frappe.utils.escape_html(__("Color…")) +
			"</button></td>";
		html += "</tr>";
	});

	html += "</tbody></table>";
	return html;
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
						"override_button_size_class",
					].forEach((f) => {
						frappe.model.set_value(row.doctype, row.name, f, "");
					});
					frappe.model.set_value(row.doctype, row.name, "keep_default", 0);
				});
				VC_TABLE_CLASS_FIELDS.forEach((f) => {
					frappe.model.set_value(frm.doctype, frm.docname, f, "");
				});
				[
					"table_header_fg_type",
					"table_row_fg_type",
					"table_row_alt_fg_type",
				].forEach((f) => {
					frappe.model.set_value(frm.doctype, frm.docname, f, "mono");
				});
				frm.save();
			},
		);
	});
	$wrapper.on("click.vc-colours", ".vc-preview", () => {
		_vc_open_preview(frm);
	});
	$wrapper.on("click.vc-colours", ".vc-refresh", () => {
		_vc_refresh_from_file(frm);
	});
	$wrapper.on("click.vc-colours", ".vc-edit-theme", () => {
		window.open("/themes/theme-settings", "_blank");
	});
	$wrapper.on("click.vc-colours", ".vc-table-pick", function () {
		const field = $(this).attr("data-field");
		const fgField = $(this).attr("data-fg-type-field");
		if (field) {
			_vc_open_doc_picker(frm, field, fgField, "bg");
		}
	});
	$wrapper.on("click.vc-colours", ".vc-table-color", function () {
		const field = $(this).attr("data-field");
		if (field) {
			_vc_open_doc_picker(frm, field, null, "border");
		}
	});
	$wrapper.on("change.vc-colours", ".vc-table-width", function () {
		const field = $(this).attr("data-field");
		if (field) {
			frappe.model.set_value(frm.doctype, frm.docname, field, $(this).val() || "");
			frm.dirty();
			_vc_render_colours(frm);
		}
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

function _vc_open_doc_picker(frm, valueField, fgTypeField, lockKind) {
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
			doc: Object.assign({}, frm.doc, { __preview_theme: theme }),
			set_value: (f, v) => {
				frappe.model.set_value(frm.doctype, frm.docname, f, v);
			},
		};
		const opts = {
			frm: shim,
			themeField: "__preview_theme",
			valueField,
			lockKind,
		};
		if (fgTypeField) {
			opts.fgTypeField = fgTypeField;
		}
		frappe.ui.themeSwatchPicker.open(opts).then((saved) => {
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
		const themeName = (preview && preview.theme) || "";
		const groups = _vc_groups(frm.doc.elements || []);
		const missingCount = (frm.doc.elements || []).filter(
			(row) => row.element_status === "Missing",
		).length;
		const showRevert = _vc_show_revert(frm._vc_saved || [], frm._vc_table_saved || {});
		const editLabel = themeName
			? __("Edit {0}", [themeName])
			: __("Edit theme");
		let html = '<div class="vc-colours-wrap">';

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

		html += '<div class="vc-theme-row">';
		html += "<div>";
		html +=
			'<span class="vc-theme-label">' + frappe.utils.escape_html(__("Theme")) + "</span>";
		html +=
			'<span class="vc-theme-name">' +
			(themeName
				? frappe.utils.escape_html(themeName)
				: '<span class="vc-muted">—</span>') +
			"</span>";
		html += "</div>";
		html +=
			'<button type="button" class="btn btn-default btn-sm vc-preview">' +
			frappe.utils.escape_html(__("Preview")) +
			"</button>";
		html +=
			'<button type="button" class="btn btn-default btn-sm vc-refresh">' +
			frappe.utils.escape_html(__("Refresh")) +
			"</button>";
		html +=
			'<button type="button" class="btn btn-default btn-sm vc-edit-theme">' +
			frappe.utils.escape_html(editLabel) +
			"</button>";
		html += "</div>";

		if (showRevert) {
			html +=
				'<p><button type="button" class="btn btn-link btn-sm vc-revert">' +
				frappe.utils.escape_html(__("Revert to Theme Defaults")) +
				"</button></p>";
		}

		if (slug) {
			html += '<div data-nce-theme="' + frappe.utils.escape_html(slug) + '">';
		} else {
			html += "<div>";
		}

		html +=
			'<div class="vc-section-title">' + frappe.utils.escape_html(__("Elements")) + "</div>";

		if (!groups.length) {
			html +=
				'<p class="vc-muted">' +
				frappe.utils.escape_html(__("No themed elements in this file.")) +
				"</p>";
		} else {
			html += '<table class="vc-chrome-table table table-bordered">';
			html += _vc_chrome_table_head_html();
			html += "<tbody>";

			groups.forEach((group) => {
				const first = group.first;
				const escKey = frappe.utils.escape_html(group.key);
				const dataGroup = frappe.utils.escape_html(group.key);
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
				html += "<td>" + _vc_element_swatch_html(first) + "</td>";
				html += "<td>" + _vc_element_class_cell_html(first, dataGroup) + "</td>";
				html +=
					'<td style="text-align:right;"><button type="button" class="btn btn-xs btn-default vc-pick-bg" data-group="' +
					dataGroup +
					'">' +
					frappe.utils.escape_html(__("Pick…")) +
					"</button></td>";
				html += "</tr>";
			});

			html += "</tbody></table>";
		}

		if (cint(frm.doc.has_table)) {
			html += _vc_build_tables_section_html(frm);
		}

		html += "</div>";

		if (missingCount) {
			html +=
				'<p class="vc-muted">' +
				frappe.utils.escape_html(
					__("{0} elements no longer in the file (kept on the Elements tab).", [missingCount]),
				) +
				"</p>";
		}

		html += "</div>";

		$wrapper.html(html);
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
			override_button_size_class: "",
			keep_default: 1,
		};
	}
	return {
		override_bg_class: row.override_bg_class || "",
		override_fg_type: row.override_fg_type || "",
		override_text_class: row.override_text_class || "",
		override_border_width_class: row.override_border_width_class || "",
		override_border_color_class: row.override_border_color_class || "",
		override_button_size_class: row.override_button_size_class || "",
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
