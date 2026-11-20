/* Health Loksewa: study planner. Everything happens on this phone: the plan is saved only in this browser (the key hl:planner) and nothing is sent anywhere. No HTML strings are built: every text is added as text. */
(function(){
  'use strict';
  var H = window.HLSite; if(!H || !H.u) return;
  var u = H.u, el = u.el, clear = u.clear, all = u.all;
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var OFF_ORDER = [6, 5, 0];   /* rest days: Saturday first (the weekly holiday in Nepal), then Friday, then Sunday */
  var WEIGHTS = ['Less time', 'Some time', 'Normal', 'More time', 'Most time'];
  var CHIPS = ['Health and Public Health', 'Health Planning and Management', 'General Epidemiology', 'Health Statistics', 'Demography', 'Food and Nutrition', 'Environmental Health', 'Health Education and Promotion', 'Public Management', 'General Awareness', 'Anatomy and Physiology', 'Nursing Foundations'];
  var MAX_SUBJ = 12, MAX_DAYS = 1100;

  function validISO(s){ return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && (new Date(s + 'T00:00:00Z')).toISOString().slice(0, 10) === s; }
  function diffDays(a, b){ var pa = a.split('-'), pb = b.split('-'); return Math.round((Date.UTC(+pa[0], +pa[1] - 1, +pa[2]) - Date.UTC(+pb[0], +pb[1] - 1, +pb[2])) / 86400000); }
  function todayISO(){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function cleanName(s){ return String(s == null ? '' : s).replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40); }
  /* largest remainder: share `total` whole units between the weights, so the shares always add up to total */
  function share(ws, total){
    var sum = ws.reduce(function(a, b){ return a + b; }, 0), raw = ws.map(function(w){ return total * w / sum; }), base = raw.map(Math.floor), left = total - base.reduce(function(a, b){ return a + b; }, 0);
    raw.map(function(r, i){ return { i: i, f: r - base[i] }; }).sort(function(a, b){ return b.f - a.f || a.i - b.i; }).slice(0, left).forEach(function(x){ base[x.i]++; });
    return base;
  }
  function make(o, today){
    o = o || {}; today = today || todayISO();
    if(!validISO(o.date)) return { error: 'Please choose your exam date.' };
    var daysLeft = diffDays(o.date, today);
    if(daysLeft < 1) return { error: 'The exam date must be tomorrow or later.' };
    if(daysLeft > MAX_DAYS) return { error: 'The exam date must be within 3 years from today.' };
    var hours = Number(o.hours); if(!(hours >= 0.5 && hours <= 12)) return { error: 'Study hours per day must be from 0.5 to 12.' };
    var off = Number(o.off); if(!(off === 0 || off === 1 || off === 2 || off === 3)) return { error: 'Rest days per week must be 0, 1, 2 or 3.' };
    var subs = Array.isArray(o.subjects) ? o.subjects : [];
    if(subs.length < 1) return { error: 'Add at least one subject.' };
    if(subs.length > MAX_SUBJ) return { error: 'Please use at most ' + MAX_SUBJ + ' subjects.' };
    var names = [], ws = [], seen = Object.create(null);
    for(var i = 0; i < subs.length; i++){
      var nm = cleanName(subs[i] && subs[i].name), w = Number(subs[i] && subs[i].weight);
      if(!nm) return { error: 'Every subject needs a name.' };
      if(!(w === 1 || w === 2 || w === 3 || w === 4 || w === 5)) return { error: 'Choose how much time "' + nm + '" needs.' };
      if(seen[nm.toLowerCase()]) return { error: 'Each subject can be listed once: "' + nm + '".' };
      seen[nm.toLowerCase()] = 1; names.push(nm); ws.push(w);
    }
    var studyDays = Math.max(1, daysLeft - Math.round(daysLeft * off / 7));
    var revisionDays = studyDays >= 20 ? Math.min(14, Math.round(studyDays * 0.15)) : 0;
    var learningDays = studyDays - revisionDays, learningHours = learningDays * hours;
    var wsum = ws.reduce(function(a, b){ return a + b; }, 0), pct = share(ws, 100);
    var B = Math.max(1, Math.round(hours * 2)), offSet = Object.create(null); OFF_ORDER.slice(0, off).forEach(function(d){ offSet[d] = 1; });
    var perWeekDays = 7 - off, quota = share(ws, B * perWeekDays), remain = quota.slice(), week = [];
    for(var d = 0; d < 7; d++){
      if(offSet[d]){ week.push({ day: DAYS[d], off: true, items: [] }); continue; }
      var used = [], cnt = Object.create(null);
      for(var b = 0; b < B; b++){
        var best = -1;
        for(var k = 0; k < names.length; k++){
          if(remain[k] <= 0) continue;
          if(used.length >= 3 && !cnt[k]) continue;
          if(best === -1 || remain[k] > remain[best]) best = k;
        }
        if(best === -1){ for(var k2 = 0; k2 < names.length; k2++){ if(remain[k2] > 0 && (best === -1 || remain[k2] > remain[best])) best = k2; } }
        if(best === -1) break;
        if(!cnt[best]){ cnt[best] = 0; used.push(best); } cnt[best]++; remain[best]--;
      }
      week.push({ day: DAYS[d], off: false, items: used.map(function(k){ return { name: names[k], blocks: cnt[k] }; }) });
    }
    return {
      daysLeft: daysLeft, studyDays: studyDays, learningDays: learningDays, revisionDays: revisionDays, hoursPerDay: hours, off: off,
      totalHours: Math.round(studyDays * hours * 10) / 10, learningHours: Math.round(learningHours * 10) / 10, revisionHours: Math.round(revisionDays * hours * 10) / 10,
      blocksPerDay: B, weekBlocks: B * perWeekDays,
      subjects: names.map(function(n, i){ return { name: n, weight: ws[i], hours: Math.round(learningHours * ws[i] / wsum * 10) / 10, percent: pct[i], weekBlocks: quota[i] }; }),
      week: week
    };
  }
  H.planner = { make: make, share: share, diffDays: diffDays };

  var form = document.getElementById('plForm'); if(!form) return;
  var rowsBox = document.getElementById('plRows'), chipsBox = document.getElementById('plChips'), out = document.getElementById('plOut'), actions = document.getElementById('plActions');
  var dateIn = document.getElementById('plDate'), hoursIn = document.getElementById('plHours'), offSel = document.getElementById('plOff'), examSel = document.getElementById('plExam');
  var last = null, KEY = 'hl:planner';

  function hrs(blocks){ var h = blocks / 2; return (h % 1 === 0 ? String(h) : h.toFixed(1)) + ' h'; }
  function addRow(name, weight){
    if(all('.plrow', rowsBox).length >= MAX_SUBJ) return null;
    var r = el('div', 'plrow'), n = el('input', 'nm'); n.type = 'text'; n.maxLength = 40; n.placeholder = 'Subject name'; n.setAttribute('aria-label', 'Subject name'); n.value = cleanName(name || '');
    var w = el('select', 'wt'); w.setAttribute('aria-label', 'How much time this subject needs');
    WEIGHTS.forEach(function(t, i){ var op = el('option', null, t); op.value = String(i + 1); if(i + 1 === (weight || 3)) op.selected = true; w.appendChild(op); });
    var x = el('button', 'btn btn-ghost rm', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Remove this subject'); x.addEventListener('click', function(){ rowsBox.removeChild(r); });
    r.appendChild(n); r.appendChild(w); r.appendChild(x); rowsBox.appendChild(r); return n;
  }
  function readSubjects(){ return all('.plrow', rowsBox).map(function(r){ return { name: r.querySelector('.nm').value, weight: Number(r.querySelector('.wt').value) }; }); }
  function readForm(){ return { exam: examSel.value, date: dateIn.value, hours: hoursIn.value, off: offSel.value, subjects: readSubjects() }; }
  function line(b, t){ var p = el('p', 'plp'); if(b) p.appendChild(el('b', null, b)); p.appendChild(document.createTextNode(t)); return p; }
  function planText(p, o){
    var L = ['Study plan' + (o.exam ? ': ' + o.exam : '') + ' (exam on ' + o.date + ', ' + p.daysLeft + ' days left)', p.hoursPerDay + ' hours a day, ' + p.off + ' rest day' + (p.off === 1 ? '' : 's') + ' a week = ' + p.studyDays + ' study days, ' + p.totalHours + ' hours.'];
    if(p.revisionDays) L.push('Last ' + p.revisionDays + ' study days: revision and mock tests only.');
    L.push('', 'Hours for each subject (before the revision days):'); p.subjects.forEach(function(s){ L.push('- ' + s.name + ': ' + s.hours + ' h (' + s.percent + '%)'); });
    L.push('', 'Your week:'); p.week.forEach(function(d){ L.push(d.day + ': ' + (d.off ? 'rest' : d.items.map(function(i){ return i.name + ' ' + hrs(i.blocks); }).join(', '))); });
    return L.join('\n');
  }
  function draw(p, o){
    clear(out); out.classList.remove('err'); out.hidden = false;
    var sum = el('div', 'plsum'); [[p.daysLeft, 'days left'], [p.studyDays, 'study days'], [p.totalHours, 'study hours'], [p.revisionDays, 'revision days at the end']].forEach(function(x){ var d = el('div'); d.appendChild(el('b', null, String(x[0]))); d.appendChild(el('span', null, x[1])); sum.appendChild(d); });
    out.appendChild(sum);
    out.appendChild(el('h3', 'plh', 'Hours for each subject'));
    var ul = el('ul', 'plsubj-list'); p.subjects.forEach(function(s){ var li = el('li'); var t = el('div', 'plt'); t.appendChild(el('b', null, s.name)); t.appendChild(el('span', null, s.hours + ' h · ' + s.percent + '%')); li.appendChild(t); var bar = el('div', 'plbar'), fill = el('i'); fill.style.width = s.percent + '%'; bar.appendChild(fill); li.appendChild(bar); ul.appendChild(li); }); out.appendChild(ul);
    out.appendChild(el('h3', 'plh', 'Your week'));
    p.week.forEach(function(d){ var r = el('div', 'plday' + (d.off ? ' off' : '')); r.appendChild(el('b', null, d.day)); r.appendChild(el('span', null, d.off ? 'Rest day' : d.items.map(function(i){ return i.name + ' ' + hrs(i.blocks); }).join(' · '))); out.appendChild(r); });
    out.appendChild(line('', p.revisionDays ? 'The last ' + p.revisionDays + ' study days before the exam are for revision and full mock tests. Do not start new topics then.' : 'Your time is short, so use it for the most important subjects and for practice questions.'));
    out.appendChild(line('Tip: ', 'Spend about a quarter of each subject\'s time on MCQs and past questions, not only on reading.'));
    actions.hidden = false; last = { p: p, o: o };
  }
  function save(o){ try{ localStorage.setItem(KEY, JSON.stringify({ exam: o.exam, date: o.date, hours: o.hours, off: o.off, subjects: o.subjects })); }catch(e){} }
  function run(){
    var o = readForm(), p = make(o);
    if(p.error){ clear(out); out.hidden = false; out.classList.add('err'); out.textContent = p.error; actions.hidden = true; last = null; return; }
    draw(p, o); save(o);
  }
  form.addEventListener('submit', function(e){ e.preventDefault(); run(); });
  CHIPS.forEach(function(c){ var b = el('button', 'fchip', c); b.type = 'button'; b.addEventListener('click', function(){ var have = readSubjects().some(function(s){ return cleanName(s.name).toLowerCase() === c.toLowerCase(); }); if(!have){ var rows = all('.plrow', rowsBox), empty = rows.filter(function(r){ return !r.querySelector('.nm').value.trim(); })[0]; if(empty){ empty.querySelector('.nm').value = c; } else { addRow(c, 3); } } }); chipsBox.appendChild(b); });
  document.getElementById('plAdd').addEventListener('click', function(){ var n = addRow('', 3); if(n) n.focus(); });
  document.getElementById('plPrint').addEventListener('click', function(){ window.print(); });
  document.getElementById('plClear').addEventListener('click', function(){ try{ localStorage.removeItem(KEY); }catch(e){} clear(out); out.hidden = true; actions.hidden = true; last = null; clear(rowsBox); addRow('', 3); addRow('', 3); examSel.value = ''; dateIn.value = ''; hoursIn.value = '3'; offSel.value = '1'; });
  document.getElementById('plCopy').addEventListener('click', function(){
    if(!last) return; var t = planText(last.p, last.o), btn = document.getElementById('plCopy'), ok = function(){ btn.textContent = 'Copied'; setTimeout(function(){ btn.textContent = 'Copy my plan'; }, 1800); };
    try{ if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(ok, function(){ fb(); }); return; } }catch(e){}
    fb(); function fb(){ var ta = el('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); ok(); }catch(e){} document.body.removeChild(ta); }
  });
  /* the date box: from tomorrow to 3 years from today */
  (function(){ var t = new Date(), mn = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1), mx = new Date(t.getFullYear(), t.getMonth(), t.getDate() + MAX_DAYS); function f(d){ return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); } dateIn.min = f(mn); dateIn.max = f(mx); })();
  /* restore the saved plan, if any */
  var saved = null; try{ saved = JSON.parse(localStorage.getItem(KEY) || 'null'); }catch(e){}
  if(saved && typeof saved === 'object' && Array.isArray(saved.subjects) && saved.subjects.length){
    examSel.value = (typeof saved.exam === 'string' && all('option', examSel).some(function(o){ return o.value === saved.exam || o.textContent === saved.exam; })) ? saved.exam : '';
    dateIn.value = (validISO(saved.date) && diffDays(saved.date, todayISO()) >= 1) ? saved.date : '';   /* an exam date that has passed is not restored */ hoursIn.value = String(Number(saved.hours) >= 0.5 && Number(saved.hours) <= 12 ? Number(saved.hours) : 3);
    offSel.value = ['0', '1', '2', '3'].indexOf(String(saved.off)) !== -1 ? String(saved.off) : '1';
    saved.subjects.slice(0, MAX_SUBJ).forEach(function(s){ if(s && typeof s === 'object') addRow(s.name, Number(s.weight) >= 1 && Number(s.weight) <= 5 ? Number(s.weight) : 3); });
    if(validISO(dateIn.value)){ var o = readForm(), p = make(o); if(!p.error) draw(p, o); }
  }
  if(!all('.plrow', rowsBox).length){ addRow('', 3); addRow('', 3); }
})();
