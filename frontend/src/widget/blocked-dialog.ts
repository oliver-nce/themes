export type ThemePickerBlockReason = "no_theme_selected" | "theme_not_available"

const MESSAGES: Record<ThemePickerBlockReason, { title: string; body: string }> = {
	no_theme_selected: {
		title: "Theme required",
		body:
			"Select a <strong>Theme</strong> on this form before picking a color. " +
			"The picker needs a theme so it can show the colors your panel will actually use.",
	},
	theme_not_available: {
		title: "Theme not available",
		body:
			"The selected theme can't be used for color picking. " +
			"Choose an <strong>Active</strong> theme from the Theme field, then try again.",
	},
}

export function themePickerBlockReason(themeLink: string): ThemePickerBlockReason {
	return (themeLink || "").trim() ? "theme_not_available" : "no_theme_selected"
}

export function showThemePickerBlockedDialog(reason: ThemePickerBlockReason): void {
	const { title, body } = MESSAGES[reason]
	if (typeof window === "undefined") return

	const frappe = (window as {
		frappe?: {
			msgprint?: (opts: {
				title?: string
				message?: string
				indicator?: string
			}) => void
		}
	}).frappe

	if (frappe?.msgprint) {
		frappe.msgprint({ title, message: body, indicator: "orange" })
		return
	}

	const el = document.createElement("div")
	el.setAttribute("role", "alert")
	el.style.cssText =
		"position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);" +
		"max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;" +
		"border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;"
	el.innerHTML = `<p style="margin:0 0 .5rem;font-weight:600;">${title}</p><p style="margin:0;color:#374151;">${body}</p>`
	const backdrop = document.createElement("div")
	backdrop.style.cssText =
		"position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);"
	const dismiss = () => {
		backdrop.remove()
		el.remove()
	}
	backdrop.addEventListener("click", dismiss)
	el.addEventListener("click", dismiss)
	document.body.append(backdrop, el)
}
