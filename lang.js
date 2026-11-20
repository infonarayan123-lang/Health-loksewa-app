/* English / Nepali switch. For English visitors this small file does nothing else. */
(function(){
  'use strict';
  var K = 'hl:lang', m = location.search.match(/[?&]lang=(ne|en)(?:&|$)/), ne = false, d = document, H = d.documentElement;
  try{ if(m){ if(m[1] === 'ne') localStorage.setItem(K, 'ne'); else localStorage.removeItem(K); } ne = localStorage.getItem(K) === 'ne'; }catch(e){ ne = !!(m && m[1] === 'ne'); }
  var preview = !!m;
  function h(s){ var x = 2166136261; for(var i = 0; i < s.length; i++){ x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } x = x >>> 0; return x.toString(36); }
  function norm(t){ return String(t).replace(/\s+/g, ' ').trim(); }
  function dig(s){ return s.replace(/\d/g, function(c){ return '०१२३४५६७८९'.charAt(+c); }); }
  function tr(t){
    var n = norm(t); if(!n) return null; var D = window.HL_NE || {}, r = D[h(n)]; if(r !== undefined) return r;
    var g = n.match(/^(\d{1,2}) ([A-Z][a-z]+) (\d{4})$/); if(g){ var mo = D[h(g[2])]; if(mo !== undefined) return dig(g[1]) + ' ' + mo + ' ' + dig(g[3]); }
    return null;
  }
  function node(n){ var v = n.nodeValue, r = tr(v); if(r !== null){ var nv = v.match(/^\s*/)[0] + r + v.match(/\s*$/)[0]; if(nv !== v) n.nodeValue = nv; } }
  function attrs(el){ ['placeholder', 'title', 'aria-label', 'alt', 'data-none'].forEach(function(a){ var v = el.getAttribute && el.getAttribute(a); if(v){ var r = tr(v); if(r !== null) el.setAttribute(a, r); } }); }
  function walk(x){
    if(!x) return; if(x.nodeType === 3){ node(x); return; } if(x.nodeType !== 1) return;
    var t = x.tagName.toLowerCase(); if(t === 'script' || t === 'style' || t === 'textarea' || t === 'svg') return;
    attrs(x); for(var c = x.firstChild; c; c = c.nextSibling) walk(c);
  }
  function toggle(){
    var S = (window.HLSite && window.HLSite.SITE) || window.SITE; if(!(S && S.lang === true) && !preview && !ne) return;   /* the switch lives in HLSite.SITE */
    var ul = d.querySelector('nav.main ul'); if(!ul || d.getElementById('langBtn')) return;
    var li = d.createElement('li'); li.className = 'lang-li'; var b = d.createElement('button'); b.type = 'button'; b.id = 'langBtn'; b.className = 'btn btn-ghost btn-sm';
    b.textContent = ne ? 'English' : 'नेपाली'; b.setAttribute('lang', ne ? 'en' : 'ne'); b.setAttribute('aria-label', ne ? 'Show this website in English' : 'यो वेबसाइट नेपालीमा हेर्नुहोस्');
    b.addEventListener('click', function(){ try{ if(ne) localStorage.removeItem(K); else localStorage.setItem(K, 'ne'); }catch(e){} location.href = location.pathname + location.hash; });
    li.appendChild(b); var ap = ul.querySelector('a[data-app]'), ref = ap && ap.parentNode && ap.parentNode.parentNode === ul ? ap.parentNode : null; ul.insertBefore(li, ref); window.dispatchEvent(new Event('hl-fit'));   /* before Open the app: Sign in stays right after it */
  }
  function ready(f){ if(d.readyState === 'loading') d.addEventListener('DOMContentLoaded', f); else f(); }
  ready(function(){ setTimeout(toggle, 0); setTimeout(toggle, 400); setTimeout(toggle, 1500); });   /* toggle() does nothing twice */
  if(!ne) return;
  window.HL_TR = tr;   /* the search page uses this to translate a whole result before it marks the matching words */
  var st = d.createElement('style'); st.textContent = 'html.hl-ne-wait{visibility:hidden}'; d.head.appendChild(st); H.classList.add('hl-ne-wait');
  var fin = false; function reveal(){ H.classList.remove('hl-ne-wait'); }
  setTimeout(reveal, 2500);
  var left = 2, dom = false; function go(){ if(fin || left > 0 || !dom) return; fin = true;
    walk(d.body); var tt = tr(d.title); if(tt !== null) d.title = tt; H.lang = 'ne'; window.dispatchEvent(new Event('hl-fit'));
    try{ new MutationObserver(function(ms){ ms.forEach(function(x){ if(x.type === 'characterData') node(x.target); else for(var i = 0; i < x.addedNodes.length; i++) walk(x.addedNodes[i]); }); }).observe(d.body, { childList: true, subtree: true, characterData: true }); }catch(e){}
    reveal(); }
  ['lang-ne-1.js', 'lang-ne-2.js'].forEach(function(f){ var s = d.createElement('script'); s.src = f; s.async = true; s.onload = function(){ left--; go(); }; s.onerror = function(){ left = 99; reveal(); }; d.head.appendChild(s); });
  ready(function(){ dom = true; go(); });
})();
