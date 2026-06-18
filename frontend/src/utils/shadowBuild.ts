// Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.
import { SHADOW_DEFS, type ShadowLayer } from "@/domain/theme-tokens"

/** Normalize hex for rgba() — accepts #RRGGBB or RRGGBB. */
function shadowColorToRgb(hex: string): string {
	const raw = (hex || "").trim().replace(/^#/, "")
	if (raw.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(raw)) return "0,0,0"
	const r = parseInt(raw.slice(0, 2), 16)
	const g = parseInt(raw.slice(2, 4), 16)
	const b = parseInt(raw.slice(4, 6), 16)
	return `${r},${g},${b}`
}

/** Rotate preset offset so directionDeg 180° = straight down (CSS +y). */
export function rotateShadowOffset(x: number, y: number, directionDeg: number): [number, number] {
	const mag = Math.hypot(x, y)
	if (mag === 0) return [0, 0]
	const targetRad = ((directionDeg - 90) * Math.PI) / 180
	return [
		Math.round(mag * Math.cos(targetRad) * 10000) / 10000,
		Math.round(mag * Math.sin(targetRad) * 10000) / 10000,
	]
}

function fmtShadowPx(value: number): string {
	const rounded = Math.round(value * 10000) / 10000
	return Number.isInteger(rounded) ? `${rounded}px` : `${rounded}px`
}

/** Build --nce-shadow (mirrors themes/utils/theme_color_utils._build_shadow). */
export function buildThemeShadow(
	level: string,
	colorHex: string,
	opacityPct: number,
	directionDeg: number,
): string {
	const defs: ShadowLayer[] = SHADOW_DEFS[level] ?? SHADOW_DEFS.md
	if (!defs.length) return "none"
	const rgb = shadowColorToRgb(colorHex || "#000000")
	const alpha =
		Math.round((Math.max(0, Math.min(100, Number(opacityPct) || 0)) / 100) * 10000) / 10000
	const dir = Number.isFinite(directionDeg) ? directionDeg : 180
	return defs
		.map(([x, y, blur, spread]) => {
			const [ox, oy] = rotateShadowOffset(x, y, dir)
			return `${fmtShadowPx(ox)} ${fmtShadowPx(oy)} ${blur}px ${spread}px rgba(${rgb},${alpha})`
		})
		.join(", ")
}

/** Compass dial: pointer angle from center (screen coords) → 0–360° (180 = down). */
export function angleFromPointer(clientX: number, clientY: number, cx: number, cy: number): number {
	const dx = clientX - cx
	const dy = clientY - cy
	let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
	if (deg < 0) deg += 360
	if (deg >= 360) deg -= 360
	return Math.round(deg)
}

/** Handle position on dial SVG (180° = bottom). */
export function dialHandlePosition(
	deg: number,
	cx: number,
	cy: number,
	radius: number,
): { x: number; y: number } {
	const rad = ((deg - 90) * Math.PI) / 180
	return {
		x: cx + radius * Math.cos(rad),
		y: cy + radius * Math.sin(rad),
	}
}
