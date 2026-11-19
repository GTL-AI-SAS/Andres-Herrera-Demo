'use strict';
(function () {
  var welcome = document.getElementById('bienvenida');
  var hub = document.querySelector('.hub');
  var start = document.getElementById('empezar-demo');
  var aperture = document.getElementById('demo-aperture');
  var film = document.getElementById('brand-film');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var buttons = Array.from(document.querySelectorAll('.switch button'));
  var frames = new Map(buttons.map(function (button) {
    return [button.dataset.demo, document.getElementById(button.getAttribute('aria-controls'))];
  }));
  var launched = false;
  var launchToken = 0;
  var cleanup = function () {};
  var ready = new Set();

  frames.forEach(function (frame, id) {
    frame.addEventListener('load', function () { if (frame.getAttribute('src')) ready.add(id); });
  });

  function select(id) {
    buttons.forEach(function (button) {
      var active = button.dataset.demo === id;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    frames.forEach(function (frame, key) {
      var active = key === id;
      frame.classList.toggle('is-on', active);
      if (active && !frame.getAttribute('src')) frame.src = frame.dataset.src;
    });
    // Preloading during the door animation is not an activation.
    if (welcome.hidden && !hub.hidden && !hub.hasAttribute('inert')) hub.dataset.openingDemo = id;
  }

  function commit(id, method) {
    if (location.hash !== '#' + id) history[method](null, '', '#' + id);
  }

  function finish(id, focus) {
    cleanup();
    ++launchToken;
    launched = true;
    document.body.classList.remove('launching', 'revealing');
    welcome.hidden = true;
    film.pause();
    hub.hidden = false;
    hub.removeAttribute('inert');
    hub.removeAttribute('aria-hidden');
    select(id);
    start.removeAttribute('aria-busy');
    if (focus) document.getElementById('tab-' + id).focus({preventScroll:true});
  }

  function reset() {
    cleanup();
    ++launchToken;
    launched = false;
    delete hub.dataset.openingDemo;
    document.body.classList.remove('launching', 'revealing');
    welcome.hidden = false;
    hub.hidden = true;
    start.removeAttribute('aria-busy');
    start.focus({preventScroll:true});
  }

  function enter() {
    var id = '01';
    var token = ++launchToken;
    launched = true;
    commit(id, 'pushState');
    if (reduced.matches) { finish(id, true); return; }

    var rect = aperture.getBoundingClientRect();
    var cta = start.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) {
      x = cta.left + cta.width / 2;
      y = cta.top + cta.height / 2;
    }
    document.body.style.setProperty('--door-x', x + 'px');
    document.body.style.setProperty('--door-y', y + 'px');
    start.setAttribute('aria-busy', 'true');
    film.pause();
    hub.hidden = false;
    hub.setAttribute('inert', '');
    hub.setAttribute('aria-hidden', 'true');
    document.body.classList.add('launching');

    var frame = frames.get(id);
    var started = false;
    var waitTimer;
    var endTimer;
    var warmTimer;
    var complete = function (event) {
      if (event && (event.target !== hub || event.animationName !== 'open-demo')) return;
      if (token === launchToken) finish(id, true);
    };

    function reveal() {
      if (started || token !== launchToken) return;
      started = true;
      clearTimeout(waitTimer);
      frame.removeEventListener('load', reveal);
      if (reduced.matches) { finish(id, true); return; }
      document.body.classList.add('revealing');
      hub.addEventListener('animationend', complete);
      endTimer = setTimeout(complete, 1200);
    }

    cleanup = function () {
      clearTimeout(waitTimer);
      clearTimeout(warmTimer);
      clearTimeout(endTimer);
      frame.removeEventListener('load', reveal);
      hub.removeEventListener('animationend', complete);
    };
    warmTimer = setTimeout(function () {
      if (ready.has(id)) reveal();
      else {
        frame.addEventListener('load', reveal);
        waitTimer = setTimeout(reveal, 420);
      }
    }, 180);
    select(id);
  }

  start.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!launched) enter();
  });

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      select(button.dataset.demo);
      commit(button.dataset.demo, 'replaceState');
    });
  });

  document.querySelector('.switch').addEventListener('keydown', function (event) {
    var index = buttons.findIndex(function (button) { return button.getAttribute('aria-selected') === 'true'; });
    var next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
    else if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[next].click();
    buttons[next].focus({preventScroll:true});
  });

  function syncHash(focus) {
    var id = location.hash.slice(1);
    if (frames.has(id)) finish(id, focus);
    else if (launched) reset();
  }
  // A traversal can emit both events. Avoid redundant work for the already active tab.
  function handleHash() {
    var id = location.hash.slice(1);
    var active = buttons.find(function (button) { return button.getAttribute('aria-selected') === 'true'; });
    if (frames.has(id) && welcome.hidden && active && active.dataset.demo === id) return;
    syncHash(true);
  }
  window.addEventListener('popstate', handleHash);
  window.addEventListener('hashchange', handleHash);
  syncHash(false);
  if (!launched && !reduced.matches) {
    film.muted = true;
    var playback = film.play();
    if (playback) playback.catch(function () { /* The poster remains visible. */ });
  }
})();
