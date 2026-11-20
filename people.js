/* Our people: photo cards on the Home page. The Sheet tab "Site People" decides who is shown (Permission = Yes and a photo file name in the people/ folder).
   No people, or no working photo = NOTHING is shown (the whole section stays hidden). Cards are built with textContent only; the photo comes only from the site's own people/ folder.
   The Sheet is asked only when a visitor scrolls near this section (so Home keeps its small number of backend calls). */
(function(){
  'use strict';
  var sec = document.getElementById('people'), grid = document.getElementById('peopleGrid'), sent = document.getElementById('peopleSentinel');
  var U = window.HLSite && window.HLSite.u;
  if(!sec || !grid || !sent || !U) return;
  var FILE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,80}\.(jpe?g|png|webp)$/i, started = false;
  function make(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text) e.textContent = text; return e; }
  function clean(it){
    if(!it || typeof it !== 'object') return null;
    var name = U.stripTags(it.name, 80), photo = (typeof it.photo === 'string') ? it.photo.trim() : '';
    if(!name || !FILE.test(photo)) return null;
    return { name: name, title: U.stripTags(it.title, 120), group: U.stripTags(it.group, 40), note: U.stripTags(it.note, 200), photo: photo, link: U.https(it.link) };
  }
  function shownCount(){ return grid.querySelectorAll('.pcard:not([hidden])').length; }
  function card(p){
    var c = make('article', 'pcard'); c.hidden = true;
    var ph = make('div', 'pcard-photo'), img = new Image();
    img.className = 'pcard-img'; img.alt = p.name + (p.title ? ', ' + p.title : ''); img.width = 600; img.height = 750; img.decoding = 'async';
    img.onload = function(){ c.hidden = false; sec.hidden = false; };
    img.onerror = function(){ if(c.parentNode) c.parentNode.removeChild(c); if(!shownCount()) sec.hidden = true; };
    img.src = 'people/' + p.photo;   // only the site's own folder: the file name was checked above
    ph.appendChild(img); if(p.group) ph.appendChild(make('span', 'pcard-badge', p.group));
    c.appendChild(ph);
    var body = make('div', 'pcard-body'); body.appendChild(make('h3', 'pcard-name', p.name));
    if(p.title) body.appendChild(make('p', 'pcard-title', p.title));
    if(p.note) body.appendChild(make('p', 'pcard-note', p.note));
    if(p.link){ var a = make('a', 'btn btn-ghost pcard-btn', 'View profile'); a.href = p.link; a.target = '_blank'; a.rel = 'noopener noreferrer'; body.appendChild(a); }
    c.appendChild(body); return c;
  }
  function start(){
    if(started) return; started = true;
    U.getJSON('sitePeople', 9000).then(function(d){
      var list = []; (Array.isArray(d && d.people) ? d.people : []).slice(0, 30).forEach(function(it){ var p = clean(it); if(p && list.length < 24) list.push(p); });
      list.forEach(function(p){ grid.appendChild(card(p)); });
    });
  }
  /* The list is asked for only when the visitor is really reading: the section is near AND the visitor has scrolled (or stayed about 6 seconds). Opening Home on a big screen therefore still makes only its 3 usual backend calls. */
  function arm(){
    if(window.scrollY > 0) return start();
    var done = false, go = function(){ if(done) return; done = true; window.removeEventListener('scroll', go); start(); };
    window.addEventListener('scroll', go, { passive: true }); setTimeout(go, 6000);
  }
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ if(es.some(function(e){ return e.isIntersecting; })){ io.disconnect(); arm(); } }, { rootMargin: '500px 0px' });
    io.observe(sent);
  } else {
    arm();
  }
})();
