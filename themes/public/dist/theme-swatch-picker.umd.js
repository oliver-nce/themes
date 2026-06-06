(function(d,k){typeof exports=="object"&&typeof module!="undefined"?k(exports):typeof define=="function"&&define.amd?define(["exports"],k):(d=typeof globalThis!="undefined"?globalThis:d||self,k(d.themeSwatchPicker={}))})(this,function(d){"use strict";var ce=(d,k,v)=>new Promise((N,A)=>{var $=g=>{try{E(v.next(g))}catch(S){A(S)}},O=g=>{try{E(v.throw(g))}catch(S){A(S)}},E=g=>g.done?N(g.value):Promise.resolve(g.value).then($,O);E((v=v.apply(d,k)).next())});const k=["bg","text","border"],v=["primary","secondary","accent","success","info","warning","danger"],N=[100,200,300,500,600,700,900],A=["primary","secondary"],$="bg",O="primary",E="mono",g=new Set(v),S=new Set(k),le=new Set(N);function de(e){return S.has(e)}function me(e){return g.has(e)}function he(e){return le.has(e)}const pe=/^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;function I(e){const n=(e||"").trim();if(!n)return null;const c=pe.exec(n);if(!c)return null;const i=c[1],a=c[2],s=Number(c[3]);return!de(i)||!me(a)||!he(s)?null:{kind:i,role:a,shade:s}}function _(e,n,c){return`theme-${e}-${n}-${c}`}function ue(){return{kind:$,role:O,shade:500}}function fe(e){var n;return(n=I(e))!=null?n:ue()}function ge(e){return N}function we(e){return(e||"").trim().toLowerCase()==="tonal"?"tonal":E}function ke(e,n,c){return`theme-text-${e}-${n}${c==="tonal"?"-fg-tonal":"-fg"}`}const _e={no_theme_selected:{title:"Theme required",body:"Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."},theme_not_available:{title:"Theme not available",body:"The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."}};function be(e){return(e||"").trim()?"theme_not_available":"no_theme_selected"}function re(e){const{title:n,body:c}=_e[e];if(typeof window=="undefined")return;const i=window.frappe;if(i!=null&&i.msgprint){i.msgprint({title:n,message:c,indicator:"orange"});return}const a=document.createElement("div");a.setAttribute("role","alert"),a.style.cssText="position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;",a.innerHTML=`<p style="margin:0 0 .5rem;font-weight:600;">${n}</p><p style="margin:0;color:#374151;">${c}</p>`;const s=document.createElement("div");s.style.cssText="position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";const l=()=>{s.remove(),a.remove()};s.addEventListener("click",l),a.addEventListener("click",l),document.body.append(s,a)}const ye=`.nce-theme-swatch-picker {
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
`;let x=null,C=null,V=null,oe=!1;const ve={bg:"Bg",text:"Text",border:"Border"},Te={primary:"Primary",secondary:"Secondary",accent:"Accent",success:"Success",info:"Info",warning:"Warning",danger:"Danger"},Ee={mono:"Mono",tonal:"Tonal"};function Se(){if(oe||typeof document=="undefined")return;const e=document.createElement("style");e.setAttribute("data-nce-theme-swatch-picker",""),e.textContent=ye,document.head.appendChild(e),oe=!0}function xe(){if(typeof document=="undefined")return;const e=document.createElement("div");e.className="theme-bg-primary-500",e.style.display="none",document.body.appendChild(e);const n=getComputedStyle(e).backgroundColor;e.remove(),(!n||n==="rgba(0, 0, 0, 0)"||n==="transparent")&&console.warn("[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint.")}function Ce(e){return(e||"").trim()}function Fe(e,n){return n?!0:A.includes(e)}function Le(e,n,c,i,a){const s=!!(e.getFgType&&e.setFgType),l=document.createElement("div");l.className="nce-theme-swatch-picker__backdrop",l.addEventListener("click",()=>b());const m=document.createElement("div");m.className="nce-theme-swatch-picker nce-theme-swatch-picker__modal",m.setAttribute("role","dialog"),m.setAttribute("aria-modal","true"),m.setAttribute("aria-label","Theme swatch picker"),m.addEventListener("click",t=>t.stopPropagation());const y=document.createElement("div");n&&y.setAttribute("data-nce-theme",n);const h=document.createElement("div");h.className="nce-theme-swatch-picker__layout";const u=document.createElement("fieldset");u.className="nce-theme-swatch-picker__radios";const j=document.createElement("p");j.className="nce-theme-swatch-picker__column-title",j.textContent="Kind",u.appendChild(j);const P=document.createElement("fieldset");P.className="nce-theme-swatch-picker__radios";const U=document.createElement("p");U.className="nce-theme-swatch-picker__column-title",U.textContent="Role",P.appendChild(U);const G=document.createElement("div"),Y=document.createElement("p");Y.className="nce-theme-swatch-picker__column-title",Y.textContent="Swatches",G.appendChild(Y);const z=document.createElement("div");z.className="nce-theme-swatch-picker__swatch-strip",G.appendChild(z);const W=new Map;for(const t of k){const o=document.createElement("label");o.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-kind",r.value=t,r.checked=c.kind===t,o.appendChild(r),o.append(" ",ve[t]),u.appendChild(o),W.set(t,r)}const q=new Map;for(const t of v){const o=document.createElement("label");o.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-role",r.value=t,r.checked=c.role===t,o.appendChild(r),o.append(" ",Te[t]),P.appendChild(o),q.set(t,r)}h.append(u,P,G);const F=document.createElement("fieldset");F.className="nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type";const J=document.createElement("p");J.className="nce-theme-swatch-picker__column-title",J.textContent="Foreground Type",F.appendChild(J);const Q=new Map;let X=a;const $e=()=>{const t=L(),o=s&&t.kind==="bg";F.hidden=!o};for(const t of["mono","tonal"]){const o=document.createElement("label");o.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-fg-type",r.value=t,r.checked=X===t,o.appendChild(r),o.append(" ",Ee[t]),F.appendChild(o),Q.set(t,r)}const Z=()=>{var o;const t=((o=[...Q.entries()].find(([,r])=>r.checked))==null?void 0:o[0])||X;return X=t,t},ee=document.createElement("div");ee.className="nce-theme-swatch-picker__status";const te=document.createElement("span");te.className="nce-theme-swatch-picker__selected-label",te.textContent="Selected:";const ne=document.createElement("code");ne.className="nce-theme-swatch-picker__selected-value",ee.append(te,ne);const D=document.createElement("div");D.className="nce-theme-swatch-picker__footer";const ie=t=>{if(!t){D.textContent="Theme: (site default — no theme selected)";return}D.textContent=`Theme: ${t}`};ie(n),y.append(h,F,ee,D),m.appendChild(y),l.appendChild(m);let T=null;const L=()=>{var f,p;const t=((f=[...W.entries()].find(([,w])=>w.checked))==null?void 0:f[0])||c.kind,o=((p=[...q.entries()].find(([,w])=>w.checked))==null?void 0:p[0])||c.role,r=T!=null?T:c.shade;return{kind:t,role:o,shade:r}},M=t=>{const o=L(),r=t!=null?t:_(o.kind,o.role,o.shade);ne.textContent=r},R=()=>{const t=L(),o=Z(),r=s&&t.kind==="bg";T=null,z.replaceChildren();for(const f of ge(t.role)){const p=document.createElement("button");if(p.type="button",p.className=`nce-theme-swatch-picker__swatch theme-bg-${t.role}-${f}`,p.title=_(t.kind,t.role,f),t.shade===f&&p.classList.add("nce-theme-swatch-picker__swatch--preview"),Fe(t.role,r)){const w=document.createElement("span");w.className="nce-theme-swatch-picker__swatch-label "+ke(t.role,f,o),w.textContent="Text",p.appendChild(w)}p.addEventListener("mouseenter",()=>{T=f,M(_(t.kind,t.role,f))}),p.addEventListener("mouseleave",()=>{T=null,M(i||_(t.kind,t.role,t.shade))}),p.addEventListener("click",()=>{const w=_(t.kind,t.role,f);try{e.setFgType&&t.kind==="bg"&&e.setFgType(Z()),e.setValue(w)}catch(Oe){console.error("[themeSwatchPicker] setValue failed:",Oe);return}b()}),z.appendChild(p)}M(i||_(t.kind,t.role,t.shade)),$e()};for(const t of W.values())t.addEventListener("change",()=>{c=L(),R()});for(const t of q.values())t.addEventListener("change",()=>{c=L(),R()});for(const t of Q.values())t.addEventListener("change",()=>{Z(),R()});return R(),{root:l,updateSelected:M,refreshThemeScope:t=>{t?y.setAttribute("data-nce-theme",t):y.removeAttribute("data-nce-theme"),ie(t)}}}function b(){C&&(document.removeEventListener("keydown",C),C=null),x&&(x.remove(),x=null);const e=V;V=null,e==null||e()}function H(){return x!==null}function B(e){var l;H()&&b(),Se(),xe();const n=Ce(e.getThemeSlug());if(!n)return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."),re("no_theme_selected"),!1;const c=(e.getValue()||"").trim(),i=fe(c),a=e.getFgType?we(e.getFgType()):"mono",{root:s}=Le(e,n,i,c,a);return document.body.appendChild(s),x=s,V=(l=e.onClose)!=null?l:null,C=m=>{m.key==="Escape"&&(m.preventDefault(),b())},document.addEventListener("keydown",C),!0}function Ne(){var n;if(typeof window=="undefined")return null;const e=window.frappe;return(n=e==null?void 0:e.db)!=null?n:null}function Ae(e){return ce(this,null,function*(){var i;const n=(e||"").trim();if(!n)return"";const c=Ne();if(!c)return console.warn("[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"),"";try{if(!c.exists("NCE Theme",n))return console.warn(`[themeSwatchPicker] NCE Theme "${n}" not found`),"";const a=yield c.get_value("NCE Theme",n,["slug","status"]),s=(i=a.message)!=null?i:a,l=((s==null?void 0:s.slug)||"").trim();return(s==null?void 0:s.status)==="Active"&&l?l:(console.warn(`[themeSwatchPicker] theme "${n}" is not Active or has no slug`),"")}catch(a){return console.error("[themeSwatchPicker] slug lookup failed:",a),""}})}function Pe(e,n){if(n)return n;if(e.endsWith("_bg_class"))return e.replace(/_bg_class$/,"_fg_type")}function ae(e){return ce(this,null,function*(){var y;const{frm:n,themeField:c,valueField:i}=e,a=Pe(i,e.fgTypeField),s=String((y=n.doc[c])!=null?y:"");let l=yield Ae(s);if(!l)return console.warn("[themeSwatchPicker] no Active theme slug for field — open cancelled."),re(be(s)),!1;const m={getThemeSlug:()=>l,getValue:()=>{var h;return String((h=n.doc[i])!=null?h:"")},setValue:h=>{try{n.set_value(i,h)}catch(u){throw console.error("[themeSwatchPicker] frm.set_value failed:",u),u}},onClose:e.onClose};return a&&(m.getFgType=()=>{var h;return String((h=n.doc[a])!=null?h:"mono")},m.setFgType=h=>{try{n.set_value(a,h)}catch(u){throw console.error("[themeSwatchPicker] frm.set_value fg type failed:",u),u}}),B(m)})}function ze(e){e.ui.themeSwatchPicker={open:ae,close:b}}function se(e){var n,c;return e instanceof HTMLInputElement||e instanceof HTMLSelectElement?e.value:(c=(n=e.textContent)==null?void 0:n.trim())!=null?c:""}function De(e,n){if(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement){e.value=n,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0}));return}e.textContent=n}function K(e){const{themeFieldEl:n,valueFieldEl:c}=e,i={getThemeSlug:()=>se(n),getValue:()=>se(c),setValue:a=>De(c,a),onClose:e.onClose};return B(i)}function Me(e){e.themeSwatchPicker={open:K,close:b}}const Re={open:K,close:b,isOpen:H,parseThemeClass:I,composeThemeClass:_};if(typeof window!="undefined"){Me(window);const e=window.frappe;e!=null&&e.ui&&ze(e)}d.close=b,d.composeThemeClass=_,d.default=Re,d.isOpen=H,d.open=B,d.openDeskThemeSwatchPicker=ae,d.openStandaloneThemeSwatchPicker=K,d.parseThemeClass=I,Object.defineProperties(d,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
//# sourceMappingURL=theme-swatch-picker.umd.js.map
