import { computed, nextTick, reactive, ref } from "vue"
import { createResource } from "frappe-ui"

export type ThemeAvailabilityStatus = "Active" | "Inactive"

export type ThemeEditorApiConfig = {
	list: string
	getEditor: string
	save: string
	rename: string
	delete: string
	create: string
	basePayload: string
	saveAsBase: string
}

export type ThemeEditorLoadHooks = {
	applyPayloadToForm: (payload: Record<string, unknown>) => void
	buildPayloadFromForm: () => Record<string, unknown>
	canonicalPayload: (source: Record<string, unknown>) => Record<string, unknown>
	applyLiveThemeVars: () => void
	tryLoadThemeFromQuery: (themes: unknown[]) => boolean
	pickInitialTheme?: (themes: Array<Record<string, unknown>>) => string | undefined
	defaultSavedStatus: ThemeAvailabilityStatus
	notFoundMessage: string
	loadErrorMessage: string
	useLegacyIsActive?: boolean
	onEditorLoaded?: (data: Record<string, unknown>) => void
	onCreateSuccess?: (data: Record<string, unknown>) => void
	onCreateError?: (err: { message?: string }) => void
}

export function useThemeEditor(api: ThemeEditorApiConfig, hooks: ThemeEditorLoadHooks) {
	const loadingTheme = ref(false)
	const saving = ref(false)
	const statusSaving = ref(false)
	const editorLoaded = ref(false)
	const editorError = ref("")
	const switchError = ref("")
	const listLoadError = ref("")
	const selectedTheme = ref("")
	const editingTheme = ref("")
	const siteBaseTheme = ref("")
	const savedSnapshot = ref<Record<string, unknown>>({})
	const dirtyBaselineReady = ref(false)
	const savedThemeStatus = ref<ThemeAvailabilityStatus>(hooks.defaultSavedStatus)

	const editorMeta = reactive({
		theme: "",
		theme_name: "",
		slug: "",
		css_hash: "",
		is_default_theme: false,
	})

	function readIsDefaultTheme(data: Record<string, unknown> | null | undefined): boolean {
		if (!data) return false
		if (data.is_default_theme !== undefined) return !!data.is_default_theme
		if (data.is_base_theme !== undefined) return !!data.is_base_theme
		if (hooks.useLegacyIsActive && data.is_active !== undefined) return !!data.is_active
		return false
	}

	function readSiteDefaultTheme(data: Record<string, unknown> | null | undefined): string {
		if (!data) return ""
		return (
			(data.site_default_theme as string) ||
			(data.site_base_theme as string) ||
			(hooks.useLegacyIsActive ? (data.site_active_theme as string) : "") ||
			""
		)
	}

	function normalizeThemeStatus(status: string | undefined | null): ThemeAvailabilityStatus {
		return status === "Inactive" ? "Inactive" : "Active"
	}

	function captureSnapshot(payload?: Record<string, unknown>) {
		savedSnapshot.value = hooks.canonicalPayload(payload || hooks.buildPayloadFromForm())
	}

	async function establishDirtyBaseline() {
		dirtyBaselineReady.value = false
		captureSnapshot()
		await nextTick()
		captureSnapshot()
		dirtyBaselineReady.value = true
	}

	const isDirty = computed(() => {
		if (!editorLoaded.value || !dirtyBaselineReady.value || loadingTheme.value) return false
		const current = hooks.canonicalPayload(hooks.buildPayloadFromForm())
		return JSON.stringify(current) !== JSON.stringify(savedSnapshot.value)
	})

	const themesList = createResource({
		url: api.list,
		auto: true,
		onSuccess(data: Array<Record<string, unknown>>) {
			listLoadError.value = ""
			if (!data?.length || editingTheme.value) return
			if (hooks.tryLoadThemeFromQuery(data)) return
			const pick =
				hooks.pickInitialTheme?.(data) ||
				(data.find((t) => t.is_default_theme || t.is_base_theme)?.name as string | undefined) ||
				(data.find((t) => t.is_active)?.name as string | undefined) ||
				(data[0]?.name as string | undefined)
			if (pick) loadTheme(pick)
		},
		onError(err: { message?: string }) {
			listLoadError.value = err?.message || hooks.loadErrorMessage
		},
	})

	const editorResource = createResource({
		url: api.getEditor,
		auto: false,
		async onSuccess(data: Record<string, unknown> | null | undefined) {
			loadingTheme.value = false
			editorError.value = ""
			switchError.value = ""
			editorLoaded.value = false
			dirtyBaselineReady.value = false
			if (!data) {
				editorError.value = hooks.notFoundMessage
				return
			}
			editingTheme.value = (data.theme as string) || ""
			selectedTheme.value = (data.theme as string) || ""
			siteBaseTheme.value = readSiteDefaultTheme(data) || siteBaseTheme.value
			editorMeta.theme = (data.theme as string) || ""
			editorMeta.theme_name = (data.theme_name as string) || (data.theme as string) || ""
			editorMeta.slug = (data.slug as string) || ""
			editorMeta.css_hash = (data.css_hash as string) || ""
			editorMeta.is_default_theme = readIsDefaultTheme(data)
			savedThemeStatus.value = normalizeThemeStatus(data.status as string)
			hooks.onEditorLoaded?.(data)
			hooks.applyPayloadToForm((data.payload as Record<string, unknown>) || {})
			editorLoaded.value = true
			await establishDirtyBaseline()
			hooks.applyLiveThemeVars()
		},
		onError(err: { message?: string }) {
			loadingTheme.value = false
			editorLoaded.value = false
			editorError.value = err?.message || hooks.loadErrorMessage
		},
	})

	async function loadTheme(theme: string) {
		if (!theme) return
		loadingTheme.value = true
		dirtyBaselineReady.value = false
		editorError.value = ""
		try {
			await editorResource.submit({ theme })
		} catch {
			// onError sets editorError
		}
	}

	const saveResource = createResource({
		url: api.save,
		onSuccess(data: Record<string, unknown> | null | undefined) {
			if (data?.css_hash) editorMeta.css_hash = data.css_hash as string
			editorMeta.is_default_theme = readIsDefaultTheme(data)
			if (data?.theme_status) {
				savedThemeStatus.value = normalizeThemeStatus(data.theme_status as string)
			}
			captureSnapshot()
			themesList.reload()
		},
	})

	const renameThemeResource = createResource({ url: api.rename, auto: false })
	const deleteThemeResource = createResource({ url: api.delete, auto: false })
	const createThemeResource = createResource({
		url: api.create,
		auto: false,
		onSuccess(data: Record<string, unknown> | null | undefined) {
			hooks.onCreateSuccess?.(data || {})
		},
		onError(err: { message?: string }) {
			hooks.onCreateError?.(err)
		},
	})
	const baseThemePayloadResource = createResource({ url: api.basePayload, auto: false })
	const saveAsBaseThemeResource = createResource({ url: api.saveAsBase, auto: false })

	return {
		loadingTheme,
		saving,
		statusSaving,
		editorLoaded,
		editorError,
		switchError,
		listLoadError,
		selectedTheme,
		editingTheme,
		siteBaseTheme,
		savedSnapshot,
		dirtyBaselineReady,
		savedThemeStatus,
		editorMeta,
		isDirty,
		themesList,
		editorResource,
		saveResource,
		renameThemeResource,
		deleteThemeResource,
		createThemeResource,
		baseThemePayloadResource,
		saveAsBaseThemeResource,
		loadTheme,
		captureSnapshot,
		establishDirtyBaseline,
		normalizeThemeStatus,
	}
}
