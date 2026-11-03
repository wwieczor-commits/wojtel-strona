/* WOJTEL – interakcje. Czysty JS, bez bibliotek. Respektuje prefers-reduced-motion. */
(function () {
  'use strict';
  var d = document, w = window;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* rok w stopce */
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- stagger karteczek + reveal ---------- */
  $$('[data-stagger]').forEach(function (h) {
    $$('.w', h).forEach(function (el, i) { el.style.setProperty('--d', (i * 0.11 + 0.05).toFixed(2) + 's'); });
  });
  $$('.hero .rv').forEach(function (el, i) { el.style.setProperty('--d', (0.5 + i * 0.12).toFixed(2) + 's'); });
  $$('.facts .rv, .svc__list .svc, .steps .rv, .why .rv, .cards .rv').forEach(function (el, i) {
    el.style.setProperty('--d', ((i % 3) * 0.1).toFixed(2) + 's');
  });

  var revealEls = $$('.rv, .words, .dossier');
  if (reduce || !('IntersectionObserver' in w)) {
    revealEls.forEach(function (e) { e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); if (e.target.querySelector && e.target.querySelector('.cnt')) countIn(e.target); if (e.target.classList.contains('cnt')) runCount(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (e) { io.observe(e); });
  }

  /* ---------- liczniki (tylko prawdziwe wartości) ---------- */
  function fmt(n, sep) { return sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') : String(n); }
  function target(el) {
    if (el.dataset.years) {
      var s = new Date(el.dataset.years), n = new Date();
      var y = n.getFullYear() - s.getFullYear();
      if (n.getMonth() < s.getMonth() || (n.getMonth() === s.getMonth() && n.getDate() < s.getDate())) y--;
      return y;
    }
    return parseInt(el.dataset.count, 10);
  }
  $$('.cnt').forEach(function (el) { el.textContent = fmt(target(el), el.dataset.sep); }); // wartość końcowa bez JS-animacji
  var counted = new WeakSet();
  function runCount(el) {
    if (counted.has(el)) return; counted.add(el);
    var to = target(el), sep = el.dataset.sep;
    if (reduce) { el.textContent = fmt(to, sep); return; }
    var t0 = null, dur = 1700;
    el.textContent = fmt(0, sep);
    (function step(ts) {
      if (t0 === null) t0 = ts;
      var p = clamp((ts - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(to * e), sep);
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  function countIn(root) { $$('.cnt', root).forEach(runCount); }
  if (!reduce && 'IntersectionObserver' in w) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    $$('.cnt').forEach(function (el) { cio.observe(el); });
  }

  /* ---------- scroll: ranking, parallax, oś czasu, sekcje, numer usługi ---------- */
  var segs = $$('.rk__segs b'), bar = $('#rkBar'), now = $('#rkNow'), total = $('#rkTotal');
  var secs = $$('[data-sec]'), navA = $$('.rk__nav a');
  var pars = $$('[data-par]');
  var tl = $('#tl'), tlItems = tl ? $$('.tl__i', tl) : [];
  var svcs = $$('.svc'), numBig = $('#numBig');
  total.textContent = secs.length;
  var curSec = -1, curSvc = 0, ticking = false;

  function setSvc(n) {
    if (!numBig || n === curSvc) return; curSvc = n;
    if (reduce) { numBig.textContent = n; return; }
    numBig.classList.add('flip');
    setTimeout(function () { numBig.textContent = n; numBig.classList.remove('flip'); }, 180);
  }

  function update() {
    ticking = false;
    var vh = w.innerHeight, y = w.scrollY || w.pageYOffset;
    var max = Math.max(1, d.documentElement.scrollHeight - vh);
    var p = clamp(y / max, 0, 1);
    segs.forEach(function (b, i) { b.style.transform = 'scaleX(' + clamp(p * 3 - i, 0, 1).toFixed(3) + ')'; });
    bar.setAttribute('aria-valuenow', Math.round(p * 100));

    // aktualna sekcja
    var idx = 0;
    secs.forEach(function (s, i) { if (s.getBoundingClientRect().top < vh * 0.45) idx = i; });
    if (y + vh >= d.documentElement.scrollHeight - 4) idx = secs.length - 1;
    if (idx !== curSec) {
      curSec = idx; now.textContent = idx + 1;
      navA.forEach(function (a) { a.classList.toggle('on', +a.dataset.s === idx); });
    }

    // paralaksa
    if (!reduce) {
      pars.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.par);
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
    }

    // oś czasu
    if (tl) {
      var r = tl.getBoundingClientRect();
      var fill = clamp((vh * 0.62 - r.top) / r.height, 0, 1);
      tl.style.setProperty('--p', (fill * 100).toFixed(1) + '%');
      var lineY = r.top + r.height * fill;
      tlItems.forEach(function (it) {
        var ir = it.getBoundingClientRect();
        it.classList.toggle('on', ir.top + 40 < lineY || fill >= 1);
      });
    }

    // numer usługi (karta NUMER)
    if (svcs.length) {
      var best = 1, bd = 1e9, mid = vh * 0.45;
      svcs.forEach(function (s, i) {
        var sr = s.getBoundingClientRect(); if (sr.bottom < 0 || sr.top > vh) return;
        var dd = Math.abs(sr.top + sr.height / 2 - mid); if (dd < bd) { bd = dd; best = i + 1; }
      });
      setSvc(best);
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  w.addEventListener('scroll', req, { passive: true });
  w.addEventListener('resize', req);
  w.addEventListener('load', update);
  update();

  /* ---------- interakcje kursora (tylko precyzyjny wskaźnik) ---------- */
  if (fine && !reduce) {
    // zdjęcia – przesuwanie za kursorem
    $$('.photo').forEach(function (ph) {
      ph.addEventListener('pointermove', function (e) {
        var r = ph.getBoundingClientRect();
        ph.style.setProperty('--tx', ((e.clientX - r.left) / r.width - 0.5) * -26 + 'px');
        ph.style.setProperty('--ty', ((e.clientY - r.top) / r.height - 0.5) * -20 + 'px');
      });
      ph.addEventListener('pointerleave', function () { ph.style.setProperty('--tx', '0px'); ph.style.setProperty('--ty', '0px'); });
    });
    // magnetyczne przyciski
    $$('[data-magnet]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var mx = (e.clientX - r.left - r.width / 2) * 0.12, my = (e.clientY - r.top - r.height / 2) * 0.2;
        b.style.translate = mx.toFixed(1) + 'px ' + my.toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = ''; });
    });
    // lekkie przechylanie hero za kursorem
    var hero = $('.hero'), art = $('.hero__art'); setTimeout(function(){ if (art) art.classList.add('live'); }, 2200);
    if (hero && art) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        art.style.transform = 'rotate(' + (0.8 + x * 2).toFixed(2) + 'deg) translate(' + (x * 10).toFixed(1) + 'px,' + (y * 8).toFixed(1) + 'px)';
      });
    }
  }

  /* ---------- kopiowanie ---------- */
  var toast = $('#toast'), tt;
  function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('show'); }, 1800); }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.dataset.copy;
      var ok = function () { say('Skopiowano: ' + v); };
      if (navigator.clipboard && w.isSecureContext) { navigator.clipboard.writeText(v).then(ok, function () { say('Zaznacz i skopiuj: ' + v); }); }
      else { var t = d.createElement('textarea'); t.value = v; t.style.position = 'fixed'; t.style.opacity = '0'; d.body.appendChild(t); t.select(); try { d.execCommand('copy'); ok(); } catch (e) { say('Zaznacz i skopiuj: ' + v); } d.body.removeChild(t); }
    });
  });

  /* ---------- formularz → mailto (nic nie jest wysyłane przez stronę) ---------- */
  var f = $('#mailForm');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var g = function (id) { return $(id).value.trim(); };
    var body = 'Imię i nazwisko / firma: ' + g('#f-name') + '\nKontakt zwrotny: ' + g('#f-tel') + '\nTemat: ' + g('#f-topic') + '\n\n' + g('#f-msg') + '\n';
    var url = 'mailto:wwieczor@gmail.com?subject=' + encodeURIComponent('Zapytanie ze strony WOJTEL – ' + g('#f-topic')) + '&body=' + encodeURIComponent(body);
    say('Otwieram Twój program pocztowy…');
    w.location.href = url;
  });
})();
