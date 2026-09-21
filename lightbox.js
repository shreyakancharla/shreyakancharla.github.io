// Click any content image / reel to view it full-size.
export function initLightbox(root = document) {
  const doc = root.ownerDocument || document;
  if (doc.__lbInit) return doc.__lbInit;

  const back = doc.createElement('div');
  back.setAttribute('role', 'dialog');
  back.setAttribute('aria-modal', 'true');
  back.setAttribute('aria-label', 'Full-size view');
  back.style.cssText = 'position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:clamp(16px,4vw,56px);background:rgba(20,18,24,.92);opacity:0;transition:opacity .2s ease;cursor:zoom-out';

  const stage = doc.createElement('div');
  stage.style.cssText = 'position:relative;max-width:min(1400px,100%);max-height:100%;display:flex;align-items:center;justify-content:center;cursor:default';
  back.appendChild(stage);

  const close = doc.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  close.textContent = '×';
  close.style.cssText = 'position:fixed;top:18px;right:20px;width:42px;height:42px;display:grid;place-items:center;border:0;border-radius:999px;background:rgba(255,255,255,.14);color:#FBFBF9;font-size:26px;line-height:1;cursor:pointer';
  back.appendChild(close);
  doc.body.appendChild(back);

  let lastFocus = null;
  function open(node) {
    stage.style.overflow = '';
    stage.style.cursor = 'default';
    stage.style.width = '';
    stage.style.height = '';
    stage.style.display = 'flex';
    stage.style.maxWidth = 'min(1400px,100%)';
    stage.replaceChildren(node);
    lastFocus = doc.activeElement;
    back.style.display = 'flex';
    requestAnimationFrame(() => { back.style.opacity = '1'; });
    doc.body.style.overflow = 'hidden';
    close.focus();
  }
  function hide() {
    back.style.opacity = '0';
    doc.body.style.overflow = '';
    setTimeout(() => { back.style.display = 'none'; stage.replaceChildren(); }, 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  back.addEventListener('click', e => { if (e.target === back || e.target === stage) hide(); });
  close.addEventListener('click', hide);
  doc.addEventListener('keydown', e => { if (e.key === 'Escape' && back.style.display === 'flex') hide(); });
  // Trap Tab inside the dialog while it is open.
  back.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || back.style.display !== 'flex') return;
    const focusables = [close].concat(
      [].slice.call(stage.querySelectorAll('a[href],button,iframe,[tabindex]:not([tabindex="-1"])'))
    );
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  const FIT = 'max-width:100%;max-height:calc(100vh - clamp(32px,8vw,112px));width:auto;height:auto;object-fit:contain;border-radius:10px;display:block;background:#fff';

  function openImage(src, alt) {
    const img = doc.createElement('img');
    img.src = src; img.alt = alt || '';
    img.style.cssText = FIT;
    const probe = new Image();
    probe.onload = () => {
      // Contain-fitting a very large source shrinks it below what the page already showed.
      // Above ~1.3x the stage box in either axis, show it at natural size and let the stage pan.
      const boxW = back.clientWidth - 2 * 40, boxH = back.clientHeight - 2 * 40;
      if (probe.naturalWidth > boxW * 1.3 || probe.naturalHeight > boxH * 1.3) {
        stage.style.overflow = 'auto';
        stage.style.width = '100%';
        stage.style.maxWidth = '100%';
        stage.style.height = '100%';
        stage.style.display = 'block';
        // Fit the width, scroll the length — natural size is usually far too zoomed.
        const w = Math.min(probe.naturalWidth, boxW);
        img.style.cssText = 'display:block;width:' + w + 'px;max-width:none;height:auto;margin:0 auto;background:#fff';
      }
    };
    probe.src = src;
    open(img);
  }
  function openFrame(src, title, ratio) {
    const wrap = doc.createElement('div');
    wrap.style.cssText = `width:min(1400px,92vw);aspect-ratio:${ratio || '16/9'};max-height:calc(100vh - clamp(32px,8vw,112px));border-radius:10px;overflow:hidden;background:#000`;
    const f = doc.createElement('iframe');
    f.src = src; f.title = title || 'Full-size view';
    f.setAttribute('loading', 'eager');
    f.style.cssText = 'width:100%;height:100%;border:0;display:block';
    wrap.appendChild(f);
    open(wrap);
  }

  const SKIP = 'nav, header a, [data-no-zoom]';
  function eligible(el) {
    return el && !el.closest(SKIP);
  }

  // Images, including those inside <image-slot> shadow roots
  doc.addEventListener('click', e => {
    const path = (e.composedPath && e.composedPath()) || [];
    let img = path.find(n => n && n.tagName === 'IMG');
    if (!img) {
      const host = path.find(n => n && n.tagName === 'IMAGE-SLOT');
      if (host && host.shadowRoot) img = host.shadowRoot.querySelector('img');
      if (!img && host && host.getAttribute('src')) {
        e.preventDefault();
        openImage(host.getAttribute('src'), host.getAttribute('placeholder') || '');
        return;
      }
    }
    if (!img) return;
    const anchorHost = img.getRootNode().host || img;
    if (!eligible(anchorHost) || (anchorHost.closest && anchorHost.closest('a'))) return;
    const src = img.currentSrc || img.src;
    if (!src) return;
    e.preventDefault();
    openImage(src, img.alt);
  });

  // Keyboard equivalent of the click-to-zoom: every zoomable image is a button.
  function openFor(el) {
    if (el.tagName === 'IMAGE-SLOT') {
      const inner = el.shadowRoot && el.shadowRoot.querySelector('img');
      const src = (inner && (inner.currentSrc || inner.src)) || el.getAttribute('src');
      if (src) openImage(src, (inner && inner.alt) || el.getAttribute('placeholder') || '');
      return;
    }
    const src = el.currentSrc || el.src;
    if (src) openImage(src, el.alt);
  }
  function tagImages() {
    doc.querySelectorAll('img, image-slot').forEach(el => {
      if (el.__lbKey || el.hasAttribute('data-no-zoom')) return;
      if (!eligible(el) || (el.closest && el.closest('a'))) return;
      if (el.tagName === 'IMG' && !el.alt && el.closest('a')) return;
      el.__lbKey = true;
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      const name = el.tagName === 'IMG' ? el.alt : (el.getAttribute('placeholder') || '');
      el.setAttribute('aria-label', name ? 'View full size: ' + name : 'View image full size');
    });
  }
  doc.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target;
    if (!el || !el.__lbKey) return;
    e.preventDefault();
    openFor(el);
  });

  // Iframes can't receive outside clicks — give each an expand control.
  function tagFrames() {
    doc.querySelectorAll('iframe').forEach(f => {
      if (f.__lb || !eligible(f)) return;
      f.__lb = true;
      const host = f.parentElement;
      if (!host) return;
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      const btn = doc.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'View full size');
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
      btn.style.cssText = 'position:absolute;top:10px;right:10px;z-index:3;display:grid;place-items:center;width:32px;height:32px;border:0;border-radius:8px;background:rgba(23,24,26,.72);color:#FBFBF9;cursor:pointer;opacity:.85';
      btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
      btn.addEventListener('mouseleave', () => { btn.style.opacity = '.85'; });
      btn.addEventListener('click', ev => {
        ev.preventDefault(); ev.stopPropagation();
        const r = f.getBoundingClientRect();
        openFrame(f.src, f.title, r.width && r.height ? `${Math.round(r.width)}/${Math.round(r.height)}` : '16/9');
      });
      host.appendChild(btn);
    });
  }
  tagFrames();
  tagImages();
  const mo = new MutationObserver(() => { tagFrames(); tagImages(); });
  mo.observe(doc.body, { childList: true, subtree: true });

  // Cursor affordance on zoomable images, and an authored focus ring for
  // everything this file makes keyboard-reachable.
  const style = doc.createElement('style');
  style.textContent = 'img:not([data-no-zoom]):not(nav img), image-slot:not([data-no-zoom]) { cursor: zoom-in; } a img { cursor: pointer; }'
    + '[role="button"][tabindex="0"]:focus-visible, [role="group"][tabindex="0"]:focus-visible { outline: 2px solid #6B4E9B; outline-offset: 2px; }';
  doc.head.appendChild(style);

  doc.__lbInit = { hide, openImage, openFrame };
  return doc.__lbInit;
}
