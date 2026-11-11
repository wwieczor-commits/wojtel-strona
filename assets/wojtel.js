/* WOJTEL – interakcje, bez bibliotek */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var io = 'IntersectionObserver' in w;

  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  if (!location.hash) w.scrollTo(0, 0);

  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* odsłanianie przy przewijaniu */
  var rvs = $$('.rv, .tl__item');
  rvs.forEach(function (el) {
    var p = el.parentElement, i = p ? Array.prototype.indexOf.call(p.children, el) : 0;
    el.style.setProperty('--st', (Math.min(i, 5) * 0.07).toFixed(2) + 's');
  });
  if (reduce || !io) { rvs.forEach(function (el) { el.classList.add('in'); }); }
  else {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    rvs.forEach(function (el) { ro.observe(el); });
  }

  /* liczniki */
  function years(iso) {
    var s = new Date(iso), n = new Date(), y = n.getFullYear() - s.getFullYear();
    if (n.getMonth() < s.getMonth() || (n.getMonth() === s.getMonth() && n.getDate() < s.getDate())) y--;
    return y;
  }
  $$('[data-count], [data-years]').forEach(function (el) {
    var target = el.dataset.years ? years(el.dataset.years) : parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    if (reduce || !io) { el.textContent = target; return; }
    el.textContent = '0';
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; o.disconnect();
        var t0 = null;
        (function step(t) {
          if (t0 === null) t0 = t;
          var k = Math.min((t - t0) / 1300, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    o.observe(el);
  });

  /* czujnik siatkowy na żywo */
  var grid = $('#sensor'), share = $('#share');
  if (grid) {
    var cells = [];
    for (var n = 0; n < 64; n++) { var s = d.createElement('span'); grid.appendChild(s); cells.push(s); }
    var visible = true;
    if (io) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(grid);
    var paint = function (t) {
      var bx = 3.5 + 2.2 * Math.sin(t * 0.7), by = 3.5 + 2.2 * Math.cos(t * 0.9);
      var cx = 3.5 + 2.6 * Math.cos(t * 0.5 + 1.3), cy = 3.5 + 2.4 * Math.sin(t * 0.6 + 0.4), sum = 0;
      for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
        var d1 = (x - bx) * (x - bx) + (y - by) * (y - by), d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        var v = Math.min(1, Math.exp(-d1 / 3.2) + 0.7 * Math.exp(-d2 / 2.2)); sum += v;
        cells[y * 8 + x].style.backgroundColor = 'rgb(' + Math.round(30 + v * 194) + ',' + Math.round(46 + v * 23) + ',' + Math.round(70 - v * 27) + ')';
      }
      if (share) share.textContent = (sum / 64 * 100).toFixed(1).replace('.', ',') + ' %';
    };
    paint(0.8);
    if (!reduce) {
      var t0 = Date.now();
      setInterval(function () { if (visible && !d.hidden) paint((Date.now() - t0) / 1000 + 0.8); }, 140);
    }
  }

  /* nagłówek: cień, postęp, aktywna sekcja, oś czasu, menu */
  var hdr = $('.hdr'), bar = $('.progress'), tl = $('.tl');
  var links = $$('.hdr__nav a[href^="#"]'), secs = $$('main section[id]');
  var ticking = false;
  function onScroll() {
    var y = w.pageYOffset || root.scrollTop, h = root.scrollHeight - w.innerHeight;
    if (bar) bar.style.setProperty('--p', h > 0 ? Math.min(Math.max(y / h, 0), 1).toFixed(4) : 0);
    if (hdr) hdr.classList.toggle('stuck', y > 8);
    var cur = '', line = w.innerHeight * 0.35;
    secs.forEach(function (s) { if (s.getBoundingClientRect().top <= line) cur = s.id; });
    links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + cur); });
    if (tl) { var r = tl.getBoundingClientRect(), k = (w.innerHeight * 0.6 - r.top) / r.height; tl.style.setProperty('--tp', Math.min(Math.max(k, 0), 1).toFixed(3)); }
    ticking = false;
  }
  w.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  w.addEventListener('resize', onScroll); onScroll();

  var btn = $('.hdr__btn'), nav = $('#nav');
  if (btn && nav) {
    var close = function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', function () { var o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* kopiowanie */
  var toast = $('#toast'), tt;
  function say(m) { if (!toast) return; toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('show'); }, 1800); }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.dataset.copy, ok = function () { say('Skopiowano: ' + v); };
      if (navigator.clipboard && w.isSecureContext) navigator.clipboard.writeText(v).then(ok, function () { say('Zaznacz i skopiuj: ' + v); });
      else {
        var t = d.createElement('textarea'); t.value = v; t.style.position = 'fixed'; t.style.opacity = '0'; d.body.appendChild(t); t.select();
        try { d.execCommand('copy'); ok(); } catch (_) { say('Zaznacz i skopiuj: ' + v); }
        d.body.removeChild(t);
      }
    });
  });

  /* formularz -> e-mail (strona niczego nie wysyła) */
  var f = $('#mailForm');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var g = function (id) { return $(id).value.trim(); };
    var body = 'Imię i nazwisko / firma: ' + g('#f-name') + '\nKontakt zwrotny: ' + g('#f-tel') + '\nTemat: ' + g('#f-topic') + '\n\n' + g('#f-msg') + '\n';
    say('Otwieram Twój program pocztowy…');
    w.location.href = 'mailto:wwieczor@gmail.com?subject=' + encodeURIComponent('Zapytanie ze strony WOJTEL – ' + g('#f-topic')) + '&body=' + encodeURIComponent(body);
  });
})();
