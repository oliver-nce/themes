// Desk page that opens the Site Theme Config form instead of a custom switch UI.
//

frappe.pages["site-theme-switch"].on_page_load = function () {
	frappe.set_route("Form", "Site Theme Config");
};
