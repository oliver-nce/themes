/**
 * Disable site theme CSS (nce_theme.css, nce_component_overrides.css) and the
 * Desk theme stylesheet (nce_desk_theme.css) on apps listed in Theme Component
 * Settings Apply off list. Themes app screens and preview paths stay protected.
 * Sets data-nce-bridge="on" on <html> for Frappe UI palette bridge (light mode).
 */
(function () {
	var gateCache = null;
	var gateLoading = false;
	var gateWaiters = [];
	var lastShouldDisable = false;

	function isSiteStylesheetLink(link) {
		var href = (link.getAttribute("href") || link.href || "").toString();
		if (href.indexOf("nce_desk_theme.css") !== -1) return false;
		return (
			href.indexOf("nce_theme.css") !== -1 ||
			href.indexOf("nce_component_overrides.css") !== -1
		);
	}

	function isDeskThemeStylesheetLink(link) {
		var href = (link.getAttribute("href") || link.href || "").toString();
		return href.indexOf("nce_desk_theme.css") !== -1;
	}

	function isThemeStylesheetLink(link) {
		return isSiteStylesheetLink(link) || isDeskThemeStylesheetLink(link);
	}

	function getSiteStylesheetLinks() {
		var out = [];
		var nodes = document.querySelectorAll('link[rel="stylesheet"]');
		for (var i = 0; i < nodes.length; i++) {
			if (isSiteStylesheetLink(nodes[i])) out.push(nodes[i]);
		}
		return out;
	}

	function getDeskThemeStylesheetLinks() {
		var out = [];
		var nodes = document.querySelectorAll('link[rel="stylesheet"]');
		for (var i = 0; i < nodes.length; i++) {
			if (isDeskThemeStylesheetLink(nodes[i])) out.push(nodes[i]);
		}
		return out;
	}

	function syncOverridesHash(hash) {
		if (!hash) return;
		var links = getSiteStylesheetLinks();
		var needle = "v=" + encodeURIComponent(hash);
		for (var i = 0; i < links.length; i++) {
			var link = links[i];
			var href = (link.getAttribute("href") || link.href || "").toString();
			if (href.indexOf("nce_component_overrides.css") === -1) continue;
			if (href.indexOf(needle) !== -1) continue;
			link.href = href.split("?")[0] + "?" + needle;
		}
	}

	function applyThemeGate(shouldDisable) {
		lastShouldDisable = !!shouldDisable;
		var links = getSiteStylesheetLinks();
		for (var i = 0; i < links.length; i++) {
			links[i].disabled = lastShouldDisable;
		}
		var deskLinks = getDeskThemeStylesheetLinks();
		for (var j = 0; j < deskLinks.length; j++) {
			deskLinks[j].disabled = lastShouldDisable;
		}
	}

	function normalizePath(path) {
		var p = String(path || "");
		if (p.length > 1 && p.charAt(p.length - 1) === "/") {
			p = p.slice(0, -1);
		}
		return p;
	}

	function disabledAppsFromBoot() {
		var boot = typeof frappe !== "undefined" && frappe.boot;
		if (boot && Array.isArray(boot.nce_theme_disabled_apps)) {
			return boot.nce_theme_disabled_apps;
		}
		return null;
	}

	function bridgeAppsFromBoot() {
		var boot = typeof frappe !== "undefined" && frappe.boot;
		if (boot && Array.isArray(boot.nce_bridge_apps)) {
			return boot.nce_bridge_apps;
		}
		return null;
	}

	function loadGate(callback) {
		if (gateLoading) {
			gateWaiters.push(callback);
			return;
		}
		if (typeof frappe === "undefined" || typeof frappe.call !== "function") {
			callback(null);
			return;
		}
		gateLoading = true;
		gateWaiters = [callback];
		try {
			frappe.call({
				method: "themes.component_api.get_theme_app_gate",
				callback: function (r) {
					gateCache =
						(r && r.message) || {
							disabled_apps: [],
							route_prefixes: [],
						};
					gateLoading = false;
					var waiters = gateWaiters;
					gateWaiters = [];
					for (var i = 0; i < waiters.length; i++) waiters[i](gateCache);
				},
				error: function () {
					gateLoading = false;
					var waiters = gateWaiters;
					gateWaiters = [];
					for (var j = 0; j < waiters.length; j++) waiters[j](null);
				},
			});
		} catch (err) {
			gateLoading = false;
			var w = gateWaiters;
			gateWaiters = [];
			for (var k = 0; k < w.length; k++) w[k](null);
		}
	}

	function moduleToApp(module) {
		if (!module) return null;
		var moduleApp =
			typeof frappe !== "undefined" &&
			frappe.boot &&
			frappe.boot.module_app;
		if (!moduleApp) return null;
		var scrubbed;
		if (typeof frappe.scrub === "function") {
			scrubbed = frappe.scrub(module);
		} else {
			scrubbed = String(module)
				.toLowerCase()
				.replace(/[\s-]+/g, "_");
		}
		if (scrubbed && moduleApp[scrubbed]) return moduleApp[scrubbed];
		var slug =
			frappe.router && typeof frappe.router.slug === "function"
				? frappe.router.slug(module)
				: null;
		return (slug && moduleApp[slug]) || moduleApp[module] || null;
	}

	function resolveAppFromDesk() {
		if (typeof frappe === "undefined" || !frappe.get_route) return null;
		if (!frappe.boot || !frappe.boot.module_app) return null;
		var route = frappe.get_route();
		if (!route || !route.length) return null;

		var r0 = String(route[0] || "");
		var r0Lower = r0.toLowerCase();
		var module = null;

		if (
			(r0Lower === "list" ||
				r0Lower === "form" ||
				r0Lower === "tree" ||
				r0Lower === "report") &&
			route[1]
		) {
			if (typeof frappe.get_meta === "function") {
				var meta = frappe.get_meta(route[1]);
				if (meta && meta.module) module = meta.module;
			}
		} else if (r0Lower === "workspaces" || r0Lower === "workspace") {
			var wsName = route[1];
			var workspaces = frappe.boot.workspaces;
			if (workspaces && wsName) {
				var wsNameLower = String(wsName).toLowerCase();
				var ws = null;
				if (
					workspaces[wsName] &&
					typeof workspaces[wsName] === "object" &&
					!Array.isArray(workspaces[wsName])
				) {
					ws = workspaces[wsName];
				}
				var candidates = Array.isArray(workspaces)
					? workspaces
					: workspaces && Array.isArray(workspaces.pages)
						? workspaces.pages
						: [];
				if (!ws && candidates.length) {
					for (var ci = 0; ci < candidates.length; ci++) {
						var pageEntry = candidates[ci];
						if (!pageEntry) continue;
						var nameMatch =
							pageEntry.name &&
							String(pageEntry.name).toLowerCase() === wsNameLower;
						var titleMatch =
							pageEntry.title &&
							String(pageEntry.title).toLowerCase() === wsNameLower;
						if (nameMatch || titleMatch) {
							ws = pageEntry;
							break;
						}
					}
				}
				if (!ws) {
					for (var key in workspaces) {
						if (!Object.prototype.hasOwnProperty.call(workspaces, key)) {
							continue;
						}
						var candidate = workspaces[key];
						if (!candidate || typeof candidate !== "object") continue;
						if (Array.isArray(candidate)) continue;
						var candNameMatch =
							candidate.name &&
							String(candidate.name).toLowerCase() === wsNameLower;
						var candTitleMatch =
							candidate.title &&
							String(candidate.title).toLowerCase() === wsNameLower;
						if (candNameMatch || candTitleMatch) {
							ws = candidate;
							break;
						}
					}
				}
				if (ws) {
					if (ws.app && String(ws.app)) {
						return String(ws.app);
					}
					if (ws.module) module = ws.module;
				}
			}
		} else if (r0Lower === "page" && route[1]) {
			var pageInfo =
				frappe.boot.page_info && frappe.boot.page_info[route[1]];
			if (pageInfo && pageInfo.module) module = pageInfo.module;
		} else if (route.length === 1 && route[0]) {
			var one = frappe.boot.page_info && frappe.boot.page_info[route[0]];
			if (one && one.module) module = one.module;
		}

		return moduleToApp(module);
	}

	function resolveAppFromPrefixes(prefixes) {
		if (!prefixes || !prefixes.length) return null;
		var path = normalizePath(
			typeof location !== "undefined" ? location.pathname : ""
		);
		var bestApp = null;
		var bestLen = -1;
		for (var i = 0; i < prefixes.length; i++) {
			var entry = prefixes[i];
			if (!entry) continue;
			var prefix = normalizePath(entry.prefix || "");
			if (!prefix || prefix === "/") continue;
			var matches =
				path === prefix || path.indexOf(prefix + "/") === 0;
			if (matches && prefix.length > bestLen) {
				bestLen = prefix.length;
				bestApp = entry.app || null;
			}
		}
		return bestApp;
	}

	function isPreviewPath(path) {
		var p = normalizePath(path);
		var previews = [
			"/themes/preview",
			"/desk-themes/preview",
			"/app-themes/preview",
		];
		for (var i = 0; i < previews.length; i++) {
			var base = previews[i];
			if (p === base || p.indexOf(base + "/") === 0) return true;
		}
		return false;
	}

	function setPageTheme(slug) {
		var root = document.documentElement;
		if (slug) {
			root.setAttribute("data-nce-theme", slug);
		} else {
			root.removeAttribute("data-nce-theme");
		}
	}

	function setBridge(on) {
		var root = document.documentElement;
		if (on) {
			root.setAttribute("data-nce-bridge", "on");
		} else {
			root.removeAttribute("data-nce-bridge");
		}
	}

	function slugFor(gate, app) {
		if (!gate || !app || !gate.app_themes) return "";
		var themes = gate.app_themes;
		for (var i = 0; i < themes.length; i++) {
			var entry = themes[i];
			if (entry && entry.app === app) return entry.slug || "";
		}
		return "";
	}

	function isProtectedPage(app) {
		var path =
			typeof location !== "undefined" ? location.pathname : "";
		return isPreviewPath(path) || app === "themes";
	}

	function applyDisabledOnly(app, disabledList, bridgeList) {
		if (!app || isProtectedPage(app)) {
			setPageTheme("");
			setBridge(false);
			applyThemeGate(false);
			return;
		}
		var off = (disabledList || []).indexOf(app) !== -1;
		applyThemeGate(off);
		if (off) setPageTheme("");
		var bridgeOn =
			!off &&
			bridgeList &&
			bridgeList.indexOf(app) !== -1;
		setBridge(!!bridgeOn);
	}

	function applyAppFromGate(app, gate) {
		if (isProtectedPage(app)) {
			setPageTheme("");
			setBridge(false);
			applyThemeGate(false);
			return;
		}
		if (!app) {
			setPageTheme("");
			setBridge(false);
			applyThemeGate(false);
			return;
		}
		var list = (gate && gate.disabled_apps) || [];
		var off = list.indexOf(app) !== -1;
		var bridgeApps = (gate && gate.bridge_apps) || [];
		var bridgeOn = !off && bridgeApps.indexOf(app) !== -1;
		if (off) {
			applyThemeGate(true);
			setPageTheme("");
			setBridge(false);
			return;
		}
		applyThemeGate(false);
		setPageTheme(slugFor(gate, app) || "");
		setBridge(bridgeOn);
	}

	function evaluateAndApply() {
		try {
			var deskApp = resolveAppFromDesk();
			if (deskApp) {
				var bootList = disabledAppsFromBoot();
				if (bootList !== null) {
					applyDisabledOnly(deskApp, bootList, bridgeAppsFromBoot());
				}
				loadGate(function (gate) {
					try {
						if (!gate) return;
						syncOverridesHash(gate.component_css_hash);
						applyAppFromGate(deskApp, gate);
					} catch (e) {
						applyThemeGate(false);
						setPageTheme("");
						setBridge(false);
					}
				});
				return;
			}

			loadGate(function (gate) {
				try {
					if (!gate) {
						applyThemeGate(false);
						setPageTheme("");
						setBridge(false);
						return;
					}
					syncOverridesHash(gate.component_css_hash);
					if (isPreviewPath(location.pathname)) {
						setPageTheme("");
						setBridge(false);
						applyThemeGate(false);
						return;
					}
					var app = resolveAppFromPrefixes(gate.route_prefixes);
					applyAppFromGate(app, gate);
				} catch (e) {
					applyThemeGate(false);
					setPageTheme("");
					setBridge(false);
				}
			});
		} catch (err) {
			applyThemeGate(false);
			setPageTheme("");
			setBridge(false);
		}
	}

	function reapplyLastDecision() {
		try {
			var links = getSiteStylesheetLinks();
			for (var i = 0; i < links.length; i++) {
				links[i].disabled = lastShouldDisable;
			}
			var deskLinks = getDeskThemeStylesheetLinks();
			for (var j = 0; j < deskLinks.length; j++) {
				deskLinks[j].disabled = lastShouldDisable;
			}
		} catch (err) {
			/* no throw */
		}
	}

	function observeHead() {
		if (!document.head || typeof MutationObserver === "undefined") return;
		var observer = new MutationObserver(function (mutations) {
			var touched = false;
			for (var m = 0; m < mutations.length; m++) {
				var added = mutations[m].addedNodes;
				for (var n = 0; n < added.length; n++) {
					var node = added[n];
					if (node.nodeName === "LINK" && isThemeStylesheetLink(node)) {
						touched = true;
						break;
					}
				}
				if (touched) break;
			}
			if (touched) reapplyLastDecision();
		});
		try {
			observer.observe(document.head, { childList: true });
		} catch (err) {
			/* no throw */
		}
	}

	function bindRouter() {
		try {
			if (
				typeof frappe !== "undefined" &&
				frappe.router &&
				typeof frappe.router.on === "function"
			) {
				frappe.router.on("change", function () {
					evaluateAndApply();
				});
			}
		} catch (err) {
			/* no throw */
		}
	}

	function whenReady(fn) {
		if (typeof frappe !== "undefined" && typeof frappe.ready === "function") {
			frappe.ready(fn);
			return;
		}
		if (typeof jQuery !== "undefined") {
			jQuery(fn);
			return;
		}
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", fn);
		} else {
			fn();
		}
	}

	whenReady(function () {
		evaluateAndApply();
		bindRouter();
		observeHead();
	});
})();
