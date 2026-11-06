(function(s,d){typeof exports=="object"&&typeof module!="undefined"?d(exports):typeof define=="function"&&define.amd?define(["exports"],d):(s=typeof globalThis!="undefined"?globalThis:s||self,d(s.themeSwatchPicker={}))})(this,function(s){"use strict";var Ze=Object.defineProperty,et=Object.defineProperties;var tt=Object.getOwnPropertyDescriptors;var ye=Object.getOwnPropertySymbols;var nt=Object.prototype.hasOwnProperty,ct=Object.prototype.propertyIsEnumerable;var ve=(s,d,h)=>d in s?Ze(s,d,{enumerable:!0,configurable:!0,writable:!0,value:h}):s[d]=h,O=(s,d)=>{for(var h in d||(d={}))nt.call(d,h)&&ve(s,h,d[h]);if(ye)for(var h of ye(d))ct.call(d,h)&&ve(s,h,d[h]);return s},R=(s,d)=>et(s,tt(d));var fe=(s,d,h)=>new Promise((V,I)=>{var ee=k=>{try{S(h.next(k))}catch(C){I(C)}},te=k=>{try{S(h.throw(k))}catch(C){I(C)}},S=k=>k.done?V(k.value):Promise.resolve(k.value).then(ee,te);S((h=h.apply(s,d)).next())});const d=[50,100,200,300,400,500,600,700,800,900,950],h=["primary","secondary","accent","success","info","warning","danger","neutral"],V=["bg","text","border"],I=["primary","secondary"],ee="bg",te="primary",S="mono",k=new Set(h),C=new Set(V),Ee=new Set(d);function Te(e){return C.has(e)}function xe(e){return k.has(e)}function Se(e){return Ee.has(e)}function Ce(e){return e.charAt(0).toUpperCase()+e.slice(1)}const Le=/^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;function B(e){const n=(e||"").trim();if(!n)return null;const c=Le.exec(n);if(!c)return null;const a=c[1],i=c[2],l=Number(c[3]);return!Te(a)||!xe(i)||!Se(l)?null:{kind:a,role:i,shade:l}}function y(e,n,c){return`theme-${e}-${n}-${c}`}function Fe(){return{kind:ee,role:te,shade:500}}function Ne(e){var n;return(n=B(e))!=null?n:Fe()}function Pe(e){return d}function Ae(e){return(e||"").trim().toLowerCase()==="tonal"?"tonal":S}function ze(e,n,c){return`theme-text-${e}-${n}${c==="tonal"?"-fg-tonal":"-fg"}`}const Me={no_theme_selected:{title:"Theme required",body:"Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."},theme_not_available:{title:"Theme not available",body:"The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."}};function Ke(e){return(e||"").trim()?"theme_not_available":"no_theme_selected"}function ge(e){const{title:n,body:c}=Me[e];if(typeof window=="undefined")return;const a=window.frappe;if(a!=null&&a.msgprint){a.msgprint({title:n,message:c,indicator:"orange"});return}const i=document.createElement("div");i.setAttribute("role","alert"),i.style.cssText="position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;",i.innerHTML=`<p style="margin:0 0 .5rem;font-weight:600;">${n}</p><p style="margin:0;color:#374151;">${c}</p>`;const l=document.createElement("div");l.style.cssText="position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";const p=()=>{l.remove(),i.remove()};l.addEventListener("click",p),i.addEventListener("click",p),document.body.append(l,i)}const $e=`/*
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
`;let L=null,F=null,ne=null,N=null,we=!1;const De={bg:"Bg",text:"Text",border:"Border"},Oe={mono:"Mono",tonal:"Tonal"};function Re(){if(we||typeof document=="undefined")return;const e=document.createElement("style");e.setAttribute("data-nce-theme-swatch-picker",""),e.textContent=$e,document.head.appendChild(e),we=!0}function Ve(){if(typeof document=="undefined")return;const e=document.createElement("div");e.className="theme-bg-primary-500",e.style.display="none",document.body.appendChild(e);const n=getComputedStyle(e).backgroundColor;e.remove(),(!n||n==="rgba(0, 0, 0, 0)"||n==="transparent")&&console.warn("[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint.")}function Ie(e){return(e||"").trim()}function Be(e,n){return n?!0:I.includes(e)}function He(e,n,c,a,i){const l=!!(e.getFgType&&e.setFgType),p=l,u=e.lockKind,j=p||!!u,v=document.createElement("div");v.className="nce-theme-swatch-picker__backdrop",v.addEventListener("click",()=>_({saved:!1}));const m=document.createElement("div");m.className="nce-theme-swatch-picker nce-theme-swatch-picker__modal",m.setAttribute("role","dialog"),m.setAttribute("aria-modal","true"),m.setAttribute("aria-label","Theme swatch picker"),m.addEventListener("click",t=>t.stopPropagation());const g=document.createElement("div");n&&g.setAttribute("data-nce-theme",n);const A=document.createElement("div");A.className=p?"nce-theme-swatch-picker__layout nce-theme-swatch-picker__layout--chrome-pick":"nce-theme-swatch-picker__layout";const b=document.createElement("fieldset");b.className="nce-theme-swatch-picker__radios";const re=document.createElement("p");re.className="nce-theme-swatch-picker__column-title",re.textContent="Kind",b.appendChild(re);const U=document.createElement("fieldset");U.className="nce-theme-swatch-picker__radios";const oe=document.createElement("p");oe.className="nce-theme-swatch-picker__column-title",oe.textContent="Role",U.appendChild(oe);const G=document.createElement("div"),ae=document.createElement("p");ae.className="nce-theme-swatch-picker__column-title",ae.textContent="Swatches",G.appendChild(ae);const Y=document.createElement("div");Y.className="nce-theme-swatch-picker__swatch-strip",G.appendChild(Y);const se=new Map;for(const t of V){const r=document.createElement("label");r.className="nce-theme-swatch-picker__radio";const o=document.createElement("input");o.type="radio",o.name="nce-tsp-kind",o.value=t,o.checked=c.kind===t,r.appendChild(o),r.append(" ",De[t]),b.appendChild(r),se.set(t,o)}const ie=new Map;for(const t of h){const r=document.createElement("label");r.className="nce-theme-swatch-picker__radio";const o=document.createElement("input");o.type="radio",o.name="nce-tsp-role",o.value=t,o.checked=c.role===t,r.appendChild(o),r.append(" ",Ce(t)),U.appendChild(r),ie.set(t,o)}A.append(b,U,G),j&&(b.hidden=!0,p?c=R(O({},c),{kind:"bg"}):u&&(c=R(O({},c),{kind:u})));const z=document.createElement("fieldset");z.className="nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type",l||(z.hidden=!0);const le=document.createElement("p");le.className="nce-theme-swatch-picker__column-title",le.textContent="Foreground Type",z.appendChild(le);const de=new Map;let me=i;for(const t of["mono","tonal"]){const r=document.createElement("label");r.className="nce-theme-swatch-picker__radio";const o=document.createElement("input");o.type="radio",o.name="nce-tsp-fg-type",o.value=t,o.checked=me===t,r.appendChild(o),r.append(" ",Oe[t]),z.appendChild(r),de.set(t,o)}l&&G.appendChild(z);const q=()=>{var r;const t=((r=[...de.entries()].find(([,o])=>o.checked))==null?void 0:r[0])||me;return me=t,t},he=document.createElement("div");he.className="nce-theme-swatch-picker__status";const W=document.createElement("div");W.className="nce-theme-swatch-picker__status-main";const pe=document.createElement("span");pe.className="nce-theme-swatch-picker__selected-label",pe.textContent="Selected:";const J=document.createElement("code");J.className="nce-theme-swatch-picker__selected-value",W.append(pe,J);const M=document.createElement("button");M.type="button",M.className="nce-theme-swatch-picker__link-btn",M.textContent="Show in Themes App",M.addEventListener("click",()=>{const t=new URLSearchParams;n&&t.set("theme",n),e.styleKey&&t.set("style",e.styleKey);const r=B(J.textContent||"");r&&(t.set("role",r.role),t.set("kind",r.kind),t.set("shade",String(r.shade)));const o=`${window.location.origin}/themes/theme-settings?${t.toString()}`,f=window.open(o,"nce-themes-app");f==null||f.focus()}),W.append(M);const ue=document.createElement("div");ue.className="nce-theme-swatch-picker__actions";const K=document.createElement("button");K.type="button",K.className="nce-theme-swatch-picker__btn",K.textContent="Cancel";const $=document.createElement("button");$.type="button",$.className="nce-theme-swatch-picker__btn nce-theme-swatch-picker__btn--primary",$.textContent="Apply",ue.append(K,$),he.append(W,ue);const Q=document.createElement("div");Q.className="nce-theme-swatch-picker__footer";const be=t=>{if(!t){Q.textContent="Theme: (site default — no theme selected)";return}Q.textContent=`Theme: ${t}`};be(n),g.append(A,he,Q),m.appendChild(g),v.appendChild(m);let E=null;const T=()=>{var f,w;const t=p?"bg":u||((f=[...se.entries()].find(([,x])=>x.checked))==null?void 0:f[0])||c.kind,r=((w=[...ie.entries()].find(([,x])=>x.checked))==null?void 0:w[0])||c.role,o=E!=null?E:c.shade;return{kind:t,role:r,shade:o}},X=t=>{const r=T(),o=t!=null?t:y(r.kind,r.role,r.shade);J.textContent=o},Z=()=>{if(!e.previewOnPick)return;const t=T();e.setFgType&&e.setFgType(q()),e.setValue(y(t.kind,t.role,t.shade))},Qe=t=>{c=R(O({},T()),{shade:t}),E=null,D(),Z()};e.previewOnPick&&(N=()=>{e.setFgType&&e.setFgType(i),e.setValue(a)});const Xe=()=>{const t=T(),r=y(t.kind,t.role,t.shade);try{e.setFgType&&e.setFgType(q()),e.setValue(r)}catch(o){return console.error("[themeSwatchPicker] setValue failed:",o),!1}return!0};K.addEventListener("click",()=>_({saved:!1})),$.addEventListener("click",()=>{Xe()&&_({saved:!0})});const D=()=>{const t=T(),r=q(),o=l;E=null,Y.replaceChildren();for(const f of Pe(t.role)){const w=document.createElement("button");if(w.type="button",w.className=`nce-theme-swatch-picker__swatch theme-bg-${t.role}-${f}`,w.title=y(t.kind,t.role,f),t.shade===f&&w.classList.add("nce-theme-swatch-picker__swatch--preview"),Be(t.role,o)){const x=document.createElement("span");x.className="nce-theme-swatch-picker__swatch-label "+ze(t.role,f,r),x.textContent="Text",w.appendChild(x)}w.addEventListener("mouseenter",()=>{E=f,X(y(t.kind,t.role,f))}),w.addEventListener("mouseleave",()=>{E=null,X()}),w.addEventListener("click",()=>{Qe(f)}),Y.appendChild(w)}X()};for(const t of se.values())t.addEventListener("change",()=>{c=T(),D(),Z()});for(const t of ie.values())t.addEventListener("change",()=>{c=T(),D(),Z()});for(const t of de.values())t.addEventListener("change",()=>{q(),D(),Z()});return D(),{root:v,updateSelected:X,refreshThemeScope:t=>{t?g.setAttribute("data-nce-theme",t):g.removeAttribute("data-nce-theme"),be(t)}}}function _(e={saved:!1}){if(!e.saved&&N){const c=N;N=null;try{c()}catch(a){console.error("[themeSwatchPicker] restore failed:",a)}}else N=null;F&&(document.removeEventListener("keydown",F),F=null),L&&(L.remove(),L=null);const n=ne;ne=null,n==null||n(e)}function H(){return L!==null}function P(e){var p;H()&&_({saved:!1}),Re(),Ve();const n=Ie(e.getThemeSlug());if(!n)return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."),ge("no_theme_selected"),!1;const c=(e.getValue()||"").trim();let a=Ne(c);e.lockKind&&(a=R(O({},a),{kind:e.lockKind}));const i=e.getFgType?Ae(e.getFgType()):"mono",{root:l}=He(e,n,a,c,i);return document.body.appendChild(l),L=l,ne=(p=e.onClose)!=null?p:null,F=u=>{u.key==="Escape"&&(u.preventDefault(),_({saved:!1}))},document.addEventListener("keydown",F),!0}function je(){var n;if(typeof window=="undefined")return null;const e=window.frappe;return(n=e==null?void 0:e.db)!=null?n:null}function Ue(e){return fe(this,null,function*(){var a;const n=(e||"").trim();if(!n)return"";const c=je();if(!c)return console.warn("[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"),"";try{if(!c.exists("NCE Theme",n))return console.warn(`[themeSwatchPicker] NCE Theme "${n}" not found`),"";const i=yield c.get_value("NCE Theme",n,["slug","status"]),l=(a=i.message)!=null?a:i,p=((l==null?void 0:l.slug)||"").trim();return(l==null?void 0:l.status)==="Active"&&p?p:(console.warn(`[themeSwatchPicker] theme "${n}" is not Active or has no slug`),"")}catch(i){return console.error("[themeSwatchPicker] slug lookup failed:",i),""}})}function Ge(e,n){if(n)return n;if(e.endsWith("_bg_class"))return e.replace(/_bg_class$/,"_fg_type")}function ke(e){return fe(this,null,function*(){var j,v;const{frm:n,themeField:c,valueField:a}=e,i=Ge(a,e.fgTypeField),l=String((j=n.doc[c])!=null?j:"");let p=yield Ue(l);if(!p)return console.warn("[themeSwatchPicker] no Active theme slug for field — open cancelled."),ge(Ke(l)),!1;const u={getThemeSlug:()=>p,styleKey:(v=e.styleKey)!=null?v:a,getValue:()=>{var m;return String((m=n.doc[a])!=null?m:"")},setValue:m=>{try{n.set_value(a,m)}catch(g){throw console.error("[themeSwatchPicker] frm.set_value failed:",g),g}}};return i&&(u.getFgType=()=>{var m;return String((m=n.doc[i])!=null?m:"mono")},u.setFgType=m=>{try{n.set_value(i,m)}catch(g){throw console.error("[themeSwatchPicker] frm.set_value fg type failed:",g),g}}),e.lockKind&&(u.lockKind=e.lockKind),new Promise(m=>{u.onClose=A=>{var b;(b=e.onClose)==null||b.call(e),m(A.saved)},P(u)||m(!1)})})}function Ye(e){e.ui.themeSwatchPicker={open:ke,close:_}}function _e(e){var n,c;return e instanceof HTMLInputElement||e instanceof HTMLSelectElement?e.value:(c=(n=e.textContent)==null?void 0:n.trim())!=null?c:""}function qe(e,n){if(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement){e.value=n,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0}));return}e.textContent=n}function ce(e){const{themeFieldEl:n,valueFieldEl:c}=e,a={getThemeSlug:()=>_e(n),getValue:()=>_e(c),setValue:i=>qe(c,i),onClose:e.onClose};return P(a)}function We(e){e.themeSwatchPicker={open:ce,openCore:P,close:_,isOpen:H}}const Je={open:ce,openCore:P,close:_,isOpen:H,parseThemeClass:B,composeThemeClass:y};if(typeof window!="undefined"){We(window);const e=window.frappe;e!=null&&e.ui&&Ye(e)}s.close=_,s.composeThemeClass=y,s.default=Je,s.isOpen=H,s.open=P,s.openDeskThemeSwatchPicker=ke,s.openStandaloneThemeSwatchPicker=ce,s.parseThemeClass=B,Object.defineProperties(s,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
//# sourceMappingURL=theme-swatch-picker.umd.js.map
