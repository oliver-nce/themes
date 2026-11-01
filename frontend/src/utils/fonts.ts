import { FONT_REGISTRY } from "@/domain/theme-tokens"

export const SYSTEM_FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

/** CSS font-family for a named font, or "" for an empty name or "System Default". */
export function namedFontStack(name: string): string {
	if (!name || name === "System Default") return ""
	return `'${name}', ${FONT_REGISTRY[name]?.[1] || "sans-serif"}`
}

/** CSS font-family for a named font, falling back to the system stack. */
export function fontStack(name: string): string {
	return namedFontStack(name) || SYSTEM_FONT_STACK
}
