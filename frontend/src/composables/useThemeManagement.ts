// Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
//
// Theme editor workflow: dialogs, permissions, CRUD, and site-base actions shared by web and desk pages.

import { computed, reactive, ref } from "vue"
import { useRoute } from "vue-router"
import { createResource } from "frappe-ui"
import {
	useThemeEditor,
	type ThemeAvailabilityStatus,
	type ThemeEditorApiConfig,
	type ThemeEditorLoadHooks,
} from "@/composables/useThemeEditor"

export type ThemeManagementOptions = {
	/** "theme" or "desk theme"; used in user-facing messages. */
	noun: string
	/** Fallback name for "Save as new": "Theme" or "Desk Theme". */
	untitledName: string
	/** Whitelisted method that makes a theme the site base, e.g. "themes.api.set_base_theme". */
	setBaseUrl: string
	themeOptionLabel: (t: any) => string
	switchConfirmMessage: (pendingTheme: string, themes: any[]) => string
	pickAfterDelete: (themes: any[]) => string | undefined
}

export function useThemeManagement(
	api: ThemeEditorApiConfig,
	hooks: Omit<ThemeEditorLoadHooks, "tryLoadThemeFromQuery" | "onCreateSuccess" | "onCreateError">,
	options: ThemeManagementOptions,
) {
	const { noun } = options

	const route = useRoute()

	const confirmDialog = reactive({
		open: false,
		title: "",
		message: "",
		action: "" as "" | "switch" | "restore",
		pendingTheme: "",
		busy: false,
	})

	const saveAsDialog = reactive({ open: false, name: "", error: "", busy: false })
	const renameDialog = reactive({ open: false, name: "", error: "", busy: false })
	const deleteDialog = reactive({ open: false, error: "", busy: false })
	const systemTab = reactive({ password: "", error: "", success: "", busy: false })

	function themeFromQuery(): string {
		return String(route.query.theme || "").trim()
	}

	function tryLoadThemeFromQuery(themes: any[]): boolean {
		const q = themeFromQuery()
		if (!q || !themes?.length) return false
		if (!themes.some((t) => t.name === q)) return false
		loadTheme(q)
		return true
	}

	const editor = useThemeEditor(api, {
		...hooks,
		tryLoadThemeFromQuery,
		onCreateSuccess: (data) => {
			saveAsDialog.open = false
			saveAsDialog.busy = false
			themesList.reload()
			if (data?.theme) loadTheme(data.theme as string)
		},
		onCreateError: (err) => {
			saveAsDialog.error = err?.message || `Could not create ${noun}.`
			saveAsDialog.busy = false
		},
	})

	const {
		loadingTheme,
		saving,
		statusSaving,
		editorLoaded,
		switchError,
		selectedTheme,
		editingTheme,
		siteBaseTheme,
		savedSnapshot,
		savedThemeStatus,
		editorMeta,
		isDirty,
		themesList,
		saveResource,
		renameThemeResource,
		deleteThemeResource,
		createThemeResource,
		baseThemePayloadResource,
		saveAsBaseThemeResource,
		loadTheme,
	} = editor

	const siteBaseThemeName = computed(() => {
		const row = themesList.data?.find((t: any) => t.name === siteBaseTheme.value)
		return row?.theme_name || siteBaseTheme.value || ""
	})

	const themeSelectWidth = computed(() => {
		const labels = (themesList.data || []).map((t: any) => options.themeOptionLabel(t))
		const chars = Math.max(20, ...labels.map((l: string) => l.length), 0)
		return `${Math.min(Math.max(chars * 0.62, 14), 26)}rem`
	})

	const canChangeStatus = computed(
		() =>
			editorLoaded.value &&
			!loadingTheme.value &&
			!saving.value &&
			!statusSaving.value &&
			!isDirty.value,
	)

	const canRenameTheme = computed(
		() =>
			canChangeStatus.value &&
			(editorMeta.is_default_theme || savedThemeStatus.value === "Inactive"),
	)

	const canDeleteTheme = computed(
		() =>
			canChangeStatus.value &&
			savedThemeStatus.value === "Inactive" &&
			!editorMeta.is_default_theme,
	)

	const showRenameButton = computed(() => editorLoaded.value)

	const showDeleteButton = computed(
		() => editorLoaded.value && !editorMeta.is_default_theme,
	)

	const canSetAsDefaultTheme = computed(
		() => canChangeStatus.value && !editorMeta.is_default_theme,
	)

	const setDefaultBusy = ref(false)

	const setDefaultThemeResource = createResource({
		url: options.setBaseUrl,
		auto: false,
	})

	async function requestSetAsDefaultTheme() {
		if (!canSetAsDefaultTheme.value || !editingTheme.value) return
		setDefaultBusy.value = true
		switchError.value = ""
		try {
			const data = await setDefaultThemeResource.submit({ theme: editingTheme.value })
			siteBaseTheme.value = data?.theme || editingTheme.value
			editorMeta.is_default_theme = true
			if (data?.css_hash) editorMeta.css_hash = data.css_hash
			themesList.reload()
			await loadTheme(editingTheme.value)
		} catch (err: any) {
			switchError.value = err?.message || `Could not set Default ${noun}.`
		} finally {
			setDefaultBusy.value = false
		}
	}

	const canSaveAsDefaultTheme = computed(
		() => editorLoaded.value && editorMeta.is_default_theme && !loadingTheme.value,
	)

	function openConfirmDialog(action: "switch" | "restore", pendingTheme = "") {
		confirmDialog.action = action
		confirmDialog.pendingTheme = pendingTheme
		confirmDialog.title = "Unsaved changes"
		confirmDialog.message =
			action === "switch"
				? options.switchConfirmMessage(pendingTheme, themesList.data || [])
				: `Save your changes before restoring from the base ${noun}?`
		confirmDialog.open = true
	}

	function closeConfirmDialog() {
		if (confirmDialog.busy) return
		confirmDialog.open = false
		confirmDialog.action = ""
		confirmDialog.pendingTheme = ""
	}

	async function confirmSaveAndContinue() {
		confirmDialog.busy = true
		try {
			await handleSave()
			if (confirmDialog.action === "switch") {
				await loadTheme(confirmDialog.pendingTheme)
			} else if (confirmDialog.action === "restore") {
				await restoreToBaseConfirmed()
			}
			closeConfirmDialog()
		} catch {
			// keep dialog open
		} finally {
			confirmDialog.busy = false
		}
	}

	async function confirmDiscardAndContinue() {
		const action = confirmDialog.action
		const pendingTheme = confirmDialog.pendingTheme
		closeConfirmDialog()
		if (action === "switch") {
			await loadTheme(pendingTheme)
			return
		}
		revertChanges()
		await restoreToBaseConfirmed()
	}

	function onThemeChange() {
		const next = selectedTheme.value
		const current = editingTheme.value
		if (!next || next === current) return
		if (isDirty.value) {
			selectedTheme.value = current
			openConfirmDialog("switch", next)
			return
		}
		loadTheme(next)
	}

	function revertChanges() {
		hooks.applyPayloadToForm(savedSnapshot.value)
	}

	async function handleSave() {
		saving.value = true
		try {
			const payload = hooks.buildPayloadFromForm()
			await saveResource.submit({ theme: editingTheme.value, payload })
		} catch (err) {
			console.error("Save error:", err)
			throw err
		} finally {
			saving.value = false
		}
	}

	async function setThemeStatus(next: ThemeAvailabilityStatus) {
		if (!canChangeStatus.value || next === savedThemeStatus.value) return
		statusSaving.value = true
		switchError.value = ""
		try {
			await saveResource.submit({
				theme: editingTheme.value,
				payload: savedSnapshot.value,
				status: next,
			})
		} catch (err: any) {
			switchError.value = err?.message || `Could not update ${noun} availability.`
		} finally {
			statusSaving.value = false
		}
	}

	function openSaveAsDialog() {
		saveAsDialog.name = `${editorMeta.theme_name || options.untitledName} copy`
		saveAsDialog.error = ""
		saveAsDialog.open = true
	}

	function closeSaveAsDialog() {
		if (saveAsDialog.busy) return
		saveAsDialog.open = false
		saveAsDialog.name = ""
		saveAsDialog.error = ""
	}

	async function submitSaveAs() {
		const name = saveAsDialog.name.trim()
		if (!name) {
			saveAsDialog.error = `Enter a ${noun} name.`
			return
		}
		saveAsDialog.busy = true
		saveAsDialog.error = ""
		try {
			const payload = hooks.buildPayloadFromForm()
			await createThemeResource.submit({ theme_name: name, payload })
		} catch {
			// onError sets saveAsDialog.error
		}
	}

	function openRenameDialog() {
		if (!canRenameTheme.value) return
		renameDialog.name = editorMeta.theme_name || ""
		renameDialog.error = ""
		renameDialog.open = true
	}

	function closeRenameDialog() {
		if (renameDialog.busy) return
		renameDialog.open = false
		renameDialog.name = ""
		renameDialog.error = ""
	}

	async function submitRename() {
		const name = renameDialog.name.trim()
		if (!name) {
			renameDialog.error = "Enter a theme name."
			return
		}
		renameDialog.busy = true
		renameDialog.error = ""
		try {
			const data = await renameThemeResource.submit({
				theme: editingTheme.value,
				theme_name: name,
			})
			renameDialog.open = false
			renameDialog.name = ""
			renameDialog.error = ""
			await themesList.reload()
			await loadTheme(data?.theme || editingTheme.value)
		} catch (err: any) {
			renameDialog.error = err?.message || `Could not rename ${noun}.`
		} finally {
			renameDialog.busy = false
		}
	}

	function openDeleteDialog() {
		if (!canDeleteTheme.value) return
		deleteDialog.error = ""
		deleteDialog.open = true
	}

	function closeDeleteDialog() {
		if (deleteDialog.busy) return
		deleteDialog.open = false
		deleteDialog.error = ""
	}

	async function submitDelete() {
		deleteDialog.busy = true
		deleteDialog.error = ""
		const deleted = editingTheme.value
		try {
			await deleteThemeResource.submit({ theme: deleted })
			deleteDialog.open = false
			deleteDialog.error = ""
			editingTheme.value = ""
			await themesList.reload()
			const pick = options.pickAfterDelete(themesList.data || [])
			if (pick) await loadTheme(pick)
		} catch (err: any) {
			deleteDialog.error = err?.message || `Could not delete ${noun}.`
		} finally {
			deleteDialog.busy = false
		}
	}

	async function restoreToBaseConfirmed() {
		switchError.value = ""
		try {
			const data = await baseThemePayloadResource.submit({})
			hooks.applyPayloadToForm(data?.payload || {})
			hooks.applyLiveThemeVars()
		} catch (err: any) {
			switchError.value = err?.message || `Could not load base ${noun}.`
		}
	}

	async function saveAsBaseTheme() {
		systemTab.busy = true
		systemTab.error = ""
		systemTab.success = ""
		try {
			const data = await saveAsBaseThemeResource.submit({
				theme: editingTheme.value,
				password: systemTab.password,
			})
			systemTab.password = ""
			systemTab.success = `Base ${noun} saved and bundled into the app. Commit and push the themes app to ship it on new installs.`
			siteBaseTheme.value = data?.theme || editingTheme.value
			editorMeta.is_default_theme = true
			if (data?.css_hash) editorMeta.css_hash = data.css_hash
			themesList.reload()
		} catch (err: any) {
			systemTab.error = err?.message || `Could not save as base ${noun}.`
			throw err
		} finally {
			systemTab.busy = false
		}
	}

	return {
		...editor,
		route,
		themeFromQuery,
		tryLoadThemeFromQuery,
		confirmDialog,
		saveAsDialog,
		renameDialog,
		deleteDialog,
		systemTab,
		siteBaseThemeName,
		themeSelectWidth,
		canChangeStatus,
		canRenameTheme,
		canDeleteTheme,
		showRenameButton,
		showDeleteButton,
		canSetAsDefaultTheme,
		canSaveAsDefaultTheme,
		setDefaultBusy,
		requestSetAsDefaultTheme,
		openConfirmDialog,
		closeConfirmDialog,
		confirmSaveAndContinue,
		confirmDiscardAndContinue,
		onThemeChange,
		revertChanges,
		handleSave,
		setThemeStatus,
		openSaveAsDialog,
		closeSaveAsDialog,
		submitSaveAs,
		openRenameDialog,
		closeRenameDialog,
		submitRename,
		openDeleteDialog,
		closeDeleteDialog,
		submitDelete,
		restoreToBaseConfirmed,
		saveAsBaseTheme,
	}
}

export type ThemeManagement = ReturnType<typeof useThemeManagement>
