/**
 * Load nce_desk_theme.css using frappe.boot.desk_theme_css_url so saves apply
 * without bench restart. hooks.app_include_css URLs are fixed at worker import;
 * bootinfo is rebuilt per Desk session with the latest publish hash.
 */
(function () {
	function syncDeskThemeCss() {
		const url = frappe.boot && frappe.boot.desk_theme_css_url;
		if (!url) return;

		const current = document.querySelector('link[data-nce-desk-theme-css="1"]');
		if (current && current.getAttribute("href") === url) return;

		document
			.querySelectorAll('link[href*="nce_desk_theme.css"]')
			.forEach((el) => el.remove());

		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = url;
		link.setAttribute("data-nce-desk-theme-css", "1");
		document.head.appendChild(link);
	}

	function whenDeskReady(fn) {
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

	if (typeof frappe === "undefined") return;

	if (frappe.boot && frappe.boot.desk_theme_css_url) {
		syncDeskThemeCss();
	}
	whenDeskReady(syncDeskThemeCss);
})();
