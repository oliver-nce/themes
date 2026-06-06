var B = (e, n, c) => new Promise((i, o) => {
  var s = (p) => {
    try {
      l(c.next(p));
    } catch (m) {
      o(m);
    }
  }, d = (p) => {
    try {
      l(c.throw(p));
    } catch (m) {
      o(m);
    }
  }, l = (p) => p.done ? i(p.value) : Promise.resolve(p.value).then(s, d);
  l((c = c.apply(e, n)).next());
});
const Y = ["bg", "text", "border"], W = [
  "primary",
  "secondary",
  "accent",
  "success",
  "info",
  "warning",
  "danger"
], q = [100, 200, 300, 500, 600, 700, 900], ce = ["primary", "secondary"], re = "bg", oe = "primary", ae = "mono", se = new Set(W), ie = new Set(Y), le = new Set(q);
function de(e) {
  return ie.has(e);
}
function me(e) {
  return se.has(e);
}
function pe(e) {
  return le.has(e);
}
const he = /^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;
function J(e) {
  const n = (e || "").trim();
  if (!n) return null;
  const c = he.exec(n);
  if (!c) return null;
  const i = c[1], o = c[2], s = Number(c[3]);
  return !de(i) || !me(o) || !pe(s) ? null : { kind: i, role: o, shade: s };
}
function w(e, n, c) {
  return `theme-${e}-${n}-${c}`;
}
function ue() {
  return {
    kind: re,
    role: oe,
    shade: 500
  };
}
function fe(e) {
  var n;
  return (n = J(e)) != null ? n : ue();
}
function ge(e) {
  return q;
}
function we(e) {
  return (e || "").trim().toLowerCase() === "tonal" ? "tonal" : ae;
}
function ke(e, n, c) {
  return `theme-text-${e}-${n}${c === "tonal" ? "-fg-tonal" : "-fg"}`;
}
const _e = {
  no_theme_selected: {
    title: "Theme required",
    body: "Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."
  },
  theme_not_available: {
    title: "Theme not available",
    body: "The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."
  }
};
function be(e) {
  return (e || "").trim() ? "theme_not_available" : "no_theme_selected";
}
function Q(e) {
  const { title: n, body: c } = _e[e];
  if (typeof window == "undefined") return;
  const i = window.frappe;
  if (i != null && i.msgprint) {
    i.msgprint({ title: n, message: c, indicator: "orange" });
    return;
  }
  const o = document.createElement("div");
  o.setAttribute("role", "alert"), o.style.cssText = "position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;", o.innerHTML = `<p style="margin:0 0 .5rem;font-weight:600;">${n}</p><p style="margin:0;color:#374151;">${c}</p>`;
  const s = document.createElement("div");
  s.style.cssText = "position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";
  const d = () => {
    s.remove(), o.remove();
  };
  s.addEventListener("click", d), o.addEventListener("click", d), document.body.append(s, o);
}
const ye = `.nce-theme-swatch-picker {
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

.nce-theme-swatch-picker__fg-type {
	margin-top: 0.75rem;
	padding-top: 0.75rem;
	border-top: 1px solid var(--tsp-modal-border);
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
let v = null, E = null, K = null, j = !1;
const ve = {
  bg: "Bg",
  text: "Text",
  border: "Border"
}, Ee = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  success: "Success",
  info: "Info",
  warning: "Warning",
  danger: "Danger"
}, Te = {
  mono: "Mono",
  tonal: "Tonal"
};
function xe() {
  if (j || typeof document == "undefined") return;
  const e = document.createElement("style");
  e.setAttribute("data-nce-theme-swatch-picker", ""), e.textContent = ye, document.head.appendChild(e), j = !0;
}
function Se() {
  if (typeof document == "undefined") return;
  const e = document.createElement("div");
  e.className = "theme-bg-primary-500", e.style.display = "none", document.body.appendChild(e);
  const n = getComputedStyle(e).backgroundColor;
  e.remove(), (!n || n === "rgba(0, 0, 0, 0)" || n === "transparent") && console.warn(
    "[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint."
  );
}
function Ce(e) {
  return (e || "").trim();
}
function Fe(e, n) {
  return n ? !0 : ce.includes(e);
}
function Le(e, n, c, i, o) {
  const s = !!(e.getFgType && e.setFgType), d = document.createElement("div");
  d.className = "nce-theme-swatch-picker__backdrop", d.addEventListener("click", () => k());
  const l = document.createElement("div");
  l.className = "nce-theme-swatch-picker nce-theme-swatch-picker__modal", l.setAttribute("role", "dialog"), l.setAttribute("aria-modal", "true"), l.setAttribute("aria-label", "Theme swatch picker"), l.addEventListener("click", (t) => t.stopPropagation());
  const p = document.createElement("div");
  n && p.setAttribute("data-nce-theme", n);
  const m = document.createElement("div");
  m.className = "nce-theme-swatch-picker__layout";
  const u = document.createElement("fieldset");
  u.className = "nce-theme-swatch-picker__radios";
  const L = document.createElement("p");
  L.className = "nce-theme-swatch-picker__column-title", L.textContent = "Kind", u.appendChild(L);
  const T = document.createElement("fieldset");
  T.className = "nce-theme-swatch-picker__radios";
  const N = document.createElement("p");
  N.className = "nce-theme-swatch-picker__column-title", N.textContent = "Role", T.appendChild(N);
  const A = document.createElement("div"), P = document.createElement("p");
  P.className = "nce-theme-swatch-picker__column-title", P.textContent = "Swatches", A.appendChild(P);
  const x = document.createElement("div");
  x.className = "nce-theme-swatch-picker__swatch-strip", A.appendChild(x);
  const z = /* @__PURE__ */ new Map();
  for (const t of Y) {
    const a = document.createElement("label");
    a.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-kind", r.value = t, r.checked = c.kind === t, a.appendChild(r), a.append(" ", ve[t]), u.appendChild(a), z.set(t, r);
  }
  const D = /* @__PURE__ */ new Map();
  for (const t of W) {
    const a = document.createElement("label");
    a.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-role", r.value = t, r.checked = c.role === t, a.appendChild(r), a.append(" ", Ee[t]), T.appendChild(a), D.set(t, r);
  }
  m.append(u, T, A);
  const b = document.createElement("fieldset");
  b.className = "nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type";
  const M = document.createElement("p");
  M.className = "nce-theme-swatch-picker__column-title", M.textContent = "Foreground Type", b.appendChild(M);
  const R = /* @__PURE__ */ new Map();
  let $ = o;
  const te = () => {
    const t = y(), a = s && t.kind === "bg";
    b.hidden = !a;
  };
  for (const t of ["mono", "tonal"]) {
    const a = document.createElement("label");
    a.className = "nce-theme-swatch-picker__radio";
    const r = document.createElement("input");
    r.type = "radio", r.name = "nce-tsp-fg-type", r.value = t, r.checked = $ === t, a.appendChild(r), a.append(" ", Te[t]), b.appendChild(a), R.set(t, r);
  }
  const I = () => {
    var a;
    const t = ((a = [...R.entries()].find(([, r]) => r.checked)) == null ? void 0 : a[0]) || $;
    return $ = t, t;
  }, V = document.createElement("div");
  V.className = "nce-theme-swatch-picker__status";
  const O = document.createElement("span");
  O.className = "nce-theme-swatch-picker__selected-label", O.textContent = "Selected:";
  const H = document.createElement("code");
  H.className = "nce-theme-swatch-picker__selected-value", V.append(O, H);
  const S = document.createElement("div");
  S.className = "nce-theme-swatch-picker__footer";
  const U = (t) => {
    if (!t) {
      S.textContent = "Theme: (site default — no theme selected)";
      return;
    }
    S.textContent = `Theme: ${t}`;
  };
  U(n), p.append(m, b, V, S), l.appendChild(p), d.appendChild(l);
  let _ = null;
  const y = () => {
    var f, h;
    const t = ((f = [...z.entries()].find(([, g]) => g.checked)) == null ? void 0 : f[0]) || c.kind, a = ((h = [...D.entries()].find(([, g]) => g.checked)) == null ? void 0 : h[0]) || c.role, r = _ != null ? _ : c.shade;
    return { kind: t, role: a, shade: r };
  }, C = (t) => {
    const a = y(), r = t != null ? t : w(a.kind, a.role, a.shade);
    H.textContent = r;
  }, F = () => {
    const t = y(), a = I(), r = s && t.kind === "bg";
    _ = null, x.replaceChildren();
    for (const f of ge(t.role)) {
      const h = document.createElement("button");
      if (h.type = "button", h.className = `nce-theme-swatch-picker__swatch theme-bg-${t.role}-${f}`, h.title = w(t.kind, t.role, f), t.shade === f && h.classList.add("nce-theme-swatch-picker__swatch--preview"), Fe(t.role, r)) {
        const g = document.createElement("span");
        g.className = "nce-theme-swatch-picker__swatch-label " + ke(t.role, f, a), g.textContent = "Text", h.appendChild(g);
      }
      h.addEventListener("mouseenter", () => {
        _ = f, C(w(t.kind, t.role, f));
      }), h.addEventListener("mouseleave", () => {
        _ = null, C(i || w(t.kind, t.role, t.shade));
      }), h.addEventListener("click", () => {
        const g = w(t.kind, t.role, f);
        try {
          e.setFgType && t.kind === "bg" && e.setFgType(I()), e.setValue(g);
        } catch (ne) {
          console.error("[themeSwatchPicker] setValue failed:", ne);
          return;
        }
        k();
      }), x.appendChild(h);
    }
    C(
      i || w(t.kind, t.role, t.shade)
    ), te();
  };
  for (const t of z.values())
    t.addEventListener("change", () => {
      c = y(), F();
    });
  for (const t of D.values())
    t.addEventListener("change", () => {
      c = y(), F();
    });
  for (const t of R.values())
    t.addEventListener("change", () => {
      I(), F();
    });
  return F(), {
    root: d,
    updateSelected: C,
    refreshThemeScope: (t) => {
      t ? p.setAttribute("data-nce-theme", t) : p.removeAttribute("data-nce-theme"), U(t);
    }
  };
}
function k() {
  E && (document.removeEventListener("keydown", E), E = null), v && (v.remove(), v = null);
  const e = K;
  K = null, e == null || e();
}
function X() {
  return v !== null;
}
function Z(e) {
  var d;
  X() && k(), xe(), Se();
  const n = Ce(e.getThemeSlug());
  if (!n)
    return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."), Q("no_theme_selected"), !1;
  const c = (e.getValue() || "").trim(), i = fe(c), o = e.getFgType ? we(e.getFgType()) : "mono", { root: s } = Le(
    e,
    n,
    i,
    c,
    o
  );
  return document.body.appendChild(s), v = s, K = (d = e.onClose) != null ? d : null, E = (l) => {
    l.key === "Escape" && (l.preventDefault(), k());
  }, document.addEventListener("keydown", E), !0;
}
function Ne() {
  var n;
  if (typeof window == "undefined") return null;
  const e = window.frappe;
  return (n = e == null ? void 0 : e.db) != null ? n : null;
}
function Ae(e) {
  return B(this, null, function* () {
    var i;
    const n = (e || "").trim();
    if (!n) return "";
    const c = Ne();
    if (!c)
      return console.warn(
        "[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"
      ), "";
    try {
      if (!c.exists("NCE Theme", n))
        return console.warn(`[themeSwatchPicker] NCE Theme "${n}" not found`), "";
      const o = yield c.get_value("NCE Theme", n, ["slug", "status"]), s = (i = o.message) != null ? i : o, d = ((s == null ? void 0 : s.slug) || "").trim();
      return (s == null ? void 0 : s.status) === "Active" && d ? d : (console.warn(
        `[themeSwatchPicker] theme "${n}" is not Active or has no slug`
      ), "");
    } catch (o) {
      return console.error("[themeSwatchPicker] slug lookup failed:", o), "";
    }
  });
}
function Pe(e, n) {
  if (n) return n;
  if (e.endsWith("_bg_class"))
    return e.replace(/_bg_class$/, "_fg_type");
}
function ze(e) {
  return B(this, null, function* () {
    var p;
    const { frm: n, themeField: c, valueField: i } = e, o = Pe(i, e.fgTypeField), s = String((p = n.doc[c]) != null ? p : "");
    let d = yield Ae(s);
    if (!d)
      return console.warn(
        "[themeSwatchPicker] no Active theme slug for field — open cancelled."
      ), Q(be(s)), !1;
    const l = {
      getThemeSlug: () => d,
      getValue: () => {
        var m;
        return String((m = n.doc[i]) != null ? m : "");
      },
      setValue: (m) => {
        try {
          n.set_value(i, m);
        } catch (u) {
          throw console.error("[themeSwatchPicker] frm.set_value failed:", u), u;
        }
      },
      onClose: e.onClose
    };
    return o && (l.getFgType = () => {
      var m;
      return String((m = n.doc[o]) != null ? m : "mono");
    }, l.setFgType = (m) => {
      try {
        n.set_value(o, m);
      } catch (u) {
        throw console.error("[themeSwatchPicker] frm.set_value fg type failed:", u), u;
      }
    }), Z(l);
  });
}
function De(e) {
  e.ui.themeSwatchPicker = {
    open: ze,
    close: k
  };
}
function G(e) {
  var n, c;
  return e instanceof HTMLInputElement || e instanceof HTMLSelectElement ? e.value : (c = (n = e.textContent) == null ? void 0 : n.trim()) != null ? c : "";
}
function Me(e, n) {
  if (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement) {
    e.value = n, e.dispatchEvent(new Event("input", { bubbles: !0 })), e.dispatchEvent(new Event("change", { bubbles: !0 }));
    return;
  }
  e.textContent = n;
}
function ee(e) {
  const { themeFieldEl: n, valueFieldEl: c } = e, i = {
    getThemeSlug: () => G(n),
    getValue: () => G(c),
    setValue: (o) => Me(c, o),
    onClose: e.onClose
  };
  return Z(i);
}
function Re(e) {
  e.themeSwatchPicker = {
    open: ee,
    close: k
  };
}
const Ie = {
  open: ee,
  close: k,
  isOpen: X,
  parseThemeClass: J,
  composeThemeClass: w
};
if (typeof window != "undefined") {
  Re(window);
  const e = window.frappe;
  e != null && e.ui && De(e);
}
export {
  k as close,
  w as composeThemeClass,
  Ie as default,
  X as isOpen,
  Z as open,
  ze as openDeskThemeSwatchPicker,
  ee as openStandaloneThemeSwatchPicker,
  J as parseThemeClass
};
//# sourceMappingURL=theme-swatch-picker.es.js.map
