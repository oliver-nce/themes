import { describe, expect, it } from "vitest";
import { hexToHsl, hexToHsv, hslToHex, hsvToHex } from "../hsv-color";

describe("hsv-color", () => {
  it("hexToHsv #FF0000 is pure red", () => {
    const { h, s, v } = hexToHsv("#FF0000");
    expect(h).toBeCloseTo(0, 0);
    expect(s).toBe(1);
    expect(v).toBe(1);
  });

  it("hexToHsv #00FF00 is pure green", () => {
    const { h, s, v } = hexToHsv("#00FF00");
    expect(h).toBeCloseTo(120, 0);
    expect(s).toBe(1);
    expect(v).toBe(1);
  });

  it("hexToHsv #0000FF is pure blue", () => {
    const { h, s, v } = hexToHsv("#0000FF");
    expect(h).toBeCloseTo(240, 0);
    expect(s).toBe(1);
    expect(v).toBe(1);
  });

  it("hexToHsv #FFFFFF has zero saturation and full value", () => {
    const { s, v } = hexToHsv("#FFFFFF");
    expect(s).toBe(0);
    expect(v).toBe(1);
  });

  it("hexToHsv #000000 has zero value", () => {
    const { v } = hexToHsv("#000000");
    expect(v).toBe(0);
  });

  it("hsvToHex round-trips #D7E4FA", () => {
    const { h, s, v } = hexToHsv("#D7E4FA");
    expect(hsvToHex(h, s, v)).toBe("#D7E4FA");
  });

  it("hsvToHex(30, 1, 1) is uppercase six-digit hex", () => {
    expect(hsvToHex(30, 1, 1)).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("hexToHsl #FF0000 is pure red", () => {
    const { h, s, l } = hexToHsl("#FF0000");
    expect(h).toBeCloseTo(0, 0);
    expect(s).toBe(1);
    expect(l).toBe(0.5);
  });

  it("hexToHsl #00FF00 is pure green", () => {
    const { h, s, l } = hexToHsl("#00FF00");
    expect(h).toBeCloseTo(120, 0);
    expect(s).toBe(1);
    expect(l).toBe(0.5);
  });

  it("hexToHsl #0000FF is pure blue", () => {
    const { h, s, l } = hexToHsl("#0000FF");
    expect(h).toBeCloseTo(240, 0);
    expect(s).toBe(1);
    expect(l).toBe(0.5);
  });

  it("hexToHsl #FFFFFF has zero saturation and full lightness", () => {
    const { s, l } = hexToHsl("#FFFFFF");
    expect(s).toBe(0);
    expect(l).toBe(1);
  });

  it("hexToHsl #000000 has zero lightness", () => {
    const { l } = hexToHsl("#000000");
    expect(l).toBe(0);
  });

  it("hslToHex round-trips #D7E4FA", () => {
    const { h, s, l } = hexToHsl("#D7E4FA");
    expect(hslToHex(h, s, l)).toBe("#D7E4FA");
  });

  it("hslToHex round-trips #8B5CF6", () => {
    const { h, s, l } = hexToHsl("#8B5CF6");
    expect(hslToHex(h, s, l)).toBe("#8B5CF6");
  });

  it("hslToHex(0, 1, 0) is #000000", () => {
    expect(hslToHex(0, 1, 0)).toBe("#000000");
  });

  it("hslToHex(200, 0.4, 1) is #FFFFFF", () => {
    expect(hslToHex(200, 0.4, 1)).toBe("#FFFFFF");
  });
});
