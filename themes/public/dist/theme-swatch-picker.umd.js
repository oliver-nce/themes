(function(o,d){typeof exports=="object"&&typeof module!="undefined"?d(exports):typeof define=="function"&&define.amd?define(["exports"],d):(o=typeof globalThis!="undefined"?globalThis:o||self,d(o.themeSwatchPicker={}))})(this,function(o){"use strict";var Ke=Object.defineProperty,je=Object.defineProperties;var Ue=Object.getOwnPropertyDescriptors;var de=Object.getOwnPropertySymbols;var Ge=Object.prototype.hasOwnProperty,Ye=Object.prototype.propertyIsEnumerable;var me=(o,d,m)=>d in o?Ke(o,d,{enumerable:!0,configurable:!0,writable:!0,value:m}):o[d]=m,he=(o,d)=>{for(var m in d||(d={}))Ge.call(d,m)&&me(o,m,d[m]);if(de)for(var m of de(d))Ye.call(d,m)&&me(o,m,d[m]);return o},pe=(o,d)=>je(o,Ue(d));var re=(o,d,m)=>new Promise((N,P)=>{var I=k=>{try{E(m.next(k))}catch(S){P(S)}},V=k=>{try{E(m.throw(k))}catch(S){P(S)}},E=k=>k.done?N(k.value):Promise.resolve(k.value).then(I,V);E((m=m.apply(o,d)).next())});const d=["bg","text","border"],m=["primary","secondary","accent","success","info","warning","danger"],N=[100,200,300,500,600,700,900],P=["primary","secondary"],I="bg",V="primary",E="mono",k=new Set(m),S=new Set(d),ue=new Set(N);function fe(e){return S.has(e)}function ge(e){return k.has(e)}function we(e){return ue.has(e)}const ke=/^theme-(bg|text|border)-(primary|secondary|accent|success|info|warning|danger)-(100|200|300|500|600|700|900)$/;function H(e){const n=(e||"").trim();if(!n)return null;const c=ke.exec(n);if(!c)return null;const l=c[1],i=c[2],a=Number(c[3]);return!fe(l)||!ge(i)||!we(a)?null:{kind:l,role:i,shade:a}}function y(e,n,c){return`theme-${e}-${n}-${c}`}function _e(){return{kind:I,role:V,shade:500}}function be(e){var n;return(n=H(e))!=null?n:_e()}function ye(e){return N}function ve(e){return(e||"").trim().toLowerCase()==="tonal"?"tonal":E}function Te(e,n,c){return`theme-text-${e}-${n}${c==="tonal"?"-fg-tonal":"-fg"}`}const Ee={no_theme_selected:{title:"Theme required",body:"Select a <strong>Theme</strong> on this form before picking a color. The picker needs a theme so it can show the colors your panel will actually use."},theme_not_available:{title:"Theme not available",body:"The selected theme can't be used for color picking. Choose an <strong>Active</strong> theme from the Theme field, then try again."}};function Se(e){return(e||"").trim()?"theme_not_available":"no_theme_selected"}function oe(e){const{title:n,body:c}=Ee[e];if(typeof window=="undefined")return;const l=window.frappe;if(l!=null&&l.msgprint){l.msgprint({title:n,message:c,indicator:"orange"});return}const i=document.createElement("div");i.setAttribute("role","alert"),i.style.cssText="position:fixed;z-index:10002;top:50%;left:50%;transform:translate(-50%,-50%);max-width:22rem;padding:1rem 1.25rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;box-shadow:0 16px 48px rgba(0,0,0,.18);font:14px/1.45 system-ui,sans-serif;",i.innerHTML=`<p style="margin:0 0 .5rem;font-weight:600;">${n}</p><p style="margin:0;color:#374151;">${c}</p>`;const a=document.createElement("div");a.style.cssText="position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);";const h=()=>{a.remove(),i.remove()};a.addEventListener("click",h),i.addEventListener("click",h),document.body.append(a,i)}const xe=`.nce-theme-swatch-picker {
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
`;let x=null,C=null,B=null,ae=!1;const Ce={bg:"Bg",text:"Text",border:"Border"},Fe={primary:"Primary",secondary:"Secondary",accent:"Accent",success:"Success",info:"Info",warning:"Warning",danger:"Danger"},Le={mono:"Mono",tonal:"Tonal"};function Ne(){if(ae||typeof document=="undefined")return;const e=document.createElement("style");e.setAttribute("data-nce-theme-swatch-picker",""),e.textContent=xe,document.head.appendChild(e),ae=!0}function Pe(){if(typeof document=="undefined")return;const e=document.createElement("div");e.className="theme-bg-primary-500",e.style.display="none",document.body.appendChild(e);const n=getComputedStyle(e).backgroundColor;e.remove(),(!n||n==="rgba(0, 0, 0, 0)"||n==="transparent")&&console.warn("[themeSwatchPicker] nce_theme.css may not be loaded — swatches may not paint.")}function Ae(e){return(e||"").trim()}function Me(e,n){return n?!0:P.includes(e)}function ze(e,n,c,l,i){const a=!!(e.getFgType&&e.setFgType),h=a,u=document.createElement("div");u.className="nce-theme-swatch-picker__backdrop",u.addEventListener("click",()=>v());const g=document.createElement("div");g.className="nce-theme-swatch-picker nce-theme-swatch-picker__modal",g.setAttribute("role","dialog"),g.setAttribute("aria-modal","true"),g.setAttribute("aria-label","Theme swatch picker"),g.addEventListener("click",t=>t.stopPropagation());const p=document.createElement("div");n&&p.setAttribute("data-nce-theme",n);const _=document.createElement("div");_.className=h?"nce-theme-swatch-picker__layout nce-theme-swatch-picker__layout--chrome-pick":"nce-theme-swatch-picker__layout";const F=document.createElement("fieldset");F.className="nce-theme-swatch-picker__radios";const G=document.createElement("p");G.className="nce-theme-swatch-picker__column-title",G.textContent="Kind",F.appendChild(G);const A=document.createElement("fieldset");A.className="nce-theme-swatch-picker__radios";const Y=document.createElement("p");Y.className="nce-theme-swatch-picker__column-title",Y.textContent="Role",A.appendChild(Y);const M=document.createElement("div"),W=document.createElement("p");W.className="nce-theme-swatch-picker__column-title",W.textContent="Swatches",M.appendChild(W);const z=document.createElement("div");z.className="nce-theme-swatch-picker__swatch-strip",M.appendChild(z);const q=new Map;for(const t of d){const s=document.createElement("label");s.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-kind",r.value=t,r.checked=c.kind===t,s.appendChild(r),s.append(" ",Ce[t]),F.appendChild(s),q.set(t,r)}const J=new Map;for(const t of m){const s=document.createElement("label");s.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-role",r.value=t,r.checked=c.role===t,s.appendChild(r),s.append(" ",Fe[t]),A.appendChild(s),J.set(t,r)}_.append(F,A,M),h&&(F.hidden=!0,c=pe(he({},c),{kind:"bg"}));const L=document.createElement("fieldset");L.className="nce-theme-swatch-picker__radios nce-theme-swatch-picker__radios--horizontal nce-theme-swatch-picker__fg-type",a||(L.hidden=!0);const Q=document.createElement("p");Q.className="nce-theme-swatch-picker__column-title",Q.textContent="Foreground Type",L.appendChild(Q);const X=new Map;let Z=i;for(const t of["mono","tonal"]){const s=document.createElement("label");s.className="nce-theme-swatch-picker__radio";const r=document.createElement("input");r.type="radio",r.name="nce-tsp-fg-type",r.value=t,r.checked=Z===t,s.appendChild(r),s.append(" ",Le[t]),L.appendChild(s),X.set(t,r)}a&&M.appendChild(L);const ee=()=>{var s;const t=((s=[...X.entries()].find(([,r])=>r.checked))==null?void 0:s[0])||Z;return Z=t,t},te=document.createElement("div");te.className="nce-theme-swatch-picker__status";const ne=document.createElement("span");ne.className="nce-theme-swatch-picker__selected-label",ne.textContent="Selected:";const ce=document.createElement("code");ce.className="nce-theme-swatch-picker__selected-value",te.append(ne,ce);const D=document.createElement("div");D.className="nce-theme-swatch-picker__footer";const le=t=>{if(!t){D.textContent="Theme: (site default — no theme selected)";return}D.textContent=`Theme: ${t}`};le(n),p.append(_,te,D),g.appendChild(p),u.appendChild(g);let T=null;const R=()=>{var w,f;const t=h?"bg":((w=[...q.entries()].find(([,b])=>b.checked))==null?void 0:w[0])||c.kind,s=((f=[...J.entries()].find(([,b])=>b.checked))==null?void 0:f[0])||c.role,r=T!=null?T:c.shade;return{kind:t,role:s,shade:r}},$=t=>{const s=R(),r=t!=null?t:y(s.kind,s.role,s.shade);ce.textContent=r},O=()=>{const t=R(),s=ee(),r=a;T=null,z.replaceChildren();for(const w of ye(t.role)){const f=document.createElement("button");if(f.type="button",f.className=`nce-theme-swatch-picker__swatch theme-bg-${t.role}-${w}`,f.title=y(t.kind,t.role,w),t.shade===w&&f.classList.add("nce-theme-swatch-picker__swatch--preview"),Me(t.role,r)){const b=document.createElement("span");b.className="nce-theme-swatch-picker__swatch-label "+Te(t.role,w,s),b.textContent="Text",f.appendChild(b)}f.addEventListener("mouseenter",()=>{T=w,$(y(t.kind,t.role,w))}),f.addEventListener("mouseleave",()=>{T=null,$(l||y(t.kind,t.role,t.shade))}),f.addEventListener("click",()=>{const b=y(t.kind,t.role,w);try{e.setFgType&&e.setFgType(ee()),e.setValue(b)}catch(Be){console.error("[themeSwatchPicker] setValue failed:",Be);return}v()}),z.appendChild(f)}$(l||y(t.kind,t.role,t.shade))};for(const t of q.values())t.addEventListener("change",()=>{c=R(),O()});for(const t of J.values())t.addEventListener("change",()=>{c=R(),O()});for(const t of X.values())t.addEventListener("change",()=>{ee(),O()});return O(),{root:u,updateSelected:$,refreshThemeScope:t=>{t?p.setAttribute("data-nce-theme",t):p.removeAttribute("data-nce-theme"),le(t)}}}function v(){C&&(document.removeEventListener("keydown",C),C=null),x&&(x.remove(),x=null);const e=B;B=null,e==null||e()}function K(){return x!==null}function j(e){var h;K()&&v(),Ne(),Pe();const n=Ae(e.getThemeSlug());if(!n)return console.warn("[themeSwatchPicker] theme slug is empty — open cancelled."),oe("no_theme_selected"),!1;const c=(e.getValue()||"").trim(),l=be(c),i=e.getFgType?ve(e.getFgType()):"mono",{root:a}=ze(e,n,l,c,i);return document.body.appendChild(a),x=a,B=(h=e.onClose)!=null?h:null,C=u=>{u.key==="Escape"&&(u.preventDefault(),v())},document.addEventListener("keydown",C),!0}function De(){var n;if(typeof window=="undefined")return null;const e=window.frappe;return(n=e==null?void 0:e.db)!=null?n:null}function Re(e){return re(this,null,function*(){var l;const n=(e||"").trim();if(!n)return"";const c=De();if(!c)return console.warn("[themeSwatchPicker] frappe.db unavailable — cannot resolve theme slug"),"";try{if(!c.exists("NCE Theme",n))return console.warn(`[themeSwatchPicker] NCE Theme "${n}" not found`),"";const i=yield c.get_value("NCE Theme",n,["slug","status"]),a=(l=i.message)!=null?l:i,h=((a==null?void 0:a.slug)||"").trim();return(a==null?void 0:a.status)==="Active"&&h?h:(console.warn(`[themeSwatchPicker] theme "${n}" is not Active or has no slug`),"")}catch(i){return console.error("[themeSwatchPicker] slug lookup failed:",i),""}})}function $e(e,n){if(n)return n;if(e.endsWith("_bg_class"))return e.replace(/_bg_class$/,"_fg_type")}function se(e){return re(this,null,function*(){var g;const{frm:n,themeField:c,valueField:l}=e,i=$e(l,e.fgTypeField),a=String((g=n.doc[c])!=null?g:"");let h=yield Re(a);if(!h)return console.warn("[themeSwatchPicker] no Active theme slug for field — open cancelled."),oe(Se(a)),!1;const u={getThemeSlug:()=>h,getValue:()=>{var p;return String((p=n.doc[l])!=null?p:"")},setValue:p=>{try{n.set_value(l,p)}catch(_){throw console.error("[themeSwatchPicker] frm.set_value failed:",_),_}},onClose:e.onClose};return i&&(u.getFgType=()=>{var p;return String((p=n.doc[i])!=null?p:"mono")},u.setFgType=p=>{try{n.set_value(i,p)}catch(_){throw console.error("[themeSwatchPicker] frm.set_value fg type failed:",_),_}}),j(u)})}function Oe(e){e.ui.themeSwatchPicker={open:se,close:v}}function ie(e){var n,c;return e instanceof HTMLInputElement||e instanceof HTMLSelectElement?e.value:(c=(n=e.textContent)==null?void 0:n.trim())!=null?c:""}function Ie(e,n){if(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement){e.value=n,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0}));return}e.textContent=n}function U(e){const{themeFieldEl:n,valueFieldEl:c}=e,l={getThemeSlug:()=>ie(n),getValue:()=>ie(c),setValue:i=>Ie(c,i),onClose:e.onClose};return j(l)}function Ve(e){e.themeSwatchPicker={open:U,close:v}}const He={open:U,close:v,isOpen:K,parseThemeClass:H,composeThemeClass:y};if(typeof window!="undefined"){Ve(window);const e=window.frappe;e!=null&&e.ui&&Oe(e)}o.close=v,o.composeThemeClass=y,o.default=He,o.isOpen=K,o.open=j,o.openDeskThemeSwatchPicker=se,o.openStandaloneThemeSwatchPicker=U,o.parseThemeClass=H,Object.defineProperties(o,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
//# sourceMappingURL=theme-swatch-picker.umd.js.map
