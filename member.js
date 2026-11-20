/* Health Loksewa: what a SIGNED-IN student sees on every page: a "My dashboard" link, a welcome line on Home, and a jump to the dashboard right after signing in. A visitor who is not signed in gets exactly the normal page. */
(function(){
  'use strict';
  var d = document, name = '', page = location.pathname.split('/').pop() || 'index.html';
  try{ name = (localStorage.getItem('hl:auth') || '').slice(0, 40); }catch(e){}
  function addNav(){
    var ul = d.querySelector('nav.main ul'); if(!ul || d.getElementById('mdLink')) return;
    var app = ul.querySelector('a[data-app]'), ref = app && app.parentNode && app.parentNode.parentNode === ul ? app.parentNode : null;
    var li = d.createElement('li'), a = d.createElement('a'); a.id = 'mdLink'; a.href = 'dashboard.html'; a.textContent = 'My dashboard';
    if(page === 'dashboard.html') a.setAttribute('aria-current', 'page');
    li.appendChild(a); ul.insertBefore(li, ref); window.dispatchEvent(new Event('hl-fit'));
  }
  function addBand(who){
    var main = d.getElementById('main'); if(!main || d.getElementById('mdBand') || !/^(index\.html)?$/.test(page)) return;
    var band = d.createElement('div'), w = d.createElement('div'), p = d.createElement('p'), s = d.createElement('span'), b = d.createElement('b'), a = d.createElement('a');
    band.className = 'welcome'; band.id = 'mdBand'; w.className = 'wrap'; s.textContent = 'Welcome back,'; b.textContent = ' ' + who; p.appendChild(s); p.appendChild(b);
    a.className = 'btn btn-primary btn-sm'; a.href = 'dashboard.html'; a.textContent = 'Go to my dashboard'; w.appendChild(p); w.appendChild(a); band.appendChild(w); main.insertBefore(band, main.firstChild);
  }
  function remove(){ var l = d.getElementById('mdLink'), b = d.getElementById('mdBand'); if(l && l.parentNode) l.parentNode.parentNode.removeChild(l.parentNode); if(b && b.parentNode) b.parentNode.removeChild(b); window.dispatchEvent(new Event('hl-fit')); }
  function show(who){ addNav(); addBand(who); goHide(true); }
  /* the "Create free account" button is only for people who are not signed in (the links into the app come from site.js: data-app + data-go) */
  function goHide(inNow){ [].forEach.call(d.querySelectorAll('a[data-go="signup"]'), function(a){ a.style.display = inNow ? 'none' : ''; }); }
  /* ONE ACTIVE DEVICE (the same rule as the app): the last device to sign in wins; every other device is signed out. The app and this website in the SAME
     browser share one device ID, so they never sign each other out. Needs no setup: it uses the account's own "devices" records. Every step FAILS OPEN. */
  var SID = ''; try{ SID = localStorage.getItem('hl_device_id') || ''; if(!SID){ SID = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10); localStorage.setItem('hl_device_id', SID); } }catch(e){}
  window.hlWebSid_ = SID;
  var FSU = 'https://firestore.googleapis.com/v1/projects/health-loksewa/databases/(default)/documents/users/', timer = null, started = false;
  function lab(){ var u = navigator.userAgent || '', os = /Android/i.test(u) ? 'Android' : /iPhone|iPad|iPod/i.test(u) ? 'iPhone/iPad' : /Windows/i.test(u) ? 'Windows' : /Mac/i.test(u) ? 'Mac' : /Linux/i.test(u) ? 'Linux' : 'Unknown device'; return 'Website (' + os + ')'; }
  function A(){ return (window.HLAuth && window.HLAuth.token && window.HLAuth.uid) ? window.HLAuth : null; }
  function call(method, body){
    var au = A(); if(!au || !SID) return Promise.resolve(null); var uid = au.uid(); if(!uid) return Promise.resolve(null);
    return au.token().then(function(tk){
      if(!tk) return null;
      var url = FSU + encodeURIComponent(uid) + '/devices/_active' + (method === 'PATCH' ? '?updateMask.fieldPaths=deviceId&updateMask.fieldPaths=label&updateMask.fieldPaths=at' : '');
      var o = { method: method, headers: { Authorization: 'Bearer ' + tk } }; if(body){ o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(body); }
      return fetch(url, o).then(function(r){ if(r.status === 404) return { none: true }; if(!r.ok) return null; return method === 'DELETE' ? { ok: true } : r.json(); });
    }).catch(function(){ return null; });
  }
  function owner(r){ return !!(r && r.fields && r.fields.deviceId && r.fields.deviceId.stringValue); }
  function claim(){ return call('PATCH', { fields: { deviceId: { stringValue: SID }, label: { stringValue: lab() }, at: { timestampValue: new Date().toISOString() } } }).then(function(r){ return !!r; }); }
  function who(r){ return owner(r) ? r.fields.deviceId.stringValue : ''; }
  function check(){ return call('GET').then(function(r){ var o = who(r); if(o && o !== SID) kicked(); }); }
  function ensure(){ return call('GET').then(function(r){ if(!r) return false; if(r.none) return claim(); var o = who(r); if(o && o !== SID){ kicked(); return false; } return true; }); }
  function stop(){ if(timer){ clearInterval(timer); timer = null; } started = false; }
  function begin(ok){ if(!ok || started) return; started = true; var ms = window.HL_SESS_POLL_MS || 45000; timer = setInterval(function(){ if(!d.hidden && d.visibilityState !== 'hidden') check(); }, ms); }
  function notice(){
    if(d.getElementById('mdKick')) return; var b = d.createElement('div'), p = d.createElement('p'), c = d.createElement('button');
    b.id = 'mdKick'; b.className = 'kick'; b.setAttribute('role', 'alert'); p.textContent = 'You signed in on another device, so this device was signed out. You can be signed in on one device at a time.';
    c.type = 'button'; c.textContent = 'OK'; c.className = 'btn btn-primary btn-sm'; c.addEventListener('click', function(){ if(b.parentNode) b.parentNode.removeChild(b); }); b.appendChild(p); b.appendChild(c); d.body.insertBefore(b, d.body.firstChild);
  }
  function kicked(){ stop(); var au = A(); if(!au) return; var f = function(){ notice(); }; au.signOut().then(f, f); }
  window.hlWebRelease = function(){   /* the student signs out here: let go of the note, but only if it names THIS device */
    stop(); return call('GET').then(function(r){ if(who(r) === SID) return call('DELETE'); }).then(function(){}, function(){});
  };
  function whenReady(fn, n){ if(A()){ fn(); return; } if((n || 0) > 40) return; setTimeout(function(){ whenReady(fn, (n || 0) + 1); }, 600); }
  d.addEventListener('visibilitychange', function(){ if(started && d.visibilityState === 'visible') check(); });
  function init(){ goHide(!!name); if(name) whenReady(function(){ ensure().then(begin); }); }
  if(d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
  if(name) show(name);
  var btn = d.getElementById('siBtn'); if(!btn) return;
  var was = btn.textContent.trim();
  new MutationObserver(function(){
    var now = btn.textContent.trim(), inNow = /^Hi, /.test(now), inWas = /^Hi, /.test(was);
    if(inNow){ show(now.slice(4)); if(!inWas){ whenReady(function(){ claim().then(begin); }); if(page !== 'dashboard.html'){ setTimeout(function(){ location.href = 'dashboard.html'; }, 900); } } }
    else { remove(); goHide(false); stop(); }
    was = now;
  }).observe(btn, { childList: true, characterData: true, subtree: true });
})();
