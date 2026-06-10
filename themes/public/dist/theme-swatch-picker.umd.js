(function(a,d){typeof exports=="object"&&typeof module!="undefined"?d(exports):typeof define=="function"&&define.amd?define(["exports"],d):(a=typeof globalThis!="undefined"?globalThis:a||self,d(a.themeSwatchPicker={}))})(this,function(a){"use strict";var Je=Object.defineProperty,Qe=Object.defineProperties;var Xe=Object.getOwnPropertyDescriptors;var ke=Object.getOwnPropertySymbols;var Ze=Object.prototype.hasOwnProperty,et=Object.prototype.propertyIsEnumerable;var _e=(a,d,m)=>d in a?Je(a,d,{enumerable:!0,configurable:!0,writable:!0,value:m}):a[d]=m,D=(a,d)=>{for(var m in d||(d={}))Ze.call(d,m)&&_e(a,m,d[m]);if(ke)for(var m of ke(d))et.call(d,m)&&_e(a,m,d[m]);return a},$=(a,d)=>Qe(a,Xe(d));var he=(a,d,m)=>new Promise((K,R)=>{var U=k=>{try{S(m.next(k))}catch(C){R(C)}},G=k=>{try{S(m.throw(k))}catch(C){R(C)}},S=k=>k.done?K(k.value):Promise.resolve(k.value).then(U,G);S((m=m.apply(a,d)).next())});const d=[50,100,200,300,400,500,600,700,800,900,950],m=["primary","secondary","accent","success","info","warning","danger","neutral"],K=["bg","text","border"],R=["primary","secondary"],U="bg",G="primary",S="mono",k=new Set(m),C=new Set(K),be=new Set(d);function ve(e){return C.has(e)}function ye(e){return k.has(e)}function Ee(e){return be.has(e)}function Te(e){return e.charAt(0).toUpperCase()+e.slice(1)}const xe=/^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;function Y(e){const t=(e||"").trim();if(!t)return null;const c=xe.exec(t);if(!c)return null;const l=c[1],i=c[2],s=Number(c[3]);return!ve(l)||!ye(i)||!Ee(s)?null:{kind:l,role:i,shade:s}}function E(e,t,c){return`theme-${e}-${t}-${c}`}function Se(){return{kind:U,role:G,shade:500}}function Ce(e){var t;return(t=Y(e))!=null?t:Se()}function Fe(e){return d}function Le(e){return(e||"").trim().toLowerCase()==="tonal"?"tonal":S}function Ne(e,t,c){return`theme-text-${e}-${t}${c==="tonal"?"-fg-tonal":"-fg"}`}const Pe={no_theme_selected:{title:"Theme required",body:"Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."},theme_not_available:{title:"Theme not available",body:"The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."}};function Ae(e){return(e||"").trim()?"theme_not_available":"no_theme_selected"}function pe(e){const{title:t,body:c}=Pe[e];if(typeof window=="undefined")return;const l=window.frappe;if(l!=null&&l.msgprint){l.msgprint({title:t,message:c,indicator:"orange"});return}const i=document.createElement("div");i.setAttribute("role","alert"),i.style.cssText="position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;",i.innerHTML=`<p style="margin:0 0 .5rem;font-weight:600;">${t}</p><p style="margin:0;color:#374151;">${c}</p>`;const s=document.createElement("div");s.style.cssText="position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";const p=()=>{s.remove(),i.remove()};s.addEventListener("click",p),i.addEventListener("click",p),document.body.append(s,i)}const Me=`.nce-theme-swatch-picker {
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
`;let F=null,L=null,q=null,ue=!1;const ze={bg:"Bg",text:"Text",border:"Border"},De={mono:"Mono",tonal:"Tonal"};function $e(){if(ue||typeof document=="undefined")return;const e=document.createElement("style");e.setAttribute("data-nce-theme-swatch-picker",""),e.textContent=Me,document.head.appendChild(e),ue=!0}function Ke(){if(typeof document=="undefined")return;const e=document.createElement("div");e.className="theme-bg-primary-500",e.style.display="none",document.body.appendChild(e);const t=getComputedStyle(e).backgroundColor;e.remove(),(!t||t==="rgba(0, 0, 0, 0)"||t==="transparent")&&console.warn("[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint.")}function Re(e){return(e||"").trim()}function Ve(e,t){return t?!0:R.includes(e)}function Oe(e,t,c,l,i){const s=!!(e.getFgType&&e.setFgType),p=s,u=e.lockKind,V=p||!!u,h=document.createElement("div");h.className="nce-theme-swatch-picker__backdrop",h.addEventListener("click",()=>_({saved:!1}));const f=document.createElement("div");f.className="nce-theme-swatch-picker nce-theme-swatch-picker__modal",f.setAttribute("role","dialog"),f.setAttribute("aria-modal","true"),f.setAttribute("aria-label","Theme swatch picker"),f.addEventListener("click",n=>n.stopPropagation());const b=document.createElement("div");t&&b.setAttribute("data-nce-theme",t);const T=document.createElement("div");T.className=p?"nce-theme-swatch-picker__layout nce-theme-swatch-picker__layout--chrome-pick":"nce-theme-swatch-picker__layout";const N=document.createElement("fieldset");N.className="nce-theme-swatch-picker__radios";const X=document.createElement("p");X.className="nce-theme-swatch-picker__column-title",X.textContent="Kind",N.appendChild(X);const O=document.createElement("fieldset");O.className="nce-theme-swatch-picker__radios";const Z=document.createElement("p");Z.className="nce-theme-swatch-picker__column-title",Z.textContent="Role",O.appendChild(Z);const I=document.createElement("div"),ee=document.createElement("p");ee.className="nce-theme-swatch-picker__column-title",ee.textContent="Swatches",I.appendChild(ee);const H=document.createElement("div");H.className="nce-theme-swatch-picker__swatch-strip",I.appendChild(H);const te=new Map;for(const n of K){const o=document.createElement("label");o.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-kind",r.value=n,r.checked=c.kind===n,o.appendChild(r),o.append(" ",ze[n]),N.appendChild(o),te.set(n,r)}const ne=new Map;for(const n of m){const o=document.createElement("label");o.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-role",r.value=n,r.checked=c.role===n,o.appendChild(r),o.append(" ",Te(n)),O.appendChild(o),ne.set(n,r)}T.append(N,O,I),V&&(N.hidden=!0,p?c=$(D({},c),{kind:"bg"}):u&&(c=$(D({},c),{kind:u})));const P=document.createElement("fieldset");P.className="nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type",s||(P.hidden=!0);const ce=document.createElement("p");ce.className="nce-theme-swatch-picker__column-title",ce.textContent="Foreground Type",P.appendChild(ce);const re=new Map;let oe=i;for(const n of["mono","tonal"]){const o=document.createElement("label");o.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-fg-type",r.value=n,r.checked=oe===n,o.appendChild(r),o.append(" ",De[n]),P.appendChild(o),re.set(n,r)}s&&I.appendChild(P);const ae=()=>{var o;const n=((o=[...re.entries()].find(([,r])=>r.checked))==null?void 0:o[0])||oe;return oe=n,n},se=document.createElement("div");se.className="nce-theme-swatch-picker__status";const ie=document.createElement("div");ie.className="nce-theme-swatch-picker__status-main";const le=document.createElement("span");le.className="nce-theme-swatch-picker__selected-label",le.textContent="Selected:";const de=document.createElement("code");de.className="nce-theme-swatch-picker__selected-value",ie.append(le,de);const me=document.createElement("div");me.className="nce-theme-swatch-picker__actions";const A=document.createElement("button");A.type="button",A.className="nce-theme-swatch-picker__btn",A.textContent="Cancel";const M=document.createElement("button");M.type="button",M.className="nce-theme-swatch-picker__btn nce-theme-swatch-picker__btn--primary",M.textContent="Save",me.append(A,M),se.append(ie,me);const B=document.createElement("div");B.className="nce-theme-swatch-picker__footer";const we=n=>{if(!n){B.textContent="Theme: (site default — no theme selected)";return}B.textContent=`Theme: ${n}`};we(t),b.append(T,se,B),f.appendChild(b),h.appendChild(f);let v=null;const x=()=>{var w,g;const n=p?"bg":u||((w=[...te.entries()].find(([,y])=>y.checked))==null?void 0:w[0])||c.kind,o=((g=[...ne.entries()].find(([,y])=>y.checked))==null?void 0:g[0])||c.role,r=v!=null?v:c.shade;return{kind:n,role:o,shade:r}},j=n=>{const o=x(),r=n!=null?n:E(o.kind,o.role,o.shade);de.textContent=r},qe=n=>{c=$(D({},x()),{shade:n}),v=null,z()},We=()=>{const n=x(),o=E(n.kind,n.role,n.shade);try{e.setFgType&&e.setFgType(ae()),e.setValue(o)}catch(r){return console.error("[themeSwatchPicker] setValue failed:",r),!1}return!0};A.addEventListener("click",()=>_({saved:!1})),M.addEventListener("click",()=>{We()&&_({saved:!0})});const z=()=>{const n=x(),o=ae(),r=s;v=null,H.replaceChildren();for(const w of Fe(n.role)){const g=document.createElement("button");if(g.type="button",g.className=`nce-theme-swatch-picker__swatch theme-bg-${n.role}-${w}`,g.title=E(n.kind,n.role,w),n.shade===w&&g.classList.add("nce-theme-swatch-picker__swatch--preview"),Ve(n.role,r)){const y=document.createElement("span");y.className="nce-theme-swatch-picker__swatch-label "+Ne(n.role,w,o),y.textContent="Text",g.appendChild(y)}g.addEventListener("mouseenter",()=>{v=w,j(E(n.kind,n.role,w))}),g.addEventListener("mouseleave",()=>{v=null,j()}),g.addEventListener("click",()=>{qe(w)}),H.appendChild(g)}j()};for(const n of te.values())n.addEventListener("change",()=>{c=x(),z()});for(const n of ne.values())n.addEventListener("change",()=>{c=x(),z()});for(const n of re.values())n.addEventListener("change",()=>{ae(),z()});return z(),{root:h,updateSelected:j,refreshThemeScope:n=>{n?b.setAttribute("data-nce-theme",n):b.removeAttribute("data-nce-theme"),we(n)}}}function _(e={saved:!1}){L&&(document.removeEventListener("keydown",L),L=null),F&&(F.remove(),F=null);const t=q;q=null,t==null||t(e)}function W(){return F!==null}function J(e){var p;W()&&_({saved:!1}),$e(),Ke();const t=Re(e.getThemeSlug());if(!t)return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."),pe("no_theme_selected"),!1;const c=(e.getValue()||"").trim();let l=Ce(c);e.lockKind&&(l=$(D({},l),{kind:e.lockKind}));const i=e.getFgType?Le(e.getFgType()):"mono",{root:s}=Oe(e,t,l,c,i);return document.body.appendChild(s),F=s,q=(p=e.onClose)!=null?p:null,L=u=>{u.key==="Escape"&&(u.preventDefault(),_({saved:!1}))},document.addEventListener("keydown",L),!0}function Ie(){var t;if(typeof window=="undefined")return null;const e=window.frappe;return(t=e==null?void 0:e.db)!=null?t:null}function He(e){return he(this,null,function*(){var l;const t=(e||"").trim();if(!t)return"";const c=Ie();if(!c)return console.warn("[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"),"";try{if(!c.exists("NCE Theme",t))return console.warn(`[themeSwatchPicker] NCE Theme "${t}" not found`),"";const i=yield c.get_value("NCE Theme",t,["slug","status"]),s=(l=i.message)!=null?l:i,p=((s==null?void 0:s.slug)||"").trim();return(s==null?void 0:s.status)==="Active"&&p?p:(console.warn(`[themeSwatchPicker] theme "${t}" is not Active or has no slug`),"")}catch(i){return console.error("[themeSwatchPicker] slug lookup failed:",i),""}})}function Be(e,t){if(t)return t;if(e.endsWith("_bg_class"))return e.replace(/_bg_class$/,"_fg_type")}function fe(e){return he(this,null,function*(){var V;const{frm:t,themeField:c,valueField:l}=e,i=Be(l,e.fgTypeField),s=String((V=t.doc[c])!=null?V:"");let p=yield He(s);if(!p)return console.warn("[themeSwatchPicker] no Active theme slug for field — open cancelled."),pe(Ae(s)),!1;const u={getThemeSlug:()=>p,getValue:()=>{var h;return String((h=t.doc[l])!=null?h:"")},setValue:h=>{try{t.set_value(l,h)}catch(f){throw console.error("[themeSwatchPicker] frm.set_value failed:",f),f}}};return i&&(u.getFgType=()=>{var h;return String((h=t.doc[i])!=null?h:"mono")},u.setFgType=h=>{try{t.set_value(i,h)}catch(f){throw console.error("[themeSwatchPicker] frm.set_value fg type failed:",f),f}}),e.lockKind&&(u.lockKind=e.lockKind),new Promise(h=>{u.onClose=b=>{var T;(T=e.onClose)==null||T.call(e),h(b.saved)},J(u)||h(!1)})})}function je(e){e.ui.themeSwatchPicker={open:fe,close:_}}function ge(e){var t,c;return e instanceof HTMLInputElement||e instanceof HTMLSelectElement?e.value:(c=(t=e.textContent)==null?void 0:t.trim())!=null?c:""}function Ue(e,t){if(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement){e.value=t,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0}));return}e.textContent=t}function Q(e){const{themeFieldEl:t,valueFieldEl:c}=e,l={getThemeSlug:()=>ge(t),getValue:()=>ge(c),setValue:i=>Ue(c,i),onClose:e.onClose};return J(l)}function Ge(e){e.themeSwatchPicker={open:Q,close:_}}const Ye={open:Q,close:_,isOpen:W,parseThemeClass:Y,composeThemeClass:E};if(typeof window!="undefined"){Ge(window);const e=window.frappe;e!=null&&e.ui&&je(e)}a.close=_,a.composeThemeClass=E,a.default=Ye,a.isOpen=W,a.open=J,a.openDeskThemeSwatchPicker=fe,a.openStandaloneThemeSwatchPicker=Q,a.parseThemeClass=Y,Object.defineProperties(a,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
//# sourceMappingURL=theme-swatch-picker.umd.js.map
