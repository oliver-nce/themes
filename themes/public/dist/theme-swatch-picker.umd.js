(function(a,l){typeof exports=="object"&&typeof module!="undefined"?l(exports):typeof define=="function"&&define.amd?define(["exports"],l):(a=typeof globalThis!="undefined"?globalThis:a||self,l(a.themeSwatchPicker={}))})(this,function(a){"use strict";var Ge=Object.defineProperty,Ye=Object.defineProperties;var We=Object.getOwnPropertyDescriptors;var fe=Object.getOwnPropertySymbols;var qe=Object.prototype.hasOwnProperty,Je=Object.prototype.propertyIsEnumerable;var ge=(a,l,m)=>l in a?Ge(a,l,{enumerable:!0,configurable:!0,writable:!0,value:m}):a[l]=m,se=(a,l)=>{for(var m in l||(l={}))qe.call(l,m)&&ge(a,m,l[m]);if(fe)for(var m of fe(l))Je.call(l,m)&&ge(a,m,l[m]);return a},ie=(a,l)=>Ye(a,We(l));var le=(a,l,m)=>new Promise((M,D)=>{var B=_=>{try{x(m.next(_))}catch(S){D(S)}},H=_=>{try{x(m.throw(_))}catch(S){D(S)}},x=_=>_.done?M(_.value):Promise.resolve(_.value).then(B,H);x((m=m.apply(a,l)).next())});const l=["bg","text","border"],m=["primary","secondary","accent","success","info","warning","danger"],M=[100,200,300,500,600,700,900],D=["primary","secondary"],B="bg",H="primary",x="mono",_=new Set(m),S=new Set(l),we=new Set(M);function _e(e){return S.has(e)}function ke(e){return _.has(e)}function be(e){return we.has(e)}const ye=/^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;function j(e){const n=(e||"").trim();if(!n)return null;const c=ye.exec(n);if(!c)return null;const d=c[1],i=c[2],s=Number(c[3]);return!_e(d)||!ke(i)||!be(s)?null:{kind:d,role:i,shade:s}}function E(e,n,c){return`theme-${e}-${n}-${c}`}function ve(){return{kind:B,role:H,shade:500}}function Ee(e){var n;return(n=j(e))!=null?n:ve()}function Te(e){return M}function xe(e){return(e||"").trim().toLowerCase()==="tonal"?"tonal":x}function Se(e,n,c){return`theme-text-${e}-${n}${c==="tonal"?"-fg-tonal":"-fg"}`}const Ce={no_theme_selected:{title:"Theme required",body:"Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."},theme_not_available:{title:"Theme not available",body:"The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."}};function Le(e){return(e||"").trim()?"theme_not_available":"no_theme_selected"}function de(e){const{title:n,body:c}=Ce[e];if(typeof window=="undefined")return;const d=window.frappe;if(d!=null&&d.msgprint){d.msgprint({title:n,message:c,indicator:"orange"});return}const i=document.createElement("div");i.setAttribute("role","alert"),i.style.cssText="position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;",i.innerHTML=`<p style="margin:0 0 .5rem;font-weight:600;">${n}</p><p style="margin:0;color:#374151;">${c}</p>`;const s=document.createElement("div");s.style.cssText="position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";const h=()=>{s.remove(),i.remove()};s.addEventListener("click",h),i.addEventListener("click",h),document.body.append(s,i)}const Fe=`.nce-theme-swatch-picker {
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
	margin-top: 0.875rem;
	padding-top: 0.75rem;
	border-top: 1px solid var(--tsp-modal-border);
	font-size: 0.8125rem;
}

.nce-theme-swatch-picker__actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
	margin-top: 0.75rem;
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
`;let C=null,L=null,K=null,me=!1;const Ne={bg:"Bg",text:"Text",border:"Border"},Pe={primary:"Primary",secondary:"Secondary",accent:"Accent",success:"Success",info:"Info",warning:"Warning",danger:"Danger"},Ae={mono:"Mono",tonal:"Tonal"};function ze(){if(me||typeof document=="undefined")return;const e=document.createElement("style");e.setAttribute("data-nce-theme-swatch-picker",""),e.textContent=Fe,document.head.appendChild(e),me=!0}function Me(){if(typeof document=="undefined")return;const e=document.createElement("div");e.className="theme-bg-primary-500",e.style.display="none",document.body.appendChild(e);const n=getComputedStyle(e).backgroundColor;e.remove(),(!n||n==="rgba(0, 0, 0, 0)"||n==="transparent")&&console.warn("[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint.")}function De(e){return(e||"").trim()}function Re(e,n){return n?!0:D.includes(e)}function $e(e,n,c,d,i){const s=!!(e.getFgType&&e.setFgType),h=s,u=document.createElement("div");u.className="nce-theme-swatch-picker__backdrop",u.addEventListener("click",()=>k());const g=document.createElement("div");g.className="nce-theme-swatch-picker nce-theme-swatch-picker__modal",g.setAttribute("role","dialog"),g.setAttribute("aria-modal","true"),g.setAttribute("aria-label","Theme swatch picker"),g.addEventListener("click",t=>t.stopPropagation());const p=document.createElement("div");n&&p.setAttribute("data-nce-theme",n);const b=document.createElement("div");b.className=h?"nce-theme-swatch-picker__layout nce-theme-swatch-picker__layout--chrome-pick":"nce-theme-swatch-picker__layout";const F=document.createElement("fieldset");F.className="nce-theme-swatch-picker__radios";const W=document.createElement("p");W.className="nce-theme-swatch-picker__column-title",W.textContent="Kind",F.appendChild(W);const R=document.createElement("fieldset");R.className="nce-theme-swatch-picker__radios";const q=document.createElement("p");q.className="nce-theme-swatch-picker__column-title",q.textContent="Role",R.appendChild(q);const $=document.createElement("div"),J=document.createElement("p");J.className="nce-theme-swatch-picker__column-title",J.textContent="Swatches",$.appendChild(J);const O=document.createElement("div");O.className="nce-theme-swatch-picker__swatch-strip",$.appendChild(O);const Q=new Map;for(const t of l){const o=document.createElement("label");o.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-kind",r.value=t,r.checked=c.kind===t,o.appendChild(r),o.append(" ",Ne[t]),F.appendChild(o),Q.set(t,r)}const X=new Map;for(const t of m){const o=document.createElement("label");o.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-role",r.value=t,r.checked=c.role===t,o.appendChild(r),o.append(" ",Pe[t]),R.appendChild(o),X.set(t,r)}b.append(F,R,$),h&&(F.hidden=!0,c=ie(se({},c),{kind:"bg"}));const N=document.createElement("fieldset");N.className="nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type",s||(N.hidden=!0);const Z=document.createElement("p");Z.className="nce-theme-swatch-picker__column-title",Z.textContent="Foreground Type",N.appendChild(Z);const ee=new Map;let te=i;for(const t of["mono","tonal"]){const o=document.createElement("label");o.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-fg-type",r.value=t,r.checked=te===t,o.appendChild(r),o.append(" ",Ae[t]),N.appendChild(o),ee.set(t,r)}s&&$.appendChild(N);const ne=()=>{var o;const t=((o=[...ee.entries()].find(([,r])=>r.checked))==null?void 0:o[0])||te;return te=t,t},ce=document.createElement("div");ce.className="nce-theme-swatch-picker__status";const re=document.createElement("span");re.className="nce-theme-swatch-picker__selected-label",re.textContent="Selected:";const oe=document.createElement("code");oe.className="nce-theme-swatch-picker__selected-value",ce.append(re,oe);const ae=document.createElement("div");ae.className="nce-theme-swatch-picker__actions";const P=document.createElement("button");P.type="button",P.className="nce-theme-swatch-picker__btn",P.textContent="Cancel",P.addEventListener("click",()=>k());const A=document.createElement("button");A.type="button",A.className="nce-theme-swatch-picker__btn nce-theme-swatch-picker__btn--primary",A.textContent="Save",A.addEventListener("click",()=>{const t=T(),o=E(t.kind,t.role,t.shade);try{e.setFgType&&e.setFgType(ne()),e.setValue(o)}catch(r){console.error("[themeSwatchPicker] setValue failed:",r);return}k()}),ae.append(P,A);const V=document.createElement("div");V.className="nce-theme-swatch-picker__footer";const ue=t=>{if(!t){V.textContent="Theme: (site default — no theme selected)";return}V.textContent=`Theme: ${t}`};ue(n),p.append(b,ce,ae,V),g.appendChild(p),u.appendChild(g);let y=null;const T=()=>{var w,f;const t=h?"bg":((w=[...Q.entries()].find(([,v])=>v.checked))==null?void 0:w[0])||c.kind,o=((f=[...X.entries()].find(([,v])=>v.checked))==null?void 0:f[0])||c.role,r=y!=null?y:c.shade;return{kind:t,role:o,shade:r}},I=t=>{const o=T(),r=t!=null?t:E(o.kind,o.role,o.shade);oe.textContent=r},Ue=t=>{c=ie(se({},T()),{shade:t}),y=null,z()},z=()=>{const t=T(),o=ne(),r=s;y=null,O.replaceChildren();for(const w of Te(t.role)){const f=document.createElement("button");if(f.type="button",f.className=`nce-theme-swatch-picker__swatch theme-bg-${t.role}-${w}`,f.title=E(t.kind,t.role,w),t.shade===w&&f.classList.add("nce-theme-swatch-picker__swatch--preview"),Re(t.role,r)){const v=document.createElement("span");v.className="nce-theme-swatch-picker__swatch-label "+Se(t.role,w,o),v.textContent="Text",f.appendChild(v)}f.addEventListener("mouseenter",()=>{y=w,I(E(t.kind,t.role,w))}),f.addEventListener("mouseleave",()=>{y=null,I()}),f.addEventListener("click",()=>{Ue(w)}),O.appendChild(f)}I()};for(const t of Q.values())t.addEventListener("change",()=>{c=T(),z()});for(const t of X.values())t.addEventListener("change",()=>{c=T(),z()});for(const t of ee.values())t.addEventListener("change",()=>{ne(),z()});return z(),{root:u,updateSelected:I,refreshThemeScope:t=>{t?p.setAttribute("data-nce-theme",t):p.removeAttribute("data-nce-theme"),ue(t)}}}function k(){L&&(document.removeEventListener("keydown",L),L=null),C&&(C.remove(),C=null);const e=K;K=null,e==null||e()}function U(){return C!==null}function G(e){var h;U()&&k(),ze(),Me();const n=De(e.getThemeSlug());if(!n)return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."),de("no_theme_selected"),!1;const c=(e.getValue()||"").trim(),d=Ee(c),i=e.getFgType?xe(e.getFgType()):"mono",{root:s}=$e(e,n,d,c,i);return document.body.appendChild(s),C=s,K=(h=e.onClose)!=null?h:null,L=u=>{u.key==="Escape"&&(u.preventDefault(),k())},document.addEventListener("keydown",L),!0}function Oe(){var n;if(typeof window=="undefined")return null;const e=window.frappe;return(n=e==null?void 0:e.db)!=null?n:null}function Ve(e){return le(this,null,function*(){var d;const n=(e||"").trim();if(!n)return"";const c=Oe();if(!c)return console.warn("[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"),"";try{if(!c.exists("NCE Theme",n))return console.warn(`[themeSwatchPicker] NCE Theme "${n}" not found`),"";const i=yield c.get_value("NCE Theme",n,["slug","status"]),s=(d=i.message)!=null?d:i,h=((s==null?void 0:s.slug)||"").trim();return(s==null?void 0:s.status)==="Active"&&h?h:(console.warn(`[themeSwatchPicker] theme "${n}" is not Active or has no slug`),"")}catch(i){return console.error("[themeSwatchPicker] slug lookup failed:",i),""}})}function Ie(e,n){if(n)return n;if(e.endsWith("_bg_class"))return e.replace(/_bg_class$/,"_fg_type")}function he(e){return le(this,null,function*(){var g;const{frm:n,themeField:c,valueField:d}=e,i=Ie(d,e.fgTypeField),s=String((g=n.doc[c])!=null?g:"");let h=yield Ve(s);if(!h)return console.warn("[themeSwatchPicker] no Active theme slug for field — open cancelled."),de(Le(s)),!1;const u={getThemeSlug:()=>h,getValue:()=>{var p;return String((p=n.doc[d])!=null?p:"")},setValue:p=>{try{n.set_value(d,p)}catch(b){throw console.error("[themeSwatchPicker] frm.set_value failed:",b),b}},onClose:e.onClose};return i&&(u.getFgType=()=>{var p;return String((p=n.doc[i])!=null?p:"mono")},u.setFgType=p=>{try{n.set_value(i,p)}catch(b){throw console.error("[themeSwatchPicker] frm.set_value fg type failed:",b),b}}),G(u)})}function Be(e){e.ui.themeSwatchPicker={open:he,close:k}}function pe(e){var n,c;return e instanceof HTMLInputElement||e instanceof HTMLSelectElement?e.value:(c=(n=e.textContent)==null?void 0:n.trim())!=null?c:""}function He(e,n){if(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement){e.value=n,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0}));return}e.textContent=n}function Y(e){const{themeFieldEl:n,valueFieldEl:c}=e,d={getThemeSlug:()=>pe(n),getValue:()=>pe(c),setValue:i=>He(c,i),onClose:e.onClose};return G(d)}function je(e){e.themeSwatchPicker={open:Y,close:k}}const Ke={open:Y,close:k,isOpen:U,parseThemeClass:j,composeThemeClass:E};if(typeof window!="undefined"){je(window);const e=window.frappe;e!=null&&e.ui&&Be(e)}a.close=k,a.composeThemeClass=E,a.default=Ke,a.isOpen=U,a.open=G,a.openDeskThemeSwatchPicker=he,a.openStandaloneThemeSwatchPicker=Y,a.parseThemeClass=j,Object.defineProperties(a,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
//# sourceMappingURL=theme-swatch-picker.umd.js.map
