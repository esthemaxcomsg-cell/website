/* Animates every section as it scrolls into view: headlines rise word by word,
   text fades up, cards come in staggered and images ease into place.
   Runs last on every page so grids built by the page's own script are included. */
(function () {
  var CARDS = [
    '.cat-card', '.jelly-card', '.why-card', '.faq-item', '.rel-card', '.pcard', '.prod', '.post-card',
    '.feature', '.pillar', '.panel', '.acc', '.d-row', '.spec', '.fact', '.form-side', '.map-wrap',
    '.toolbar .pill', '.a-pdf', '.a-video'
  ].join(',');
  var HEADS = 'h1, h2, .sec-title';
  var TEXT = [
    'h3', 'h4', 'h5', 'h6', 'p', 'li', 'blockquote', 'label',
    '.eyebrow', '.sec-sub', '.crumbs', '.count-note',
    'a.btn-pink', 'a.btn-dark', 'a.btn-light', '.text-link', '.dark-link', '.prod-link', '.back-link',
    '.footer-grid > div', '.footer-base > *'
  ].join(',');
  var MEDIA = 'img, video, iframe';

  /* These run their own entrances, or must never be transformed. */
  var SKIP = '.site-header, header, .preloader, .hero-stage, .shop-hero, .home-hero, .lady-hero, .pdrn-stage, ' +
             '.gallery, .marquee, [data-no-reveal]';

  function free(el) {
    return !el.closest(SKIP) && !(el.parentElement && el.parentElement.closest('[data-reveal]')) &&
           !el.hasAttribute('data-reveal');
  }
  function tag(sel, kind) {
    [].slice.call(document.querySelectorAll(sel)).forEach(function (el) {
      if (free(el)) { el.setAttribute('data-reveal', kind); els.push(el); }
    });
  }

  var els = [];
  tag(CARDS, 'card');
  tag(HEADS, 'words');
  tag(TEXT, 'text');
  tag(MEDIA, 'media');
  els = els.filter(function (el) {            // nothing that contains another revealed element
    if (el.getAttribute('data-reveal') === 'card') return true;
    if (el.querySelector('[data-reveal]')) { el.removeAttribute('data-reveal'); return false; }
    return true;
  });
  if (!els.length) return;

  /* Split headlines into masked words (keeps <br>, <em> and other inline tags). */
  function splitWords(root) {
    var n = 0, walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(function (tn) {
      if (!tn.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      tn.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var outer = document.createElement('span'), inner = document.createElement('span');
        outer.className = 'rw'; inner.className = 'rw-i';
        inner.style.setProperty('--w', n++);
        inner.textContent = part;
        outer.appendChild(inner); frag.appendChild(outer);
      });
      tn.parentNode.replaceChild(frag, tn);
    });
  }
  els.forEach(function (el) { if (el.getAttribute('data-reveal') === 'words') splitWords(el); });

  document.documentElement.classList.add('reveal-ready');

  /* Stagger each element against its revealed siblings. */
  els.forEach(function (el) {
    var sibs = [].slice.call(el.parentElement.children).filter(function (c) { return c.hasAttribute('data-reveal'); });
    var step = el.getAttribute('data-reveal') === 'card' ? 90 : 70;
    el.style.transitionDelay = Math.min(sibs.indexOf(el) * step, 540) + 'ms';
  });

  var pending = els.slice();

  function show(el) {
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in');
    var i = pending.indexOf(el);
    if (i > -1) pending.splice(i, 1);
    /* once settled, hand the element back to its own styles (hover lifts etc.) */
    if (el.getAttribute('data-reveal') !== 'words') {
      setTimeout(function () {
        el.removeAttribute('data-reveal');
        el.style.transitionDelay = '';
      }, 1700 + (parseInt(el.style.transitionDelay, 10) || 0));
    }
  }

  /* Safety net: anything sitting in the viewport is revealed even if the
     observer never fires (background tabs, observer unavailable). */
  function sweep() {
    pending.slice().forEach(function (el) {
      var r = el.getBoundingClientRect();
      if ((r.width || r.height) && r.top < window.innerHeight * 0.94 && r.bottom > 0) show(el);
    });
  }

  if (!('IntersectionObserver' in window)) { els.forEach(show); return; }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      show(entry.target);
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  els.forEach(function (el) { io.observe(el); });

  addEventListener('scroll', sweep, { passive: true });
  addEventListener('resize', sweep);
  addEventListener('load', sweep);
  addEventListener('click', function () { setTimeout(sweep, 80); });
  document.addEventListener('visibilitychange', sweep);
  sweep();
})();
