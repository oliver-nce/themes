// Desk page that redirects the legacy theme editor to the Vue theme settings route.
//
// code-index:begin
// {
//  "purpose": "Desk page that redirects the legacy theme editor to the Vue theme settings route.",
//  "read_when": "When the Desk page theme-editor should open the Vue web theme editor.",
//  "gotchas": [],
//  "keywords": ["theme-editor", "on_page_load", "theme-settings", "location.href"],
//  "format": 1
// }
// code-index:end

frappe.pages["theme-editor"].on_page_load = function () {
	window.location.href = "/themes/theme-settings";
};
