'use strict';
(() => {
  if (!/^(https?:|file:)$/.test(location.protocol)) return;
  const local = location.protocol === 'file:';
  const origin = location.origin;
  const hub = document.querySelector('.hub');
  const frames = [...hub.querySelectorAll('.stage iframe')];
  const ready = new Set();
  const last = new Map();

  function send(frame) {
    if (!ready.has(frame)) return;
    const active = frame.id === `frame-${hub.dataset.openingDemo}`;
    if (last.get(frame) === active) return;
    // file:// documents can have opaque origins. Authenticate the exact window
    // in both directions and use the wildcard only as the local target origin.
    frame.contentWindow.postMessage({type:'gtl-opening-activation', active}, local ? '*' : origin);
    last.set(frame, active);
  }

  addEventListener('message', e => {
    if (e.origin !== (local ? 'null' : origin) || e.data?.type !== 'gtl-opening-ready') return;
    const frame = frames.find(f => f.contentWindow === e.source);
    if (!frame) return;
    ready.add(frame);
    last.delete(frame);
    send(frame);
  });
  new MutationObserver(() => frames.forEach(send))
    .observe(hub, {attributes:true, attributeFilter:['data-opening-demo']});
})();
