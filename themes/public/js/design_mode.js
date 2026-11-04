// Design Mode: hover a Vue part and click Edit to change its colours. Turned on with the floating Design Mode button.
(function () {
	const METHOD = "/api/method/themes.component_api.";
	const DIALOG_SRC = "/assets/themes/design_mode/design-dialog.js?v=20261103o";
	const INSTANCE_ATTR = "data-nce-instance";
	const INSTANCE_AUTO_ATTR = "data-nce-instance-auto";
	const HOVER_INTENT_MS = 1000;
	const HOVER_HOLD_MS = 5000;
	const state = {
		on: false,
		map: null,
		hoverEl: null,
		popup: null,
		sel: null,
		themeChoices: [],
		deskTheme: null,
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
	let holdTimer = null;
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
		clearHold();
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

	function clearHold() {
		if (holdTimer) clearTimeout(holdTimer);
		holdTimer = null;
	}

	function armHold() {
		if (holdTimer || !state.sel) return;
		holdTimer = setTimeout(function () {
			holdTimer = null;
			if (!state.on || state.popup) return;
			hideOutline();
		}, HOVER_HOLD_MS);
	}

	function applySelection(cand) {
		clearHold();
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

	// Elements with CSS pointer-events:none never become e.target, so the browser hands us
	// whatever is behind them. Find mapped elements that are pointer-events:none and sit under
	// the cursor by geometry, so they still highlight and edit.
	let inertSelectorKey = "";
	let inertSelectorList = "";

	function inertSelectorQuery() {
		const sels = (state.map && state.map.selectors) || {};
		const keys = Object.keys(sels);
		const key = keys.length + ":" + (keys[0] || "");
		if (key !== inertSelectorKey) {
			inertSelectorKey = key;
			inertSelectorList = keys
				.map(function (k) {
					return "." + CSS.escape(k);
				})
				.join(",");
		}
		return inertSelectorList;
	}

	function findInertTargetAt(x, y) {
		const q = inertSelectorQuery();
		if (!q) return null;
		let nodes;
		try {
			nodes = document.querySelectorAll(q);
		} catch (err) {
			return null;
		}
		let best = null;
		let bestArea = Infinity;
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			if (node.closest("#nce-design-mode")) continue;
			const r = node.getBoundingClientRect();
			if (r.width === 0 || r.height === 0) continue;
			if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
			if (window.getComputedStyle(node).pointerEvents !== "none") continue;
			const area = r.width * r.height;
			if (area < bestArea) {
				best = node;
				bestArea = area;
			}
		}
		return best;
	}

	function resolveMoveTarget(e) {
		const inert = findInertTargetAt(e.clientX, e.clientY);
		return inert || e.target;
	}

	function onMouseMoveFrame() {
		movePending = false;
		const e = lastMoveEvent;
		if (!e || !state.on || state.popup) return;
		if (e.target && e.target.closest && e.target.closest(".ndm-edit")) {
			clearIntent();
			clearHold();
			return;
		}
		const moveTarget = resolveMoveTarget(e);
		const cand = candidateFor(moveTarget);
		if (!cand) {
			clearIntent();
			armHold();
			return;
		}
		if (state.sel && cand.el === state.sel.el) {
			if (cand.kind === "table") state.sel.partHit = cand.partHit;
			clearIntent();
			clearHold();
			return;
		}
		if (!state.sel) {
			clearIntent();
			applySelection(cand);
			return;
		}
		armHold();
		if (intentEl === cand.el) return;
		clearIntent();
		intentEl = cand.el;
		const t = moveTarget;
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

	function styleOverridesBag(draft) {
		return bagFromRaw(draft.theme_style_overrides);
	}

	function bagFromRaw(raw) {
		if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw;
		if (typeof raw === "string" && raw.trim()) {
			try {
				return JSON.parse(raw);
			} catch (e) {
				return {};
			}
		}
		return {};
	}

	var STYLE_LEGACY_FIELDS = {
		"button-size": "override_button_size_class",
		background: "override_bg_class",
		"text-color": "override_text_class",
		"border-width": "override_border_width_class",
		"border-color": "override_border_color_class",
		"table-header-row": "table_header_bg_class",
		"table-rows": "table_row_bg_class",
		"table-alternate-rows": "table_row_alt_bg_class",
		"table-header-underline-width": "table_header_line_class",
		"table-header-underline-color": "table_header_line_color_class",
		"table-row-dividers-width": "table_row_divider_class",
		"table-row-dividers-color": "table_row_divider_color_class",
		"table-column-dividers-width": "table_col_divider_class",
		"table-column-dividers-color": "table_col_divider_color_class",
	};

	var STYLE_FG_FIELDS = {
		background: "override_fg_type",
		"table-header-row": "table_header_fg_type",
		"table-rows": "table_row_fg_type",
		"table-alternate-rows": "table_row_alt_fg_type",
	};

	function setStyleOverride(draft, propId, value, legacyField) {
		const bag = styleOverridesBag(draft);
		const trimmed = (value || "").trim();
		if (trimmed) bag[propId] = trimmed;
		else delete bag[propId];
		draft.theme_style_overrides = bag;
		const leg = legacyField || STYLE_LEGACY_FIELDS[propId];
		if (leg) draft[leg] = trimmed;
	}

	function instanceOverridesBag(instanceDraft) {
		return bagFromRaw(instanceDraft.instance_style_overrides);
	}

	function setInstanceStyleOverride(instanceDraft, propId, value) {
		const bag = instanceOverridesBag(instanceDraft);
		const trimmed = (value || "").trim();
		if (trimmed) bag[propId] = trimmed;
		else delete bag[propId];
		instanceDraft.instance_style_overrides = bag;
	}

	function activeStyleTab() {
		if (!state.popup || !state.popup.handle || !state.popup.handle.getStyleTab) return "component";
		return state.popup.handle.getStyleTab();
	}

	function instanceIdentityLabel(el, instanceId) {
		const path = window.location.pathname || "";
		if (instanceId) return path + " · " + INSTANCE_ATTR + "=" + instanceId;
		return path + " · new instance (id assigned on Save)";
	}

	function buildInstanceSavePayload() {
		if (!state.popup || !state.popup.handle) return null;
		const instanceDraft = state.popup.handle.instanceDraft || {};
		const sparse = instanceOverridesBag(instanceDraft);
		const hadId = !!(state.popup.instanceId || "").trim();
		if (!hadId && !Object.keys(sparse).length) return null;
		const payload = { instance_style_overrides: sparse };
		if (state.popup.instanceId) payload.instance_id = state.popup.instanceId;
		if (state.popup.targetEl && window.nceInstanceApply) {
			try {
				const desc = window.nceInstanceApply.describe(state.popup.targetEl);
				Object.assign(payload, desc);
				payload.fit_count = window.nceInstanceApply.countFits(
					Object.assign({ selector_class: state.popup.selector }, desc)
				);
			} catch (err) {}
		}
		return payload;
	}

	function openPickerFor(field, kind, fgField) {
		if (!state.popup) return;
		const picker = window.themeSwatchPicker;
		if (!picker || !picker.openCore) {
			toast("The colour picker is not loaded on this page.", "err");
			return;
		}
		const d = state.popup.draft;
		const inst = state.popup.handle.instanceDraft || {};
		const onInstance = activeStyleTab() === "instance";
		const styleProp = field.indexOf("style:") === 0 ? field.slice(6) : "";
		const opts = {
			getThemeSlug: function () {
				return state.map.slug;
			},
			getValue: function () {
				if (styleProp) {
					if (onInstance) {
						const ibag = instanceOverridesBag(inst);
						if (Object.prototype.hasOwnProperty.call(ibag, styleProp)) return ibag[styleProp];
						const bag = styleOverridesBag(d);
						if (bag[styleProp]) return bag[styleProp];
						const leg = STYLE_LEGACY_FIELDS[styleProp];
						if (leg) return d[leg] || "";
						return "";
					}
					const bag = styleOverridesBag(d);
					if (bag[styleProp]) return bag[styleProp];
					const leg = STYLE_LEGACY_FIELDS[styleProp];
					if (leg) return d[leg] || "";
					return "";
				}
				return d[field] || "";
			},
			setValue: function (cls) {
				if (styleProp) {
					if (onInstance) {
						setInstanceStyleOverride(inst, styleProp, cls || "");
					} else {
						setStyleOverride(d, styleProp, cls || "", STYLE_LEGACY_FIELDS[styleProp]);
					}
				} else {
					d[field] = cls || "";
				}
				onDraftChanged();
			},
			lockKind: kind || "bg",
			styleKey: field,
		};
		var fgKey = fgField || (styleProp ? STYLE_FG_FIELDS[styleProp] : "");
		if (kind === "bg" && fgKey) {
			opts.getFgType = function () {
				return d[fgKey] || "mono";
			};
			opts.setFgType = function (t) {
				d[fgKey] = t || "mono";
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

	function revertInstancePopup() {
		if (!state.popup) return;
		if (
			!window.confirm(
				"Remove all style overrides for this instance? Component styles are unchanged."
			)
		) {
			return;
		}
		const inst = state.popup.handle.instanceDraft;
		if (inst) inst.instance_style_overrides = {};
		onDraftChanged();
	}

	function dialogHandlers() {
		return {
			pick: openPickerFor,
			changed: onDraftChanged,
			setStyleTab: function () {
				onDraftChanged();
			},
			save: savePopup,
			cancel: cancelPopup,
			revert: revertPopup,
			revertInstance: revertInstancePopup,
			resetInstanceProperty: function (propId) {
				if (!state.popup || !state.popup.handle.instanceDraft) return;
				const bag = instanceOverridesBag(state.popup.handle.instanceDraft);
				delete bag[propId];
				state.popup.handle.instanceDraft.instance_style_overrides = bag;
				onDraftChanged();
			},
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

	function joinClues(parts) {
		if (parts.length === 1) return parts[0];
		if (parts.length === 2) return parts[0] + " and " + parts[1];
		return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
	}

	function instanceFitNote(el, selector) {
		if (!el || !window.nceInstanceApply) return "";
		try {
			const desc = window.nceInstanceApply.describe(el);
			const n = window.nceInstanceApply.countFits(
				Object.assign({ selector_class: selector }, desc)
			);
			const parts = [];
			if (desc.nce_key) parts.push("its app key");
			if (desc.name_tag) parts.push("its name tag");
			if (desc.label_text) parts.push("its words '" + desc.label_text + "'");
			if (desc.context_key) parts.push("its surroundings (" + desc.context_key + ")");
			if (parts.length === 0) {
				return (
					"Nothing on this element tells it apart: a This Instance change applies to every ." +
					selector +
					" on this screen."
				);
			}
			if (n > 1) {
				return (
					"This Instance description fits " +
					n +
					" elements on this screen. A This Instance change applies to all " +
					n +
					"."
				);
			}
			return "This Instance is recognised by " + joinClues(parts) + ".";
		} catch (err) {
			return "";
		}
	}

	async function updatePreview() {
		if (!state.popup) return;
		const s = state.popup.selector;
		const d = state.popup.draft;
		const instDraft = state.popup.handle.instanceDraft || {};
		const sparse = instanceOverridesBag(instDraft);
		const previewRow = Object.assign({ key: s }, d);
		if (Object.keys(sparse).length) {
			if (!state.popup.previewInstanceId) {
				state.popup.previewInstanceId =
					state.popup.instanceId ||
					"pv-" + Math.random().toString(36).slice(2, 14);
			}
			previewRow.instance_id = state.popup.previewInstanceId;
			previewRow.instance_style_overrides = sparse;
		}
		if (d.keep_default && !Object.keys(sparse).length) {
			const prev = document.getElementById("nce-design-preview");
			if (prev) prev.textContent = "";
			return;
		}
		try {
			const res = await call("preview_declarations", {
				rows: [previewRow],
			});
			const decls = (res && res[s]) || "";
			let styleEl = document.getElementById("nce-design-preview");
			if (!styleEl) {
				styleEl = document.createElement("style");
				styleEl.id = "nce-design-preview";
				document.head.appendChild(styleEl);
			}
			if (decls) {
				styleEl.textContent = decls;
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
		const instDraft = state.popup.handle.instanceDraft || {};
		const sparse = instanceOverridesBag(instDraft);
		const args = { name: entry.name, values: draft };
		if (Object.keys(sparse).length) {
			if (!state.popup.previewInstanceId) {
				state.popup.previewInstanceId =
					state.popup.instanceId ||
					"pv-" + Math.random().toString(36).slice(2, 14);
			}
			args.instance = {
				instance_id: state.popup.previewInstanceId,
				instance_style_overrides: sparse,
			};
		}
		try {
			const res = await call("preview_design_table", args);
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
			const instancePayload = buildInstanceSavePayload();
			try {
				const args = { name: entry.name, values: draft };
				if (instancePayload) args.instance = instancePayload;
				const res = await call("save_design_table", args);
				if (res.instance_id && state.popup.targetEl) {
					state.popup.targetEl.setAttribute(INSTANCE_ATTR, res.instance_id);
					state.popup.targetEl.setAttribute(INSTANCE_AUTO_ATTR, "1");
					state.popup.instanceId = res.instance_id;
				}
				if (
					instancePayload &&
					!Object.keys(instancePayload.instance_style_overrides || {}).length
				) {
					if (state.popup.targetEl) {
						state.popup.targetEl.removeAttribute(INSTANCE_ATTR);
						state.popup.targetEl.removeAttribute(INSTANCE_AUTO_ATTR);
					}
					state.popup.instanceId = "";
				}
				reloadOverridesCss(res.css_hash);
				if (window.nceInstanceApply) window.nceInstanceApply.refresh();
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
		const instancePayload = buildInstanceSavePayload();
		try {
			const args = { selector: selector, values: draft };
			if (instancePayload) args.instance = instancePayload;
			const res = await call("save_design_change", args);
			if (res.instance_id && state.popup.targetEl) {
				state.popup.targetEl.setAttribute(INSTANCE_ATTR, res.instance_id);
				state.popup.targetEl.setAttribute(INSTANCE_AUTO_ATTR, "1");
				state.popup.instanceId = res.instance_id;
			}
			if (instancePayload && !Object.keys(instancePayload.instance_style_overrides || {}).length) {
				if (state.popup.targetEl) {
					state.popup.targetEl.removeAttribute(INSTANCE_ATTR);
					state.popup.targetEl.removeAttribute(INSTANCE_AUTO_ATTR);
				}
				state.popup.instanceId = "";
			}
			reloadOverridesCss(res.css_hash);
			if (window.nceInstanceApply) window.nceInstanceApply.refresh();
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

	function deskVarHex(cssVar) {
		const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
		return cssColourToHex(raw);
	}

	function deskSourceForColour(colour, priorities) {
		const el = cssColourToHex(colour);
		if (el.transparent || !el.hex) return null;
		for (let i = 0; i < priorities.length; i++) {
			const p = priorities[i];
			const v = deskVarHex(p.cssVar);
			if (v.transparent || !v.hex) continue;
			if (v.hex === el.hex) return { cssVar: p.cssVar, field: p.field, label: p.label };
		}
		return null;
	}

	function hasThemeClassOverride(draft, rowField) {
		const v = draft[rowField];
		if (!v) return false;
		return String(v).indexOf("theme-") === 0;
	}

	function deskSourcesFor(el, draft) {
		if (!el || !el.isConnected) return {};
		const cs = getComputedStyle(el);
		const out = {};
		const bgPriorities = [
			{ cssVar: "--fg-color", field: "fg_color", label: "Card / Form Surface" },
			{ cssVar: "--bg-color", field: "bg_color", label: "Page Background" },
			{ cssVar: "--surface-gray-2", field: "surface_gray_2", label: "Subtle Surface" },
			{ cssVar: "--subtle-fg", field: "subtle_fg", label: "List Header Background" },
			{ cssVar: "--control-bg", field: "control_bg", label: "Input Fields, Controls & Toolbar Buttons" },
			{ cssVar: "--btn-default-bg", field: "btn_default_bg", label: "Workspace Quick List Buttons" },
		];
		const textPriorities = [
			{ cssVar: "--text-color", field: "text_color", label: "Body Text" },
			{ cssVar: "--heading-color", field: "heading_color", label: "Headings" },
			{ cssVar: "--text-muted", field: "text_muted", label: "Muted Text" },
			{ cssVar: "--text-light", field: "text_light", label: "Light Text" },
		];
		const borderPriorities = [
			{ cssVar: "--border-color", field: "border_color", label: "Border" },
			{ cssVar: "--dark-border-color", field: "dark_border_color", label: "Strong Border" },
		];
		if (!hasThemeClassOverride(draft, "override_bg_class")) {
			const m = deskSourceForColour(cs.backgroundColor, bgPriorities);
			if (m) out.override_bg_class = m;
		}
		if (!hasThemeClassOverride(draft, "override_text_class")) {
			const m = deskSourceForColour(cs.color, textPriorities);
			if (m) out.override_text_class = m;
		}
		const borderWidth = parseFloat(cs.borderTopWidth) || 0;
		if (
			borderWidth > 0 &&
			cs.borderTopStyle !== "none" &&
			!hasThemeClassOverride(draft, "override_border_color_class")
		) {
			const m = deskSourceForColour(cs.borderTopColor, borderPriorities);
			if (m) out.override_border_color_class = m;
		}
		return out;
	}

	function themeInUseLabel() {
		const slug = (
			document.documentElement.getAttribute("data-nce-theme") || ""
		).trim();
		if (!slug) return "Theme: Default";
		const choices = state.themeChoices || [];
		for (let i = 0; i < choices.length; i++) {
			const choice = choices[i];
			if (choice && choice.slug === slug) {
				return "Theme: " + (choice.theme_name || slug);
			}
		}
		return "Theme: " + slug;
	}

	// The active theme's button sizes, read from its CSS variables, for the Button size row.
	function themeButtonSizes() {
		const out = {};
		try {
			const cs = getComputedStyle(document.documentElement);
			["sm", "md", "lg"].forEach(function (k) {
				const v = function (n) {
					return cs.getPropertyValue("--nce-btn-" + k + "-" + n).trim();
				};
				if (!v("font-size")) return;
				out[k] =
					v("font-size") + " text, " + v("pad-y") + " / " + v("pad-x") +
					" padding, min " + v("min-height");
			});
		} catch (e) {}
		return out;
	}

	function collectOriginalStyles(el, entry) {
		try {
			if (!el) return null;
			const classes = { theme: [], other: [] };
			const clsList = Array.from(el.classList);
			for (let ci = 0; ci < clsList.length; ci++) {
				const name = clsList[ci];
				if (name.indexOf("theme-") === 0) classes.theme.push(name);
				else classes.other.push(name);
			}
			const inline = [];
			for (let si = 0; si < el.style.length; si++) {
				const prop = el.style[si];
				inline.push({
					prop: prop,
					value: el.style.getPropertyValue(prop).trim(),
					important: el.style.getPropertyPriority(prop) === "important",
				});
			}
			const rules = [];
			const unreadable = [];
			const skipSheetRe =
				/nce_theme|nce_component_overrides|nce_desk_theme|nce_frappe_ui_bridge|design-dialog|nce-themes\.css/;
			const matched = { count: 0 };

			function declsFromStyle(style) {
				// The browser expands a shorthand (border: 0 !important) into its
				// longhands (border-top-color, ...). Show the shorthand the app wrote.
				function shorthandOf(p) {
					const cands = [];
					if (/^border-(top|bottom)-(left|right)-radius$/.test(p)) {
						cands.push("border-radius");
					}
					const m = /^border-(top|right|bottom|left)-(color|style|width)$/.exec(p);
					if (m) cands.push("border-" + m[2]);
					const parts = p.split("-");
					for (let n = parts.length - 1; n >= 1; n--) {
						cands.push(parts.slice(0, n).join("-"));
					}
					for (let ci = 0; ci < cands.length; ci++) {
						const sv = style.getPropertyValue(cands[ci]);
						if (sv && sv.trim()) return cands[ci];
					}
					return null;
				}
				const decls = [];
				const seen = {};
				for (let di = 0; di < style.length; di++) {
					const raw = style[di];
					const p = shorthandOf(raw) || raw;
					if (seen[p]) continue;
					seen[p] = true;
					decls.push({
						prop: p,
						value: style.getPropertyValue(p).trim(),
						important: style.getPropertyPriority(p) === "important",
					});
				}
				return decls;
			}

			function walkRules(ruleList, sheet) {
				if (!ruleList || matched.count >= 40) return;
				for (let ri = 0; ri < ruleList.length; ri++) {
					if (matched.count >= 40) return;
					const rule = ruleList[ri];
					if (rule.cssRules && rule.cssRules.length) {
						if (rule.media) {
							if (window.matchMedia(rule.media.mediaText).matches) {
								walkRules(rule.cssRules, sheet);
							}
						} else {
							walkRules(rule.cssRules, sheet);
						}
					}
					if (!rule.selectorText) continue;
					let matches = false;
					try {
						matches = el.matches(rule.selectorText);
					} catch (matchErr) {
						continue;
					}
					if (!matches || !rule.style || rule.style.length === 0) continue;
					const href = sheet.href || "";
					const file = href
						? href.split("?")[0].split("/").pop()
						: "style tag on this screen";
					const themable = declsFromStyle(rule.style).filter(function (d) {
						return /^(color|background|border|padding|font|min-height|height|outline|box-shadow)/.test(
							d.prop
						);
					});
					if (!themable.length) continue;
					rules.push({
						file: file,
						selector: rule.selectorText,
						decls: themable,
					});
					matched.count++;
				}
			}

			const ownSheets = ["nce-design-mode-style", "nce-design-preview"]
				.map(function (id) {
					const node = document.getElementById(id);
					return node && node.sheet;
				})
				.filter(Boolean);
			const sheets = document.styleSheets;
			for (let hi = 0; hi < sheets.length; hi++) {
				const sheet = sheets[hi];
				const href = sheet.href || "";
				if (skipSheetRe.test(href)) continue;
				if (ownSheets.indexOf(sheet) !== -1) continue;
				let cssRules;
				try {
					cssRules = sheet.cssRules;
				} catch (readErr) {
					unreadable.push(href);
					continue;
				}
				walkRules(cssRules, sheet);
			}

			const cs = getComputedStyle(el);
			const computed = [
				{ label: "Background", value: cs.getPropertyValue("background-color").trim() },
				{ label: "Text colour", value: cs.getPropertyValue("color").trim() },
				{
					label: "Border width",
					value: cs.getPropertyValue("border-top-width").trim(),
				},
				{
					label: "Border colour",
					value: cs.getPropertyValue("border-top-color").trim(),
				},
				{
					label: "Corner radius",
					value: cs.getPropertyValue("border-top-left-radius").trim(),
				},
				{ label: "Font", value: cs.getPropertyValue("font-family").trim() },
				{ label: "Font size", value: cs.getPropertyValue("font-size").trim() },
				{ label: "Font weight", value: cs.getPropertyValue("font-weight").trim() },
				{ label: "Padding", value: cs.getPropertyValue("padding").trim() },
			];

			const warnings = [];
			function shortVal(v) {
				v = String(v || "");
				return v.length > 50 ? v.slice(0, 47) + "..." : v;
			}
			// Which CSS properties each Themes style row controls.
			const rowProps = [
				{ label: "Background", re: /^background/ },
				{ label: "Text colour", re: /^color$/ },
				{ label: "Border width", re: /^border(-(top|right|bottom|left))?(-width)?$/ },
				{ label: "Border colour", re: /^border(-(top|right|bottom|left))?(-color)?$/ },
				{ label: "Corner radius", re: /^border(-(top|bottom)-(left|right))?-radius$/ },
				{ label: "Button size", re: /^(padding|min-height|height)/ },
			];
			const conflicts = [];
			for (let rp = 0; rp < rowProps.length; rp++) {
				const spec = rowProps[rp];
				let win = null;
				for (let ri = 0; ri < rules.length; ri++) {
					for (let dj = 0; dj < rules[ri].decls.length; dj++) {
						const d = rules[ri].decls[dj];
						if (!spec.re.test(d.prop)) continue;
						if (!win || d.important || !win.important) {
							win = { prop: d.prop, value: d.value, important: d.important, from: rules[ri].selector };
						}
					}
				}
				for (let ii = 0; ii < inline.length; ii++) {
					if (spec.re.test(inline[ii].prop)) {
						win = { prop: inline[ii].prop, value: inline[ii].value, important: true, from: "inline" };
					}
				}
				if (!win) continue;
				const who = win.from === "inline" ? "on this element itself" : "in " + win.from;
				conflicts.push({
					label: spec.label,
					line1: "The app sets " + win.prop + " to " + shortVal(win.value) + " " + who + ".",
					line2: win.important
						? win.from !== "inline" && entry && entry.values && entry.values.override_important
							? "It is marked !important, but your This Component setting overrides it."
							: "It is marked !important, so Themes cannot change it. Tick \"Override the app's !important\" on This Component to take over."
						: "Themes' theme-wide style gives way to it. A change saved on This Component or This Instance replaces it.",
				});
			}
			if (entry && entry.is_dynamic) {
				warnings.push("This element's colour is also set by code.");
			}

			return {
				classes: classes,
				inline: inline,
				rules: rules,
				unreadable: unreadable,
				computed: computed,
				warnings: warnings,
				conflicts: conflicts,
			};
		} catch (outerErr) {
			return null;
		}
	}

	async function openPopup(hit, x, y) {
		cancelPopup();
		if (!dialogReady()) return;
		const draft = Object.assign({}, hit.entry.values);
		if (!draft.override_fg_type) draft.override_fg_type = "mono";
		const entry = hit.entry;
		const firstComp = entry.components[0] || {};
		const notes = elementPopupNotes(entry);
		const fitNote = instanceFitNote(hit.el, hit.selector);
		if (fitNote) notes.push(fitNote);
		const themeDefaults = elementThemeDefaults(hit.el);
		const deskSources = deskSourcesFor(hit.el, draft);
		const deskSourceKeys = Object.keys(deskSources);
		let subtitle = themeInUseLabel();
		if (
			deskSourceKeys.length > 0 &&
			state.deskTheme &&
			state.deskTheme.theme_name
		) {
			subtitle = "Desk theme: " + state.deskTheme.theme_name;
		}
		let instanceId = (hit.el.getAttribute(INSTANCE_ATTR) || "").trim();
		let instanceOverrides = {};
		if (instanceId) {
			try {
				const inst = await call("get_instance_style", { instance_id: instanceId });
				instanceOverrides = inst.overrides || {};
			} catch (err) {
				toast(err.message, "err");
			}
		}
		const handle = window.nceDesignDialog.open({
			container: ensureRoot(),
			kind: "element",
			title: (firstComp.component_name || "") + " › " + hit.selector,
			subtitle: subtitle,
			notes: notes,
			disabled: !!entry.protected,
			hasPart: false,
			sourceClasses: entry.source_classes || "",
			draft: draft,
			instanceDraft: { instance_style_overrides: instanceOverrides },
			instanceIdentity: instanceIdentityLabel(hit.el, instanceId),
			themeDefaults: themeDefaults,
			deskSources: deskSources,
			deskTheme: state.deskTheme,
			x: x,
			y: y,
			originalStyles: collectOriginalStyles(hit.el, entry),
			buttonSizes: themeButtonSizes(),
			handlers: dialogHandlers(),
		});
		state.popup = {
			kind: "element",
			selector: hit.selector,
			entry: entry,
			draft: handle.draft,
			handle: handle,
			targetEl: hit.el,
			instanceId: instanceId,
			x: x,
			y: y,
		};
		outsideMouseDownHandler = onOutsideMouseDown;
		document.addEventListener("mousedown", outsideMouseDownHandler, true);
		hideOutline();
		updatePreview();
		showSiblings(hit.selector, hit.el);
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

	async function openTablePopup(selector, partHit, x, y) {
		cancelPopup();
		if (!dialogReady()) return;
		const entry = state.map.tables[selector];
		const draft = Object.assign({}, entry.values);
		const targetEl =
			state.sel && state.sel.kind === "table" && state.sel.el ? state.sel.el : null;
		let instanceId = targetEl ? (targetEl.getAttribute(INSTANCE_ATTR) || "").trim() : "";
		let instanceOverrides = {};
		if (instanceId) {
			try {
				const inst = await call("get_instance_style", { instance_id: instanceId });
				instanceOverrides = inst.overrides || {};
			} catch (err) {
				toast(err.message, "err");
			}
		}
		const tableNotes = [
			"Applies to every table drawn by " + entry.component_name + ".",
		];
		const tableFitNote = instanceFitNote(targetEl, selector);
		if (tableFitNote) tableNotes.push(tableFitNote);
		const handle = window.nceDesignDialog.open({
			container: ensureRoot(),
			kind: "table",
			title: entry.component_name + " › table",
			subtitle: "." + selector,
			notes: tableNotes,
			disabled: false,
			hasPart: !!partHit,
			draft: draft,
			instanceDraft: { instance_style_overrides: instanceOverrides },
			instanceIdentity: targetEl
				? instanceIdentityLabel(targetEl, instanceId)
				: instanceIdentityLabel(document.documentElement, instanceId),
			themeDefaults: tableThemeDefaults(selector),
			x: x,
			y: y,
			originalStyles: collectOriginalStyles(targetEl, null),
			handlers: dialogHandlers(),
		});
		state.popup = {
			kind: "table",
			selector: selector,
			entry: entry,
			draft: handle.draft,
			partHit: partHit,
			handle: handle,
			targetEl: targetEl,
			instanceId: instanceId,
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

	function reportMissingInstances() {
		if (!window.nceInstanceApply) return;
		window.nceInstanceApply
			.refresh()
			.then(function () {
				if (!state.on) return;
				const missing = window.nceInstanceApply.missing();
				if (!missing.length) return;
				toast(
					missing.length +
						" This Instance change(s) saved for this screen fit no element. Details in the browser console.",
					"err"
				);
				console.table(
					missing.map(function (n) {
						return {
							instance_id: n.instance_id,
							selector_class: n.selector_class,
							name_tag: n.name_tag,
							label_text: n.label_text,
							context_key: n.context_key,
						};
					})
				);
			})
			.catch(function () {});
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
		reportMissingInstances();
	}

	function turnOff() {
		cancelPopup();
		document.removeEventListener("mousemove", onMouseMove, true);
		window.removeEventListener("scroll", onScroll, true);
		clearHold();
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
		try {
			const gate = await call("get_theme_app_gate");
			state.themeChoices = (gate && gate.active_themes) || [];
			state.deskTheme = (gate && gate.desk_theme) || null;
		} catch (err) {
			state.themeChoices = [];
			state.deskTheme = null;
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
