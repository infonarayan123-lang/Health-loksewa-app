/* Health Loksewa: site search. Looks in several places at the same time (the pages of the site, and the lists that come from the Google Sheet) and groups the answers. Nothing is sent anywhere except the same public list requests the other pages make. No HTML strings are built: every text is added as text. */
(function(){
  'use strict';
  var H = window.HLSite; if(!H || !H.u) return;
  var u = H.u, el = u.el, clear = u.clear, txt = u.txt, stripTags = u.stripTags, isoDate = u.isoDate, niceDate = u.niceDate, https = u.https, getJSON = u.getJSON;
  var input = document.getElementById('sInput'); if(!input) return;
  var form = document.getElementById('sForm'), status = document.getElementById('sStatus'), hint = document.getElementById('sHint'), box = document.getElementById('sResults'), chips = document.getElementById('sChips');

  /* the pages of the site (kept in step with the real files by a test) */
  var PAGES = [
    { t: 'Home', u: 'index.html', k: 'home start app practise exam mcq' },
    { t: 'Loksewa Aayog guide', u: 'loksewa.html', k: 'loksewa aayog public service commission syllabus notice calendar exam process vacancy' },
    { t: 'Health licence guide', u: 'license.html', k: 'licence license nhpc council exam registration' },
    { t: 'Public Health Officer (PHO): exam practice', u: 'exam-pho.html', k: 'pho public health officer exam practice mcq mock test past questions loksewa' },
    { t: 'Health Assistant (HA): exam practice', u: 'exam-ha.html', k: 'ha health assistant exam practice mcq mock test past questions loksewa' },
    { t: 'Staff Nurse: exam practice', u: 'exam-sn.html', k: 'sn staff nurse nursing exam practice mcq mock test past questions loksewa' },
    { t: 'Auxiliary Health Worker (AHW): exam practice', u: 'exam-ahw.html', k: 'ahw auxiliary health worker exam practice mcq mock test loksewa' },
    { t: 'Auxiliary Nurse Midwife (ANM): exam practice', u: 'exam-anm.html', k: 'anm auxiliary nurse midwife exam practice mcq mock test loksewa' },
    { t: 'Health Assistant (HA) Licence exam: exam practice', u: 'exam-ha-licence.html', k: 'ha licence license health assistant nhpc council exam practice mcq mock test' },
    { t: 'Bachelor of Public Health (BPH) Licence exam: exam practice', u: 'exam-bph-licence.html', k: 'bph licence license bachelor public health nhpc council exam practice mcq mock test' },
    { t: 'Library of exam documents', u: 'library.html', k: 'library documents syllabus notices calendars reports pdf download' },
    { t: 'Study packs', u: 'products.html', k: 'packs mock tests ebooks notes courses videos premium free' },
    { t: 'News and vacancies', u: 'news.html', k: 'news vacancy vacancies notice exam closing dates jobs' },
    { t: 'Resources and official links', u: 'resources.html', k: 'resources links official websites commission ministry' },
    { t: 'Tools and calculators', u: 'tools.html', k: 'tools calculators calculator study helpers' },
    { t: 'BMI calculator', u: 'tools.html', k: 'bmi body mass index weight height calculator' },
    { t: 'Due date calculator', u: 'tools.html', k: 'due date edd pregnancy expected delivery calculator' },
    { t: 'Sample size calculator', u: 'tools.html', k: 'sample size survey proportion calculator research thesis' },
    { t: 'Risk and odds calculator (2 by 2 table)', u: 'tools.html', k: 'risk odds ratio relative risk nnt 2x2 table epidemiology calculator' },
    { t: 'Body surface area (BSA) calculator', u: 'tools.html', k: 'bsa body surface area mosteller calculator' },
    { t: 'IV drip rate calculator', u: 'tools.html', k: 'iv drip rate drops per minute infusion nursing calculator' },
    { t: 'Study planner', u: 'planner.html', k: 'study planner plan timetable schedule countdown exam date hours subjects revision weekly' },
    { t: 'Health dictionary', u: 'dictionary.html', k: 'dictionary glossary terms meaning definition words' },
    { t: 'Health days calendar', u: 'health-days.html', k: 'health days world days calendar theme who' },
    { t: 'Public holidays of Nepal', u: 'public-holidays.html', k: 'public holidays dashain tihar calendar nepal government holiday' },
    { t: 'Question of the day', u: 'question-of-the-day.html', k: 'question day daily mcq quiz' },
    { t: 'FAQs', u: 'faqs.html', k: 'faq faqs questions answers help' },
    { t: 'Contact us', u: 'contact.html', k: 'contact email message support feedback problem write' },
    { t: 'About Health Loksewa', u: 'about.html', k: 'about us company who we are' },
    { t: 'How we prepare and check our content', u: 'content-policy.html', k: 'content quality checked questions answers mistake report correction ai past model questions textbook' }
  ];
  H.searchPages = PAGES;
  var GROUPS = [
    { id: 'pages', label: 'Pages' }, { id: 'faq', label: 'Answers', action: 'siteFaqs' }, { id: 'doc', label: 'Documents', action: 'siteDocuments' }, { id: 'news', label: 'News and vacancies', action: 'siteNews' },
    { id: 'pack', label: 'Study packs', action: 'siteProducts' }, { id: 'hday', label: 'Health days', action: 'siteHealthDays' }, { id: 'hol', label: 'Public holidays', action: 'sitePublicHolidays' }
  ];
  var data = Object.create(null), state = Object.create(null), expanded = Object.create(null), lastQ = '';

  function item(title, text, meta, url, ext){
    title = stripTags(title, 140); if(!title) return null; text = stripTags(text, 400); meta = stripTags(meta, 120);
    return { title: title, text: text, meta: meta, url: url, ext: !!ext, tl: title.toLowerCase(), xl: (text + ' ' + meta).toLowerCase() };
  }
  function pick(list, max, fn){ var out = []; (Array.isArray(list) ? list : []).slice(0, max).forEach(function(r){ if(!r || typeof r !== 'object') return; var it = fn(r); if(it) out.push(it); }); return out; }
  var LOAD = {
    faq: function(){ return getJSON('siteFaqs', 9000).then(function(d){ return pick(d && d.faqs, 100, function(f){ return f.answer ? item(f.question, f.answer, f.category, 'faqs.html', false) : null; }); }); },
    doc: function(){ return getJSON('siteDocuments', 9000).then(function(d){ return pick(u.cleanDocs(d && d.docs), 800, function(d){ return item(d.title, [d.group, d.subgroup, d.note].filter(Boolean).join(' · '), [d.section, d.date ? niceDate(d.date) : ''].filter(Boolean).join(' · '), d.link, true); }); }); },
    news: function(){ return getJSON('siteNews', 9000).then(function(d){ return pick(u.cleanNews(d && d.items), 30, function(n){ var link = https(n.link); return item(n.title, n.summary, [n.category, n.tag, n.closing ? 'closes ' + niceDate(n.closing) : n.date].filter(Boolean).join(' · '), link || 'news.html', !!link); }); }); },
    pack: function(){ return getJSON('siteProducts', 9000).then(function(d){ return pick(d && d.products, 100, function(p){ var link = https(p.link); return item(p.name, p.description, [p.type, p.exam, p.access].filter(Boolean).join(' · '), link || 'products.html', !!link); }); }); },
    hday: function(){ return getJSON('siteHealthDays', 9000).then(function(d){ return pick(d && d.days, 400, function(x){ return item(x.title, [x.theme, x.keyMessage, x.description].filter(Boolean).join(' '), [x.date, x.category].filter(Boolean).join(' · '), 'health-days.html', false); }); }); },
    hol: function(){ return getJSON('sitePublicHolidays', 9000).then(function(d){ return pick(d && d.holidays, 400, function(h){ var iso = isoDate(h.date); return iso ? item(h.title, h.note, [niceDate(iso), stripTags(h.nepaliDate, 40)].filter(Boolean).join(' · '), 'public-holidays.html', false) : null; }); }); }
  };
  function ensure(g){
    if(!g.action || state[g.id] === 'loading' || state[g.id] === 'ok') return;
    state[g.id] = 'loading';
    var done = function(items){ data[g.id] = items || []; state[g.id] = (H.netFail && H.netFail[g.action]) ? 'fail' : 'ok'; paint(); };
    try{ LOAD[g.id]().then(done, function(){ done([]); }); }catch(e){ done([]); }
  }
  data.pages = PAGES.map(function(p){ var it = item(p.t, '', 'Page', p.u, false); it.xl = (p.k + ' page').toLowerCase(); return it; });   /* the keywords help the matching but are not shown */
  state.pages = 'ok';

  function tokens(q){ return q.toLowerCase().replace(/[^a-z0-9\u0900-\u097f\s]+/gi, ' ').split(/\s+/).filter(function(t){ return t.length >= 2; }).slice(0, 6); }
  function score(it, toks){
    var s = 0;
    for(var i = 0; i < toks.length; i++){ var a = it.tl.indexOf(toks[i]), b = it.xl.indexOf(toks[i]); if(a === -1 && b === -1) return 0; s += (a === 0 ? 5 : (a > 0 ? 3 : 0)) + (b !== -1 ? 1 : 0); }
    return s;
  }
  function search(list, toks){
    var out = []; (list || []).forEach(function(it, i){ var s = score(it, toks); if(s) out.push({ it: it, s: s, i: i }); });
    out.sort(function(a, b){ return b.s - a.s || a.i - b.i; }); return out.map(function(x){ return x.it; });
  }
  /* shows the text with the matching words marked (as real mark elements, never as HTML text) */
  function marked(parent, text, toks){
    if(window.HL_TR){ var z = null; try{ z = window.HL_TR(text); }catch(e){} if(z !== null && z !== undefined) text = z; }   /* Nepali: translate the WHOLE text first (a marked word would split it into pieces that cannot be translated) */
    var low = text.toLowerCase(), r = [];
    toks.forEach(function(t){ var p = 0, k; while((k = low.indexOf(t, p)) !== -1){ r.push([k, k + t.length]); p = k + t.length; } });
    r.sort(function(a, b){ return a[0] - b[0]; });
    var m = []; r.forEach(function(x){ var l = m[m.length - 1]; if(l && x[0] <= l[1]) l[1] = Math.max(l[1], x[1]); else m.push([x[0], x[1]]); });
    var pos = 0; m.forEach(function(x){ if(x[0] > pos) parent.appendChild(document.createTextNode(text.slice(pos, x[0]))); parent.appendChild(el('mark', null, text.slice(x[0], x[1]))); pos = x[1]; });
    if(pos < text.length) parent.appendChild(document.createTextNode(text.slice(pos)));
  }
  function snippet(it, toks){
    var t = it.text; if(!t) return '';
    if(t.length <= 170) return t;
    var low = t.toLowerCase(), at = -1; for(var i = 0; i < toks.length && at === -1; i++) at = low.indexOf(toks[i]);
    var s = Math.max(0, (at === -1 ? 0 : at) - 50); var out = t.slice(s, s + 170);
    return (s > 0 ? '…' : '') + out + (s + 170 < t.length ? '…' : '');
  }
  function row(it, toks){
    var li = el('li'), a = el('a'); a.href = it.url; if(it.ext){ a.target = '_blank'; a.rel = 'noopener noreferrer'; } marked(a, it.title, toks); li.appendChild(a);
    var sn = snippet(it, toks); if(sn && it.url !== 'index.html'){ var p = el('p'); marked(p, sn, toks); li.appendChild(p); }
    if(it.meta){ li.appendChild(el('span', 'smeta', it.meta)); }
    return li;
  }
  var totalNow = 0;
  function paint(){
    var toks = tokens(lastQ); clear(box); totalNow = 0; var loading = 0, failed = 0, shown = 0;
    if(!toks.length){ status.textContent = ''; return; }
    GROUPS.forEach(function(g){
      var st = state[g.id];
      if(st === 'loading'){ loading++; box.appendChild(el('p', 'sstate', 'Searching ' + g.label.toLowerCase() + '...')); return; }
      if(st === 'fail'){ failed++; var f = el('p', 'sstate', g.label + ' could not be loaded right now. '); var b = el('button', 'fchip', 'Try again'); b.type = 'button'; b.addEventListener('click', function(){ if(H.netFail) H.netFail[g.action] = false; state[g.id] = 'idle'; ensure(g); paint(); }); f.appendChild(b); box.appendChild(f); return; }
      var res = search(data[g.id], toks); if(!res.length) return;
      totalNow += res.length; shown++;
      var sec = el('div', 'sgrp'), h = el('h3', null, g.label); h.appendChild(el('span', 'n', res.length + (res.length === 1 ? ' result' : ' results'))); sec.appendChild(h);
      var ul = el('ul', 'slist'), lim = expanded[g.id] ? 40 : 6; res.slice(0, lim).forEach(function(it){ ul.appendChild(row(it, toks)); }); sec.appendChild(ul);
      if(res.length > lim){ var more = el('button', 'btn btn-ghost', 'Show all ' + Math.min(res.length, 40)); more.type = 'button'; more.style.marginTop = '12px'; more.addEventListener('click', function(){ expanded[g.id] = true; paint(); }); sec.appendChild(more); }
      box.appendChild(sec);
    });
    if(loading){ status.textContent = 'Searching...'; return; }
    if(totalNow === 0){
      var e = el('div', 'empty'); e.appendChild(document.createTextNode('No result for "' + lastQ + '". Try another word, '));
      var a1 = el('a', null, 'ask a question'); a1.href = 'contact.html'; e.appendChild(a1); e.appendChild(document.createTextNode(', or '));
      var a2 = el('a', null, 'look in the dictionary'); a2.href = 'dictionary.html'; e.appendChild(a2); e.appendChild(document.createTextNode('.')); box.appendChild(e);
      status.textContent = failed ? 'Nothing found. Some lists could not be loaded.' : 'No results.';
    } else { status.textContent = totalNow + (totalNow === 1 ? ' result' : ' results') + (failed ? '. Some lists could not be loaded.' : '.'); }
  }
  var timer = null;
  function run(q, now){
    q = txt(q, 80); lastQ = q; var toks = tokens(q);
    hint.hidden = toks.length > 0;
    try{ var url = location.pathname + (q ? '?q=' + encodeURIComponent(q) : ''); history.replaceState(null, '', url); }catch(e){}
    if(!toks.length){ clear(box); status.textContent = q ? 'Type at least 2 letters.' : ''; return; }
    GROUPS.forEach(ensure);   /* all the lists are asked for at the same time, once; they are remembered after that */
    paint();
  }
  input.addEventListener('input', function(){ clearTimeout(timer); timer = setTimeout(function(){ run(input.value); }, 180); });
  form.addEventListener('submit', function(e){ e.preventDefault(); clearTimeout(timer); run(input.value); });
  ['vacancy', 'syllabus', 'dictionary', 'holiday', 'calculator', 'notice'].forEach(function(w, i){ if(i) chips.appendChild(document.createTextNode(' ')); var b = el('button', 'fchip', w); b.type = 'button'; b.addEventListener('click', function(){ input.value = w; run(w); input.focus(); }); chips.appendChild(b); });
  var qs = ''; try{ qs = new URLSearchParams(location.search).get('q') || ''; }catch(e){}
  if(qs){ input.value = txt(qs, 80); run(input.value); }
})();
