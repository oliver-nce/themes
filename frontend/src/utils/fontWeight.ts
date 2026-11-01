export const BODY_WEIGHT_MIN = 100
export const BODY_WEIGHT_MAX = 900

export function clampBodyWeight(raw: unknown): number {
	const n = Number.parseInt(String(raw ?? "400"), 10)
	if (!Number.isFinite(n)) return 400
	return Math.min(BODY_WEIGHT_MAX, Math.max(BODY_WEIGHT_MIN, n))
}

export function weightDisplayLabel(n: number): string {
	if (n <= 350) return `${n} — Light`
	if (n <= 450) return `${n} — Regular`
	if (n <= 550) return `${n} — Medium`
	if (n <= 650) return `${n} — Semi-bold`
	return `${n} — Bold`
}
