frappe.listview_settings["Vue Component"] = {
	add_fields: ["needs_attention", "status"],
	get_indicator(doc) {
		if (cint(doc.needs_attention)) {
			return [__("!! Work to do"), "red", "needs_attention,=,1"];
		}
		return [__("Done"), "green", "needs_attention,=,0"];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Rescan"), () => {
			frappe.call({
				method: "themes.component_api.rescan_all",
				freeze: true,
				freeze_message: __("Scanning .vue files…"),
				callback(r) {
					const m = r.message || {};
					frappe.show_alert({
						message: __("{0} files: {1} new, {2} missing, {3} with work to do", [
							m.found,
							m.new,
							m.missing,
							m.with_work,
						]),
						indicator: m.with_work ? "orange" : "green",
					});
					listview.refresh();
				},
			});
		});
	},
};
