/* WOJTEL — interakcje: spokojne, bez bibliotek. */
(function(){
  'use strict';
  var d=document,w=window,root=d.documentElement;
  var reduce=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(s,c){return (c||d).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};

  var yr=$('#yr'); if(yr) yr.textContent=new Date().getFullYear();

  /* odsłanianie przy przewijaniu */
  var rvs=$$('.rv,.meter,.step');
  rvs.forEach(function(el){
    var p=el.parentElement,i=p?Array.prototype.indexOf.call(p.children,el):0;
    el.style.setProperty('--st',(Math.min(i,5)*0.07).toFixed(2)+'s');
  });
  function show(el){el.classList.add('in'); if(el.matches('.cnt'))return;}
  if(reduce||!('IntersectionObserver' in w)){rvs.forEach(show)}
  else{
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){show(e.target);io.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    rvs.forEach(function(el){io.observe(el)});
  }

  /* liczniki */
  function fmt(n,sep){var s=String(n);return sep?s.replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0'):s}
  function years(iso){var s=new Date(iso),n=new Date(),y=n.getFullYear()-s.getFullYear();if(n.getMonth()<s.getMonth()||(n.getMonth()===s.getMonth()&&n.getDate()<s.getDate()))y--;return y}
  $$('.cnt').forEach(function(el){
    var target=el.dataset.years?years(el.dataset.years):parseInt(el.dataset.count,10),sep=el.dataset.sep==='1';
    if(isNaN(target))return;
    if(reduce||!('IntersectionObserver' in w)){el.textContent=fmt(target,sep);return}
    var done=false;
    var o=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting||done)return;done=true;o.disconnect();
      var t0=null,dur=target>1000?1600:1200;
      (function step(t){if(t0===null)t0=t;var k=Math.min((t-t0)/dur,1),v=Math.round(target*(1-Math.pow(1-k,3)));el.textContent=fmt(v,sep);if(k<1)requestAnimationFrame(step)})(performance.now());
    })},{threshold:.6});
    o.observe(el);
  });

  /* nagłówek: postęp, aktywna sekcja, menu */
  var hdr=$('.hdr'),bar=$('#rkBar'),btn=$('.hdr__btn'),nav=$('#nav');
  var links=$$('.hdr__nav a[data-s]'),secs=$$('main [data-sec]').filter(function(s){return s.id});
  var tl=$('#tl'),ticking=false;
  function onScroll(){
    var y=w.pageYOffset||root.scrollTop,h=root.scrollHeight-w.innerHeight,p=h>0?Math.min(Math.max(y/h,0),1):0;
    if(bar){bar.style.setProperty('--p',p.toFixed(4));bar.setAttribute('aria-valuenow',Math.round(p*100))}
    hdr&&hdr.classList.toggle('stuck',y>8);
    var cur=-1,line=w.innerHeight*.35;
    secs.forEach(function(s){var r=s.getBoundingClientRect();if(r.top<=line)cur=s.id});
    links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href').split('#')[1]===cur&&!!cur)});
    if(tl){var r=tl.getBoundingClientRect(),k=(w.innerHeight*.6-r.top)/r.height;tl.style.setProperty('--tp',Math.min(Math.max(k,0),1).toFixed(3))}
    if(!reduce)$$('[data-par]').forEach(function(el){el.style.transform='translate3d(0,'+(y*parseFloat(el.dataset.par)).toFixed(1)+'px,0)'});
    ticking=false;
  }
  w.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
  w.addEventListener('resize',onScroll);onScroll();
  if(btn&&nav){
    var close=function(){nav.classList.remove('open');btn.setAttribute('aria-expanded','false')};
    btn.addEventListener('click',function(){var o=nav.classList.toggle('open');btn.setAttribute('aria-expanded',o?'true':'false')});
    nav.addEventListener('click',function(e){if(e.target.closest('a'))close()});
    d.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
  }

  /* kopiowanie */
  var toast=$('#toast'),tt;
  function say(m){if(!toast)return;toast.textContent=m;toast.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){toast.classList.remove('show')},1800)}
  $$('[data-copy]').forEach(function(b){b.addEventListener('click',function(){
    var v=b.dataset.copy;
    function ok(){say('Skopiowano: '+v)}
    if(navigator.clipboard&&w.isSecureContext){navigator.clipboard.writeText(v).then(ok,function(){say('Zaznacz i skopiuj: '+v)})}
    else{var t=d.createElement('textarea');t.value=v;t.style.position='fixed';t.style.opacity='0';d.body.appendChild(t);t.select();try{d.execCommand('copy');ok()}catch(_){say('Zaznacz i skopiuj: '+v)}d.body.removeChild(t)}
  })});

  /* formularz -> mailto (nic nie jest wysyłane przez stronę) */
  var f=$('#mailForm');
  if(f)f.addEventListener('submit',function(e){
    e.preventDefault();
    var g=function(id){return $(id).value.trim()};
    var body='Imię i nazwisko / firma: '+g('#f-name')+'\nKontakt zwrotny: '+g('#f-tel')+'\nTemat: '+g('#f-topic')+'\n\n'+g('#f-msg')+'\n';
    var url='mailto:wwieczor@gmail.com?subject='+encodeURIComponent('Zapytanie ze strony WOJTEL – '+g('#f-topic'))+'&body='+encodeURIComponent(body);
    say('Otwieram Twój program pocztowy…');
    w.location.href=url;
  });
})();
