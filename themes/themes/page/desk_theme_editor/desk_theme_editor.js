// Desk page that redirects the legacy desk theme editor to the Vue settings route.
//
// code-index:begin
// {
//  "purpose": "Desk page that redirects the legacy desk theme editor to the Vue settings route.",
//  "read_when": "When the Desk page desk-theme-editor should open the Vue desk theme editor.",
//  "gotchas": [],
//  "keywords": ["desk-theme-editor", "on_page_load", "desk-themes", "theme-settings"],
//  "format": 1
// }
// code-index:end

frappe.pages["desk-theme-editor"].on_page_load = function () {
	window.location.href = "/desk-themes/theme-settings";
};
