/* Fades content up as it scrolls into view. Runs last on every page so that
   product grids built by the page's own script are picked up too. */
(function () {
  var TARGETS = [
    '.sec-head', '.sec-sub',
    '.cat-card', '.jelly-card', '.why-card', '.faq-item', '.rel-card', '.pcard',
    '.feature', '.pillar', '.panel', '.acc', '.d-row',
    '.band-in > *', '.ritual-copy > *', '.about-img', '.story > *',
    '.mobile-facts .fact', '.count-note', '.crumbs',
    '.page-hero .ph-in > *', '.contact-hero > *', '.form-side > *',
    '.collection-hero .hero-copy > *',
    '.top > *', '.specs .spec',
    '.news-in > *', '.footer-grid > div', '.footer-base > *',
    '.cta-in > *', '.toolbar .pill'
  ].join(',');

  /* The homepage hero and the shop video hero run their own entrances. */
  var SKIP = '.hero-stage, .shop-hero, .home-hero, .lady-hero, .pdrn-stage, .prod';

  var els = [].slice.call(document.querySelectorAll(TARGETS)).filter(function (el) {
    return !el.closest(SKIP);
  });
  if (!els.length) return;

  document.documentElement.classList.add('reveal-ready');
  els.forEach(function (el) { el.setAttribute('data-reveal', ''); });

  /* Stagger each element against its revealed siblings. */
  els.forEach(function (el) {
    var sibs = [].slice.call(el.parentElement.children).filter(function (c) {
      return c.hasAttribute('data-reveal');
    });
    el.style.transitionDelay = Math.min(sibs.indexOf(el) * 70, 420) + 'ms';
  });

  var pending = els.slice();

  function show(el) {
    el.classList.add('is-in');
    var i = pending.indexOf(el);
    if (i > -1) pending.splice(i, 1);
  }

  /* Safety net: anything sitting in the viewport is revealed even if the
     observer never fires (background tabs, observer unavailable). */
  function sweep() {
    pending.slice().forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.94 && r.bottom > 0) show(el);
    });
  }

  if (!('IntersectionObserver' in window)) {
    els.forEach(show);
    return;
  }

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
  document.addEventListener('visibilitychange', sweep);
  sweep();
})();
