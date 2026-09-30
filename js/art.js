/* ==========================================================================
   CHART RUN — art
   Piggy (the flat logo version: eyepatch, ₿ coin in the slot), the coins
   and the hazards, all drawn on canvas.
   ========================================================================== */
var ART = (function () {
  'use strict';

  var C = {
    pink: '#F57EAD', pinkHi: '#FFB3D0', pinkDk: '#D9588D', snout: '#FF9EC4',
    blue: '#2F7FE0', blueHi: '#8CC2FF', blueDk: '#1D56A8',
    ink: '#140B22', cream: '#FFF3DC', red: '#FF3D5E', purple: '#7B5CD6', gold: '#FFC94D'
  };

  var SKINS = [
    { id: 'classic', name: 'Classic',      lv: 1 },
    { id: 'captain', name: 'Captain Hat',  lv: 3 },
    { id: 'laser',   name: 'Laser Patch',  lv: 5 },
    { id: 'diamond', name: 'Diamond Aura', lv: 8 },
    { id: 'crown',   name: 'Crown',        lv: 12 },
    { id: 'golden',  name: 'Golden Pig',   lv: 16 }
  ];

  function ellipse(c, x, y, rx, ry, rot) {
    c.beginPath();
    c.ellipse(x, y, Math.max(rx, 0.1), Math.max(ry, 0.1), rot || 0, 0, Math.PI * 2);
  }
  function rrect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* ------------------------------------------------------------------ coin
     a blue ₿ coin; tilt squashes it horizontally so it looks like it spins */
  function coin(c, r, spin, big, argus) {
    var sx = Math.max(0.18, Math.abs(Math.cos(spin || 0)));
    c.save();
    c.scale(sx, 1);
    // edge
    c.fillStyle = argus ? '#5A3FAE' : C.blueDk;
    ellipse(c, r * 0.12, 0, r, r); c.fill();
    var g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    g.addColorStop(0, argus ? '#D9C8FF' : big ? '#A9D3FF' : C.blueHi);
    g.addColorStop(1, argus ? C.purple : C.blue);
    c.fillStyle = g;
    ellipse(c, 0, 0, r, r); c.fill();
    c.lineWidth = Math.max(1.5, r * 0.1);
    c.strokeStyle = big ? C.gold : 'rgba(20,11,34,.28)';
    ellipse(c, 0, 0, r * 0.8, r * 0.8); c.stroke();
    if (sx > 0.35) {
      c.fillStyle = big ? '#fff' : 'rgba(20,50,110,.55)';
      c.font = '700 ' + Math.round(r * 1.05) + 'px Fredoka, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('₿', 0, r * 0.06);
    }
    c.restore();
  }

  /* pink liquidity droplet */
  function drop(c, r) {
    var g = c.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, '#FFC2DA'); g.addColorStop(1, '#FF6FA5');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, -r * 1.3);
    c.bezierCurveTo(r * 0.9, -r * 0.2, r, r * 0.9, 0, r);
    c.bezierCurveTo(-r, r * 0.9, -r * 0.9, -r * 0.2, 0, -r * 1.3);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)';
    ellipse(c, -r * 0.3, r * 0.1, r * 0.16, r * 0.26); c.fill();
  }

  /* red dump candle */
  function candle(c, r) {
    c.strokeStyle = '#FF8FA3';
    c.lineWidth = r * 0.14;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -r * 1.35); c.lineTo(0, r * 1.35); c.stroke();
    var g = c.createLinearGradient(-r * 0.4, 0, r * 0.4, 0);
    g.addColorStop(0, '#FF5470'); g.addColorStop(1, '#D61F45');
    c.fillStyle = g;
    rrect(c, -r * 0.42, -r * 0.95, r * 0.84, r * 1.9, r * 0.14); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)';
    rrect(c, -r * 0.3, -r * 0.85, r * 0.14, r * 1.6, r * 0.07); c.fill();
  }

  /* scam DM: an envelope with a red badge */
  function scamDM(c, r) {
    c.fillStyle = '#EDE6FF';
    c.strokeStyle = '#5B45A8';
    c.lineWidth = r * 0.1;
    rrect(c, -r, -r * 0.68, r * 2, r * 1.36, r * 0.18); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-r * 0.92, -r * 0.6); c.lineTo(0, r * 0.08); c.lineTo(r * 0.92, -r * 0.6); c.stroke();
    c.fillStyle = C.red;
    ellipse(c, r * 0.9, -r * 0.66, r * 0.42, r * 0.42); c.fill();
    c.fillStyle = '#fff';
    c.font = '700 ' + Math.round(r * 0.6) + 'px Fredoka, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('!', r * 0.9, -r * 0.62);
  }

  /* a rolled-up rug */
  function rug(c, r) {
    c.fillStyle = '#B8472E';
    rrect(c, -r * 1.2, -r * 0.42, r * 2.4, r * 0.84, r * 0.42); c.fill();
    c.strokeStyle = '#FFCE6E';
    c.lineWidth = r * 0.1;
    for (var i = -2; i <= 2; i++) {
      c.beginPath(); c.moveTo(i * r * 0.42, -r * 0.4); c.lineTo(i * r * 0.42 + r * 0.2, r * 0.4); c.stroke();
    }
    c.fillStyle = '#7E2A1A';
    ellipse(c, r * 1.2, 0, r * 0.22, r * 0.42); c.fill();
    c.strokeStyle = '#FFCE6E';
    c.lineWidth = r * 0.06;
    ellipse(c, r * 1.2, 0, r * 0.12, r * 0.26); c.stroke();
  }

  /* ------------------------------------------------------------------ Piggy
     Side view facing left, drawn after the Piggy Sats badge: round snout,
     one black shade lens on a strap, square legs, a ₿ coin in the slot.
     o: { skin, run (phase), speed 0..1, hurt, t, face: -1 left | 1 right } */
  function pig(c, r, o) {
    o = o || {};
    var skin = o.skin || 'classic';
    var gold = skin === 'golden';
    var P = gold
      ? { hi: '#FFE9A6', mid: '#F2C045', lo: '#D39A1E', snout: '#FFE08A', snoutLine: '#E8B53A', slot: '#8A5C08', nose: '#7A4E05', leg: '#E6AE2F', hoof: '#C58A14' }
      : { hi: '#FFA6CF', mid: '#F470A9', lo: '#DE5590', snout: '#FF9ECC', snoutLine: '#F27DB5', slot: '#9C2457', nose: '#8E1E4A', leg: '#F06CA6', hoof: '#D94F8C' };
    var t = o.t || 0, ph = o.run || 0, amp = (o.speed || 0) * 0.5;
    var ry = r * 0.8;

    c.save();
    if (o.face === 1) c.scale(-1, 1);
    if (skin === 'diamond') aura(c, r, t);

    // far legs
    leg(c, r, -0.12, ph + Math.PI, amp, P.lo, P.hoof, 0.9);
    leg(c, r, 0.52, ph, amp, P.lo, P.hoof, 0.9);

    // tail loop
    c.strokeStyle = P.lo;
    c.lineWidth = r * 0.07;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(r * 1.06, r * 0.02, r * 0.12, Math.PI * 0.95, Math.PI * 2.75);
    c.stroke();

    // far ear, behind the coin
    tri(c, [[0.14, -0.66], [0.46, -1.12], [0.5, -0.56]], r, P.mid);
    tri(c, [[0.24, -0.66], [0.44, -0.98], [0.46, -0.64]], r, P.lo);

    // body
    var g = c.createLinearGradient(0, -ry, 0, ry);
    g.addColorStop(0, P.hi); g.addColorStop(0.5, P.mid); g.addColorStop(1, P.lo);
    c.fillStyle = g;
    ellipse(c, 0, 0, r, ry); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)';
    ellipse(c, r * 0.02, -ry * 0.55, r * 0.62, ry * 0.2); c.fill();

    // slot + coin
    c.fillStyle = P.slot;
    rrect(c, -r * 0.28, -ry * 1.02, r * 0.6, r * 0.1, r * 0.05); c.fill();
    c.save();
    c.translate(r * 0.02, -ry * 1.02 - r * 0.24 + Math.sin(t * 3) * r * 0.02);
    coin(c, r * 0.28, 0, false);
    c.restore();

    // near ear
    tri(c, [[-0.66, -0.56], [-0.62, -1.12], [-0.24, -0.72]], r, P.mid);
    tri(c, [[-0.58, -0.64], [-0.58, -0.96], [-0.36, -0.72]], r, P.hi);

    // cheek + smile
    c.fillStyle = gold ? 'rgba(255,140,60,.35)' : 'rgba(255,80,140,.4)';
    ellipse(c, -r * 0.4, r * 0.3, r * 0.11, r * 0.07); c.fill();
    c.strokeStyle = P.slot;
    c.lineWidth = r * 0.05;
    c.lineCap = 'round';
    c.beginPath();
    if (o.hurt) c.arc(-r * 0.56, r * 0.58, r * 0.14, 1.2 * Math.PI, 1.8 * Math.PI);
    else c.arc(-r * 0.48, r * 0.22, r * 0.25, 0.22 * Math.PI, 0.58 * Math.PI);
    c.stroke();

    // snout
    c.fillStyle = P.snout;
    c.strokeStyle = P.snoutLine;
    c.lineWidth = r * 0.04;
    ellipse(c, -r * 0.94, r * 0.08, r * 0.31, r * 0.31); c.fill(); c.stroke();
    c.fillStyle = P.nose;
    ellipse(c, -r * 1.05, r * 0.08, r * 0.055, r * 0.1); c.fill();
    ellipse(c, -r * 0.85, r * 0.08, r * 0.055, r * 0.1); c.fill();

    // shades: one black lens on a strap
    c.strokeStyle = '#111';
    c.lineWidth = r * 0.07;
    c.beginPath(); c.moveTo(-r * 0.5, -r * 0.33); c.lineTo(-r * 0.02, -r * 0.36); c.stroke();
    var jig = o.hurt ? Math.sin(t * 50) * r * 0.03 : 0;
    c.save();
    c.translate(jig, 0);
    c.fillStyle = '#111';
    c.beginPath();
    c.moveTo(-r * 0.84, -r * 0.4);
    c.lineTo(-r * 0.38, -r * 0.4);
    c.quadraticCurveTo(-r * 0.36, -r * 0.12, -r * 0.55, -r * 0.12);
    c.lineTo(-r * 0.68, -r * 0.12);
    c.quadraticCurveTo(-r * 0.84, -r * 0.14, -r * 0.84, -r * 0.4);
    c.fill();
    c.fillStyle = '#8C8C96';
    c.beginPath();
    c.moveTo(-r * 0.78, -r * 0.36); c.lineTo(-r * 0.63, -r * 0.36); c.lineTo(-r * 0.72, -r * 0.24);
    c.closePath(); c.fill();
    c.restore();
    if (o.hurt) {
      c.fillStyle = '#9BD6FF';
      c.beginPath();
      c.moveTo(-r * 0.25, -r * 0.5);
      c.quadraticCurveTo(-r * 0.17, -r * 0.36, -r * 0.25, -r * 0.3);
      c.quadraticCurveTo(-r * 0.33, -r * 0.36, -r * 0.25, -r * 0.5);
      c.fill();
    }

    // near legs
    leg(c, r, -0.36, ph, amp, P.leg, P.hoof, 1);
    leg(c, r, 0.3, ph + Math.PI, amp, P.leg, P.hoof, 1);

    accessories(c, r, r, ry, skin, t);
    c.restore();
  }

  function tri(c, pts, r, fill) {
    c.fillStyle = fill;
    c.beginPath();
    pts.forEach(function (p, i) { if (i) c.lineTo(p[0] * r, p[1] * r); else c.moveTo(p[0] * r, p[1] * r); });
    c.closePath();
    c.fill();
  }

  /* one square leg with a darker hoof, swinging from the hip */
  function leg(c, r, x, ph, amp, fill, hoof, k) {
    var w = r * 0.3 * k, h = r * 0.52;
    c.save();
    c.translate(x * r, r * 0.46);
    c.rotate(Math.sin(ph) * amp);
    c.fillStyle = hoof;
    rrect(c, -w / 2, 0, w, h, r * 0.08); c.fill();
    c.fillStyle = fill;
    rrect(c, -w / 2, 0, w, h * 0.62, r * 0.08); c.fill();
    c.fillStyle = 'rgba(255,255,255,.2)';
    rrect(c, -w / 2 + r * 0.04, r * 0.04, w * 0.35, h * 0.4, r * 0.04); c.fill();
    c.restore();
  }

  /* the round Piggy Sats badge: navy rays, blue→violet ring, sparkles */
  function badge(c, x, y, R) {
    c.save();
    c.translate(x, y);
    c.save();
    c.beginPath(); c.arc(0, 0, R * 0.93, 0, Math.PI * 2); c.clip();
    c.fillStyle = '#1C2266';
    c.fillRect(-R, -R, R * 2, R * 2);
    c.fillStyle = '#262E86';
    for (var i = 0; i < 16; i++) {
      var a = i * Math.PI / 8;
      c.beginPath(); c.moveTo(0, 0);
      c.arc(0, 0, R, a, a + Math.PI / 16);
      c.closePath(); c.fill();
    }
    var v = c.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
    v.addColorStop(0, 'rgba(60,80,200,.35)'); v.addColorStop(1, 'rgba(10,10,50,.5)');
    c.fillStyle = v; c.fillRect(-R, -R, R * 2, R * 2);
    [[-0.55, -0.55], [0.55, -0.62], [-0.72, 0.02], [0.78, 0.02]].forEach(function (p) {
      c.save(); c.translate(p[0] * R, p[1] * R); star(c, R * 0.07, '#FFF0B8'); c.restore();
    });
    [[-0.68, -0.3], [0.72, -0.35], [-0.72, 0.5], [0.73, 0.52]].forEach(function (p) {
      c.save(); c.translate(p[0] * R, p[1] * R); coin(c, R * 0.06, 0, false); c.restore();
    });
    c.save();
    c.translate(-R * 0.02, R * 0.08);
    pig(c, R * 0.44, { t: 0 });
    c.restore();
    c.restore();
    var ring = c.createLinearGradient(-R, -R, R, R);
    ring.addColorStop(0, '#4E8DF0'); ring.addColorStop(1, '#A56BE0');
    c.strokeStyle = ring;
    c.lineWidth = R * 0.07;
    c.beginPath(); c.arc(0, 0, R * 0.93, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  function aura(c, r, t) {
    for (var i = 0; i < 5; i++) {
      var a = t * 0.9 + i * Math.PI * 2 / 5;
      var s = r * (0.1 + 0.03 * Math.sin(t * 4 + i));
      c.save();
      c.translate(Math.cos(a) * r * 1.35, Math.sin(a) * r * 0.95);
      c.fillStyle = '#9BE8FF';
      c.strokeStyle = '#2FA7DA';
      c.lineWidth = r * 0.02;
      c.beginPath();
      c.moveTo(0, -s); c.lineTo(s * 0.8, -s * 0.2); c.lineTo(0, s * 1.2); c.lineTo(-s * 0.8, -s * 0.2);
      c.closePath(); c.fill(); c.stroke();
      c.restore();
    }
  }

  function accessories(c, r, rx, ry, skin, t) {
    if (skin === 'captain') {
      c.save();
      c.translate(-rx * 0.6, -ry * 0.92);
      c.fillStyle = '#43307A';
      c.beginPath();
      c.moveTo(-r * 0.62, r * 0.08);
      c.quadraticCurveTo(-r * 0.4, -r * 0.52, 0, -r * 0.5);
      c.quadraticCurveTo(r * 0.4, -r * 0.52, r * 0.62, r * 0.08);
      c.quadraticCurveTo(0, -r * 0.08, -r * 0.62, r * 0.08);
      c.fill();
      c.strokeStyle = C.gold;
      c.lineWidth = r * 0.05;
      c.stroke();
      c.fillStyle = C.blue;
      ellipse(c, 0, -r * 0.24, r * 0.13, r * 0.13); c.fill();
      c.fillStyle = '#fff';
      c.font = '700 ' + Math.round(r * 0.2) + 'px Fredoka, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('₿', 0, -r * 0.23);
      c.restore();
    }
    if (skin === 'crown') {
      c.save();
      c.translate(-rx * 0.6, -ry * 0.96);
      c.fillStyle = C.gold;
      c.strokeStyle = '#B88A12';
      c.lineWidth = r * 0.04;
      c.beginPath();
      c.moveTo(-r * 0.32, r * 0.06);
      c.lineTo(-r * 0.38, -r * 0.3);
      c.lineTo(-r * 0.15, -r * 0.12);
      c.lineTo(0, -r * 0.38);
      c.lineTo(r * 0.15, -r * 0.12);
      c.lineTo(r * 0.38, -r * 0.3);
      c.lineTo(r * 0.32, r * 0.06);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = C.blue;
      ellipse(c, 0, -r * 0.06, r * 0.06, r * 0.06); c.fill();
      c.restore();
    }
    if (skin === 'laser') {
      var flick = 0.75 + 0.25 * Math.sin(t * 30);
      var x0 = -rx * 0.62, y0 = -r * 0.26, len = r * 3.2;
      var g = c.createLinearGradient(x0, y0, x0 - len, y0 - len * 0.12);
      g.addColorStop(0, 'rgba(255,50,70,' + flick + ')');
      g.addColorStop(1, 'rgba(255,50,70,0)');
      c.strokeStyle = g;
      c.lineWidth = r * 0.14;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 - len, y0 - len * 0.12); c.stroke();
      c.strokeStyle = 'rgba(255,235,235,' + flick + ')';
      c.lineWidth = r * 0.045;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 - len * 0.8, y0 - len * 0.1); c.stroke();
    }
    if (skin === 'golden') {
      for (var i = 0; i < 4; i++) {
        var a = t * 1.2 + i * Math.PI / 2;
        c.save();
        c.translate(Math.cos(a) * r * 1.2, Math.sin(a) * r * 0.9);
        star(c, r * (0.1 + 0.04 * Math.sin(t * 5 + i)), '#FFF3B0');
        c.restore();
      }
    }
  }

  /* ------------------------------------------------------------------ platformer pieces */

  /* TRADE block: hit it from below and the trade's tax pops out */
  function tradeBlock(c, s, used, t) {
    var r = s * 0.16;
    if (used) {
      c.fillStyle = '#3A2A5E';
      rrect(c, 0, 0, s, s, r); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.12)';
      c.lineWidth = 2;
      rrect(c, 2, 2, s - 4, s - 4, r); c.stroke();
      return;
    }
    var g = c.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, '#5EA6FF'); g.addColorStop(1, C.blue);
    c.fillStyle = C.blueDk;
    rrect(c, 0, 2, s, s, r); c.fill();
    c.fillStyle = g;
    rrect(c, 0, 0, s, s - 2, r); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)';
    rrect(c, 3, 3, s - 6, s * 0.18, r * 0.6); c.fill();
    c.fillStyle = '#fff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '700 ' + Math.round(s * 0.5) + 'px Fredoka, sans-serif';
    c.fillText('₿', s / 2, s * 0.46 + Math.sin((t || 0) * 4) * 1.2);
    c.font = '700 ' + Math.round(s * 0.2) + 'px Fredoka, sans-serif';
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.fillText('TRADE', s / 2, s * 0.83);
  }

  /* plain floating block */
  function solidBlock(c, s) {
    var g = c.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, '#8A63D8'); g.addColorStop(1, '#5A3FAE');
    c.fillStyle = '#3E2B7E';
    rrect(c, 0, 2, s, s, s * 0.14); c.fill();
    c.fillStyle = g;
    rrect(c, 0, 0, s, s - 2, s * 0.14); c.fill();
    c.fillStyle = 'rgba(255,255,255,.3)';
    [[0.22, 0.22], [0.78, 0.22], [0.22, 0.74], [0.78, 0.74]].forEach(function (p) {
      ellipse(c, s * p[0], s * p[1], s * 0.05, s * 0.05); c.fill();
    });
  }

  /* one candle column of the chart: body, top cap, wick */
  function candleColumn(c, x, top, w, bottom, green, wick) {
    var body = green ? ['#3BE58C', '#1FA85F', '#157A45'] : ['#FF6B83', '#D8324F', '#9E2038'];
    c.strokeStyle = body[1];
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + w / 2, top - wick); c.lineTo(x + w / 2, top); c.stroke();
    var g = c.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, body[0]); g.addColorStop(0.5, body[1]); g.addColorStop(1, body[2]);
    c.fillStyle = g;
    c.fillRect(x + 1, top, w - 2, bottom - top);
    c.fillStyle = 'rgba(255,255,255,.28)';
    c.fillRect(x + 1, top, w - 2, 4);
    c.fillStyle = 'rgba(0,0,0,.18)';
    c.fillRect(x + w - 3, top + 4, 2, bottom - top - 4);
  }

  /* Scam DM bot: an envelope on little legs */
  function dmBot(c, s, t, squash) {
    c.save();
    if (squash) { c.translate(0, s * 0.3); c.scale(1.2, 0.35); }
    var step = Math.sin(t * 12) * s * 0.08;
    c.fillStyle = '#2A1F4A';
    rrect(c, -s * 0.34 + step, s * 0.26, s * 0.2, s * 0.26, s * 0.06); c.fill();
    rrect(c, s * 0.14 - step, s * 0.26, s * 0.2, s * 0.26, s * 0.06); c.fill();
    scamDM(c, s * 0.46);
    c.fillStyle = '#2A1F4A';
    ellipse(c, -s * 0.14, s * 0.04, s * 0.05, s * 0.07); c.fill();
    ellipse(c, s * 0.08, s * 0.04, s * 0.05, s * 0.07); c.fill();
    c.restore();
  }

  /* Bear: a small grumpy bear with a red down arrow */
  function bear(c, s, t, squash) {
    c.save();
    if (squash) { c.translate(0, s * 0.3); c.scale(1.2, 0.35); }
    var step = Math.sin(t * 10) * s * 0.07;
    c.fillStyle = '#5B3A24';
    rrect(c, -s * 0.36 + step, s * 0.22, s * 0.22, s * 0.3, s * 0.08); c.fill();
    rrect(c, s * 0.14 - step, s * 0.22, s * 0.22, s * 0.3, s * 0.08); c.fill();
    c.fillStyle = '#8A5A36';
    ellipse(c, 0, 0, s * 0.46, s * 0.4); c.fill();
    ellipse(c, -s * 0.3, -s * 0.34, s * 0.12, s * 0.12); c.fill();
    ellipse(c, s * 0.3, -s * 0.34, s * 0.12, s * 0.12); c.fill();
    c.fillStyle = '#C79466';
    ellipse(c, -s * 0.16, s * 0.06, s * 0.14, s * 0.1); c.fill();
    c.fillStyle = '#2A1A10';
    ellipse(c, -s * 0.2, s * 0.03, s * 0.05, s * 0.035); c.fill();
    ellipse(c, -s * 0.14, -s * 0.14, s * 0.04, s * 0.05); c.fill();
    ellipse(c, s * 0.08, -s * 0.14, s * 0.04, s * 0.05); c.fill();
    c.strokeStyle = '#2A1A10';
    c.lineWidth = s * 0.04;
    c.beginPath(); c.moveTo(-s * 0.22, -s * 0.24); c.lineTo(-s * 0.08, -s * 0.2); c.stroke();
    c.beginPath(); c.moveTo(s * 0.14, -s * 0.24); c.lineTo(s * 0.02, -s * 0.2); c.stroke();
    c.fillStyle = C.red;
    c.beginPath();
    c.moveTo(s * 0.2, s * 0.02); c.lineTo(s * 0.32, s * 0.02); c.lineTo(s * 0.32, s * 0.14);
    c.lineTo(s * 0.4, s * 0.14); c.lineTo(s * 0.26, s * 0.3); c.lineTo(s * 0.12, s * 0.14); c.lineTo(s * 0.2, s * 0.14);
    c.closePath(); c.fill();
    c.restore();
  }

  /* "PUMP" spring pad */
  function spring(c, w, squeeze) {
    var h = w * (0.5 - squeeze * 0.25);
    c.fillStyle = '#157A45';
    rrect(c, -w / 2, -w * 0.12, w, w * 0.12, 3); c.fill();
    c.strokeStyle = '#9BF0C4';
    c.lineWidth = 2.5;
    c.beginPath();
    for (var i = 0; i <= 4; i++) c.lineTo((i % 2 ? 1 : -1) * w * 0.3, -w * 0.12 - h * i / 4);
    c.stroke();
    c.fillStyle = '#3BE58C';
    rrect(c, -w / 2, -w * 0.12 - h - w * 0.16, w, w * 0.16, 4); c.fill();
    c.fillStyle = '#0E3B22';
    c.font = '700 ' + Math.round(w * 0.2) + 'px Fredoka, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('PUMP', 0, -w * 0.12 - h - w * 0.08);
  }

  /* Diamond Hands power-up */
  function diamond(c, r, t) {
    c.save();
    c.rotate(Math.sin((t || 0) * 3) * 0.15);
    var g = c.createLinearGradient(-r, -r, r, r);
    g.addColorStop(0, '#E6FBFF'); g.addColorStop(0.5, '#8EE6FF'); g.addColorStop(1, '#2FA7DA');
    c.fillStyle = g;
    c.strokeStyle = '#fff';
    c.lineWidth = r * 0.1;
    c.beginPath();
    c.moveTo(-r, -r * 0.3); c.lineTo(-r * 0.5, -r * 0.85); c.lineTo(r * 0.5, -r * 0.85); c.lineTo(r, -r * 0.3); c.lineTo(0, r);
    c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-r, -r * 0.3); c.lineTo(r, -r * 0.3); c.stroke();
    c.restore();
  }

  /* ATH flag on a pole; h = pole height */
  function athFlag(c, h, flagY, t) {
    c.fillStyle = '#E8E1FF';
    c.fillRect(-2, -h, 4, h);
    c.fillStyle = C.gold;
    ellipse(c, 0, -h - 5, 6, 6); c.fill();
    var wave = Math.sin((t || 0) * 5) * 3;
    c.fillStyle = C.gold;
    c.beginPath();
    c.moveTo(2, -h + flagY);
    c.quadraticCurveTo(24, -h + flagY + wave, 46, -h + flagY + 4);
    c.lineTo(46, -h + flagY + 26);
    c.quadraticCurveTo(24, -h + flagY + 22 + wave, 2, -h + flagY + 26);
    c.closePath(); c.fill();
    c.fillStyle = C.ink;
    c.font = '700 12px Fredoka, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('ATH', 23, -h + flagY + 15);
  }

  /* the vault at the end of each level: a giant piggy bank */
  function vault(c, s, t) {
    c.save();
    c.translate(0, -s * 0.72);
    pig(c, s * 0.62, { t: t || 0 });
    c.restore();
  }

  /* "Claim" power-up: the Argus claim button as a pill */
  function claim(c, r, t) {
    var w = r * 2.6, h = r * 1.2;
    c.save();
    c.shadowColor = 'rgba(125,184,247,.9)';
    c.shadowBlur = r * (0.8 + 0.4 * Math.sin((t || 0) * 6));
    c.fillStyle = C.blueDk;
    rrect(c, -w / 2, -h / 2 + r * 0.16, w, h, h / 2); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = C.blue;
    rrect(c, -w / 2, -h / 2, w, h, h / 2); c.fill();
    c.fillStyle = '#fff';
    c.font = '700 ' + Math.round(r * 0.66) + 'px Fredoka, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('Claim', 0, r * 0.02);
    c.restore();
  }

  /* heart snack: restores one heart */
  function snack(c, r) {
    c.fillStyle = C.pink;
    c.strokeStyle = '#fff';
    c.lineWidth = r * 0.14;
    c.beginPath();
    c.moveTo(0, r * 0.85);
    c.bezierCurveTo(-r * 1.3, -r * 0.1, -r * 0.6, -r * 1.1, 0, -r * 0.4);
    c.bezierCurveTo(r * 0.6, -r * 1.1, r * 1.3, -r * 0.1, 0, r * 0.85);
    c.fill(); c.stroke();
  }

  function star(c, s, color) {
    c.fillStyle = color;
    c.beginPath();
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, rr = i % 2 ? s * 0.35 : s;
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
    c.fill();
  }

  /* size a canvas for the device pixel ratio */
  function fit(canvas, w, h) {
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  return { C: C, SKINS: SKINS, pig: pig, badge: badge, coin: coin, drop: drop, candle: candle,
           scamDM: scamDM, rug: rug, claim: claim, snack: snack, tradeBlock: tradeBlock, solidBlock: solidBlock, candleColumn: candleColumn,
           dmBot: dmBot, bear: bear, spring: spring, diamond: diamond, athFlag: athFlag, vault: vault, star: star, rrect: rrect, ellipse: ellipse, fit: fit };
})();
