var se = Object.defineProperty, ie = Object.defineProperties;
var le = Object.getOwnPropertyDescriptors;
var G = Object.getOwnPropertySymbols;
var de = Object.prototype.hasOwnProperty, me = Object.prototype.propertyIsEnumerable;
var Y = (e, t, c) => t in e ? se(e, t, { enumerable: !0, configurable: !0, writable: !0, value: c }) : e[t] = c, W = (e, t) => {
  for (var c in t || (t = {}))
    de.call(t, c) && Y(e, c, t[c]);
  if (G)
    for (var c of G(t))
      me.call(t, c) && Y(e, c, t[c]);
  return e;
}, q = (e, t) => ie(e, le(t));
var K = (e, t, c) => new Promise((i, o) => {
  var a = (d) => {
    try {
      h(c.next(d));
    } catch (l) {
      o(l);
    }
  }, m = (d) => {
    try {
      h(c.throw(d));
    } catch (l) {
      o(l);
    }
  }, h = (d) => d.done ? i(d.value) : Promise.resolve(d.value).then(a, m);
  h((c = c.apply(e, t)).next());
});
const X = ["bg", "text", "border"], Z = [
  "primary",
  "secondary",
  "accent",
  "success",
  "info",
  "warning",
  "danger"
], ee = [100, 200, 300, 500, 600, 700, 900], he = ["primary", "secondary"], pe = "bg", ue = "primary", fe = "mono", ge = new Set(Z), we = new Set(X), _e = new Set(ee);
function ke(e) {
  return we.has(e);
}
function be(e) {
  return ge.has(e);
}
function ye(e) {
  return _e.has(e);
}
const ve = /^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;
function te(e) {
  const t = (e || "").trim();
  if (!t) return null;
  const c = ve.exec(t);
  if (!c) return null;
  const i = c[1], o = c[2], a = Number(c[3]);
  return !ke(i) || !be(o) || !ye(a) ? null : { kind: i, role: o, shade: a };
}
function w(e, t, c) {
  return `theme-${e}-${t}-${c}`;
}
function Ee() {
  return {
    kind: pe,
    role: ue,
    shade: 500
  };
}
function Te(e) {
  var t;
  return (t = te(e)) != null ? t : Ee();
}
function xe(e) {
  return ee;
}
function Se(e) {
  return (e || "").trim().toLowerCase() === "tonal" ? "tonal" : fe;
}
function Ce(e, t, c) {
  return `theme-text-${e}-${t}${c === "tonal" ? "-fg-tonal" : "-fg"}`;
}
const Fe = {
  no_theme_selected: {
    title: "Theme required",
    body: "Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."
  },
  theme_not_available: {
    title: "Theme not available",
    body: "The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."
  }
};
function Le(e) {
  return (e || "").trim() ? "theme_not_available" : "no_theme_selected";
}
function ne(e) {
  const { title: t, body: c } = Fe[e];
  if (typeof window == "undefined") return;
  const i = window.frappe;
  if (i != null && i.msgprint) {
    i.msgprint({ title: t, message: c, indicator: "orange" });
    return;
  }
  const o = document.createElement("div");
  o.setAttribute("role", "alert"), o.style.cssText = "position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;", o.innerHTML = `<p style="margin:0 0 .5rem;font-weight:600;">${t}</p><p style="margin:0;color:#374151;">${c}</p>`;
  const a = document.createElement("div");
  a.style.cssText = "position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";
  const m = () => {
    a.remove(), o.remove();
  };
  a.addEventListener("click", m), o.addEventListener("click", m), document.body.append(a, o);
}
const Ne = `.nce-theme-swatch-picker {
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
let v = null, E = null, U = null, J = !1;
const Ae = {
  bg: "Bg",
  text: "Text",
  border: "Border"
}, Pe = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  success: "Success",
  info: "Info",
  warning: "Warning",
  danger: "Danger"
}, ze = {
  mono: "Mono",
  tonal: "Tonal"
};
function De() {
  if (J || typeof document == "undefined") return;
  const e = document.createElement("style");
  e.setAttribute("data-nce-theme-swatch-picker", ""), e.textContent = Ne, document.head.appendChild(e), J = !0;
}
function Me() {
  if (typeof document == "undefined") return;
  const e = document.createElement("div");
  e.className = "theme-bg-primary-500", e.style.display = "none", document.body.appendChild(e);
  const t = getComputedStyle(e).backgroundColor;
  e.remove(), (!t || t === "rgba(0, 0, 0, 0)" || t === "transparent") && console.warn(
    "[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint."
  );
}
function Re(e) {
  return (e || "").trim();
}
function $e(e, t) {
  return t ? !0 : he.includes(e);
}
function Ie(e, t, c, i, o) {
  const a = !!(e.getFgType && e.setFgType), m = a, h = document.createElement("div");
  h.className = "nce-theme-swatch-picker__backdrop", h.addEventListener("click", () => _());
  const d = document.createElement("div");
  d.className = "nce-theme-swatch-picker nce-theme-swatch-picker__modal", d.setAttribute("role", "dialog"), d.setAttribute("aria-modal", "true"), d.setAttribute("aria-label", "Theme swatch picker"), d.addEventListener("click", (n) => n.stopPropagation());
  const l = document.createElement("div");
  t && l.setAttribute("data-nce-theme", t);
  const f = document.createElement("div");
  f.className = m ? "nce-theme-swatch-picker__layout nce-theme-swatch-picker__layout--chrome-pick" : "nce-theme-swatch-picker__layout";
  const b = document.createElement("fieldset");
  b.className = "nce-theme-swatch-picker__radios";
  const A = document.createElement("p");
  A.className = "nce-theme-swatch-picker__column-title", A.textContent = "Kind", b.appendChild(A);
  const T = document.createElement("fieldset");
  T.className = "nce-theme-swatch-picker__radios";
  const P = document.createElement("p");
  P.className = "nce-theme-swatch-picker__column-title", P.textContent = "Role", T.appendChild(P);
  const x = document.createElement("div"), z = document.createElement("p");
  z.className = "nce-theme-swatch-picker__column-title", z.textContent = "Swatches", x.appendChild(z);
  const S = document.createElement("div");
  S.className = "nce-theme-swatch-picker__swatch-strip", x.appendChild(S);
  const D = /* @__PURE__ */ new Map();
  for (const n of X) {
    const s = document.createElement("label");
    s.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-kind", r.value = n, r.checked = c.kind === n, s.appendChild(r), s.append(" ", Ae[n]), b.appendChild(s), D.set(n, r);
  }
  const M = /* @__PURE__ */ new Map();
  for (const n of Z) {
    const s = document.createElement("label");
    s.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-role", r.value = n, r.checked = c.role === n, s.appendChild(r), s.append(" ", Pe[n]), T.appendChild(s), M.set(n, r);
  }
  f.append(b, T, x), m && (b.hidden = !0, c = q(W({}, c), { kind: "bg" }));
  const y = document.createElement("fieldset");
  y.className = "nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type", a || (y.hidden = !0);
  const R = document.createElement("p");
  R.className = "nce-theme-swatch-picker__column-title", R.textContent = "Foreground Type", y.appendChild(R);
  const $ = /* @__PURE__ */ new Map();
  let I = o;
  for (const n of ["mono", "tonal"]) {
    const s = document.createElement("label");
    s.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-fg-type", r.value = n, r.checked = I === n, s.appendChild(r), s.append(" ", ze[n]), y.appendChild(s), $.set(n, r);
  }
  a && x.appendChild(y);
  const O = () => {
    var s;
    const n = ((s = [...$.entries()].find(([, r]) => r.checked)) == null ? void 0 : s[0]) || I;
    return I = n, n;
  }, V = document.createElement("div");
  V.className = "nce-theme-swatch-picker__status";
  const H = document.createElement("span");
  H.className = "nce-theme-swatch-picker__selected-label", H.textContent = "Selected:";
  const B = document.createElement("code");
  B.className = "nce-theme-swatch-picker__selected-value", V.append(H, B);
  const C = document.createElement("div");
  C.className = "nce-theme-swatch-picker__footer";
  const j = (n) => {
    if (!n) {
      C.textContent = "Theme: (site default — no theme selected)";
      return;
    }
    C.textContent = `Theme: ${n}`;
  };
  j(t), l.append(f, V, C), d.appendChild(l), h.appendChild(d);
  let k = null;
  const F = () => {
    var u, p;
    const n = m ? "bg" : ((u = [...D.entries()].find(([, g]) => g.checked)) == null ? void 0 : u[0]) || c.kind, s = ((p = [...M.entries()].find(([, g]) => g.checked)) == null ? void 0 : p[0]) || c.role, r = k != null ? k : c.shade;
    return { kind: n, role: s, shade: r };
  }, L = (n) => {
    const s = F(), r = n != null ? n : w(s.kind, s.role, s.shade);
    B.textContent = r;
  }, N = () => {
    const n = F(), s = O(), r = a;
    k = null, S.replaceChildren();
    for (const u of xe(n.role)) {
      const p = document.createElement("button");
      if (p.type = "button", p.className = `nce-theme-swatch-picker__swatch theme-bg-${n.role}-${u}`, p.title = w(n.kind, n.role, u), n.shade === u && p.classList.add("nce-theme-swatch-picker__swatch--preview"), $e(n.role, r)) {
        const g = document.createElement("span");
        g.className = "nce-theme-swatch-picker__swatch-label " + Ce(n.role, u, s), g.textContent = "Text", p.appendChild(g);
      }
      p.addEventListener("mouseenter", () => {
        k = u, L(w(n.kind, n.role, u));
      }), p.addEventListener("mouseleave", () => {
        k = null, L(i || w(n.kind, n.role, n.shade));
      }), p.addEventListener("click", () => {
        const g = w(n.kind, n.role, u);
        try {
          e.setFgType && e.setFgType(O()), e.setValue(g);
        } catch (ae) {
          console.error("[themeSwatchPicker] setValue failed:", ae);
          return;
        }
        _();
      }), S.appendChild(p);
    }
    L(
      i || w(n.kind, n.role, n.shade)
    );
  };
  for (const n of D.values())
    n.addEventListener("change", () => {
      c = F(), N();
    });
  for (const n of M.values())
    n.addEventListener("change", () => {
      c = F(), N();
    });
  for (const n of $.values())
    n.addEventListener("change", () => {
      O(), N();
    });
  return N(), {
    root: h,
    updateSelected: L,
    refreshThemeScope: (n) => {
      n ? l.setAttribute("data-nce-theme", n) : l.removeAttribute("data-nce-theme"), j(n);
    }
  };
}
function _() {
  E && (document.removeEventListener("keydown", E), E = null), v && (v.remove(), v = null);
  const e = U;
  U = null, e == null || e();
}
function ce() {
  return v !== null;
}
function re(e) {
  var m;
  ce() && _(), De(), Me();
  const t = Re(e.getThemeSlug());
  if (!t)
    return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."), ne("no_theme_selected"), !1;
  const c = (e.getValue() || "").trim(), i = Te(c), o = e.getFgType ? Se(e.getFgType()) : "mono", { root: a } = Ie(
    e,
    t,
    i,
    c,
    o
  );
  return document.body.appendChild(a), v = a, U = (m = e.onClose) != null ? m : null, E = (h) => {
    h.key === "Escape" && (h.preventDefault(), _());
  }, document.addEventListener("keydown", E), !0;
}
function Oe() {
  var t;
  if (typeof window == "undefined") return null;
  const e = window.frappe;
  return (t = e == null ? void 0 : e.db) != null ? t : null;
}
function Ve(e) {
  return K(this, null, function* () {
    var i;
    const t = (e || "").trim();
    if (!t) return "";
    const c = Oe();
    if (!c)
      return console.warn(
        "[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"
      ), "";
    try {
      if (!c.exists("NCE Theme", t))
        return console.warn(`[themeSwatchPicker] NCE Theme "${t}" not found`), "";
      const o = yield c.get_value("NCE Theme", t, ["slug", "status"]), a = (i = o.message) != null ? i : o, m = ((a == null ? void 0 : a.slug) || "").trim();
      return (a == null ? void 0 : a.status) === "Active" && m ? m : (console.warn(
        `[themeSwatchPicker] theme "${t}" is not Active or has no slug`
      ), "");
    } catch (o) {
      return console.error("[themeSwatchPicker] slug lookup failed:", o), "";
    }
  });
}
function He(e, t) {
  if (t) return t;
  if (e.endsWith("_bg_class"))
    return e.replace(/_bg_class$/, "_fg_type");
}
function Be(e) {
  return K(this, null, function* () {
    var d;
    const { frm: t, themeField: c, valueField: i } = e, o = He(i, e.fgTypeField), a = String((d = t.doc[c]) != null ? d : "");
    let m = yield Ve(a);
    if (!m)
      return console.warn(
        "[themeSwatchPicker] no Active theme slug for field — open cancelled."
      ), ne(Le(a)), !1;
    const h = {
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
    return o && (h.getFgType = () => {
      var l;
      return String((l = t.doc[o]) != null ? l : "mono");
    }, h.setFgType = (l) => {
      try {
        t.set_value(o, l);
      } catch (f) {
        throw console.error("[themeSwatchPicker] frm.set_value fg type failed:", f), f;
      }
    }), re(h);
  });
}
function Ke(e) {
  e.ui.themeSwatchPicker = {
    open: Be,
    close: _
  };
}
function Q(e) {
  var t, c;
  return e instanceof HTMLInputElement || e instanceof HTMLSelectElement ? e.value : (c = (t = e.textContent) == null ? void 0 : t.trim()) != null ? c : "";
}
function Ue(e, t) {
  if (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement) {
    e.value = t, e.dispatchEvent(new Event("input", { bubbles: !0 })), e.dispatchEvent(new Event("change", { bubbles: !0 }));
    return;
  }
  e.textContent = t;
}
function oe(e) {
  const { themeFieldEl: t, valueFieldEl: c } = e, i = {
    getThemeSlug: () => Q(t),
    getValue: () => Q(c),
    setValue: (o) => Ue(c, o),
    onClose: e.onClose
  };
  return re(i);
}
function je(e) {
  e.themeSwatchPicker = {
    open: oe,
    close: _
  };
}
const Ye = {
  open: oe,
  close: _,
  isOpen: ce,
  parseThemeClass: te,
  composeThemeClass: w
};
if (typeof window != "undefined") {
  je(window);
  const e = window.frappe;
  e != null && e.ui && Ke(e);
}
export {
  _ as close,
  w as composeThemeClass,
  Ye as default,
  ce as isOpen,
  re as open,
  Be as openDeskThemeSwatchPicker,
  oe as openStandaloneThemeSwatchPicker,
  te as parseThemeClass
};
//# sourceMappingURL=theme-swatch-picker.es.js.map
