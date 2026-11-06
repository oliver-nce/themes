// Copyright (c) 2026 Oliver Reid. All rights reserved. Copying prohibited — see README.

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return { h: 0, s: 0, v: 0 };
  }

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  const v = max;
  const s = max === 0 ? 0 : d / max;

  if (max === min) {
    return { h: 0, s, v };
  }

  let h = 0;
  if (max === r) {
    h = 60 * (((g - b) / d) % 6);
  } else if (max === g) {
    h = 60 * (2 + (b - r) / d);
  } else {
    h = 60 * (4 + (r - g) / d);
  }

  if (h < 0) {
    h += 360;
  }

  return { h, s, v };
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return { h: 0, s: 0, l: 0 };
  }

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  const l = (max + min) / 2;
  const s = max === min ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (max === min) {
    return { h: 0, s, l };
  }

  let h = 0;
  if (max === r) {
    h = 60 * (((g - b) / d) % 6);
  } else if (max === g) {
    h = 60 * (2 + (b - r) / d);
  } else {
    h = 60 * (4 + (r - g) / d);
  }

  if (h < 0) {
    h += 360;
  }

  return { h, s, l };
}

export function hsvToHex(h: number, s: number, v: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(1, s));
  const val = Math.max(0, Math.min(1, v));

  const c = val * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = val - c;

  let r = 0;
  let g = 0;
  let b = 0;
  const sector = Math.floor(hue / 60) % 6;

  switch (sector) {
    case 0:
      r = c;
      g = x;
      break;
    case 1:
      r = x;
      g = c;
      break;
    case 2:
      g = c;
      b = x;
      break;
    case 3:
      g = x;
      b = c;
      break;
    case 4:
      r = x;
      b = c;
      break;
    case 5:
      r = c;
      b = x;
      break;
  }

  const clampByte = (n: number) =>
    Math.round(Math.max(0, Math.min(255, (n + m) * 255)));

  const rr = clampByte(r);
  const gg = clampByte(g);
  const bb = clampByte(b);

  return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`.toUpperCase();
}

export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(1, s));
  const light = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;
  const sector = Math.floor(hue / 60) % 6;

  switch (sector) {
    case 0:
      r = c;
      g = x;
      break;
    case 1:
      r = x;
      g = c;
      break;
    case 2:
      g = c;
      b = x;
      break;
    case 3:
      g = x;
      b = c;
      break;
    case 4:
      r = x;
      b = c;
      break;
    case 5:
      r = c;
      b = x;
      break;
  }

  const clampByte = (n: number) =>
    Math.round(Math.max(0, Math.min(255, (n + m) * 255)));

  const rr = clampByte(r);
  const gg = clampByte(g);
  const bb = clampByte(b);

  return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`.toUpperCase();
}
