var ue = Object.defineProperty, fe = Object.defineProperties;
var ge = Object.getOwnPropertyDescriptors;
var ee = Object.getOwnPropertySymbols;
var we = Object.prototype.hasOwnProperty, ke = Object.prototype.propertyIsEnumerable;
var te = (e, t, n) => t in e ? ue(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, C = (e, t) => {
  for (var n in t || (t = {}))
    we.call(t, n) && te(e, n, t[n]);
  if (ee)
    for (var n of ee(t))
      ke.call(t, n) && te(e, n, t[n]);
  return e;
}, F = (e, t) => fe(e, ge(t));
var Q = (e, t, n) => new Promise((i, o) => {
  var a = (p) => {
    try {
      d(n.next(p));
    } catch (l) {
      o(l);
    }
  }, m = (p) => {
    try {
      d(n.throw(p));
    } catch (l) {
      o(l);
    }
  }, d = (p) => p.done ? i(p.value) : Promise.resolve(p.value).then(a, m);
  d((n = n.apply(e, t)).next());
});
const re = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950], oe = ["primary", "secondary", "accent", "success", "info", "warning", "danger", "neutral"], ae = ["bg", "text", "border"], _e = ["primary", "secondary"], be = "bg", ve = "primary", ye = "mono", Ee = new Set(oe), xe = new Set(ae), Te = new Set(re);
function Se(e) {
  return xe.has(e);
}
function Ce(e) {
  return Ee.has(e);
}
function Fe(e) {
  return Te.has(e);
}
function Le(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
const Ne = /^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;
function se(e) {
  const t = (e || "").trim();
  if (!t) return null;
  const n = Ne.exec(t);
  if (!n) return null;
  const i = n[1], o = n[2], a = Number(n[3]);
  return !Se(i) || !Ce(o) || !Fe(a) ? null : { kind: i, role: o, shade: a };
}
function L(e, t, n) {
  return `theme-${e}-${t}-${n}`;
}
function Ae() {
  return {
    kind: be,
    role: ve,
    shade: 500
  };
}
function Pe(e) {
  var t;
  return (t = se(e)) != null ? t : Ae();
}
function ze(e) {
  return re;
}
function Me(e) {
  return (e || "").trim().toLowerCase() === "tonal" ? "tonal" : ye;
}
function De(e, t, n) {
  return `theme-text-${e}-${t}${n === "tonal" ? "-fg-tonal" : "-fg"}`;
}
const $e = {
  no_theme_selected: {
    title: "Theme required",
    body: "Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."
  },
  theme_not_available: {
    title: "Theme not available",
    body: "The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."
  }
};
function Ke(e) {
  return (e || "").trim() ? "theme_not_available" : "no_theme_selected";
}
function ie(e) {
  const { title: t, body: n } = $e[e];
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
const Re = `.nce-theme-swatch-picker {
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
let N = null, A = null, X = null, ne = !1;
const Ve = {
  bg: "Bg",
  text: "Text",
  border: "Border"
}, Ie = {
  mono: "Mono",
  tonal: "Tonal"
};
function Oe() {
  if (ne || typeof document == "undefined") return;
  const e = document.createElement("style");
  e.setAttribute("data-nce-theme-swatch-picker", ""), e.textContent = Re, document.head.appendChild(e), ne = !0;
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
function Be(e) {
  return (e || "").trim();
}
function je(e, t) {
  return t ? !0 : _e.includes(e);
}
function Ue(e, t, n, i, o) {
  const a = !!(e.getFgType && e.setFgType), m = a, d = e.lockKind, p = m || !!d, l = document.createElement("div");
  l.className = "nce-theme-swatch-picker__backdrop", l.addEventListener("click", () => g({ saved: !1 }));
  const h = document.createElement("div");
  h.className = "nce-theme-swatch-picker nce-theme-swatch-picker__modal", h.setAttribute("role", "dialog"), h.setAttribute("aria-modal", "true"), h.setAttribute("aria-label", "Theme swatch picker"), h.addEventListener("click", (c) => c.stopPropagation());
  const w = document.createElement("div");
  t && w.setAttribute("data-nce-theme", t);
  const b = document.createElement("div");
  b.className = m ? "nce-theme-swatch-picker__layout nce-theme-swatch-picker__layout--chrome-pick" : "nce-theme-swatch-picker__layout";
  const y = document.createElement("fieldset");
  y.className = "nce-theme-swatch-picker__radios";
  const K = document.createElement("p");
  K.className = "nce-theme-swatch-picker__column-title", K.textContent = "Kind", y.appendChild(K);
  const P = document.createElement("fieldset");
  P.className = "nce-theme-swatch-picker__radios";
  const R = document.createElement("p");
  R.className = "nce-theme-swatch-picker__column-title", R.textContent = "Role", P.appendChild(R);
  const z = document.createElement("div"), V = document.createElement("p");
  V.className = "nce-theme-swatch-picker__column-title", V.textContent = "Swatches", z.appendChild(V);
  const M = document.createElement("div");
  M.className = "nce-theme-swatch-picker__swatch-strip", z.appendChild(M);
  const I = /* @__PURE__ */ new Map();
  for (const c of ae) {
    const s = document.createElement("label");
    s.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-kind", r.value = c, r.checked = n.kind === c, s.appendChild(r), s.append(" ", Ve[c]), y.appendChild(s), I.set(c, r);
  }
  const O = /* @__PURE__ */ new Map();
  for (const c of oe) {
    const s = document.createElement("label");
    s.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-role", r.value = c, r.checked = n.role === c, s.appendChild(r), s.append(" ", Le(c)), P.appendChild(s), O.set(c, r);
  }
  b.append(y, P, z), p && (y.hidden = !0, m ? n = F(C({}, n), { kind: "bg" }) : d && (n = F(C({}, n), { kind: d })));
  const E = document.createElement("fieldset");
  E.className = "nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type", a || (E.hidden = !0);
  const H = document.createElement("p");
  H.className = "nce-theme-swatch-picker__column-title", H.textContent = "Foreground Type", E.appendChild(H);
  const B = /* @__PURE__ */ new Map();
  let j = o;
  for (const c of ["mono", "tonal"]) {
    const s = document.createElement("label");
    s.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-fg-type", r.value = c, r.checked = j === c, s.appendChild(r), s.append(" ", Ie[c]), E.appendChild(s), B.set(c, r);
  }
  a && z.appendChild(E);
  const U = () => {
    var s;
    const c = ((s = [...B.entries()].find(([, r]) => r.checked)) == null ? void 0 : s[0]) || j;
    return j = c, c;
  }, G = document.createElement("div");
  G.className = "nce-theme-swatch-picker__status";
  const Y = document.createElement("div");
  Y.className = "nce-theme-swatch-picker__status-main";
  const q = document.createElement("span");
  q.className = "nce-theme-swatch-picker__selected-label", q.textContent = "Selected:";
  const W = document.createElement("code");
  W.className = "nce-theme-swatch-picker__selected-value", Y.append(q, W);
  const J = document.createElement("div");
  J.className = "nce-theme-swatch-picker__actions";
  const x = document.createElement("button");
  x.type = "button", x.className = "nce-theme-swatch-picker__btn", x.textContent = "Cancel";
  const T = document.createElement("button");
  T.type = "button", T.className = "nce-theme-swatch-picker__btn nce-theme-swatch-picker__btn--primary", T.textContent = "Save", J.append(x, T), G.append(Y, J);
  const D = document.createElement("div");
  D.className = "nce-theme-swatch-picker__footer";
  const Z = (c) => {
    if (!c) {
      D.textContent = "Theme: (site default — no theme selected)";
      return;
    }
    D.textContent = `Theme: ${c}`;
  };
  Z(t), w.append(b, G, D), h.appendChild(w), l.appendChild(h);
  let k = null;
  const v = () => {
    var f, u;
    const c = m ? "bg" : d || ((f = [...I.entries()].find(([, _]) => _.checked)) == null ? void 0 : f[0]) || n.kind, s = ((u = [...O.entries()].find(([, _]) => _.checked)) == null ? void 0 : u[0]) || n.role, r = k != null ? k : n.shade;
    return { kind: c, role: s, shade: r };
  }, $ = (c) => {
    const s = v(), r = c != null ? c : L(s.kind, s.role, s.shade);
    W.textContent = r;
  }, he = (c) => {
    n = F(C({}, v()), { shade: c }), k = null, S();
  }, pe = () => {
    const c = v(), s = L(c.kind, c.role, c.shade);
    try {
      e.setFgType && e.setFgType(U()), e.setValue(s);
    } catch (r) {
      return console.error("[themeSwatchPicker] setValue failed:", r), !1;
    }
    return !0;
  };
  x.addEventListener("click", () => g({ saved: !1 })), T.addEventListener("click", () => {
    pe() && g({ saved: !0 });
  });
  const S = () => {
    const c = v(), s = U(), r = a;
    k = null, M.replaceChildren();
    for (const f of ze(c.role)) {
      const u = document.createElement("button");
      if (u.type = "button", u.className = `nce-theme-swatch-picker__swatch theme-bg-${c.role}-${f}`, u.title = L(c.kind, c.role, f), c.shade === f && u.classList.add("nce-theme-swatch-picker__swatch--preview"), je(c.role, r)) {
        const _ = document.createElement("span");
        _.className = "nce-theme-swatch-picker__swatch-label " + De(c.role, f, s), _.textContent = "Text", u.appendChild(_);
      }
      u.addEventListener("mouseenter", () => {
        k = f, $(L(c.kind, c.role, f));
      }), u.addEventListener("mouseleave", () => {
        k = null, $();
      }), u.addEventListener("click", () => {
        he(f);
      }), M.appendChild(u);
    }
    $();
  };
  for (const c of I.values())
    c.addEventListener("change", () => {
      n = v(), S();
    });
  for (const c of O.values())
    c.addEventListener("change", () => {
      n = v(), S();
    });
  for (const c of B.values())
    c.addEventListener("change", () => {
      U(), S();
    });
  return S(), {
    root: l,
    updateSelected: $,
    refreshThemeScope: (c) => {
      c ? w.setAttribute("data-nce-theme", c) : w.removeAttribute("data-nce-theme"), Z(c);
    }
  };
}
function g(e = { saved: !1 }) {
  A && (document.removeEventListener("keydown", A), A = null), N && (N.remove(), N = null);
  const t = X;
  X = null, t == null || t(e);
}
function le() {
  return N !== null;
}
function de(e) {
  var m;
  le() && g({ saved: !1 }), Oe(), He();
  const t = Be(e.getThemeSlug());
  if (!t)
    return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."), ie("no_theme_selected"), !1;
  const n = (e.getValue() || "").trim();
  let i = Pe(n);
  e.lockKind && (i = F(C({}, i), { kind: e.lockKind }));
  const o = e.getFgType ? Me(e.getFgType()) : "mono", { root: a } = Ue(
    e,
    t,
    i,
    n,
    o
  );
  return document.body.appendChild(a), N = a, X = (m = e.onClose) != null ? m : null, A = (d) => {
    d.key === "Escape" && (d.preventDefault(), g({ saved: !1 }));
  }, document.addEventListener("keydown", A), !0;
}
function Ge() {
  var t;
  if (typeof window == "undefined") return null;
  const e = window.frappe;
  return (t = e == null ? void 0 : e.db) != null ? t : null;
}
function Ye(e) {
  return Q(this, null, function* () {
    var i;
    const t = (e || "").trim();
    if (!t) return "";
    const n = Ge();
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
function qe(e, t) {
  if (t) return t;
  if (e.endsWith("_bg_class"))
    return e.replace(/_bg_class$/, "_fg_type");
}
function We(e) {
  return Q(this, null, function* () {
    var p;
    const { frm: t, themeField: n, valueField: i } = e, o = qe(i, e.fgTypeField), a = String((p = t.doc[n]) != null ? p : "");
    let m = yield Ye(a);
    if (!m)
      return console.warn(
        "[themeSwatchPicker] no Active theme slug for field — open cancelled."
      ), ie(Ke(a)), !1;
    const d = {
      getThemeSlug: () => m,
      getValue: () => {
        var l;
        return String((l = t.doc[i]) != null ? l : "");
      },
      setValue: (l) => {
        try {
          t.set_value(i, l);
        } catch (h) {
          throw console.error("[themeSwatchPicker] frm.set_value failed:", h), h;
        }
      }
    };
    return o && (d.getFgType = () => {
      var l;
      return String((l = t.doc[o]) != null ? l : "mono");
    }, d.setFgType = (l) => {
      try {
        t.set_value(o, l);
      } catch (h) {
        throw console.error("[themeSwatchPicker] frm.set_value fg type failed:", h), h;
      }
    }), e.lockKind && (d.lockKind = e.lockKind), new Promise((l) => {
      d.onClose = (w) => {
        var b;
        (b = e.onClose) == null || b.call(e), l(w.saved);
      }, de(d) || l(!1);
    });
  });
}
function Je(e) {
  e.ui.themeSwatchPicker = {
    open: We,
    close: g
  };
}
function ce(e) {
  var t, n;
  return e instanceof HTMLInputElement || e instanceof HTMLSelectElement ? e.value : (n = (t = e.textContent) == null ? void 0 : t.trim()) != null ? n : "";
}
function Qe(e, t) {
  if (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement) {
    e.value = t, e.dispatchEvent(new Event("input", { bubbles: !0 })), e.dispatchEvent(new Event("change", { bubbles: !0 }));
    return;
  }
  e.textContent = t;
}
function me(e) {
  const { themeFieldEl: t, valueFieldEl: n } = e, i = {
    getThemeSlug: () => ce(t),
    getValue: () => ce(n),
    setValue: (o) => Qe(n, o),
    onClose: e.onClose
  };
  return de(i);
}
function Xe(e) {
  e.themeSwatchPicker = {
    open: me,
    close: g
  };
}
const et = {
  open: me,
  close: g,
  isOpen: le,
  parseThemeClass: se,
  composeThemeClass: L
};
if (typeof window != "undefined") {
  Xe(window);
  const e = window.frappe;
  e != null && e.ui && Je(e);
}
export {
  g as close,
  L as composeThemeClass,
  et as default,
  le as isOpen,
  de as open,
  We as openDeskThemeSwatchPicker,
  me as openStandaloneThemeSwatchPicker,
  se as parseThemeClass
};
//# sourceMappingURL=theme-swatch-picker.es.js.map
