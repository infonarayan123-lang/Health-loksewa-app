/* Health Loksewa: "Question of the day" picture cards (bright, colourful design).
   Loaded only when a visitor taps a picture button. It draws on a canvas in the browser; nothing is sent anywhere.
   window.HLCard.make(question, { kind: 'question' | 'answer', format: 'square' | 'story' }) returns a canvas. */
(function(){
  'use strict';
  var FONT = 'Tinos, "Noto Serif Devanagari", "Times New Roman", Times, serif';
  try{ if(document.fonts && document.fonts.load){ document.fonts.load('400 20px Tinos'); document.fonts.load('700 20px Tinos'); document.fonts.load('700 20px "Noto Serif Devanagari"', '\u0905'); } }catch(e){}   /* start loading the fonts for the picture */
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var W = 1080, MARGIN = 40, INNER = 46, PADX = MARGIN + INNER, IN = W - PADX * 2;
  var NAVY = '#0B1C3D', VIOLET = '#6D28D9';
  /* ONE format for all options: soft indigo fill, indigo border, indigo circle. In the answer card the right one is green; if the visitor's own wrong pick is passed (o.picked) it is red. */
  var PLAIN = ['#F5F7FF', '#C7D2FE', '#4F46E5'];
  function nepalDate(){ var d = new Date(Date.now() + 20700000); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
  function clip(s, n){ s = String(s || ''); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '...'; }
  function wrap(ctx, text, maxW){
    var words = String(text).split(/\s+/).filter(Boolean), lines = [], cur = '';
    words.forEach(function(w){
      while(ctx.measureText(w).width > maxW){
        var i = w.length; while(i > 1 && ctx.measureText(w.slice(0, i)).width > maxW) i--;
        if(cur){ lines.push(cur); cur = ''; }
        lines.push(w.slice(0, i)); w = w.slice(i);
      }
      if(!w) return;
      var t = cur ? cur + ' ' + w : w;
      if(ctx.measureText(t).width <= maxW) cur = t; else { lines.push(cur); cur = w; }
    });
    if(cur) lines.push(cur);
    return lines;
  }
  function rr(c, x, y, w, h, r){ c.beginPath(); if(c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
  /* measure everything at a text scale s (nothing is drawn here); the footer band is placed separately */
  function measure(q, kind, s){
    var x = document.createElement('canvas').getContext('2d'), L = { s: s }, y = 0;
    L.brandY = y; y += 108 * s;
    L.badgeY = y; y += 78 * s;
    if(q.subject){ x.font = '700 ' + (32 * s) + 'px ' + FONT; L.subj = wrap(x, q.subject, IN).slice(0, 2); L.subjY = y; y += L.subj.length * 42 * s + 14 * s; }
    x.font = '800 ' + (56 * s) + 'px ' + FONT; L.ql = wrap(x, q.q, IN); L.qY = y; y += L.ql.length * 56 * s * 1.28 + 34 * s;
    x.font = '600 ' + (40 * s) + 'px ' + FONT; L.opts = [];
    ['A', 'B', 'C', 'D'].forEach(function(l, i){
      if(!q.opts[i]) return;
      var lines = wrap(x, q.opts[i], IN - 150 * s), h = Math.max(92 * s, lines.length * 40 * s * 1.28 + 40 * s);
      L.opts.push({ l: l, lines: lines, y: y, h: h }); y += h + 18 * s;
    });
    if(kind === 'answer' && q.expl){
      x.font = '500 ' + (32 * s) + 'px ' + FONT; L.ex = wrap(x, clip(q.expl, 420), IN - 56 * s).slice(0, 8);
      L.exY = y + 8 * s; L.exH = 62 * s + L.ex.length * 32 * s * 1.35 + 26 * s; y += L.exH + 24 * s;
    }
    L.body = y; L.bandH = (kind === 'answer' ? 150 : 170) * s; L.content = y + 26 * s + L.bandH;
    return L;
  }
  function make(q, o){
    o = o || {};
    var kind = o.kind === 'answer' ? 'answer' : 'question', story = o.format === 'story';
    var H0 = story ? 1920 : 1080, cardTop = story ? 210 : MARGIN, cardBottomGap = story ? 250 : MARGIN, innerV = 40;
    var avail = H0 - cardTop - cardBottomGap - innerV * 2;
    var s = story ? 1.3 : 1, L = measure(q, kind, s);
    while(L.content > avail && s > 0.5){ s = Math.round((s - 0.06) * 100) / 100; L = measure(q, kind, s); }
    if(L.content <= avail){ var maxS = story ? 1.6 : 1.2; while(s < maxS){ var t = Math.round((s + 0.05) * 100) / 100, T = measure(q, kind, t); if(T.content <= avail){ s = t; L = T; } else break; } }
    var H = L.content > avail ? Math.min(4000, Math.ceil(L.content + innerV * 2 + cardTop + cardBottomGap)) : H0;
    var cardH = H - cardTop - cardBottomGap, cardY = cardTop, cardX = MARGIN, cardW = W - MARGIN * 2;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var c = cv.getContext('2d'); var s0 = L.s;
    /* 1. colourful background: violet to blue to teal, dots and two warm glows */
    var g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#7C3AED'); g.addColorStop(0.5, '#2563EB'); g.addColorStop(1, '#0D9488'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.12)'; for(var dx = 22; dx < W; dx += 34) for(var dy = 22; dy < H; dy += 34){ c.beginPath(); c.arc(dx, dy, 2.2, 0, 6.2832); c.fill(); }
    function glow(cx, cy, r, rgb, a){ var rg = c.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); rg.addColorStop(1, 'rgba(' + rgb + ',0)'); c.fillStyle = rg; c.fillRect(cx - r, cy - r, r * 2, r * 2); }
    glow(120, 120, 420, '255,255,255', 0.34); glow(W - 60, H - 120, 460, '94,234,212', 0.55); glow(W - 80, 160, 300, '251,191,36', 0.28);
    /* story: a brand line above the card, in the free top area */
    if(story){ c.fillStyle = 'rgba(255,255,255,0.95)'; c.font = '800 54px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillText('Health Loksewa', W / 2, 96); c.font = '600 34px ' + FONT; c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillText('Free exam practice for Nepal', W / 2, 160); c.textAlign = 'left'; }
    /* 2. the white card with a soft shadow */
    c.save(); c.shadowColor = 'rgba(8,10,40,0.35)'; c.shadowBlur = 46; c.shadowOffsetY = 16; c.fillStyle = '#FFFFFF'; rr(c, cardX, cardY, cardW, cardH, 46); c.fill(); c.restore();
    c.save(); rr(c, cardX, cardY, cardW, cardH, 46); c.clip();
    c.fillStyle = '#F1F5FF'; for(var ex = cardX + 20; ex < cardX + cardW; ex += 32) for(var ey = cardY + 20; ey < cardY + cardH; ey += 32){ c.beginPath(); c.arc(ex, ey, 1.8, 0, 6.2832); c.fill(); }
    if(o.watermark !== false){
      c.save(); c.translate(W / 2, cardY + cardH / 2); c.rotate(-0.5); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(109,40,217,0.07)';
      c.font = '800 150px ' + FONT; c.fillText('Health Loksewa', 0, -10); c.font = '700 52px ' + FONT; c.fillText(location.host || 'Health Loksewa app', 0, 90); c.restore();
    }
    /* 3. the content, centred in the card (story) or from the top (square) */
    var bodyTop = cardY + innerV, bandY = cardY + cardH - innerV - L.bandH, region = bandY - 26 * s0 - bodyTop, off = bodyTop + Math.max(0, Math.round((region - L.body) / 2));
    c.save(); c.translate(0, off); c.textBaseline = 'top'; c.textAlign = 'left';
    /* brand row: logo, name, date chip */
    var by = L.brandY + 6 * s0, lg = c.createLinearGradient(PADX, by, PADX + 84 * s0, by + 84 * s0); lg.addColorStop(0, '#2DD4BF'); lg.addColorStop(1, '#3B82F6'); c.fillStyle = lg; rr(c, PADX, by, 84 * s0, 84 * s0, 24 * s0); c.fill();
    c.fillStyle = '#FFFFFF'; c.fillRect(PADX + 34 * s0, by + 18 * s0, 16 * s0, 48 * s0); c.fillRect(PADX + 18 * s0, by + 34 * s0, 48 * s0, 16 * s0);
    var ds = nepalDate(); c.font = '800 ' + (28 * s0) + 'px ' + FONT; var dw = c.measureText(ds).width + 40 * s0;
    var nf = 48 * s0, roomW = (W - PADX - dw) - (PADX + 108 * s0) - 20; c.font = '800 ' + nf + 'px ' + FONT; while(nf > 24 && c.measureText('Health Loksewa').width > roomW){ nf -= 2; c.font = '800 ' + nf + 'px ' + FONT; }
    c.fillStyle = NAVY; c.fillText('Health Loksewa', PADX + 108 * s0, by + 42 * s0 - nf * 0.5);
    c.fillStyle = '#EDE9FE'; rr(c, W - PADX - dw, by + 14 * s0, dw, 56 * s0, 28 * s0); c.fill(); c.fillStyle = '#5B21B6'; c.font = '800 ' + (28 * s0) + 'px ' + FONT; c.fillText(ds, W - PADX - dw + 20 * s0, by + 28 * s0);
    /* title pill */
    var bt = kind === 'answer' ? 'QUESTION OF THE DAY  -  ANSWER' : 'QUESTION OF THE DAY'; c.font = '800 ' + (30 * s0) + 'px ' + FONT; try{ c.letterSpacing = (2.5 * s0) + 'px'; }catch(e){}
    var bw = c.measureText(bt).width + 64 * s0, pg = c.createLinearGradient(PADX, 0, PADX + bw, 0);
    if(kind === 'answer'){ pg.addColorStop(0, '#166534'); pg.addColorStop(1, '#16A34A'); } else { pg.addColorStop(0, '#E11D48'); pg.addColorStop(1, '#EA580C'); }
    c.fillStyle = pg; rr(c, PADX, L.badgeY, bw, 60 * s0, 30 * s0); c.fill(); c.fillStyle = '#FFFFFF'; c.fillText(bt, PADX + 32 * s0, L.badgeY + 14 * s0); try{ c.letterSpacing = '0px'; }catch(e){}
    if(L.subj){ c.fillStyle = VIOLET; c.font = '800 ' + (32 * s0) + 'px ' + FONT; L.subj.forEach(function(t, i){ c.fillText(t, PADX, L.subjY + i * 42 * s0); }); }
    c.fillStyle = NAVY; c.font = '800 ' + (56 * s0) + 'px ' + FONT; L.ql.forEach(function(t, i){ c.fillText(t, PADX, L.qY + i * 56 * s0 * 1.28); });
    /* options: all in the same format; in the answer card the right one is green, the visitor's wrong pick (if given) is red, the others fade */
    L.opts.forEach(function(op){
      var good = kind === 'answer' && op.l === q.ans, bad = kind === 'answer' && !good && !!o.picked && op.l === o.picked, dim = kind === 'answer' && !good && !bad;
      c.fillStyle = good ? '#DCFCE7' : (bad ? '#FEE2E2' : (dim ? '#F3F4F6' : PLAIN[0])); rr(c, PADX, op.y, IN, op.h, 26 * s0); c.fill();
      c.strokeStyle = good ? '#16A34A' : (bad ? '#DC2626' : (dim ? '#D1D5DB' : PLAIN[1])); c.lineWidth = (good || bad) ? 6 : 3; c.stroke();
      c.fillStyle = good ? '#16A34A' : (bad ? '#DC2626' : (dim ? '#9CA3AF' : PLAIN[2])); c.beginPath(); c.arc(PADX + 56 * s0, op.y + op.h / 2, 32 * s0, 0, 6.2832); c.fill();
      c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '800 ' + (36 * s0) + 'px ' + FONT; c.fillText(op.l, PADX + 56 * s0, op.y + op.h / 2 + 2 * s0); c.textAlign = 'left'; c.textBaseline = 'top';
      var th = op.lines.length * 40 * s0 * 1.28, ty = op.y + (op.h - th) / 2 + 6 * s0;
      c.fillStyle = dim ? '#4B5563' : NAVY; c.font = '600 ' + (40 * s0) + 'px ' + FONT; op.lines.forEach(function(t, i){ c.fillText(t, PADX + 120 * s0, ty + i * 40 * s0 * 1.28); });
      if(good || bad){ c.fillStyle = good ? '#15803D' : '#B91C1C'; c.font = '800 ' + (24 * s0) + 'px ' + FONT; c.textAlign = 'right'; c.fillText(good ? 'CORRECT' : 'YOUR ANSWER', PADX + IN - 26 * s0, op.y + 10 * s0); c.textAlign = 'left'; }
    });
    if(L.ex){
      c.fillStyle = '#EEF2FF'; rr(c, PADX, L.exY, IN, L.exH, 24 * s0); c.fill(); c.strokeStyle = '#C7D2FE'; c.lineWidth = 2; c.stroke();
      c.fillStyle = VIOLET; c.font = '800 ' + (26 * s0) + 'px ' + FONT; c.fillText('WHY', PADX + 28 * s0, L.exY + 22 * s0);
      c.fillStyle = '#1F2A5C'; c.font = '500 ' + (32 * s0) + 'px ' + FONT; L.ex.forEach(function(t, i){ c.fillText(t, PADX + 28 * s0, L.exY + 62 * s0 + i * 32 * s0 * 1.35); });
    }
    c.restore();
    /* 4. the bottom band: bold gradient with the call to action */
    var bg2 = c.createLinearGradient(PADX, bandY, PADX + IN, bandY); bg2.addColorStop(0, '#0F766E'); bg2.addColorStop(0.55, '#2563EB'); bg2.addColorStop(1, '#7C3AED'); c.fillStyle = bg2; rr(c, PADX, bandY, IN, L.bandH, 30 * s0); c.fill();
    c.textBaseline = 'top'; c.textAlign = 'left'; c.fillStyle = '#FFFFFF'; c.font = '800 ' + (42 * s0) + 'px ' + FONT; c.fillText(kind === 'answer' ? 'Practise more in the app' : 'Comment your answer below.', PADX + 34 * s0, bandY + 24 * s0);
    c.fillStyle = 'rgba(255,255,255,0.92)'; c.font = '600 ' + (30 * s0) + 'px ' + FONT; c.fillText(kind === 'answer' ? 'Free MCQs and mock tests: Health Loksewa' : 'Try it free in the Health Loksewa app', PADX + 34 * s0, bandY + 78 * s0);
    if(location.host){ c.fillStyle = '#FDE68A'; c.font = '800 ' + (28 * s0) + 'px ' + FONT; c.fillText(location.host, PADX + 34 * s0, bandY + (kind === 'answer' ? 114 : 120) * s0); }
    c.restore();
    return cv;
  }
  window.HLCard = { make: make };
})();
