<script setup lang="ts">
import { inject, watch } from "vue"
import { close, isOpen, open } from "@/widget/theme-swatch-picker-core"

const props = defineProps<{
	themeField: string
	valueField: string
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

function openPicker() {
	const opened = open({
		getThemeSlug: () => readField(props.themeField),
		getValue: () => readField(props.valueField),
		setValue: (className) => writeField(props.valueField, className),
		onClose: () => emit("update:open", false),
		watchThemeSlug: (cb) => {
			const stop = watch(
				() => readField(props.themeField),
				(slug) => cb(slug),
			)
			return () => stop()
		},
	})
	if (!opened) emit("update:open", false)
}

watch(
	() => props.open,
	(shouldOpen) => {
		if (shouldOpen) {
			if (!isOpen()) openPicker()
		} else if (isOpen()) {
			close()
		}
	},
)
</script>

<template><!-- headless: modal is teleported to body by the core --></template>
