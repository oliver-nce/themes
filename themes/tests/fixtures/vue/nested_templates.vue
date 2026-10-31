<template>
<div>
	<template v-if="x">
		<span class="badge theme-bg-success-400">ok</span>
	</template>
	<panel-table class="tbl theme-border" />
	<select class="fd-input fd-select theme-border">
		<option value="">—</option>
	</select>
</div>
</template>
