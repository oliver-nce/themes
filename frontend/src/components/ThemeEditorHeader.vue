<!--
Theme editor header: title, base-theme status, availability radios, theme picker and action buttons.

-->

// Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
<template>
	<div class="editor-header editor-panel">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
			<div>
				<h1 class="editor-title">{{ title }}</h1>
				<p class="editor-subtitle mt-0.5">
					Editing <strong>{{ editorMeta.theme_name || "—" }}</strong>
					<span v-if="editingTheme && siteBaseTheme && editingTheme !== siteBaseTheme" class="editor-warn">
						· not the site base {{ noun }}
					</span>
					<span v-if="siteBaseThemeName" class="editor-muted">
						· Site base: <strong>{{ siteBaseThemeName }}</strong>
					</span>
				</p>
				<div
					v-if="editorLoaded"
					class="editor-status-row mt-2 flex flex-wrap items-center gap-x-4 gap-y-1"
				>
					<span class="editor-status-label">{{ statusLabel }}</span>
					<label class="editor-status-option">
						<input
							type="radio"
							:name="radioName"
							value="Active"
							:checked="savedThemeStatus === 'Active'"
							:disabled="!canChangeStatus"
							@change="setThemeStatus('Active')"
						/>
						Active
					</label>
					<label class="editor-status-option">
						<input
							type="radio"
							:name="radioName"
							value="Inactive"
							:checked="savedThemeStatus === 'Inactive'"
							:disabled="!canChangeStatus"
							@change="setThemeStatus('Inactive')"
						/>
						Inactive
					</label>
					<span v-if="statusSaving" class="editor-status-hint">Saving…</span>
					<span v-else-if="isDirty" class="editor-status-hint editor-status-hint-warn">
						Save or revert changes before changing availability
					</span>
				</div>
			</div>
			<div class="editor-toolbar flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 lg:justify-end lg:max-w-[70%]">
				<select
					v-if="themesList.data?.length"
					v-model="selectedTheme"
					class="theme-select"
					:style="{ minWidth: themeSelectWidth }"
					:disabled="loadingTheme"
					@change="onThemeChange"
				>
					<option v-for="t in themesList.data" :key="t.name" :value="t.name">
						{{ themeOptionLabel(t) }}
					</option>
				</select>
				<div class="editor-actions flex flex-wrap gap-2 justify-end">
					<Button
						variant="solid"
						class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
						@click="emit('preview')"
					>
						Open Preview ↗
					</Button>
					<Button
						variant="solid"
						class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
						:disabled="!isDirty || loadingTheme"
						@click="revertChanges"
					>
						Revert
					</Button>
					<Button
						variant="solid"
						class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
						:loading="saving"
						:disabled="!isDirty || loadingTheme"
						@click="handleSave"
					>
						Save Changes
					</Button>
					<Button
						variant="solid"
						class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
						:disabled="loadingTheme || !siteBaseTheme || (restoreBlockedOnBase && editingTheme === siteBaseTheme)"
						@click="emit('restore')"
					>
						Restore to Base {{ restoreTarget }}
					</Button>
					<Button
						variant="solid"
						class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
						:disabled="loadingTheme"
						@click="openSaveAsDialog"
					>
						Save as new {{ noun }}
					</Button>
					<Button
						v-if="canSetAsDefaultTheme"
						variant="solid"
						class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
						:loading="setDefaultBusy"
						:disabled="!canSetAsDefaultTheme"
						@click="requestSetAsDefaultTheme"
					>
						Set as Default {{ noun }}
					</Button>
					<Button
						v-if="showRenameButton"
						variant="solid"
						class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
						:disabled="!canRenameTheme"
						@click="openRenameDialog"
					>
						Rename
					</Button>
					<Button
						v-if="showDeleteButton"
						variant="solid"
						class="theme-btn theme-btn-quiet bg-primary-100 text-primary-100-fg border border-border hover:bg-row-alt"
						:disabled="!canDeleteTheme"
						@click="openDeleteDialog"
					>
						Delete
					</Button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { ThemeManagement } from "@/composables/useThemeManagement"

const props = defineProps<{
	manager: ThemeManagement
	title: string
	noun: string
	statusLabel: string
	radioName: string
	/** Completes the "Restore to Base …" button label, e.g. "Theme" or "Desk Theme". */
	restoreTarget: string
	restoreBlockedOnBase?: boolean
	themeOptionLabel: (t: any) => string
}>()

const emit = defineEmits<{ preview: []; restore: [] }>()

const {
	editorMeta,
	editingTheme,
	siteBaseTheme,
	siteBaseThemeName,
	editorLoaded,
	savedThemeStatus,
	canChangeStatus,
	setThemeStatus,
	statusSaving,
	isDirty,
	themesList,
	selectedTheme,
	themeSelectWidth,
	loadingTheme,
	onThemeChange,
	revertChanges,
	saving,
	handleSave,
	openSaveAsDialog,
	canSetAsDefaultTheme,
	setDefaultBusy,
	requestSetAsDefaultTheme,
	showRenameButton,
	canRenameTheme,
	openRenameDialog,
	showDeleteButton,
	canDeleteTheme,
	openDeleteDialog,
} = props.manager
</script>
