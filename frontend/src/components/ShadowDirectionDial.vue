<template>
	<div class="shadow-direction">
		<label class="block text-sm font-medium text-gray-700 mb-1.5">
			Shadow Direction
			<span class="font-normal text-gray-500">({{ displayAngle }}°)</span>
		</label>
		<div class="shadow-direction-row">
			<div
				ref="dialEl"
				class="shadow-direction-dial"
				role="slider"
				:aria-valuenow="displayAngle"
				aria-valuemin="0"
				aria-valuemax="360"
				aria-label="Shadow direction in degrees"
				tabindex="0"
				@mousedown.prevent="startDrag"
				@touchstart.prevent="startTouch"
				@keydown="onKeydown"
			>
				<svg viewBox="0 0 100 100" class="shadow-direction-svg" aria-hidden="true">
					<circle cx="50" cy="50" r="42" class="shadow-direction-ring" />
					<line x1="50" y1="50" :x2="handle.x" :y2="handle.y" class="shadow-direction-spoke" />
					<circle :cx="handle.x" :cy="handle.y" r="5" class="shadow-direction-handle" />
					<text x="50" y="12" class="shadow-direction-label">0°</text>
					<text x="88" y="54" class="shadow-direction-label">90°</text>
					<text x="50" y="96" class="shadow-direction-label">180°</text>
					<text x="6" y="54" class="shadow-direction-label">270°</text>
				</svg>
			</div>
			<p class="shadow-direction-hint text-xs text-gray-500">
				180° = down. Drag the handle to set offset direction.
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue"
import { angleFromPointer, dialHandlePosition } from "@/utils/shadowBuild"

const props = defineProps<{
	modelValue: number
}>()

const emit = defineEmits<{
	"update:modelValue": [value: number]
}>()

const dialEl = ref<HTMLElement | null>(null)

const displayAngle = computed(() => clampAngle(props.modelValue))

const handle = computed(() => dialHandlePosition(displayAngle.value, 50, 50, 38))

function clampAngle(raw: unknown): number {
	const n = Number(raw)
	if (!Number.isFinite(n)) return 180
	return Math.max(0, Math.min(360, Math.round(n)))
}

function setFromPointer(clientX: number, clientY: number) {
	if (!dialEl.value) return
	const rect = dialEl.value.getBoundingClientRect()
	const cx = rect.left + rect.width / 2
	const cy = rect.top + rect.height / 2
	emit("update:modelValue", angleFromPointer(clientX, clientY, cx, cy))
}

function onMove(e: MouseEvent) {
	setFromPointer(e.clientX, e.clientY)
}

function onTouchMove(e: TouchEvent) {
	const t = e.touches[0]
	if (t) setFromPointer(t.clientX, t.clientY)
}

function stopDrag() {
	window.removeEventListener("mousemove", onMove)
	window.removeEventListener("mouseup", stopDrag)
}

function stopTouch() {
	window.removeEventListener("touchmove", onTouchMove)
	window.removeEventListener("touchend", stopTouch)
}

function startDrag(e: MouseEvent) {
	setFromPointer(e.clientX, e.clientY)
	window.addEventListener("mousemove", onMove)
	window.addEventListener("mouseup", stopDrag)
}

function startTouch(e: TouchEvent) {
	const t = e.touches[0]
	if (t) setFromPointer(t.clientX, t.clientY)
	window.addEventListener("touchmove", onTouchMove, { passive: false })
	window.addEventListener("touchend", stopTouch)
}

function onKeydown(e: KeyboardEvent) {
	let next = displayAngle.value
	if (e.key === "ArrowLeft" || e.key === "ArrowDown") next -= e.shiftKey ? 15 : 1
	else if (e.key === "ArrowRight" || e.key === "ArrowUp") next += e.shiftKey ? 15 : 1
	else return
	e.preventDefault()
	emit("update:modelValue", clampAngle(next))
}

onUnmounted(() => {
	stopDrag()
	stopTouch()
})
</script>

<style scoped>
.shadow-direction-row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.shadow-direction-dial {
	width: 6.5rem;
	height: 6.5rem;
	flex-shrink: 0;
	cursor: pointer;
	border-radius: 9999px;
	outline: none;
}

.shadow-direction-dial:focus-visible {
	box-shadow: 0 0 0 2px var(--nce-color-focus, #3b82f6);
}

.shadow-direction-svg {
	width: 100%;
	height: 100%;
	display: block;
}

.shadow-direction-ring {
	fill: var(--nce-color-bg, #fff);
	stroke: var(--nce-color-border, #e5e7eb);
	stroke-width: 1.5;
}

.shadow-direction-spoke {
	stroke: var(--nce-color-muted, #9ca3af);
	stroke-width: 1.5;
}

.shadow-direction-handle {
	fill: var(--nce-color-primary, #3b82f6);
	stroke: #fff;
	stroke-width: 1.5;
}

.shadow-direction-label {
	fill: var(--nce-color-muted, #9ca3af);
	font-size: 7px;
	text-anchor: middle;
}

.shadow-direction-hint {
	margin: 0;
	line-height: 1.35;
	max-width: 9rem;
}
</style>
