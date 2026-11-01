// Opens theme preview routes in a popup window instead of navigating the current page.
//

export const PREVIEW_POPUP_FEATURES = "popup=yes,width=1200,height=900,left=100,top=60,scrollbars=yes,resizable=yes"

export function openPreviewPopup(path: string): Window | null {
	const name = path.includes("desk-themes") ? "desk-themes-preview" : "themes-preview"
	const win = window.open(path, name, PREVIEW_POPUP_FEATURES)
	win?.focus()
	return win
}
