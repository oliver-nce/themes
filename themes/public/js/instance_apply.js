(function () {
	if (window.nceInstanceApply) {
		return;
	}

	const METHOD = "/api/method/themes.component_api.";
	const INSTANCE_ATTR = "data-nce-instance";
	const AUTO_ATTR = "data-nce-instance-auto";
	const KEY_ATTR = "data-nce-key";
	const OVERLAY_ID = "nce-design-mode";
	const DEBOUNCE_MS = 150;

	const cache = new Map();
	const pendingLoads = new Map();
	let loadedRoute = null;
	let lastMissing = [];
	let scheduleTimer = null;
	let loadErrorLogged = false;

	function csrf() {
		return (window.frappe && window.frappe.csrf_token) || window.csrf_token || "";
	}

	function currentRoute() {
		let s = (location.pathname || "").trim();
		if (!s) {
			return "";
		}
		for (let i = 0; i < 2; i++) {
			const sep = i === 0 ? "?" : "#";
			const idx = s.indexOf(sep);
			if (idx !== -1) {
				s = s.slice(0, idx);
			}
		}
		while (s.indexOf("//") !== -1) {
			s = s.replace("//", "/");
		}
		if (!s.startsWith("/")) {
			s = "/" + s;
		}
		if (s !== "/" && s.endsWith("/")) {
			s = s.replace(/\/+$/, "");
		}
		return s;
	}

	function normalizeWords(text) {
		const s = String(text || "")
			.replace(/\s+/g, " ")
			.trim();
		if (s.length > 80) {
			return "";
		}
		return s;
	}

	function describe(el) {
		const route = currentRoute();
		let nceKey = el.getAttribute(KEY_ATTR);
		nceKey = nceKey ? nceKey.trim() : "";

		let nameTag = "";
		for (const attr of ["title", "aria-label", "name"]) {
			const v = el.getAttribute(attr);
			if (v && String(v).trim()) {
				nameTag = String(v).trim();
				break;
			}
		}

		const labelText = normalizeWords(el.textContent || "");

		let contextKey = "";
		let node = el.parentElement;
		let depth = 0;
		while (node && node !== document.body && depth < 8) {
			const keyVal = node.getAttribute(KEY_ATTR);
			if (keyVal && String(keyVal).trim()) {
				contextKey = "key:" + String(keyVal).trim();
				break;
			}
			const id = node.id;
			if (id) {
				if (
					!/\d{4,}/.test(id) &&
					!id.startsWith("headlessui-") &&
					!id.startsWith("radix-") &&
					!id.startsWith("reka-")
				) {
					contextKey = "id:" + id;
					break;
				}
			}
			const aria = node.getAttribute("aria-label");
			if (aria && String(aria).trim()) {
				contextKey = "aria:" + String(aria).trim();
				break;
			}
			const children = node.children;
			for (let c = 0; c < children.length; c++) {
				const child = children[c];
				const tag = child.tagName && child.tagName.toLowerCase();
				if (tag !== "h1" && tag !== "h2" && tag !== "h3" && tag !== "h4") {
					continue;
				}
				if (child.contains(el)) {
					continue;
				}
				const headingText = normalizeWords(child.textContent || "");
				if (headingText.length >= 1 && headingText.length <= 60) {
					contextKey = "heading:" + headingText;
					break;
				}
			}
			if (contextKey) {
				break;
			}
			node = node.parentElement;
			depth += 1;
		}

		return {
			route: route,
			nce_key: nceKey,
			name_tag: nameTag,
			label_text: labelText,
			context_key: contextKey,
		};
	}

	function noteFits(note, candidate) {
		if ((note.selector_class || "") !== (candidate.selector_class || "")) {
			return false;
		}
		const nceKey = note.nce_key || "";
		if (nceKey) {
			return (candidate.nce_key || "") === nceKey;
		}
		for (const key of ["name_tag", "label_text", "context_key"]) {
			const noteVal = note[key] || "";
			if (noteVal) {
				if ((candidate[key] || "") !== noteVal) {
					return false;
				}
			}
		}
		return true;
	}

	function noteStrength(note) {
		if (note.nce_key) {
			return 10;
		}
		let n = 0;
		for (const key of ["name_tag", "label_text", "context_key"]) {
			if (note[key]) {
				n += 1;
			}
		}
		return n;
	}

	function isAppOwned(el) {
		return el.hasAttribute(INSTANCE_ATTR) && !el.hasAttribute(AUTO_ATTR);
	}

	function isOverlayChild(el) {
		return !!el.closest("#" + OVERLAY_ID);
	}

	function candidatesForNote(note) {
		const sel = note.selector_class;
		if (!sel) {
			return [];
		}
		let nodes;
		try {
			nodes = document.querySelectorAll("." + CSS.escape(sel));
		} catch (err) {
			return [];
		}
		const out = [];
		for (let i = 0; i < nodes.length; i++) {
			const el = nodes[i];
			if (isOverlayChild(el)) {
				continue;
			}
			out.push(el);
		}
		return out;
	}

	function elementFitsNote(note, el) {
		if (!el.classList.contains(note.selector_class || "")) {
			return false;
		}
		if (isAppOwned(el)) {
			return (el.getAttribute(INSTANCE_ATTR) || "") === (note.instance_id || "");
		}
		const candidate = Object.assign({ selector_class: note.selector_class }, describe(el));
		return noteFits(note, candidate);
	}

	function countFits(note) {
		const candidates = candidatesForNote(note);
		let n = 0;
		for (let i = 0; i < candidates.length; i++) {
			if (elementFitsNote(note, candidates[i])) {
				n += 1;
			}
		}
		return n;
	}

	function fetchInstances(route) {
		const headers = {
			"Content-Type": "application/json",
			Accept: "application/json",
		};
		const token = csrf();
		if (token) {
			headers["X-Frappe-CSRF-Token"] = token;
		}
		return fetch(METHOD + "get_instances_for_route", {
			method: "POST",
			headers: headers,
			body: JSON.stringify({ route: route }),
		})
			.then(function (res) {
				return res.json().then(function (data) {
					if (!res.ok || data.exc_type) {
						throw new Error("get_instances_for_route failed");
					}
					return data.message || [];
				});
			})
			.catch(function () {
				if (!loadErrorLogged) {
					loadErrorLogged = true;
					console.debug("[nce-instance] load failed");
				}
				return [];
			});
	}

	function load(route) {
		loadedRoute = route;
		if (cache.has(route)) {
			return Promise.resolve().then(function () {
				run();
			});
		}
		if (pendingLoads.has(route)) {
			return pendingLoads.get(route);
		}
		const p = fetchInstances(route).then(function (list) {
			cache.set(route, list);
			pendingLoads.delete(route);
			if (loadedRoute === route) {
				run();
			}
		});
		pendingLoads.set(route, p);
		return p;
	}

	function run() {
		const route = currentRoute();
		if (route !== loadedRoute) {
			load(route);
			return;
		}
		const notes = cache.get(route) || [];
		const desired = new Map();
		const noteHasFit = new Map();

		for (let ni = 0; ni < notes.length; ni++) {
			noteHasFit.set(notes[ni], false);
		}

		for (let ni = 0; ni < notes.length; ni++) {
			const note = notes[ni];
			const candidates = candidatesForNote(note);
			for (let ci = 0; ci < candidates.length; ci++) {
				const el = candidates[ci];
				if (!elementFitsNote(note, el)) {
					continue;
				}
				noteHasFit.set(note, true);
				if (isAppOwned(el)) {
					continue;
				}
				const fittingNotes = [];
				for (let nj = 0; nj < notes.length; nj++) {
					const other = notes[nj];
					if (elementFitsNote(other, el)) {
						fittingNotes.push(other);
					}
				}
				if (fittingNotes.length > 1) {
					console.debug(
						"[nce-instance] several notes fit",
						el,
						fittingNotes.map(function (n) {
							return n.instance_id;
						}),
					);
				}
				let best = fittingNotes[0];
				for (let fi = 1; fi < fittingNotes.length; fi++) {
					const n = fittingNotes[fi];
					const bs = noteStrength(best);
					const ns = noteStrength(n);
					if (ns > bs) {
						best = n;
					} else if (ns === bs) {
						const bm = best.modified || "";
						const nm = n.modified || "";
						if (nm > bm) {
							best = n;
						}
					}
				}
				if (best) {
					desired.set(el, best.instance_id);
				}
			}
		}

		lastMissing = notes.filter(function (note) {
			return !noteHasFit.get(note);
		});

		let autoEls;
		try {
			autoEls = document.querySelectorAll("[" + AUTO_ATTR + "]");
		} catch (err) {
			autoEls = [];
		}
		for (let i = 0; i < autoEls.length; i++) {
			const el = autoEls[i];
			if (isOverlayChild(el)) {
				continue;
			}
			const want = desired.get(el);
			if (!want) {
				if (el.hasAttribute(INSTANCE_ATTR)) {
					el.removeAttribute(INSTANCE_ATTR);
				}
				if (el.hasAttribute(AUTO_ATTR)) {
					el.removeAttribute(AUTO_ATTR);
				}
				continue;
			}
			const cur = el.getAttribute(INSTANCE_ATTR) || "";
			if (cur !== want) {
				el.setAttribute(INSTANCE_ATTR, want);
			}
		}

		desired.forEach(function (instanceId, el) {
			if (isAppOwned(el)) {
				return;
			}
			const cur = el.getAttribute(INSTANCE_ATTR) || "";
			if (cur !== instanceId) {
				el.setAttribute(INSTANCE_ATTR, instanceId);
			}
			if (el.getAttribute(AUTO_ATTR) !== "1") {
				el.setAttribute(AUTO_ATTR, "1");
			}
		});
	}

	function schedule() {
		if (scheduleTimer) {
			return;
		}
		scheduleTimer = setTimeout(function () {
			scheduleTimer = null;
			run();
		}, DEBOUNCE_MS);
	}

	function refresh() {
		const route = currentRoute();
		cache.delete(route);
		loadedRoute = null;
		return load(route);
	}

	function start() {
		if (!document.body) {
			return;
		}
		const observer = new MutationObserver(function () {
			schedule();
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			characterData: true,
		});
		window.addEventListener("popstate", schedule);
		load(currentRoute());
	}

	window.nceInstanceApply = {
		describe: describe,
		countFits: countFits,
		refresh: refresh,
		missing: function () {
			return lastMissing.slice();
		},
		currentRoute: currentRoute,
	};

	function boot() {
		if (!document.body) {
			document.addEventListener("DOMContentLoaded", boot);
			return;
		}
		start();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", boot);
	} else {
		boot();
	}
})();
