<script setup lang="ts">
/**
 * Agent note — Vue save path: pass :set-field and :get-field bound to the host's
 * reactive form state (e.g. formData in NCE Events usePanelFormDialog). Without
 * setField, writes may miss the save payload and dirty tracking. Desk uses
 * frappe.ui.themeSwatchPicker.open({ frm }) instead — that path uses frm.set_value.
 */
import { inject, watch } from "vue"
import { close, isOpen, open } from "@/widget/theme-swatch-picker-core"
import type { ThemeFgType } from "@/widget/constants"

const props = defineProps<{
	themeField: string
	valueField: string
	fgTypeField?: string
	open: boolean
	getField?: (name: string) => unknown
	setField?: (name: string, value: unknown) => void
}>()

const emit = defineEmits<{
	"update:open": [value: boolean]
}>()

type FormLike = Record<string, unknown> & {
	doc?: Record<string, unknown>
}

const injectedForm = inject<FormLike | null>("nceForm", null)

function readField(name: string): string {
	if (props.getField) return String(props.getField(name) ?? "")
	const form = injectedForm
	if (form?.doc && name in form.doc) return String(form.doc[name] ?? "")
	if (form && name in form) return String(form[name] ?? "")
	return ""
}

function writeField(name: string, value: string): void {
	if (props.setField) {
		props.setField(name, value)
		return
	}
	const form = injectedForm
	if (form?.doc) {
		form.doc[name] = value
		return
	}
	if (form) {
		form[name] = value
	}
}

function resolveFgTypeField(): string | undefined {
	if (props.fgTypeField) return props.fgTypeField
	if (props.valueField.endsWith("_bg_class")) {
		return props.valueField.replace(/_bg_class$/, "_fg_type")
	}
	return undefined
}

function openPicker() {
	const fgTypeField = resolveFgTypeField()
	const coreOpts: Parameters<typeof open>[0] = {
		getThemeSlug: () => readField(props.themeField),
		getValue: () => readField(props.valueField),
		setValue: (className) => writeField(props.valueField, className),
		onClose: () => emit("update:open", false),
	}

	if (fgTypeField) {
		coreOpts.getFgType = () => readField(fgTypeField) || "mono"
		coreOpts.setFgType = (fgType: ThemeFgType) =>
			writeField(fgTypeField, fgType)
	}

	const opened = open(coreOpts)
	if (!opened) emit("update:open", false)
}

watch(
	() => props.open,
	(shouldOpen) => {
		if (shouldOpen) {
			if (!isOpen()) openPicker()
		} else if (isOpen()) {
			close({ saved: false })
		}
	},
)
</script>

<template><!-- headless: modal is teleported to body by the core --></template>
