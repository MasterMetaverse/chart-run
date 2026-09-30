/* ==========================================================================
   CHART RUN — Telegram Mini App bridge
   When the game is opened from @PiggySatsMemeBot (menu button or /chartrun),
   Telegram adds its launch data to the URL. Only then is Telegram's script
   loaded; on the normal website nothing here runs.
   TG.submit(run) sends a finished run to the bot's Worker together with the
   signed initData, so the server knows which Telegram user played.
   ========================================================================== */
var TG = (function () {
  'use strict';
  var launched = /[#&]tgWebAppData=/.test(location.hash);
  // a direct link's ?startapp=… arrives as tgWebAppStartParam (the signed copy is in initData, checked by the server)
  var startParam = new URLSearchParams(location.search).get('tgWebAppStartParam') ||
    new URLSearchParams(location.hash.slice(1)).get('tgWebAppStartParam') || '';
  var api = { active: launched, app: null, startParam: launched ? startParam : '', submit: submit, openLink: openLink, share: share, userId: userId };
  if (!launched) return api;

  document.documentElement.classList.add('in-telegram');
  var ready = new Promise(function (resolve) {
    var s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-web-app.js';
    s.onload = function () {
      var w = window.Telegram && window.Telegram.WebApp;
      if (!w) return resolve(null);
      api.app = w;
      try {
        w.ready();
        w.expand();
        if (w.disableVerticalSwipes) w.disableVerticalSwipes(); // a swipe down would close the game mid-jump
        if (w.setHeaderColor) w.setHeaderColor('#130B21');
        if (w.setBackgroundColor) w.setBackgroundColor('#130B21');
      } catch (e) { /* older Telegram app: the game still works */ }
      resolve(w);
    };
    s.onerror = function () { resolve(null); };
    document.head.appendChild(s);
  });

  // links to Argus, X and the website open in the browser instead of replacing the game
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[target="_blank"]');
    if (!a || !a.href || !api.app) return;
    e.preventDefault();
    openLink(a.href);
  });

  function userId() {
    var u = api.app && api.app.initDataUnsafe && api.app.initDataUnsafe.user;
    return u && u.id ? u.id : null;
  }

  // Telegram's own share sheet: pick a chat, the challenge link is sent there
  function share(url, text) {
    var link = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
    if (api.app && api.app.openTelegramLink) api.app.openTelegramLink(link); else openLink(link);
  }

  function openLink(url) {
    if (api.app && api.app.openLink) api.app.openLink(url);
    else window.open(url, '_blank', 'noopener');
  }

  function post(body) {
    return fetch(PROJECT.apiUrl.replace(/\/+$/, '') + '/api/chartrun/run', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },   // plain text: no CORS preflight
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: 'Server error (' + r.status + ')' }; });
    });
  }

  // Resolves with the server's answer ({ ok, rank, players, best, … } or { ok: false, error }), or null outside Telegram.
  function submit(run) {
    if (!PROJECT.apiUrl) return Promise.resolve(null);
    return ready.then(function (w) {
      if (!w || !w.initData) return { ok: false, error: 'Open the game from the Telegram bot to save scores' };
      var body = { initData: w.initData, run: run };
      // one retry on a dropped connection; the run id stops it counting twice
      return post(body).catch(function () {
        return new Promise(function (r) { setTimeout(r, 1500); }).then(function () { return post(body); });
      }).catch(function () { return { ok: false, error: 'No connection, score not saved' }; });
    });
  }

  return api;
})();
