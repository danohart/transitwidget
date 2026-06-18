(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Styles — generated per theme so both can coexist on the same page
  // ---------------------------------------------------------------------------
  function buildStyles(theme) {
    const dark = theme === 'dark';
    return `
      .tw-widget {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: ${dark ? '#f0f0f0' : '#1a1a1a'};
        background: ${dark ? '#1e1e1e' : '#ffffff'};
        border: 1px solid ${dark ? '#333' : '#e5e5e5'};
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
        color: ${dark ? '#fff' : '#111'};
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
        border-bottom: 1px solid ${dark ? '#2a2a2a' : '#f0f0f0'};
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
        color: ${dark ? '#777' : '#888'};
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
      .tw-pill-bus { background: ${dark ? '#444' : '#555'}; }
      .tw-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-top: 5px;
        flex-shrink: 0;
      }
      .tw-empty {
        color: ${dark ? '#666' : '#aaa'};
        font-size: 13px;
        text-align: center;
        padding: 12px 0;
      }
      .tw-loading {
        text-align: center;
        padding: 16px 0;
        color: ${dark ? '#666' : '#aaa'};
        font-size: 13px;
      }
      .tw-footer {
        margin-top: 12px;
        font-size: 11px;
        color: ${dark ? '#555' : '#bbb'};
        text-align: right;
      }
      .tw-footer a { color: inherit; text-decoration: none; }
      .tw-footer a:hover { text-decoration: underline; }
    `;
  }

  function injectStyles(theme) {
    const id = `tw-styles-${theme}`;
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = buildStyles(theme);
    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------------
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') node.className = v;
      else if (k === 'style') node.style.cssText = v;
      else node.setAttribute(k, v);
    }
    for (const child of children) {
      if (child == null) continue;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  function renderTrainStop(stop) {
    const pills = stop.lines.map((line) =>
      el('span', { class: 'tw-pill', style: `background:${line.color}` }, line.name)
    );
    return el('div', { class: 'tw-stop' },
      el('div', { class: 'tw-dot', style: `background:${stop.lines[0]?.color || '#888'}` }),
      el('div', { class: 'tw-stop-info' },
        el('div', { class: 'tw-stop-name' }, stop.name),
        el('div', { class: 'tw-stop-dist' }, `${stop.distanceMiles} mi walk`),
        el('div', { class: 'tw-pills' }, ...pills)
      )
    );
  }

  function renderBusStop(stop) {
    const pills = stop.routes.map((r) =>
      el('span', { class: 'tw-pill tw-pill-bus' }, r)
    );
    return el('div', { class: 'tw-stop' },
      el('div', { class: 'tw-dot', style: 'background:#555' }),
      el('div', { class: 'tw-stop-info' },
        el('div', { class: 'tw-stop-name' }, stop.name),
        el('div', { class: 'tw-stop-dist' }, `${stop.distanceMiles} mi walk`),
        el('div', { class: 'tw-pills' }, ...pills)
      )
    );
  }

  function renderData(container, data) {
    const { trainStops = [], busStops = [] } = data;

    const transitIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="13" rx="2"/>
      <path d="M8 19h8m-4-3v3"/>
      <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="16.5" cy="11.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>`;

    const headerDiv = el('div', { class: 'tw-header' });
    headerDiv.innerHTML = transitIcon + ' Get here by transit';

    const children = [headerDiv];

    if (trainStops.length) {
      children.push(el('div', { class: 'tw-section-label' }, 'L Train'));
      trainStops.forEach((s) => children.push(renderTrainStop(s)));
    }
    if (busStops.length) {
      children.push(el('div', { class: 'tw-section-label' }, 'Bus'));
      busStops.forEach((s) => children.push(renderBusStop(s)));
    }
    if (!trainStops.length && !busStops.length) {
      children.push(el('div', { class: 'tw-empty' }, 'No nearby transit stops found.'));
    }

    children.push(
      el('div', { class: 'tw-footer' },
        el('a', { href: 'https://transitwidget.com', target: '_blank', rel: 'noopener' },
          'Powered by TransitWidget'
        )
      )
    );

    container.innerHTML = '';
    children.forEach((c) => container.appendChild(c));
  }

  // ---------------------------------------------------------------------------
  // Core mount — shared by both script-tag auto-init and programmatic API
  // ---------------------------------------------------------------------------
  function mount(container, siteKey, apiBase, theme) {
    injectStyles(theme);
    container.className = 'tw-widget';
    container.innerHTML = '<div class="tw-loading">Loading transit info...</div>';

    fetch(`${apiBase}/api/nearby/${siteKey}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .then((data) => renderData(container, data))
      .catch((err) => {
        console.error('[TransitWidget]', err);
        container.innerHTML = '<div class="tw-empty">Transit info unavailable.</div>';
      });
  }

  // ---------------------------------------------------------------------------
  // Script-tag auto-init
  // ---------------------------------------------------------------------------
  const scriptTag = document.currentScript;
  if (scriptTag) {
    const siteKey = scriptTag.getAttribute('data-site-key');
    const theme   = scriptTag.getAttribute('data-theme') || 'light';
    const apiBase = scriptTag.getAttribute('data-api') || new URL(scriptTag.src).origin;

    if (siteKey) {
      const container = el('div', { id: `tw-${siteKey}` });
      scriptTag.parentNode.insertBefore(container, scriptTag.nextSibling);

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => mount(container, siteKey, apiBase, theme));
      } else {
        mount(container, siteKey, apiBase, theme);
      }
    } else {
      console.warn('[TransitWidget] Missing data-site-key attribute on <script> tag.');
    }
  }

  // ---------------------------------------------------------------------------
  // Programmatic API — for dashboards, previews, React apps, etc.
  // TransitWidget.render(containerEl, { siteKey, api, theme })
  // ---------------------------------------------------------------------------
  window.TransitWidget = {
    render(container, { siteKey, api, theme = 'light' } = {}) {
      if (!siteKey) { console.warn('[TransitWidget] render() requires siteKey'); return; }
      mount(container, siteKey, api || window.location.origin, theme);
    },
  };
})();
