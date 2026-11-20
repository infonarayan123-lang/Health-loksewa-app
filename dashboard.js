/* Health Loksewa: the "My dashboard" page. Shows the signed-in student a way into every part of the app, and the SAME Free / Premium list and plans the app uses (read from your Google Sheet). Nothing private is shown: the plan and progress of a student live inside the app. */
(function(){
  'use strict';
  var d = document, S = (window.HLSite && window.HLSite.SITE) || {}, APP = String(S.appUrl || ''), API = String(S.api || ''), loaded = false;
  var CARDS = [
    ['practice', "Subject-wise MCQs", "Timed MCQs · negative marking"],
    ['mock', "Mock Test", "Simulates the real exam experience"],
    ['past', "Past Questions", "Real papers from previous years"],
    ['home', "Syllabus", "Units & downloadable PDFs"],
    ['second', "Second Paper", "Syllabus, notes & PDFs"],
    ['home', "Smart Tools", "BMI, health indicators & epidemiology calculators"],
    ['ai', "AI Assistant", "Ask about syllabus, subjects, study tips & more"],
    ['home', "Health Guide", "Basic health education articles"],
    ['home', "Weekly Tournament", "Same questions for everyone — compete this week!"],
    ['home', "New Update", "Official reports · view in-app"],
    ['rapid', "Rapid Fire", "Fast-paced practice, 5 modes"],
    ['home', "Handbook", "Formulas, Quick References & more"],
    ['whatsnew', "What's New", "App updates & features"],
    ['home', "Question of the Day", "One free question, updated every day"],
    ['flash', "Flash Cards", "Make and review your own flash cards"],
    ['leaderboard', "Leaderboard", "See how you rank"],
    ['progress', "My progress", "Your scores and study time"]
  ];
  function $(id){ return d.getElementById(id); }
  function el(t, c, x){ var e = d.createElement(t); if(c) e.className = c; if(x != null) e.textContent = x; return e; }
  function clean(t){ return String(t == null ? '' : t).replace(/<[^>]*>/g, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim().slice(0, 300); }
  function go(k){ return APP ? APP + '?go=' + k : '#'; }
  function clear(n){ while(n.firstChild) n.removeChild(n.firstChild); }
  function getJson(action){
    return new Promise(function(res, rej){
      if(!API){ rej(new Error('no api')); return; }
      var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function(){ if(ctl) ctl.abort(); rej(new Error('timeout')); }, 9000);
      fetch(API + '?action=' + action, ctl ? { signal: ctl.signal } : {}).then(function(r){ return r.json(); }).then(function(j){ clearTimeout(t); res(j); }, function(e){ clearTimeout(t); rej(e); });
    });
  }
  function fail(box, msg){ clear(box); box.appendChild(el('p', 'empty', msg)); }
  function who(){
    var b = $('siBtn'), t = b ? b.textContent.trim() : '';
    if(/^Hi, /.test(t)) return t.slice(4);
    if(!b){ try{ return localStorage.getItem('hl:auth') || ''; }catch(e){} }
    return '';
  }
  function buildCards(){
    var g = $('mdGrid'); clear(g);
    CARDS.forEach(function(c){
      var card = el('div', 'md-card'); card.appendChild(el('h3', '', c[1])); card.appendChild(el('p', '', c[2]));
      var a = el('a', 'btn btn-ghost btn-sm', c[0] === 'home' ? 'Find on Home' : 'Open'); a.href = go(c[0]); card.appendChild(a); g.appendChild(card);
    });
  }
  function buildTable(rows){
    var box = $('mdPf'); clear(box);
    rows = Array.isArray(rows) ? rows.filter(function(r){ return r && clean(r.Feature); }).slice(0, 60) : [];
    if(!rows.length){ fail(box, 'The Free and Premium list will appear here soon.'); return; }
    var t = el('table', 'md-pf'), hr = d.createElement('tr'); ['Feature', 'Free', 'Premium'].forEach(function(h){ hr.appendChild(el('th', '', h)); });
    var th = d.createElement('thead'); th.appendChild(hr); t.appendChild(th); var tb = d.createElement('tbody');
    rows.forEach(function(r){ var tr = d.createElement('tr'); tr.appendChild(el('td', '', clean(r.Feature))); tr.appendChild(el('td', '', clean(r.Free))); tr.appendChild(el('td', '', clean(r.Premium))); tb.appendChild(tr); });
    t.appendChild(tb); box.appendChild(t);
  }
  function buildPlans(plans){
    var box = $('mdPlans'); clear(box);
    plans = Array.isArray(plans) ? plans.filter(function(p){ return p && (p.label || p.planKey) && Number(p.finalPrice) > 0; }).slice(0, 12) : [];
    if(!plans.length){ fail(box, 'No plans are listed yet.'); return; }
    var g = el('div', 'md-plans');
    plans.forEach(function(p){
      var c = el('div', 'md-plan'), m = Math.max(1, Math.min(60, Math.round(Number(p.months) || 1))), disc = Math.round(Number(p.discountPercent) || 0), line = el('p', 'md-note');
      c.appendChild(el('strong', '', clean(p.label || p.planKey)));
      line.appendChild(el('span', '', String(m))); line.appendChild(d.createTextNode(' ')); line.appendChild(el('span', '', m === 1 ? 'month' : 'months')); c.appendChild(line);
      var pr = el('div', 'md-price', 'NPR ' + Math.round(Number(p.finalPrice))); if(disc > 0 && Number(p.basePrice) > Number(p.finalPrice)) pr.appendChild(el('span', 'md-was', 'NPR ' + Math.round(Number(p.basePrice))));
      c.appendChild(pr);
      if(disc > 0){ var sv = el('div', 'md-save'); sv.appendChild(el('span', '', 'Save')); sv.appendChild(d.createTextNode(' ' + Math.min(99, disc) + '%')); c.appendChild(sv); }
      g.appendChild(c);
    });
    box.appendChild(g);
  }
  function load(){
    if(loaded) return; loaded = true;
    getJson('premiumFeatures').then(buildTable, function(){ fail($('mdPf'), 'Could not load this. Check your internet and try again.'); });
    getJson('pricingPlans').then(buildPlans, function(){ fail($('mdPlans'), 'Could not load this. Check your internet and try again.'); });
  }
  function render(){
    var n = who(), out = $('mdOut'), inn = $('mdIn');
    if(n){
      $('mdName').textContent = n; out.hidden = true; inn.hidden = false;
      $('mdContinue').href = go('home'); $('mdPlanBtn').href = go('premium'); $('mdProgBtn').href = go('progress'); $('mdPremBtn').href = go('premium');
      if(!$('mdGrid').firstChild) buildCards(); load();
    } else { inn.hidden = true; out.hidden = false; }
  }
  var sb = $('mdSignIn'); if(sb) sb.addEventListener('click', function(){ var b = $('siBtn'); if(b) b.click(); });
  render();
  var btn = $('siBtn'); if(btn) new MutationObserver(render).observe(btn, { childList: true, characterData: true, subtree: true });
})();
