/* Owner word changes: the owner changes words in the app (Website words / Edit texts); this small file shows them here. Does nothing when there is no change. Legal page is never touched. */
(function(){
  'use strict';
  try{
  if(/content-policy\.html$/.test(location.pathname)) return;
  var K = 'hl:texts', KT = 'hl:textsAt', map = null, d = document, done = (typeof WeakSet === 'function') ? new WeakSet() : null;
  function norm(t){ return String(t).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/\s+/g, ' ').trim(); }
  function setMap(arr){
    var m = Object.create(null), n = 0;
    if(Object.prototype.toString.call(arr) === '[object Array]') arr.forEach(function(x){ if(x && typeof x.o === 'string' && typeof x.r === 'string' && x.r !== '' && n < 600){ m[norm(x.o)] = x.r; n++; } });
    map = n ? m : null;
  }
  var SKIP = { SCRIPT:1, STYLE:1, NOSCRIPT:1, TEXTAREA:1, CODE:1, PRE:1, TEMPLATE:1, TITLE:1 };
  function apply(root){
    if(!map || !root) return;
    var tw = d.createTreeWalker(root, 4, null, false), list = [], nd;
    while((nd = tw.nextNode())) list.push(nd);
    list.forEach(function(n){
      var p = n.parentNode; if(!p || SKIP[p.nodeName] || (done && done.has(n))) return;
      var v = n.nodeValue; if(!v || v.length > 400) return;
      var r = map[norm(v)]; if(r === undefined || r === v) return;
      if(done) done.add(n); n.nodeValue = r;
    });
  }
  function run(){ apply(d.body); }
  function load(){
    try{ var c = JSON.parse(localStorage.getItem(K) || 'null'); setMap(c); }catch(e){}
    if(map) run();
    var at = 0; try{ at = +localStorage.getItem(KT) || 0; }catch(e){}
    var api = window.HLSite && window.HLSite.SITE && window.HLSite.SITE.api;
    if(!api || (Date.now() - at < 300000 && at)) return;
    var ctl = (typeof AbortController === 'function') ? new AbortController() : null, tm = setTimeout(function(){ if(ctl) ctl.abort(); }, 9000);
    fetch(api + (api.indexOf('?') < 0 ? '?' : '&') + 'action=appTexts', ctl ? { signal: ctl.signal } : {}).then(function(r){ return r.json(); }).then(function(j){
      clearTimeout(tm);
      if(j && Object.prototype.toString.call(j.texts) === '[object Array]'){ try{ localStorage.setItem(K, JSON.stringify(j.texts)); localStorage.setItem(KT, String(Date.now())); }catch(e){} setMap(j.texts); run(); }
    }).catch(function(){ clearTimeout(tm); });
  }
  if(typeof MutationObserver === 'function'){
    var q = false;
    new MutationObserver(function(){ if(!map || q) return; q = true; setTimeout(function(){ q = false; run(); }, 250); }).observe(d.documentElement, { childList: true, subtree: true });
  }
  if(d.readyState === 'loading') d.addEventListener('DOMContentLoaded', load); else load();
  }catch(e){}
})();
