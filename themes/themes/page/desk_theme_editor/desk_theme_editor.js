// Desk page that redirects the legacy desk theme editor to the Vue settings route.
//

frappe.pages["desk-theme-editor"].on_page_load = function () {
	window.location.href = "/desk-themes/theme-settings";
};
