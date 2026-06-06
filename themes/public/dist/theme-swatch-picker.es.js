var de = Object.defineProperty, me = Object.defineProperties;
var pe = Object.getOwnPropertyDescriptors;
var Q = Object.getOwnPropertySymbols;
var he = Object.prototype.hasOwnProperty, ue = Object.prototype.propertyIsEnumerable;
var X = (e, t, n) => t in e ? de(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, G = (e, t) => {
  for (var n in t || (t = {}))
    he.call(t, n) && X(e, n, t[n]);
  if (Q)
    for (var n of Q(t))
      ue.call(t, n) && X(e, n, t[n]);
  return e;
}, Y = (e, t) => me(e, pe(t));
var W = (e, t, n) => new Promise((i, o) => {
  var a = (d) => {
    try {
      p(n.next(d));
    } catch (l) {
      o(l);
    }
  }, m = (d) => {
    try {
      p(n.throw(d));
    } catch (l) {
      o(l);
    }
  }, p = (d) => d.done ? i(d.value) : Promise.resolve(d.value).then(a, m);
  p((n = n.apply(e, t)).next());
});
const te = ["bg", "text", "border"], ne = [
  "primary",
  "secondary",
  "accent",
  "success",
  "info",
  "warning",
  "danger"
], ce = [100, 200, 300, 500, 600, 700, 900], fe = ["primary", "secondary"], ge = "bg", we = "primary", _e = "mono", ke = new Set(ne), be = new Set(te), ye = new Set(ce);
function ve(e) {
  return be.has(e);
}
function Ee(e) {
  return ke.has(e);
}
function xe(e) {
  return ye.has(e);
}
const Te = /^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;
function re(e) {
  const t = (e || "").trim();
  if (!t) return null;
  const n = Te.exec(t);
  if (!n) return null;
  const i = n[1], o = n[2], a = Number(n[3]);
  return !ve(i) || !Ee(o) || !xe(a) ? null : { kind: i, role: o, shade: a };
}
function T(e, t, n) {
  return `theme-${e}-${t}-${n}`;
}
function Se() {
  return {
    kind: ge,
    role: we,
    shade: 500
  };
}
function Ce(e) {
  var t;
  return (t = re(e)) != null ? t : Se();
}
function Le(e) {
  return ce;
}
function Fe(e) {
  return (e || "").trim().toLowerCase() === "tonal" ? "tonal" : _e;
}
function Ne(e, t, n) {
  return `theme-text-${e}-${t}${n === "tonal" ? "-fg-tonal" : "-fg"}`;
}
const Ae = {
  no_theme_selected: {
    title: "Theme required",
    body: "Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."
  },
  theme_not_available: {
    title: "Theme not available",
    body: "The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."
  }
};
function Pe(e) {
  return (e || "").trim() ? "theme_not_available" : "no_theme_selected";
}
function oe(e) {
  const { title: t, body: n } = Ae[e];
  if (typeof window == "undefined") return;
  const i = window.frappe;
  if (i != null && i.msgprint) {
    i.msgprint({ title: t, message: n, indicator: "orange" });
    return;
  }
  const o = document.createElement("div");
  o.setAttribute("role", "alert"), o.style.cssText = "position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;", o.innerHTML = `<p style="margin:0 0 .5rem;font-weight:600;">${t}</p><p style="margin:0;color:#374151;">${n}</p>`;
  const a = document.createElement("div");
  a.style.cssText = "position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";
  const m = () => {
    a.remove(), o.remove();
  };
  a.addEventListener("click", m), o.addEventListener("click", m), document.body.append(a, o);
}
const ze = `.nce-theme-swatch-picker {
	--tsp-modal-bg: var(--nce-color-surface, #fff);
	--tsp-modal-border: var(--nce-color-border, #e5e7eb);
	--tsp-muted: var(--nce-color-muted, #6b7280);
	--tsp-heading: var(--nce-color-heading, #111827);
	--tsp-overlay: rgba(15, 23, 42, 0.45);
	font-family: var(--nce-font-family, system-ui, sans-serif);
	font-size: var(--nce-font-size, 14px);
	color: var(--nce-color-text, #1f2937);
}

/* Full-viewport layer — blocks clicks on the host form (including Theme field) while open. */
.nce-theme-swatch-picker__backdrop {
	position: fixed;
	inset: 0;
	z-index: 10000;
	background: var(--tsp-overlay);
	pointer-events: auto;
}

.nce-theme-swatch-picker__modal {
	position: fixed;
	z-index: 10001;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: min(42rem, calc(100vw - 2rem));
	max-height: calc(100vh - 2rem);
	overflow: auto;
	background: var(--tsp-modal-bg);
	border: 1px solid var(--tsp-modal-border);
	border-radius: var(--nce-border-radius, 0.5rem);
	box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
	padding: 1rem;
}

.nce-theme-swatch-picker__layout {
	display: grid;
	grid-template-columns: 9.5rem 9.5rem 1fr;
	gap: 1rem;
	align-items: start;
}

.nce-theme-swatch-picker__column-title {
	font-size: 0.625rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: var(--tsp-muted);
	margin: 0 0 0.375rem;
}

.nce-theme-swatch-picker__radios {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	margin: 0;
	padding: 0;
	border: 0;
}

.nce-theme-swatch-picker__radios--horizontal {
	flex-direction: row;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
}

.nce-theme-swatch-picker__layout--chrome-pick {
	grid-template-columns: 9.5rem 1fr;
}

.nce-theme-swatch-picker__fg-type {
	margin-top: 0.625rem;
	padding-top: 0;
	border-top: 0;
	flex-direction: row;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem 0.75rem;
}

.nce-theme-swatch-picker__fg-type .nce-theme-swatch-picker__column-title {
	margin: 0;
	flex: 0 0 auto;
}

.nce-theme-swatch-picker__radio {
	display: flex;
	align-items: center;
	gap: 0.375rem;
	font-size: 0.8125rem;
	cursor: pointer;
	user-select: none;
}

.nce-theme-swatch-picker__swatch-strip {
	display: flex;
	flex-wrap: wrap;
	gap: 0.375rem;
	min-height: 2.5rem;
}

.nce-theme-swatch-picker__swatch {
	position: relative;
	width: 2.25rem;
	height: 2.25rem;
	padding: 0;
	border: 2px solid transparent;
	border-radius: 0.25rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 80ms ease, border-color 80ms ease, box-shadow 80ms ease;
}

.nce-theme-swatch-picker__swatch:hover {
	transform: scale(1.08);
	z-index: 1;
	box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}

.nce-theme-swatch-picker__swatch--preview {
	border-color: var(--tsp-heading);
	box-shadow: 0 0 0 2px var(--tsp-modal-bg), 0 0 0 3px var(--tsp-heading);
}

.nce-theme-swatch-picker__swatch-label {
	font-size: 0.5625rem;
	font-weight: 600;
	line-height: 1;
	pointer-events: none;
}

.nce-theme-swatch-picker__status {
	margin-top: 0.875rem;
	padding-top: 0.75rem;
	border-top: 1px solid var(--tsp-modal-border);
	font-size: 0.8125rem;
}

.nce-theme-swatch-picker__actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
	margin-top: 0.75rem;
}

.nce-theme-swatch-picker__btn {
	font: inherit;
	font-size: 0.8125rem;
	line-height: 1.25;
	padding: 0.375rem 0.875rem;
	border-radius: var(--nce-border-radius, 0.375rem);
	cursor: pointer;
	border: 1px solid var(--tsp-modal-border);
	background: var(--tsp-modal-bg);
	color: var(--nce-color-text, #1f2937);
}

.nce-theme-swatch-picker__btn:hover {
	background: color-mix(in srgb, var(--tsp-muted) 8%, var(--tsp-modal-bg));
}

.nce-theme-swatch-picker__btn--primary {
	background: var(--tsp-heading);
	border-color: var(--tsp-heading);
	color: #fff;
}

.nce-theme-swatch-picker__btn--primary:hover {
	opacity: 0.92;
}

.nce-theme-swatch-picker__selected-label {
	color: var(--tsp-muted);
	margin-right: 0.25rem;
}

.nce-theme-swatch-picker__selected-value {
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 0.75rem;
	word-break: break-all;
}

.nce-theme-swatch-picker__footer {
	margin-top: 0.75rem;
	text-align: center;
	font-size: 0.75rem;
	color: var(--tsp-muted);
}

.nce-theme-swatch-picker__warn {
	margin: 0 0 0.75rem;
	padding: 0.5rem 0.625rem;
	border-radius: 0.375rem;
	background: #fef3c7;
	color: #92400e;
	font-size: 0.75rem;
}

@media (max-width: 640px) {
	.nce-theme-swatch-picker__layout {
		grid-template-columns: 1fr 1fr;
	}

	.nce-theme-swatch-picker__swatch-strip {
		grid-column: 1 / -1;
	}
}
`;
let S = null, C = null, q = null, Z = !1;
const De = {
  bg: "Bg",
  text: "Text",
  border: "Border"
}, Me = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  success: "Success",
  info: "Info",
  warning: "Warning",
  danger: "Danger"
}, Re = {
  mono: "Mono",
  tonal: "Tonal"
};
function $e() {
  if (Z || typeof document == "undefined") return;
  const e = document.createElement("style");
  e.setAttribute("data-nce-theme-swatch-picker", ""), e.textContent = ze, document.head.appendChild(e), Z = !0;
}
function Ve() {
  if (typeof document == "undefined") return;
  const e = document.createElement("div");
  e.className = "theme-bg-primary-500", e.style.display = "none", document.body.appendChild(e);
  const t = getComputedStyle(e).backgroundColor;
  e.remove(), (!t || t === "rgba(0, 0, 0, 0)" || t === "transparent") && console.warn(
    "[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint."
  );
}
function Ie(e) {
  return (e || "").trim();
}
function Oe(e, t) {
  return t ? !0 : fe.includes(e);
}
function Be(e, t, n, i, o) {
  const a = !!(e.getFgType && e.setFgType), m = a, p = document.createElement("div");
  p.className = "nce-theme-swatch-picker__backdrop", p.addEventListener("click", () => g());
  const d = document.createElement("div");
  d.className = "nce-theme-swatch-picker nce-theme-swatch-picker__modal", d.setAttribute("role", "dialog"), d.setAttribute("aria-modal", "true"), d.setAttribute("aria-label", "Theme swatch picker"), d.addEventListener("click", (c) => c.stopPropagation());
  const l = document.createElement("div");
  t && l.setAttribute("data-nce-theme", t);
  const f = document.createElement("div");
  f.className = m ? "nce-theme-swatch-picker__layout nce-theme-swatch-picker__layout--chrome-pick" : "nce-theme-swatch-picker__layout";
  const b = document.createElement("fieldset");
  b.className = "nce-theme-swatch-picker__radios";
  const z = document.createElement("p");
  z.className = "nce-theme-swatch-picker__column-title", z.textContent = "Kind", b.appendChild(z);
  const L = document.createElement("fieldset");
  L.className = "nce-theme-swatch-picker__radios";
  const D = document.createElement("p");
  D.className = "nce-theme-swatch-picker__column-title", D.textContent = "Role", L.appendChild(D);
  const F = document.createElement("div"), M = document.createElement("p");
  M.className = "nce-theme-swatch-picker__column-title", M.textContent = "Swatches", F.appendChild(M);
  const N = document.createElement("div");
  N.className = "nce-theme-swatch-picker__swatch-strip", F.appendChild(N);
  const R = /* @__PURE__ */ new Map();
  for (const c of te) {
    const s = document.createElement("label");
    s.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-kind", r.value = c, r.checked = n.kind === c, s.appendChild(r), s.append(" ", De[c]), b.appendChild(s), R.set(c, r);
  }
  const $ = /* @__PURE__ */ new Map();
  for (const c of ne) {
    const s = document.createElement("label");
    s.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-role", r.value = c, r.checked = n.role === c, s.appendChild(r), s.append(" ", Me[c]), L.appendChild(s), $.set(c, r);
  }
  f.append(b, L, F), m && (b.hidden = !0, n = Y(G({}, n), { kind: "bg" }));
  const y = document.createElement("fieldset");
  y.className = "nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type", a || (y.hidden = !0);
  const V = document.createElement("p");
  V.className = "nce-theme-swatch-picker__column-title", V.textContent = "Foreground Type", y.appendChild(V);
  const I = /* @__PURE__ */ new Map();
  let O = o;
  for (const c of ["mono", "tonal"]) {
    const s = document.createElement("label");
    s.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-fg-type", r.value = c, r.checked = O === c, s.appendChild(r), s.append(" ", Re[c]), y.appendChild(s), I.set(c, r);
  }
  a && F.appendChild(y);
  const B = () => {
    var s;
    const c = ((s = [...I.entries()].find(([, r]) => r.checked)) == null ? void 0 : s[0]) || O;
    return O = c, c;
  }, H = document.createElement("div");
  H.className = "nce-theme-swatch-picker__status";
  const K = document.createElement("span");
  K.className = "nce-theme-swatch-picker__selected-label", K.textContent = "Selected:";
  const j = document.createElement("code");
  j.className = "nce-theme-swatch-picker__selected-value", H.append(K, j);
  const U = document.createElement("div");
  U.className = "nce-theme-swatch-picker__actions";
  const v = document.createElement("button");
  v.type = "button", v.className = "nce-theme-swatch-picker__btn", v.textContent = "Cancel", v.addEventListener("click", () => g());
  const E = document.createElement("button");
  E.type = "button", E.className = "nce-theme-swatch-picker__btn nce-theme-swatch-picker__btn--primary", E.textContent = "Save", E.addEventListener("click", () => {
    const c = k(), s = T(c.kind, c.role, c.shade);
    try {
      e.setFgType && e.setFgType(B()), e.setValue(s);
    } catch (r) {
      console.error("[themeSwatchPicker] setValue failed:", r);
      return;
    }
    g();
  }), U.append(v, E);
  const A = document.createElement("div");
  A.className = "nce-theme-swatch-picker__footer";
  const J = (c) => {
    if (!c) {
      A.textContent = "Theme: (site default — no theme selected)";
      return;
    }
    A.textContent = `Theme: ${c}`;
  };
  J(t), l.append(f, H, U, A), d.appendChild(l), p.appendChild(d);
  let w = null;
  const k = () => {
    var u, h;
    const c = m ? "bg" : ((u = [...R.entries()].find(([, _]) => _.checked)) == null ? void 0 : u[0]) || n.kind, s = ((h = [...$.entries()].find(([, _]) => _.checked)) == null ? void 0 : h[0]) || n.role, r = w != null ? w : n.shade;
    return { kind: c, role: s, shade: r };
  }, P = (c) => {
    const s = k(), r = c != null ? c : T(s.kind, s.role, s.shade);
    j.textContent = r;
  }, le = (c) => {
    n = Y(G({}, k()), { shade: c }), w = null, x();
  }, x = () => {
    const c = k(), s = B(), r = a;
    w = null, N.replaceChildren();
    for (const u of Le(c.role)) {
      const h = document.createElement("button");
      if (h.type = "button", h.className = `nce-theme-swatch-picker__swatch theme-bg-${c.role}-${u}`, h.title = T(c.kind, c.role, u), c.shade === u && h.classList.add("nce-theme-swatch-picker__swatch--preview"), Oe(c.role, r)) {
        const _ = document.createElement("span");
        _.className = "nce-theme-swatch-picker__swatch-label " + Ne(c.role, u, s), _.textContent = "Text", h.appendChild(_);
      }
      h.addEventListener("mouseenter", () => {
        w = u, P(T(c.kind, c.role, u));
      }), h.addEventListener("mouseleave", () => {
        w = null, P();
      }), h.addEventListener("click", () => {
        le(u);
      }), N.appendChild(h);
    }
    P();
  };
  for (const c of R.values())
    c.addEventListener("change", () => {
      n = k(), x();
    });
  for (const c of $.values())
    c.addEventListener("change", () => {
      n = k(), x();
    });
  for (const c of I.values())
    c.addEventListener("change", () => {
      B(), x();
    });
  return x(), {
    root: p,
    updateSelected: P,
    refreshThemeScope: (c) => {
      c ? l.setAttribute("data-nce-theme", c) : l.removeAttribute("data-nce-theme"), J(c);
    }
  };
}
function g() {
  C && (document.removeEventListener("keydown", C), C = null), S && (S.remove(), S = null);
  const e = q;
  q = null, e == null || e();
}
function ae() {
  return S !== null;
}
function se(e) {
  var m;
  ae() && g(), $e(), Ve();
  const t = Ie(e.getThemeSlug());
  if (!t)
    return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."), oe("no_theme_selected"), !1;
  const n = (e.getValue() || "").trim(), i = Ce(n), o = e.getFgType ? Fe(e.getFgType()) : "mono", { root: a } = Be(
    e,
    t,
    i,
    n,
    o
  );
  return document.body.appendChild(a), S = a, q = (m = e.onClose) != null ? m : null, C = (p) => {
    p.key === "Escape" && (p.preventDefault(), g());
  }, document.addEventListener("keydown", C), !0;
}
function He() {
  var t;
  if (typeof window == "undefined") return null;
  const e = window.frappe;
  return (t = e == null ? void 0 : e.db) != null ? t : null;
}
function Ke(e) {
  return W(this, null, function* () {
    var i;
    const t = (e || "").trim();
    if (!t) return "";
    const n = He();
    if (!n)
      return console.warn(
        "[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"
      ), "";
    try {
      if (!n.exists("NCE Theme", t))
        return console.warn(`[themeSwatchPicker] NCE Theme "${t}" not found`), "";
      const o = yield n.get_value("NCE Theme", t, ["slug", "status"]), a = (i = o.message) != null ? i : o, m = ((a == null ? void 0 : a.slug) || "").trim();
      return (a == null ? void 0 : a.status) === "Active" && m ? m : (console.warn(
        `[themeSwatchPicker] theme "${t}" is not Active or has no slug`
      ), "");
    } catch (o) {
      return console.error("[themeSwatchPicker] slug lookup failed:", o), "";
    }
  });
}
function je(e, t) {
  if (t) return t;
  if (e.endsWith("_bg_class"))
    return e.replace(/_bg_class$/, "_fg_type");
}
function Ue(e) {
  return W(this, null, function* () {
    var d;
    const { frm: t, themeField: n, valueField: i } = e, o = je(i, e.fgTypeField), a = String((d = t.doc[n]) != null ? d : "");
    let m = yield Ke(a);
    if (!m)
      return console.warn(
        "[themeSwatchPicker] no Active theme slug for field — open cancelled."
      ), oe(Pe(a)), !1;
    const p = {
      getThemeSlug: () => m,
      getValue: () => {
        var l;
        return String((l = t.doc[i]) != null ? l : "");
      },
      setValue: (l) => {
        try {
          t.set_value(i, l);
        } catch (f) {
          throw console.error("[themeSwatchPicker] frm.set_value failed:", f), f;
        }
      },
      onClose: e.onClose
    };
    return o && (p.getFgType = () => {
      var l;
      return String((l = t.doc[o]) != null ? l : "mono");
    }, p.setFgType = (l) => {
      try {
        t.set_value(o, l);
      } catch (f) {
        throw console.error("[themeSwatchPicker] frm.set_value fg type failed:", f), f;
      }
    }), se(p);
  });
}
function Ge(e) {
  e.ui.themeSwatchPicker = {
    open: Ue,
    close: g
  };
}
function ee(e) {
  var t, n;
  return e instanceof HTMLInputElement || e instanceof HTMLSelectElement ? e.value : (n = (t = e.textContent) == null ? void 0 : t.trim()) != null ? n : "";
}
function Ye(e, t) {
  if (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement) {
    e.value = t, e.dispatchEvent(new Event("input", { bubbles: !0 })), e.dispatchEvent(new Event("change", { bubbles: !0 }));
    return;
  }
  e.textContent = t;
}
function ie(e) {
  const { themeFieldEl: t, valueFieldEl: n } = e, i = {
    getThemeSlug: () => ee(t),
    getValue: () => ee(n),
    setValue: (o) => Ye(n, o),
    onClose: e.onClose
  };
  return se(i);
}
function We(e) {
  e.themeSwatchPicker = {
    open: ie,
    close: g
  };
}
const Je = {
  open: ie,
  close: g,
  isOpen: ae,
  parseThemeClass: re,
  composeThemeClass: T
};
if (typeof window != "undefined") {
  We(window);
  const e = window.frappe;
  e != null && e.ui && Ge(e);
}
export {
  g as close,
  T as composeThemeClass,
  Je as default,
  ae as isOpen,
  se as open,
  Ue as openDeskThemeSwatchPicker,
  ie as openStandaloneThemeSwatchPicker,
  re as parseThemeClass
};
//# sourceMappingURL=theme-swatch-picker.es.js.map
