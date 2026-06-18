(()=>{(function(){"use strict";function p(t){let e=t==="dark";return`
      .tw-widget {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: ${e?"#f0f0f0":"#1a1a1a"};
        background: ${e?"#1e1e1e":"#ffffff"};
        border: 1px solid ${e?"#333":"#e5e5e5"};
        border-radius: 10px;
        padding: 16px;
        max-width: 380px;
        box-sizing: border-box;
      }
      .tw-widget * { box-sizing: border-box; }
      .tw-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 700;
        margin: 0 0 14px;
        color: ${e?"#fff":"#111"};
      }
      .tw-header svg { flex-shrink: 0; }
      .tw-section-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #888;
        margin: 10px 0 6px;
      }
      .tw-stop {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 8px 0;
        border-bottom: 1px solid ${e?"#2a2a2a":"#f0f0f0"};
      }
      .tw-stop:last-child { border-bottom: none; }
      .tw-stop-info { flex: 1; min-width: 0; }
      .tw-stop-name {
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tw-stop-dist {
        font-size: 12px;
        color: ${e?"#777":"#888"};
      }
      .tw-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 4px;
      }
      .tw-pill {
        display: inline-block;
        padding: 2px 7px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
        color: #fff;
        white-space: nowrap;
      }
      .tw-pill-bus { background: ${e?"#444":"#555"}; }
      .tw-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-top: 5px;
        flex-shrink: 0;
      }
      .tw-empty {
        color: ${e?"#666":"#aaa"};
        font-size: 13px;
        text-align: center;
        padding: 12px 0;
      }
      .tw-loading {
        text-align: center;
        padding: 16px 0;
        color: ${e?"#666":"#aaa"};
        font-size: 13px;
      }
      .tw-footer {
        margin-top: 12px;
        font-size: 11px;
        color: ${e?"#555":"#bbb"};
        text-align: right;
      }
      .tw-footer a { color: inherit; text-decoration: none; }
      .tw-footer a:hover { text-decoration: underline; }
    `}function f(t){let e=`tw-styles-${t}`;if(document.getElementById(e))return;let n=document.createElement("style");n.id=e,n.textContent=p(t),document.head.appendChild(n)}function i(t,e,...n){let s=document.createElement(t);for(let[o,l]of Object.entries(e||{}))o==="class"?s.className=l:o==="style"?s.style.cssText=l:s.setAttribute(o,l);for(let o of n)o!=null&&s.appendChild(typeof o=="string"?document.createTextNode(o):o);return s}function w(t){let e=t.lines.map(n=>i("span",{class:"tw-pill",style:`background:${n.color}`},n.name));return i("div",{class:"tw-stop"},i("div",{class:"tw-dot",style:`background:${t.lines[0]?.color||"#888"}`}),i("div",{class:"tw-stop-info"},i("div",{class:"tw-stop-name"},t.name),i("div",{class:"tw-stop-dist"},`${t.distanceMiles} mi walk`),i("div",{class:"tw-pills"},...e)))}function g(t){let e=t.routes.map(n=>i("span",{class:"tw-pill tw-pill-bus"},n));return i("div",{class:"tw-stop"},i("div",{class:"tw-dot",style:"background:#555"}),i("div",{class:"tw-stop-info"},i("div",{class:"tw-stop-name"},t.name),i("div",{class:"tw-stop-dist"},`${t.distanceMiles} mi walk`),i("div",{class:"tw-pills"},...e)))}function u(t,e){let{trainStops:n=[],busStops:s=[]}=e,o=`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="13" rx="2"/>
      <path d="M8 19h8m-4-3v3"/>
      <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="16.5" cy="11.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>`,l=i("div",{class:"tw-header"});l.innerHTML=o+" Get here by transit";let a=[l];n.length&&(a.push(i("div",{class:"tw-section-label"},"L Train")),n.forEach(d=>a.push(w(d)))),s.length&&(a.push(i("div",{class:"tw-section-label"},"Bus")),s.forEach(d=>a.push(g(d)))),!n.length&&!s.length&&a.push(i("div",{class:"tw-empty"},"No nearby transit stops found.")),a.push(i("div",{class:"tw-footer"},i("a",{href:"https://transitwidget.com",target:"_blank",rel:"noopener"},"Powered by TransitWidget"))),t.innerHTML="",a.forEach(d=>t.appendChild(d))}function c(t,e,n,s){f(s),t.className="tw-widget",t.innerHTML='<div class="tw-loading">Loading transit info...</div>',fetch(`${n}/api/nearby/${e}`).then(o=>{if(!o.ok)throw new Error(`API error ${o.status}`);return o.json()}).then(o=>u(t,o)).catch(o=>{console.error("[TransitWidget]",o),t.innerHTML='<div class="tw-empty">Transit info unavailable.</div>'})}let r=document.currentScript;if(r){let t=r.getAttribute("data-site-key"),e=r.getAttribute("data-theme")||"light",n=r.getAttribute("data-api")||new URL(r.src).origin;if(t){let s=i("div",{id:`tw-${t}`});r.parentNode.insertBefore(s,r.nextSibling),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>c(s,t,n,e)):c(s,t,n,e)}else console.warn("[TransitWidget] Missing data-site-key attribute on <script> tag.")}window.TransitWidget={render(t,{siteKey:e,api:n,theme:s="light"}={}){if(!e){console.warn("[TransitWidget] render() requires siteKey");return}c(t,e,n||window.location.origin,s)}}})();})();
