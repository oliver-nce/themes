export interface ColorShade {
  shade: number;
  hex: string;
}

export interface OklchColorParams {
  hue: number;
  /** -100…100 lightness curve (0 = baseline OKLCH scale) */
  gamma: number;
  /** 0…200, 100 = max in-gamut chroma at 600 */
  saturation: number;
}

export const OKLCH_L_600 = 0.48;

// ── sRGB ↔ linear sRGB ─────────────────────────────────────────────────────

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

// ── Hex ↔ OKLCH ─────────────────────────────────────────────────────────────

export function hexToOklch(hex: string): { L: number; C: number; h: number } {
  const r = srgbToLinear(parseInt(hex.slice(1, 3), 16) / 255);
  const g = srgbToLinear(parseInt(hex.slice(3, 5), 16) / 255);
  const b = srgbToLinear(parseInt(hex.slice(5, 7), 16) / 255);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(a * a + bVal * bVal);
  const h = ((Math.atan2(bVal, a) * 180) / Math.PI + 360) % 360;
  return { L, C, h };
}

export function oklchToHex(L: number, C: number, h: number): string {
  const hRad = (h * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const bVal = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * bVal;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bVal;
  const s_ = L - 0.0894841775 * a - 1.291485548 * bVal;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const clampByte = (v: number) =>
    Math.round(
      255 * Math.max(0, Math.min(1, linearToSrgb(Math.max(0, Math.min(1, v))))),
    );

  const rr = clampByte(rLin);
  const gg = clampByte(gLin);
  const bb = clampByte(bLin);
  return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`.toUpperCase();
}

// ── Gamut mapping ───────────────────────────────────────────────────────────

function maxChromaInGamut(L: number, h: number, upper: number): number {
  const hRad = (h * Math.PI) / 180;
  const cosH = Math.cos(hRad);
  const sinH = Math.sin(hRad);
  let lo = 0;
  let hi = upper;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const a = mid * cosH;
    const bVal = mid * sinH;
    const l_ = L + 0.3963377774 * a + 0.2158037573 * bVal;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * bVal;
    const s_ = L - 0.0894841775 * a - 1.291485548 * bVal;
    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;
    const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
    const eps = 1e-6;
    if (
      r < -eps ||
      r > 1 + eps ||
      g < -eps ||
      g > 1 + eps ||
      b < -eps ||
      b > 1 + eps
    ) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return lo;
}

/** Max in-gamut chroma at the 600 lightness stop for a hue at 100% saturation. */
export function baseChromaAt600(hue: number): number {
  return maxChromaInGamut(OKLCH_L_600, hue, 0.37);
}

// ── Shade generation ────────────────────────────────────────────────────────

const SHADE_TARGETS: Array<{ shade: number; l: number }> = [
  { shade: 50, l: 0.97 },
  { shade: 100, l: 0.93 },
  { shade: 200, l: 0.87 },
  { shade: 300, l: 0.78 },
  { shade: 400, l: 0.68 },
  { shade: 500, l: 0.57 },
  { shade: 600, l: OKLCH_L_600 },
  { shade: 700, l: 0.39 },
  { shade: 800, l: 0.31 },
  { shade: 900, l: 0.23 },
  { shade: 950, l: 0.16 },
];

const L100 = 0.93;
const L950 = 0.16;

/**
 * Power-curve lightness scale between pinned stops 100 and 950.
 * gamma=0 → original OKLCH targets; +gamma lightens mids; −gamma darkens mids.
 */
function lightnessWithGamma(shade: number, baseL: number, gamma: number): number {
  if (gamma === 0) return baseL;
  if (shade <= 100 || shade >= 950) return baseL;

  const t = (shade - 100) / (950 - 100);
  const mix = Math.abs(gamma) / 100;
  const exp = Math.pow(2, -gamma / 40);
  const curved = L100 + Math.pow(t, exp) * (L950 - L100);
  const blended = baseL * (1 - mix) + curved * mix;
  return Math.max(0.06, Math.min(0.985, blended));
}

function extremeChromaScale(targetL: number, useC: number): number {
  if (targetL >= 0.9) {
    const t = (targetL - 0.9) / 0.07;
    return useC * Math.max(0.15, 1.0 - t * 0.85);
  }
  if (targetL <= 0.25) {
    const t = (0.25 - targetL) / 0.09;
    return useC * Math.max(0.5, 1.0 - t * 0.5);
  }
  return useC;
}

export function defaultOklchParams(hue = 250): OklchColorParams {
  return { hue, gamma: 0, saturation: 100 };
}

/** Parse pasted hex with or without leading #. Returns #RRGGBB or null. */
export function parseHexInput(raw: string): string | null {
  const cleaned = raw.trim().replace(/^#/, "");
  if (!/^[0-9A-Fa-f]{6}$/.test(cleaned)) return null;
  return `#${cleaned.toUpperCase()}`;
}

function withPinned600(shades: ColorShade[], base600Hex?: string): ColorShade[] {
  if (!base600Hex || !/^#[0-9A-Fa-f]{6}$/.test(base600Hex)) return shades;
  const hex = base600Hex.toUpperCase();
  return shades.map((s) => (s.shade === 600 ? { shade: 600, hex } : s));
}

/** Build params from a saved 600 hex (legacy themes may omit gamma/sat). */
export function paramsFromHex(
  hex: string,
  gamma = 0,
  saturation?: number,
): OklchColorParams {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return defaultOklchParams();
  }
  const { C, h } = hexToOklch(hex);
  const baseC = baseChromaAt600(h);
  const sat =
    saturation ??
    Math.round(Math.min(200, Math.max(0, baseC > 0 ? (C / baseC) * 100 : 100)));
  return { hue: h, gamma, saturation: sat };
}

export function generateShadesFromParams(
  params: OklchColorParams,
  options?: { base600Hex?: string },
): ColorShade[] {
  const { hue, gamma, saturation } = params;
  const baseC = baseChromaAt600(hue) * (saturation / 100);

  const shades = SHADE_TARGETS.map(({ shade, l: baseL }) => {
    const targetL = lightnessWithGamma(shade, baseL, gamma);
    const maxC = maxChromaInGamut(targetL, hue, baseC * 1.5);
    let useC = Math.min(baseC, maxC);
    useC = extremeChromaScale(targetL, useC);
    useC = Math.min(useC, maxC);

    return {
      shade,
      hex: oklchToHex(targetL, useC, hue),
    };
  });
  return withPinned600(shades, options?.base600Hex);
}

export function color600FromParams(params: OklchColorParams): string {
  return (
    generateShadesFromParams(params).find((s) => s.shade === 600)?.hex ??
    "#3B82F6"
  );
}

/** 600-stop hex after gamma/sat — matches Python _effective_role_hex / publish emit. */
export function effectiveRoleHex(
  hex: string,
  gamma = 0,
  saturation = 100,
): string {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex;
  if (gamma === 0 && saturation === 100) return hex.toUpperCase();
  return color600FromParams(paramsFromHex(hex, gamma, saturation));
}

/**
 * Generate an 11-stop shade scale (50–950) from a single base color.
 * Without gamma/sat options, derives chroma from the base hex (legacy behaviour).
 */
export function generateShades(
  baseHex: string,
  options?: { gamma?: number; saturation?: number },
): ColorShade[] {
  if (!baseHex || !/^#[0-9A-Fa-f]{6}$/.test(baseHex)) return [];

  const gamma = options?.gamma ?? 0;
  const saturation = options?.saturation ?? 100;

  if (gamma !== 0 || saturation !== 100) {
    const params = paramsFromHex(baseHex, gamma, saturation);
    return generateShadesFromParams(params);
  }

  const { C: baseC, h } = hexToOklch(baseHex);

  const shades = SHADE_TARGETS.map(({ shade, l: targetL }) => {
    const maxC = maxChromaInGamut(targetL, h, baseC * 1.5);
    let useC = Math.min(baseC, maxC);
    useC = extremeChromaScale(targetL, useC);
    useC = Math.min(useC, maxC);

    return {
      shade,
      hex: oklchToHex(targetL, useC, h),
    };
  });
  return withPinned600(shades, baseHex);
}

export function isDark(hex: string): boolean {
  if (!hex || hex.length < 7) return false;
  const { L } = hexToOklch(hex);
  return L < 0.55;
}

export function pickFgMono(hex: string): string {
  if (!hex || hex.length < 7) return "#FFFFFF";
  const { L } = hexToOklch(hex);
  return L > 0.62 ? "#0A0A0A" : "#FFFFFF";
}

export function pickFgTonal(hex: string): string {
  if (!hex || hex.length < 7) return "#FFFFFF";
  const { L, C, h } = hexToOklch(hex);
  const targetL = Math.max(0.05, Math.min(0.95, 1 - L));
  const targetC = C * 0.35;
  return oklchToHex(targetL, targetC, h);
}

// ── Neutral (greyscale) shade generation ────────────────────────────────────

export const NEUTRAL_SHADE_TARGETS: Array<{ shade: number; l: number }> = [
  { shade: 50, l: 0.958 }, { shade: 100, l: 0.885 }, { shade: 200, l: 0.820 },
  { shade: 300, l: 0.755 }, { shade: 400, l: 0.705 }, { shade: 500, l: 0.690 },
  { shade: 600, l: 0.680 }, { shade: 700, l: 0.565 }, { shade: 800, l: 0.440 },
  { shade: 900, l: 0.280 }, { shade: 950, l: 0.050 },
];

export const NEUTRAL_MAX_CHROMA = 0.025;
export const NEUTRAL_WARM_HUE = 60;
export const NEUTRAL_COOL_HUE = 250;

/** Generate neutral 11-stop scale from warmth alone — no base hex. */
export function generateNeutralShades(warmth = 0): ColorShade[] {
  if (warmth === 0) {
    return NEUTRAL_SHADE_TARGETS.map(({ shade, l }) => ({
      shade,
      hex: oklchToHex(l, 0, 0),
    }));
  }
  const hue = warmth >= 0 ? NEUTRAL_WARM_HUE : NEUTRAL_COOL_HUE;
  const baseC = (Math.abs(warmth) / 100) * NEUTRAL_MAX_CHROMA;
  return NEUTRAL_SHADE_TARGETS.map(({ shade, l: targetL }) => {
    const maxC = maxChromaInGamut(targetL, hue, baseC * 1.5);
    let useC = Math.min(baseC, maxC);
    useC = extremeChromaScale(targetL, useC);
    useC = Math.min(useC, maxC);
    return { shade, hex: oklchToHex(targetL, useC, hue) };
  });
}

/** 600-stop hex for a given warmth. */
export function neutral600Hex(warmth = 0): string {
  return generateNeutralShades(warmth).find((s) => s.shade === 600)?.hex ?? "#989898";
}

/** Persist warmth as resolved neutral tokens for the publish pipeline. */
export function resolveNeutralIntoPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const warmth = Number(payload.neutral_color_warmth ?? 0);
  const shades = generateNeutralShades(warmth);
  const shadeMap: Record<string, string> = {};
  for (const { shade, hex } of shades) {
    shadeMap[String(shade)] = hex.toUpperCase();
  }
  payload.neutral_color_shades = shadeMap;
  payload.neutral_color = (shades.find((s) => s.shade === 600)?.hex ?? "#989898").toUpperCase();
  payload.neutral_color_warmth = warmth;
  return payload;
}
