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

const L_LIGHT_END = 0.97;
const L_DARK_END = 0.16;

const SHADE_L_STD = Object.fromEntries(
  SHADE_TARGETS.map(({ shade, l }) => [shade, l]),
) as Record<number, number>;

function clampLightness(l: number): number {
  return Math.max(0.06, Math.min(0.985, l));
}

function chromaAtLightness(targetL: number, baseC: number, h: number): number {
  const maxC = maxChromaInGamut(targetL, h, baseC * 1.5);
  let useC = Math.min(baseC, maxC);
  useC = extremeChromaScale(targetL, useC);
  return Math.min(useC, maxC);
}

/**
 * Brand-palette scale: pin the exact hex at 600 and derive lighter/darker stops
 * from its actual OKLCH lightness so adjacent shades never cliff.
 */
export function generateAnchoredShades(base600Hex: string): ColorShade[] {
  if (!base600Hex || !/^#[0-9A-Fa-f]{6}$/.test(base600Hex)) return [];

  const hex600 = base600Hex.toUpperCase();
  const { L: l600, C: baseC, h } = hexToOklch(hex600);
  const lightSpan = L_LIGHT_END - OKLCH_L_600;
  const darkSpan = OKLCH_L_600 - L_DARK_END;

  return SHADE_TARGETS.map(({ shade }) => {
    if (shade === 600) {
      return { shade: 600, hex: hex600 };
    }

    let targetL: number;
    const lStd = SHADE_L_STD[shade];
    if (shade < 600) {
      const frac =
        lightSpan > 0
          ? Math.max(0, Math.min(1, (lStd - OKLCH_L_600) / lightSpan))
          : 0;
      targetL = l600 + frac * (L_LIGHT_END - l600);
    } else {
      const frac =
        darkSpan > 0
          ? Math.max(0, Math.min(1, (OKLCH_L_600 - lStd) / darkSpan))
          : 0;
      targetL = l600 - frac * (l600 - L_DARK_END);
    }

    targetL = clampLightness(targetL);
    const useC = chromaAtLightness(targetL, baseC, h);
    return { shade, hex: oklchToHex(targetL, useC, h) };
  });
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
  if (options?.base600Hex) {
    return generateAnchoredShades(options.base600Hex);
  }

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
  return shades;
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

  return generateAnchoredShades(baseHex);
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

/** Cross-brand tonal: opposite brand hue/chroma, lightness flipped per background shade. */
export function pickFgTonalCrossBrand(bgHex: string, brandHex: string): string {
  if (!bgHex || bgHex.length < 7) return pickFgTonal(brandHex || bgHex);
  if (!brandHex || brandHex.length < 7) return pickFgTonal(bgHex);
  const { L: bgL } = hexToOklch(bgHex);
  const { C, h } = hexToOklch(brandHex);
  const targetL = Math.max(0.05, Math.min(0.95, 1 - bgL));
  const targetC = C * 0.35;
  return oklchToHex(targetL, targetC, h);
}

/** Three-pole text stops pulled from the opposite brand ramp (tonal) or fixed mono values. */
export const FG_POLE_SHADES = [200, 500, 900] as const;
export const DEFAULT_FG_FLIP_1 = 300;
export const DEFAULT_FG_FLIP_2 = 600;
export const MONO_POLE_200 = "#0A0A0A";
export const MONO_POLE_500 = "#4B5563";
export const MONO_POLE_900 = "#FFFFFF";
export const FG_FLIP_AUTO_THRESHOLD = 0.62;

export type FgFlipMode = "mono" | "tonal";

export type FgFlipPair = readonly [number, number];

function shadeIndex(shades: readonly ColorShade[], shadeNum: number): number {
  return shades.findIndex((s) => s.shade === shadeNum);
}

export function computeAutoFgFlipPair(shades: readonly ColorShade[]): FgFlipPair {
  let flip1 = DEFAULT_FG_FLIP_1;
  let flip2 = DEFAULT_FG_FLIP_2;
  for (const s of shades) {
    const { L } = hexToOklch(s.hex);
    if (L <= 0.72 && flip1 === DEFAULT_FG_FLIP_1) flip1 = s.shade;
    if (L <= FG_FLIP_AUTO_THRESHOLD) {
      flip2 = s.shade;
      break;
    }
  }
  return normalizeFgFlipPair(flip1, flip2, shades);
}

export function normalizeFgFlipPair(
  flip1: number,
  flip2: number,
  shades: readonly ColorShade[],
): FgFlipPair {
  let a = shades.some((s) => s.shade === flip1) ? flip1 : DEFAULT_FG_FLIP_1;
  let b = shades.some((s) => s.shade === flip2) ? flip2 : DEFAULT_FG_FLIP_2;
  let i1 = shadeIndex(shades, a);
  let i2 = shadeIndex(shades, b);
  if (i1 < 0) {
    a = shades[0]?.shade ?? DEFAULT_FG_FLIP_1;
    i1 = 0;
  }
  if (i2 < 0) {
    b = shades[shades.length - 1]?.shade ?? DEFAULT_FG_FLIP_2;
    i2 = shades.length - 1;
  }
  if (i1 >= i2 && shades.length > 1) {
    i2 = Math.min(i1 + 1, shades.length - 1);
    b = shades[i2].shade;
  }
  return [a, b];
}

export function resolveFgFlipPair(
  flip1Override: number | null | undefined,
  flip2Override: number | null | undefined,
  shades: readonly ColorShade[],
): FgFlipPair {
  if (flip1Override == null && flip2Override == null) {
    return [DEFAULT_FG_FLIP_1, DEFAULT_FG_FLIP_2];
  }
  if (flip1Override == null || flip2Override == null) {
    const auto = computeAutoFgFlipPair(shades);
    return normalizeFgFlipPair(
      flip1Override ?? auto[0],
      flip2Override ?? auto[1],
      shades,
    );
  }
  return normalizeFgFlipPair(flip1Override, flip2Override, shades);
}

export function polesFromOppositeShades(shades: readonly ColorShade[]): [string, string, string] {
  const byShade = new Map(shades.map((s) => [s.shade, s.hex]));
  const pole200 = byShade.get(FG_POLE_SHADES[0]) ?? shades[0]?.hex ?? MONO_POLE_200;
  const pole500 = byShade.get(FG_POLE_SHADES[1]) ?? shades[Math.floor(shades.length / 2)]?.hex ?? MONO_POLE_500;
  const pole900 = byShade.get(FG_POLE_SHADES[2]) ?? shades[shades.length - 1]?.hex ?? MONO_POLE_900;
  return [pole200, pole500, pole900];
}

export function brandFgPolesTriple(
  mode: FgFlipMode,
  oppositeShades: readonly ColorShade[],
): [string, string, string] {
  if (mode === "mono") return [MONO_POLE_200, MONO_POLE_500, MONO_POLE_900];
  if (oppositeShades.length) return polesFromOppositeShades(oppositeShades);
  return [MONO_POLE_200, MONO_POLE_500, MONO_POLE_900];
}

export function fgColorForDualFlip(
  shadeNum: number,
  flip1: number,
  flip2: number,
  shades: readonly ColorShade[],
  pole200: string,
  pole500: string,
  pole900: string,
): string {
  const idx = shadeIndex(shades, shadeNum);
  const i1 = shadeIndex(shades, flip1);
  const i2 = shadeIndex(shades, flip2);
  if (idx < 0) return pole200;
  if (i1 < 0 || i2 < 0) return pole200;
  if (idx < i1) return pole200;
  if (idx < i2) return pole500;
  return pole900;
}

export function brandShadeForeground(
  shadeNum: number,
  shades: readonly ColorShade[],
  mode: FgFlipMode,
  flip1Override: number | null | undefined,
  flip2Override: number | null | undefined,
  oppositeShades: readonly ColorShade[],
): string {
  const [flip1, flip2] = resolveFgFlipPair(flip1Override, flip2Override, shades);
  const [pole200, pole500, pole900] = brandFgPolesTriple(mode, oppositeShades);
  return fgColorForDualFlip(shadeNum, flip1, flip2, shades, pole200, pole500, pole900);
}

/** @deprecated Use resolveFgFlipPair — kept for callers migrating from single-flip API. */
export function resolveFgFlipShade(
  flipOverride: number | null | undefined,
  shades: readonly ColorShade[],
): number {
  return resolveFgFlipPair(flipOverride, null, shades)[1];
}

/** True when bg and text OKLCH lightness are too close to read comfortably. */
export function isLowContrastFg(bgHex: string, fgHex: string): boolean {
  if (!bgHex || !fgHex) return false;
  const bgL = hexToOklch(bgHex).L;
  const fgL = hexToOklch(fgHex).L;
  return Math.abs(bgL - fgL) < 0.25;
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
