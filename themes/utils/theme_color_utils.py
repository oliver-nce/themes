import json
import math

from themes.utils.theme_tokens import SHADOW_DEFS


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


def pick_fg_mono(hex_color: str) -> str:
	"""Return '#0A0A0A' if hex_color is light enough for dark text, else '#FFFFFF'.
	Uses OKLCH lightness with threshold 0.62."""
	if not hex_color or len(hex_color) < 7:
		return "#FFFFFF"
	L, _, _ = _hex_to_oklch(hex_color)
	return "#0A0A0A" if L > 0.62 else "#FFFFFF"


def pick_fg_tonal(hex_color: str) -> str:
	"""Return a same-hue tonal foreground: lightness flipped, chroma reduced to 35%."""
	if not hex_color or len(hex_color) < 7:
		return "#FFFFFF"
	L, C, h = _hex_to_oklch(hex_color)
	target_L = max(0.05, min(0.95, 1.0 - L))
	target_C = C * 0.35
	return _oklch_to_hex(target_L, target_C, h)


def pick_fg_tonal_cross_brand(bg_hex: str, brand_hex: str) -> str:
	"""Cross-brand tonal: opposite brand hue/chroma, lightness flipped per background shade."""
	if not bg_hex or len(bg_hex) < 7:
		return pick_fg_tonal(brand_hex or bg_hex)
	if not brand_hex or len(brand_hex) < 7:
		return pick_fg_tonal(bg_hex)
	bg_L, _, _ = _hex_to_oklch(bg_hex)
	_, C, h = _hex_to_oklch(brand_hex)
	target_L = max(0.05, min(0.95, 1.0 - bg_L))
	target_C = C * 0.35
	return _oklch_to_hex(target_L, target_C, h)


FG_POLE_SHADES = (200, 500, 900)
DEFAULT_TONAL_POLE_DARK = 900
DEFAULT_TONAL_POLE_LIGHT = 200
MONO_POLE_200 = "#0A0A0A"
MONO_POLE_500 = "#4B5563"
MONO_POLE_900 = "#FFFFFF"
MONO_POLE_DARK = MONO_POLE_200
MONO_POLE_LIGHT = MONO_POLE_900
FG_FLIP_AUTO_THRESHOLD = 0.62
BRAND_COLOR_FIELDS = frozenset({"primary_color", "secondary_color"})
OPPOSITE_BRAND_FIELD = {
	"primary_color": "secondary_color",
	"secondary_color": "primary_color",
}


def compute_auto_fg_flip_shade(shades: list[tuple[int, str]]) -> int:
	for shade_num, shade_hex in shades:
		L, _, _ = _hex_to_oklch(shade_hex)
		if L <= FG_FLIP_AUTO_THRESHOLD:
			return shade_num
	return shades[-1][0] if shades else 950


def resolve_fg_flip_shade(flip_override, shades: list[tuple[int, str]]) -> int:
	if flip_override is not None:
		try:
			n = int(flip_override)
			if any(sn == n for sn, _ in shades):
				return n
		except (TypeError, ValueError):
			pass
	return compute_auto_fg_flip_shade(shades)


def _shade_index(shades: list[tuple[int, str]], shade_num: int) -> int:
	for i, (sn, _) in enumerate(shades):
		if sn == shade_num:
			return i
	return -1


def fg_color_for_flip_shade(
	shade_num: int,
	flip_shade: int,
	shades: list[tuple[int, str]],
	dark_pole: str,
	light_pole: str,
) -> str:
	flip_idx = _shade_index(shades, flip_shade)
	idx = _shade_index(shades, shade_num)
	if flip_idx < 0 or idx < 0:
		return dark_pole
	return light_pole if idx >= flip_idx else dark_pole


def resolve_tonal_pole_shade(pole_override, default_shade, shades: list[tuple[int, str]]) -> int:
	if pole_override is not None:
		try:
			n = int(pole_override)
			if any(sn == n for sn, _ in shades):
				return n
		except (TypeError, ValueError):
			pass
	shade_nums = [sn for sn, _ in shades]
	if default_shade in shade_nums:
		return default_shade
	return shades[-1][0] if shades else default_shade


def tonal_poles_from_opposite_shades(
	opposite_shades: list[tuple[int, str]],
	dark_shade: int,
	light_shade: int,
) -> tuple[str, str]:
	by_shade = dict(opposite_shades)
	dark = by_shade.get(dark_shade) or (
		opposite_shades[-1][1] if opposite_shades else MONO_POLE_DARK
	)
	light = by_shade.get(light_shade) or (
		opposite_shades[0][1] if opposite_shades else MONO_POLE_LIGHT
	)
	return dark, light


def brand_shade_foreground(
	shade_num: int,
	shades: list[tuple[int, str]],
	mode: str,
	flip1_override,
	flip2_override,
	opposite_shades: list[tuple[int, str]],
	tonal_pole_dark=None,
	tonal_pole_light=None,
) -> str:
	if mode == "mono":
		flip_override = flip1_override if flip1_override is not None else flip2_override
		flip = resolve_fg_flip_shade(flip_override, shades)
		return fg_color_for_flip_shade(
			shade_num, flip, shades, MONO_POLE_DARK, MONO_POLE_LIGHT,
		)
	flip_override = flip1_override if flip1_override is not None else flip2_override
	flip = resolve_fg_flip_shade(flip_override, shades)
	pole_shades = opposite_shades if opposite_shades else shades
	dark_shade = resolve_tonal_pole_shade(
		tonal_pole_dark, DEFAULT_TONAL_POLE_DARK, pole_shades,
	)
	light_shade = resolve_tonal_pole_shade(
		tonal_pole_light, DEFAULT_TONAL_POLE_LIGHT, pole_shades,
	)
	dark_pole, light_pole = tonal_poles_from_opposite_shades(
		opposite_shades, dark_shade, light_shade,
	)
	return fg_color_for_flip_shade(shade_num, flip, shades, dark_pole, light_pole)


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


_OKLCH_L_600 = 0.48
_L_LIGHT_END = 0.97
_L_DARK_END = 0.16
_SHADE_L_STD = dict(_SHADE_TARGETS)


def _clamp_lightness(l):
	return max(0.06, min(0.985, l))


def _chroma_at_lightness(target_l, base_c, h):
	max_c = _max_chroma_in_gamut(target_l, h, base_c * 1.5)
	use_c = min(base_c, max_c)
	use_c = _extreme_chroma_scale(target_l, use_c)
	return min(use_c, max_c)


def _generate_anchored_shades(base_hex):
	"""Brand-palette scale: exact hex at 600, smooth OKLCH ramp on both sides."""
	if not base_hex or len(base_hex) < 7:
		return []

	pinned = base_hex.upper()
	l600, base_c, h = _hex_to_oklch(pinned)
	light_span = _L_LIGHT_END - _OKLCH_L_600
	dark_span = _OKLCH_L_600 - _L_DARK_END
	result = []

	for shade, l_std in _SHADE_TARGETS:
		if shade == 600:
			result.append((600, pinned))
			continue
		if shade < 600:
			frac = max(0.0, min(1.0, (l_std - _OKLCH_L_600) / light_span)) if light_span > 0 else 0.0
			target_l = l600 + frac * (_L_LIGHT_END - l600)
		else:
			frac = max(0.0, min(1.0, (_OKLCH_L_600 - l_std) / dark_span)) if dark_span > 0 else 0.0
			target_l = l600 - frac * (l600 - _L_DARK_END)
		target_l = _clamp_lightness(target_l)
		use_c = _chroma_at_lightness(target_l, base_c, h)
		result.append((shade, _oklch_to_hex(target_l, use_c, h)))
	return result


def _base_chroma_at_600(hue):
	return _max_chroma_in_gamut(_OKLCH_L_600, hue, 0.37)


_L100 = 0.93
_L950 = 0.16


def _lightness_with_gamma(shade, base_l, gamma):
	"""Power-curve lightness between pinned 100 and 950 stops."""
	if not gamma:
		return base_l
	if shade <= 100 or shade >= 950:
		return base_l
	t = (shade - 100) / (950 - 100)
	mix = abs(gamma) / 100.0
	exp = 2 ** (-gamma / 40.0)
	curved = _L100 + (t**exp) * (_L950 - _L100)
	blended = base_l * (1 - mix) + curved * mix
	return max(0.06, min(0.985, blended))


def _extreme_chroma_scale(target_l, use_c):
	if target_l >= 0.90:
		t = (target_l - 0.90) / 0.07
		return use_c * max(0.15, 1.0 - t * 0.85)
	if target_l <= 0.25:
		t = (0.25 - target_l) / 0.09
		return use_c * max(0.5, 1.0 - t * 0.5)
	return use_c


_NEUTRAL_SHADE_TARGETS = [
	(50, 0.958), (100, 0.885), (200, 0.820), (300, 0.755),
	(400, 0.705), (500, 0.690), (600, 0.680), (700, 0.565),
	(800, 0.440), (900, 0.280), (950, 0.050),
]

NEUTRAL_MAX_CHROMA = 0.025
NEUTRAL_WARM_HUE = 60.0
NEUTRAL_COOL_HUE = 250.0


def generate_neutral_shades(warmth=0):
	"""Generate 11-stop neutral scale (50–950) from warmth only. No base hex."""
	warmth = float(warmth or 0)
	if warmth == 0:
		return [(shade, _oklch_to_hex(l, 0.0, 0.0)) for shade, l in _NEUTRAL_SHADE_TARGETS]
	hue = NEUTRAL_WARM_HUE if warmth >= 0 else NEUTRAL_COOL_HUE
	base_C = (abs(warmth) / 100.0) * NEUTRAL_MAX_CHROMA
	result = []
	for shade, target_l in _NEUTRAL_SHADE_TARGETS:
		max_c = _max_chroma_in_gamut(target_l, hue, base_C * 1.5)
		use_c = min(base_C, max_c)
		use_c = _extreme_chroma_scale(target_l, use_c)
		use_c = min(use_c, max_c)
		result.append((shade, _oklch_to_hex(target_l, use_c, hue)))
	return result


def neutral_600_hex(warmth=0):
	"""Return the hex at stop 600 for a given warmth."""
	shades = dict(generate_neutral_shades(warmth))
	return shades.get(600, "#989898")


def _generate_shades(base_hex, gamma=0, saturation=100, pin_600_to_base=True):
	"""Generate 11-stop shade scale (50–950) from a base hex colour."""
	if not base_hex or len(base_hex) < 7:
		return []

	gamma = float(gamma or 0)
	saturation = float(saturation if saturation is not None else 100)

	if pin_600_to_base and gamma == 0 and saturation == 100:
		return _generate_anchored_shades(base_hex)

	_L, base_C, h = _hex_to_oklch(base_hex)

	if gamma != 0 or saturation != 100:
		base_C = _base_chroma_at_600(h) * (saturation / 100.0)

	result = []
	for shade, target_l in _SHADE_TARGETS:
		target_l = _lightness_with_gamma(shade, target_l, gamma)
		max_c = _max_chroma_in_gamut(target_l, h, base_C * 1.5)
		use_c = min(base_C, max_c)
		use_c = _extreme_chroma_scale(target_l, use_c)
		use_c = min(use_c, max_c)
		result.append((shade, _oklch_to_hex(target_l, use_c, h)))
	return result


def _effective_role_hex(base_hex, gamma=0, saturation=100):
	"""600-stop hex after gamma/sat — matches frontend color600FromParams (unpinned)."""
	if not base_hex or len(base_hex) < 7:
		return base_hex
	gamma = float(gamma or 0)
	saturation = float(saturation if saturation is not None else 100)
	if gamma == 0 and saturation == 100:
		return base_hex.upper()
	shades = dict(_generate_shades(base_hex, gamma, saturation, pin_600_to_base=False))
	return shades.get(600, base_hex).upper()


def _rotate_shadow_offset(x, y, direction_deg):
	mag = math.hypot(float(x), float(y))
	if mag == 0:
		return 0.0, 0.0
	target_rad = math.radians(float(direction_deg) - 90.0)
	new_x = mag * math.cos(target_rad)
	new_y = mag * math.sin(target_rad)
	return round(new_x, 4), round(new_y, 4)


def _fmt_shadow_px(value):
	v = float(value)
	if abs(v - round(v)) < 1e-9:
		return f"{int(round(v))}px"
	return f"{v}px"


def _build_shadow(level, color_hex, opacity_pct=100, direction_deg=180):
	defs = SHADOW_DEFS.get(level, SHADOW_DEFS["md"])
	if not defs:
		return "none"
	r, g, b = _hex_to_rgb(color_hex) if color_hex else (0, 0, 0)
	alpha = round(max(0.0, min(100.0, float(opacity_pct if opacity_pct is not None else 100))) / 100.0, 4)
	dir_deg = float(direction_deg if direction_deg is not None else 180)
	parts = []
	for x, y, blur, spread, _preset_opacity in defs:
		ox, oy = _rotate_shadow_offset(x, y, dir_deg)
		parts.append(
			f"{_fmt_shadow_px(ox)} {_fmt_shadow_px(oy)} {blur}px {spread}px rgba({r}, {g}, {b}, {alpha})"
		)
	return ", ".join(parts)


def resolve_neutral_into_payload(payload: dict) -> dict:
	"""Resolve editor warmth input into published neutral tokens."""
	warmth = float(payload.get("neutral_color_warmth") or 0)
	shades = dict(generate_neutral_shades(warmth))
	payload["neutral_color_shades"] = {str(shade): hex_val for shade, hex_val in shades.items()}
	payload["neutral_color"] = shades.get(600, "#989898")
	return payload


# Re-export token maps (canonical source: themes.utils.theme_tokens)
from themes.utils.theme_tokens import (  # noqa: E402, F401
	BORDER_RADIUS_MAP,
	GAMMA_SAT_ROLE_FIELDS,
	LINE_HEIGHT_MAP,
	SHADOW_DEFS,
	SPACING_SCALE_MAP,
	TRANSITION_MAP,
)
