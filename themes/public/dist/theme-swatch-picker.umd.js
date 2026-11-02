(function(a,d){typeof exports=="object"&&typeof module!="undefined"?d(exports):typeof define=="function"&&define.amd?define(["exports"],d):(a=typeof globalThis!="undefined"?globalThis:a||self,d(a.themeSwatchPicker={}))})(this,function(a){"use strict";var Qe=Object.defineProperty,Xe=Object.defineProperties;var Ze=Object.getOwnPropertyDescriptors;var _e=Object.getOwnPropertySymbols;var et=Object.prototype.hasOwnProperty,tt=Object.prototype.propertyIsEnumerable;var be=(a,d,h)=>d in a?Qe(a,d,{enumerable:!0,configurable:!0,writable:!0,value:h}):a[d]=h,D=(a,d)=>{for(var h in d||(d={}))et.call(d,h)&&be(a,h,d[h]);if(_e)for(var h of _e(d))tt.call(d,h)&&be(a,h,d[h]);return a},R=(a,d)=>Xe(a,Ze(d));var pe=(a,d,h)=>new Promise((V,I)=>{var Q=k=>{try{S(h.next(k))}catch(C){I(C)}},X=k=>{try{S(h.throw(k))}catch(C){I(C)}},S=k=>k.done?V(k.value):Promise.resolve(k.value).then(Q,X);S((h=h.apply(a,d)).next())});const d=[50,100,200,300,400,500,600,700,800,900,950],h=["primary","secondary","accent","success","info","warning","danger","neutral"],V=["bg","text","border"],I=["primary","secondary"],Q="bg",X="primary",S="mono",k=new Set(h),C=new Set(V),ye=new Set(d);function ve(e){return C.has(e)}function Ee(e){return k.has(e)}function Te(e){return ye.has(e)}function xe(e){return e.charAt(0).toUpperCase()+e.slice(1)}const Se=/^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;function O(e){const n=(e||"").trim();if(!n)return null;const c=Se.exec(n);if(!c)return null;const l=c[1],i=c[2],s=Number(c[3]);return!ve(l)||!Ee(i)||!Te(s)?null:{kind:l,role:i,shade:s}}function T(e,n,c){return`theme-${e}-${n}-${c}`}function Ce(){return{kind:Q,role:X,shade:500}}function Le(e){var n;return(n=O(e))!=null?n:Ce()}function Fe(e){return d}function Ne(e){return(e||"").trim().toLowerCase()==="tonal"?"tonal":S}function Ae(e,n,c){return`theme-text-${e}-${n}${c==="tonal"?"-fg-tonal":"-fg"}`}const Pe={no_theme_selected:{title:"Theme required",body:"Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."},theme_not_available:{title:"Theme not available",body:"The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."}};function ze(e){return(e||"").trim()?"theme_not_available":"no_theme_selected"}function ue(e){const{title:n,body:c}=Pe[e];if(typeof window=="undefined")return;const l=window.frappe;if(l!=null&&l.msgprint){l.msgprint({title:n,message:c,indicator:"orange"});return}const i=document.createElement("div");i.setAttribute("role","alert"),i.style.cssText="position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;",i.innerHTML=`<p style="margin:0 0 .5rem;font-weight:600;">${n}</p><p style="margin:0;color:#374151;">${c}</p>`;const s=document.createElement("div");s.style.cssText="position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";const p=()=>{s.remove(),i.remove()};s.addEventListener("click",p),i.addEventListener("click",p),document.body.append(s,i)}const Me=`/*
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
`;let L=null,F=null,Z=null,fe=!1;const Ke={bg:"Bg",text:"Text",border:"Border"},$e={mono:"Mono",tonal:"Tonal"};function De(){if(fe||typeof document=="undefined")return;const e=document.createElement("style");e.setAttribute("data-nce-theme-swatch-picker",""),e.textContent=Me,document.head.appendChild(e),fe=!0}function Re(){if(typeof document=="undefined")return;const e=document.createElement("div");e.className="theme-bg-primary-500",e.style.display="none",document.body.appendChild(e);const n=getComputedStyle(e).backgroundColor;e.remove(),(!n||n==="rgba(0, 0, 0, 0)"||n==="transparent")&&console.warn("[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint.")}function Ve(e){return(e||"").trim()}function Ie(e,n){return n?!0:I.includes(e)}function Oe(e,n,c,l,i){const s=!!(e.getFgType&&e.setFgType),p=s,u=e.lockKind,H=p||!!u,y=document.createElement("div");y.className="nce-theme-swatch-picker__backdrop",y.addEventListener("click",()=>_({saved:!1}));const m=document.createElement("div");m.className="nce-theme-swatch-picker nce-theme-swatch-picker__modal",m.setAttribute("role","dialog"),m.setAttribute("aria-modal","true"),m.setAttribute("aria-label","Theme swatch picker"),m.addEventListener("click",t=>t.stopPropagation());const g=document.createElement("div");n&&g.setAttribute("data-nce-theme",n);const A=document.createElement("div");A.className=p?"nce-theme-swatch-picker__layout nce-theme-swatch-picker__layout--chrome-pick":"nce-theme-swatch-picker__layout";const b=document.createElement("fieldset");b.className="nce-theme-swatch-picker__radios";const te=document.createElement("p");te.className="nce-theme-swatch-picker__column-title",te.textContent="Kind",b.appendChild(te);const j=document.createElement("fieldset");j.className="nce-theme-swatch-picker__radios";const ne=document.createElement("p");ne.className="nce-theme-swatch-picker__column-title",ne.textContent="Role",j.appendChild(ne);const U=document.createElement("div"),ce=document.createElement("p");ce.className="nce-theme-swatch-picker__column-title",ce.textContent="Swatches",U.appendChild(ce);const G=document.createElement("div");G.className="nce-theme-swatch-picker__swatch-strip",U.appendChild(G);const re=new Map;for(const t of V){const r=document.createElement("label");r.className="nce-theme-swatch-picker__radio";const o=document.createElement("input");o.type="radio",o.name="nce-tsp-kind",o.value=t,o.checked=c.kind===t,r.appendChild(o),r.append(" ",Ke[t]),b.appendChild(r),re.set(t,o)}const oe=new Map;for(const t of h){const r=document.createElement("label");r.className="nce-theme-swatch-picker__radio";const o=document.createElement("input");o.type="radio",o.name="nce-tsp-role",o.value=t,o.checked=c.role===t,r.appendChild(o),r.append(" ",xe(t)),j.appendChild(r),oe.set(t,o)}A.append(b,j,U),H&&(b.hidden=!0,p?c=R(D({},c),{kind:"bg"}):u&&(c=R(D({},c),{kind:u})));const P=document.createElement("fieldset");P.className="nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type",s||(P.hidden=!0);const ae=document.createElement("p");ae.className="nce-theme-swatch-picker__column-title",ae.textContent="Foreground Type",P.appendChild(ae);const se=new Map;let ie=i;for(const t of["mono","tonal"]){const r=document.createElement("label");r.className="nce-theme-swatch-picker__radio";const o=document.createElement("input");o.type="radio",o.name="nce-tsp-fg-type",o.value=t,o.checked=ie===t,r.appendChild(o),r.append(" ",$e[t]),P.appendChild(r),se.set(t,o)}s&&U.appendChild(P);const le=()=>{var r;const t=((r=[...se.entries()].find(([,o])=>o.checked))==null?void 0:r[0])||ie;return ie=t,t},de=document.createElement("div");de.className="nce-theme-swatch-picker__status";const Y=document.createElement("div");Y.className="nce-theme-swatch-picker__status-main";const me=document.createElement("span");me.className="nce-theme-swatch-picker__selected-label",me.textContent="Selected:";const q=document.createElement("code");q.className="nce-theme-swatch-picker__selected-value",Y.append(me,q);const z=document.createElement("button");z.type="button",z.className="nce-theme-swatch-picker__link-btn",z.textContent="Show in Themes App",z.addEventListener("click",()=>{const t=new URLSearchParams;n&&t.set("theme",n),e.styleKey&&t.set("style",e.styleKey);const r=O(q.textContent||"");r&&(t.set("role",r.role),t.set("kind",r.kind),t.set("shade",String(r.shade)));const o=`${window.location.origin}/themes/theme-settings?${t.toString()}`,f=window.open(o,"nce-themes-app");f==null||f.focus()}),Y.append(z);const he=document.createElement("div");he.className="nce-theme-swatch-picker__actions";const M=document.createElement("button");M.type="button",M.className="nce-theme-swatch-picker__btn",M.textContent="Cancel";const K=document.createElement("button");K.type="button",K.className="nce-theme-swatch-picker__btn nce-theme-swatch-picker__btn--primary",K.textContent="Apply",he.append(M,K),de.append(Y,he);const W=document.createElement("div");W.className="nce-theme-swatch-picker__footer";const ke=t=>{if(!t){W.textContent="Theme: (site default — no theme selected)";return}W.textContent=`Theme: ${t}`};ke(n),g.append(A,de,W),m.appendChild(g),y.appendChild(m);let v=null;const x=()=>{var f,w;const t=p?"bg":u||((f=[...re.entries()].find(([,E])=>E.checked))==null?void 0:f[0])||c.kind,r=((w=[...oe.entries()].find(([,E])=>E.checked))==null?void 0:w[0])||c.role,o=v!=null?v:c.shade;return{kind:t,role:r,shade:o}},J=t=>{const r=x(),o=t!=null?t:T(r.kind,r.role,r.shade);q.textContent=o},We=t=>{c=R(D({},x()),{shade:t}),v=null,$()},Je=()=>{const t=x(),r=T(t.kind,t.role,t.shade);try{e.setFgType&&e.setFgType(le()),e.setValue(r)}catch(o){return console.error("[themeSwatchPicker] setValue failed:",o),!1}return!0};M.addEventListener("click",()=>_({saved:!1})),K.addEventListener("click",()=>{Je()&&_({saved:!0})});const $=()=>{const t=x(),r=le(),o=s;v=null,G.replaceChildren();for(const f of Fe(t.role)){const w=document.createElement("button");if(w.type="button",w.className=`nce-theme-swatch-picker__swatch theme-bg-${t.role}-${f}`,w.title=T(t.kind,t.role,f),t.shade===f&&w.classList.add("nce-theme-swatch-picker__swatch--preview"),Ie(t.role,o)){const E=document.createElement("span");E.className="nce-theme-swatch-picker__swatch-label "+Ae(t.role,f,r),E.textContent="Text",w.appendChild(E)}w.addEventListener("mouseenter",()=>{v=f,J(T(t.kind,t.role,f))}),w.addEventListener("mouseleave",()=>{v=null,J()}),w.addEventListener("click",()=>{We(f)}),G.appendChild(w)}J()};for(const t of re.values())t.addEventListener("change",()=>{c=x(),$()});for(const t of oe.values())t.addEventListener("change",()=>{c=x(),$()});for(const t of se.values())t.addEventListener("change",()=>{le(),$()});return $(),{root:y,updateSelected:J,refreshThemeScope:t=>{t?g.setAttribute("data-nce-theme",t):g.removeAttribute("data-nce-theme"),ke(t)}}}function _(e={saved:!1}){F&&(document.removeEventListener("keydown",F),F=null),L&&(L.remove(),L=null);const n=Z;Z=null,n==null||n(e)}function B(){return L!==null}function N(e){var p;B()&&_({saved:!1}),De(),Re();const n=Ve(e.getThemeSlug());if(!n)return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."),ue("no_theme_selected"),!1;const c=(e.getValue()||"").trim();let l=Le(c);e.lockKind&&(l=R(D({},l),{kind:e.lockKind}));const i=e.getFgType?Ne(e.getFgType()):"mono",{root:s}=Oe(e,n,l,c,i);return document.body.appendChild(s),L=s,Z=(p=e.onClose)!=null?p:null,F=u=>{u.key==="Escape"&&(u.preventDefault(),_({saved:!1}))},document.addEventListener("keydown",F),!0}function Be(){var n;if(typeof window=="undefined")return null;const e=window.frappe;return(n=e==null?void 0:e.db)!=null?n:null}function He(e){return pe(this,null,function*(){var l;const n=(e||"").trim();if(!n)return"";const c=Be();if(!c)return console.warn("[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"),"";try{if(!c.exists("NCE Theme",n))return console.warn(`[themeSwatchPicker] NCE Theme "${n}" not found`),"";const i=yield c.get_value("NCE Theme",n,["slug","status"]),s=(l=i.message)!=null?l:i,p=((s==null?void 0:s.slug)||"").trim();return(s==null?void 0:s.status)==="Active"&&p?p:(console.warn(`[themeSwatchPicker] theme "${n}" is not Active or has no slug`),"")}catch(i){return console.error("[themeSwatchPicker] slug lookup failed:",i),""}})}function je(e,n){if(n)return n;if(e.endsWith("_bg_class"))return e.replace(/_bg_class$/,"_fg_type")}function ge(e){return pe(this,null,function*(){var H,y;const{frm:n,themeField:c,valueField:l}=e,i=je(l,e.fgTypeField),s=String((H=n.doc[c])!=null?H:"");let p=yield He(s);if(!p)return console.warn("[themeSwatchPicker] no Active theme slug for field — open cancelled."),ue(ze(s)),!1;const u={getThemeSlug:()=>p,styleKey:(y=e.styleKey)!=null?y:l,getValue:()=>{var m;return String((m=n.doc[l])!=null?m:"")},setValue:m=>{try{n.set_value(l,m)}catch(g){throw console.error("[themeSwatchPicker] frm.set_value failed:",g),g}}};return i&&(u.getFgType=()=>{var m;return String((m=n.doc[i])!=null?m:"mono")},u.setFgType=m=>{try{n.set_value(i,m)}catch(g){throw console.error("[themeSwatchPicker] frm.set_value fg type failed:",g),g}}),e.lockKind&&(u.lockKind=e.lockKind),new Promise(m=>{u.onClose=A=>{var b;(b=e.onClose)==null||b.call(e),m(A.saved)},N(u)||m(!1)})})}function Ue(e){e.ui.themeSwatchPicker={open:ge,close:_}}function we(e){var n,c;return e instanceof HTMLInputElement||e instanceof HTMLSelectElement?e.value:(c=(n=e.textContent)==null?void 0:n.trim())!=null?c:""}function Ge(e,n){if(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement){e.value=n,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0}));return}e.textContent=n}function ee(e){const{themeFieldEl:n,valueFieldEl:c}=e,l={getThemeSlug:()=>we(n),getValue:()=>we(c),setValue:i=>Ge(c,i),onClose:e.onClose};return N(l)}function Ye(e){e.themeSwatchPicker={open:ee,openCore:N,close:_,isOpen:B}}const qe={open:ee,openCore:N,close:_,isOpen:B,parseThemeClass:O,composeThemeClass:T};if(typeof window!="undefined"){Ye(window);const e=window.frappe;e!=null&&e.ui&&Ue(e)}a.close=_,a.composeThemeClass=T,a.default=qe,a.isOpen=B,a.open=N,a.openDeskThemeSwatchPicker=ge,a.openStandaloneThemeSwatchPicker=ee,a.parseThemeClass=O,Object.defineProperties(a,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
//# sourceMappingURL=theme-swatch-picker.umd.js.map
