/* ==========================================================================
   CHART RUN — game
   A side-scrolling platformer on the $PIGSATS chart. Piggy runs over green
   and red candles, grabs blue ₿ coins (the holders' 81%), bumps TRADE blocks
   for the tax, stomps scam DM bots and bears, jumps rug pits and races to
   the ATH flag. Reads PROJECT (config.js) and ART (art.js).
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var C = ART.C, SKINS = ART.SKINS;

  /* ------------------------------------------------------------- tuning */
  var T = 32, ROWS = 10, VW = 480, VH = ROWS * T;   // VW narrows on phones held upright (see sizeBoard)
  var STEP = 1 / 120;
  var ACC_GROUND = 1500, ACC_AIR = 1000, DECEL = 1700, MAX_RUN = 215;
  var GRAVITY = 1900, GRAVITY_HOLD = 1050, MAX_FALL = 720;
  var JUMP_V = 560, SPRING_V = 920, STOMP_V = 380, STOMP_V_HELD = 540;
  var COYOTE = 0.09, JUMP_BUFFER = 0.12;
  var COIN_SATS = 1000, STOMP_SATS = 2000, CLEAR_SATS = 25000, FLAG_MAX = 20000, TIME_SATS = 100;
  var POWER_LEN = 8, STORE_KEY = 'chartRun.v1';

  var MODES = {
    classic: { name: 'Classic', hearts: 3, speed: 1,    score: 1, time: 150, lv: 1, blurb: '3 hearts. Run as far as you can.' },
    daily:   { name: 'Daily',   hearts: 3, speed: 1.1,  score: 1, time: 150, lv: 1, blurb: 'Same levels for everyone today. Compare on X.', seeded: true },
    degen:   { name: 'Degen',   hearts: 1, speed: 1.35, score: 2, time: 120, lv: 3, blurb: '1 heart, faster enemies, double sats.' }
  };
  var PHASES = ['Accumulation', 'Markup', 'Bull Run', 'Euphoria', 'Mania', 'Supercycle', 'Moon', 'Beyond'];
  var RANKS = [[1, 'Piglet'], [3, 'Saver'], [5, 'Stacker'], [8, 'Hodler'], [12, 'Whale'], [16, 'Diamond Trotter'], [20, 'Satoshi’s Pig']];

  /* Daily missions: three per day, the same three for everyone.
     val(run, today) returns progress; run-scoped ones keep their best. */
  var MISSIONS = [
    { id: 'coins_run', text: 'Grab 50 coins in one run',           target: 50,  val: function (r) { return r.coins; } },
    { id: 'coins_day', text: 'Grab 150 coins today',               target: 150, val: function (r, d) { return d.coins; } },
    { id: 'stomp5',    text: 'Stomp 5 scammers in one run',        target: 5,   val: function (r) { return r.stomps; } },
    { id: 'combo3',    text: 'Stomp 3 in a row without landing',   target: 3,   val: function (r) { return r.bestCombo; } },
    { id: 'level3',    text: 'Reach level 3',                      target: 3,   val: function (r) { return r.level; } },
    { id: 'nohit',     text: 'Clear a level without getting hit',  target: 1,   val: function (r) { return r.cleanClears; } },
    { id: 'blocks8',   text: 'Bump 8 TRADE blocks in one run',     target: 8,   val: function (r) { return r.blocks; } },
    { id: 'flagtop',   text: 'Grab the ATH flag near the top',     target: 1,   val: function (r) { return r.flagTops; } },
    { id: 'claim',     text: 'Grab a Claim power-up',              target: 1,   val: function (r) { return r.claims; } },
    { id: 'diamond',   text: 'Go Diamond Hands',                   target: 1,   val: function (r) { return r.diamonds; } },
    { id: 'score100',  text: 'Stack 100K sats in one run',         target: 1e5, val: function (r) { return r.score; } },
    { id: 'score300',  text: 'Stack 300K sats in one run',         target: 3e5, val: function (r) { return r.score; } },
    { id: 'runs3',     text: 'Play 3 runs today',                  target: 3,   val: function (r, d) { return d.runs; } },
    { id: 'daily',     text: 'Play today’s Daily Run',             target: 1,   val: function (r, d) { return d.daily ? 1 : 0; } }
  ];
  var MISSION_XP = 60, ALL_MISSIONS_XP = 150;

  var LINES = {
    start:  ['chasing sats since day 1', 'to the ATH!', 'oink. let’s run'],
    coin:   ['sats!', 'nom', 'oink!'],
    stomp:  ['admins never DM first', 'blocked', 'nice try, bear'],
    hurt:   ['ouch', 'nope', 'rekt… a little'],
    pit:    ['no rug, just oink… oops'],
    power:  ['deep pool!', 'one click, all mine', 'diamond hands!'],
    clear:  ['new ATH!', 'number go up', 'WAGMI'],
    over:   ['back to the chart?', 'every trade feeds the pig', 'the pig will be back'],
    pet:    ['oink ♥', 'hehe', 'scratch the ears', 'more sats pls', '♥♥♥'],
    idle:   ['oink', 'gm', 'no rug, just oink', 'every trade feeds me', 'hold the pig'],
    hungry: ['I’m hungry… go run the chart', 'feed the pig?'],
    full:   ['belly full of sats', 'oink. life is good']
  };

  /* ------------------------------------------------------------- seeded random */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------- dates
     Days are UTC for everyone, so the Daily Run, missions and the Telegram
     leaderboard all roll over together at 00:00 UTC. */
  function dayKey(d) { d = d || new Date(); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); }
  function yesterdayKey() { return dayKey(new Date(Date.now() - 864e5)); }
  function dailyNumber() {
    var p = (PROJECT.dailyEpoch || '2026-09-24').split('-');
    var start = Date.UTC(+p[0], +p[1] - 1, +p[2]);
    var now = new Date(), today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.max(1, Math.floor((today - start) / 864e5) + 1);
  }
  function resetsIn() {
    var now = new Date(), next = new Date(now); next.setUTCHours(24, 0, 0, 0);
    var m = Math.round((next - now) / 6e4);
    return m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + 'm';
  }

  /* ------------------------------------------------------------- profile */
  var profile = load();
  function load() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { /* storage blocked */ }
    p = p || {};
    return {
      best: p.best || 0, xp: p.xp || 0, runs: p.runs || 0, lifetime: p.lifetime || 0,
      streak: p.streak || 0, lastDay: p.lastDay || '', lastFed: p.lastFed || 0,
      skin: p.skin || 'classic', muted: !!p.muted, mode: p.mode || 'classic',
      noRotateTip: !!p.noRotateTip,
      records: p.records || { classic: [], degen: [] },
      daily: p.daily || { n: 0, best: 0, tries: 0 },
      today: p.today || {},
      missions: p.missions || {}
    };
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(profile)); } catch (e) { /* ignore */ } }

  function need(n) { return 60 * n * (n - 1); }
  function levelOf(xp) { var n = 1; while (xp >= need(n + 1)) n++; return n; }
  function rankOf(lv) { var r = RANKS[0][1]; RANKS.forEach(function (x) { if (lv >= x[0]) r = x[1]; }); return r; }
  function daysHolding() { return (profile.lastDay === dayKey() || profile.lastDay === yesterdayKey()) ? profile.streak : 0; }
  function belly() {
    if (!profile.lastFed) return 35;
    var h = (Date.now() - profile.lastFed) / 36e5;
    return Math.max(0, Math.min(100, Math.round(100 - h * 3)));
  }
  function today() {
    if (profile.today.day !== dayKey()) profile.today = { day: dayKey(), coins: 0, runs: 0, daily: false };
    return profile.today;
  }
  function dailyState() {
    if (profile.daily.n !== dailyNumber()) profile.daily = { n: dailyNumber(), best: 0, tries: 0 };
    return profile.daily;
  }
  function todaysMissions() {
    var key = dayKey();
    if (profile.missions.day !== key) {
      var rng = mulberry(hash('missions:' + key));
      var pool = MISSIONS.slice(), picked = [];
      while (picked.length < 3) picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0].id);
      profile.missions = { day: key, list: picked.map(function (id) { return { id: id, p: 0, done: false }; }), bonus: false };
    }
    return profile.missions;
  }
  function missionDef(id) { for (var i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].id === id) return MISSIONS[i]; return null; }
  function modeUnlocked(m) { return levelOf(profile.xp) >= MODES[m].lv; }

  /* ------------------------------------------------------------- helpers */
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function vrand(a, b) { return a + Math.random() * (b - a); }
  function fmt(n) { return Math.floor(n).toLocaleString('en-US'); }
  function short(n) {
    var u = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
    for (var i = 0; i < u.length; i++) {
      if (n >= u[i][0]) return (n / u[i][0]).toFixed(n >= u[i][0] * 100 ? 0 : 1).replace(/\.0$/, '') + u[i][1];
    }
    return String(Math.floor(n));
  }
  function btc(n) { return (n / 1e8).toFixed(8).replace(/0+$/, '').replace(/\.$/, '') + ' BTC'; }
  function phaseName(n) { return PHASES[Math.min(n, PHASES.length) - 1]; }

  /* ------------------------------------------------------------- sound */
  var audio = null;
  function ac() {
    if (profile.muted) return null;
    if (!audio) {
      var A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      audio = new A();
    }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }
  function tone(freq, dur, type, vol, when, slideTo) {
    var a = ac(); if (!a) return;
    var t0 = a.currentTime + (when || 0);
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.1, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  var sfx = {
    jump:   function () { tone(300, 0.14, 'square', 0.035, 0, 620); },
    coin:   function () { tone(988, 0.06, 'square', 0.04); tone(1319, 0.16, 'square', 0.04, 0.06); },
    bump:   function () { tone(160, 0.08, 'square', 0.06); },
    block:  function () { tone(660, 0.07, 'square', 0.05); tone(990, 0.12, 'square', 0.05, 0.06); },
    stomp:  function (k) { tone(520 * Math.pow(1.19, k), 0.1, 'square', 0.06, 0, 260); },
    spring: function () { tone(200, 0.3, 'triangle', 0.09, 0, 900); },
    power:  function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone(f, 0.12, 'square', 0.035, i * 0.05); }); },
    hit:    function () { tone(180, 0.3, 'sawtooth', 0.08, 0, 80); },
    fall:   function () { tone(600, 0.6, 'triangle', 0.08, 0, 90); },
    flag:   function () { [392, 523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.18, 'triangle', 0.08, i * 0.09); }); },
    over:   function () { [392, 330, 262, 196].forEach(function (f, i) { tone(f, 0.28, 'triangle', 0.09, i * 0.13); }); },
    oink:   function () { tone(300, 0.09, 'square', 0.045, 0, 430); tone(280, 0.12, 'square', 0.045, 0.11, 380); }
  };

  /* ------------------------------------------------------------- challenge links */
  var challenge = readChallenge();
  function readChallenge() {
    try {
      var q = new URLSearchParams(location.search);
      var s = parseInt(q.get('beat'), 10), m = q.get('m') || 'classic', n = parseInt(q.get('n'), 10) || 0;
      // Telegram challenge link: t.me/<bot>/chartrun?startapp=c<friend's id>_<score>_<c|g|d<daily #>>
      var tg = /^c\d+_(\d+)_([cgd])(\d*)$/.exec(window.TG && TG.startParam || '');
      if (!(s > 0) && tg) { s = parseInt(tg[1], 10); m = { c: 'classic', g: 'degen', d: 'daily' }[tg[2]]; n = parseInt(tg[3], 10) || 0; }
      if (!(s > 0) || !MODES[m]) return null;
      if (m === 'daily' && n !== dailyNumber()) m = 'classic';
      return { score: s, mode: m, n: n };
    } catch (e) { return null; }
  }

  /* ==================================================================== LEVELS
     A level is a list of columns. Each column has a ground height in tiles
     (0 = rug pit) and a candle colour. Blocks, coins, enemies and the rest
     are placed on top. Generation is seeded, so Daily levels match for all. */
  var EMPTY = 0, GROUND = 1, BLOCK = 2, TRADE = 3, USED = 4;

  function genLevel(seed, n) {
    var rng = mulberry(hash(seed + ':' + n));
    var R = function (a, b) { return a + rng() * (b - a); };
    var RI = function (a, b) { return Math.floor(R(a, b + 1)); };
    var d = Math.min(1, (n - 1) / 5);
    var L = Math.min(250, 150 + n * 15);
    var cols = [], grid = [], coins = [], enemies = [], springs = [], traps = [], contents = {};
    var h = 2, color = true;

    function col(hh) {
      var x = cols.length;
      if (hh > 0) {
        var prev = cols.length ? cols[x - 1].h : hh;
        if (hh > prev) color = true;
        else if (hh < prev) color = false;
        else if (rng() < 0.12) color = !color;
      }
      cols.push({ h: hh, green: color, wick: RI(4, 12) });
      var g = [];
      for (var y = 0; y < ROWS; y++) g.push(hh > 0 && y >= ROWS - hh ? GROUND : EMPTY);
      grid.push(g);
      return x;
    }
    function top(x) { return ROWS - cols[x].h; }                 // row index of the ground surface
    function coin(x, row) { coins.push({ x: x * T + T / 2, y: row * T + T / 2, taken: false, bob: rng() * 6 }); }
    function enemy(x, type) { enemies.push({ type: type, x: x * T + 4, y: (top(x) - 1) * T + 6, w: 24, h: 26, vx: 0, vy: 0, alive: true, active: false, squash: 0 }); }
    function block(x, row, kind) {
      grid[x][row] = kind;
      if (kind === TRADE) {
        var roll = rng();
        contents[x + ',' + row] = roll < 0.62 ? 'coin' : roll < 0.78 ? 'drop' : roll < 0.87 ? 'claim' : roll < 0.95 ? 'snack' : 'diamond';
      }
    }
    function flat(len) { for (var i = 0; i < len; i++) col(h); }

    flat(12);
    var chunks = [
      ['flat', 2], ['up', 2], ['down', 2], ['pit', 2 + d * 2], ['blocks', 2.4], ['enemies', 2 + d * 2],
      ['spring', 1], ['floaters', 1 + d * 1.5], ['trap', 0.4 + d * 2], ['wall', 1.2]
    ];
    var total = chunks.reduce(function (a, c) { return a + c[1]; }, 0);
    while (cols.length < L - 24) {
      var r = rng() * total, kind = 'flat';
      for (var i = 0; i < chunks.length; i++) { r -= chunks[i][1]; if (r < 0) { kind = chunks[i][0]; break; } }
      var x0 = cols.length, k;
      if (kind === 'flat') {
        var len = RI(5, 9);
        flat(len);
        if (rng() < 0.6) for (k = 1; k < len - 1; k++) coin(x0 + k, top(x0) - 2);
        if (rng() < 0.3 + d * 0.4) enemy(x0 + len - 2, rng() < 0.3 + d * 0.4 ? 'bear' : 'dm');
      } else if (kind === 'up') {
        var steps = RI(1, 3);
        for (k = 0; k < steps && h < 6; k++) { h++; col(h); col(h); coin(cols.length - 1, top(cols.length - 1) - 2); }
        flat(2);
      } else if (kind === 'down') {
        var dn = RI(1, 3);
        for (k = 0; k < dn && h > 1; k++) { h--; col(h); col(h); }
        flat(2);
      } else if (kind === 'pit') {
        flat(2);
        var w = RI(2, 2 + Math.round(d * 2));
        var ps = cols.length;
        for (k = 0; k < w; k++) col(0);
        var landH = Math.max(1, Math.min(6, h + RI(-1, 1)));
        h = landH;
        flat(3);
        for (k = -1; k <= w; k++) coin(ps + k, ROWS - Math.max(cols[ps - 1].h, h) - 3 - (k >= 0 && k < w ? 1 : 0));
      } else if (kind === 'blocks') {
        var bl = RI(7, 9);
        flat(bl);
        var row = top(x0) - 4;
        if (row >= 2) {
          var bx = x0 + 2, pattern = RI(0, 2);
          if (pattern === 0) { block(bx, row, TRADE); block(bx + 2, row, BLOCK); block(bx + 3, row, TRADE); block(bx + 4, row, BLOCK); }
          else if (pattern === 1) { block(bx + 1, row, TRADE); block(bx + 2, row, TRADE); block(bx + 3, row, TRADE); }
          else { block(bx, row, BLOCK); block(bx + 1, row, TRADE); block(bx + 2, row, BLOCK); if (row - 3 >= 1) block(bx + 1, row - 3, TRADE); }
          coin(bx + 1, row - 1); coin(bx + 3, row - 1);
        }
        if (rng() < 0.4 + d * 0.3) enemy(x0 + bl - 1, 'dm');
      } else if (kind === 'enemies') {
        var el = RI(9, 12);
        flat(el);
        var count = 1 + Math.round(R(0, 1 + d * 2));
        // up to 4 enemies 3 columns apart can run past this stretch of ground (9-12 columns): stop at its end.
        // Checked before rng() so every level that could already be built stays exactly the same.
        for (k = 0; k < count && x0 + 3 + k * 3 < cols.length; k++) enemy(x0 + 3 + k * 3, rng() < 0.25 + d * 0.5 ? 'bear' : 'dm');
      } else if (kind === 'spring') {
        flat(7);
        springs.push({ x: (x0 + 3) * T + T / 2, y: top(x0) * T, squeeze: 0 });
        for (k = 1; k <= 3; k++) coin(x0 + 3, Math.max(0, top(x0) - 4 - k * 1));
        coin(x0 + 4, Math.max(0, top(x0) - 7));
      } else if (kind === 'floaters') {
        flat(2);
        var span = RI(6, 8), fs = cols.length;
        for (k = 0; k < span; k++) col(0);
        var fr = Math.max(3, ROWS - h - 3);
        block(fs + 1, fr, BLOCK); block(fs + 2, fr, BLOCK);
        var fr2 = Math.max(3, fr - RI(0, 1));
        block(fs + span - 3, fr2, BLOCK); block(fs + span - 2, fr2, BLOCK);
        coin(fs + 1, fr - 1); coin(fs + 2, fr - 1); coin(fs + span - 3, fr2 - 1); coin(fs + span - 2, fr2 - 1);
        flat(3);
      } else if (kind === 'trap') {
        flat(8);
        traps.push({ x: (x0 + 4) * T + T / 2, y: -30, vy: 0, state: 'wait' });
        coin(x0 + 4, top(x0) - 1);
      } else if (kind === 'wall') {
        flat(3);
        if (rng() < 0.5) enemy(x0 + 1, 'dm');
        var wh = Math.min(6, h + RI(2, 3));
        col(wh); col(wh);
        coin(x0 + 3, ROWS - wh - 1); coin(x0 + 4, ROWS - wh - 1);
        flat(3);
      }
    }
    // the run-in to the flag and the vault
    var endH = h;
    for (var s = 0; s < 3 && endH > 2; s++) { endH--; col(endH); }
    h = endH;
    var stairStart = cols.length;
    for (s = 1; s <= 4; s++) { col(Math.min(6, h + s)); }
    h = 2;
    flat(4);
    var flagX = cols.length;
    flat(18);
    return { n: n, cols: cols, grid: grid, coins: coins, enemies: enemies, springs: springs, traps: traps,
      contents: contents, flag: { x: flagX * T + T / 2, base: top(flagX) * T, height: 6 * T }, vaultX: (flagX + 8) * T,
      width: cols.length * T, stairStart: stairStart, chart: makeChart(rng, cols.length) };
  }
  function makeChart(rng, n) {
    var pts = [], v = 0.6;
    for (var i = 0; i <= n / 2; i++) { v = Math.max(0.15, Math.min(0.9, v + (rng() - 0.47) * 0.12)); pts.push(v); }
    return pts;
  }

  /* ==================================================================== STATE */
  var G = null;
  function newGame(mode) {
    var M = MODES[mode];
    G = {
      mode: mode, M: M,
      seed: M.seeded ? 'daily:' + dailyNumber() : 'run:' + Math.floor(Math.random() * 1e9),
      day: M.seeded ? dailyNumber() : null,              // a Daily that runs past midnight still counts for the day it started
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),  // lets the server ignore a resent run
      level: null, n: 0,
      score: 0, hearts: M.hearts, over: false,
      coins: 0, stomps: 0, bestCombo: 0, blocks: 0, cleanClears: 0, flagTops: 0, claims: 0, diamonds: 0, cleared: 0,
      target: challenge && challenge.mode === mode ? challenge.score : 0, beaten: false,
      fx: [], texts: [], items: [], flying: [], shake: 0, flash: 0, bubble: null, time: 0
    };
    startLevel(1);
  }
  function startLevel(n) {
    G.n = n;
    G.level = genLevel(G.seed, n);
    G.items = []; G.flying = [];
    G.clock = G.M.time;
    G.hitThisLevel = false;
    G.state = 'play'; G.stateT = 0;
    G.cam = 0;
    G.p = { x: 3 * T, y: (ROWS - G.level.cols[3].h - 1) * T, w: 22, h: 24, vx: 0, vy: 0,
      ground: false, coyote: 0, buffer: 0, face: 1, run: 0, inv: 1, shield: false, magnet: 0, diamond: 0,
      combo: 0, safeX: 3 * T, hurt: 0, jumping: false };
    banner('LEVEL ' + n, phaseName(n));
    hud();
  }

  /* ==================================================================== INPUT */
  var input = { left: false, right: false, jump: false, jumpPressed: false };
  function setKey(k, down) {
    if (k === 'jump' && down && !input.jump) input.jumpPressed = true;
    input[k] = down;
  }
  var KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
    ' ': 'jump', ArrowUp: 'jump', w: 'jump', W: 'jump', z: 'jump', Z: 'jump' };
  window.addEventListener('keydown', function (e) {
    if (!G || $('#game').hidden || document.querySelector('dialog[open]')) return;
    if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && !G.over) { e.preventDefault(); pause(); return; }
    var k = KEYMAP[e.key]; if (!k) return;
    e.preventDefault(); ac(); setKey(k, true);
  });
  window.addEventListener('keyup', function (e) { var k = KEYMAP[e.key]; if (k) setKey(k, false); });
  window.addEventListener('blur', function () { input.left = input.right = input.jump = false; });
  $$('[data-pad]').forEach(function (b) {
    var k = b.dataset.pad;
    var down = function (e) { e.preventDefault(); ac(); if (k === 'jump') buzz(10); try { b.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or already-gone pointer */ } b.classList.add('is-down'); setKey(k, true); };
    var up = function (e) { e.preventDefault(); b.classList.remove('is-down'); setKey(k, false); };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  });
  (function () {
    var pad = $('#dpad'), id = null;
    function side(e) {
      var r = pad.getBoundingClientRect(), k = (e.clientX - r.left) / r.width;
      input.left = k < 0.45; input.right = k > 0.55;
      pad.dataset.side = input.left ? 'left' : input.right ? 'right' : '';
    }
    function end(e) {
      if (e.pointerId !== id) return;
      id = null; input.left = input.right = false; pad.dataset.side = '';
    }
    pad.addEventListener('pointerdown', function (e) {
      e.preventDefault(); ac(); id = e.pointerId;
      try { pad.setPointerCapture(id); } catch (err) { /* synthetic pointer */ }
      side(e); buzz(8);
    });
    pad.addEventListener('pointermove', function (e) { if (e.pointerId === id) { var was = pad.dataset.side; side(e); if (pad.dataset.side !== was && pad.dataset.side) buzz(6); } });
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
    pad.addEventListener('lostpointercapture', end);
    pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  })();

  /* short vibration on phones that support it (Android); silent elsewhere */
  function buzz(pattern) {
    if (profile.muted || !navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (e) { /* not allowed */ }
  }

  /* ==================================================================== PHYSICS */
  function tileAt(tx, ty) {
    var lv = G.level;
    if (tx < 0) return GROUND;
    if (tx >= lv.cols.length || ty < 0 || ty >= ROWS) return EMPTY;
    return lv.grid[tx][ty];
  }
  function solid(tx, ty) { return tileAt(tx, ty) !== EMPTY; }

  function moveBody(b, dt, onHead) {
    // horizontal
    b.x += b.vx * dt;
    var ty0 = Math.floor(b.y / T), ty1 = Math.floor((b.y + b.h - 1) / T), tx, ty;
    if (b.vx > 0) {
      tx = Math.floor((b.x + b.w) / T);
      for (ty = ty0; ty <= ty1; ty++) if (solid(tx, ty)) { b.x = tx * T - b.w - 0.01; b.vx = 0; b.hitWall = 1; break; }
    } else if (b.vx < 0) {
      tx = Math.floor(b.x / T);
      for (ty = ty0; ty <= ty1; ty++) if (solid(tx, ty)) { b.x = (tx + 1) * T + 0.01; b.vx = 0; b.hitWall = -1; break; }
    }
    // vertical
    b.y += b.vy * dt;
    b.ground = false;
    var tx0 = Math.floor((b.x + 2) / T), tx1 = Math.floor((b.x + b.w - 2) / T);
    if (b.vy > 0) {
      ty = Math.floor((b.y + b.h) / T);
      for (tx = tx0; tx <= tx1; tx++) if (solid(tx, ty)) { b.y = ty * T - b.h; b.vy = 0; b.ground = true; break; }
    } else if (b.vy < 0) {
      ty = Math.floor(b.y / T);
      var hit = null;
      for (tx = tx0; tx <= tx1; tx++) {
        if (solid(tx, ty)) {
          // bump the block nearest Piggy's middle
          var mid = b.x + b.w / 2;
          if (!hit || Math.abs((tx + 0.5) * T - mid) < Math.abs((hit + 0.5) * T - mid)) hit = tx;
        }
      }
      if (hit !== null) { b.y = (ty + 1) * T; b.vy = 0; if (onHead) onHead(hit, ty); }
    }
  }

  function update(dt) {
    G.time += dt;
    var P = G.p, lv = G.level;
    if (G.state === 'clear') { updateClear(dt); updateFx(dt); return; }

    G.clock -= dt;
    if (G.clock <= 0) { G.clock = 60; damage(true, 'Time’s up!'); }

    // run
    var dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    var acc = P.ground ? ACC_GROUND : ACC_AIR;
    if (dir) {
      P.vx += dir * acc * dt;
      if (dir !== Math.sign(P.vx) && P.ground) P.vx += dir * DECEL * 0.6 * dt;
      P.face = dir;
    } else if (P.ground) {
      var dec = DECEL * dt;
      P.vx = Math.abs(P.vx) <= dec ? 0 : P.vx - Math.sign(P.vx) * dec;
    } else {
      P.vx *= 1 - 0.8 * dt;
    }
    P.vx = Math.max(-MAX_RUN, Math.min(MAX_RUN, P.vx));

    // jump with coyote time and buffering; hold for height
    if (input.jumpPressed) { P.buffer = JUMP_BUFFER; input.jumpPressed = false; }
    P.buffer = Math.max(0, P.buffer - dt);
    P.coyote = P.ground ? COYOTE : Math.max(0, P.coyote - dt);
    if (P.buffer > 0 && P.coyote > 0) {
      P.vy = -JUMP_V; P.buffer = 0; P.coyote = 0; P.jumping = true; sfx.jump();
    }
    var grav = (P.vy < 0 && input.jump && P.jumping) ? GRAVITY_HOLD : GRAVITY;
    P.vy = Math.min(MAX_FALL, P.vy + grav * dt);
    if (P.vy >= 0) P.jumping = false;

    var wasGround = P.ground;
    moveBody(P, dt, bumpBlock);
    if (P.x < G.cam) { P.x = G.cam; P.vx = Math.max(0, P.vx); }
    if (P.ground) {
      P.combo = 0;
      var cx = Math.floor((P.x + P.w / 2) / T);
      if (lv.cols[cx] && lv.cols[cx].h > 0 && lv.cols[cx - 1] && lv.cols[cx - 1].h > 0 && lv.cols[cx + 1] && lv.cols[cx + 1].h > 0) P.safeX = P.x;
    }
    if (!wasGround && P.ground && P.vy === 0) P.land = 0.12;
    P.land = Math.max(0, (P.land || 0) - dt);
    P.run += dt * (4 + Math.abs(P.vx) / 18);
    P.inv = Math.max(0, P.inv - dt);
    P.hurt = Math.max(0, P.hurt - dt);
    P.magnet = Math.max(0, P.magnet - dt);
    P.diamond = Math.max(0, P.diamond - dt);

    // fell into a rug pit
    if (P.y > VH + 40) { sfx.fall(); say(pick(LINES.pit)); damage(true, 'Rug pit!'); respawn(); }

    // springs
    lv.springs.forEach(function (s) {
      s.squeeze = Math.max(0, s.squeeze - dt * 4);
      if (P.vy > 0 && Math.abs(P.x + P.w / 2 - s.x) < 20 && P.y + P.h >= s.y - 18 && P.y + P.h <= s.y + 4) {
        P.vy = -SPRING_V; P.jumping = false; s.squeeze = 1; sfx.spring();
        floatText(s.x, s.y - 40, 'PUMP!', '#3BE58C', 16);
      }
    });

    // coins
    lv.coins.forEach(function (c) {
      if (c.taken) return;
      var dx = (P.x + P.w / 2) - c.x, dy = (P.y + P.h / 2) - c.y;
      if (P.magnet > 0 && dx * dx + dy * dy < 170 * 170) {
        var dd = Math.sqrt(dx * dx + dy * dy) || 1;
        c.x += dx / dd * 520 * dt; c.y += dy / dd * 520 * dt;
      }
      if (Math.abs(dx) < 18 && Math.abs(dy) < 20) takeCoin(c.x, c.y, c);
    });

    // enemies
    var speed = G.M.speed * (1 + (G.n - 1) * 0.06);
    lv.enemies.forEach(function (e) {
      if (!e.alive) { e.squash += dt; return; }
      if (!e.active) {
        if (e.x < G.cam + VW + 40) { e.active = true; e.vx = -(e.type === 'bear' ? 70 : 42) * speed; }
        else return;
      }
      e.vy = Math.min(MAX_FALL, e.vy + GRAVITY * dt);
      e.hitWall = 0;
      var vx = e.vx;
      moveBody(e, dt);
      if (e.hitWall) e.vx = -vx;
      // bears turn back at ledges, bots walk off them
      if (e.type === 'bear' && e.ground) {
        var ahead = Math.floor((e.vx > 0 ? e.x + e.w + 2 : e.x - 2) / T), below = Math.floor((e.y + e.h + 2) / T);
        if (!solid(ahead, below)) e.vx = -e.vx;
      }
      if (e.y > VH + 60) { e.alive = false; e.squash = 9; return; }
      if (overlap(P, e)) {
        if (P.diamond > 0) { kill(e, 'Diamond Hands'); return; }
        var falling = P.vy > 0 && (P.y + P.h) - e.y < 14;
        if (falling) {
          P.combo++;
          G.bestCombo = Math.max(G.bestCombo, P.combo);
          P.vy = -(input.jump ? STOMP_V_HELD : STOMP_V); P.jumping = input.jump;
          kill(e, e.type === 'dm' ? 'Scam blocked' : 'Bear rekt');
        } else if (P.inv <= 0) {
          damage(false, e.type === 'dm' ? 'Scam DM! Admins never DM first.' : 'Bear market!');
        }
      }
    });

    // falling dump candles
    lv.traps.forEach(function (tr) {
      if (tr.state === 'wait') { if (P.x + P.w > tr.x - 90 && P.x < tr.x + 40) { tr.state = 'fall'; tr.vy = 60; } return; }
      if (tr.state !== 'fall') return;
      tr.vy += 1500 * dt; tr.y += tr.vy * dt;
      var tx = Math.floor(tr.x / T), ty = Math.floor((tr.y + 20) / T);
      if (ty >= 0 && solid(tx, ty)) { tr.state = 'gone'; poof(tr.x, ty * T, '#FF4D6A', 14); G.shake = Math.max(G.shake, 5); }
      if (tr.y > VH + 40) tr.state = 'gone';
      if (tr.state === 'fall' && Math.abs(tr.x - (P.x + P.w / 2)) < 18 && tr.y + 22 > P.y && tr.y - 22 < P.y + P.h) {
        tr.state = 'gone';
        if (P.diamond > 0) poof(tr.x, tr.y, '#8EE6FF', 16);
        else if (P.inv <= 0) damage(false, 'Dump candle!');
      }
    });

    // power-ups coming out of blocks
    G.items.forEach(function (it) {
      if (it.dead) return;
      it.age += dt;
      if (it.age < 0.45) { it.y -= T / 0.45 * dt; return; }
      if (it.type !== 'claim') {
        it.vy = Math.min(MAX_FALL, it.vy + GRAVITY * 0.8 * dt);
        it.hitWall = 0;
        var vx = it.vx;
        moveBody(it, dt);
        if (it.hitWall) it.vx = -vx;
        if (it.type === 'diamond' && it.ground) it.vy = -420;
      } else {
        it.y += Math.sin(it.age * 3) * 10 * dt;
      }
      if (it.y > VH + 40) it.dead = true;
      if (overlap(P, it)) { it.dead = true; power(it.type, it.x + it.w / 2, it.y); }
    });
    G.items = G.items.filter(function (it) { return !it.dead; });

    // flag
    var fl = lv.flag;
    if (P.x + P.w > fl.x - 3 && P.x < fl.x + 3 && P.y + P.h > fl.base - fl.height - 10) grabFlag();

    // camera and effects
    var target = Math.max(0, Math.min(lv.width - VW, P.x + P.w / 2 - VW * 0.4));
    G.cam = Math.max(G.cam, G.cam + (target - G.cam) * Math.min(1, dt * 8));
    updateFx(dt);
  }

  function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function updateFx(dt) {
    G.fx = G.fx.filter(function (p) { p.age += dt; p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; return p.age < p.life; });
    G.texts = G.texts.filter(function (t) { t.age += dt; t.y -= 36 * dt; return t.age < t.life; });
    G.flying = G.flying.filter(function (f) { f.age += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += f.g * dt; return f.age < f.life; });
    G.shake = Math.max(0, G.shake - dt * 30);
    G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.bubble) { G.bubble.t -= dt; if (G.bubble.t <= 0) G.bubble = null; }
  }

  /* ==================================================================== EVENTS */
  function addScore(n, x, y, color) {
    var v = n * G.M.score;
    G.score += v;
    if (x != null) floatText(x, y, '+' + short(v), color || C.cream, 14);
    if (G.target && !G.beaten && G.score > G.target) {
      G.beaten = true;
      banner('CHALLENGE BEATEN', 'You out-ran your friend');
      sfx.flag();
    }
    hud();
  }

  function takeCoin(x, y, c) {
    if (c) c.taken = true;
    G.coins++;
    sfx.coin();
    poof(x, y, C.blueHi, 6);
    addScore(COIN_SATS, x, y - 14);
    if (Math.random() < 0.05) say(pick(LINES.coin));
  }

  function bumpBlock(tx, ty) {
    var lv = G.level, kind = lv.grid[tx][ty];
    var bx = tx * T + T / 2, by = ty * T;
    killOnBlock(tx, ty);
    if (kind !== TRADE) { sfx.bump(); bumpAnim(tx, ty); return; }
    lv.grid[tx][ty] = USED;
    bumpAnim(tx, ty);
    G.blocks++;
    var what = lv.contents[tx + ',' + ty] || 'coin';
    // the trade's tax: the holders' coin pops, Argus' cut flies off
    G.flying.push({ kind: 'argus', x: bx, y: by, vx: 160, vy: -260, g: 300, age: 0, life: 1.4 });
    if (what === 'coin') {
      G.flying.push({ kind: 'coin', x: bx, y: by - 8, vx: 0, vy: -420, g: 1400, age: 0, life: 0.5 });
      takeCoin(bx, by - 30);
      floatText(bx, by - 48, 'tax · 81% to you', C.blueHi, 11);
      sfx.block();
    } else {
      if (what === 'snack' && G.hearts >= G.M.hearts) what = 'drop';
      G.items.push({ type: what, x: tx * T + 5, y: by, w: 22, h: 22, vx: 70, vy: 0, age: 0, dead: false });
      sfx.power();
    }
  }
  function bumpAnim(tx, ty) { G.level.bumps = G.level.bumps || {}; G.level.bumps[tx + ',' + ty] = 0.18; }
  function killOnBlock(tx, ty) {
    G.level.enemies.forEach(function (e) {
      if (e.alive && e.x + e.w > tx * T && e.x < (tx + 1) * T && Math.abs(e.y + e.h - ty * T) < 6) kill(e, 'Bumped!');
    });
  }

  function kill(e, label) {
    e.alive = false; e.squash = 0;
    buzz(18);
    G.stomps++;
    var mult = Math.pow(2, Math.max(0, Math.min(4, G.p.combo - 1)));
    sfx.stomp(G.p.combo);
    poof(e.x + e.w / 2, e.y + e.h / 2, e.type === 'dm' ? '#EDE6FF' : '#C79466', 12);
    addScore(STOMP_SATS * mult, e.x + e.w / 2, e.y - 6, C.gold);
    floatText(e.x + e.w / 2, e.y - 24, (G.p.combo > 1 ? '×' + mult + ' ' : '') + label, '#FFF3DC', 11);
    if (Math.random() < 0.25) say(pick(LINES.stomp));
  }

  function power(type, x, y) {
    var P = G.p;
    buzz([15, 40, 15]);
    sfx.power();
    if (type === 'drop') { P.shield = true; floatText(x, y - 10, 'Liquidity shield', C.pink, 14); banner('DEEP POOL', 'Shield blocks one hit'); }
    else if (type === 'claim') { P.magnet = POWER_LEN; G.claims++; banner('CLAIM!', 'Nearby sats fly to Piggy'); }
    else if (type === 'diamond') { P.diamond = POWER_LEN; G.diamonds++; banner('DIAMOND HANDS', 'Nothing can shake you'); }
    else if (type === 'snack') { G.hearts = Math.min(G.M.hearts, G.hearts + 1); floatText(x, y - 10, '+1 heart', C.pink, 14); }
    say(pick(LINES.power));
    hud();
  }

  function damage(ignoreShield, text) {
    var P = G.p;
    if (G.over) return;
    G.hitThisLevel = true;
    if (!ignoreShield && P.shield) {
      P.shield = false; P.inv = 1.2;
      floatText(P.x + P.w / 2, P.y - 20, 'Shield popped', C.pink, 13);
      sfx.bump();
      return;
    }
    G.hearts--;
    buzz([40, 30, 60]);
    P.inv = 2; P.hurt = 0.8;
    G.shake = 10; G.flash = 1;
    sfx.hit();
    floatText(P.x + P.w / 2, P.y - 26, text, '#FF5C7A', 13);
    say(pick(LINES.hurt));
    hud();
    if (G.hearts <= 0) endRun();
  }
  function respawn() {
    var P = G.p, lv = G.level;
    var cx = Math.max(1, Math.floor(P.safeX / T));
    while (cx > 1 && !(lv.cols[cx].h > 0 && lv.cols[cx - 1].h > 0 && lv.cols[cx + 1] && lv.cols[cx + 1].h > 0)) cx--;
    P.x = cx * T + 4; P.y = (ROWS - lv.cols[cx].h - 2) * T; P.vx = 0; P.vy = 0;
    G.cam = Math.max(0, Math.min(G.cam, P.x - VW * 0.3));
  }

  function grabFlag() {
    var P = G.p, fl = G.level.flag;
    var k = Math.max(0, Math.min(1, (fl.base - (P.y + P.h)) / fl.height));
    var bonus = Math.round((2000 + (FLAG_MAX - 2000) * k) / 100) * 100;
    if (k > 0.75) G.flagTops++;
    G.state = 'clear'; G.stateT = 0;
    buzz([20, 40, 20, 40, 60]);
    G.flagY = Math.min(fl.height - 30, fl.height * (1 - k));
    P.vx = 0; P.vy = 0; P.x = fl.x - P.w - 2;
    G.cleared++;
    if (!G.hitThisLevel) G.cleanClears++;
    sfx.flag();
    addScore(bonus, fl.x, P.y - 20, C.gold);
    G.clearBonus = { flag: bonus, time: Math.max(0, Math.floor(G.clock)) * TIME_SATS, level: CLEAR_SATS * G.n };
    say(pick(LINES.clear));
    banner('NEW ATH!', 'Level ' + G.n + ' cleared');
  }
  function updateClear(dt) {
    var P = G.p, fl = G.level.flag;
    G.stateT += dt;
    if (G.stateT < 0.9) {           // slide down the pole
      P.y = Math.min(fl.base - P.h, P.y + 260 * dt);
      G.flagY = Math.min(fl.height - 30, G.flagY + 260 * dt);
    } else {                        // walk into the vault
      P.face = 1;
      P.x += 120 * dt; P.run += dt * 10;
      P.vy = Math.min(MAX_FALL, P.vy + GRAVITY * dt);
      moveBody(P, dt);
    }
    if (G.stateT > 1.1 && G.clearBonus) {
      var b = G.clearBonus; G.clearBonus = null;
      addScore(b.time + b.level);
      floatText(P.x + 40, P.y - 40, 'Time +' + short(b.time * G.M.score) + ' · Level +' + short(b.level * G.M.score), C.gold, 13);
    }
    var target = Math.max(0, Math.min(G.level.width - VW, P.x - VW * 0.4));
    G.cam += (target - G.cam) * Math.min(1, dt * 4);
    if (G.stateT > 3) startLevel(G.n + 1);
  }

  function poof(x, y, color, n) {
    if (reduced) n = Math.min(n, 4);
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = vrand(60, 220);
      G.fx.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, age: 0, life: vrand(0.35, 0.7),
        color: Math.random() < 0.3 ? '#FFFFFF' : color, size: vrand(1.5, 3.5), star: Math.random() < 0.3 });
    }
  }
  function floatText(x, y, text, color, size) { G.texts.push({ x: x, y: y, text: text, color: color, size: size, age: 0, life: 1 }); }
  function say(text) { if (G) G.bubble = { text: text, t: 2 }; }

  /* ==================================================================== RENDER */
  var board = $('#board'), bctx = null;
  function render() {
    var c = bctx, lv = G.level, P = G.p, cam = Math.round(G.cam);
    c.save();
    c.clearRect(0, 0, VW, VH);
    if (G.shake > 0 && !reduced) c.translate(vrand(-1, 1) * G.shake, vrand(-1, 1) * G.shake);

    // sky: the site's violet, warming up as the phases go on
    var heat = Math.min(1, (G.n - 1) / 6);
    var sky = c.createLinearGradient(0, 0, 0, VH);
    sky.addColorStop(0, mix('#6C3A9C', '#9A3A7E', heat));
    sky.addColorStop(1, '#3E2F86');
    c.fillStyle = sky;
    c.fillRect(-20, -20, VW + 40, VH + 40);

    // chart grid and a faint price line far behind
    c.strokeStyle = 'rgba(255,255,255,.05)';
    c.lineWidth = 1;
    for (var gy = 40; gy < VH; gy += 40) { c.beginPath(); c.moveTo(0, gy); c.lineTo(VW, gy); c.stroke(); }
    var off = (cam * 0.3) % 60;
    for (var gx = -off; gx < VW; gx += 60) { c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, VH); c.stroke(); }
    c.strokeStyle = 'rgba(125,184,247,.22)';
    c.lineWidth = 2;
    c.beginPath();
    var pts = lv.chart, step = 64, first = Math.max(0, Math.floor(cam * 0.25 / step) - 1);
    for (var i = first; i < pts.length && i * step - cam * 0.25 < VW + step; i++) {
      var px = i * step - cam * 0.25, py = VH * (1 - pts[i]) * 0.7;
      if (i === first) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke();

    c.save();
    c.translate(-cam, 0);
    var c0 = Math.max(0, Math.floor(cam / T) - 1), c1 = Math.min(lv.cols.length - 1, Math.ceil((cam + VW) / T) + 1);

    // the chart itself: one candle per column
    for (var x = c0; x <= c1; x++) {
      var col = lv.cols[x];
      if (col.h <= 0) continue;
      ART.candleColumn(c, x * T, (ROWS - col.h) * T, T, VH + 4, col.green, col.wick);
    }
    // blocks
    lv.bumps = lv.bumps || {};
    for (x = c0; x <= c1; x++) {
      for (var y = 0; y < ROWS; y++) {
        var k = lv.grid[x][y];
        if (k === BLOCK || k === TRADE || k === USED) {
          var key = x + ',' + y, bump = lv.bumps[key] || 0;
          if (bump > 0) lv.bumps[key] = bump - 1 / 60;
          c.save();
          c.translate(x * T, y * T - Math.sin(Math.max(0, bump) / 0.18 * Math.PI) * 8);
          if (k === BLOCK) ART.solidBlock(c, T); else ART.tradeBlock(c, T, k === USED, G.time);
          c.restore();
        }
      }
    }
    // springs
    lv.springs.forEach(function (s) {
      if (s.x < cam - 40 || s.x > cam + VW + 40) return;
      c.save(); c.translate(s.x, s.y); ART.spring(c, 28, s.squeeze); c.restore();
    });
    // flag and vault
    var fl = lv.flag;
    c.save(); c.translate(fl.x, fl.base); ART.athFlag(c, fl.height, G.state === 'clear' ? G.flagY : 8, G.time); c.restore();
    c.save(); c.translate(lv.vaultX, fl.base); ART.vault(c, 78, G.time); c.restore();

    // coins
    lv.coins.forEach(function (co) {
      if (co.taken || co.x < cam - 20 || co.x > cam + VW + 20) return;
      c.save(); c.translate(co.x, co.y + Math.sin(G.time * 3 + co.bob) * 2); ART.coin(c, 9, G.time * 4 + co.bob); c.restore();
    });
    // items from blocks
    G.items.forEach(function (it) {
      c.save(); c.translate(it.x + it.w / 2, it.y + it.h / 2);
      if (it.type === 'drop') ART.drop(c, 9);
      else if (it.type === 'claim') ART.claim(c, 9, G.time);
      else if (it.type === 'diamond') ART.diamond(c, 10, G.time);
      else if (it.type === 'snack') ART.snack(c, 10);
      c.restore();
    });
    // enemies
    lv.enemies.forEach(function (e) {
      if (e.x < cam - 40 || e.x > cam + VW + 40) return;
      if (!e.alive && e.squash > 0.5) return;
      c.save();
      c.translate(e.x + e.w / 2, e.y + e.h / 2);
      if (e.vx > 0) c.scale(-1, 1);
      if (e.type === 'dm') ART.dmBot(c, 30, G.time, !e.alive); else ART.bear(c, 30, G.time, !e.alive);
      c.restore();
    });
    // falling dump candles, with a warning mark once they drop
    lv.traps.forEach(function (tr) {
      if (tr.state === 'gone' || tr.x < cam - 40 || tr.x > cam + VW + 40) return;
      if (tr.state === 'wait') {
        c.fillStyle = 'rgba(255,61,94,' + (0.5 + 0.3 * Math.sin(G.time * 8)) + ')';
        c.beginPath(); c.moveTo(tr.x - 7, 4); c.lineTo(tr.x + 7, 4); c.lineTo(tr.x, 14); c.closePath(); c.fill();
        return;
      }
      c.save(); c.translate(tr.x, tr.y); ART.candle(c, 16); c.restore();
    });
    // tax coins popping from blocks, Argus' cut flying away
    G.flying.forEach(function (f) {
      c.save(); c.translate(f.x, f.y);
      c.globalAlpha = Math.max(0, 1 - f.age / f.life);
      ART.coin(c, f.kind === 'argus' ? 7 : 9, f.age * 12, false, f.kind === 'argus');
      c.restore();
    });

    // Piggy
    var blink = P.inv > 0 && G.state === 'play' && Math.sin(G.time * 40) > 0;
    if (!blink) {
      c.save();
      c.translate(P.x + P.w / 2, P.y + P.h - 16);
      if (P.land > 0 && !reduced) c.scale(1.1, 0.9);
      if (P.diamond > 0) { c.shadowColor = '#8EE6FF'; c.shadowBlur = 18 + Math.sin(G.time * 12) * 6; }
      if (P.shield) {
        c.strokeStyle = 'rgba(255,134,176,' + (0.6 + 0.3 * Math.sin(G.time * 6)) + ')';
        c.lineWidth = 2;
        c.fillStyle = 'rgba(255,134,176,.14)';
        ART.ellipse(c, 0, -2, 24, 22); c.fill(); c.stroke();
      }
      if (P.magnet > 0) {
        c.strokeStyle = 'rgba(125,184,247,.6)';
        c.lineWidth = 1.5;
        var rr = 22 + ((G.time * 40) % 20);
        ART.ellipse(c, 0, -2, rr, rr * 0.9); c.stroke();
      }
      var moving = Math.abs(P.vx) > 10 && P.ground;
      ART.pig(c, 15, { skin: profile.skin, run: P.run, speed: moving ? Math.min(1, Math.abs(P.vx) / 160) : (P.ground ? 0 : 0.6),
        hurt: P.hurt > 0, t: G.time, face: P.face > 0 ? 1 : -1 });
      c.restore();
    }

    // particles and texts
    G.fx.forEach(function (p) {
      c.globalAlpha = Math.max(0, 1 - p.age / p.life);
      if (p.star) { c.save(); c.translate(p.x, p.y); c.rotate(p.age * 6); ART.star(c, p.size * 1.6, p.color); c.restore(); }
      else { c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, p.size, 0, Math.PI * 2); c.fill(); }
    });
    c.globalAlpha = 1;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    G.texts.forEach(function (t) {
      var k = t.age / t.life;
      c.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      c.font = '700 ' + t.size + 'px Fredoka, sans-serif';
      c.lineWidth = 3.5;
      c.strokeStyle = 'rgba(20,11,34,.85)';
      c.strokeText(t.text, t.x, t.y);
      c.fillStyle = t.color;
      c.fillText(t.text, t.x, t.y);
    });
    c.globalAlpha = 1;
    if (G.bubble && G.state === 'play') {
      c.font = '600 11px Fredoka, sans-serif';
      var tw = c.measureText(G.bubble.text).width + 16;
      var bx = P.x + P.w / 2, by = P.y - 34;
      c.fillStyle = C.cream;
      ART.rrect(c, bx - tw / 2, by - 11, tw, 22, 11); c.fill();
      c.beginPath(); c.moveTo(bx - 5, by + 10); c.lineTo(bx, by + 16); c.lineTo(bx + 5, by + 10); c.fill();
      c.fillStyle = C.ink;
      c.fillText(G.bubble.text, bx, by + 1);
    }
    c.restore();

    // screen-space overlays
    if (G.target) {
      var kk = Math.min(1, G.score / G.target);
      c.fillStyle = 'rgba(20,11,34,.5)';
      ART.rrect(c, 8, 8, VW - 16, 12, 6); c.fill();
      c.fillStyle = G.beaten ? C.gold : C.pink;
      ART.rrect(c, 8, 8, Math.max(12, (VW - 16) * kk), 12, 6); c.fill();
      c.fillStyle = G.beaten ? C.ink : '#FFF3DC';
      c.font = '600 9px Fredoka, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(G.beaten ? 'CHALLENGE BEATEN' : 'vs friend · ' + short(G.target) + ' sats', VW / 2, 14.5);
    }
    if (P.diamond > 0 || P.magnet > 0) {
      var left = Math.max(P.diamond, P.magnet) / POWER_LEN;
      c.fillStyle = P.diamond > 0 ? '#8EE6FF' : C.blueHi;
      c.fillRect(0, VH - 4, VW * left, 4);
    }
    if (G.flash > 0) { c.fillStyle = 'rgba(255,61,94,' + G.flash * 0.25 + ')'; c.fillRect(0, 0, VW, VH); }
    c.restore();
  }
  function mix(a, b, k) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var r = Math.round((pa >> 16) + ((pb >> 16) - (pa >> 16)) * k);
    var g = Math.round((pa >> 8 & 255) + ((pb >> 8 & 255) - (pa >> 8 & 255)) * k);
    var bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * k);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  /* ==================================================================== LOOP */
  var last = 0, acc = 0, hudT = 0;
  function frame(now) {
    // whatever happens inside, keep the loop alive: an error must never freeze the game
    requestAnimationFrame(frame);
    try { step(now); } catch (e) {
      if (!frame.failed) { frame.failed = true; console.error('Chart Run error:', e); }   // log once, not every frame
      // end the run cleanly (score saved, game-over screen) instead of a frozen board
      if (G && !G.over) { try { endRun(); } catch (e2) { console.error(e2); } }
    }
  }
  function step(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (G && !$('#game').hidden) {
      if (!G.over && !G.paused) {
        acc += dt;
        var n = 0;
        while (acc >= STEP && n < 8) { update(STEP); acc -= STEP; n++; }
        if (n === 8) acc = 0;
      } else {
        updateFx(dt);
      }
      render();
      hudT -= dt;
      if (hudT <= 0) { hudClock(); hudT = 0.25; }
    }
    tickHome(dt);
  }

  /* ==================================================================== HUD */
  function hud() {
    if (!G) return;
    $('#score').textContent = fmt(G.score);
    $('#btc').textContent = '≈ ' + btc(G.score);
    var hearts = $('#hearts');
    hearts.innerHTML = '';
    for (var i = 0; i < G.M.hearts; i++) {
      var s = document.createElement('span');
      s.className = 'heart' + (i < G.hearts ? '' : ' is-lost');
      s.textContent = '♥';
      hearts.appendChild(s);
    }
    hearts.setAttribute('aria-label', G.hearts + ' of ' + G.M.hearts + ' lives');
    $('#levelChip').textContent = (G.mode === 'daily' ? 'D#' + dailyNumber() + ' · ' : G.mode === 'degen' ? 'DEGEN · ' : '') + 'L' + G.n + ' ' + phaseName(G.n);
    $('#coinCount').textContent = G.coins;
    hudClock();
  }
  function hudClock() {
    if (!G) return;
    var t = Math.max(0, Math.ceil(G.clock));
    $('#clock').textContent = t;
    $('#clockChip').classList.toggle('is-low', t <= 30 && G.state === 'play');
  }
  var bannerTimer = 0;
  function banner(big, small) {
    var el = $('#banner');
    el.innerHTML = '<strong></strong><span></span>';
    el.firstChild.textContent = big;
    el.lastChild.textContent = small || '';
    el.classList.remove('is-on'); void el.offsetWidth; el.classList.add('is-on');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { el.classList.remove('is-on'); }, 1900);
  }
  function sizeBoard() {
    var wrap = $('#boardWrap');
    var avW = wrap.clientWidth;
    var touch = document.body.classList.contains('has-touch');
    var portraitPhone = touch && window.innerHeight > window.innerWidth;
    var pad = $('#pad');
    var padH = pad && pad.offsetParent && !document.body.classList.contains('pad-overlay') ? pad.offsetHeight + 16 : 0;
    var tip = $('#rotateTip');
    if (!tip.hidden) padH += tip.offsetHeight + 10;
    var avH = window.innerHeight - wrap.getBoundingClientRect().top - padH - 12;
    // phone held sideways: widen the world to fill the screen instead of letterboxing a 3:2 box
    if (touch && !portraitPhone) VW = Math.round(Math.max(480, Math.min(VH * avW / Math.max(avH, 1), 760)));
    else VW = portraitPhone ? 360 : avW < 600 ? 400 : 480;
    var w = Math.max(260, Math.min(avW, avH * VW / VH, 960));
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    board.width = Math.round(w * dpr);
    board.height = Math.round(w * VH / VW * dpr);
    board.style.width = Math.round(w) + 'px';
    board.style.height = Math.round(w * VH / VW) + 'px';
    bctx = board.getContext('2d');
    bctx.setTransform(w / VW * dpr, 0, 0, w / VW * dpr, 0, 0);
  }

  /* ==================================================================== RUN LIFECYCLE */
  function show(view) {
    $('#home').hidden = view !== 'home';
    $('#game').hidden = view !== 'game';
    document.body.dataset.view = view;
    window.scrollTo(0, 0);
    lockZoom(view === 'game');
    if (view === 'game') { rotateTip(); sizeBoard(); }
    else renderHome();
  }

  /* ==================================================================== MOBILE */
  var viewportMeta = document.querySelector('meta[name=viewport]'), viewportBase = viewportMeta.content;
  function lockZoom(on) {
    viewportMeta.content = on ? viewportBase + ', maximum-scale=1, user-scalable=no' : viewportBase;
  }
  function isPortraitPhone() { return document.body.classList.contains('has-touch') && window.innerHeight > window.innerWidth; }
  function rotateTip() { $('#rotateTip').hidden = !(isPortraitPhone() && !profile.noRotateTip); }
  function standalone() {
    return window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone === true;
  }
  var fsEl = document.documentElement;
  var fsOK = !!(fsEl.requestFullscreen || fsEl.webkitRequestFullscreen);
  function inFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function enterFullscreen() {
    if (!fsOK || inFullscreen() || standalone()) return;
    try {
      var p = fsEl.requestFullscreen ? fsEl.requestFullscreen({ navigationUI: 'hide' }) : fsEl.webkitRequestFullscreen();
      if (p && p.catch) p.catch(function () {});
    } catch (e) { /* not allowed here */ }
  }
  function exitFullscreen() {
    try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { /* ignore */ }
  }

  function pause() {
    if (!G || G.over || G.paused) return;
    G.paused = true;
    input.left = input.right = input.jump = false;
    $('#pauseStats').textContent = 'Level ' + G.n + ' · ' + fmt(G.score) + ' sats · ' + G.coins + ' coins · ' + G.hearts + (G.hearts === 1 ? ' heart' : ' hearts') + ' left';
    openDialog('#pauseDlg');
  }
  function resume() {
    $('#pauseDlg').close();
    if (G) { G.paused = false; last = performance.now(); acc = 0; }
  }
  function start(mode) {
    mode = mode || profile.mode;
    if (!MODES[mode] || !modeUnlocked(mode)) mode = 'classic';
    ac();
    closeDialogs();
    input.left = input.right = input.jump = false;
    if (document.body.classList.contains('has-touch') && !(window.TG && TG.active)) enterFullscreen(); // Telegram is full screen already
    show('game');
    newGame(mode);
    setTimeout(function () { if (G && !G.over) say(pick(LINES.start)); }, 1600);
  }

  var lastRun = null;
  function endRun() {
    if (G.over) return;
    G.over = true;
    sfx.over();
    var before = levelOf(profile.xp);
    var d = today();
    if (profile.lastDay !== d.day) {
      profile.streak = profile.lastDay === yesterdayKey() ? profile.streak + 1 : 1;
      profile.lastDay = d.day;
    }
    d.coins += G.coins; d.runs++;
    if (G.mode === 'daily') d.daily = true;

    var run = { mode: G.mode, score: G.score, coins: G.coins, stomps: G.stomps, bestCombo: G.bestCombo, blocks: G.blocks,
      level: G.n, cleared: G.cleared, cleanClears: G.cleanClears, flagTops: G.flagTops, claims: G.claims, diamonds: G.diamonds,
      target: G.target, beaten: G.beaten, day: G.day };

    var place = 0, isBest = false;
    if (G.mode === 'daily') {
      var ds = dailyState();
      ds.tries++;
      isBest = G.score > ds.best;
      ds.best = Math.max(ds.best, G.score);
    } else {
      var list = profile.records[G.mode] = profile.records[G.mode] || [];
      isBest = !list.length || G.score > list[0].s;
      var entry = { s: G.score, l: G.n, d: d.day };
      list.push(entry);
      list.sort(function (a, b) { return b.s - a.s; });
      place = list.indexOf(entry) + 1;
      profile.records[G.mode] = list.slice(0, 5);
      if (place > 5) place = 0;
    }
    profile.best = Math.max(profile.best, G.score);

    var ms = todaysMissions(), done = [], xp = G.coins + G.stomps * 2 + G.cleared * 20 + 10;
    ms.list.forEach(function (m) {
      var def = missionDef(m.id);
      if (!def || m.done) return;
      m.p = Math.max(m.p, def.val(run, d));
      if (m.p >= def.target) { m.done = true; done.push(def.text); xp += MISSION_XP; }
    });
    if (ms.list.every(function (m) { return m.done; }) && !ms.bonus) { ms.bonus = true; xp += ALL_MISSIONS_XP; done.push('All three missions'); }

    profile.xp += xp;
    profile.runs++;
    profile.lifetime += G.score;
    profile.lastFed = Date.now();
    save();
    var after = levelOf(profile.xp);
    run.xp = xp; run.isBest = isBest; run.place = place; run.done = done;
    run.lvUp = after > before ? after : 0;
    run.unlocks = SKINS.filter(function (s) { return s.lv > before && s.lv <= after; }).map(function (s) { return s.name; })
      .concat(Object.keys(MODES).filter(function (k) { return MODES[k].lv > before && MODES[k].lv <= after; })
      .map(function (k) { return MODES[k].name + ' mode'; }));
    lastRun = run;
    submitRun(run);
    setTimeout(showOver, 1000);
  }

  /* In Telegram the run is sent to the bot, which checks who played (Telegram
     signs that) and puts Daily runs on the group leaderboard. */
  function submitRun(run) {
    if (!window.TG || !TG.active || !(G.score > 0)) return;
    run.saved = { pending: true };
    TG.submit({
      id: G.id, mode: G.mode, day: G.day, seed: G.seed, client: 'chart-run-3',
      score: G.score, level: G.n, cleared: G.cleared, coins: G.coins, stomps: G.stomps,
      bestChain: G.bestCombo, blocks: G.blocks, durationMs: Math.round(G.time * 1000)
    }).then(function (res) {
      run.saved = res || { ok: false, error: 'Open the game from Telegram to save scores' };
      if (lastRun === run) renderSaved(run);
    });
  }
  function renderSaved(r) {
    var el = $('#overSaved');
    if (!r.saved) { el.hidden = true; return; }
    el.hidden = false;
    el.classList.toggle('is-ok', !!r.saved.ok);
    var s = r.saved;
    if (s.pending) el.textContent = 'Saving your run to the Telegram board…';
    else if (!s.ok) el.textContent = '⚠ ' + (s.error || 'Score not saved');
    else if (s.mode === 'daily') el.textContent = '🏁 #' + s.rank + ' of ' + s.players + ' on today’s Daily board · best ' + fmt(s.best) + ' sats';
    else el.textContent = '✔ Saved to your Telegram profile · best ' + fmt(s.best) + ' sats';
    if (s.ok && s.tickets) el.textContent += '\n🎟 ' + s.tickets.total + ' raffle ticket' + (s.tickets.total === 1 ? '' : 's') + ' this week · /chartrun tickets';
  }

  function showOver() {
    var r = lastRun;
    $('#shareHint').hidden = true;
    $('#overMode').textContent = r.mode === 'daily' ? 'Daily #' + dailyNumber() : MODES[r.mode].name;
    $('#overScore').textContent = fmt(r.score);
    $('#overBtc').textContent = '≈ ' + btc(r.score);
    var bestLine;
    if (r.mode === 'daily') bestLine = r.isBest ? 'Your best today!' : 'Today’s best: ' + fmt(dailyState().best) + ' sats';
    else if (r.isBest) bestLine = 'New ' + MODES[r.mode].name + ' record!';
    else if (r.place) bestLine = '#' + r.place + ' on your ' + MODES[r.mode].name + ' board';
    else bestLine = 'Best: ' + fmt(profile.records[r.mode][0].s) + ' sats';
    $('#overBest').textContent = bestLine;
    $('#overBest').classList.toggle('is-new', r.isBest);
    $('#overChallenge').hidden = !r.target;
    if (r.target) {
      $('#overChallenge').textContent = r.beaten
        ? '🏁 You beat your friend’s ' + fmt(r.target) + ' sats. Send it back!'
        : '🏁 ' + fmt(r.target - r.score) + ' sats short of your friend. Again?';
      $('#overChallenge').classList.toggle('is-win', r.beaten);
    }
    $('#overLevel').textContent = r.level;
    $('#overCoins').textContent = r.coins;
    $('#overStomps').textContent = r.stomps;
    $('#overCombo').textContent = '×' + Math.max(1, r.bestCombo);
    var lines = ['+' + r.xp + ' XP for Piggy'];
    r.done.forEach(function (t) { lines.push('✔ Mission: ' + t); });
    if (r.lvUp) lines.push('Piggy reached Lv.' + r.lvUp + ' · ' + rankOf(r.lvUp));
    r.unlocks.forEach(function (n) { lines.push('Unlocked: ' + n); });
    $('#overXp').innerHTML = '';
    lines.forEach(function (l) { var li = document.createElement('li'); li.textContent = l; $('#overXp').appendChild(li); });
    $('#overQuote').textContent = '“' + pick(LINES.over) + '”';
    renderSaved(r);
    openDialog('#overDlg');
  }

  /* ==================================================================== HOME */
  var home = { sayT: 0, idleT: 5 };
  function renderHome() {
    var lv = levelOf(profile.xp), lo = need(lv), hi = need(lv + 1);
    $('#homeLevel').textContent = 'Lv.' + lv;
    $('#homeRank').textContent = rankOf(lv);
    $('#xpFill').style.width = Math.round((profile.xp - lo) / (hi - lo) * 100) + '%';
    $('#xpText').textContent = (profile.xp - lo) + ' / ' + (hi - lo) + ' XP';
    var b = belly();
    $('#bellyFill').style.width = b + '%';
    $('#bellyFill').dataset.mood = b > 60 ? 'full' : b > 25 ? 'ok' : 'empty';
    $('#bellyText').textContent = b > 60 ? 'Full of sats' : b > 25 ? 'Getting hungry' : 'Starving';
    $('#daysText').textContent = daysHolding();
    $('#bestText').textContent = profile.best ? short(profile.best) : '0';
    $('#runsText').textContent = profile.runs;
    renderModes(); renderMissions(); renderRecords(); renderChallenge();
  }
  function renderModes() {
    if (!modeUnlocked(profile.mode)) profile.mode = 'classic';
    $$('[data-mode]').forEach(function (b) {
      var m = b.dataset.mode, ok = modeUnlocked(m);
      b.classList.toggle('is-on', m === profile.mode);
      b.setAttribute('aria-pressed', String(m === profile.mode));
      b.disabled = !ok;
      b.querySelector('small').textContent = !ok ? '🔒 Lv.' + MODES[m].lv : m === 'daily' ? '#' + dailyNumber() : m === 'degen' ? '×2 sats' : '3 hearts';
    });
    var M = MODES[profile.mode];
    $('#modeBlurb').textContent = profile.mode === 'daily' ? M.blurb + ' Resets in ' + resetsIn() + '.' : M.blurb;
    $('#playBtn').textContent = profile.mode === 'daily' ? 'Play Daily #' + dailyNumber() : profile.mode === 'degen' ? 'Go Degen' : 'Run the chart';
  }
  function renderMissions() {
    var ms = todaysMissions(), ul = $('#missionList');
    ul.innerHTML = '';
    ms.list.forEach(function (m) {
      var def = missionDef(m.id); if (!def) return;
      var li = document.createElement('li');
      li.className = m.done ? 'is-done' : '';
      var p = Math.min(def.target, m.p);
      li.innerHTML = '<span class="m__text"></span><span class="m__bar"><i></i></span><span class="m__num"></span>';
      li.children[0].textContent = (m.done ? '✔ ' : '') + def.text;
      li.children[1].firstChild.style.width = Math.round(p / def.target * 100) + '%';
      li.children[2].textContent = def.target >= 1e4 ? short(p) + '/' + short(def.target) : p + '/' + def.target;
      ul.appendChild(li);
    });
    $('#missionReset').textContent = 'New missions in ' + resetsIn() + ' · +' + MISSION_XP + ' XP each, +' + ALL_MISSIONS_XP + ' for all 3';
  }
  function renderRecords() {
    var m = profile.mode, ol = $('#recordList');
    ol.innerHTML = '';
    $('#recordTitle').textContent = m === 'daily' ? 'Daily #' + dailyNumber() : MODES[m].name + ' top 5';
    if (m === 'daily') {
      var ds = dailyState(), li0 = document.createElement('li');
      li0.textContent = ds.tries ? 'Today’s best: ' + fmt(ds.best) + ' sats · ' + ds.tries + (ds.tries > 1 ? ' tries' : ' try') : 'Not played yet. Everyone gets the same levels today.';
      ol.appendChild(li0);
      return;
    }
    var list = profile.records[m] || [];
    if (!list.length) { var e = document.createElement('li'); e.textContent = 'No runs yet.'; ol.appendChild(e); return; }
    list.forEach(function (r, i) {
      var li = document.createElement('li');
      li.innerHTML = '<b></b><span></span><small></small>';
      li.children[0].textContent = '#' + (i + 1);
      li.children[1].textContent = fmt(r.s) + ' sats' + (r.l ? ' · L' + r.l : '');
      li.children[2].textContent = r.d === dayKey() ? 'today' : r.d;
      ol.appendChild(li);
    });
  }
  function renderChallenge() {
    $('#challengeCard').hidden = !challenge;
    if (!challenge) return;
    $('#challengeText').textContent = 'A friend stacked ' + fmt(challenge.score) + ' sats in ' +
      (challenge.mode === 'daily' ? 'Daily #' + challenge.n : MODES[challenge.mode].name) + '. Beat it.';
  }
  function homeSay(text, dur) {
    var el = $('#homeBubble');
    el.textContent = text;
    el.classList.remove('is-on'); void el.offsetWidth; el.classList.add('is-on');
    home.sayT = dur || 2.6;
  }
  function tickHome(dt) {
    if ($('#home').hidden) return;
    if (home.sayT > 0) { home.sayT -= dt; if (home.sayT <= 0) $('#homeBubble').classList.remove('is-on'); }
    home.idleT -= dt;
    if (home.idleT <= 0) { homeSay(pick(belly() > 25 ? LINES.idle : LINES.hungry)); home.idleT = vrand(7, 11); }
    drawHeroCoins(dt);
  }
  function petPig() {
    ac(); sfx.oink();
    var pig = $('#heroPig');
    pig.classList.remove('is-hop'); void pig.offsetWidth; pig.classList.add('is-hop');
    homeSay(pick(LINES.pet));
    for (var i = 0; i < 3; i++) {
      var h = document.createElement('span');
      h.className = 'heart-pop';
      h.textContent = '♥';
      h.style.left = (35 + Math.random() * 25) + '%';
      h.style.animationDelay = (i * 0.12) + 's';
      $('#heroCard').appendChild(h);
      setTimeout(function (el) { el.remove(); }.bind(null, h), 1600);
    }
  }
  var heroCoins = null, heroCtx = null, heroT = 0;
  function drawHeroCoins(dt) {
    var cv = $('#heroCoins');
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w) return;
    if (!heroCtx || cv._w !== w || cv._h !== h) {
      heroCtx = ART.fit(cv, w, h); cv._w = w; cv._h = h;
      heroCoins = [
        { x: 0.8, y: 0.3, r: 0.12, s: 0 }, { x: 0.6, y: 0.14, r: 0.035, s: 1 },
        { x: 0.9, y: 0.1, r: 0.045, s: 2 }, { x: 0.96, y: 0.55, r: 0.065, s: 3 }, { x: 0.12, y: 0.16, r: 0.03, s: 4 }
      ];
    }
    heroT += dt;
    heroCtx.clearRect(0, 0, w, h);
    heroCoins.forEach(function (k) {
      heroCtx.save();
      heroCtx.translate(k.x * w, k.y * h + Math.sin(heroT * 1.2 + k.s) * 6);
      heroCtx.rotate(-0.25);
      ART.coin(heroCtx, k.r * w, 0.35 + Math.sin(heroT * 0.7 + k.s) * 0.25);
      heroCtx.restore();
    });
  }

  /* ==================================================================== WARDROBE */
  function renderWardrobe() {
    var grid = $('#skinGrid');
    grid.innerHTML = '';
    var lv = levelOf(profile.xp);
    SKINS.forEach(function (s) {
      var ok = lv >= s.lv;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'skin' + (profile.skin === s.id ? ' is-on' : '') + (ok ? '' : ' is-locked');
      b.disabled = !ok;
      var cv = document.createElement('canvas');
      var cx = ART.fit(cv, 104, 92);
      cx.translate(54, 54);
      ART.pig(cx, 24, { skin: s.id, t: 0.6 });
      var name = document.createElement('strong'); name.textContent = s.name;
      var sub = document.createElement('small');
      sub.textContent = ok ? (profile.skin === s.id ? 'Wearing' : 'Wear') : '🔒 Lv.' + s.lv;
      b.appendChild(cv); b.appendChild(name); b.appendChild(sub);
      b.addEventListener('click', function () { profile.skin = s.id; save(); renderWardrobe(); sfx.oink(); });
      grid.appendChild(b);
    });
  }

  /* ==================================================================== SHARE */
  function baseLink() { return (PROJECT.gameUrl || location.href).split('#')[0].split('?')[0]; }
  function challengeLink(r) {
    // Inside Telegram the link opens the Mini App and carries your Telegram id (signed by Telegram),
    // so you get a raffle ticket when a new friend starts playing through it.
    var me = window.TG && TG.active && TG.userId();
    if (me && PROJECT.tgAppUrl) {
      return PROJECT.tgAppUrl + '?startapp=c' + me + '_' + Math.floor(r.score) + '_' + (r.mode === 'daily' ? 'd' + (r.day || dailyNumber()) : r.mode === 'degen' ? 'g' : 'c');
    }
    return baseLink() + '?beat=' + Math.floor(r.score) + '&m=' + r.mode + (r.mode === 'daily' ? '&n=' + (r.day || dailyNumber()) : '');
  }
  function shareTelegram() {
    if (!lastRun) return;
    TG.share(challengeLink(lastRun), shareText(lastRun));
  }
  function shareText(r) {
    var head = r.mode === 'daily' ? 'Chart Run Daily #' + dailyNumber() + ' 🐷₿' : 'Chart Run' + (r.mode === 'degen' ? ' (Degen)' : '') + ' 🐷₿';
    return head + '\n' + fmt(r.score) + ' sats · Level ' + r.level + ' · ' + r.stomps + (r.stomps === 1 ? ' scammer' : ' scammers') + ' stomped' +
      '\nEvery ' + PROJECT.ticker + ' trade feeds the pig. Beat me 👇';
  }
  function shareX() {
    if (!lastRun) return;
    var text = shareText(lastRun), link = challengeLink(lastRun);
    var url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) +
      '&url=' + encodeURIComponent(link) +
      (PROJECT.xHandle ? '&via=' + encodeURIComponent(PROJECT.xHandle) : '') +
      (PROJECT.hashtags && PROJECT.hashtags.length ? '&hashtags=' + encodeURIComponent(PROJECT.hashtags.join(',')) : '');
    if (!(window.TG && TG.active)) { window.open(url, '_blank', 'noopener'); return; }
    // Telegram opens links in its own browser, where people usually aren't logged in to X (it shows
    // X's login page even with the X app installed). Copy the post first, so it can be pasted in the X app.
    var post = text + '\n' + link +
      (PROJECT.hashtags && PROJECT.hashtags.length ? '\n#' + PROJECT.hashtags.join(' #') : '') +
      (PROJECT.xHandle ? ' @' + PROJECT.xHandle : '');
    copyText(post, function (ok) {
      var hint = $('#shareHint');
      hint.hidden = false;
      hint.textContent = ok
        ? '✔ Post copied. If X asks you to log in, open the X app and paste it.'
        : 'If X asks you to log in, open the X app and post your score with the challenge link.';
      TG.openLink(url);
    });
  }
  // Copies text to the clipboard; calls back with true/false. Falls back to a hidden textarea for
  // in-app browsers (like Telegram's) where navigator.clipboard is missing or blocked.
  function copyText(text, cb) {
    var legacy = function () {
      var ta = document.createElement('textarea'), ok = false;
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      cb(ok);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { cb(true); }, legacy);
    else legacy();
  }
  function copyChallenge() {
    if (!lastRun) return;
    var text = shareText(lastRun) + '\n' + challengeLink(lastRun), btn = $('#copyBtn');
    var done = function () { btn.textContent = 'Copied!'; setTimeout(function () { btn.textContent = 'Copy challenge'; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { prompt('Copy this', text); });
    else prompt('Copy this', text);
  }
  function scoreCard(r) {
    var cv = document.createElement('canvas');
    cv.width = 1200; cv.height = 630;
    var c = cv.getContext('2d');
    c.fillStyle = C.ink; c.fillRect(0, 0, 1200, 630);
    var g = c.createLinearGradient(60, 60, 560, 570);
    g.addColorStop(0, '#7B3FA8'); g.addColorStop(1, '#3E2F86');
    c.fillStyle = g;
    ART.rrect(c, 60, 60, 500, 510, 40); c.fill();
    // a little chart under the pig
    c.save();
    ART.rrect(c, 60, 60, 500, 510, 40); c.clip();
    var hs = [3, 3, 4, 4, 5, 4, 5, 6, 6, 7, 6, 7, 8, 8, 9, 10];
    hs.forEach(function (h, i) { ART.candleColumn(c, 60 + i * 32, 570 - h * 24, 32, 580, i === 0 || h >= hs[i - 1], 10); });
    c.restore();
    [[470, 150, 44], [150, 130, 20], [380, 100, 16]].forEach(function (k) {
      c.save(); c.translate(k[0], k[1]); c.rotate(-0.25); ART.coin(c, k[2], 0.4); c.restore();
    });
    var img = $('#heroPig');
    if (img.complete && img.naturalWidth) {
      var iw = 360, ih = iw * img.naturalHeight / img.naturalWidth;
      c.drawImage(img, 110, 430 - ih, iw, ih);
    }
    c.save();
    c.translate(96, 470); c.rotate(-0.05);
    c.fillStyle = '#FF86B0';
    ART.rrect(c, 0, 0, 350, 46, 10); c.fill();
    c.fillStyle = C.ink;
    c.font = '500 20px "DM Mono", monospace';
    c.textBaseline = 'middle';
    c.fillText('CHASING SATS SINCE DAY 1', 20, 24);
    c.restore();

    c.textBaseline = 'alphabetic';
    c.fillStyle = '#B9A8D9';
    c.font = '500 22px "DM Mono", monospace';
    var tag = r.mode === 'daily' ? 'DAILY #' + dailyNumber() : r.mode === 'degen' ? 'DEGEN MODE' : 'CHART RUN';
    c.fillText(PROJECT.ticker + ' · ' + tag, 620, 130);
    c.fillStyle = C.cream;
    c.font = '48px "Bagel Fat One", Fredoka, sans-serif';
    c.fillText('I stacked', 620, 200);
    var big = fmt(r.score);
    c.fillStyle = C.blue;
    c.font = (big.length > 9 ? 70 : 88) + 'px "Bagel Fat One", Fredoka, sans-serif';
    c.fillText(big, 620, 300);
    c.fillStyle = C.cream;
    c.font = '48px "Bagel Fat One", Fredoka, sans-serif';
    c.fillText('sats.', 620, 362);
    c.fillStyle = '#C9B8F0';
    c.font = '500 26px Figtree, sans-serif';
    c.fillText('Level ' + r.level + ' · ' + r.coins + ' coins · ' + r.stomps + ' scammers stomped', 620, 420);
    var lv = levelOf(profile.xp);
    c.fillText('Lv.' + lv + ' ' + rankOf(lv) + ' · ' + daysHolding() + ' days holding', 620, 458);
    c.fillStyle = C.blue;
    ART.rrect(c, 620, 500, 480, 64, 32); c.fill();
    c.fillStyle = '#fff';
    c.font = '700 28px Fredoka, sans-serif';
    c.textAlign = 'center';
    c.fillText('Beat me at ' + PROJECT.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''), 860, 542);
    return cv;
  }
  function saveCard() {
    if (!lastRun) return;
    scoreCard(lastRun).toBlob(function (blob) {
      if (!blob) return;
      var file = null;
      try { file = new File([blob], 'chart-run.png', { type: 'image/png' }); } catch (e) { /* old browser */ }
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text: shareText(lastRun) + '\n' + challengeLink(lastRun) }).catch(function () {});
        return;
      }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'chart-run.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    }, 'image/png');
  }

  /* ==================================================================== DIALOGS */
  function openDialog(sel) {
    var d = $(sel);
    if (d.open) return;
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  function closeDialogs() { $$('dialog[open]').forEach(function (d) { if (d.close) d.close(); else d.removeAttribute('open'); }); }

  /* ==================================================================== WIRE UP */
  function init() {
    $$('[data-buy]').forEach(function (a) { a.href = PROJECT.buyUrl; });
    $$('[data-anychain]').forEach(function (a) { if (PROJECT.anyChainUrl) a.href = PROJECT.anyChainUrl; else a.hidden = true; });
    $$('[data-site]').forEach(function (a) { a.href = PROJECT.siteUrl; });
    $$('[data-x]').forEach(function (a) { if (PROJECT.xHandle) a.href = 'https://x.com/' + PROJECT.xHandle; else a.hidden = true; });
    $$('[data-x-handle]').forEach(function (el) { el.textContent = '@' + PROJECT.xHandle; });
    $$('[data-tg]').forEach(function (a) { if (PROJECT.telegramUrl) a.href = PROJECT.telegramUrl; else a.hidden = true; });
    $$('[data-ticker]').forEach(function (el) { el.textContent = PROJECT.ticker; });
    $$('[data-split]').forEach(function (el) { el.textContent = PROJECT.split[el.dataset.split]; });
    $$('[data-split-bar]').forEach(function (el) { el.style.flexGrow = PROJECT.split[el.dataset.splitBar]; });
    $$('[data-tax]').forEach(function (el) { el.textContent = PROJECT.taxPct; });
    if (PROJECT.contract) {
      $('#contract').hidden = false;
      $('#contractVal').textContent = PROJECT.contract;
      $('#contractBtn').addEventListener('click', function () {
        if (navigator.clipboard) navigator.clipboard.writeText(PROJECT.contract).then(function () { $('#contractBtn').textContent = 'Copied'; });
      });
    }
    $$('canvas[data-badge]').forEach(function (cv) {
      var s = +cv.dataset.badge, bc = ART.fit(cv, s, s);
      ART.badge(bc, s / 2, s / 2, s / 2);
    });
    var coarse = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    document.body.classList.toggle('has-touch', coarse);

    if (challenge && modeUnlocked(challenge.mode)) profile.mode = challenge.mode;
    $$('[data-mode]').forEach(function (b) {
      b.addEventListener('click', function () { profile.mode = b.dataset.mode; save(); renderModes(); renderRecords(); sfx.oink(); });
    });
    $('#challengeBtn').addEventListener('click', function () { start(challenge.mode); });
    $('#heroPig').addEventListener('click', petPig);
    $('#playBtn').addEventListener('click', function () { start(); });
    $('#againBtn').addEventListener('click', function () { start(lastRun ? lastRun.mode : profile.mode); });
    $('#homeBtn').addEventListener('click', function () { closeDialogs(); G = null; show('home'); });
    $('#quitBtn').addEventListener('click', function () {
      $('#pauseDlg').close();
      if (!G) return;
      G.paused = false;
      if (!G.over && (G.score > 0 || G.n > 1)) endRun(); else { G = null; show('home'); }
    });
    $('#pauseBtn').addEventListener('click', pause);
    $('#resumeBtn').addEventListener('click', resume);
    $('#restartBtn').addEventListener('click', function () { var m = G ? G.mode : profile.mode; $('#pauseDlg').close(); start(m); });
    $('#pauseDlg').addEventListener('cancel', function (e) { e.preventDefault(); resume(); });
    $('#fsBtn').hidden = !fsOK || standalone() || (window.TG && TG.active);
    $('#fsBtn').addEventListener('click', function () { if (inFullscreen()) exitFullscreen(); else enterFullscreen(); });
    $('#rotateClose').addEventListener('click', function () { profile.noRotateTip = true; save(); rotateTip(); sizeBoard(); });

    // install as an app
    var installEvt = null;
    var iOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; if (!(window.TG && TG.active)) $('#installBtn').hidden = false; });
    window.addEventListener('appinstalled', function () { $('#installBtn').hidden = true; });
    if (iOS && !standalone() && !(window.TG && TG.active)) $('#installBtn').hidden = false;
    $('#installBtn').addEventListener('click', function () {
      if (installEvt) { installEvt.prompt(); installEvt.userChoice.then(function () { installEvt = null; $('#installBtn').hidden = true; }); }
      else openDialog('#iosDlg');
    });
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline mode is a bonus */ });
    }
    $('#howBtn').addEventListener('click', function () { openDialog('#howDlg'); });
    $('#skinBtn').addEventListener('click', function () { renderWardrobe(); openDialog('#skinDlg'); });
    $$('[data-close]').forEach(function (b) { b.addEventListener('click', function () { b.closest('dialog').close(); }); });
    $('#shareBtn').addEventListener('click', shareX);
    $('#copyBtn').addEventListener('click', copyChallenge);
    $('#tgShareBtn').hidden = !(window.TG && TG.active);
    $('#tgShareBtn').addEventListener('click', shareTelegram);
    $('#cardBtn').addEventListener('click', saveCard);
    $('#soundBtn').addEventListener('click', function () {
      profile.muted = !profile.muted; save();
      $('#soundBtn').classList.toggle('is-muted', profile.muted);
      $('#soundBtn').setAttribute('aria-pressed', String(!profile.muted));
      if (!profile.muted) sfx.oink();
    });
    $('#soundBtn').classList.toggle('is-muted', profile.muted);
    $('#soundBtn').setAttribute('aria-pressed', String(!profile.muted));
    $('#overDlg').addEventListener('cancel', function (e) { e.preventDefault(); });
    var onResize = function () { if (!$('#game').hidden) { rotateTip(); sizeBoard(); } };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', function () { setTimeout(onResize, 250); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { input.left = input.right = input.jump = false; if (G && !G.over && !$('#game').hidden) pause(); }
    });

    show('home');
    if (!profile.runs) setTimeout(function () { openDialog('#howDlg'); }, 700);
    else homeSay(belly() > 25 ? pick(LINES.full) : pick(LINES.hungry));
    requestAnimationFrame(function (n) { last = n; requestAnimationFrame(frame); });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else init();
})();
