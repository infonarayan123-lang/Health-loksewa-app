/* Health Loksewa website: shared script for every page. No libraries. Everything shown from your Google Sheet is drawn as plain text only. */
(function(){
  'use strict';
  /* ======= EASY SETTINGS: change these when you have your own domain ======= */
  var SITE = {
    mail:     'healthloksewa026@gmail.com',   /* used by "Found a mistake? Tell us" under the shared question; the Contact page uses App Settings */
    appUrl:   'https://infonarayan123-lang.github.io/Health-loksewa-app/',   /* where "Open the app" goes */
    legalUrl: 'https://infonarayan123-lang.github.io/Health-loksewa-app/',   /* where privacy.html, terms.html ... live */
    signIn:   true,                                                          /* true = every visitor sees "Sign in" in the menu (keep false until you have tested it; open the site once with ?signin=1 to test on your own phone) */
    lang:     true,   /* true = every visitor sees the English / नेपाली button (turn on after the Nepali has been checked) */
    apkUrl:   '',                                                            /* a direct link to the APK file, when you have one */
    playUrl:  '',                                                            /* your Google Play link, when you have one */
    api:      'https://script.google.com/macros/s/AKfycbzQOc8DqEOdd-X7OLEG5z4VRoWpVBOd_bHjYUk2tVngdp9LkFN_W3VqmHkKdfLfqifHOw/exec'
  };
  /* ======= nothing below needs editing ======= */
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var TONES = ['t1','t2','t3','t4','t5','t6'];
  function https(u){ u = String(u == null ? '' : u).trim(); return /^https:\/\/[^\s"'<>\\]{4,300}$/i.test(u) ? u : ''; }
  function email(e){ e = String(e == null ? '' : e).trim(); return /^[A-Za-z0-9._%+\-]{1,64}@[A-Za-z0-9.\-]{1,190}\.[A-Za-z]{2,}$/.test(e) ? e : ''; }
  function txt(v, max){ return (typeof v === 'string') ? v.replace(/\s+/g, ' ').trim().slice(0, max) : ''; }
  function all(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function clear(node){ while(node.firstChild) node.removeChild(node.firstChild); }
  function isoDate(d){ return (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) ? d : ''; }
  function niceDate(d){ d = isoDate(d); if(!d) return ''; var p = d.split('-'), m = +p[1]; return (m >= 1 && m <= 12) ? (+p[2]) + ' ' + MONTHS[m - 1] + ' ' + p[0] : ''; }
  /* ---------- loading data from the Google Sheet backend: fast and honest ----------
     1. The last good answer is remembered in this phone's browser (public data only: news, links, documents, packs, health days, holidays, FAQs, testimonials, company, settings).
     2. A page waits at most 2.5 seconds for the Sheet; if it is slower and a remembered answer exists, the remembered one is shown at once, and the new answer is saved for next time.
     3. If the Sheet does not answer, it is asked ONE more time at once (the first request often only wakes it up).
     4. If it still fails and nothing is remembered, the page says so clearly and offers "Try again" (it never says "coming soon" for a failure). ---------- */
  var netFail = Object.create(null);
  var CACHE_RE = /^(siteNews|siteLinks|siteDocuments|siteProducts|siteHealthDays|sitePublicHolidays|siteFaqs|siteTestimonials|sitePeople|siteCompany|appSettings)(&|$)/;
  function cacheGet(action){
    var m = CACHE_RE.exec(action); if(!m) return null;
    try{ var o = JSON.parse(localStorage.getItem('hl:c:' + action)), age = Date.now() - o.t, max = (m[1] === 'siteNews' ? 3 : 24) * 3600000; if(o && typeof o.t === 'number' && o.d && typeof o.d === 'object' && age >= 0 && age < max) return o; }catch(e){}
    return null;
  }
  function cachePut(action, d){
    if(!CACHE_RE.test(action) || !d || typeof d !== 'object' || d.error) return;
    try{ localStorage.setItem('hl:c:' + action, JSON.stringify({ t: Date.now(), d: d })); }catch(e){}
  }
  function fetchOnce(action, ms){
    return new Promise(function(resolve){
      try{
        var c = new AbortController(), t = setTimeout(function(){ c.abort(); }, ms);
        fetch(SITE.api + '?action=' + action, { signal: c.signal }).then(function(r){ return r.json(); }).then(function(d){ clearTimeout(t); resolve(d); }).catch(function(){ clearTimeout(t); resolve(null); });
      }catch(e){ resolve(null); }
    });
  }
  function getJSON(action, ms){
    var per = Math.min(ms || 7000, 9000), cached = cacheGet(action);
    return new Promise(function(resolve){
      var done = false, finish = function(d){ if(done) return; done = true; resolve(d); };
      fetchOnce(action, per).then(function(d){ return d || fetchOnce(action, per); }).then(function(d){
        if(d) cachePut(action, d); else if(!done) netFail[action] = true;
        finish(d);
      });
      if(cached) setTimeout(function(){ finish(cached.d); }, 2500);
    });
  }
  function failNote(box, actions){
    if(!box || !actions.some(function(a){ return netFail[a]; })) return false;
    clear(box); box.appendChild(el('b', 'neterr', 'We could not load this right now.'));
    box.appendChild(document.createTextNode('Please check your internet connection and try again.'));
    var b = el('button', 'btn btn-ghost', 'Try again'); b.type = 'button'; b.addEventListener('click', function(){ location.reload(); }); box.appendChild(document.createElement('br')); box.appendChild(b);
    return true;
  }
  function showNone(box, actions){ failNote(box, actions); if(box) box.hidden = false; }
  /* patient wording: after 4 seconds a "Loading..." line explains the first visit can be slow */
  setTimeout(function(){ all('.empty').forEach(function(n){ if(!n.hidden && /^Loading/.test(n.textContent) && n.textContent.indexOf('few seconds') === -1) n.textContent = n.textContent.replace(/\.*$/, '') + '... still loading. The first visit can take a few seconds.'; }); }, 4000);

  /* ---------- built-in official links (used until the Site Links tab has rows). Please check each one opens. ---------- */
  var DEFAULT_LINKS = [
    ['Loksewa Aayog','Public Service Commission (federal)','https://psc.gov.np','Notices, syllabus, annual calendar, forms and results for federal service exams.'],
    ['Loksewa Aayog','Koshi Province Public Service Commission','https://psc.p1.gov.np','Official site of the Koshi Province commission.'],
    ['Loksewa Aayog','Madhesh Province Public Service Commission','https://ppsc.p2.gov.np','Official site of the Madhesh Province commission.'],
    ['Loksewa Aayog','Bagmati Province Public Service Commission','https://spsc.bagamati.gov.np','Official site of the Bagmati Province commission.'],
    ['Loksewa Aayog','Gandaki Province Public Service Commission','https://ppsc.gandaki.gov.np','Official site of the Gandaki Province commission.'],
    ['Loksewa Aayog','Lumbini Province Public Service Commission','https://ppsc.p5.gov.np','Official site of the Lumbini Province commission.'],
    ['Loksewa Aayog','Karnali Province Public Service Commission','https://ppsc.karnali.gov.np','Official site of the Karnali Province commission.'],
    ['Loksewa Aayog','Sudurpashchim Province Public Service Commission','https://psc.sudurpashchim.gov.np','Official site of the Sudurpashchim Province commission.'],
    ['Other service commissions','Tribhuvan University Service Commission','https://tusc.tu.edu.np','Vacancies and notices for Tribhuvan University posts.'],
    ['Other service commissions','Teachers Service Commission','https://tsc.gov.np','Teacher recruitment notices.'],
    ['Health councils','Nepal Health Professional Council (NHPC)','https://nhpc.gov.np','Licensing for many health professions: syllabus, exam calendar, rules and notices.'],
    ['Health councils','Nepal Medical Council (NMC)','https://www.nmc.org.np','Registration and licensing of medical doctors.'],
    ['Health councils','Nepal Nursing Council (NNC)','https://nnc.org.np','Registration and licensing of nurses.'],
    ['Health councils','Nepal Pharmacy Council (NPC)','https://www.nepalpharmacycouncil.org.np','Registration and licensing of pharmacists.'],
    ['Health councils','Nepal Ayurveda Medical Council (NAMC)','https://namc.gov.np','Registration and licensing of Ayurveda practitioners.'],
    ['Ministry and health bodies','Ministry of Health and Population','https://mohp.gov.np','Policies, reports and notices from the ministry.'],
    ['Ministry and health bodies','Department of Health Services (DoHS)','https://dohs.gov.np','Programme information and annual reports.'],
    ['Ministry and health bodies','Epidemiology and Disease Control Division','https://edcd.gov.np','Disease surveillance and outbreak information.'],
    ['Ministry and health bodies','Family Welfare Division','https://fwd.gov.np','Family planning, maternal and child health programmes.'],
    ['Ministry and health bodies','Health Emergency Operation Centre','https://heoc.mohp.gov.np','Health emergency updates.'],
    ['Ministry and health bodies','National Health Education, Information and Communication Centre','https://nheicc.gov.np','Health education materials.'],
    ['Ministry and health bodies','Nepal Health Research Council','https://nhrc.gov.np','Health research and ethical review.'],
    ['Ministry and health bodies','Medical Education Commission','https://www.mec.gov.np','Medical education notices and entrance information.'],
    ['International agencies','World Health Organization (WHO)','https://www.who.int','Global health guidance and data.'],
    ['International agencies','WHO Nepal','https://www.who.int/nepal','WHO work in Nepal.'],
    ['International agencies','UNICEF Nepal','https://www.unicef.org/nepal','Child health and nutrition programmes.'],
    ['International agencies','UNFPA Nepal','https://nepal.unfpa.org/en','Reproductive health and population programmes.'],
    ['Universities','Tribhuvan University','https://tu.edu.np','Programmes, results and notices.'],
    ['Universities','Kathmandu University','https://www.ku.edu.np','Programmes and notices.'],
    ['Universities','Pokhara University','https://pu.edu.np','Programmes and notices.'],
    ['Universities','Purbanchal University','https://www.puexam.edu.np','Examination notices and results.'],
    ['Universities','CTEVT','https://ctevt.org.np','Technical and vocational education notices.'],
    ['Universities','University Grants Commission','https://ugcnepal.edu.np','Higher education policy and notices.'],
    ['Research and journals','PubMed','https://pubmed.ncbi.nlm.nih.gov','Free search of health research articles.'],
    ['Research and journals','Nepal Journals Online (NepJOL)','https://nepjol.info','Journals published in Nepal.'],
    ['Research and journals','Journal of Nepal Medical Association','https://jnma.com.np/jnma/index.php/jnma','Medical research from Nepal.'],
    ['Research and journals','Nepal Journal of Public Health','https://njph.com.np','Public health research from Nepal.'],
    ['Research and journals','Google Scholar','https://scholar.google.com','Search scholarly articles.']
  ].map(function(r){ return { category: r[0], title: r[1], link: r[2], note: r[3] }; });

  /* ---------- common parts of every page ---------- */
  /* every "open the app" link goes to the app; data-go (a short lowercase word from a fixed list inside the app) makes the app open at that screen */
  all('[data-app]').forEach(function(a){
    var u = https(SITE.appUrl); if(!u) return;
    var g = a.getAttribute('data-go'), ex = a.getAttribute('data-exam'), q = '';
    if(g && /^[a-z]{2,12}$/.test(g)){ q = '?go=' + g; if(g === 'exam' && ex && /^[a-z][a-z0-9_]{1,19}$/.test(ex)) q += '&exam=' + ex; }   /* exam = a plain exam key such as pho or ha_license */
    a.setAttribute('href', u + q);
  });
  all('[data-legal]').forEach(function(a){ var base = https(SITE.legalUrl); if(base) a.setAttribute('href', base + a.getAttribute('data-legal')); });
  var yr = document.getElementById('year'); if(yr) yr.textContent = String(new Date().getFullYear());

  function android(playUrl){
    var play = https(playUrl) || https(SITE.playUrl), apk = https(SITE.apkUrl);
    ['androidBtn', 'androidBtn2'].forEach(function(id){
      var b = document.getElementById(id); if(!b) return;
      if(play){ b.textContent = 'Get it on Google Play'; b.setAttribute('href', play); b.removeAttribute('aria-disabled'); b.setAttribute('target', '_blank'); b.setAttribute('rel', 'noopener noreferrer'); }
      else if(apk){ b.textContent = 'Download for Android'; b.setAttribute('href', apk); b.removeAttribute('aria-disabled'); }
    });
  }
  android('');

  function applySettings(s){
    if(!s || typeof s !== 'object' || Array.isArray(s)) return;
    all('[data-social]').forEach(function(a){
      var key = a.getAttribute('data-social');
      if(!Object.prototype.hasOwnProperty.call(s, key) || typeof s[key] !== 'string') return;
      var u = https(s[key]);
      if(u){ a.setAttribute('href', u); a.hidden = false; } else if(s[key].trim() === ''){ a.hidden = true; }
    });
    var ml = document.getElementById('mailLink');
    var m = (ml && Object.prototype.hasOwnProperty.call(s, 'contact_email')) ? email(s.contact_email) : '';
    if(m) ml.setAttribute('href', 'mailto:' + m);
    if(typeof s.play_store_url === 'string') android(s.play_store_url);
  }
  if(document.querySelector('[data-social],#mailLink,#androidBtn')) getJSON('appSettings').then(function(d){ if(d && d.settings) applySettings(d.settings); });

  var toggle = document.getElementById('navToggle'), menu = document.getElementById('menu');
  if(toggle && menu){
    var setMenu = function(open){ menu.classList.toggle('open', open); toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    toggle.addEventListener('click', function(){ setMenu(!menu.classList.contains('open')); });
    menu.addEventListener('click', function(e){ if(e.target && e.target.closest && e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && menu.classList.contains('open')){ setMenu(false); toggle.focus(); } });
  }

  /* gentle fade-in while scrolling. If anything goes wrong, everything is simply shown. */
  var items = all('.reveal');
  function showAll(){ items.forEach(function(x){ x.classList.add('in'); }); }
  if(items.length){
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){ entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      items.forEach(function(x){ io.observe(x); });
      setTimeout(showAll, 4000);
    } else { showAll(); }
  }

  /* ---------- news (your Site News tab) ---------- */
  var newsP = null;
  function getNews(){ if(!newsP) newsP = getJSON('siteNews'); return newsP; }
  function cleanNews(items){
    var out = [];
    (Array.isArray(items) ? items : []).slice(0, 60).forEach(function(it){
      if(!it || typeof it !== 'object') return;
      var title = txt(it.title, 140); if(!title || out.length >= 30) return;
      var cat = (it.category === 'Vacancy' || it.category === 'Notice' || it.category === 'Exam') ? it.category : 'News';
      out.push({ title: title, summary: txt(it.summary, 300), source: txt(it.source, 60), link: https(it.link), date: niceDate(it.date), iso: isoDate(it.date), category: cat, tag: stripTags(it.tag, 30), closing: isoDate(it.closing) });
    });
    return out;
  }
  var nowD0 = new Date(), TODAY_MS = Date.UTC(nowD0.getFullYear(), nowD0.getMonth(), nowD0.getDate());
  function closingDays(n){ if(!n.closing) return null; var p = n.closing.split('-'); return Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - TODAY_MS) / 86400000); }
  function closingInfo(n){
    var d = closingDays(n); if(d === null) return null;
    if(d < 0) return { text: 'Closed', cls: 'closed' };
    if(d === 0) return { text: 'Closes today', cls: 'soon' };
    if(d <= 7) return { text: 'Closing soon: ' + d + (d === 1 ? ' day' : ' days') + ' left', cls: 'soon' };
    return { text: 'Open until ' + niceDate(n.closing), cls: 'open' };
  }
  var CAT_TONE = { News: 't1', Vacancy: 't4', Notice: 't2', Exam: 't3' }, CAT_LABEL = { News: 'News', Vacancy: 'Vacancy', Notice: 'Notice', Exam: 'Exam calendar' };
  function newsCard(n, tone, showCat){
    var a = el('article', 'newscard ' + tone);
    if(n.date || showCat){
      var head = el('div'), t;
      if(n.date){ t = el('time', null, n.date); if(n.iso) t.setAttribute('datetime', n.iso); head.appendChild(t); }
      if(showCat){ head.appendChild(el('span', 'cat ' + CAT_TONE[n.category], CAT_LABEL[n.category])); }
      a.appendChild(head);
    }
    a.appendChild(el('h3', null, n.title));
    var ci = closingInfo(n);
    var fresh = isRecent(n.iso);
    if(n.tag || ci || fresh){ var pills = el('div', 'pills'); if(fresh) pills.appendChild(el('span', 'xpill newpill', 'New')); if(n.tag) pills.appendChild(el('span', 'xpill', n.tag)); if(ci) pills.appendChild(el('span', 'xpill cstate ' + ci.cls, ci.text)); a.appendChild(pills); }
    if(n.summary) a.appendChild(el('p', null, n.summary));
    if(n.source || n.link){
      var f = el('div', 'src');
      if(n.source) f.appendChild(document.createTextNode('Source: ' + n.source));
      if(n.link){ if(n.source) f.appendChild(document.createTextNode(' \u00b7 ')); var l = el('a', 'read', 'Read the official source'); l.href = n.link; l.target = '_blank'; l.rel = 'noopener noreferrer'; f.appendChild(l); }
      a.appendChild(f);
    }
    return a;
  }
  var homeNews = document.getElementById('newsList');
  if(homeNews){
    getNews().then(function(d){
      var clean = cleanNews(d && d.items); if(!clean.length) return;
      var more = document.getElementById('newsMore'), SHOW = 6;
      clear(homeNews);
      clean.forEach(function(n, i){ var c = newsCard(n, TONES[i % TONES.length], false); if(i >= SHOW) c.hidden = true; homeNews.appendChild(c); });
      if(clean.length > SHOW){ more.hidden = false; more.onclick = function(){ all('.newscard', homeNews).forEach(function(c){ c.hidden = false; }); more.hidden = true; }; } else { more.hidden = true; }
      document.getElementById('news').hidden = false;
    });
  }
  var hlBar = document.getElementById('highlights');
  if(hlBar){
    getNews().then(function(d){
      var list = (d && Array.isArray(d.highlights)) ? d.highlights.slice(0, 3) : [], ul = document.getElementById('highlightList'), n = 0;
      clear(ul);
      list.forEach(function(h){
        if(!h || typeof h !== 'object') return; var text = stripTags(h.text, 120); if(!text) return;
        var li = el('li'), u = https(h.link);
        if(u){ var a = el('a', null, text); a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer'; li.appendChild(a); } else { li.appendChild(el('span', null, text)); }
        ul.appendChild(li); n++;
      });
      if(n) hlBar.hidden = false;
    });
  }
  var newsPage = document.getElementById('newsPage');
  if(newsPage){
    var nList = document.getElementById('newsPageList'), nMore = document.getElementById('newsPageMore'), nEmpty = document.getElementById('newsEmpty'), nSearch = document.getElementById('newsSearch');
    var state = { all: [], cat: 'All', q: '', shown: 12, tag: 'All', hide: false };
    var draw = function(){
      var q = state.q.toLowerCase();
      var list = state.all.filter(function(n){ return (state.cat === 'All' || n.category === state.cat) && (state.tag === 'All' || n.tag === state.tag) && (!state.hide || closingDays(n) === null || closingDays(n) >= 0) && (!q || (n.title + ' ' + n.summary + ' ' + n.source + ' ' + n.tag).toLowerCase().indexOf(q) !== -1); });
      clear(nList);
      list.slice(0, state.shown).forEach(function(n, i){ nList.appendChild(newsCard(n, CAT_TONE[n.category] || TONES[i % TONES.length], true)); });
      nMore.hidden = list.length <= state.shown;
      nEmpty.hidden = list.length > 0; if(!nEmpty.hidden && !state.all.length) failNote(nEmpty, ['siteNews']);
      document.getElementById('newsCount').textContent = list.length ? (list.length + (list.length === 1 ? ' item' : ' items')) : '';
    };
    all('.fchip', newsPage).forEach(function(b){ b.addEventListener('click', function(){ state.cat = b.getAttribute('data-cat'); state.shown = 12; all('.fchip', newsPage).forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); draw(); }); });
    nSearch.addEventListener('input', function(){ state.q = nSearch.value.slice(0, 80); state.shown = 12; draw(); });
    nMore.addEventListener('click', function(){ state.shown += 12; draw(); });
    getNews().then(function(d){
      state.all = cleanNews(d && d.items); document.getElementById('newsLoading').hidden = true;
      var box = document.getElementById('newsTags'), tags = [], seen = Object.create(null), anyClosing = false;
      state.all.forEach(function(n){ if(n.tag && !(n.tag in seen) && tags.length < 12){ seen[n.tag] = 1; tags.push(n.tag); } if(n.closing) anyClosing = true; });
      if(box && (tags.length || anyClosing)){
        if(anyClosing){ var hb = el('button', 'fchip', 'Hide closed'); hb.type = 'button'; hb.setAttribute('aria-pressed', 'false'); hb.addEventListener('click', function(){ state.hide = !state.hide; state.shown = 12; hb.setAttribute('aria-pressed', state.hide ? 'true' : 'false'); draw(); }); box.appendChild(hb); }
        if(tags.length){
          ['All'].concat(tags).forEach(function(tg){
            var b = el('button', 'fchip tagchip', tg === 'All' ? 'All tags' : tg); b.type = 'button'; b.setAttribute('data-tag', tg); b.setAttribute('aria-pressed', state.tag === tg ? 'true' : 'false');
            b.addEventListener('click', function(){ state.tag = tg; state.shown = 12; all('.tagchip', box).forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); draw(); });
            box.appendChild(b);
          });
        }
        box.hidden = false;
      }
      draw();
    });
  }

  /* ---------- links directory (your Site Links tab, or the built-in list) ---------- */
  var linksP = null;
  function cleanLinks(list){
    var out = [], cats = {}, nCats = 0;
    (Array.isArray(list) ? list : []).slice(0, 300).forEach(function(it){
      if(!it || typeof it !== 'object') return;
      var title = txt(it.title, 100), link = https(it.link); if(!title || !link) return;
      var cat = txt(it.category, 40) || 'Links', key = cat.toLowerCase();
      if(!Object.prototype.hasOwnProperty.call(cats, key)){ if(nCats >= 40) return; cats[key] = nCats++; }
      out.push({ category: cat, title: title, link: link, note: txt(it.note, 160) });
    });
    return out;
  }
  function getLinks(){
    if(!linksP) linksP = getJSON('siteLinks').then(function(d){ var c = cleanLinks(d && d.links); return c.length ? c : DEFAULT_LINKS.slice(); });
    return linksP;
  }
  function groupBy(list){
    var groups = [], idx = {};
    list.forEach(function(l){ var k = l.category.toLowerCase(); if(!Object.prototype.hasOwnProperty.call(idx, k)){ idx[k] = groups.length; groups.push({ name: l.category, items: [] }); } groups[idx[k]].items.push(l); });
    return groups;
  }
  function linkCard(l, tone){
    var a = el('a', 'linkcard ' + tone); a.href = l.link; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.appendChild(el('b', null, l.title));
    if(l.note) a.appendChild(el('span', 'note', l.note));
    a.appendChild(el('span', 'go', 'Visit the official site \u2192'));
    return a;
  }
  function drawGroups(container, list, headingTag){
    clear(container);
    groupBy(list).forEach(function(g, gi){
      var sec = el('div', 'linkgroup');
      sec.appendChild(el(headingTag, null, g.name));
      sec.appendChild(el('p', 'count', g.items.length + (g.items.length === 1 ? ' link' : ' links')));
      var grid = el('div', 'linkgrid');
      g.items.forEach(function(l, i){ grid.appendChild(linkCard(l, TONES[(gi + i) % TONES.length])); });
      sec.appendChild(grid); container.appendChild(sec);
    });
  }
  all('.linksection').forEach(function(box){
    var wanted = (box.getAttribute('data-cats') || '').toLowerCase().split('|').filter(Boolean);
    var inGroup = function(l){ return wanted.indexOf(l.category.toLowerCase()) !== -1; };
    getLinks().then(function(list){ var pick = list.filter(inGroup); if(!pick.length) pick = DEFAULT_LINKS.filter(inGroup); if(pick.length) drawGroups(box, pick, 'h3'); });   /* your tab has none for this page: the built-in ones are used */
  });
  var resPage = document.getElementById('linksPage');
  if(resPage){
    var rBox = document.getElementById('linksBox'), rSearch = document.getElementById('linksSearch'), rEmpty = document.getElementById('linksEmpty'), rAll = [];
    var rDraw = function(){
      var q = rSearch.value.slice(0, 80).toLowerCase();
      var list = rAll.filter(function(l){ return !q || (l.title + ' ' + l.note + ' ' + l.category).toLowerCase().indexOf(q) !== -1; });
      drawGroups(rBox, list, 'h2'); rEmpty.hidden = list.length > 0;
    };
    rSearch.addEventListener('input', rDraw);
    getLinks().then(function(list){ rAll = list; document.getElementById('linksLoading').hidden = true; rDraw(); });
  }

  /* ---------- tools: BMI and due date ---------- */
  var bmiForm = document.getElementById('bmiForm');
  if(bmiForm){
    bmiForm.addEventListener('submit', function(e){
      e.preventDefault();
      var kg = parseFloat(document.getElementById('bmiKg').value), cm = parseFloat(document.getElementById('bmiCm').value), out = document.getElementById('bmiOut');
      clear(out); out.classList.remove('err');
      if(!isFinite(kg) || kg < 2 || kg > 500 || !isFinite(cm) || cm < 50 || cm > 260){ out.classList.add('err'); out.textContent = 'Please enter your weight in kg (2 to 500) and your height in cm (50 to 260).'; return; }
      var m = cm / 100, bmi = kg / (m * m), r = Math.round(bmi * 10) / 10;
      var cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : 'Obese';
      var b = el('b', null, 'BMI ' + r.toFixed(1) + ': ' + cat); out.appendChild(b);
      var lo = (18.5 * m * m).toFixed(1), hi = (24.9 * m * m).toFixed(1);
      out.appendChild(el('span', 'small', 'A BMI of 18.5 to 24.9 is the usual healthy range. For your height that is about ' + lo + ' to ' + hi + ' kg.'));
      if(bmi >= 23) out.appendChild(el('span', 'small', 'For South Asian adults, health risks can start from a BMI of about 23. Talk to a health worker about what is right for you.'));
    });
  }
  var eddForm = document.getElementById('eddForm');
  if(eddForm){
    eddForm.addEventListener('submit', function(e){
      e.preventDefault();
      var v = document.getElementById('eddLmp').value, out = document.getElementById('eddOut'); clear(out); out.classList.remove('err');
      var mm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
      if(!mm){ out.classList.add('err'); out.textContent = 'Please choose the first day of the last menstrual period.'; return; }
      var lmp = Date.UTC(+mm[1], +mm[2] - 1, +mm[3]), now = new Date(), today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()), DAY = 86400000;
      if(lmp > today){ out.classList.add('err'); out.textContent = 'That date is in the future. Please check it.'; return; }
      if(today - lmp > 300 * DAY){ out.classList.add('err'); out.textContent = 'That date is more than 300 days ago. Please check it.'; return; }
      var edd = new Date(lmp + 280 * DAY), days = Math.floor((today - lmp) / DAY), w = Math.floor(days / 7), d = days % 7;
      var edText = edd.getUTCDate() + ' ' + MONTHS[edd.getUTCMonth()] + ' ' + edd.getUTCFullYear();
      out.appendChild(el('b', null, 'Estimated due date: ' + edText));
      out.appendChild(el('span', 'small', 'Today she is about ' + w + ' weeks and ' + d + ' days pregnant.'));
      out.appendChild(el('span', 'small', 'This counts 280 days from the first day of the last period and assumes a regular 28-day cycle. A health worker can confirm the date, for example with an ultrasound.'));
    });
  }


  /* ---------- documents library (the "Site Documents" tab): Library page, Loksewa and Licence hubs, Latest updates on Home ---------- */
  function cleanDocs(list){
    var out = [];
    (Array.isArray(list) ? list : []).slice(0, 1000).forEach(function(it){
      if(out.length >= 800 || !it || typeof it !== 'object') return;
      var title = txt(it.title, 160), link = https(it.link); if(!title || !link) return;
      out.push({ title: title, link: link, section: txt(it.section, 40) || 'Library', group: txt(it.group, 60), subgroup: txt(it.subgroup, 60), date: isoDate(it.date), note: txt(it.note, 200) });
    });
    return out;
  }
  var docsP = null;
  function getDocs(){ if(!docsP) docsP = getJSON('siteDocuments', 8000).then(function(d){ return cleanDocs(d && d.docs); }); return docsP; }
  function docRow(d, showWhere){
    var li = el('li', 'docitem'), a = el('a', 'dtitle', d.title); a.href = d.link; a.target = '_blank'; a.rel = 'noopener noreferrer'; li.appendChild(a);
    if(isRecent(d.date)) li.appendChild(el('span', 'xpill newpill', 'New'));
    var bits = [];
    if(showWhere){ var where = [d.section, d.group, d.subgroup].filter(Boolean).join(' \u203A '); if(where) bits.push(where); }
    var nd = niceDate(d.date); if(nd) bits.push(nd);
    if(bits.length) li.appendChild(el('span', 'dmeta', bits.join(' \u00B7 ')));
    if(d.note) li.appendChild(el('span', 'dnote', d.note));
    return li;
  }
  var libList = document.getElementById('libList');
  if(libList){
    var libState = { q: '', sec: 'All', letter: 'All', shown: 30 }, libAll = [];
    var libCount = document.getElementById('libCount'), libMore = document.getElementById('libMore'), libEmpty = document.getElementById('libEmpty'), libNone = document.getElementById('libNone'), libLoading = document.getElementById('libLoading'), libTools = document.getElementById('libTools'), libSecs = document.getElementById('libSections'), libAz = document.getElementById('libAz'), libSearch = document.getElementById('libSearch');
    var firstLetter = function(t){ var c = t.charAt(0).toUpperCase(); return /[A-Z]/.test(c) ? c : '#'; };
    var libFiltered = function(){
      var q = libState.q.toLowerCase();
      return libAll.filter(function(d){ return (libState.sec === 'All' || d.section === libState.sec) && (libState.letter === 'All' || firstLetter(d.title) === libState.letter) && (!q || (d.title + ' ' + d.section + ' ' + d.group + ' ' + d.subgroup + ' ' + d.note).toLowerCase().indexOf(q) !== -1); });
    };
    var libDraw = function(){
      var list = libFiltered(); clear(libList);
      list.slice(0, libState.shown).forEach(function(d){ libList.appendChild(docRow(d, true)); });
      libCount.textContent = list.length ? 'Showing ' + Math.min(list.length, libState.shown) + ' of ' + list.length + (list.length === 1 ? ' document' : ' documents') : '';
      libEmpty.hidden = list.length > 0; libMore.hidden = list.length <= libState.shown;
    };
    var chipRow = function(box, values, key){
      clear(box);
      values.forEach(function(v){
        var b = el('button', 'fchip', v); b.type = 'button'; b.setAttribute('aria-pressed', libState[key] === v ? 'true' : 'false');
        if(key === 'letter' && v !== 'All') b.setAttribute('aria-label', v === '#' ? 'Titles that do not start with A to Z' : 'Titles starting with ' + v);
        b.addEventListener('click', function(){ libState[key] = v; libState.shown = 30; all('button', box).forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); libDraw(); });
        box.appendChild(b);
      });
    };
    libSearch.addEventListener('input', function(){ libState.q = txt(libSearch.value, 80); libState.shown = 30; libDraw(); });
    libMore.addEventListener('click', function(){ libState.shown += 30; libDraw(); });
    getDocs().then(function(docs){
      libAll = docs; libLoading.hidden = true;
      if(!docs.length){ showNone(libNone, ['siteDocuments']); return; }
      var secs = [], seen = Object.create(null), letters = [], lseen = Object.create(null);
      docs.forEach(function(d){ if(!(d.section in seen)){ seen[d.section] = 1; secs.push(d.section); } var l = firstLetter(d.title); if(!(l in lseen)){ lseen[l] = 1; letters.push(l); } });
      letters.sort(function(a, b){ return a === '#' ? 1 : b === '#' ? -1 : (a < b ? -1 : 1); });
      if(secs.length > 1) chipRow(libSecs, ['All'].concat(secs), 'sec'); else libSecs.hidden = true;
      chipRow(libAz, ['All'].concat(letters), 'letter');
      libTools.hidden = false; libDraw();
    });
  }
  var hubSec = document.getElementById('docHubSec');
  if(hubSec){
    var wanted = (hubSec.getAttribute('data-hub') || '').toLowerCase().split('|').filter(Boolean);
    getDocs().then(function(docs){
      var list = docs.filter(function(d){ return wanted.indexOf(d.section.toLowerCase()) !== -1; });
      if(!list.length) return;
      var box = document.getElementById('docHub'); clear(box);
      wanted.forEach(function(w){
        var inSec = list.filter(function(d){ return d.section.toLowerCase() === w; }); if(!inSec.length) return;
        var sec = el('div', 'dsection'); sec.appendChild(el('h3', null, inSec[0].section));
        var groups = [], gi = Object.create(null);
        inSec.forEach(function(d){ var gname = d.group || 'General', k = gname.toLowerCase(); if(!(k in gi)){ gi[k] = groups.length; groups.push({ name: gname, items: [] }); } groups[gi[k]].items.push(d); });
        groups.forEach(function(g){
          var det = el('details', 'dgroup'); if(groups.length === 1) det.open = true;
          var sum = el('summary'); sum.appendChild(el('span', 'gname', g.name)); sum.appendChild(el('span', 'gcount', g.items.length + (g.items.length === 1 ? ' document' : ' documents'))); det.appendChild(sum);
          var body = el('div', 'dbody'), subs = [], si = Object.create(null);
          g.items.forEach(function(d){ var k = d.subgroup.toLowerCase(); if(!(k in si)){ si[k] = subs.length; subs.push({ name: d.subgroup, items: [] }); } subs[si[k]].items.push(d); });
          subs.forEach(function(s){ if(s.name) body.appendChild(el('h4', null, s.name)); var ul = el('ul', 'doclist'); s.items.forEach(function(d){ ul.appendChild(docRow(d, false)); }); body.appendChild(ul); });
          det.appendChild(body); sec.appendChild(det);
        });
        box.appendChild(sec);
      });
      hubSec.hidden = false;
    });
  }
  var latestSec = document.getElementById('latest');
  if(latestSec){
    getJSON('siteDocuments&latest=6').then(function(d){
      var list = cleanDocs(d && d.docs).filter(function(x){ return x.date; }).slice(0, 6); if(!list.length) return;
      var ul = document.getElementById('latestList'); clear(ul); list.forEach(function(x){ ul.appendChild(docRow(x, true)); }); latestSec.hidden = false;
    });
  }


  /* ---------- study helpers: question of the day, dictionary, health days, public holidays ---------- */
  function stripTags(v, max){ return txt(String(v == null ? '' : v).replace(/<[^>]*>/g, ' ').replace(/[<>]/g, ''), max); }
  var HD_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var hop = Object.prototype.hasOwnProperty;
  /* question of the day: the same public question the app shows (?action=questionOfDay). Only the fields we know are used, as plain text. */
  function cleanQotd(d){
    if(!d || typeof d !== 'object') return null;
    var q = stripTags(d.Question, 500), opts = ['A', 'B', 'C', 'D'].map(function(l){ return stripTags(d['Option' + l], 250); });
    var ans = String(d.CorrectAnswer == null ? '' : d.CorrectAnswer).trim().toUpperCase(), at = 'ABCD'.indexOf(ans);
    if(!q || ans.length !== 1 || at === -1 || !opts[at] || opts.filter(Boolean).length < 2) return null;
    return { q: q, opts: opts, ans: ans, expl: stripTags(d.Explanation, 700), subject: stripTags(d.Subject, 80) };
  }
  var qotdP = null;
  function getQotd(){ if(!qotdP) qotdP = getJSON('questionOfDay', 9000).then(cleanQotd); return qotdP; }
  /* ---------- sharing the question of the day (text links, the phone's share sheet, copy, and a picture card) ----------
     Nothing is sent anywhere until the visitor taps a button; the answer is never included. */
  function qShareUrl(){ try{ return new URL('question-of-the-day.html', location.href).href; }catch(e){ return location.href.split('#')[0]; } }
  function qShareBody(q){
    var L = ['Question of the day | Health Loksewa', '', q.q, ''];
    ['A', 'B', 'C', 'D'].forEach(function(l, i){ if(q.opts[i]) L.push(l + '. ' + q.opts[i]); });
    return L.join('\n');
  }
  function qShareFull(q, url){ return qShareBody(q) + '\n\nDo you know the answer? Try it here: ' + url; }
  function qShortText(q){ var s = 'Question of the day: ' + q.q; return s.length > 200 ? s.slice(0, 197).replace(/\s+\S*$/, '') + '...' : s; }
  /* the picture cards live in qcard.js, which is loaded only when a visitor taps a picture button */
  var cardP = null;
  function qLoadCard(){
    if(window.HLCard) return Promise.resolve(window.HLCard);
    if(!cardP) cardP = new Promise(function(res, rej){
      var sc = document.createElement('script'); sc.src = 'qcard.js';
      sc.onload = function(){ if(window.HLCard) res(window.HLCard); else { cardP = null; rej(new Error('card')); } };
      sc.onerror = function(){ cardP = null; rej(new Error('card')); };
      document.head.appendChild(sc);
    });
    return cardP;
  }
  function qNepalDay(){ return new Date(Date.now() + 20700000).toISOString().slice(0, 10); }
  function qToBlob(cv, cb){
    try{ if(cv.toBlob){ cv.toBlob(function(b){ cb(b); }, 'image/jpeg', 0.92); return; } }catch(e){}
    try{
      var u = cv.toDataURL('image/jpeg', 0.92), bin = atob(u.split(',')[1]), arr = new Uint8Array(bin.length); for(var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      cb(new Blob([arr], { type: 'image/jpeg' }));
    }catch(e){ cb(null); }
  }
  function qSave(blob, name){
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.style.display = 'none'; document.body.appendChild(a); a.click();
    setTimeout(function(){ try{ URL.revokeObjectURL(a.href); }catch(e){} if(a.parentNode) a.parentNode.removeChild(a); }, 1500);
  }
  /* one picture: kind 'question' or 'answer', format 'square' (posts) or 'story' (status, stories) */
  function qPicture(q, opt, say){
    var fail = 'Could not make the picture. Please check your internet connection and try again.';
    say('Making the picture...');
    qLoadCard().then(function(C){
      var cv; try{ cv = C.make(q, opt); }catch(e){ say(fail); return; }
      qToBlob(cv, function(blob){
        if(!blob){ say(fail); return; }
        var name = 'question-of-the-day-' + qNepalDay() + (opt.kind === 'answer' ? '-answer' : (opt.format === 'story' ? '-story' : '')) + '.jpg', file = null;
        try{ file = new File([blob], name, { type: 'image/jpeg' }); }catch(e){}
        if(file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] })){
          navigator.share({ files: [file], title: 'Question of the day', text: 'Question of the day | Health Loksewa' }).then(function(){ say(''); }, function(err){ if(err && err.name === 'AbortError') say(''); else { qSave(blob, name); say('The picture was saved. Now post it anywhere.'); } });
        } else { qSave(blob, name); say('The picture was saved to your device. Now post it anywhere.'); }
      });
    }, function(){ say(fail); });
  }
  function qCopy(text, done){
    var fallback = function(){
      try{ var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); var ok = document.execCommand && document.execCommand('copy'); document.body.removeChild(t); done(!!ok); }catch(e){ done(false); }
    };
    try{ if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(function(){ done(true); }, fallback); return; } }catch(e){}
    fallback();
  }
  /* the address for mistake reports: the Contact address from App Settings when this page shows it, otherwise the built-in one */
  function qMistakeMail(){ var ml = document.getElementById('mailLink'), m = ml ? email(String(ml.getAttribute('href') || '').replace(/^mailto:/i, '')) : ''; return m || email(SITE.mail); }
  function buildShare(q){
    var url = qShareUrl(), full = qShareFull(q, url), box = el('div', 'sharebox'), row = el('div', 'sharerow'), msg = el('p', 'sharemsg');
    msg.setAttribute('aria-live', 'polite');
    box.appendChild(el('p', 'sharetitle', 'Share this question'));
    var say = function(t){ msg.textContent = t; };
    if(navigator.share){
      var nb = el('button', 'btn btn-primary', 'Share'); nb.type = 'button'; nb.id = 'shNative';
      nb.addEventListener('click', function(){ try{ navigator.share({ title: 'Question of the day', text: qShareBody(q), url: url }).catch(function(){}); }catch(e){} });
      row.appendChild(nb);
    }
    [['WhatsApp', 'https://wa.me/?text=' + encodeURIComponent(full)],
     ['Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url)],
     ['Telegram', 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(qShareBody(q))],
     ['X', 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(qShortText(q)) + '&url=' + encodeURIComponent(url)],
     ['Email', 'mailto:?subject=' + encodeURIComponent('Question of the day | Health Loksewa') + '&body=' + encodeURIComponent(full)]
    ].forEach(function(p){
      var a = el('a', 'btn btn-ghost', p[0]); a.href = p[1]; a.setAttribute('data-share', p[0].toLowerCase());
      if(p[0] !== 'Email'){ a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', 'Share on ' + p[0] + ' (opens in a new tab)'); }
      row.appendChild(a);
    });
    var cp = el('button', 'btn btn-ghost', 'Copy text'); cp.type = 'button'; cp.id = 'shCopy';
    cp.addEventListener('click', function(){ qCopy(full, function(ok){ say(ok ? 'Copied. Now paste it anywhere.' : 'Could not copy on this device. Please use another button.'); }); });
    row.appendChild(cp);
    var pb = el('button', 'btn btn-ghost', 'Share as picture'); pb.type = 'button'; pb.id = 'shPic';
    pb.addEventListener('click', function(){ qPicture(q, { kind: 'question', format: 'square' }, say); });
    var sb = el('button', 'btn btn-ghost', 'Story picture'); sb.type = 'button'; sb.id = 'shStory';
    sb.addEventListener('click', function(){ qPicture(q, { kind: 'question', format: 'story' }, say); });
    var ab = el('button', 'btn btn-ghost', 'Answer picture'); ab.type = 'button'; ab.id = 'shAns'; ab.hidden = true;
    ab.addEventListener('click', function(){ qPicture(q, { kind: 'answer', format: 'square' }, say); });
    row.appendChild(pb); row.appendChild(sb); row.appendChild(ab); box.appendChild(row); box.appendChild(msg);
    box.appendChild(el('p', 'sharenote', 'Picture sizes: "Share as picture" is square (Facebook and Instagram posts). "Story picture" is tall (WhatsApp status, TikTok, Instagram stories). "Answer picture" appears after you answer, to post the next day.'));
    box.appendChild(el('p', 'sharenote', 'Tip: on Facebook, Instagram and TikTok the picture works best.'));
    var mp = el('p', 'sharenote'); mp.appendChild(document.createTextNode('Found a mistake in this question? '));
    var ma = el('a', 'sharemistake', 'Tell us'); ma.href = 'mailto:' + qMistakeMail() + '?subject=' + encodeURIComponent('Mistake in a question | Health Loksewa') + '&body=' + encodeURIComponent(qShareBody(q) + '\n\nWhat is wrong:\n');
    ma.addEventListener('click', function(){ ma.href = 'mailto:' + qMistakeMail() + '?subject=' + encodeURIComponent('Mistake in a question | Health Loksewa') + '&body=' + encodeURIComponent(qShareBody(q) + '\n\nWhat is wrong:\n'); });
    mp.appendChild(ma); box.appendChild(mp);
    return box;
  }

  function drawQotd(box, q){
    clear(box);
    if(q.subject) box.appendChild(el('p', 'qsubject', q.subject));
    box.appendChild(el('p', 'qtext', q.q));
    var list = el('div', 'qopts'), res = el('div', 'qresult'), btns = [];
    res.setAttribute('aria-live', 'polite');
    ['A', 'B', 'C', 'D'].forEach(function(l, i){
      if(!q.opts[i]) return;
      var b = el('button', 'qopt'); b.type = 'button'; b.setAttribute('data-letter', l);
      b.appendChild(el('b', null, l + '.')); b.appendChild(document.createTextNode(' ' + q.opts[i]));
      b.addEventListener('click', function(){
        btns.forEach(function(x){
          x.disabled = true;
          if(x.getAttribute('data-letter') === q.ans){ x.classList.add('right'); x.appendChild(el('span', 'mark', 'Correct answer')); }
        });
        if(l !== q.ans){ b.classList.add('wrong'); b.appendChild(el('span', 'mark', 'Your answer')); }
        clear(res); res.className = 'qresult ' + (l === q.ans ? 'ok' : 'no');
        res.appendChild(el('b', null, l === q.ans ? 'Correct!' : 'Not quite. The correct answer is ' + q.ans + '.'));
        if(q.expl) res.appendChild(el('span', 'qexpl', q.expl));
        res.appendChild(el('span', 'qmore', 'Want more? Practise MCQs by subject in the app.'));
        var sa = box.querySelector('#shAns'); if(sa) sa.hidden = false;
      });
      btns.push(b); list.appendChild(b);
    });
    box.appendChild(list); box.appendChild(res);
    box.appendChild(buildShare(q));
  }
  all('[data-qotd]').forEach(function(box){
    var sec = box.closest ? box.closest('section') : null, started = false;
    var go = function(){
      if(started) return; started = true;
      getQotd().then(function(q){
        if(!q){ var none = box.getAttribute('data-none'); if(none){ clear(box); box.appendChild(el('p', 'empty', none)); } return; }
        drawQotd(box, q); if(sec) sec.hidden = false;
      });
    };
    /* On the Home page the question is fetched only when the visitor scrolls near it (one request fewer for everyone who just glances and leaves; it also appears BELOW the screen, so nothing jumps). On its own page it loads at once. */
    var anchor = document.getElementById(box.getAttribute('data-lazy-after') || '');
    if(!anchor) go();
    else if('IntersectionObserver' in window){ var io = new IntersectionObserver(function(es){ if(es.some(function(e){ return e.isIntersecting; })){ io.disconnect(); go(); } }, { rootMargin: '0px 0px 400px 0px' }); io.observe(anchor); }
    else window.addEventListener('scroll', go, { once: true, passive: true });
  });
  /* dictionary: the app's Dictionary tab, served in small pages (?letter= or ?q=), so the whole dictionary is never downloaded */
  var dictList = document.getElementById('dictList');
  if(dictList){
    var dS = { q: '', letter: 'A', offset: 0, req: 0, built: false, first: true };
    var dLoading = document.getElementById('dictLoading'), dTools = document.getElementById('dictTools'), dCount = document.getElementById('dictCount'), dMore = document.getElementById('dictMore'), dEmpty = document.getElementById('dictEmpty'), dError = document.getElementById('dictError'), dNone = document.getElementById('dictNone'), dAz = document.getElementById('dictAz'), dSearch = document.getElementById('dictSearch');
    var dClean = function(arr){ return (Array.isArray(arr) ? arr : []).slice(0, 100).map(function(t){ return t && typeof t === 'object' ? { term: stripTags(t.term, 80), definition: stripTags(t.definition, 600) } : null; }).filter(function(t){ return t && t.term; }); };
    var dBuildBar = function(counts){
      dS.built = true; clear(dAz);
      ['All'].concat('ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')).forEach(function(l){
        if(l === 'All') return;
        var n = (counts && hop.call(counts, l) && typeof counts[l] === 'number') ? counts[l] : 0;
        var b = el('button', 'fchip', l); b.type = 'button'; b.setAttribute('data-letter', l); b.setAttribute('aria-pressed', l === dS.letter && !dS.q ? 'true' : 'false');
        b.setAttribute('aria-label', (l === '#' ? 'Terms that do not start with A to Z' : 'Terms starting with ' + l) + ', ' + n);
        if(!n){ b.disabled = true; }
        b.addEventListener('click', function(){ dS.letter = l; dS.q = ''; dSearch.value = ''; all('button', dAz).forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); dLoad(false); });
        dAz.appendChild(b);
      });
    };
    var dLoad = function(append){
      var id = ++dS.req, off = append ? dS.offset + 25 : 0;
      var url = 'siteDictionary&offset=' + off + '&limit=25' + (dS.q ? '&q=' + encodeURIComponent(dS.q) : '&letter=' + encodeURIComponent(dS.letter));
      return getJSON(url, 9000).then(function(d){
        if(id !== dS.req) return;                                    /* an older answer that arrived late: ignore it */
        dLoading.hidden = true;
        if(!d || typeof d.total !== 'number' || !isFinite(d.total)){ if(!append) clear(dictList); dCount.textContent = ''; dMore.hidden = true; dEmpty.hidden = true; dError.hidden = false; if(dS.first) dTools.hidden = true; return; }
        dError.hidden = true;
        var counts = (d.letters && typeof d.letters === 'object') ? d.letters : {}, sum = 0;
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('').forEach(function(l){ if(hop.call(counts, l) && typeof counts[l] === 'number') sum += counts[l]; });
        if(dS.first && !dS.q){
          dS.first = false;
          if(!sum){ dTools.hidden = true; dNone.hidden = false; clear(dictList); return; }
          if(!d.total){ var firstL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('').filter(function(l){ return hop.call(counts, l) && counts[l] > 0; })[0]; if(firstL && firstL !== dS.letter){ dS.letter = firstL; dBuildBar(counts); return dLoad(false); } }
        }
        dS.first = false;
        if(!dS.built) dBuildBar(counts);
        dTools.hidden = false;
        if(!append) clear(dictList);
        dClean(d.terms).forEach(function(t){ var li = el('li', 'dictitem'); li.appendChild(el('b', 'dterm', t.term)); if(t.definition) li.appendChild(el('span', 'ddef', t.definition)); dictList.appendChild(li); });
        dS.offset = off;
        dEmpty.hidden = d.total > 0; dMore.hidden = off + 25 >= d.total;
        dCount.textContent = d.total ? (d.total + (d.total === 1 ? ' term' : ' terms') + (dS.q ? ' for "' + dS.q + '"' : ' under ' + dS.letter)) : '';
      });
    };
    var dTimer = null;
    dSearch.addEventListener('input', function(){
      clearTimeout(dTimer);
      dTimer = setTimeout(function(){
        var v = txt(dSearch.value, 40);
        if(v.length >= 2){ dS.q = v; all('button', dAz).forEach(function(x){ x.setAttribute('aria-pressed', 'false'); }); dLoad(false); }
        else if(v.length === 0 && dS.q){ dS.q = ''; all('button', dAz).forEach(function(x){ x.setAttribute('aria-pressed', x.getAttribute('data-letter') === dS.letter ? 'true' : 'false'); }); dLoad(false); }
      }, 400);
    });
    dMore.addEventListener('click', function(){ dLoad(true); });
    dLoad(false);
  }
  /* health days: the app's Health Days tab */
  var hdList = document.getElementById('hdList');
  if(hdList){
    var HD_CATS = ['International', 'National', 'Week', 'Month', 'Campaign', 'Other'];
    var hS = { q: '', month: -1, cat: 'All', exam: false, shown: 30 }, hAll = [];
    var hLoading = document.getElementById('hdLoading'), hTools = document.getElementById('hdTools'), hCount = document.getElementById('hdCount'), hMore = document.getElementById('hdMore'), hEmpty = document.getElementById('hdEmpty'), hNone = document.getElementById('hdNone'), hMonths = document.getElementById('hdMonths'), hCats = document.getElementById('hdCats'), hSearch = document.getElementById('hdSearch');
    var cleanDays = function(list){
      var out = [];
      (Array.isArray(list) ? list : []).slice(0, 500).forEach(function(it, i){
        if(out.length >= 400 || !it || typeof it !== 'object') return;
        var title = stripTags(it.title, 120); if(!title) return;
        var m = (typeof it.month === 'number' && isFinite(it.month) && it.month >= 0 && it.month <= 12) ? Math.floor(it.month) : 0;
        out.push({ i: i, date: stripTags(it.date, 60), month: m, title: title, description: stripTags(it.description, 400), theme: stripTags(it.theme, 120), organization: stripTags(it.organization, 120), keyMessage: stripTags(it.keyMessage, 300), examPoint: stripTags(it.examPoint, 300), category: HD_CATS.indexOf(it.category) !== -1 ? it.category : '', examRelevant: it.examRelevant === true });
      });
      out.sort(function(a, b){ var ma = a.month || 13, mb = b.month || 13; return (ma - mb) || (a.i - b.i); });
      return out;
    };
    var hFiltered = function(){
      var q = hS.q.toLowerCase();
      return hAll.filter(function(d){ return (hS.month === -1 || d.month === hS.month) && (hS.cat === 'All' || d.category === hS.cat) && (!hS.exam || d.examRelevant) && (!q || (d.title + ' ' + d.date + ' ' + d.theme + ' ' + d.organization + ' ' + d.description).toLowerCase().indexOf(q) !== -1); });
    };
    var hDraw = function(){
      var list = hFiltered(); clear(hdList);
      list.slice(0, hS.shown).forEach(function(d){
        var li = el('li', 'dayitem'); li.appendChild(el('div', 'dday', d.date || 'Date varies'));
        var body = el('div', 'dcontent'), h = el('h3', 'dtitle', d.title);
        if(d.examRelevant) h.appendChild(el('span', 'xpill', 'Exam'));
        body.appendChild(h);
        var meta = [d.theme, d.organization].filter(Boolean).join(' \u00B7 '); if(meta) body.appendChild(el('p', 'dmeta', meta));
        if(d.description) body.appendChild(el('p', 'dtext', d.description));
        if(d.keyMessage){ var k = el('p', 'dkey'); k.appendChild(el('b', null, 'Key message: ')); k.appendChild(document.createTextNode(d.keyMessage)); body.appendChild(k); }
        if(d.examPoint){ var x = el('p', 'dexam'); x.appendChild(el('b', null, 'Exam point: ')); x.appendChild(document.createTextNode(d.examPoint)); body.appendChild(x); }
        li.appendChild(body); hdList.appendChild(li);
      });
      hCount.textContent = list.length ? 'Showing ' + Math.min(list.length, hS.shown) + ' of ' + list.length + (list.length === 1 ? ' health day' : ' health days') : '';
      hEmpty.hidden = list.length > 0; hMore.hidden = list.length <= hS.shown;
    };
    var hChips = function(box, items, key){
      clear(box);
      items.forEach(function(it){
        var b = el('button', 'fchip', it.label); b.type = 'button'; b.setAttribute('aria-pressed', hS[key] === it.value ? 'true' : 'false');
        b.addEventListener('click', function(){ hS[key] = it.value; hS.shown = 30; all('button', box).forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); hDraw(); });
        box.appendChild(b);
      });
    };
    hSearch.addEventListener('input', function(){ hS.q = txt(hSearch.value, 80); hS.shown = 30; hDraw(); });
    hMore.addEventListener('click', function(){ hS.shown += 30; hDraw(); });
    getJSON('siteHealthDays', 9000).then(function(d){
      hAll = cleanDays(d && d.days); hLoading.hidden = true;
      if(!hAll.length){ showNone(hNone, ['siteHealthDays']); return; }
      var months = [], seen = Object.create(null), cats = [], cseen = Object.create(null), anyExam = false;
      hAll.forEach(function(x){ if(!(x.month in seen)){ seen[x.month] = 1; months.push(x.month); } if(x.category && !(x.category in cseen)){ cseen[x.category] = 1; cats.push(x.category); } if(x.examRelevant) anyExam = true; });
      var mi = [{ label: 'All months', value: -1 }].concat(months.map(function(m){ return { label: m ? HD_MONTHS[m - 1] : 'Date varies', value: m }; }));
      hChips(hMonths, mi, 'month');
      var ci = [{ label: 'All types', value: 'All' }].concat(cats.sort(function(a, b){ return HD_CATS.indexOf(a) - HD_CATS.indexOf(b); }).map(function(c){ return { label: c, value: c }; }));
      if(cats.length) hChips(hCats, ci, 'cat'); else hCats.hidden = true;
      if(anyExam){ var xb = el('button', 'fchip', 'Exam relevant'); xb.type = 'button'; xb.setAttribute('aria-pressed', 'false'); xb.addEventListener('click', function(){ hS.exam = !hS.exam; hS.shown = 30; xb.setAttribute('aria-pressed', hS.exam ? 'true' : 'false'); hDraw(); }); (cats.length ? hCats : hMonths).appendChild(xb); if(!cats.length) hCats.hidden = true; else hCats.hidden = false; }
      hTools.hidden = false; hDraw();
    });
  }
  /* public holidays: the owner's Public Holidays tab */
  var hoList = document.getElementById('hoList');
  if(hoList){
    var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var pad2 = function(n){ return (n < 10 ? '0' : '') + n; };
    var nowD = new Date(), todayS = nowD.getFullYear() + '-' + pad2(nowD.getMonth() + 1) + '-' + pad2(nowD.getDate());
    var oS = { year: 0, upcoming: true }, oAll = [];
    var oLoading = document.getElementById('hoLoading'), oTools = document.getElementById('hoTools'), oCount = document.getElementById('hoCount'), oEmpty = document.getElementById('hoEmpty'), oNone = document.getElementById('hoNone'), oYears = document.getElementById('hoYears'), oUp = document.getElementById('hoUpcoming');
    var cleanHol = function(list){
      var out = [];
      (Array.isArray(list) ? list : []).slice(0, 500).forEach(function(it){
        if(out.length >= 400 || !it || typeof it !== 'object') return;
        var date = isoDate(it.date), title = stripTags(it.title, 120); if(!date || !title) return;
        out.push({ date: date, title: title, nepali: stripTags(it.nepaliDate, 40), note: stripTags(it.note, 200) });
      });
      return out;
    };
    var oDraw = function(){
      var list = oAll.filter(function(h){ return +h.date.slice(0, 4) === oS.year && (!oS.upcoming || h.date >= todayS); });
      clear(hoList); var lastKey = '', ul = null;
      list.forEach(function(h){
        var key = h.date.slice(0, 7);
        if(key !== lastKey){ lastKey = key; hoList.appendChild(el('h3', 'homonth', HD_MONTHS[+h.date.slice(5, 7) - 1] + ' ' + h.date.slice(0, 4))); ul = el('ul', 'holilist'); hoList.appendChild(ul); }
        var li = el('li', 'holitem'), box = el('div', 'hodate'), p = h.date.split('-');
        box.appendChild(el('b', null, String(+p[2]))); box.appendChild(el('span', null, WD[new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay()]));
        var body = el('div', 'holbody'), t = el('b', 'holtitle', h.title);
        if(h.date === todayS) t.appendChild(el('span', 'xpill', 'Today'));
        body.appendChild(t);
        if(h.nepali) body.appendChild(el('span', 'dmeta', h.nepali));
        if(h.note) body.appendChild(el('span', 'dnote', h.note));
        li.appendChild(box); li.appendChild(body); ul.appendChild(li);
      });
      oCount.textContent = list.length ? list.length + (list.length === 1 ? ' holiday' : ' holidays') + ' in ' + oS.year : '';
      oEmpty.hidden = list.length > 0;
    };
    oUp.addEventListener('click', function(){ oS.upcoming = !oS.upcoming; oUp.setAttribute('aria-pressed', oS.upcoming ? 'true' : 'false'); oDraw(); });
    getJSON('sitePublicHolidays', 9000).then(function(d){
      oAll = cleanHol(d && d.holidays); oLoading.hidden = true;
      if(!oAll.length){ showNone(oNone, ['sitePublicHolidays']); return; }
      var years = [], ys = Object.create(null); oAll.forEach(function(h){ var y = +h.date.slice(0, 4); if(!(y in ys)){ ys[y] = 1; years.push(y); } }); years.sort(function(a, b){ return a - b; });
      var cur = nowD.getFullYear(); oS.year = years.indexOf(cur) !== -1 ? cur : (years.filter(function(y){ return y > cur; })[0] || years[years.length - 1]);
      var hasUpcoming = function(){ return oAll.some(function(h){ return +h.date.slice(0, 4) === oS.year && h.date >= todayS; }); };
      oS.upcoming = hasUpcoming(); oUp.setAttribute('aria-pressed', oS.upcoming ? 'true' : 'false');
      clear(oYears);
      years.forEach(function(y){
        var b = el('button', 'fchip', String(y)); b.type = 'button'; b.setAttribute('aria-pressed', y === oS.year ? 'true' : 'false');
        b.addEventListener('click', function(){ oS.year = y; oS.upcoming = hasUpcoming(); oUp.setAttribute('aria-pressed', oS.upcoming ? 'true' : 'false'); all('button', oYears).forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); oDraw(); });
        oYears.appendChild(b);
      });
      oTools.hidden = false; oDraw();
    });
  }


  /* ---------- study packs showcase (the "Site Products" tab): the website only SHOWS packs and sends students to the app: no price, no checkout ---------- */
  var pkList = document.getElementById('pkList');
  if(pkList){
    var PK_TYPES = ['Mock test', 'eBook', 'Course', 'Notes', 'Video', 'Other'];
    var pkS = { q: '', type: 'All', exam: 'All', shown: 24 }, pkAll = [];
    var pkLoading = document.getElementById('pkLoading'), pkTools = document.getElementById('pkTools'), pkCount = document.getElementById('pkCount'), pkMore = document.getElementById('pkMore'), pkEmpty = document.getElementById('pkEmpty'), pkNone = document.getElementById('pkNone'), pkTypesBox = document.getElementById('pkTypes'), pkExamsBox = document.getElementById('pkExams'), pkSearch = document.getElementById('pkSearch');
    var cleanPacks = function(list){
      var out = [];
      (Array.isArray(list) ? list : []).slice(0, 150).forEach(function(it){
        if(out.length >= 100 || !it || typeof it !== 'object') return;
        var name = stripTags(it.name, 100); if(!name) return;
        out.push({ name: name, type: PK_TYPES.indexOf(it.type) !== -1 ? it.type : 'Other', exam: stripTags(it.exam, 40), description: stripTags(it.description, 300), access: (it.access === 'Free' || it.access === 'Premium') ? it.access : '', link: https(it.link) });
      });
      return out;
    };
    var pkFiltered = function(){
      var q = pkS.q.toLowerCase();
      return pkAll.filter(function(p){ return (pkS.type === 'All' || p.type === pkS.type) && (pkS.exam === 'All' || p.exam === pkS.exam) && (!q || (p.name + ' ' + p.exam + ' ' + p.description + ' ' + p.type).toLowerCase().indexOf(q) !== -1); });
    };
    var pkDraw = function(){
      var list = pkFiltered(); clear(pkList);
      list.slice(0, pkS.shown).forEach(function(p){
        var li = el('li', 'pack'), tags = el('div', 'tags');
        tags.appendChild(el('span', 'xpill', p.type)); if(p.exam) tags.appendChild(el('span', 'xpill', p.exam)); li.appendChild(tags);
        li.appendChild(el('h3', null, p.name)); if(p.description) li.appendChild(el('p', null, p.description));
        var foot = el('div', 'foot'); if(p.access) foot.appendChild(el('b', 'access', p.access === 'Free' ? 'Free to start' : 'Premium'));
        var a = el('a', 'btn btn-primary', p.link ? 'Learn more' : 'Open in the app'), url = p.link || https(SITE.appUrl);
        if(url){ a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; } foot.appendChild(a); li.appendChild(foot); pkList.appendChild(li);
      });
      pkCount.textContent = list.length ? 'Showing ' + Math.min(list.length, pkS.shown) + ' of ' + list.length + (list.length === 1 ? ' pack' : ' packs') : '';
      pkEmpty.hidden = list.length > 0; pkMore.hidden = list.length <= pkS.shown;
    };
    var pkChips = function(box, values, key){
      clear(box);
      values.forEach(function(v){
        var b = el('button', 'fchip', v === 'All' ? (key === 'type' ? 'All kinds' : 'All exams') : v); b.type = 'button'; b.setAttribute('aria-pressed', pkS[key] === v ? 'true' : 'false');
        b.addEventListener('click', function(){ pkS[key] = v; pkS.shown = 24; all('button', box).forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); pkDraw(); });
        box.appendChild(b);
      });
    };
    pkSearch.addEventListener('input', function(){ pkS.q = txt(pkSearch.value, 80); pkS.shown = 24; pkDraw(); });
    pkMore.addEventListener('click', function(){ pkS.shown += 24; pkDraw(); });
    getJSON('siteProducts', 9000).then(function(d){
      pkAll = cleanPacks(d && d.products); pkLoading.hidden = true;
      if(!pkAll.length){ showNone(pkNone, ['siteProducts']); return; }
      var types = [], tseen = Object.create(null), exams = [], eseen = Object.create(null);
      pkAll.forEach(function(p){ if(!(p.type in tseen)){ tseen[p.type] = 1; types.push(p.type); } if(p.exam && !(p.exam in eseen)){ eseen[p.exam] = 1; exams.push(p.exam); } });
      types.sort(function(a, b){ return PK_TYPES.indexOf(a) - PK_TYPES.indexOf(b); });
      if(types.length > 1) pkChips(pkTypesBox, ['All'].concat(types), 'type'); else pkTypesBox.hidden = true;
      if(exams.length > 1) pkChips(pkExamsBox, ['All'].concat(exams), 'exam'); else pkExamsBox.hidden = true;
      pkTools.hidden = false; pkDraw();
    });
  }


  /* ---------- FAQs, testimonials, company details and the enquiry form (Phase 6) ---------- */
  var fqList = document.getElementById('fqList');
  if(fqList){
    var fS = { q: '', cat: 'All', shown: 30 }, fAll = [];
    var fLoading = document.getElementById('fqLoading'), fTools = document.getElementById('fqTools'), fCount = document.getElementById('fqCount'), fMore = document.getElementById('fqMore'), fEmpty = document.getElementById('fqEmpty'), fNone = document.getElementById('fqNone'), fCats = document.getElementById('fqCats'), fSearch = document.getElementById('fqSearch');
    var cleanFaqs = function(list){
      var out = [];
      (Array.isArray(list) ? list : []).slice(0, 150).forEach(function(it){
        if(out.length >= 100 || !it || typeof it !== 'object') return;
        var q = stripTags(it.question, 200), a = stripTags(it.answer, 800); if(!q || !a) return;
        out.push({ q: q, a: a, cat: stripTags(it.category, 40) });
      });
      return out;
    };
    var fFiltered = function(){
      var q = fS.q.toLowerCase();
      return fAll.filter(function(f){ return (fS.cat === 'All' || f.cat === fS.cat) && (!q || (f.q + ' ' + f.a).toLowerCase().indexOf(q) !== -1); });
    };
    var fDraw = function(){
      var list = fFiltered(); clear(fqList);
      list.slice(0, fS.shown).forEach(function(f){ var d = el('details'), s = el('summary', null, f.q); d.appendChild(s); d.appendChild(el('div', 'ans', f.a)); fqList.appendChild(d); });
      fCount.textContent = list.length ? 'Showing ' + Math.min(list.length, fS.shown) + ' of ' + list.length + (list.length === 1 ? ' question' : ' questions') : '';
      fEmpty.hidden = list.length > 0; fMore.hidden = list.length <= fS.shown;
    };
    fSearch.addEventListener('input', function(){ fS.q = txt(fSearch.value, 80); fS.shown = 30; fDraw(); });
    fMore.addEventListener('click', function(){ fS.shown += 30; fDraw(); });
    getJSON('siteFaqs', 9000).then(function(d){
      fAll = cleanFaqs(d && d.faqs); fLoading.hidden = true;
      var fDef = document.getElementById('fqDefaults');
      if(!fAll.length){
        if(fDef){   /* no questions in the Sheet (or it did not answer): the answers written in the page stay, and can be searched */
          var dItems = all('details', fDef); fTools.hidden = false; fCats.hidden = true;
          fSearch.addEventListener('input', function(){ var q = txt(fSearch.value, 80).toLowerCase(), n = 0; dItems.forEach(function(it){ var ok = !q || it.textContent.toLowerCase().indexOf(q) !== -1; it.hidden = !ok; if(ok) n++; }); fEmpty.hidden = n > 0; fCount.textContent = ''; });
          return;
        }
        showNone(fNone, ['siteFaqs']); return;
      }
      if(fDef) fDef.hidden = true;
      var cats = [], seen = Object.create(null); fAll.forEach(function(f){ if(f.cat && !(f.cat in seen) && cats.length < 12){ seen[f.cat] = 1; cats.push(f.cat); } });
      if(cats.length > 1){
        clear(fCats);
        ['All'].concat(cats).forEach(function(c){
          var b = el('button', 'fchip', c === 'All' ? 'All topics' : c); b.type = 'button'; b.setAttribute('aria-pressed', fS.cat === c ? 'true' : 'false');
          b.addEventListener('click', function(){ fS.cat = c; fS.shown = 30; all('button', fCats).forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); fDraw(); });
          fCats.appendChild(b);
        });
      } else { fCats.hidden = true; }
      fTools.hidden = false; fDraw();
    });
  }
  /* testimonials: the backend sends only the ones the student agreed to (Permission = Yes); the page also re-checks every field */
  var testiP = null;
  function getTesti(){
    if(!testiP) testiP = getJSON('siteTestimonials', 9000).then(function(d){
      var out = [];
      (Array.isArray(d && d.testimonials) ? d.testimonials : []).slice(0, 20).forEach(function(it){
        if(out.length >= 12 || !it || typeof it !== 'object') return;
        var name = stripTags(it.name, 60), text = stripTags(it.text, 300); if(!name || !text) return;
        out.push({ name: name, text: text, role: stripTags(it.role, 60) });
      });
      return out;
    });
    return testiP;
  }
  all('[data-testi]').forEach(function(ul){
    var sec = ul.closest ? ul.closest('section') : null, started = false;
    var go = function(){
      if(started) return; started = true;
      getTesti().then(function(list){
        if(!list.length) return; clear(ul);
        list.forEach(function(t){
          var li = el('li', 'quote'), bq = el('blockquote'); bq.appendChild(el('p', null, t.text)); li.appendChild(bq);
          var who = el('p', 'who'); who.appendChild(el('b', null, t.name)); if(t.role) who.appendChild(document.createTextNode(' \u00B7 ' + t.role)); li.appendChild(who); ul.appendChild(li);
        });
        if(sec) sec.hidden = false;
      });
    };
    /* On the Home page the testimonials are fetched only when the visitor scrolls near them (Home keeps its 3 backend calls); on the About page they load at once. */
    var anchor = document.getElementById(ul.getAttribute('data-lazy-after') || '');
    if(!anchor) go();
    else if('IntersectionObserver' in window){ var io = new IntersectionObserver(function(es){ if(es.some(function(e){ return e.isIntersecting; })){ io.disconnect(); go(); } }, { rootMargin: '0px 0px 400px 0px' }); io.observe(anchor); }
    else window.addEventListener('scroll', go, { once: true, passive: true });
  });
  /* company details (Contact page) */
  var coList = document.getElementById('companyList');
  if(coList){
    var CO_LABELS = ['Organisation', 'Registration number', 'PAN number', 'Address', 'Phone', 'Email', 'Support hours', 'About'];
    getJSON('siteCompany', 9000).then(function(d){
      var n = 0; clear(coList);
      (Array.isArray(d && d.company) ? d.company : []).slice(0, 8).forEach(function(it){
        if(!it || typeof it !== 'object' || CO_LABELS.indexOf(it.label) === -1) return;
        var v = stripTags(it.value, 400); if(!v) return;
        coList.appendChild(el('dt', null, it.label)); coList.appendChild(el('dd', null, v)); n++;
      });
      if(n){ var box = document.getElementById('companyBox'); if(box) box.hidden = false; }
    });
  }
  /* enquiry form: it only builds an email in the visitor's own email app; nothing is sent from the website and nothing is stored */
  var enqForm = document.getElementById('enqForm');
  if(enqForm){
    var eName = document.getElementById('enqName'), eTopic = document.getElementById('enqTopic'), eMsg = document.getElementById('enqMsg'), eCount = document.getElementById('enqCount'), eErr = document.getElementById('enqErr'), eNote = document.getElementById('enqNote');
    var TOPICS = ['Question about the app', 'Premium or payment', 'Report a problem', 'Suggest content', 'Other'];
    eMsg.addEventListener('input', function(){ eCount.textContent = eMsg.value.length + ' / 1000'; });
    var showErr = function(t){ eErr.textContent = t; eErr.hidden = false; eNote.hidden = true; };
    enqForm.addEventListener('submit', function(ev){
      ev.preventDefault();
      var clean = function(v, max){ return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/\r\n?/g, '\n').trim().slice(0, max); };
      var name = clean(eName.value, 60).replace(/\s+/g, ' '), topic = TOPICS.indexOf(eTopic.value) !== -1 ? eTopic.value : 'Other', msg = clean(eMsg.value, 1000);
      if(msg.length < 10){ showErr('Please write at least 10 letters so we can help you.'); eMsg.focus(); return; }
      var ml = document.getElementById('mailLink'), to = email(ml ? String(ml.getAttribute('href') || '').replace(/^mailto:/i, '') : '');
      if(!to){ showErr('Our email address is not available right now. Please use one of the links below.'); return; }
      var subject = 'Health Loksewa website: ' + topic, body = (name ? 'Name: ' + name + '\n' : '') + 'Topic: ' + topic + '\n\n' + msg;
      var url = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if(url.length > 1900){ showErr('Your message is too long for an email link. Please make it a little shorter.'); return; }
      eErr.hidden = true;
      var a = document.createElement('a'); a.href = url; a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      eNote.textContent = 'Your email app should open with your message ready. If nothing opens, please write to ' + to + '.'; eNote.hidden = false;
    });
  }


  /* ---------- more calculators (Phase 7): sample size, risk and odds, BSA, IV drip rate. The sample size and risk-and-odds formulas are the SAME as the Health Loksewa app. Plain functions, no eval, nothing is sent anywhere. ---------- */
  var CALC = {
    Z: { '90': 1.645, '95': 1.96, '99': 2.576 },
    num: function(v){ if(v === null || v === undefined) return NaN; var s = String(v).trim(); return s === '' ? NaN : Number(s); },
    sampleSize: function(o){
      var z = CALC.Z[String(o.conf)]; if(!z) return { error: 'Please choose a confidence level.' };
      var pct = isNaN(o.pct) ? 50 : o.pct, margin = isNaN(o.margin) ? 5 : o.margin;
      if(!(pct >= 1 && pct <= 99)) return { error: 'The expected proportion must be between 1 and 99 percent (leave it empty if you do not know: 50 is used).' };
      if(!(margin >= 0.1 && margin <= 50)) return { error: 'The margin of error must be between 0.1 and 50 percent (leave it empty to use 5).' };
      var pop = isNaN(o.pop) ? 0 : o.pop; if(pop < 0 || (pop > 0 && pop < 1) || pop > 1e8) return { error: 'The population size must be a whole number from 1 to 100,000,000, or empty.' };
      var non = isNaN(o.non) ? 0 : o.non; if(non < 0 || non > 90) return { error: 'The expected non-response must be between 0 and 90 percent, or empty.' };
      var p = pct / 100, e = margin / 100, n0 = (z * z * p * (1 - p)) / (e * e), n = n0;
      if(pop > 0) n = n / (1 + ((n - 1) / pop));
      var finalN = Math.ceil(n), out = { n: finalN, n0: Math.ceil(n0), z: z, corrected: pop > 0, conf: String(o.conf), pct: pct, margin: margin, pop: pop };
      if(non > 0){ out.non = non; out.withNon = Math.ceil(finalN / (1 - non / 100)); }
      return out;
    },
    riskOdds: function(o){
      var A = o.a, B = o.b, C = o.c, D = o.d;
      if([A, B, C, D].some(function(v){ return isNaN(v) || v < 0 || v !== Math.floor(v) || v > 1e8; }) || (A + B) <= 0 || (C + D) <= 0 || B <= 0 || C <= 0) return { error: 'Please enter whole numbers for all four boxes (B and C must be greater than 0).' };
      var rE = A / (A + B), rU = C / (C + D), rr = rE / rU, or = (A * D) / (B * C), rd = rE - rU, out = { riskE: rE, riskU: rU, rr: rr, or: or, rd: rd, nnt: rd !== 0 ? Math.ceil(Math.abs(1 / rd)) : null, rrCI: null, orCI: null };
      if(A > 0){ var se1 = Math.sqrt(1 / A - 1 / (A + B) + 1 / C - 1 / (C + D)); out.rrCI = [Math.exp(Math.log(rr) - 1.96 * se1), Math.exp(Math.log(rr) + 1.96 * se1)]; }
      if(A > 0 && D > 0){ var se2 = Math.sqrt(1 / A + 1 / B + 1 / C + 1 / D); out.orCI = [Math.exp(Math.log(or) - 1.96 * se2), Math.exp(Math.log(or) + 1.96 * se2)]; }
      return out;
    },
    bsa: function(o){
      if(!(o.kg >= 2 && o.kg <= 500) || !(o.cm >= 50 && o.cm <= 260)) return { error: 'Please enter the weight in kg (2 to 500) and the height in cm (50 to 260).' };
      return { bsa: Math.sqrt((o.cm * o.kg) / 3600) };
    },
    ivDrip: function(o){
      var f = Number(o.factor); if([10, 15, 20, 60].indexOf(f) === -1) return { error: 'Please choose the drop factor printed on the infusion set.' };
      var h = isNaN(o.hours) ? 0 : o.hours, m = isNaN(o.mins) ? 0 : o.mins, vol = o.vol;
      if(!(vol >= 1 && vol <= 5000) || vol !== Math.floor(vol)) return { error: 'The volume must be a whole number of mL from 1 to 5000.' };
      if(h < 0 || h > 72 || h !== Math.floor(h) || m < 0 || m > 59 || m !== Math.floor(m)) return { error: 'Please enter whole hours (0 to 72) and minutes (0 to 59).' };
      var mins = h * 60 + m; if(mins < 1 || mins > 4320) return { error: 'The time must be from 1 minute to 72 hours.' };
      var dpm = (vol * f) / mins;
      return { dpm: dpm, rounded: Math.round(dpm), mlh: vol / (mins / 60), secPerDrop: dpm > 0 ? 60 / dpm : null, mins: mins, factor: f };
    }
  };
  var f2 = function(x){ return (Math.round(x * 100) / 100).toFixed(2); };
  function calcForm(formId, outId, run){
    var form = document.getElementById(formId); if(!form) return;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var out = document.getElementById(outId); clear(out); out.classList.remove('err');
      var r = run(function(id){ return CALC.num(document.getElementById(id).value); }, function(id){ return document.getElementById(id).value; });
      if(r && r.error){ out.classList.add('err'); out.textContent = r.error; return; }
      if(r && r.lines){ r.lines.forEach(function(l, i){ if(i === 0) out.appendChild(el('b', null, l)); else out.appendChild(el('span', 'small', l)); }); }
    });
  }
  calcForm('ssForm', 'ssOut', function(v, raw){
    var r = CALC.sampleSize({ pct: v('ssProp'), margin: v('ssMargin'), conf: raw('ssConf'), pop: v('ssPop'), non: v('ssNon') }); if(r.error) return r;
    var L = ['Required sample size: ' + r.n, 'At ' + r.conf + '% confidence, with a margin of error of ' + r.margin + '% and an expected proportion of ' + r.pct + '%' + (r.corrected ? ', corrected for a population of ' + r.pop : '') + '.'];
    if(r.corrected) L.push('Without the population correction the number would be ' + r.n0 + '.');
    if(r.withNon) L.push('With ' + r.non + '% expected non-response, invite about ' + r.withNon + ' people.');
    L.push('This is the usual formula for a simple random survey. A study with groups, clusters or comparisons needs a different calculation: ask a statistician.');
    return { lines: L };
  });
  calcForm('roForm', 'roOut', function(v){
    var r = CALC.riskOdds({ a: v('roA'), b: v('roB'), c: v('roC'), d: v('roD') }); if(r.error) return r;
    var L = ['Relative risk (RR): ' + f2(r.rr) + (r.rrCI ? '  (95% CI ' + f2(r.rrCI[0]) + ' to ' + f2(r.rrCI[1]) + ')' : ''), 'Odds ratio (OR): ' + f2(r.or) + (r.orCI ? '  (95% CI ' + f2(r.orCI[0]) + ' to ' + f2(r.orCI[1]) + ')' : ''),
      'Risk in the exposed: ' + f2(r.riskE * 100) + '%. Risk in the unexposed: ' + f2(r.riskU * 100) + '%.', 'Risk difference (attributable risk): ' + f2(r.rd * 100) + '%.', 'Number needed to treat or harm (NNT): ' + (r.nnt === null ? 'not defined (no difference)' : r.nnt)];
    var ci = r.rrCI, ref = r.rr > 1 ? 'The risk is higher in the exposed group.' : r.rr < 1 ? 'The risk is lower in the exposed group.' : 'The risk is the same in both groups.';
    L.push(ref + (ci ? (ci[0] <= 1 && ci[1] >= 1 ? ' The 95% interval includes 1, so this result could be due to chance.' : ' The 95% interval does not include 1.') : ''));
    L.push('The odds ratio is the right measure for a case-control study. The relative risk is the right measure for a cohort study.');
    return { lines: L };
  });
  calcForm('bsaForm', 'bsaOut', function(v){
    var r = CALC.bsa({ kg: v('bsaKg'), cm: v('bsaCm') }); if(r.error) return r;
    return { lines: ['Body surface area: ' + f2(r.bsa) + ' square metres', 'Mosteller formula: the square root of (height in cm times weight in kg, divided by 3600). For adults; it is used to learn how doses are scaled, never to decide a dose.'] };
  });
  calcForm('ivForm', 'ivOut', function(v, raw){
    var r = CALC.ivDrip({ vol: v('ivVol'), hours: v('ivHours'), mins: v('ivMins'), factor: raw('ivDrop') }); if(r.error) return r;
    var L = [r.rounded < 1 ? 'Less than 1 drop per minute' : 'About ' + r.rounded + ' drops per minute'];
    if(r.rounded < 1) L.push('This is too slow to count by drops. In real care an infusion pump or a senior nurse is needed.');
    else { L.push('That is about one drop every ' + (Math.round(r.secPerDrop * 10) / 10) + ' seconds.'); if(r.rounded > 200) L.push('This is a very fast rate. Please check the volume, the time and the drop factor.'); }
    L.push('Flow: about ' + (Math.round(r.mlh * 10) / 10) + ' mL per hour.');
    L.push('Formula: drops per minute = volume in mL times drop factor, divided by the time in minutes. For learning only: follow the doctor\'s order and your hospital protocol.');
    return { lines: L };
  });

  /* press / (a slash) on any page to search: on the search page it jumps into the search box; anywhere else it opens the search page. Never while typing in a field. */
  document.addEventListener('keydown', function(e){
    if(e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    var a = document.activeElement, tag = a && a.tagName ? a.tagName : '';
    if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (a && a.isContentEditable)) return;
    e.preventDefault();
    var si = document.getElementById('sInput'); if(si){ si.focus(); } else { location.href = 'search.html'; }
  });

  /* ---------- 'New' badge (a date from today back to 7 days ago), exam pages, text size ---------- */
  function isRecent(iso){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return false;
    var p = iso.split('-'), d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])), t = new Date(); t.setHours(0, 0, 0, 0);
    var diff = Math.round((t.getTime() - d.getTime()) / 86400000); return diff >= 0 && diff <= 7;
  }
  var exPacks = document.getElementById('exPacks');
  if(exPacks){
    var exNames = String(exPacks.getAttribute('data-exam-names') || '').toLowerCase().split('|').filter(Boolean), exSec = document.getElementById('exPacksSec');
    getJSON('siteProducts', 9000).then(function(d){
      var out = [];
      (d && Array.isArray(d.products) ? d.products : []).slice(0, 150).forEach(function(it){
        if(out.length >= 12 || !it || typeof it !== 'object') return;
        var name = stripTags(it.name, 100), exam = stripTags(it.exam, 40).toLowerCase(); if(!name || exNames.indexOf(exam) === -1) return;
        out.push({ name: name, type: ['Mock test', 'eBook', 'Course', 'Notes', 'Video'].indexOf(it.type) !== -1 ? it.type : 'Other', description: stripTags(it.description, 300), access: (it.access === 'Free' || it.access === 'Premium') ? it.access : '', link: https(it.link) });
      });
      if(!out.length) return;
      clear(exPacks);
      out.forEach(function(p){
        var li = el('li', 'pack'), tags = el('div', 'tags'); tags.appendChild(el('span', 'xpill', p.type)); li.appendChild(tags);
        li.appendChild(el('h3', null, p.name)); if(p.description) li.appendChild(el('p', null, p.description));
        var foot = el('div', 'foot'); if(p.access) foot.appendChild(el('b', 'access', p.access === 'Free' ? 'Free to start' : 'Premium'));
        var a = el('a', 'btn btn-primary', p.link ? 'Learn more' : 'Open in the app'), url = p.link || https(SITE.appUrl);
        if(url){ a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; } foot.appendChild(a); li.appendChild(foot); exPacks.appendChild(li);
      });
      exSec.hidden = false;
    });
  }
  /* text size: three steps, remembered in this browser only */
  (function(){
    var KEY = 'hl:fs', SIZES = [100, 115, 130], LABELS = ['Normal text', 'Large text', 'Larger text'], SHORT = ['A', 'A+', 'A++'], cur = 100;
    try{ var v = Number(localStorage.getItem(KEY)); if(SIZES.indexOf(v) !== -1) cur = v; }catch(e){}
    document.documentElement.style.fontSize = cur + '%';
    var foot = document.querySelector('footer .wrap'); if(!foot) return;
    var box = el('div', 'textsize'); box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Text size'); box.appendChild(el('span', null, 'Text size'));
    SIZES.forEach(function(sz, i){
      var b = el('button', 'tsbtn', SHORT[i]); b.type = 'button'; b.setAttribute('aria-label', LABELS[i]); b.setAttribute('aria-pressed', sz === cur ? 'true' : 'false'); b.setAttribute('data-size', String(sz));
      b.addEventListener('click', function(){
        cur = sz; document.documentElement.style.fontSize = cur + '%'; window.dispatchEvent(new Event('hl-fit')); try{ localStorage.setItem(KEY, String(cur)); }catch(e){}
        all('.tsbtn').forEach(function(x){ x.setAttribute('aria-pressed', Number(x.getAttribute('data-size')) === cur ? 'true' : 'false'); });
      });
      box.appendChild(b);
    });
    var disc = foot.querySelector('.disc'); if(disc) foot.insertBefore(box, disc); else foot.appendChild(box);
  })();


  /* ---------- optional website sign-in: the same account as the app. Hidden unless SITE.signIn is true or this browser was switched on with ?signin=1. auth.js loads only when needed. ---------- */
  (function(){
    var on = SITE.signIn === true, kT = 'hl:signin-test', kA = 'hl:auth', stored = '';
    try{
      var q = location.search; if(/[?&]signin=1(&|$)/.test(q)) localStorage.setItem(kT, '1'); if(/[?&]signin=0(&|$)/.test(q)) localStorage.removeItem(kT);
      if(localStorage.getItem(kT) === '1') on = true; stored = (localStorage.getItem(kA) || '').slice(0, 20);
    }catch(e){}
    var ul = on ? document.querySelector('nav.main ul') : null; if(!ul) return;
    document.documentElement.className += ' hl-si';   /* with the extra button the inline menu does not fit: the compact Menu button is used on every screen size */
    var li = document.createElement('li'); li.className = 'signin-li';
    var b = document.createElement('button'); b.type = 'button'; b.id = 'siBtn'; b.className = 'btn btn-ghost btn-sm'; b.setAttribute('aria-haspopup', 'dialog'); b.textContent = stored ? 'Hi, ' + stored : 'Sign in';
    li.appendChild(b); ul.appendChild(li);   /* after the Open the app item */
    var loading = null;
    function load(){
      if(window.HLAuth) return Promise.resolve(window.HLAuth);
      if(!loading) loading = new Promise(function(res, rej){ var s = document.createElement('script'); s.src = 'auth.js'; s.onload = function(){ if(window.HLAuth) res(window.HLAuth); else { loading = null; rej(); } }; s.onerror = function(){ loading = null; rej(); }; document.head.appendChild(s); });
      return loading;
    }
    b.addEventListener('click', function(){
      b.disabled = true;
      load().then(function(a){ b.disabled = false; a.open(b); }, function(){ b.disabled = false; if(https(SITE.appUrl)) location.href = SITE.appUrl; });   /* if the sign-in program cannot load, the app's own sign-in is always there */
    });
    /* the same two buttons in the HEADER BAR (beside Menu), so nobody has to open the menu to find them */
    var bar = document.querySelector('header.site .bar'), tg = document.getElementById('navToggle');
    if(bar && tg){
      var sb = document.createElement('div'); sb.className = 'si-bar'; var app = ul.querySelector('a[data-app]');
      if(app){ var oa = app.cloneNode(true); oa.className += ' si-open'; sb.appendChild(oa); }
      var t2 = document.createElement('button'); t2.type = 'button'; t2.id = 'siTop'; t2.className = 'btn btn-ghost btn-sm si-top'; t2.setAttribute('aria-haspopup', 'dialog'); t2.textContent = b.textContent; sb.appendChild(t2); bar.insertBefore(sb, tg);
      t2.addEventListener('click', function(){ t2.disabled = true; load().then(function(a){ t2.disabled = false; a.open(t2); }, function(){ t2.disabled = false; if(https(SITE.appUrl)) location.href = SITE.appUrl; }); });
      var root = document.documentElement, ft = null;
      /* WIDE SCREENS show the full menu bar (page links, then Open the app, then Sign in); if it does not fit (very large text, a long name, Nepali) the compact header is used instead */
      function fit(){ root.classList.remove('hl-narrow'); if(!window.matchMedia || !window.matchMedia('(min-width:1340px)').matches) return; if(bar.scrollWidth > bar.clientWidth + 1 || bar.getBoundingClientRect().height > 84) root.classList.add('hl-narrow'); }
      function fitSoon(){ clearTimeout(ft); ft = setTimeout(fit, 60); }
      try{ new MutationObserver(function(){ t2.textContent = b.textContent; fitSoon(); }).observe(b, { childList: true, characterData: true, subtree: true }); }catch(e){}
      window.addEventListener('resize', fitSoon); window.addEventListener('hl-fit', fitSoon);
      try{ if(document.fonts && document.fonts.ready) document.fonts.ready.then(fit); }catch(e){}
      fit();
    }
    if(stored){ var idle = window.requestIdleCallback || function(f){ setTimeout(f, 1500); }; idle(function(){ load().then(function(a){ a.init(); }, function(){}); }); }
  })();
  window.HLSite = { SITE: SITE, https: https, email: email, txt: txt, niceDate: niceDate, DEFAULT_LINKS: DEFAULT_LINKS, cleanNews: cleanNews, cleanLinks: cleanLinks, cleanDocs: cleanDocs, cleanQotd: cleanQotd, calc: CALC, netFail: netFail, u: { el: el, clear: clear, all: all, txt: txt, stripTags: stripTags, isoDate: isoDate, niceDate: niceDate, https: https, getJSON: getJSON, getNews: getNews, getDocs: getDocs, cleanNews: cleanNews, cleanDocs: cleanDocs } };
})();
