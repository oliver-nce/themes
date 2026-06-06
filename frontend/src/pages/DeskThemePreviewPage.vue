<template>
	<div class="desk-preview-stub">
		<h1>Desk Theme Preview</h1>
		<p>Live iframe preview lands in phase 8. Open Desk Theme Editor to save changes to <code>nce_desk_theme.css</code>.</p>
		<router-link to="/desk-themes/theme-settings" class="link">← Desk Theme Editor</router-link>
	</div>
</template>

<style scoped>
.desk-preview-stub {
	max-width: 40rem;
	margin: 3rem auto;
	padding: 0 1.5rem;
	text-align: center;
	color: #374151;
}
.desk-preview-stub h1 {
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 0.75rem;
}
.desk-preview-stub p {
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0 0 1.25rem;
}
.link {
	font-size: 0.875rem;
	color: #2563eb;
	text-decoration: none;
}
.link:hover {
	text-decoration: underline;
}
</style>
