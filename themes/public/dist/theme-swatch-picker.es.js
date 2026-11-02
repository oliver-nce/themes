var fe = Object.defineProperty, ge = Object.defineProperties;
var we = Object.getOwnPropertyDescriptors;
var re = Object.getOwnPropertySymbols;
var ke = Object.prototype.hasOwnProperty, _e = Object.prototype.propertyIsEnumerable;
var oe = (e, t, c) => t in e ? fe(e, t, { enumerable: !0, configurable: !0, writable: !0, value: c }) : e[t] = c, L = (e, t) => {
  for (var c in t || (t = {}))
    ke.call(t, c) && oe(e, c, t[c]);
  if (re)
    for (var c of re(t))
      _e.call(t, c) && oe(e, c, t[c]);
  return e;
}, F = (e, t) => ge(e, we(t));
var Z = (e, t, c) => new Promise((i, a) => {
  var s = (p) => {
    try {
      d(c.next(p));
    } catch (g) {
      a(g);
    }
  }, m = (p) => {
    try {
      d(c.throw(p));
    } catch (g) {
      a(g);
    }
  }, d = (p) => p.done ? i(p.value) : Promise.resolve(p.value).then(s, m);
  d((c = c.apply(e, t)).next());
});
const ie = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950], le = ["primary", "secondary", "accent", "success", "info", "warning", "danger", "neutral"], de = ["bg", "text", "border"], be = ["primary", "secondary"], ye = "bg", ve = "primary", xe = "mono", Ee = new Set(le), Te = new Set(de), Se = new Set(ie);
function Ce(e) {
  return Te.has(e);
}
function Le(e) {
  return Ee.has(e);
}
function Fe(e) {
  return Se.has(e);
}
function Ne(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
const Ae = /^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;
function te(e) {
  const t = (e || "").trim();
  if (!t) return null;
  const c = Ae.exec(t);
  if (!c) return null;
  const i = c[1], a = c[2], s = Number(c[3]);
  return !Ce(i) || !Le(a) || !Fe(s) ? null : { kind: i, role: a, shade: s };
}
function N(e, t, c) {
  return `theme-${e}-${t}-${c}`;
}
function Pe() {
  return {
    kind: ye,
    role: ve,
    shade: 500
  };
}
function ze(e) {
  var t;
  return (t = te(e)) != null ? t : Pe();
}
function Ke(e) {
  return ie;
}
function Me(e) {
  return (e || "").trim().toLowerCase() === "tonal" ? "tonal" : xe;
}
function $e(e, t, c) {
  return `theme-text-${e}-${t}${c === "tonal" ? "-fg-tonal" : "-fg"}`;
}
const De = {
  no_theme_selected: {
    title: "Theme required",
    body: "Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."
  },
  theme_not_available: {
    title: "Theme not available",
    body: "The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."
  }
};
function Re(e) {
  return (e || "").trim() ? "theme_not_available" : "no_theme_selected";
}
function me(e) {
  const { title: t, body: c } = De[e];
  if (typeof window == "undefined") return;
  const i = window.frappe;
  if (i != null && i.msgprint) {
    i.msgprint({ title: t, message: c, indicator: "orange" });
    return;
  }
  const a = document.createElement("div");
  a.setAttribute("role", "alert"), a.style.cssText = "position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;", a.innerHTML = `<p style="margin:0 0 .5rem;font-weight:600;">${t}</p><p style="margin:0;color:#374151;">${c}</p>`;
  const s = document.createElement("div");
  s.style.cssText = "position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";
  const m = () => {
    s.remove(), a.remove();
  };
  s.addEventListener("click", m), a.addEventListener("click", m), document.body.append(s, a);
}
const Ve = `/*
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
let A = null, P = null, ee = null, ae = !1;
const Ie = {
  bg: "Bg",
  text: "Text",
  border: "Border"
}, Oe = {
  mono: "Mono",
  tonal: "Tonal"
};
function Be() {
  if (ae || typeof document == "undefined") return;
  const e = document.createElement("style");
  e.setAttribute("data-nce-theme-swatch-picker", ""), e.textContent = Ve, document.head.appendChild(e), ae = !0;
}
function He() {
  if (typeof document == "undefined") return;
  const e = document.createElement("div");
  e.className = "theme-bg-primary-500", e.style.display = "none", document.body.appendChild(e);
  const t = getComputedStyle(e).backgroundColor;
  e.remove(), (!t || t === "rgba(0, 0, 0, 0)" || t === "transparent") && console.warn(
    "[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint."
  );
}
function Ue(e) {
  return (e || "").trim();
}
function je(e, t) {
  return t ? !0 : be.includes(e);
}
function Ge(e, t, c, i, a) {
  const s = !!(e.getFgType && e.setFgType), m = s, d = e.lockKind, p = m || !!d, g = document.createElement("div");
  g.className = "nce-theme-swatch-picker__backdrop", g.addEventListener("click", () => k({ saved: !1 }));
  const l = document.createElement("div");
  l.className = "nce-theme-swatch-picker nce-theme-swatch-picker__modal", l.setAttribute("role", "dialog"), l.setAttribute("aria-modal", "true"), l.setAttribute("aria-label", "Theme swatch picker"), l.addEventListener("click", (n) => n.stopPropagation());
  const u = document.createElement("div");
  t && u.setAttribute("data-nce-theme", t);
  const v = document.createElement("div");
  v.className = m ? "nce-theme-swatch-picker__layout nce-theme-swatch-picker__layout--chrome-pick" : "nce-theme-swatch-picker__layout";
  const w = document.createElement("fieldset");
  w.className = "nce-theme-swatch-picker__radios";
  const O = document.createElement("p");
  O.className = "nce-theme-swatch-picker__column-title", O.textContent = "Kind", w.appendChild(O);
  const z = document.createElement("fieldset");
  z.className = "nce-theme-swatch-picker__radios";
  const B = document.createElement("p");
  B.className = "nce-theme-swatch-picker__column-title", B.textContent = "Role", z.appendChild(B);
  const K = document.createElement("div"), H = document.createElement("p");
  H.className = "nce-theme-swatch-picker__column-title", H.textContent = "Swatches", K.appendChild(H);
  const M = document.createElement("div");
  M.className = "nce-theme-swatch-picker__swatch-strip", K.appendChild(M);
  const U = /* @__PURE__ */ new Map();
  for (const n of de) {
    const r = document.createElement("label");
    r.className = "nce-theme-swatch-picker__radio";
    const o = document.createElement("input");
    o.type = "radio", o.name = "nce-tsp-kind", o.value = n, o.checked = c.kind === n, r.appendChild(o), r.append(" ", Ie[n]), w.appendChild(r), U.set(n, o);
  }
  const j = /* @__PURE__ */ new Map();
  for (const n of le) {
    const r = document.createElement("label");
    r.className = "nce-theme-swatch-picker__radio";
    const o = document.createElement("input");
    o.type = "radio", o.name = "nce-tsp-role", o.value = n, o.checked = c.role === n, r.appendChild(o), r.append(" ", Ne(n)), z.appendChild(r), j.set(n, o);
  }
  v.append(w, z, K), p && (w.hidden = !0, m ? c = F(L({}, c), { kind: "bg" }) : d && (c = F(L({}, c), { kind: d })));
  const x = document.createElement("fieldset");
  x.className = "nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type", s || (x.hidden = !0);
  const G = document.createElement("p");
  G.className = "nce-theme-swatch-picker__column-title", G.textContent = "Foreground Type", x.appendChild(G);
  const Y = /* @__PURE__ */ new Map();
  let q = a;
  for (const n of ["mono", "tonal"]) {
    const r = document.createElement("label");
    r.className = "nce-theme-swatch-picker__radio";
    const o = document.createElement("input");
    o.type = "radio", o.name = "nce-tsp-fg-type", o.value = n, o.checked = q === n, r.appendChild(o), r.append(" ", Oe[n]), x.appendChild(r), Y.set(n, o);
  }
  s && K.appendChild(x);
  const W = () => {
    var r;
    const n = ((r = [...Y.entries()].find(([, o]) => o.checked)) == null ? void 0 : r[0]) || q;
    return q = n, n;
  }, J = document.createElement("div");
  J.className = "nce-theme-swatch-picker__status";
  const $ = document.createElement("div");
  $.className = "nce-theme-swatch-picker__status-main";
  const Q = document.createElement("span");
  Q.className = "nce-theme-swatch-picker__selected-label", Q.textContent = "Selected:";
  const D = document.createElement("code");
  D.className = "nce-theme-swatch-picker__selected-value", $.append(Q, D);
  const E = document.createElement("button");
  E.type = "button", E.className = "nce-theme-swatch-picker__link-btn", E.textContent = "Show in Themes App", E.addEventListener("click", () => {
    const n = new URLSearchParams();
    t && n.set("theme", t), e.styleKey && n.set("style", e.styleKey);
    const r = te(D.textContent || "");
    r && (n.set("role", r.role), n.set("kind", r.kind), n.set("shade", String(r.shade)));
    const o = `${window.location.origin}/themes/theme-settings?${n.toString()}`, h = window.open(o, "nce-themes-app");
    h == null || h.focus();
  }), $.append(E);
  const X = document.createElement("div");
  X.className = "nce-theme-swatch-picker__actions";
  const T = document.createElement("button");
  T.type = "button", T.className = "nce-theme-swatch-picker__btn", T.textContent = "Cancel";
  const S = document.createElement("button");
  S.type = "button", S.className = "nce-theme-swatch-picker__btn nce-theme-swatch-picker__btn--primary", S.textContent = "Apply", X.append(T, S), J.append($, X);
  const R = document.createElement("div");
  R.className = "nce-theme-swatch-picker__footer";
  const ce = (n) => {
    if (!n) {
      R.textContent = "Theme: (site default — no theme selected)";
      return;
    }
    R.textContent = `Theme: ${n}`;
  };
  ce(t), u.append(v, J, R), l.appendChild(u), g.appendChild(l);
  let _ = null;
  const y = () => {
    var h, f;
    const n = m ? "bg" : d || ((h = [...U.entries()].find(([, b]) => b.checked)) == null ? void 0 : h[0]) || c.kind, r = ((f = [...j.entries()].find(([, b]) => b.checked)) == null ? void 0 : f[0]) || c.role, o = _ != null ? _ : c.shade;
    return { kind: n, role: r, shade: o };
  }, V = (n) => {
    const r = y(), o = n != null ? n : N(r.kind, r.role, r.shade);
    D.textContent = o;
  }, pe = (n) => {
    c = F(L({}, y()), { shade: n }), _ = null, C();
  }, ue = () => {
    const n = y(), r = N(n.kind, n.role, n.shade);
    try {
      e.setFgType && e.setFgType(W()), e.setValue(r);
    } catch (o) {
      return console.error("[themeSwatchPicker] setValue failed:", o), !1;
    }
    return !0;
  };
  T.addEventListener("click", () => k({ saved: !1 })), S.addEventListener("click", () => {
    ue() && k({ saved: !0 });
  });
  const C = () => {
    const n = y(), r = W(), o = s;
    _ = null, M.replaceChildren();
    for (const h of Ke(n.role)) {
      const f = document.createElement("button");
      if (f.type = "button", f.className = `nce-theme-swatch-picker__swatch theme-bg-${n.role}-${h}`, f.title = N(n.kind, n.role, h), n.shade === h && f.classList.add("nce-theme-swatch-picker__swatch--preview"), je(n.role, o)) {
        const b = document.createElement("span");
        b.className = "nce-theme-swatch-picker__swatch-label " + $e(n.role, h, r), b.textContent = "Text", f.appendChild(b);
      }
      f.addEventListener("mouseenter", () => {
        _ = h, V(N(n.kind, n.role, h));
      }), f.addEventListener("mouseleave", () => {
        _ = null, V();
      }), f.addEventListener("click", () => {
        pe(h);
      }), M.appendChild(f);
    }
    V();
  };
  for (const n of U.values())
    n.addEventListener("change", () => {
      c = y(), C();
    });
  for (const n of j.values())
    n.addEventListener("change", () => {
      c = y(), C();
    });
  for (const n of Y.values())
    n.addEventListener("change", () => {
      W(), C();
    });
  return C(), {
    root: g,
    updateSelected: V,
    refreshThemeScope: (n) => {
      n ? u.setAttribute("data-nce-theme", n) : u.removeAttribute("data-nce-theme"), ce(n);
    }
  };
}
function k(e = { saved: !1 }) {
  P && (document.removeEventListener("keydown", P), P = null), A && (A.remove(), A = null);
  const t = ee;
  ee = null, t == null || t(e);
}
function ne() {
  return A !== null;
}
function I(e) {
  var m;
  ne() && k({ saved: !1 }), Be(), He();
  const t = Ue(e.getThemeSlug());
  if (!t)
    return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."), me("no_theme_selected"), !1;
  const c = (e.getValue() || "").trim();
  let i = ze(c);
  e.lockKind && (i = F(L({}, i), { kind: e.lockKind }));
  const a = e.getFgType ? Me(e.getFgType()) : "mono", { root: s } = Ge(
    e,
    t,
    i,
    c,
    a
  );
  return document.body.appendChild(s), A = s, ee = (m = e.onClose) != null ? m : null, P = (d) => {
    d.key === "Escape" && (d.preventDefault(), k({ saved: !1 }));
  }, document.addEventListener("keydown", P), !0;
}
function Ye() {
  var t;
  if (typeof window == "undefined") return null;
  const e = window.frappe;
  return (t = e == null ? void 0 : e.db) != null ? t : null;
}
function qe(e) {
  return Z(this, null, function* () {
    var i;
    const t = (e || "").trim();
    if (!t) return "";
    const c = Ye();
    if (!c)
      return console.warn(
        "[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"
      ), "";
    try {
      if (!c.exists("NCE Theme", t))
        return console.warn(`[themeSwatchPicker] NCE Theme "${t}" not found`), "";
      const a = yield c.get_value("NCE Theme", t, ["slug", "status"]), s = (i = a.message) != null ? i : a, m = ((s == null ? void 0 : s.slug) || "").trim();
      return (s == null ? void 0 : s.status) === "Active" && m ? m : (console.warn(
        `[themeSwatchPicker] theme "${t}" is not Active or has no slug`
      ), "");
    } catch (a) {
      return console.error("[themeSwatchPicker] slug lookup failed:", a), "";
    }
  });
}
function We(e, t) {
  if (t) return t;
  if (e.endsWith("_bg_class"))
    return e.replace(/_bg_class$/, "_fg_type");
}
function Je(e) {
  return Z(this, null, function* () {
    var p, g;
    const { frm: t, themeField: c, valueField: i } = e, a = We(i, e.fgTypeField), s = String((p = t.doc[c]) != null ? p : "");
    let m = yield qe(s);
    if (!m)
      return console.warn(
        "[themeSwatchPicker] no Active theme slug for field — open cancelled."
      ), me(Re(s)), !1;
    const d = {
      getThemeSlug: () => m,
      styleKey: (g = e.styleKey) != null ? g : i,
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
    return a && (d.getFgType = () => {
      var l;
      return String((l = t.doc[a]) != null ? l : "mono");
    }, d.setFgType = (l) => {
      try {
        t.set_value(a, l);
      } catch (u) {
        throw console.error("[themeSwatchPicker] frm.set_value fg type failed:", u), u;
      }
    }), e.lockKind && (d.lockKind = e.lockKind), new Promise((l) => {
      d.onClose = (v) => {
        var w;
        (w = e.onClose) == null || w.call(e), l(v.saved);
      }, I(d) || l(!1);
    });
  });
}
function Qe(e) {
  e.ui.themeSwatchPicker = {
    open: Je,
    close: k
  };
}
function se(e) {
  var t, c;
  return e instanceof HTMLInputElement || e instanceof HTMLSelectElement ? e.value : (c = (t = e.textContent) == null ? void 0 : t.trim()) != null ? c : "";
}
function Xe(e, t) {
  if (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement) {
    e.value = t, e.dispatchEvent(new Event("input", { bubbles: !0 })), e.dispatchEvent(new Event("change", { bubbles: !0 }));
    return;
  }
  e.textContent = t;
}
function he(e) {
  const { themeFieldEl: t, valueFieldEl: c } = e, i = {
    getThemeSlug: () => se(t),
    getValue: () => se(c),
    setValue: (a) => Xe(c, a),
    onClose: e.onClose
  };
  return I(i);
}
function Ze(e) {
  e.themeSwatchPicker = {
    open: he,
    openCore: I,
    close: k,
    isOpen: ne
  };
}
const tt = {
  open: he,
  openCore: I,
  close: k,
  isOpen: ne,
  parseThemeClass: te,
  composeThemeClass: N
};
if (typeof window != "undefined") {
  Ze(window);
  const e = window.frappe;
  e != null && e.ui && Qe(e);
}
export {
  k as close,
  N as composeThemeClass,
  tt as default,
  ne as isOpen,
  I as open,
  Je as openDeskThemeSwatchPicker,
  he as openStandaloneThemeSwatchPicker,
  te as parseThemeClass
};
//# sourceMappingURL=theme-swatch-picker.es.js.map
