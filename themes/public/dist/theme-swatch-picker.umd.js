(function(d,u){typeof exports=="object"&&typeof module!="undefined"?u(exports):typeof define=="function"&&define.amd?define(["exports"],u):(d=typeof globalThis!="undefined"?globalThis:d||self,u(d.themeSwatchPicker={}))})(this,function(d){"use strict";var J=(d,u,g)=>new Promise((x,T)=>{var z=m=>{try{v(g.next(m))}catch(y){T(y)}},F=m=>{try{v(g.throw(m))}catch(y){T(y)}},v=m=>m.done?x(m.value):Promise.resolve(m.value).then(z,F);v((g=g.apply(d,u)).next())});const u=["bg","text","border"],g=["primary","secondary","accent","success","info","warning","danger"],x=[100,200,300,500,600,700,900],T=["primary","secondary"],z="bg",F="primary",v=new Set(g),m=new Set(u),y=new Set(x);function ne(e){return m.has(e)}function ce(e){return v.has(e)}function re(e){return y.has(e)}const oe=/^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;function M(e){const n=(e||"").trim();if(!n)return null;const c=oe.exec(n);if(!c)return null;const i=c[1],o=c[2],r=Number(c[3]);return!ne(i)||!ce(o)||!re(r)?null:{kind:i,role:o,shade:r}}function p(e,n,c){return`theme-${e}-${n}-${c}`}function ae(){return{kind:z,role:F,shade:500}}function se(e){var n;return(n=M(e))!=null?n:ae()}function ie(e){return x}const le={no_theme_selected:{title:"Theme required",body:"Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."},theme_not_available:{title:"Theme not available",body:"The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."}};function de(e){return(e||"").trim()?"theme_not_available":"no_theme_selected"}function Q(e){const{title:n,body:c}=le[e];if(typeof window=="undefined")return;const i=window.frappe;if(i!=null&&i.msgprint){i.msgprint({title:n,message:c,indicator:"orange"});return}const o=document.createElement("div");o.setAttribute("role","alert"),o.style.cssText="position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;",o.innerHTML=`<p style="margin:0 0 .5rem;font-weight:600;">${n}</p><p style="margin:0;color:#374151;">${c}</p>`;const r=document.createElement("div");r.style.cssText="position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";const l=()=>{r.remove(),o.remove()};r.addEventListener("click",l),o.addEventListener("click",l),document.body.append(r,o)}const me=`.nce-theme-swatch-picker {
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
`;let E=null,S=null,R=null,X=!1;const he={bg:"Bg",text:"Text",border:"Border"},ue={primary:"Primary",secondary:"Secondary",accent:"Accent",success:"Success",info:"Info",warning:"Warning",danger:"Danger"};function pe(){if(X||typeof document=="undefined")return;const e=document.createElement("style");e.setAttribute("data-nce-theme-swatch-picker",""),e.textContent=me,document.head.appendChild(e),X=!0}function fe(){if(typeof document=="undefined")return;const e=document.createElement("div");e.className="theme-bg-primary-500",e.style.display="none",document.body.appendChild(e);const n=getComputedStyle(e).backgroundColor;e.remove(),(!n||n==="rgba(0, 0, 0, 0)"||n==="transparent")&&console.warn("[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint.")}function we(e){return(e||"").trim()}function ge(e){return T.includes(e)}function ke(e,n,c,i){const o=document.createElement("div");o.className="nce-theme-swatch-picker__backdrop",o.addEventListener("click",()=>f());const r=document.createElement("div");r.className="nce-theme-swatch-picker nce-theme-swatch-picker__modal",r.setAttribute("role","dialog"),r.setAttribute("aria-modal","true"),r.setAttribute("aria-label","Theme swatch picker"),r.addEventListener("click",t=>t.stopPropagation());const l=document.createElement("div");n&&l.setAttribute("data-nce-theme",n);const k=document.createElement("div");k.className="nce-theme-swatch-picker__layout";const h=document.createElement("fieldset");h.className="nce-theme-swatch-picker__radios";const b=document.createElement("p");b.className="nce-theme-swatch-picker__column-title",b.textContent="Kind",h.appendChild(b);const C=document.createElement("fieldset");C.className="nce-theme-swatch-picker__radios";const V=document.createElement("p");V.className="nce-theme-swatch-picker__column-title",V.textContent="Role",C.appendChild(V);const H=document.createElement("div"),B=document.createElement("p");B.className="nce-theme-swatch-picker__column-title",B.textContent="Swatches",H.appendChild(B);const L=document.createElement("div");L.className="nce-theme-swatch-picker__swatch-strip",H.appendChild(L);const K=new Map;for(const t of u){const s=document.createElement("label");s.className="nce-theme-swatch-picker__radio";const a=document.createElement("input");a.type="radio",a.name="nce-tsp-kind",a.value=t,a.checked=c.kind===t,s.appendChild(a),s.append(" ",he[t]),h.appendChild(s),K.set(t,a)}const j=new Map;for(const t of g){const s=document.createElement("label");s.className="nce-theme-swatch-picker__radio";const a=document.createElement("input");a.type="radio",a.name="nce-tsp-role",a.value=t,a.checked=c.role===t,s.appendChild(a),s.append(" ",ue[t]),C.appendChild(s),j.set(t,a)}k.append(h,C,H);const U=document.createElement("div");U.className="nce-theme-swatch-picker__status";const q=document.createElement("span");q.className="nce-theme-swatch-picker__selected-label",q.textContent="Selected:";const G=document.createElement("code");G.className="nce-theme-swatch-picker__selected-value",U.append(q,G);const N=document.createElement("div");N.className="nce-theme-swatch-picker__footer";const te=t=>{if(!t){N.textContent="Theme: (site default — no theme selected)";return}N.textContent=`Theme: ${t}`};te(n),l.append(k,U,N),r.appendChild(l),o.appendChild(r);let _=null;const A=()=>{var w,D;const t=((w=[...K.entries()].find(([,Y])=>Y.checked))==null?void 0:w[0])||c.kind,s=((D=[...j.entries()].find(([,Y])=>Y.checked))==null?void 0:D[0])||c.role,a=_!=null?_:c.shade;return{kind:t,role:s,shade:a}},P=t=>{const s=A(),a=t!=null?t:p(s.kind,s.role,s.shade);G.textContent=a},W=()=>{const t=A();_=null,L.replaceChildren();for(const s of ie(t.role)){const a=document.createElement("button");if(a.type="button",a.className=`nce-theme-swatch-picker__swatch theme-bg-${t.role}-${s}`,a.title=p(t.kind,t.role,s),t.shade===s&&a.classList.add("nce-theme-swatch-picker__swatch--preview"),ge(t.role)){const w=document.createElement("span");w.className=`nce-theme-swatch-picker__swatch-label theme-text-${t.role}-${s}-fg`,w.textContent="Text",a.appendChild(w)}a.addEventListener("mouseenter",()=>{_=s,P(p(t.kind,t.role,s))}),a.addEventListener("mouseleave",()=>{_=null,P(i||p(t.kind,t.role,t.shade))}),a.addEventListener("click",()=>{const w=p(t.kind,t.role,s);try{e.setValue(w)}catch(D){console.error("[themeSwatchPicker] setValue failed:",D);return}f()}),L.appendChild(a)}P(i||p(t.kind,t.role,t.shade))};for(const t of K.values())t.addEventListener("change",()=>{c=A(),W()});for(const t of j.values())t.addEventListener("change",()=>{c=A(),W()});return W(),{root:o,updateSelected:P,refreshThemeScope:t=>{t?l.setAttribute("data-nce-theme",t):l.removeAttribute("data-nce-theme"),te(t)}}}function f(){S&&(document.removeEventListener("keydown",S),S=null),E&&(E.remove(),E=null);const e=R;R=null,e==null||e()}function $(){return E!==null}function I(e){var r;$()&&f(),pe(),fe();const n=we(e.getThemeSlug());if(!n)return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."),Q("no_theme_selected"),!1;const c=(e.getValue()||"").trim(),i=se(c),{root:o}=ke(e,n,i,c);return document.body.appendChild(o),E=o,R=(r=e.onClose)!=null?r:null,S=l=>{l.key==="Escape"&&(l.preventDefault(),f())},document.addEventListener("keydown",S),!0}function be(){var n;if(typeof window=="undefined")return null;const e=window.frappe;return(n=e==null?void 0:e.db)!=null?n:null}function _e(e){return J(this,null,function*(){var i;const n=(e||"").trim();if(!n)return"";const c=be();if(!c)return console.warn("[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"),"";try{if(!c.exists("NCE Theme",n))return console.warn(`[themeSwatchPicker] NCE Theme "${n}" not found`),"";const o=yield c.get_value("NCE Theme",n,["slug","status"]),r=(i=o.message)!=null?i:o,l=((r==null?void 0:r.slug)||"").trim();return(r==null?void 0:r.status)==="Active"&&l?l:(console.warn(`[themeSwatchPicker] theme "${n}" is not Active or has no slug`),"")}catch(o){return console.error("[themeSwatchPicker] slug lookup failed:",o),""}})}function Z(e){return J(this,null,function*(){var k;const{frm:n,themeField:c,valueField:i}=e,o=String((k=n.doc[c])!=null?k:"");let r=yield _e(o);if(!r)return console.warn("[themeSwatchPicker] no Active theme slug for field — open cancelled."),Q(de(o)),!1;const l={getThemeSlug:()=>r,getValue:()=>{var h;return String((h=n.doc[i])!=null?h:"")},setValue:h=>{try{n.set_value(i,h)}catch(b){throw console.error("[themeSwatchPicker] frm.set_value failed:",b),b}},onClose:e.onClose};return I(l)})}function ve(e){e.ui.themeSwatchPicker={open:Z,close:f}}function ee(e){var n,c;return e instanceof HTMLInputElement||e instanceof HTMLSelectElement?e.value:(c=(n=e.textContent)==null?void 0:n.trim())!=null?c:""}function ye(e,n){if(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement){e.value=n,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0}));return}e.textContent=n}function O(e){const{themeFieldEl:n,valueFieldEl:c}=e,i={getThemeSlug:()=>ee(n),getValue:()=>ee(c),setValue:o=>ye(c,o),onClose:e.onClose};return I(i)}function Ee(e){e.themeSwatchPicker={open:O,close:f}}const Se={open:O,close:f,isOpen:$,parseThemeClass:M,composeThemeClass:p};if(typeof window!="undefined"){Ee(window);const e=window.frappe;e!=null&&e.ui&&ve(e)}d.close=f,d.composeThemeClass=p,d.default=Se,d.isOpen=$,d.open=I,d.openDeskThemeSwatchPicker=Z,d.openStandaloneThemeSwatchPicker=O,d.parseThemeClass=M,Object.defineProperties(d,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
//# sourceMappingURL=theme-swatch-picker.umd.js.map
