// Design Mode: hover a Vue part and click Edit to change its colours. Turned on with the floating Design Mode button.
(function () {
	const METHOD = "/api/method/themes.component_api.";
	const DIALOG_SRC = "/assets/themes/design_mode/design-dialog.js?v=20261101e";
	const HOVER_INTENT_MS = 250;
	const state = {
		on: false,
		map: null,
		hoverEl: null,
		popup: null,
		sel: null,
	};

	let fabEl = null;
	let presenceSelector = "";
	let presenceTimer = null;
	let presenceObserver = null;
	let rootEl = null;
	let labelEl = null;
	let editBtnEl = null;
	let selMarkedEl = null;
	let siblingNodes = [];
	const MAX_SIBLINGS = 300;
	let intentTimer = null;
	let intentEl = null;
	let toastTimer = null;
	let movePending = false;
	let lastMoveEvent = null;
	let outsideMouseDownHandler = null;
	let dialogLoading = null;

	function csrf() {
		return (window.frappe && window.frappe.csrf_token) || window.csrf_token || "";
	}

	function esc(s) {
		return String(s)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	async function call(method, args) {
		const res = await fetch(METHOD + method, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				"X-Frappe-CSRF-Token": csrf(),
			},
			body: JSON.stringify(args || {}),
		});
		const data = await res.json();
		if (!res.ok || data.exc_type) {
			let message = "Request failed";
			if (data._server_messages) {
				try {
					const arr = JSON.parse(data._server_messages);
					if (arr && arr.length) {
						const first = JSON.parse(arr[0]);
						if (first && first.message) {
							message = String(first.message).replace(/<[^>]*>/g, "");
						}
					}
				} catch (err) {
					/* use default message */
				}
			}
			throw new Error(message);
		}
		return data.message;
	}

	function selectorFromMap(map) {
		return Object.keys(map.selectors || {})
			.concat(Object.keys(map.tables || {}))
			.filter(Boolean)
			.map(function (c) {
				return "." + CSS.escape(c);
			})
			.join(",");
	}

	function pageHasParts() {
		if (!presenceSelector) return false;
		try {
			return !!document.querySelector(presenceSelector);
		} catch (err) {
			return false;
		}
	}

	function updateFab() {
		if (!fabEl) return;
		const show = state.on || state.loading || pageHasParts();
		fabEl.style.display = show ? "block" : "none";
		fabEl.textContent = state.on
			? "Exit Design Mode"
			: state.loading
				? "Loading…"
				: "Design Mode";
		fabEl.classList.toggle("ndm-fab-on", !!state.on);
	}

	function schedulePresence() {
		if (presenceTimer) return;
		presenceTimer = setTimeout(function () {
			presenceTimer = null;
			updateFab();
		}, 800);
	}

	function ensureFab() {
		if (fabEl) return;
		ensureStyles();
		fabEl = document.createElement("button");
		fabEl.type = "button";
		fabEl.id = "nce-design-mode-fab";
		fabEl.style.display = "none";
		fabEl.addEventListener("click", function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (state.on) turnOff();
			else turnOn();
		});
		["mousedown", "pointerdown", "mouseup", "pointerup"].forEach(function (n) {
			fabEl.addEventListener(n, swallow);
		});
		document.body.appendChild(fabEl);
	}

	function ensureRoot() {
		if (!rootEl) {
			rootEl = document.getElementById("nce-design-mode");
		}
		if (!rootEl) {
			rootEl = document.createElement("div");
			rootEl.id = "nce-design-mode";
			document.body.appendChild(rootEl);
		}
		return rootEl;
	}

	function toast(text, kind) {
		const root = ensureRoot();
		const existing = root.querySelector(".ndm-toast");
		if (existing) existing.remove();
		if (toastTimer) {
			clearTimeout(toastTimer);
			toastTimer = null;
		}
		const el = document.createElement("div");
		el.className = "ndm-toast ndm-toast-" + (kind === "ok" ? "ok" : "err");
		el.textContent = text;
		root.appendChild(el);
		toastTimer = setTimeout(function () {
			if (el.parentNode) el.remove();
			toastTimer = null;
		}, 2500);
	}

	function findTarget(el) {
		let node = el;
		while (node && node !== document.body) {
			if (node.id === "nce-design-mode") return null;
			if (node.closest && node.closest('[class*="nce-theme-swatch-picker"]')) return null;
			if (node.classList && state.map && state.map.selectors) {
				for (let i = 0; i < node.classList.length; i++) {
					const cls = node.classList[i];
					if (state.map.selectors[cls]) {
						return {
							el: node,
							selector: cls,
							entry: state.map.selectors[cls],
						};
					}
				}
			}
			node = node.parentElement;
		}
		return null;
	}

	function label(entry, selector) {
		const first = entry.components[0];
		const name = first ? first.component_name : "";
		let text = name + " › " + selector;
		if (entry.components.length > 1) {
			text += " (+" + (entry.components.length - 1) + ")";
		}
		return text;
	}

	function reloadOverridesCss(hash) {
		const links = document.querySelectorAll('link[rel="stylesheet"]');
		for (let i = 0; i < links.length; i++) {
			const link = links[i];
			if (link.href && link.href.indexOf("nce_component_overrides.css") !== -1) {
				link.href = link.href.split("?")[0] + "?v=" + encodeURIComponent(hash || Date.now());
			}
		}
	}

	function ensureStyles() {
		let styleEl = document.getElementById("nce-design-mode-style");
		if (styleEl) return;
		styleEl = document.createElement("style");
		styleEl.id = "nce-design-mode-style";
		styleEl.textContent =
			"#nce-design-mode{position:fixed;top:0;left:0;z-index:9990;}" +
			"#nce-design-mode-fab{position:fixed;right:20px;bottom:20px;z-index:9991;padding:10px 18px;border:1px solid #111;border-radius:999px;background:#fff;color:#111;font:600 14px/1.2 system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);}" +
			"#nce-design-mode-fab:hover{background:#f3f4f6;}" +
			"#nce-design-mode-fab.ndm-fab-on{background:#111;color:#fff;}" +
			"#nce-design-mode-fab.ndm-fab-on:hover{background:#374151;}" +
			"[data-ndm-sib]{outline:2px solid #fff !important;outline-offset:-2px !important;}" +
			"[data-ndm-sel]{outline:2px solid #f59e0b !important;outline-offset:-2px !important;}" +
			'[data-ndm-sel="none"]{outline:2px dashed #9ca3af !important;}' +
			".ndm-label{position:fixed;pointer-events:none;background:#f59e0b;color:#111;font:11px/1.4 system-ui,sans-serif;padding:1px 6px;border-radius:3px;white-space:nowrap;}" +
			".ndm-toast{position:fixed;bottom:76px;left:50%;transform:translateX(-50%);padding:6px 12px;background:#fff;border:1px solid #d1d5db;border-left:4px solid;border-radius:4px;font:13px system-ui,sans-serif;}" +
			".ndm-toast-ok{border-left-color:#16a34a;}" +
			".ndm-toast-err{border-left-color:#dc2626;}" +
			".ndm-label-none{background:#9ca3af;color:#111;}" +
			".ndm-edit{position:fixed;pointer-events:auto;padding:4px 14px;border:1px solid #111;border-radius:6px;background:#fff;color:#111;font:600 13px/1.4 system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.35);}" +
			".ndm-edit:hover{background:#f3f4f6;}";
		document.head.appendChild(styleEl);
	}

	function clearSelMark() {
		if (selMarkedEl) selMarkedEl.removeAttribute("data-ndm-sel");
		selMarkedEl = null;
	}

	function markSel(el, kind) {
		clearSelMark();
		if (!el || el === document.documentElement || el === document.body) return;
		el.setAttribute("data-ndm-sel", kind === "none" ? "none" : "1");
		selMarkedEl = el;
	}

	function hideOutline() {
		clearSelMark();
		if (labelEl) labelEl.style.display = "none";
		state.hoverEl = null;
		if (editBtnEl) editBtnEl.style.display = "none";
		state.sel = null;
		clearIntent();
		if (!state.popup) hideSiblings();
	}

	function selectorFor(sel) {
		if (sel.kind === "table") return sel.selector;
		if (sel.kind === "element") return sel.hit.selector;
		return "";
	}

	function hideSiblings() {
		for (let i = 0; i < siblingNodes.length; i++) siblingNodes[i].removeAttribute("data-ndm-sib");
		siblingNodes = [];
	}

	function showSiblings(cls, exceptEl) {
		hideSiblings();
		if (!cls || !rootEl) return 0;
		let nodes;
		try {
			nodes = document.querySelectorAll("." + CSS.escape(cls));
		} catch (err) {
			return 0;
		}
		let count = 0;
		let drawn = 0;
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			if (node.closest("#nce-design-mode")) continue;
			const r = node.getBoundingClientRect();
			if (r.width === 0 || r.height === 0) continue;
			if (r.bottom < 0 || r.right < 0 || r.top > window.innerHeight || r.left > window.innerWidth) {
				continue;
			}
			count++;
			if (node === exceptEl) continue;
			if (drawn >= MAX_SIBLINGS) continue;
			node.setAttribute("data-ndm-sib", "");
			siblingNodes.push(node);
			drawn++;
		}
		return count;
	}

	function showOutlineFor(el, labelText) {
		const r = el.getBoundingClientRect();
		if (!labelEl) return;
		markSel(el, "1");
		labelEl.textContent = labelText;
		let labelTop = r.top - 20;
		if (labelTop < 0) labelTop = r.bottom + 4;
		labelEl.style.left = r.left + "px";
		labelEl.style.top = labelTop + "px";
		labelEl.style.display = "block";
		state.hoverEl = el;
	}

	function showOutline(hit) {
		let labelText = label(hit.entry, hit.selector);
		if (hit.entry.protected) labelText += " · locked";
		showOutlineFor(hit.el, labelText);
	}

	function findMappedTable(el) {
		const tbl = el && el.closest ? el.closest("table") : null;
		if (!tbl || !state.map || !state.map.tables) return null;
		for (let i = 0; i < tbl.classList.length; i++) {
			const cls = tbl.classList[i];
			if (state.map.tables[cls]) {
				return { el: tbl, selector: cls, entry: state.map.tables[cls] };
			}
		}
		return null;
	}

	function candidateFor(target) {
		if (!target) return null;
		if (target.closest && target.closest("#nce-design-mode-fab")) return null;
		if (target.closest && target.closest("#nce-design-mode")) return null;
		if (target.closest && target.closest('[class*="nce-theme-swatch-picker"]')) return null;
		if (target === document.body || target === document.documentElement) return null;
		const tableHit = findMappedTable(target);
		if (tableHit) {
			const partHit = findTarget(target);
			const part =
				partHit && partHit.el !== tableHit.el && tableHit.el.contains(partHit.el)
					? partHit
					: null;
			return {
				kind: "table",
				el: tableHit.el,
				selector: tableHit.selector,
				entry: tableHit.entry,
				partHit: part,
				label: tableHit.entry.component_name + " › table",
			};
		}
		const hit = findTarget(target);
		if (hit) {
			let text = label(hit.entry, hit.selector);
			if (hit.entry.protected) text += " · locked";
			return { kind: "element", el: hit.el, hit: hit, label: text };
		}
		return { kind: "none", el: target, label: "Not from a scanned Vue component" };
	}

	function clearIntent() {
		if (intentTimer) clearTimeout(intentTimer);
		intentTimer = null;
		intentEl = null;
	}

	function applySelection(cand) {
		state.sel = cand;
		if (!cand) {
			hideOutline();
			return;
		}
		showOutlineFor(cand.el, cand.label);
		if (cand.kind === "none") {
			markSel(cand.el, "none");
			labelEl.classList.add("ndm-label-none");
		} else {
			labelEl.classList.remove("ndm-label-none");
		}
		if (cand.kind === "none") {
			hideSiblings();
		} else {
			const n = showSiblings(selectorFor(cand), cand.el);
			labelEl.textContent = cand.label + " \u00b7 " + n + " on screen";
		}
		positionEditButton();
	}

	function positionEditButton() {
		if (!editBtnEl) return;
		if (!state.sel || state.sel.kind === "none" || state.popup) {
			editBtnEl.style.display = "none";
			return;
		}
		editBtnEl.style.display = "block";
		const r = state.sel.el.getBoundingClientRect();
		const bw = editBtnEl.offsetWidth;
		const bh = editBtnEl.offsetHeight;
		const gap = 6;
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		let left;
		let top = r.top + Math.min(r.height, bh) / 2 - bh / 2;
		if (r.right + gap + bw <= vw - 4) {
			left = r.right + gap;
		} else if (r.left - gap - bw >= 4) {
			left = r.left - gap - bw;
		} else {
			left = r.right - bw - gap;
			top = r.top + gap;
		}
		if (left < 4) left = 4;
		if (left > vw - bw - 4) left = vw - bw - 4;
		if (top < 4) top = 4;
		if (top > vh - bh - 4) top = vh - bh - 4;
		editBtnEl.style.left = left + "px";
		editBtnEl.style.top = top + "px";
	}

	function swallow(e) {
		e.stopPropagation();
	}

	function onEditClick(e) {
		e.preventDefault();
		e.stopPropagation();
		const s = state.sel;
		if (!s || s.kind === "none") return;
		const r = editBtnEl.getBoundingClientRect();
		const x = r.left;
		const y = r.bottom;
		if (s.kind === "table") openTablePopup(s.selector, s.partHit, x, y);
		else openPopup(s.hit, x, y);
	}

	function onMouseMoveFrame() {
		movePending = false;
		const e = lastMoveEvent;
		if (!e || !state.on || state.popup) return;
		if (e.target && e.target.closest && e.target.closest(".ndm-edit")) {
			clearIntent();
			return;
		}
		const cand = candidateFor(e.target);
		if (!cand) {
			clearIntent();
			return;
		}
		if (state.sel && cand.el === state.sel.el) {
			if (cand.kind === "table") state.sel.partHit = cand.partHit;
			clearIntent();
			return;
		}
		if (!state.sel) {
			clearIntent();
			applySelection(cand);
			return;
		}
		if (intentEl === cand.el) return;
		clearIntent();
		intentEl = cand.el;
		const t = e.target;
		intentTimer = setTimeout(function () {
			intentTimer = null;
			intentEl = null;
			if (!state.on || state.popup) return;
			if (!t.isConnected) return;
			applySelection(candidateFor(t) || cand);
		}, HOVER_INTENT_MS);
	}

	function onMouseMove(e) {
		if (state.popup) return;
		lastMoveEvent = e;
		if (movePending) return;
		movePending = true;
		requestAnimationFrame(onMouseMoveFrame);
	}

	function loadDialog() {
		if (window.nceDesignDialog && window.nceDesignDialog.open) {
			return Promise.resolve(true);
		}
		if (dialogLoading) return dialogLoading;
		dialogLoading = new Promise(function (resolve) {
			const s = document.createElement("script");
			s.src = DIALOG_SRC;
			s.onload = function () {
				resolve(!!(window.nceDesignDialog && window.nceDesignDialog.open));
			};
			s.onerror = function () {
				dialogLoading = null;
				resolve(false);
			};
			document.head.appendChild(s);
		});
		return dialogLoading;
	}

	function dialogReady() {
		if (window.nceDesignDialog && window.nceDesignDialog.open) return true;
		toast("The Design Mode dialog is still loading. Try again in a moment.", "err");
		loadDialog();
		return false;
	}

	function onOutsideMouseDown(e) {
		if (!state.popup) return;
		const host = document.getElementById("nce-design-dialog-host");
		if (host && (e.target === host || host.contains(e.target))) return;
		if (e.target.closest && e.target.closest('[class*="nce-theme-swatch-picker"]')) return;
		cancelPopup();
	}

	function openPickerFor(field, kind, fgField) {
		if (!state.popup) return;
		const picker = window.themeSwatchPicker;
		if (!picker || !picker.openCore) {
			toast("The colour picker is not loaded on this page.", "err");
			return;
		}
		const d = state.popup.draft;
		const opts = {
			getThemeSlug: function () {
				return state.map.slug;
			},
			getValue: function () {
				return d[field] || "";
			},
			setValue: function (cls) {
				d[field] = cls || "";
				onDraftChanged();
			},
			lockKind: kind || "bg",
		};
		if (kind === "bg" && fgField) {
			opts.getFgType = function () {
				return d[fgField] || "mono";
			};
			opts.setFgType = function (t) {
				d[fgField] = t || "mono";
				onDraftChanged();
			};
		}
		picker.openCore(opts);
	}

	function onDraftChanged() {
		if (!state.popup) return;
		if (state.popup.kind === "table") updateTablePreview();
		else updatePreview();
	}

	function openRecord() {
		if (!state.popup) return;
		if (state.popup.kind === "table") {
			window.open(
				"/app/vue-component/" + encodeURIComponent(state.popup.entry.name),
				"_blank"
			);
			return;
		}
		const comp = state.popup.entry.components[0];
		if (comp) {
			window.open("/app/vue-component/" + encodeURIComponent(comp.name), "_blank");
		}
	}

	function dialogHandlers() {
		return {
			pick: openPickerFor,
			changed: onDraftChanged,
			save: savePopup,
			cancel: cancelPopup,
			revert: revertPopup,
			openRecord: openRecord,
			part: function () {
				const hit = state.popup && state.popup.partHit;
				if (!hit) return;
				const x = state.popup.x;
				const y = state.popup.y;
				cancelPopup();
				openPopup(hit, x, y);
			},
		};
	}

	function elementPopupNotes(entry) {
		const notes = [];
		if (entry.components.length > 1) {
			const others = entry.components.slice(1).map(function (c) {
				return c.component_name;
			});
			notes.push(
				"Also used in " + others.join(", ") + ". Your change applies to all of them."
			);
		}
		if (entry.is_dynamic) {
			notes.push(
				"This part's colour is also set by code, which may override your change."
			);
		}
		if (entry.protected) {
			notes.push(
				"Page Panel sets this colour per panel. Change it on the Page Panel's Colours tab."
			);
		}
		return notes;
	}

	async function updatePreview() {
		if (!state.popup) return;
		const s = state.popup.selector;
		const d = state.popup.draft;
		if (d.keep_default) {
			const prev = document.getElementById("nce-design-preview");
			if (prev) prev.textContent = "";
			return;
		}
		try {
			const res = await call("preview_declarations", {
				rows: [Object.assign({ key: s }, d)],
			});
			const decls = (res && res[s]) || "";
			let styleEl = document.getElementById("nce-design-preview");
			if (!styleEl) {
				styleEl = document.createElement("style");
				styleEl.id = "nce-design-preview";
				document.head.appendChild(styleEl);
			}
			if (decls) {
				styleEl.textContent = "." + s + "." + s + "." + s + "." + s + " { " + decls + " }";
			} else {
				styleEl.textContent = "";
			}
		} catch (err) {
			toast(err.message, "err");
		}
	}

	async function updateTablePreview() {
		if (!state.popup || state.popup.kind !== "table") return;
		const entry = state.popup.entry;
		const draft = state.popup.draft;
		try {
			const res = await call("preview_design_table", { name: entry.name, values: draft });
			let styleEl = document.getElementById("nce-design-preview");
			if (!styleEl) {
				styleEl = document.createElement("style");
				styleEl.id = "nce-design-preview";
				document.head.appendChild(styleEl);
			}
			styleEl.textContent = (res && res.css) || "";
		} catch (err) {
			toast(err.message, "err");
		}
	}

	async function savePopup() {
		if (!state.popup) return;
		if (state.popup.handle && state.popup.handle.setSaving) {
			state.popup.handle.setSaving(true);
		}
		if (state.popup.kind === "table") {
			const draft = state.popup.draft;
			const entry = state.popup.entry;
			try {
				const res = await call("save_design_table", { name: entry.name, values: draft });
				reloadOverridesCss(res.css_hash);
				entry.values = Object.assign({}, draft);
				const prev = document.getElementById("nce-design-preview");
				if (prev) prev.remove();
				cancelPopup();
				toast("Saved. Every table drawn by " + entry.component_name + " is updated.", "ok");
			} catch (err) {
				toast(err.message, "err");
				if (state.popup && state.popup.handle && state.popup.handle.setSaving) {
					state.popup.handle.setSaving(false);
				}
			}
			return;
		}
		const selector = state.popup.selector;
		const draft = state.popup.draft;
		const entry = state.popup.entry;
		try {
			const res = await call("save_design_change", { selector: selector, values: draft });
			reloadOverridesCss(res.css_hash);
			entry.values = Object.assign({}, draft);
			const prev = document.getElementById("nce-design-preview");
			if (prev) prev.remove();
			cancelPopup();
			toast("Saved for " + res.components.length + " component(s).", "ok");
		} catch (err) {
			toast(err.message, "err");
			if (state.popup && state.popup.handle && state.popup.handle.setSaving) {
				state.popup.handle.setSaving(false);
			}
		}
	}

	async function revertPopup() {
		if (!state.popup) return;
		if (state.popup.kind === "table") {
			const entry = state.popup.entry;
			if (
				!window.confirm(
					"This resets every colour on " +
						entry.component_name +
						", not just its table. Continue?"
				)
			) {
				return;
			}
			try {
				const res = await call("revert_design_components", { names: [entry.name] });
				reloadOverridesCss(res.css_hash);
				const prev = document.getElementById("nce-design-preview");
				if (prev) prev.remove();
				cancelPopup();
				state.map = await call("get_design_mode_map");
				toast("Reverted " + entry.component_name + " to theme defaults.", "ok");
			} catch (err) {
				toast(err.message, "err");
			}
			return;
		}
		const entry = state.popup.entry;
		const names = entry.components.map(function (c) {
			return c.name;
		});
		const labels = entry.components
			.map(function (c) {
				return c.component_name;
			})
			.join(", ");
		if (
			!window.confirm(
				"This resets every colour on " + labels + ", not just this part. Continue?"
			)
		) {
			return;
		}
		try {
			const res = await call("revert_design_components", { names: names });
			reloadOverridesCss(res.css_hash);
			const prev = document.getElementById("nce-design-preview");
			if (prev) prev.remove();
			cancelPopup();
			state.map = await call("get_design_mode_map");
			toast("Reverted " + labels + " to theme defaults.", "ok");
		} catch (err) {
			toast(err.message, "err");
		}
	}

	function onScroll() {
		if (!state.popup) hideOutline();
	}

	function cancelPopup() {
		if (!state.popup) return;
		if (state.popup.handle) state.popup.handle.close();
		const prev = document.getElementById("nce-design-preview");
		if (prev) prev.remove();
		if (outsideMouseDownHandler) {
			document.removeEventListener("mousedown", outsideMouseDownHandler, true);
			outsideMouseDownHandler = null;
		}
		const picker = window.themeSwatchPicker;
		if (picker && picker.close) picker.close();
		state.popup = null;
		hideSiblings();
	}

	function cssColourToHex(value) {
		const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+%?))?\s*\)/.exec(value || "");
		if (!m) return { hex: "", transparent: !value || value === "transparent" };
		let alpha = m[4] == null ? 1 : parseFloat(m[4]);
		if (m[4] && m[4].endsWith("%")) alpha = alpha / 100;
		if (alpha === 0) return { hex: "", transparent: true };
		const hex = "#" + [m[1], m[2], m[3]].map(function (n) { return ("0" + parseInt(n, 10).toString(16)).slice(-2); }).join("").toUpperCase();
		return { hex: hex, transparent: false };
	}

	function elementThemeDefaults(el) {
		if (!el || !el.isConnected) return {};
		const cs = getComputedStyle(el);
		const root = getComputedStyle(document.documentElement);
		const colour = function (value) {
			const c = cssColourToHex(value);
			if (c.transparent) return { label: "transparent" };
			return { label: c.hex || value, css: c.hex || value };
		};
		const out = {
			override_bg_class: colour(cs.backgroundColor),
			override_text_class: colour(cs.color),
		};
		const width = parseFloat(cs.borderTopWidth) || 0;
		if (width > 0 && cs.borderTopStyle !== "none") {
			out.override_border_color_class = colour(cs.borderTopColor);
			const px = cs.borderTopWidth;
			const sizes = [
				["Thin", root.getPropertyValue("--nce-border-width-thin").trim()],
				["Normal", root.getPropertyValue("--nce-border-width").trim()],
				["Strong", root.getPropertyValue("--nce-border-width-strong").trim()],
			];
			let name = px;
			for (let i = 0; i < sizes.length; i++) {
				if (sizes[i][1] && parseFloat(sizes[i][1]) === width) { name = sizes[i][0]; break; }
			}
			out.override_border_width_class = { label: name };
		} else {
			out.override_border_color_class = { label: "no border" };
			out.override_border_width_class = { label: "none" };
		}
		return out;
	}

	function openPopup(hit, x, y) {
		cancelPopup();
		if (!dialogReady()) return;
		const draft = Object.assign({}, hit.entry.values);
		if (!draft.override_fg_type) draft.override_fg_type = "mono";
		const entry = hit.entry;
		const firstComp = entry.components[0] || {};
		const notes = elementPopupNotes(entry);
		const themeDefaults = elementThemeDefaults(hit.el);
		const handle = window.nceDesignDialog.open({
			container: ensureRoot(),
			kind: "element",
			title: (firstComp.component_name || "") + " › " + hit.selector,
			subtitle: "<" + (entry.tag || "") + ">",
			notes: notes,
			disabled: !!entry.protected,
			hasPart: false,
			draft: draft,
			themeDefaults: themeDefaults,
			x: x,
			y: y,
			handlers: dialogHandlers(),
		});
		state.popup = {
			kind: "element",
			selector: hit.selector,
			entry: entry,
			draft: handle.draft,
			handle: handle,
			x: x,
			y: y,
		};
		outsideMouseDownHandler = onOutsideMouseDown;
		document.addEventListener("mousedown", outsideMouseDownHandler, true);
		hideOutline();
		updatePreview();
		showSiblings(hit.selector, null);
	}

	function tableThemeDefaults(selector) {
		const el = document.querySelector("." + selector) || document.documentElement;
		const cs = getComputedStyle(el);
		const v = function (name) { return cs.getPropertyValue(name).trim(); };
		const sizes = [
			["Thin", v("--nce-border-width-thin")],
			["Normal", v("--nce-border-width")],
			["Strong", v("--nce-border-width-strong")],
		];
		const widthName = function (name) {
			const px = v(name);
			for (let i = 0; i < sizes.length; i++) {
				if (px && sizes[i][1] === px) return sizes[i][0];
			}
			return px || "";
		};
		const colour = function (name) {
			return { label: v(name).toUpperCase(), css: "var(" + name + ")" };
		};
		return {
			table_header_bg_class: colour("--nce-color-table-header"),
			table_row_bg_class: colour("--nce-color-row"),
			table_row_alt_bg_class: colour("--nce-color-row-alt"),
			table_header_line_class: { label: widthName("--nce-border-width-table-row") },
			table_header_line_color_class: colour("--nce-color-table-row-divider"),
			table_row_divider_class: { label: widthName("--nce-border-width-table-row") },
			table_row_divider_color_class: colour("--nce-color-table-row-divider"),
			table_col_divider_class: { label: widthName("--nce-border-width-table-col") },
			table_col_divider_color_class: colour("--nce-color-table-col-divider"),
		};
	}

	function openTablePopup(selector, partHit, x, y) {
		cancelPopup();
		if (!dialogReady()) return;
		const entry = state.map.tables[selector];
		const draft = Object.assign({}, entry.values);
		const handle = window.nceDesignDialog.open({
			container: ensureRoot(),
			kind: "table",
			title: entry.component_name + " › table",
			subtitle: "." + selector,
			notes: ["Applies to every table drawn by " + entry.component_name + "."],
			disabled: false,
			hasPart: !!partHit,
			draft: draft,
			themeDefaults: tableThemeDefaults(selector),
			x: x,
			y: y,
			handlers: dialogHandlers(),
		});
		state.popup = {
			kind: "table",
			selector: selector,
			entry: entry,
			draft: handle.draft,
			partHit: partHit,
			handle: handle,
			x: x,
			y: y,
		};
		outsideMouseDownHandler = onOutsideMouseDown;
		document.addEventListener("mousedown", outsideMouseDownHandler, true);
		hideOutline();
		updateTablePreview();
		showSiblings(selector, null);
	}

	function onKeyDown(e) {
		if (e.key === "Escape" && state.on) {
			const picker = window.themeSwatchPicker;
			if (picker && picker.isOpen && picker.isOpen()) return;
			e.preventDefault();
			if (state.popup) {
				cancelPopup();
				return;
			}
			turnOff();
		}
	}

	async function turnOn() {
		if (state.on || state.loading) return;
		state.loading = true;
		updateFab();
		ensureStyles();
		ensureRoot();
		try {
			state.map = await call("get_design_mode_map");
		} catch (err) {
			state.loading = false;
			updateFab();
			toast(err.message, "err");
			return;
		}
		presenceSelector = selectorFromMap(state.map) || presenceSelector;
		state.loading = false;
		state.on = true;
		rootEl.innerHTML = "";
		labelEl = document.createElement("div");
		labelEl.className = "ndm-label";
		labelEl.style.display = "none";
		rootEl.appendChild(labelEl);
		editBtnEl = document.createElement("button");
		editBtnEl.type = "button";
		editBtnEl.className = "ndm-edit";
		editBtnEl.textContent = "Edit";
		editBtnEl.style.display = "none";
		editBtnEl.addEventListener("click", onEditClick);
		editBtnEl.addEventListener("mousedown", swallow);
		editBtnEl.addEventListener("pointerdown", swallow);
		rootEl.appendChild(editBtnEl);
		loadDialog();
		document.addEventListener("mousemove", onMouseMove, true);
		window.addEventListener("scroll", onScroll, true);
		updateFab();
	}

	function turnOff() {
		cancelPopup();
		document.removeEventListener("mousemove", onMouseMove, true);
		window.removeEventListener("scroll", onScroll, true);
		clearIntent();
		state.sel = null;
		hideSiblings();
		clearSelMark();
		if (rootEl) {
			rootEl.remove();
			rootEl = null;
		}
		labelEl = null;
		editBtnEl = null;
		const prev = document.getElementById("nce-design-preview");
		if (prev) prev.remove();
		state.on = false;
		state.loading = false;
		state.map = null;
		state.hoverEl = null;
		updateFab();
	}

	function hasSystemUserCookie() {
		return document.cookie.split(";").some(function (part) {
			return part.trim().indexOf("system_user=yes") === 0;
		});
	}

	async function init() {
		if (window.__nceDesignModeLoaded) return;
		window.__nceDesignModeLoaded = true;
		let enabled = false;
		if (window.frappe && frappe.boot && frappe.boot.sysdefaults !== undefined) {
			enabled = !!(frappe.boot.nce_design_mode && frappe.boot.nce_design_mode.enabled);
		} else if (hasSystemUserCookie()) {
			try {
				const status = await call("get_design_mode_status");
				enabled = !!(status && status.enabled && status.allowed);
			} catch (err) {
				return;
			}
		}
		if (!enabled) return;
		try {
			const map = await call("get_design_mode_map");
			presenceSelector = selectorFromMap(map);
		} catch (err) {
			return;
		}
		if (!presenceSelector) return;
		ensureFab();
		updateFab();
		presenceObserver = new MutationObserver(schedulePresence);
		presenceObserver.observe(document.body, { childList: true, subtree: true });
		window.addEventListener("keydown", onKeyDown, true);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
