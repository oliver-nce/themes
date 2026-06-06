(function(o,l){typeof exports=="object"&&typeof module!="undefined"?l(exports):typeof define=="function"&&define.amd?define(["exports"],l):(o=typeof globalThis!="undefined"?globalThis:o||self,l(o.themeSwatchPicker={}))})(this,function(o){"use strict";var We=Object.defineProperty,qe=Object.defineProperties;var Je=Object.getOwnPropertyDescriptors;var ge=Object.getOwnPropertySymbols;var Qe=Object.prototype.hasOwnProperty,Xe=Object.prototype.propertyIsEnumerable;var we=(o,l,m)=>l in o?We(o,l,{enumerable:!0,configurable:!0,writable:!0,value:m}):o[l]=m,ie=(o,l)=>{for(var m in l||(l={}))Qe.call(l,m)&&we(o,m,l[m]);if(ge)for(var m of ge(l))Xe.call(l,m)&&we(o,m,l[m]);return o},le=(o,l)=>qe(o,Je(l));var de=(o,l,m)=>new Promise((D,R)=>{var H=k=>{try{C(m.next(k))}catch(L){R(L)}},j=k=>{try{C(m.throw(k))}catch(L){R(L)}},C=k=>k.done?D(k.value):Promise.resolve(k.value).then(H,j);C((m=m.apply(o,l)).next())});const l=["bg","text","border"],m=["primary","secondary","accent","success","info","warning","danger"],D=[100,200,300,500,600,700,900],R=["primary","secondary"],H="bg",j="primary",C="mono",k=new Set(m),L=new Set(l),_e=new Set(D);function ke(e){return L.has(e)}function be(e){return k.has(e)}function ye(e){return _e.has(e)}const ve=/^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;function K(e){const t=(e||"").trim();if(!t)return null;const c=ve.exec(t);if(!c)return null;const d=c[1],i=c[2],s=Number(c[3]);return!ke(d)||!be(i)||!ye(s)?null:{kind:d,role:i,shade:s}}function T(e,t,c){return`theme-${e}-${t}-${c}`}function Ee(){return{kind:H,role:j,shade:500}}function Te(e){var t;return(t=K(e))!=null?t:Ee()}function xe(e){return D}function Se(e){return(e||"").trim().toLowerCase()==="tonal"?"tonal":C}function Ce(e,t,c){return`theme-text-${e}-${t}${c==="tonal"?"-fg-tonal":"-fg"}`}const Le={no_theme_selected:{title:"Theme required",body:"Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."},theme_not_available:{title:"Theme not available",body:"The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."}};function Fe(e){return(e||"").trim()?"theme_not_available":"no_theme_selected"}function me(e){const{title:t,body:c}=Le[e];if(typeof window=="undefined")return;const d=window.frappe;if(d!=null&&d.msgprint){d.msgprint({title:t,message:c,indicator:"orange"});return}const i=document.createElement("div");i.setAttribute("role","alert"),i.style.cssText="position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;",i.innerHTML=`<p style="margin:0 0 .5rem;font-weight:600;">${t}</p><p style="margin:0;color:#374151;">${c}</p>`;const s=document.createElement("div");s.style.cssText="position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";const p=()=>{s.remove(),i.remove()};s.addEventListener("click",p),i.addEventListener("click",p),document.body.append(s,i)}const Ne=`.nce-theme-swatch-picker {
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
`;let F=null,N=null,U=null,he=!1;const Pe={bg:"Bg",text:"Text",border:"Border"},Ae={primary:"Primary",secondary:"Secondary",accent:"Accent",success:"Success",info:"Info",warning:"Warning",danger:"Danger"},Me={mono:"Mono",tonal:"Tonal"};function ze(){if(he||typeof document=="undefined")return;const e=document.createElement("style");e.setAttribute("data-nce-theme-swatch-picker",""),e.textContent=Ne,document.head.appendChild(e),he=!0}function De(){if(typeof document=="undefined")return;const e=document.createElement("div");e.className="theme-bg-primary-500",e.style.display="none",document.body.appendChild(e);const t=getComputedStyle(e).backgroundColor;e.remove(),(!t||t==="rgba(0, 0, 0, 0)"||t==="transparent")&&console.warn("[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint.")}function Re(e){return(e||"").trim()}function $e(e,t){return t?!0:R.includes(e)}function Oe(e,t,c,d,i){const s=!!(e.getFgType&&e.setFgType),p=s,u=document.createElement("div");u.className="nce-theme-swatch-picker__backdrop",u.addEventListener("click",()=>b({saved:!1}));const g=document.createElement("div");g.className="nce-theme-swatch-picker nce-theme-swatch-picker__modal",g.setAttribute("role","dialog"),g.setAttribute("aria-modal","true"),g.setAttribute("aria-label","Theme swatch picker"),g.addEventListener("click",n=>n.stopPropagation());const h=document.createElement("div");t&&h.setAttribute("data-nce-theme",t);const w=document.createElement("div");w.className=p?"nce-theme-swatch-picker__layout nce-theme-swatch-picker__layout--chrome-pick":"nce-theme-swatch-picker__layout";const y=document.createElement("fieldset");y.className="nce-theme-swatch-picker__radios";const x=document.createElement("p");x.className="nce-theme-swatch-picker__column-title",x.textContent="Kind",y.appendChild(x);const $=document.createElement("fieldset");$.className="nce-theme-swatch-picker__radios";const q=document.createElement("p");q.className="nce-theme-swatch-picker__column-title",q.textContent="Role",$.appendChild(q);const O=document.createElement("div"),J=document.createElement("p");J.className="nce-theme-swatch-picker__column-title",J.textContent="Swatches",O.appendChild(J);const V=document.createElement("div");V.className="nce-theme-swatch-picker__swatch-strip",O.appendChild(V);const Q=new Map;for(const n of l){const a=document.createElement("label");a.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-kind",r.value=n,r.checked=c.kind===n,a.appendChild(r),a.append(" ",Pe[n]),y.appendChild(a),Q.set(n,r)}const X=new Map;for(const n of m){const a=document.createElement("label");a.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-role",r.value=n,r.checked=c.role===n,a.appendChild(r),a.append(" ",Ae[n]),$.appendChild(a),X.set(n,r)}w.append(y,$,O),p&&(y.hidden=!0,c=le(ie({},c),{kind:"bg"}));const P=document.createElement("fieldset");P.className="nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type",s||(P.hidden=!0);const Z=document.createElement("p");Z.className="nce-theme-swatch-picker__column-title",Z.textContent="Foreground Type",P.appendChild(Z);const ee=new Map;let te=i;for(const n of["mono","tonal"]){const a=document.createElement("label");a.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-fg-type",r.value=n,r.checked=te===n,a.appendChild(r),a.append(" ",Me[n]),P.appendChild(a),ee.set(n,r)}s&&O.appendChild(P);const ne=()=>{var a;const n=((a=[...ee.entries()].find(([,r])=>r.checked))==null?void 0:a[0])||te;return te=n,n},ce=document.createElement("div");ce.className="nce-theme-swatch-picker__status";const re=document.createElement("div");re.className="nce-theme-swatch-picker__status-main";const ae=document.createElement("span");ae.className="nce-theme-swatch-picker__selected-label",ae.textContent="Selected:";const oe=document.createElement("code");oe.className="nce-theme-swatch-picker__selected-value",re.append(ae,oe);const se=document.createElement("div");se.className="nce-theme-swatch-picker__actions";const A=document.createElement("button");A.type="button",A.className="nce-theme-swatch-picker__btn",A.textContent="Cancel";const M=document.createElement("button");M.type="button",M.className="nce-theme-swatch-picker__btn nce-theme-swatch-picker__btn--primary",M.textContent="Save",se.append(A,M),ce.append(re,se);const I=document.createElement("div");I.className="nce-theme-swatch-picker__footer";const fe=n=>{if(!n){I.textContent="Theme: (site default — no theme selected)";return}I.textContent=`Theme: ${n}`};fe(t),h.append(w,ce,I),g.appendChild(h),u.appendChild(g);let v=null;const S=()=>{var _,f;const n=p?"bg":((_=[...Q.entries()].find(([,E])=>E.checked))==null?void 0:_[0])||c.kind,a=((f=[...X.entries()].find(([,E])=>E.checked))==null?void 0:f[0])||c.role,r=v!=null?v:c.shade;return{kind:n,role:a,shade:r}},B=n=>{const a=S(),r=n!=null?n:T(a.kind,a.role,a.shade);oe.textContent=r},Ge=n=>{c=le(ie({},S()),{shade:n}),v=null,z()},Ye=()=>{const n=S(),a=T(n.kind,n.role,n.shade);try{e.setFgType&&e.setFgType(ne()),e.setValue(a)}catch(r){return console.error("[themeSwatchPicker] setValue failed:",r),!1}return!0};A.addEventListener("click",()=>b({saved:!1})),M.addEventListener("click",()=>{Ye()&&b({saved:!0})});const z=()=>{const n=S(),a=ne(),r=s;v=null,V.replaceChildren();for(const _ of xe(n.role)){const f=document.createElement("button");if(f.type="button",f.className=`nce-theme-swatch-picker__swatch theme-bg-${n.role}-${_}`,f.title=T(n.kind,n.role,_),n.shade===_&&f.classList.add("nce-theme-swatch-picker__swatch--preview"),$e(n.role,r)){const E=document.createElement("span");E.className="nce-theme-swatch-picker__swatch-label "+Ce(n.role,_,a),E.textContent="Text",f.appendChild(E)}f.addEventListener("mouseenter",()=>{v=_,B(T(n.kind,n.role,_))}),f.addEventListener("mouseleave",()=>{v=null,B()}),f.addEventListener("click",()=>{Ge(_)}),V.appendChild(f)}B()};for(const n of Q.values())n.addEventListener("change",()=>{c=S(),z()});for(const n of X.values())n.addEventListener("change",()=>{c=S(),z()});for(const n of ee.values())n.addEventListener("change",()=>{ne(),z()});return z(),{root:u,updateSelected:B,refreshThemeScope:n=>{n?h.setAttribute("data-nce-theme",n):h.removeAttribute("data-nce-theme"),fe(n)}}}function b(e={saved:!1}){N&&(document.removeEventListener("keydown",N),N=null),F&&(F.remove(),F=null);const t=U;U=null,t==null||t(e)}function G(){return F!==null}function Y(e){var p;G()&&b({saved:!1}),ze(),De();const t=Re(e.getThemeSlug());if(!t)return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."),me("no_theme_selected"),!1;const c=(e.getValue()||"").trim(),d=Te(c),i=e.getFgType?Se(e.getFgType()):"mono",{root:s}=Oe(e,t,d,c,i);return document.body.appendChild(s),F=s,U=(p=e.onClose)!=null?p:null,N=u=>{u.key==="Escape"&&(u.preventDefault(),b({saved:!1}))},document.addEventListener("keydown",N),!0}function Ve(){var t;if(typeof window=="undefined")return null;const e=window.frappe;return(t=e==null?void 0:e.db)!=null?t:null}function Ie(e){return de(this,null,function*(){var d;const t=(e||"").trim();if(!t)return"";const c=Ve();if(!c)return console.warn("[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"),"";try{if(!c.exists("NCE Theme",t))return console.warn(`[themeSwatchPicker] NCE Theme "${t}" not found`),"";const i=yield c.get_value("NCE Theme",t,["slug","status"]),s=(d=i.message)!=null?d:i,p=((s==null?void 0:s.slug)||"").trim();return(s==null?void 0:s.status)==="Active"&&p?p:(console.warn(`[themeSwatchPicker] theme "${t}" is not Active or has no slug`),"")}catch(i){return console.error("[themeSwatchPicker] slug lookup failed:",i),""}})}function Be(e,t){if(t)return t;if(e.endsWith("_bg_class"))return e.replace(/_bg_class$/,"_fg_type")}function pe(e){return de(this,null,function*(){var g;const{frm:t,themeField:c,valueField:d}=e,i=Be(d,e.fgTypeField),s=String((g=t.doc[c])!=null?g:"");let p=yield Ie(s);if(!p)return console.warn("[themeSwatchPicker] no Active theme slug for field — open cancelled."),me(Fe(s)),!1;const u={getThemeSlug:()=>p,getValue:()=>{var h;return String((h=t.doc[d])!=null?h:"")},setValue:h=>{try{t.set_value(d,h)}catch(w){throw console.error("[themeSwatchPicker] frm.set_value failed:",w),w}}};return i&&(u.getFgType=()=>{var h;return String((h=t.doc[i])!=null?h:"mono")},u.setFgType=h=>{try{t.set_value(i,h)}catch(w){throw console.error("[themeSwatchPicker] frm.set_value fg type failed:",w),w}}),new Promise(h=>{u.onClose=y=>{var x;(x=e.onClose)==null||x.call(e),h(y.saved)},Y(u)||h(!1)})})}function He(e){e.ui.themeSwatchPicker={open:pe,close:b}}function ue(e){var t,c;return e instanceof HTMLInputElement||e instanceof HTMLSelectElement?e.value:(c=(t=e.textContent)==null?void 0:t.trim())!=null?c:""}function je(e,t){if(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement){e.value=t,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0}));return}e.textContent=t}function W(e){const{themeFieldEl:t,valueFieldEl:c}=e,d={getThemeSlug:()=>ue(t),getValue:()=>ue(c),setValue:i=>je(c,i),onClose:e.onClose};return Y(d)}function Ke(e){e.themeSwatchPicker={open:W,close:b}}const Ue={open:W,close:b,isOpen:G,parseThemeClass:K,composeThemeClass:T};if(typeof window!="undefined"){Ke(window);const e=window.frappe;e!=null&&e.ui&&He(e)}o.close=b,o.composeThemeClass=T,o.default=Ue,o.isOpen=G,o.open=Y,o.openDeskThemeSwatchPicker=pe,o.openStandaloneThemeSwatchPicker=W,o.parseThemeClass=K,Object.defineProperties(o,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
//# sourceMappingURL=theme-swatch-picker.umd.js.map
