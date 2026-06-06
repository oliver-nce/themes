<template>
	<div class="home-page">
		<h1 class="home-title">Desk Themes</h1>
		<p class="home-subtitle">Frappe Desk chrome — navbar, backgrounds, borders, and Gantt.</p>

		<div class="card-grid">
			<router-link to="/desk-themes/theme-settings" class="home-card">
				<div class="card-icon">🖥️</div>
				<div class="card-label">Desk Theme Editor</div>
				<div class="card-desc">Configure Desk CSS variables served site-wide via nce_desk_theme.css.</div>
			</router-link>

			<router-link to="/desk-themes/preview" class="home-card">
				<div class="card-icon">👁️</div>
				<div class="card-label">Desk Theme Preview</div>
				<div class="card-desc">Preview Desk chrome changes on live Frappe pages.</div>
			</router-link>
		</div>
	</div>
</template>

<style scoped>
.home-page {
	max-width: 720px;
	margin: 0 auto;
	padding: 48px 24px;
}
.home-title {
	font-size: 24px;
	font-weight: 700;
	color: #111827;
	margin: 0 0 4px;
}
.home-subtitle {
	font-size: 14px;
	color: #6b7280;
	margin: 0 0 32px;
}
.card-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 16px;
}
.home-card {
	display: block;
	padding: 20px;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	background: #fff;
	text-decoration: none;
	transition: border-color 150ms, box-shadow 150ms;
}
.home-card:hover {
	border-color: #3b82f6;
	box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}
.card-icon {
	font-size: 28px;
	margin-bottom: 10px;
}
.card-label {
	font-size: 15px;
	font-weight: 600;
	color: #111827;
	margin-bottom: 4px;
}
.card-desc {
	font-size: 12px;
	color: #6b7280;
	line-height: 1.4;
}
</style>
