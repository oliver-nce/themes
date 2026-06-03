import json
import math

BORDER_RADIUS_MAP = {
	"none": "0",
	"sm": "0.125rem",
	"md": "0.375rem",
	"lg": "0.5rem",
	"full": "9999px",
}

SPACING_SCALE_MAP = {
	"tight": "0.75rem",
	"normal": "1rem",
	"relaxed": "1.5rem",
}

LINE_HEIGHT_MAP = {
	"tight": "1.25",
	"snug": "1.375",
	"normal": "1.5",
	"relaxed": "1.625",
	"loose": "2",
}

SHADOW_DEFS = {
	"none": [],
	"sm": [(0, 1, 3, 0, 0.12), (0, 1, 2, -1, 0.08)],
	"md": [(0, 4, 8, -1, 0.15), (0, 2, 4, -2, 0.1)],
	"lg": [(0, 10, 20, -3, 0.18), (0, 4, 8, -4, 0.1)],
	"xl": [(0, 20, 30, -5, 0.22), (0, 8, 12, -6, 0.12)],
	"2xl": [(0, 25, 50, -12, 0.3)],
	"3xl": [(0, 35, 60, -15, 0.35)],
}


def _hex_to_rgb(hex_color):
	hex_color = hex_color.lstrip("#")
	return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def _hex_to_hsl(hex_color):
	"""Convert hex to HSL (h: 0-360, s: 0-100, l: 0-100)."""
	hex_color = hex_color.lstrip("#")
	r = int(hex_color[0:2], 16) / 255
	g = int(hex_color[2:4], 16) / 255
	b = int(hex_color[4:6], 16) / 255
	mx, mn = max(r, g, b), min(r, g, b)
	h = 0.0
	s = 0.0
	l = (mx + mn) / 2
	if mx != mn:
		d = mx - mn
		s = d / (2 - mx - mn) if l > 0.5 else d / (mx + mn)
		if mx == r:
			h = ((g - b) / d + (6 if g < b else 0)) / 6
		elif mx == g:
			h = ((b - r) / d + 2) / 6
		else:
			h = ((r - g) / d + 4) / 6
	return h * 360, s * 100, l * 100


def _hsl_to_hex(h, s, l):
	"""Convert HSL (h: 0-360, s: 0-100, l: 0-100) to hex string."""
	s /= 100
	l /= 100
	a = s * min(l, 1 - l)

	def f(n):
		k = (n + h / 30) % 12
		color = l - a * max(min(k - 3, 9 - k, 1), -1)
		return round(255 * max(0, min(1, color)))

	return f"#{f(0):02x}{f(8):02x}{f(4):02x}"


def _srgb_to_linear(c):
	return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _linear_to_srgb(c):
	return 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def _hex_to_oklch(hex_color):
	"""Convert hex to OKLCH (L, C, h). Matches frontend color-shades.ts."""
	hex_color = hex_color.lstrip("#")
	r = _srgb_to_linear(int(hex_color[0:2], 16) / 255)
	g = _srgb_to_linear(int(hex_color[2:4], 16) / 255)
	b = _srgb_to_linear(int(hex_color[4:6], 16) / 255)

	l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
	m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
	s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

	l_ = math.cbrt(l)
	m_ = math.cbrt(m)
	s_ = math.cbrt(s)

	L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
	a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
	b_val = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

	C = math.sqrt(a * a + b_val * b_val)
	h = (math.degrees(math.atan2(b_val, a)) + 360) % 360
	return L, C, h


def _oklch_to_hex(L, C, h):
	"""Convert OKLCH (L, C, h) to hex. Matches frontend color-shades.ts."""
	h_rad = math.radians(h)
	a = C * math.cos(h_rad)
	b_val = C * math.sin(h_rad)

	l_ = L + 0.3963377774 * a + 0.2158037573 * b_val
	m_ = L - 0.1055613458 * a - 0.0638541728 * b_val
	s_ = L - 0.0894841775 * a - 1.291485548 * b_val

	l = l_**3
	m = m_**3
	s = s_**3

	r_lin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
	g_lin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
	b_lin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

	def clamp_byte(v):
		return round(255 * max(0, min(1, _linear_to_srgb(max(0, min(1, v))))))

	return f"#{clamp_byte(r_lin):02x}{clamp_byte(g_lin):02x}{clamp_byte(b_lin):02x}"


def _max_chroma_in_gamut(L, h, upper):
	"""Largest chroma at (L, h) inside sRGB. Matches frontend color-shades.ts."""
	h_rad = math.radians(h)
	cos_h = math.cos(h_rad)
	sin_h = math.sin(h_rad)
	lo = 0.0
	hi = upper
	for _ in range(24):
		mid = (lo + hi) / 2
		a = mid * cos_h
		b_val = mid * sin_h
		l_ = L + 0.3963377774 * a + 0.2158037573 * b_val
		m_ = L - 0.1055613458 * a - 0.0638541728 * b_val
		s_ = L - 0.0894841775 * a - 1.291485548 * b_val
		l = l_**3
		m = m_**3
		s = s_**3
		r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
		g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
		b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
		eps = 1e-6
		if r < -eps or r > 1 + eps or g < -eps or g > 1 + eps or b < -eps or b > 1 + eps:
			hi = mid
		else:
			lo = mid
	return lo


# Tailwind-style shade targets — same as color-shades.ts
_SHADE_TARGETS = [
	(50, 0.97),
	(100, 0.93),
	(200, 0.87),
	(300, 0.78),
	(400, 0.68),
	(500, 0.57),
	(600, 0.48),
	(700, 0.39),
	(800, 0.31),
	(900, 0.23),
	(950, 0.16),
]


def _generate_shades(base_hex):
	"""Generate 11-stop shade scale (50–950) from a base hex colour.

	Uses OKLCH for perceptually uniform lightness steps.
	Keeps the base colour's hue constant, uses its chroma as the
	maximum, and gently desaturates at the light/dark extremes
	where sRGB gamut narrows and full chroma looks artificial.
	"""
	if not base_hex or len(base_hex) < 7:
		return []
	_L, base_C, h = _hex_to_oklch(base_hex)
	result = []
	for shade, target_l in _SHADE_TARGETS:
		# Cap to sRGB gamut at this lightness
		max_c = _max_chroma_in_gamut(target_l, h, base_C * 1.5)
		use_c = min(base_C, max_c)
		# Desaturate at extremes for subtle tints / deep shades
		if target_l >= 0.90:
			t = (target_l - 0.90) / 0.07  # 0→1 from L=0.90 to L=0.97
			use_c *= max(0.15, 1.0 - t * 0.85)
		elif target_l <= 0.25:
			t = (0.25 - target_l) / 0.09  # 0→1 from L=0.25 to L=0.16
			use_c *= max(0.5, 1.0 - t * 0.5)
		use_c = min(use_c, max_c)
		result.append((shade, _oklch_to_hex(target_l, use_c, h)))
	return result


def _build_shadow(level, color_hex):
	defs = SHADOW_DEFS.get(level, SHADOW_DEFS["md"])
	if not defs:
		return "none"
	r, g, b = _hex_to_rgb(color_hex) if color_hex else (0, 0, 0)
	parts = []
	for x, y, blur, spread, opacity in defs:
		parts.append(f"{x}px {y}px {blur}px {spread}px rgba({r}, {g}, {b}, {opacity})")
	return ", ".join(parts)


TRANSITION_MAP = {
	"fast": "150ms",
	"normal": "200ms",
	"slow": "300ms",
}
