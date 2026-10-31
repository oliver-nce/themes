<template>
<div
	class="ppv2-float theme-rounded theme-shadow-theme"
	:class="[frameBgClass, ...frameBorderClasses]"
	:style="floatStyle"
>
	<div class="ppv2-float-header">
		<PanelHeaderToolbar />
	</div>
	<div class="ppv2-float-footer" :class="[footerBgClass, footerFgTextClass]">
		<span :class="footerFgExplicitClass"><slot name="footer" /></span>
	</div>
</div>
</template>
<script setup>
</script>
