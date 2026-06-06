var R = (e, n, c) => new Promise((i, r) => {
  var o = (d) => {
    try {
      m(c.next(d));
    } catch (h) {
      r(h);
    }
  }, l = (d) => {
    try {
      m(c.throw(d));
    } catch (h) {
      r(h);
    }
  }, m = (d) => d.done ? i(d.value) : Promise.resolve(d.value).then(o, l);
  m((c = c.apply(e, n)).next());
});
const H = ["bg", "text", "border"], O = [
  "primary",
  "secondary",
  "accent",
  "success",
  "info",
  "warning",
  "danger"
], B = [100, 200, 300, 500, 600, 700, 900], W = ["primary", "secondary"], Y = "bg", J = "primary", Q = new Set(O), X = new Set(H), Z = new Set(B);
function ee(e) {
  return X.has(e);
}
function te(e) {
  return Q.has(e);
}
function ne(e) {
  return Z.has(e);
}
const ce = /^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;
function K(e) {
  const n = (e || "").trim();
  if (!n) return null;
  const c = ce.exec(n);
  if (!c) return null;
  const i = c[1], r = c[2], o = Number(c[3]);
  return !ee(i) || !te(r) || !ne(o) ? null : { kind: i, role: r, shade: o };
}
function p(e, n, c) {
  return `theme-${e}-${n}-${c}`;
}
function re() {
  return {
    kind: Y,
    role: J,
    shade: 500
  };
}
function oe(e) {
  var n;
  return (n = K(e)) != null ? n : re();
}
function ae(e) {
  return B;
}
const se = {
  no_theme_selected: {
    title: "Theme required",
    body: "Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."
  },
  theme_not_available: {
    title: "Theme not available",
    body: "The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."
  }
};
function ie(e) {
  return (e || "").trim() ? "theme_not_available" : "no_theme_selected";
}
function j(e) {
  const { title: n, body: c } = se[e];
  if (typeof window == "undefined") return;
  const i = window.frappe;
  if (i != null && i.msgprint) {
    i.msgprint({ title: n, message: c, indicator: "orange" });
    return;
  }
  const r = document.createElement("div");
  r.setAttribute("role", "alert"), r.style.cssText = "position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;", r.innerHTML = `<p style="margin:0 0 .5rem;font-weight:600;">${n}</p><p style="margin:0;color:#374151;">${c}</p>`;
  const o = document.createElement("div");
  o.style.cssText = "position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";
  const l = () => {
    o.remove(), r.remove();
  };
  o.addEventListener("click", l), r.addEventListener("click", l), document.body.append(o, r);
}
const le = `.nce-theme-swatch-picker {
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
let g = null, k = null, M = null, I = !1;
const de = {
  bg: "Bg",
  text: "Text",
  border: "Border"
}, me = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  success: "Success",
  info: "Info",
  warning: "Warning",
  danger: "Danger"
};
function he() {
  if (I || typeof document == "undefined") return;
  const e = document.createElement("style");
  e.setAttribute("data-nce-theme-swatch-picker", ""), e.textContent = le, document.head.appendChild(e), I = !0;
}
function ue() {
  if (typeof document == "undefined") return;
  const e = document.createElement("div");
  e.className = "theme-bg-primary-500", e.style.display = "none", document.body.appendChild(e);
  const n = getComputedStyle(e).backgroundColor;
  e.remove(), (!n || n === "rgba(0, 0, 0, 0)" || n === "transparent") && console.warn(
    "[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint."
  );
}
function pe(e) {
  return (e || "").trim();
}
function fe(e) {
  return W.includes(e);
}
function we(e, n, c, i) {
  const r = document.createElement("div");
  r.className = "nce-theme-swatch-picker__backdrop", r.addEventListener("click", () => f());
  const o = document.createElement("div");
  o.className = "nce-theme-swatch-picker nce-theme-swatch-picker__modal", o.setAttribute("role", "dialog"), o.setAttribute("aria-modal", "true"), o.setAttribute("aria-label", "Theme swatch picker"), o.addEventListener("click", (t) => t.stopPropagation());
  const l = document.createElement("div");
  n && l.setAttribute("data-nce-theme", n);
  const m = document.createElement("div");
  m.className = "nce-theme-swatch-picker__layout";
  const d = document.createElement("fieldset");
  d.className = "nce-theme-swatch-picker__radios";
  const h = document.createElement("p");
  h.className = "nce-theme-swatch-picker__column-title", h.textContent = "Kind", d.appendChild(h);
  const b = document.createElement("fieldset");
  b.className = "nce-theme-swatch-picker__radios";
  const S = document.createElement("p");
  S.className = "nce-theme-swatch-picker__column-title", S.textContent = "Role", b.appendChild(S);
  const T = document.createElement("div"), C = document.createElement("p");
  C.className = "nce-theme-swatch-picker__column-title", C.textContent = "Swatches", T.appendChild(C);
  const _ = document.createElement("div");
  _.className = "nce-theme-swatch-picker__swatch-strip", T.appendChild(_);
  const L = /* @__PURE__ */ new Map();
  for (const t of H) {
    const s = document.createElement("label");
    s.className = "nce-theme-swatch-picker__radio";
    const a = document.createElement("input");
    a.type = "radio", a.name = "nce-tsp-kind", a.value = t, a.checked = c.kind === t, s.appendChild(a), s.append(" ", de[t]), d.appendChild(s), L.set(t, a);
  }
  const N = /* @__PURE__ */ new Map();
  for (const t of O) {
    const s = document.createElement("label");
    s.className = "nce-theme-swatch-picker__radio";
    const a = document.createElement("input");
    a.type = "radio", a.name = "nce-tsp-role", a.value = t, a.checked = c.role === t, s.appendChild(a), s.append(" ", me[t]), b.appendChild(s), N.set(t, a);
  }
  m.append(d, b, T);
  const A = document.createElement("div");
  A.className = "nce-theme-swatch-picker__status";
  const P = document.createElement("span");
  P.className = "nce-theme-swatch-picker__selected-label", P.textContent = "Selected:";
  const z = document.createElement("code");
  z.className = "nce-theme-swatch-picker__selected-value", A.append(P, z);
  const v = document.createElement("div");
  v.className = "nce-theme-swatch-picker__footer";
  const $ = (t) => {
    if (!t) {
      v.textContent = "Theme: (site default — no theme selected)";
      return;
    }
    v.textContent = `Theme: ${t}`;
  };
  $(n), l.append(m, A, v), o.appendChild(l), r.appendChild(o);
  let w = null;
  const y = () => {
    var u, x;
    const t = ((u = [...L.entries()].find(([, F]) => F.checked)) == null ? void 0 : u[0]) || c.kind, s = ((x = [...N.entries()].find(([, F]) => F.checked)) == null ? void 0 : x[0]) || c.role, a = w != null ? w : c.shade;
    return { kind: t, role: s, shade: a };
  }, E = (t) => {
    const s = y(), a = t != null ? t : p(s.kind, s.role, s.shade);
    z.textContent = a;
  }, D = () => {
    const t = y();
    w = null, _.replaceChildren();
    for (const s of ae(t.role)) {
      const a = document.createElement("button");
      if (a.type = "button", a.className = `nce-theme-swatch-picker__swatch theme-bg-${t.role}-${s}`, a.title = p(t.kind, t.role, s), t.shade === s && a.classList.add("nce-theme-swatch-picker__swatch--preview"), fe(t.role)) {
        const u = document.createElement("span");
        u.className = `nce-theme-swatch-picker__swatch-label theme-text-${t.role}-${s}-fg`, u.textContent = "Text", a.appendChild(u);
      }
      a.addEventListener("mouseenter", () => {
        w = s, E(p(t.kind, t.role, s));
      }), a.addEventListener("mouseleave", () => {
        w = null, E(i || p(t.kind, t.role, t.shade));
      }), a.addEventListener("click", () => {
        const u = p(t.kind, t.role, s);
        try {
          e.setValue(u);
        } catch (x) {
          console.error("[themeSwatchPicker] setValue failed:", x);
          return;
        }
        f();
      }), _.appendChild(a);
    }
    E(
      i || p(t.kind, t.role, t.shade)
    );
  };
  for (const t of L.values())
    t.addEventListener("change", () => {
      c = y(), D();
    });
  for (const t of N.values())
    t.addEventListener("change", () => {
      c = y(), D();
    });
  return D(), {
    root: r,
    updateSelected: E,
    refreshThemeScope: (t) => {
      t ? l.setAttribute("data-nce-theme", t) : l.removeAttribute("data-nce-theme"), $(t);
    }
  };
}
function f() {
  k && (document.removeEventListener("keydown", k), k = null), g && (g.remove(), g = null);
  const e = M;
  M = null, e == null || e();
}
function U() {
  return g !== null;
}
function q(e) {
  var o;
  U() && f(), he(), ue();
  const n = pe(e.getThemeSlug());
  if (!n)
    return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."), j("no_theme_selected"), !1;
  const c = (e.getValue() || "").trim(), i = oe(c), { root: r } = we(
    e,
    n,
    i,
    c
  );
  return document.body.appendChild(r), g = r, M = (o = e.onClose) != null ? o : null, k = (l) => {
    l.key === "Escape" && (l.preventDefault(), f());
  }, document.addEventListener("keydown", k), !0;
}
function ge() {
  var n;
  if (typeof window == "undefined") return null;
  const e = window.frappe;
  return (n = e == null ? void 0 : e.db) != null ? n : null;
}
function ke(e) {
  return R(this, null, function* () {
    var i;
    const n = (e || "").trim();
    if (!n) return "";
    const c = ge();
    if (!c)
      return console.warn(
        "[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"
      ), "";
    try {
      if (!c.exists("NCE Theme", n))
        return console.warn(`[themeSwatchPicker] NCE Theme "${n}" not found`), "";
      const r = yield c.get_value("NCE Theme", n, ["slug", "status"]), o = (i = r.message) != null ? i : r, l = ((o == null ? void 0 : o.slug) || "").trim();
      return (o == null ? void 0 : o.status) === "Active" && l ? l : (console.warn(
        `[themeSwatchPicker] theme "${n}" is not Active or has no slug`
      ), "");
    } catch (r) {
      return console.error("[themeSwatchPicker] slug lookup failed:", r), "";
    }
  });
}
function be(e) {
  return R(this, null, function* () {
    var m;
    const { frm: n, themeField: c, valueField: i } = e, r = String((m = n.doc[c]) != null ? m : "");
    let o = yield ke(r);
    if (!o)
      return console.warn(
        "[themeSwatchPicker] no Active theme slug for field — open cancelled."
      ), j(ie(r)), !1;
    const l = {
      getThemeSlug: () => o,
      getValue: () => {
        var d;
        return String((d = n.doc[i]) != null ? d : "");
      },
      setValue: (d) => {
        try {
          n.set_value(i, d);
        } catch (h) {
          throw console.error("[themeSwatchPicker] frm.set_value failed:", h), h;
        }
      },
      onClose: e.onClose
    };
    return q(l);
  });
}
function _e(e) {
  e.ui.themeSwatchPicker = {
    open: be,
    close: f
  };
}
function V(e) {
  var n, c;
  return e instanceof HTMLInputElement || e instanceof HTMLSelectElement ? e.value : (c = (n = e.textContent) == null ? void 0 : n.trim()) != null ? c : "";
}
function ve(e, n) {
  if (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement) {
    e.value = n, e.dispatchEvent(new Event("input", { bubbles: !0 })), e.dispatchEvent(new Event("change", { bubbles: !0 }));
    return;
  }
  e.textContent = n;
}
function G(e) {
  const { themeFieldEl: n, valueFieldEl: c } = e, i = {
    getThemeSlug: () => V(n),
    getValue: () => V(c),
    setValue: (r) => ve(c, r),
    onClose: e.onClose
  };
  return q(i);
}
function ye(e) {
  e.themeSwatchPicker = {
    open: G,
    close: f
  };
}
const xe = {
  open: G,
  close: f,
  isOpen: U,
  parseThemeClass: K,
  composeThemeClass: p
};
if (typeof window != "undefined") {
  ye(window);
  const e = window.frappe;
  e != null && e.ui && _e(e);
}
export {
  f as close,
  p as composeThemeClass,
  xe as default,
  U as isOpen,
  q as open,
  be as openDeskThemeSwatchPicker,
  G as openStandaloneThemeSwatchPicker,
  K as parseThemeClass
};
//# sourceMappingURL=theme-swatch-picker.es.js.map
