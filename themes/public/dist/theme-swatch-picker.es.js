var pe = Object.defineProperty, he = Object.defineProperties;
var ue = Object.getOwnPropertyDescriptors;
var X = Object.getOwnPropertySymbols;
var fe = Object.prototype.hasOwnProperty, ge = Object.prototype.propertyIsEnumerable;
var Z = (e, t, n) => t in e ? pe(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, Y = (e, t) => {
  for (var n in t || (t = {}))
    fe.call(t, n) && Z(e, n, t[n]);
  if (X)
    for (var n of X(t))
      ge.call(t, n) && Z(e, n, t[n]);
  return e;
}, W = (e, t) => he(e, ue(t));
var q = (e, t, n) => new Promise((i, a) => {
  var o = (d) => {
    try {
      p(n.next(d));
    } catch (l) {
      a(l);
    }
  }, m = (d) => {
    try {
      p(n.throw(d));
    } catch (l) {
      a(l);
    }
  }, p = (d) => d.done ? i(d.value) : Promise.resolve(d.value).then(o, m);
  p((n = n.apply(e, t)).next());
});
const ne = ["bg", "text", "border"], ce = [
  "primary",
  "secondary",
  "accent",
  "success",
  "info",
  "warning",
  "danger"
], re = [100, 200, 300, 500, 600, 700, 900], we = ["primary", "secondary"], _e = "bg", ke = "primary", be = "mono", ye = new Set(ce), ve = new Set(ne), Ee = new Set(re);
function xe(e) {
  return ve.has(e);
}
function Te(e) {
  return ye.has(e);
}
function Se(e) {
  return Ee.has(e);
}
const Ce = /^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;
function ae(e) {
  const t = (e || "").trim();
  if (!t) return null;
  const n = Ce.exec(t);
  if (!n) return null;
  const i = n[1], a = n[2], o = Number(n[3]);
  return !xe(i) || !Te(a) || !Se(o) ? null : { kind: i, role: a, shade: o };
}
function S(e, t, n) {
  return `theme-${e}-${t}-${n}`;
}
function Le() {
  return {
    kind: _e,
    role: ke,
    shade: 500
  };
}
function Fe(e) {
  var t;
  return (t = ae(e)) != null ? t : Le();
}
function Ne(e) {
  return re;
}
function Ae(e) {
  return (e || "").trim().toLowerCase() === "tonal" ? "tonal" : be;
}
function Pe(e, t, n) {
  return `theme-text-${e}-${t}${n === "tonal" ? "-fg-tonal" : "-fg"}`;
}
const ze = {
  no_theme_selected: {
    title: "Theme required",
    body: "Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."
  },
  theme_not_available: {
    title: "Theme not available",
    body: "The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."
  }
};
function Me(e) {
  return (e || "").trim() ? "theme_not_available" : "no_theme_selected";
}
function oe(e) {
  const { title: t, body: n } = ze[e];
  if (typeof window == "undefined") return;
  const i = window.frappe;
  if (i != null && i.msgprint) {
    i.msgprint({ title: t, message: n, indicator: "orange" });
    return;
  }
  const a = document.createElement("div");
  a.setAttribute("role", "alert"), a.style.cssText = "position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;", a.innerHTML = `<p style="margin:0 0 .5rem;font-weight:600;">${t}</p><p style="margin:0;color:#374151;">${n}</p>`;
  const o = document.createElement("div");
  o.style.cssText = "position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";
  const m = () => {
    o.remove(), a.remove();
  };
  o.addEventListener("click", m), a.addEventListener("click", m), document.body.append(o, a);
}
const De = `.nce-theme-swatch-picker {
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
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	margin-top: 0.875rem;
	padding-top: 0.75rem;
	border-top: 1px solid var(--tsp-modal-border);
	font-size: 0.8125rem;
}

.nce-theme-swatch-picker__status-main {
	min-width: 0;
	flex: 1 1 12rem;
}

.nce-theme-swatch-picker__actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
	flex: 0 0 auto;
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
let C = null, L = null, J = null, ee = !1;
const Re = {
  bg: "Bg",
  text: "Text",
  border: "Border"
}, $e = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  success: "Success",
  info: "Info",
  warning: "Warning",
  danger: "Danger"
}, Ve = {
  mono: "Mono",
  tonal: "Tonal"
};
function Ie() {
  if (ee || typeof document == "undefined") return;
  const e = document.createElement("style");
  e.setAttribute("data-nce-theme-swatch-picker", ""), e.textContent = De, document.head.appendChild(e), ee = !0;
}
function Oe() {
  if (typeof document == "undefined") return;
  const e = document.createElement("div");
  e.className = "theme-bg-primary-500", e.style.display = "none", document.body.appendChild(e);
  const t = getComputedStyle(e).backgroundColor;
  e.remove(), (!t || t === "rgba(0, 0, 0, 0)" || t === "transparent") && console.warn(
    "[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint."
  );
}
function Be(e) {
  return (e || "").trim();
}
function He(e, t) {
  return t ? !0 : we.includes(e);
}
function Ke(e, t, n, i, a) {
  const o = !!(e.getFgType && e.setFgType), m = o, p = document.createElement("div");
  p.className = "nce-theme-swatch-picker__backdrop", p.addEventListener("click", () => g({ saved: !1 }));
  const d = document.createElement("div");
  d.className = "nce-theme-swatch-picker nce-theme-swatch-picker__modal", d.setAttribute("role", "dialog"), d.setAttribute("aria-modal", "true"), d.setAttribute("aria-label", "Theme swatch picker"), d.addEventListener("click", (c) => c.stopPropagation());
  const l = document.createElement("div");
  t && l.setAttribute("data-nce-theme", t);
  const u = document.createElement("div");
  u.className = m ? "nce-theme-swatch-picker__layout nce-theme-swatch-picker__layout--chrome-pick" : "nce-theme-swatch-picker__layout";
  const w = document.createElement("fieldset");
  w.className = "nce-theme-swatch-picker__radios";
  const b = document.createElement("p");
  b.className = "nce-theme-swatch-picker__column-title", b.textContent = "Kind", w.appendChild(b);
  const F = document.createElement("fieldset");
  F.className = "nce-theme-swatch-picker__radios";
  const M = document.createElement("p");
  M.className = "nce-theme-swatch-picker__column-title", M.textContent = "Role", F.appendChild(M);
  const N = document.createElement("div"), D = document.createElement("p");
  D.className = "nce-theme-swatch-picker__column-title", D.textContent = "Swatches", N.appendChild(D);
  const A = document.createElement("div");
  A.className = "nce-theme-swatch-picker__swatch-strip", N.appendChild(A);
  const R = /* @__PURE__ */ new Map();
  for (const c of ne) {
    const s = document.createElement("label");
    s.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-kind", r.value = c, r.checked = n.kind === c, s.appendChild(r), s.append(" ", Re[c]), w.appendChild(s), R.set(c, r);
  }
  const $ = /* @__PURE__ */ new Map();
  for (const c of ce) {
    const s = document.createElement("label");
    s.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-role", r.value = c, r.checked = n.role === c, s.appendChild(r), s.append(" ", $e[c]), F.appendChild(s), $.set(c, r);
  }
  u.append(w, F, N), m && (w.hidden = !0, n = W(Y({}, n), { kind: "bg" }));
  const v = document.createElement("fieldset");
  v.className = "nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type", o || (v.hidden = !0);
  const V = document.createElement("p");
  V.className = "nce-theme-swatch-picker__column-title", V.textContent = "Foreground Type", v.appendChild(V);
  const I = /* @__PURE__ */ new Map();
  let O = a;
  for (const c of ["mono", "tonal"]) {
    const s = document.createElement("label");
    s.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-fg-type", r.value = c, r.checked = O === c, s.appendChild(r), s.append(" ", Ve[c]), v.appendChild(s), I.set(c, r);
  }
  o && N.appendChild(v);
  const B = () => {
    var s;
    const c = ((s = [...I.entries()].find(([, r]) => r.checked)) == null ? void 0 : s[0]) || O;
    return O = c, c;
  }, H = document.createElement("div");
  H.className = "nce-theme-swatch-picker__status";
  const K = document.createElement("div");
  K.className = "nce-theme-swatch-picker__status-main";
  const j = document.createElement("span");
  j.className = "nce-theme-swatch-picker__selected-label", j.textContent = "Selected:";
  const U = document.createElement("code");
  U.className = "nce-theme-swatch-picker__selected-value", K.append(j, U);
  const G = document.createElement("div");
  G.className = "nce-theme-swatch-picker__actions";
  const E = document.createElement("button");
  E.type = "button", E.className = "nce-theme-swatch-picker__btn", E.textContent = "Cancel";
  const x = document.createElement("button");
  x.type = "button", x.className = "nce-theme-swatch-picker__btn nce-theme-swatch-picker__btn--primary", x.textContent = "Save", G.append(E, x), H.append(K, G);
  const P = document.createElement("div");
  P.className = "nce-theme-swatch-picker__footer";
  const Q = (c) => {
    if (!c) {
      P.textContent = "Theme: (site default — no theme selected)";
      return;
    }
    P.textContent = `Theme: ${c}`;
  };
  Q(t), l.append(u, H, P), d.appendChild(l), p.appendChild(d);
  let _ = null;
  const y = () => {
    var f, h;
    const c = m ? "bg" : ((f = [...R.entries()].find(([, k]) => k.checked)) == null ? void 0 : f[0]) || n.kind, s = ((h = [...$.entries()].find(([, k]) => k.checked)) == null ? void 0 : h[0]) || n.role, r = _ != null ? _ : n.shade;
    return { kind: c, role: s, shade: r };
  }, z = (c) => {
    const s = y(), r = c != null ? c : S(s.kind, s.role, s.shade);
    U.textContent = r;
  }, de = (c) => {
    n = W(Y({}, y()), { shade: c }), _ = null, T();
  }, me = () => {
    const c = y(), s = S(c.kind, c.role, c.shade);
    try {
      e.setFgType && e.setFgType(B()), e.setValue(s);
    } catch (r) {
      return console.error("[themeSwatchPicker] setValue failed:", r), !1;
    }
    return !0;
  };
  E.addEventListener("click", () => g({ saved: !1 })), x.addEventListener("click", () => {
    me() && g({ saved: !0 });
  });
  const T = () => {
    const c = y(), s = B(), r = o;
    _ = null, A.replaceChildren();
    for (const f of Ne(c.role)) {
      const h = document.createElement("button");
      if (h.type = "button", h.className = `nce-theme-swatch-picker__swatch theme-bg-${c.role}-${f}`, h.title = S(c.kind, c.role, f), c.shade === f && h.classList.add("nce-theme-swatch-picker__swatch--preview"), He(c.role, r)) {
        const k = document.createElement("span");
        k.className = "nce-theme-swatch-picker__swatch-label " + Pe(c.role, f, s), k.textContent = "Text", h.appendChild(k);
      }
      h.addEventListener("mouseenter", () => {
        _ = f, z(S(c.kind, c.role, f));
      }), h.addEventListener("mouseleave", () => {
        _ = null, z();
      }), h.addEventListener("click", () => {
        de(f);
      }), A.appendChild(h);
    }
    z();
  };
  for (const c of R.values())
    c.addEventListener("change", () => {
      n = y(), T();
    });
  for (const c of $.values())
    c.addEventListener("change", () => {
      n = y(), T();
    });
  for (const c of I.values())
    c.addEventListener("change", () => {
      B(), T();
    });
  return T(), {
    root: p,
    updateSelected: z,
    refreshThemeScope: (c) => {
      c ? l.setAttribute("data-nce-theme", c) : l.removeAttribute("data-nce-theme"), Q(c);
    }
  };
}
function g(e = { saved: !1 }) {
  L && (document.removeEventListener("keydown", L), L = null), C && (C.remove(), C = null);
  const t = J;
  J = null, t == null || t(e);
}
function se() {
  return C !== null;
}
function ie(e) {
  var m;
  se() && g({ saved: !1 }), Ie(), Oe();
  const t = Be(e.getThemeSlug());
  if (!t)
    return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."), oe("no_theme_selected"), !1;
  const n = (e.getValue() || "").trim(), i = Fe(n), a = e.getFgType ? Ae(e.getFgType()) : "mono", { root: o } = Ke(
    e,
    t,
    i,
    n,
    a
  );
  return document.body.appendChild(o), C = o, J = (m = e.onClose) != null ? m : null, L = (p) => {
    p.key === "Escape" && (p.preventDefault(), g({ saved: !1 }));
  }, document.addEventListener("keydown", L), !0;
}
function je() {
  var t;
  if (typeof window == "undefined") return null;
  const e = window.frappe;
  return (t = e == null ? void 0 : e.db) != null ? t : null;
}
function Ue(e) {
  return q(this, null, function* () {
    var i;
    const t = (e || "").trim();
    if (!t) return "";
    const n = je();
    if (!n)
      return console.warn(
        "[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"
      ), "";
    try {
      if (!n.exists("NCE Theme", t))
        return console.warn(`[themeSwatchPicker] NCE Theme "${t}" not found`), "";
      const a = yield n.get_value("NCE Theme", t, ["slug", "status"]), o = (i = a.message) != null ? i : a, m = ((o == null ? void 0 : o.slug) || "").trim();
      return (o == null ? void 0 : o.status) === "Active" && m ? m : (console.warn(
        `[themeSwatchPicker] theme "${t}" is not Active or has no slug`
      ), "");
    } catch (a) {
      return console.error("[themeSwatchPicker] slug lookup failed:", a), "";
    }
  });
}
function Ge(e, t) {
  if (t) return t;
  if (e.endsWith("_bg_class"))
    return e.replace(/_bg_class$/, "_fg_type");
}
function Ye(e) {
  return q(this, null, function* () {
    var d;
    const { frm: t, themeField: n, valueField: i } = e, a = Ge(i, e.fgTypeField), o = String((d = t.doc[n]) != null ? d : "");
    let m = yield Ue(o);
    if (!m)
      return console.warn(
        "[themeSwatchPicker] no Active theme slug for field — open cancelled."
      ), oe(Me(o)), !1;
    const p = {
      getThemeSlug: () => m,
      getValue: () => {
        var l;
        return String((l = t.doc[i]) != null ? l : "");
      },
      setValue: (l) => {
        try {
          t.set_value(i, l);
        } catch (u) {
          throw console.error("[themeSwatchPicker] frm.set_value failed:", u), u;
        }
      }
    };
    return a && (p.getFgType = () => {
      var l;
      return String((l = t.doc[a]) != null ? l : "mono");
    }, p.setFgType = (l) => {
      try {
        t.set_value(a, l);
      } catch (u) {
        throw console.error("[themeSwatchPicker] frm.set_value fg type failed:", u), u;
      }
    }), new Promise((l) => {
      p.onClose = (w) => {
        var b;
        (b = e.onClose) == null || b.call(e), l(w.saved);
      }, ie(p) || l(!1);
    });
  });
}
function We(e) {
  e.ui.themeSwatchPicker = {
    open: Ye,
    close: g
  };
}
function te(e) {
  var t, n;
  return e instanceof HTMLInputElement || e instanceof HTMLSelectElement ? e.value : (n = (t = e.textContent) == null ? void 0 : t.trim()) != null ? n : "";
}
function qe(e, t) {
  if (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement) {
    e.value = t, e.dispatchEvent(new Event("input", { bubbles: !0 })), e.dispatchEvent(new Event("change", { bubbles: !0 }));
    return;
  }
  e.textContent = t;
}
function le(e) {
  const { themeFieldEl: t, valueFieldEl: n } = e, i = {
    getThemeSlug: () => te(t),
    getValue: () => te(n),
    setValue: (a) => qe(n, a),
    onClose: e.onClose
  };
  return ie(i);
}
function Je(e) {
  e.themeSwatchPicker = {
    open: le,
    close: g
  };
}
const Xe = {
  open: le,
  close: g,
  isOpen: se,
  parseThemeClass: ae,
  composeThemeClass: S
};
if (typeof window != "undefined") {
  Je(window);
  const e = window.frappe;
  e != null && e.ui && We(e);
}
export {
  g as close,
  S as composeThemeClass,
  Xe as default,
  se as isOpen,
  ie as open,
  Ye as openDeskThemeSwatchPicker,
  le as openStandaloneThemeSwatchPicker,
  ae as parseThemeClass
};
//# sourceMappingURL=theme-swatch-picker.es.js.map
