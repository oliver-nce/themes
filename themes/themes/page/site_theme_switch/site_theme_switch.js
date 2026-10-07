// Desk page that opens the Site Theme Config form instead of a custom switch UI.
//
// code-index:begin
// {
//  "purpose": "Desk page that opens the Site Theme Config form instead of a custom switch UI.",
//  "read_when": "When the site-theme-switch Desk page should land on Site Theme Config.",
//  "gotchas": [],
//  "keywords": ["site-theme-switch", "set_route", "Site Theme Config", "on_page_load"],
//  "format": 1
// }
// code-index:end

frappe.pages["site-theme-switch"].on_page_load = function () {
	frappe.set_route("Form", "Site Theme Config");
};
