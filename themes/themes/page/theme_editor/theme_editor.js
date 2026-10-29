// Desk page that redirects the legacy theme editor to the Vue theme settings route.
//

frappe.pages["theme-editor"].on_page_load = function () {
	window.location.href = "/themes/theme-settings";
};
