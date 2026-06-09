import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  effectiveRoleHex,
  generateNeutralShades,
  generateShades,
  pickFgMono,
  pickFgTonal,
} from "../color-shades";

const __dirname = dirname(fileURLToPath(import.meta.url));
const goldenPath = join(
  __dirname,
  "../../../../themes/tests/golden/color_math_parity.json",
);
const golden = JSON.parse(readFileSync(goldenPath, "utf-8")) as {
  hex_inputs: string[];
  generate_shades: Record<string, Record<string, string>>;
  neutral_shades: Record<string, Record<string, string>>;
  effective_role_hex: Record<
    string,
    { default: string; gamma20_sat120: string }
  >;
  pick_fg_mono: Record<string, string>;
  pick_fg_tonal: Record<string, string>;
};

/** Python golden uses lowercase; TS oklchToHex returns uppercase. */
function normHex(hex: string): string {
  return hex.toUpperCase();
}

function normShadeMap(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(map).map(([shade, hex]) => [shade, normHex(hex)]),
  );
}

describe("color-shades parity vs Python golden", () => {
  for (const hex of golden.hex_inputs) {
    it(`generateShades(${hex})`, () => {
      const shades = Object.fromEntries(
        generateShades(hex).map(({ shade, hex: h }) => [String(shade), h]),
      );
      expect(shades).toEqual(normShadeMap(golden.generate_shades[hex]));
    });

    it(`pickFgMono(${hex})`, () => {
      expect(pickFgMono(hex)).toBe(golden.pick_fg_mono[hex]);
    });

    it(`pickFgTonal(${hex})`, () => {
      expect(normHex(pickFgTonal(hex))).toBe(
        normHex(golden.pick_fg_tonal[hex]),
      );
    });

    it(`effectiveRoleHex(${hex})`, () => {
      expect(effectiveRoleHex(hex)).toBe(
        golden.effective_role_hex[hex].default,
      );
      expect(effectiveRoleHex(hex, 20, 120)).toBe(
        golden.effective_role_hex[hex].gamma20_sat120,
      );
    });
  }

  for (const warmth of Object.keys(golden.neutral_shades)) {
    it(`generateNeutralShades(${warmth})`, () => {
      const shades = Object.fromEntries(
        generateNeutralShades(Number(warmth)).map(({ shade, hex }) => [
          String(shade),
          hex,
        ]),
      );
      expect(shades).toEqual(normShadeMap(golden.neutral_shades[warmth]));
    });
  }
});
