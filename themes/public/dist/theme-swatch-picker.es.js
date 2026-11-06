var we = Object.defineProperty, ke = Object.defineProperties;
var _e = Object.getOwnPropertyDescriptors;
var ae = Object.getOwnPropertySymbols;
var be = Object.prototype.hasOwnProperty, ye = Object.prototype.propertyIsEnumerable;
var se = (e, t, c) => t in e ? we(e, t, { enumerable: !0, configurable: !0, writable: !0, value: c }) : e[t] = c, F = (e, t) => {
  for (var c in t || (t = {}))
    be.call(t, c) && se(e, c, t[c]);
  if (ae)
    for (var c of ae(t))
      ye.call(t, c) && se(e, c, t[c]);
  return e;
}, N = (e, t) => ke(e, _e(t));
var te = (e, t, c) => new Promise((a, s) => {
  var i = (p) => {
    try {
      d(c.next(p));
    } catch (g) {
      s(g);
    }
  }, m = (p) => {
    try {
      d(c.throw(p));
    } catch (g) {
      s(g);
    }
  }, d = (p) => p.done ? a(p.value) : Promise.resolve(p.value).then(i, m);
  d((c = c.apply(e, t)).next());
});
const de = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950], me = ["primary", "secondary", "accent", "success", "info", "warning", "danger", "neutral"], he = ["bg", "text", "border"], ve = ["primary", "secondary"], xe = "bg", Ee = "primary", Te = "mono", Se = new Set(me), Ce = new Set(he), Le = new Set(de);
function Fe(e) {
  return Ce.has(e);
}
function Ne(e) {
  return Se.has(e);
}
function Ae(e) {
  return Le.has(e);
}
function Pe(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
const ze = /^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;
function ce(e) {
  const t = (e || "").trim();
  if (!t) return null;
  const c = ze.exec(t);
  if (!c) return null;
  const a = c[1], s = c[2], i = Number(c[3]);
  return !Fe(a) || !Ne(s) || !Ae(i) ? null : { kind: a, role: s, shade: i };
}
function v(e, t, c) {
  return `theme-${e}-${t}-${c}`;
}
function Ke() {
  return {
    kind: xe,
    role: Ee,
    shade: 500
  };
}
function Me(e) {
  var t;
  return (t = ce(e)) != null ? t : Ke();
}
function $e(e) {
  return de;
}
function De(e) {
  return (e || "").trim().toLowerCase() === "tonal" ? "tonal" : Te;
}
function Re(e, t, c) {
  return `theme-text-${e}-${t}${c === "tonal" ? "-fg-tonal" : "-fg"}`;
}
const Ve = {
  no_theme_selected: {
    title: "Theme required",
    body: "Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."
  },
  theme_not_available: {
    title: "Theme not available",
    body: "The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."
  }
};
function Oe(e) {
  return (e || "").trim() ? "theme_not_available" : "no_theme_selected";
}
function pe(e) {
  const { title: t, body: c } = Ve[e];
  if (typeof window == "undefined") return;
  const a = window.frappe;
  if (a != null && a.msgprint) {
    a.msgprint({ title: t, message: c, indicator: "orange" });
    return;
  }
  const s = document.createElement("div");
  s.setAttribute("role", "alert"), s.style.cssText = "position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;", s.innerHTML = `<p style="margin:0 0 .5rem;font-weight:600;">${t}</p><p style="margin:0;color:#374151;">${c}</p>`;
  const i = document.createElement("div");
  i.style.cssText = "position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";
  const m = () => {
    i.remove(), s.remove();
  };
  i.addEventListener("click", m), s.addEventListener("click", m), document.body.append(i, s);
}
const Ie = `/*
 * Layout and colour styles for the theme swatch picker modal, radios, and swatches.
 *
 */

.nce-theme-swatch-picker {
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

.nce-theme-swatch-picker__link-btn {
	font: inherit;
	font-size: 0.75rem;
	margin-left: 0.75rem;
	padding: 0;
	border: 0;
	background: none;
	color: var(--tsp-heading);
	text-decoration: underline;
	cursor: pointer;
}

.nce-theme-swatch-picker__link-btn:hover {
	opacity: 0.8;
}
`;
let P = null, z = null, ne = null, A = null, ie = !1;
const Be = {
  bg: "Bg",
  text: "Text",
  border: "Border"
}, He = {
  mono: "Mono",
  tonal: "Tonal"
};
function Ue() {
  if (ie || typeof document == "undefined") return;
  const e = document.createElement("style");
  e.setAttribute("data-nce-theme-swatch-picker", ""), e.textContent = Ie, document.head.appendChild(e), ie = !0;
}
function je() {
  if (typeof document == "undefined") return;
  const e = document.createElement("div");
  e.className = "theme-bg-primary-500", e.style.display = "none", document.body.appendChild(e);
  const t = getComputedStyle(e).backgroundColor;
  e.remove(), (!t || t === "rgba(0, 0, 0, 0)" || t === "transparent") && console.warn(
    "[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint."
  );
}
function Ge(e) {
  return (e || "").trim();
}
function Ye(e, t) {
  return t ? !0 : ve.includes(e);
}
function qe(e, t, c, a, s) {
  const i = !!(e.getFgType && e.setFgType), m = i, d = e.lockKind, p = m || !!d, g = document.createElement("div");
  g.className = "nce-theme-swatch-picker__backdrop", g.addEventListener("click", () => k({ saved: !1 }));
  const l = document.createElement("div");
  l.className = "nce-theme-swatch-picker nce-theme-swatch-picker__modal", l.setAttribute("role", "dialog"), l.setAttribute("aria-modal", "true"), l.setAttribute("aria-label", "Theme swatch picker"), l.addEventListener("click", (n) => n.stopPropagation());
  const u = document.createElement("div");
  t && u.setAttribute("data-nce-theme", t);
  const x = document.createElement("div");
  x.className = m ? "nce-theme-swatch-picker__layout nce-theme-swatch-picker__layout--chrome-pick" : "nce-theme-swatch-picker__layout";
  const w = document.createElement("fieldset");
  w.className = "nce-theme-swatch-picker__radios";
  const U = document.createElement("p");
  U.className = "nce-theme-swatch-picker__column-title", U.textContent = "Kind", w.appendChild(U);
  const K = document.createElement("fieldset");
  K.className = "nce-theme-swatch-picker__radios";
  const j = document.createElement("p");
  j.className = "nce-theme-swatch-picker__column-title", j.textContent = "Role", K.appendChild(j);
  const M = document.createElement("div"), G = document.createElement("p");
  G.className = "nce-theme-swatch-picker__column-title", G.textContent = "Swatches", M.appendChild(G);
  const $ = document.createElement("div");
  $.className = "nce-theme-swatch-picker__swatch-strip", M.appendChild($);
  const Y = /* @__PURE__ */ new Map();
  for (const n of he) {
    const r = document.createElement("label");
    r.className = "nce-theme-swatch-picker__radio";
    const o = document.createElement("input");
    o.type = "radio", o.name = "nce-tsp-kind", o.value = n, o.checked = c.kind === n, r.appendChild(o), r.append(" ", Be[n]), w.appendChild(r), Y.set(n, o);
  }
  const q = /* @__PURE__ */ new Map();
  for (const n of me) {
    const r = document.createElement("label");
    r.className = "nce-theme-swatch-picker__radio";
    const o = document.createElement("input");
    o.type = "radio", o.name = "nce-tsp-role", o.value = n, o.checked = c.role === n, r.appendChild(o), r.append(" ", Pe(n)), K.appendChild(r), q.set(n, o);
  }
  x.append(w, K, M), p && (w.hidden = !0, m ? c = N(F({}, c), { kind: "bg" }) : d && (c = N(F({}, c), { kind: d })));
  const E = document.createElement("fieldset");
  E.className = "nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type", i || (E.hidden = !0);
  const W = document.createElement("p");
  W.className = "nce-theme-swatch-picker__column-title", W.textContent = "Foreground Type", E.appendChild(W);
  const J = /* @__PURE__ */ new Map();
  let Q = s;
  for (const n of ["mono", "tonal"]) {
    const r = document.createElement("label");
    r.className = "nce-theme-swatch-picker__radio";
    const o = document.createElement("input");
    o.type = "radio", o.name = "nce-tsp-fg-type", o.value = n, o.checked = Q === n, r.appendChild(o), r.append(" ", He[n]), E.appendChild(r), J.set(n, o);
  }
  i && M.appendChild(E);
  const D = () => {
    var r;
    const n = ((r = [...J.entries()].find(([, o]) => o.checked)) == null ? void 0 : r[0]) || Q;
    return Q = n, n;
  }, X = document.createElement("div");
  X.className = "nce-theme-swatch-picker__status";
  const R = document.createElement("div");
  R.className = "nce-theme-swatch-picker__status-main";
  const Z = document.createElement("span");
  Z.className = "nce-theme-swatch-picker__selected-label", Z.textContent = "Selected:";
  const V = document.createElement("code");
  V.className = "nce-theme-swatch-picker__selected-value", R.append(Z, V);
  const T = document.createElement("button");
  T.type = "button", T.className = "nce-theme-swatch-picker__link-btn", T.textContent = "Show in Themes App", T.addEventListener("click", () => {
    const n = new URLSearchParams();
    t && n.set("theme", t), e.styleKey && n.set("style", e.styleKey);
    const r = ce(V.textContent || "");
    r && (n.set("role", r.role), n.set("kind", r.kind), n.set("shade", String(r.shade)));
    const o = `${window.location.origin}/themes/theme-settings?${n.toString()}`, h = window.open(o, "nce-themes-app");
    h == null || h.focus();
  }), R.append(T);
  const ee = document.createElement("div");
  ee.className = "nce-theme-swatch-picker__actions";
  const S = document.createElement("button");
  S.type = "button", S.className = "nce-theme-swatch-picker__btn", S.textContent = "Cancel";
  const C = document.createElement("button");
  C.type = "button", C.className = "nce-theme-swatch-picker__btn nce-theme-swatch-picker__btn--primary", C.textContent = "Apply", ee.append(S, C), X.append(R, ee);
  const O = document.createElement("div");
  O.className = "nce-theme-swatch-picker__footer";
  const oe = (n) => {
    if (!n) {
      O.textContent = "Theme: (site default — no theme selected)";
      return;
    }
    O.textContent = `Theme: ${n}`;
  };
  oe(t), u.append(x, X, O), l.appendChild(u), g.appendChild(l);
  let _ = null;
  const b = () => {
    var h, f;
    const n = m ? "bg" : d || ((h = [...Y.entries()].find(([, y]) => y.checked)) == null ? void 0 : h[0]) || c.kind, r = ((f = [...q.entries()].find(([, y]) => y.checked)) == null ? void 0 : f[0]) || c.role, o = _ != null ? _ : c.shade;
    return { kind: n, role: r, shade: o };
  }, I = (n) => {
    const r = b(), o = n != null ? n : v(r.kind, r.role, r.shade);
    V.textContent = o;
  }, B = () => {
    if (!e.previewOnPick) return;
    const n = b();
    e.setFgType && e.setFgType(D()), e.setValue(v(n.kind, n.role, n.shade));
  }, fe = (n) => {
    c = N(F({}, b()), { shade: n }), _ = null, L(), B();
  };
  e.previewOnPick && (A = () => {
    e.setFgType && e.setFgType(s), e.setValue(a);
  });
  const ge = () => {
    const n = b(), r = v(n.kind, n.role, n.shade);
    try {
      e.setFgType && e.setFgType(D()), e.setValue(r);
    } catch (o) {
      return console.error("[themeSwatchPicker] setValue failed:", o), !1;
    }
    return !0;
  };
  S.addEventListener("click", () => k({ saved: !1 })), C.addEventListener("click", () => {
    ge() && k({ saved: !0 });
  });
  const L = () => {
    const n = b(), r = D(), o = i;
    _ = null, $.replaceChildren();
    for (const h of $e(n.role)) {
      const f = document.createElement("button");
      if (f.type = "button", f.className = `nce-theme-swatch-picker__swatch theme-bg-${n.role}-${h}`, f.title = v(n.kind, n.role, h), n.shade === h && f.classList.add("nce-theme-swatch-picker__swatch--preview"), Ye(n.role, o)) {
        const y = document.createElement("span");
        y.className = "nce-theme-swatch-picker__swatch-label " + Re(n.role, h, r), y.textContent = "Text", f.appendChild(y);
      }
      f.addEventListener("mouseenter", () => {
        _ = h, I(v(n.kind, n.role, h));
      }), f.addEventListener("mouseleave", () => {
        _ = null, I();
      }), f.addEventListener("click", () => {
        fe(h);
      }), $.appendChild(f);
    }
    I();
  };
  for (const n of Y.values())
    n.addEventListener("change", () => {
      c = b(), L(), B();
    });
  for (const n of q.values())
    n.addEventListener("change", () => {
      c = b(), L(), B();
    });
  for (const n of J.values())
    n.addEventListener("change", () => {
      D(), L(), B();
    });
  return L(), {
    root: g,
    updateSelected: I,
    refreshThemeScope: (n) => {
      n ? u.setAttribute("data-nce-theme", n) : u.removeAttribute("data-nce-theme"), oe(n);
    }
  };
}
function k(e = { saved: !1 }) {
  if (!e.saved && A) {
    const c = A;
    A = null;
    try {
      c();
    } catch (a) {
      console.error("[themeSwatchPicker] restore failed:", a);
    }
  } else
    A = null;
  z && (document.removeEventListener("keydown", z), z = null), P && (P.remove(), P = null);
  const t = ne;
  ne = null, t == null || t(e);
}
function re() {
  return P !== null;
}
function H(e) {
  var m;
  re() && k({ saved: !1 }), Ue(), je();
  const t = Ge(e.getThemeSlug());
  if (!t)
    return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."), pe("no_theme_selected"), !1;
  const c = (e.getValue() || "").trim();
  let a = Me(c);
  e.lockKind && (a = N(F({}, a), { kind: e.lockKind }));
  const s = e.getFgType ? De(e.getFgType()) : "mono", { root: i } = qe(
    e,
    t,
    a,
    c,
    s
  );
  return document.body.appendChild(i), P = i, ne = (m = e.onClose) != null ? m : null, z = (d) => {
    d.key === "Escape" && (d.preventDefault(), k({ saved: !1 }));
  }, document.addEventListener("keydown", z), !0;
}
function We() {
  var t;
  if (typeof window == "undefined") return null;
  const e = window.frappe;
  return (t = e == null ? void 0 : e.db) != null ? t : null;
}
function Je(e) {
  return te(this, null, function* () {
    var a;
    const t = (e || "").trim();
    if (!t) return "";
    const c = We();
    if (!c)
      return console.warn(
        "[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"
      ), "";
    try {
      if (!c.exists("NCE Theme", t))
        return console.warn(`[themeSwatchPicker] NCE Theme "${t}" not found`), "";
      const s = yield c.get_value("NCE Theme", t, ["slug", "status"]), i = (a = s.message) != null ? a : s, m = ((i == null ? void 0 : i.slug) || "").trim();
      return (i == null ? void 0 : i.status) === "Active" && m ? m : (console.warn(
        `[themeSwatchPicker] theme "${t}" is not Active or has no slug`
      ), "");
    } catch (s) {
      return console.error("[themeSwatchPicker] slug lookup failed:", s), "";
    }
  });
}
function Qe(e, t) {
  if (t) return t;
  if (e.endsWith("_bg_class"))
    return e.replace(/_bg_class$/, "_fg_type");
}
function Xe(e) {
  return te(this, null, function* () {
    var p, g;
    const { frm: t, themeField: c, valueField: a } = e, s = Qe(a, e.fgTypeField), i = String((p = t.doc[c]) != null ? p : "");
    let m = yield Je(i);
    if (!m)
      return console.warn(
        "[themeSwatchPicker] no Active theme slug for field — open cancelled."
      ), pe(Oe(i)), !1;
    const d = {
      getThemeSlug: () => m,
      styleKey: (g = e.styleKey) != null ? g : a,
      getValue: () => {
        var l;
        return String((l = t.doc[a]) != null ? l : "");
      },
      setValue: (l) => {
        try {
          t.set_value(a, l);
        } catch (u) {
          throw console.error("[themeSwatchPicker] frm.set_value failed:", u), u;
        }
      }
    };
    return s && (d.getFgType = () => {
      var l;
      return String((l = t.doc[s]) != null ? l : "mono");
    }, d.setFgType = (l) => {
      try {
        t.set_value(s, l);
      } catch (u) {
        throw console.error("[themeSwatchPicker] frm.set_value fg type failed:", u), u;
      }
    }), e.lockKind && (d.lockKind = e.lockKind), new Promise((l) => {
      d.onClose = (x) => {
        var w;
        (w = e.onClose) == null || w.call(e), l(x.saved);
      }, H(d) || l(!1);
    });
  });
}
function Ze(e) {
  e.ui.themeSwatchPicker = {
    open: Xe,
    close: k
  };
}
function le(e) {
  var t, c;
  return e instanceof HTMLInputElement || e instanceof HTMLSelectElement ? e.value : (c = (t = e.textContent) == null ? void 0 : t.trim()) != null ? c : "";
}
function et(e, t) {
  if (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement) {
    e.value = t, e.dispatchEvent(new Event("input", { bubbles: !0 })), e.dispatchEvent(new Event("change", { bubbles: !0 }));
    return;
  }
  e.textContent = t;
}
function ue(e) {
  const { themeFieldEl: t, valueFieldEl: c } = e, a = {
    getThemeSlug: () => le(t),
    getValue: () => le(c),
    setValue: (s) => et(c, s),
    onClose: e.onClose
  };
  return H(a);
}
function tt(e) {
  e.themeSwatchPicker = {
    open: ue,
    openCore: H,
    close: k,
    isOpen: re
  };
}
const ct = {
  open: ue,
  openCore: H,
  close: k,
  isOpen: re,
  parseThemeClass: ce,
  composeThemeClass: v
};
if (typeof window != "undefined") {
  tt(window);
  const e = window.frappe;
  e != null && e.ui && Ze(e);
}
export {
  k as close,
  v as composeThemeClass,
  ct as default,
  re as isOpen,
  H as open,
  Xe as openDeskThemeSwatchPicker,
  ue as openStandaloneThemeSwatchPicker,
  ce as parseThemeClass
};
//# sourceMappingURL=theme-swatch-picker.es.js.map
