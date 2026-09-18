/* RGM Experiences — interacciones.
 * GSAP (ScrollTrigger, SplitText, Draggable, Inertia) + Lenis + flatpickr.
 * Cada bloque es independiente: si una librería no carga, la página sigue funcionando. */
(function () {
  'use strict';

  var I18N = window.RGM_I18N, CFG = window.RGM_CONFIG;
  var APTS = window.RGM_APARTMENTS || [], EXPS = window.RGM_EXPERIENCES || [];
  var TES = window.RGM_TESTIMONIALS || [], FAQ = window.RGM_FAQ || [], GAL = window.RGM_GALLERY || [];
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  if (gsap) {
    var plugins = [ST, window.SplitText, window.Draggable, window.InertiaPlugin].filter(Boolean);
    gsap.registerPlugin.apply(gsap, plugins);
  }

  /* ================= i18n ================= */
  var lang = ['es', 'en', 'pt'].indexOf(html.lang) > -1 ? html.lang : 'en';
  function t(key, vars) {
    var s = (I18N[lang] && I18N[lang][key]) || I18N.es[key] || '';
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }
  function L(obj) { return obj && typeof obj === 'object' ? (obj[lang] || obj.es) : obj; }
  function fmtNum(n) { return String(n).replace('.', lang === 'en' ? '.' : ','); }
  function waLink(text) { return 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(text); }

  function applyStatic() {
    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n'), { n: APTS.length }); });
    $$('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':'); el.setAttribute(p[0].trim(), t(p[1].trim()));
      });
    });
    document.title = t(PAGE === 'props' ? 'props.metaTitle' : 'meta.title');
    var md = $('meta[name="description"]'); if (md) md.setAttribute('content', t('meta.desc'));
    $$('.lang__btn').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false'); });
    $$('[data-wa="hello"]').forEach(function (a) { a.href = waLink(t('wa.hello')); });
    // config
    $$('[data-cfg="email"]').forEach(function (a) { a.textContent = CFG.email; a.href = 'mailto:' + CFG.email; });
    $$('[data-cfg="phone"]').forEach(function (a) { a.textContent = CFG.phoneLabel; });
    $$('[data-cfg="instagram"]').forEach(function (a) { a.href = CFG.instagram; });
    $$('[data-cfg="facebook"]').forEach(function (a) { a.href = CFG.facebook; });
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    $$('[data-count-apts-num]').forEach(function (el) { el.textContent = APTS.length; el.dataset.target = APTS.length; });
    $$('[data-count-exp-num]').forEach(function (el) { el.textContent = EXPS.length; el.dataset.target = EXPS.length; });
  }

  function setLang(next) {
    if (next === lang) return;
    lang = next; html.lang = next;
    try { localStorage.setItem('rgm-lang', next); } catch (e) { /* sin storage */ }
    renderAll();
    splitAll(false);
    if (ST) ST.refresh();
  }
  $$('.lang__btn').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
  });

  /* ================= Render de datos ================= */
  var arrowSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>';

  function renderZones() {
    var sel = $('[data-zones]'); if (!sel) return;
    var v = sel.value;
    sel.innerHTML = '<option value="">' + t('search.anywhere') + '</option>' +
      CFG.zones.map(function (z) { return '<option value="' + z.es + '">' + L(z) + '</option>'; }).join('');
    sel.value = v;
  }

  function renderApts() {
    var main = $('[data-apts-main]'), second = $('[data-apts-second]'), cards = $('[data-apts-cards]');
    if (!main) return;
    var zoneName = function (z) { var f = CFG.zones.filter(function (x) { return x.es === z; })[0]; return f ? L(f) : z; };
    main.innerHTML = APTS.map(function (a, i) {
      return '<div class="apts__slide" data-i="' + i + '">' +
        (a.badge ? '<span class="apts__badge">' + L(a.badge) + '</span>' : '') +
        '<img src="' + a.img + '" alt="' + a.name + '" ' + (i ? 'loading="lazy"' : '') + ' draggable="false"></div>';
    }).join('');
    second.innerHTML = APTS.map(function (a, i) {
      return '<div class="apts__second-img"><img src="' + a.img2 + '" alt="" loading="lazy" draggable="false"></div>';
    }).join('');
    cards.innerHTML = APTS.map(function (a) {
      return '<article class="apts__card">' +
        '<p class="eyebrow apts__zone">' + zoneName(a.zone) + '</p>' +
        '<h3 class="apts__name">' + t('apts.prefix') + ' <em>' + a.name + '</em></h3>' +
        '<p class="apts__tag">' + L(a.tag) + '</p>' +
        '<dl class="facts"><div><dt>' + t('apts.bedrooms') + '</dt><dd>' + a.bedrooms + '</dd></div>' +
        '<div><dt>' + t('apts.baths') + '</dt><dd>' + fmtNum(a.baths) + '</dd></div>' +
        '<div><dt>' + t('apts.sleeps') + '</dt><dd>' + a.sleeps + '</dd></div></dl>' +
        '<button type="button" class="link-cta" data-book-apt-i="' + APTS.indexOf(a) + '">' + t('apts.cta') + ' <span>→</span></button>' +
        '</article>';
    }).join('');
    $('[data-apts-total]').textContent = '/ ' + pad(APTS.length);
  }

  function renderExps() {
    var track = $('[data-exp-track]'); if (!track) return;
    track.innerHTML = EXPS.map(function (e, i) {
      return '<article class="exp-card" data-i="' + i + '">' +
        '<img src="' + e.img + '" alt="" loading="lazy" draggable="false">' +
        '<button type="button" class="exp-card__cta" data-book-exp-i="' + i + '" aria-label="' + t('exp.book') + ': ' + L(e.name) + '">' + arrowSvg + '</button>' +
        '<div class="exp-card__body">' +
        '<span class="exp-card__place">' + L(e.place) + '</span>' +
        '<h3 class="exp-card__name">' + L(e.name) + '</h3>' +
        '<p class="exp-card__text">' + L(e.text) + '</p>' +
        '<div class="exp-card__meta"><span>' + t('exp.duration') + '<br>' + L(e.duration) + '</span>' +
        '<button type="button" class="exp-card__add" data-book-exp-i="' + i + '">' + t('exp.book') + ' +</button></div>' +
        '</div></article>';
    }).join('');
    $('[data-exp-total]').textContent = '/ ' + pad(EXPS.length);
  }

  function renderTes() {
    var track = $('[data-tes-track]'); if (!track) return;
    var one = TES.map(function (r) {
      return '<article class="tes-card">' +
        '<div class="tes-card__stars"><span aria-label="5/5">★★★★★</span>' + (r.sample ? '<span class="tes-card__sample">' + t('tes.sample') + '</span>' : '') + '</div>' +
        '<p class="tes-card__quote">' + L(r.text) + '</p>' +
        '<button type="button" class="tes-card__more" hidden>' + t('tes.more') + '</button>' +
        '<div class="tes-card__who"><span class="tes-card__avatar">' + r.name.charAt(0) + '</span>' +
        '<div><div class="tes-card__name">' + r.name + '</div><div class="tes-card__where">' + r.where + '</div></div></div>' +
        '</article>';
    }).join('');
    track.innerHTML = one + one.replace(/<article class="tes-card"/g, '<article class="tes-card" aria-hidden="true"');
    $$('.tes-card').forEach(function (card) {
      var q = $('.tes-card__quote', card), b = $('.tes-card__more', card);
      if (q.scrollHeight > q.clientHeight + 4) b.hidden = false;
      b.addEventListener('click', function () {
        var open = card.classList.toggle('is-open');
        b.textContent = open ? t('tes.less') : t('tes.more');
        if (ST) ST.refresh();
      });
    });
  }

  function renderFaq() {
    var list = $('[data-faq]'); if (!list) return;
    list.innerHTML = FAQ.map(function (f, i) {
      return '<div class="faq__item"><button type="button" class="faq__q" aria-expanded="false" aria-controls="faq-a' + i + '" id="faq-q' + i + '">' +
        '<span>' + L(f.q) + '</span><span class="faq__plus" aria-hidden="true"></span></button>' +
        '<div class="faq__a" id="faq-a' + i + '" role="region" aria-labelledby="faq-q' + i + '"><p>' + L(f.a) + '</p></div></div>';
    }).join('');
    $$('.faq__q', list).forEach(function (q) {
      q.addEventListener('click', function () {
        var item = q.parentNode, a = q.nextElementSibling, open = !item.classList.contains('is-open');
        item.classList.toggle('is-open', open);
        q.setAttribute('aria-expanded', open);
        if (gsap && !reduced) gsap.to(a, { height: open ? 'auto' : 0, duration: .6, ease: 'power3.inOut', onComplete: function () { if (ST) ST.refresh(); } });
        else a.style.height = open ? 'auto' : '0';
      });
    });
  }

  function renderGallery() {
    var track = $('[data-gal-track]'); if (!track || track.children.length) return;
    track.innerHTML = GAL.map(function (src) { return '<figure class="gal__item" style="margin:0"><img src="' + src + '" alt="" loading="lazy"></figure>'; }).join('');
  }

  function renderAll() {
    applyStatic(); renderZones(); renderApts(); renderExps(); renderTes(); renderFaq(); renderGallery();
    updateGuestsLabel(); updateContactPh();
    if (PAGE === 'props') applyFilters();
    if (typeof booking !== 'undefined' && booking) booking.render();
    if (aptSlider) aptSlider.refresh();
    if (expSlider) expSlider.refresh();
    if (marquee) marquee.refresh();
    if (fp) { fp.set('locale', lang === 'en' ? 'default' : lang); if (fp.altInput) fp.altInput.placeholder = t('search.datesPh'); if (fp.selectedDates.length) fp.setDate(fp.selectedDates, false); }
  }

  /* ================= Split headings ================= */
  var splits = [];
  function splitAll(animate) {
    splits.forEach(function (s) { s.revert(); });
    splits = [];
    $$('[data-split]').forEach(function (el) {
      el.classList.add('is-split');
      if (!window.SplitText || reduced) return;
      var hero = el.getAttribute('data-split') === 'hero';
      var s = hero
        ? new SplitText(el, { type: 'words,chars', charsClass: 'split-char', wordsClass: 'split-word' })
        : new SplitText(el, { type: 'lines', linesClass: 'split-line-inner', mask: 'lines' });
      splits.push(s);
      if (!animate) return;
      if (hero) {
        gsap.from(s.chars, { yPercent: 110, opacity: 0, rotate: 4, duration: 1.1, ease: 'expo.out', stagger: .025, delay: .55 });
      } else {
        gsap.from(s.lines, {
          yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: .09,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      }
    });
  }

  /* ================= Lenis ================= */
  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    if (gsap && ST) {
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(tm) { lenis.raf(tm); requestAnimationFrame(raf); })(0);
    }
  }
  function scrollToEl(target) {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"], a[href^="./#"]');
    if (!a) return;
    var id = a.getAttribute('href').replace(/^\.\//, '');
    if (a.getAttribute('href').indexOf('./#') === 0 && PAGE !== 'home') return;
    if (id === '#') return;
    var target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    closeDrawer();
    var go = function () { scrollToEl(target); }; go.target = target;
    curtainTo(go);
  });

  /* ================= Curtain (transición) ================= */
  var curtain = $('[data-curtain]'), bars = [];
  if (curtain) {
    var n = window.innerWidth < 700 ? 10 : 18;
    for (var i = 0; i < n; i++) { var b = document.createElement('span'); b.className = 'curtain__bar'; curtain.appendChild(b); }
    bars = $$('.curtain__bar', curtain);
  }
  function curtainIn() {
    if (!gsap || !bars.length || reduced) { if (curtain) curtain.style.display = 'none'; return; }
    gsap.set(bars, { scaleY: 1, transformOrigin: '50% 0%' });
    gsap.to(bars, { scaleY: 0, duration: .9, ease: 'power4.inOut', stagger: { each: .035, from: 'center' }, delay: .1 });
  }
  function curtainTo(cb) {
    // salto largo: cubrimos, saltamos y descubrimos. Salto corto: scroll suave.
    var target = cb.target, far = target && Math.abs(target.getBoundingClientRect().top) > window.innerHeight * 1.6;
    if (!gsap || !bars.length || reduced || !far) { cb(); return; }
    gsap.timeline()
      .set(bars, { transformOrigin: '50% 100%' })
      .to(bars, { scaleY: 1, duration: .55, ease: 'power3.in', stagger: { each: .025, from: 'edges' } })
      .add(function () {
        if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
        else window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY);
      })
      .set(bars, { transformOrigin: '50% 0%' })
      .to(bars, { scaleY: 0, duration: .75, ease: 'power3.out', stagger: { each: .025, from: 'center' } }, '+=.15');
  }

  /* ================= Nav ================= */
  var nav = $('[data-nav]'), hero = $('#hero'), lastY = 0;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var heroH = hero ? hero.offsetHeight - 80 : 200;
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-hidden', y > heroH && y > lastY + 2 && !drawerOpen);
    if (y < lastY - 2) nav.classList.remove('is-hidden');
    lastY = y;
    var mc = $('.mobile-cta'); if (mc) mc.classList.toggle('is-visible', y > heroH);
    var wa = $('[data-wa-float]');
    if (wa && gsap) {
      var show = y > heroH * .6;
      if (wa._shown !== show) { wa._shown = show; gsap.to(wa, { autoAlpha: show ? 1 : 0, scale: show ? 1 : .6, duration: .4, ease: 'power2.out' }); }
    }
  }
  if (gsap) gsap.set('[data-wa-float]', { autoAlpha: 0, scale: .6 });
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Drawer */
  var drawer = $('[data-drawer]'), drawerOpen = false;
  function openDrawer() {
    if (!drawer) return;
    drawer.showModal ? drawer.showModal() : drawer.setAttribute('open', '');
    drawerOpen = true; if (lenis) lenis.stop();
    $('[data-drawer-open]').setAttribute('aria-expanded', 'true');
    if (gsap && !reduced) {
      gsap.fromTo(drawer, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .7, ease: 'power4.inOut' });
      gsap.from($$('.drawer__inner > *', drawer), { y: 30, opacity: 0, duration: .7, stagger: .06, delay: .25, ease: 'power3.out' });
    }
  }
  function closeDrawer() {
    if (!drawer || !drawerOpen) return;
    drawerOpen = false; if (lenis) lenis.start();
    $('[data-drawer-open]').setAttribute('aria-expanded', 'false');
    drawer.close ? drawer.close() : drawer.removeAttribute('open');
  }
  $('[data-drawer-open]').addEventListener('click', openDrawer);
  $('[data-drawer-close]').addEventListener('click', closeDrawer);
  if (drawer) drawer.addEventListener('close', function () { drawerOpen = false; if (lenis) lenis.start(); });

  /* ================= Búsqueda ================= */
  var guests = 2, fp = null;
  function updateGuestsLabel() {
    var l = $('[data-guests-label]'); if (!l) return;
    l.textContent = guests === 1 ? t('search.guest1') : t('search.guestN', { n: guests });
    $('[data-guests-count]').textContent = guests;
  }
  var pop = $('[data-guests-pop]'), tog = $('[data-guests-toggle]');
  function setPop(open) { pop.hidden = !open; tog.setAttribute('aria-expanded', open); }
  tog.addEventListener('click', function () { setPop(pop.hidden); });
  $('[data-guests-done]').addEventListener('click', function () { setPop(false); tog.focus(); });
  $$('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      guests = Math.max(1, Math.min(16, guests + parseInt(b.getAttribute('data-step'), 10)));
      updateGuestsLabel();
    });
  });
  document.addEventListener('click', function (e) { if (!pop.hidden && !e.target.closest('.search__field--guests')) setPop(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { setPop(false); tog.focus(); } });

  var PAGE = ($('.rgm-page') && $('.rgm-page').getAttribute('data-page')) || 'home';
  var PROPS_URL = 'propiedades.html';
  var toISO = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var parseISO = function (s) { var p = String(s || '').split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; };

  // Parámetros de búsqueda (?in=AAAA-MM-DD&out=AAAA-MM-DD&guests=N)
  var query = (function () {
    var q = {}; try { new URLSearchParams(location.search).forEach(function (v, k) { q[k] = v; }); } catch (e) {}
    return q;
  })();
  var filterDates = [];
  if (PAGE === 'props') {
    var qi = parseISO(query['in']), qo = parseISO(query.out);
    if (qi && qo && qo > qi) filterDates = [qi, qo];
    if (query.guests) guests = Math.max(1, Math.min(16, parseInt(query.guests, 10) || 2));
  }
  var guestsFiltered = PAGE === 'props' && !!query.guests;

  if (window.flatpickr) {
    fp = flatpickr('#s-dates', {
      mode: 'range', minDate: 'today', dateFormat: 'Y-m-d', altInput: true, altFormat: 'j M', showMonths: window.innerWidth > 760 ? 2 : 1,
      locale: lang === 'en' ? 'default' : lang, disableMobile: true, position: PAGE === 'props' ? 'below' : 'above',
      defaultDate: filterDates.length ? filterDates : null,
      onChange: function (sel) {
        if (PAGE !== 'props') return;
        if (sel.length === 2) { filterDates = sel.slice(); applyFilters(); }
        if (sel.length === 0) { filterDates = []; applyFilters(); }
      }
    });
  }
  function currentDates() { return fp && fp.selectedDates.length === 2 ? fp.selectedDates : []; }

  $('[data-search]').addEventListener('submit', function (e) {
    e.preventDefault();
    setPop(false);
    var d = currentDates();
    if (PAGE === 'props') {
      filterDates = d.slice(); guestsFiltered = true; applyFilters();
      var grid = $('[data-props-grid]'); if (grid) scrollToEl(grid.previousElementSibling || grid);
      return;
    }
    var params = [];
    if (d.length) params.push('in=' + toISO(d[0]), 'out=' + toISO(d[1]));
    params.push('guests=' + guests);
    goTo(PROPS_URL + '?' + params.join('&'));
  });

  /* ================= Listado de departamentos (/propiedades) ================= */
  function nightsBetween(a, b) { return Math.round((b - a) / 864e5); }
  function isFree(apt, d) {
    if (!d.length || !apt.booked) return true;
    return !apt.booked.some(function (r) {
      var bs = parseISO(r[0]), be = parseISO(r[1]);
      return d[0] < be && d[1] > bs; // se superponen
    });
  }
  function fmtRange(d) {
    if (!d.length) return '';
    var loc = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : 'es-AR';
    var f = function (x) { return x.toLocaleDateString(loc, { day: 'numeric', month: 'short' }); };
    return f(d[0]) + ' — ' + f(d[1]);
  }
  function applyFilters() {
    var grid = $('[data-props-grid]'); if (!grid) return;
    var d = filterDates;
    // Siempre se muestran todos: primero los que coinciden con la búsqueda.
    var fits = function (a) { return (!guestsFiltered || a.sleeps >= guests) && isFree(a, d); };
    var list = APTS.filter(fits).concat(APTS.filter(function (a) { return !fits(a); }));
    var zoneName = function (z) { var f = CFG.zones.filter(function (x) { return x.es === z; })[0]; return f ? L(f) : z; };
    grid.innerHTML = list.map(function (a) {
      return '<article class="prop">' +
        '<button type="button" class="prop__media" data-book-apt-i="' + APTS.indexOf(a) + '" tabindex="-1" aria-hidden="true">' +
          (a.badge ? '<span class="apts__badge">' + L(a.badge) + '</span>' : '') +
          '<img class="prop__img" src="' + a.img + '" alt="" loading="lazy">' +
          '<img class="prop__img prop__img--2" src="' + a.img2 + '" alt="" loading="lazy">' +
        '</button>' +
        '<div class="prop__body">' +
          '<p class="eyebrow prop__zone">' + zoneName(a.zone) + '</p>' +
          '<h2 class="prop__name">' + a.name + '</h2>' +
          '<p class="prop__tag">' + L(a.tag) + '</p>' +
          '<ul class="prop__facts"><li>' + a.bedrooms + ' ' + t('apts.bedrooms').toLowerCase() + '</li><li>' + fmtNum(a.baths) + ' ' + t('apts.baths').toLowerCase() + '</li><li>' + t('props.upTo', { n: a.sleeps }) + '</li></ul>' +
          '<div class="prop__foot"><button type="button" class="btn btn--small-inline" data-book-apt-i="' + APTS.indexOf(a) + '">' + t('props.cta') + '</button></div>' +
        '</div></article>';
    }).join('');
    $('[data-props-count]').textContent = list.length === 1 ? t('props.count1') : t('props.countN', { n: list.length });
    // chips
    var chips = [];
    if (d.length) chips.push('<button type="button" class="chip" data-chip="dates" aria-label="' + t('props.removeChip') + ': ' + fmtRange(d) + '">' + fmtRange(d) + ' <span aria-hidden="true">×</span></button>');
    if (guestsFiltered) chips.push('<button type="button" class="chip" data-chip="guests" aria-label="' + t('props.removeChip') + '">' + (guests === 1 ? t('search.guest1') : t('search.guestN', { n: guests })) + ' <span aria-hidden="true">×</span></button>');
    $('[data-props-chips]').innerHTML = chips.join('');
    $$('.props__meta [data-props-clear]').forEach(function (b) { b.hidden = !chips.length; });
    // URL compartible
    try {
      var qs = [];
      if (d.length) qs.push('in=' + toISO(d[0]), 'out=' + toISO(d[1]));
      if (guestsFiltered) qs.push('guests=' + guests);
      history.replaceState(null, '', location.pathname + (qs.length ? '?' + qs.join('&') : '') + location.hash);
    } catch (e) {}
    if (gsap && !reduced && applyFilters._ran) gsap.from($$('.prop', grid), { y: 30, opacity: 0, duration: .7, stagger: .06, ease: 'power3.out' });
    applyFilters._ran = true;
    if (ST) ST.refresh();
  }
  function clearFilters() {
    filterDates = []; guestsFiltered = false; guests = 2;
    if (fp) fp.clear();
    updateGuestsLabel(); applyFilters();
  }
  document.addEventListener('click', function (e) {
    var chip = e.target.closest && e.target.closest('[data-chip]');
    if (chip) {
      if (chip.getAttribute('data-chip') === 'dates') { filterDates = []; if (fp) fp.clear(); }
      else { guestsFiltered = false; guests = 2; updateGuestsLabel(); }
      applyFilters(); return;
    }
    if (e.target.closest && e.target.closest('[data-props-clear]')) clearFilters();
  });


  /* ================= Panel de consulta → WhatsApp del administrador ================= */
  var EXTRAS = window.RGM_EXTRAS || [];
  var LANG_NAMES = { es: 'Español', en: 'Inglés', pt: 'Portugués' };
  var booking = (function () {
    var dlg = $('[data-book-dialog]'); if (!dlg) return null;
    var form = $('[data-book-form]', dlg), sel = $('[data-book-apt]', dlg);
    var st = { apt: -1, guests: 2, extras: {}, exps: {} }, bfp = null;
    var fmtDay = function (d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); };

    if (window.flatpickr) {
      bfp = flatpickr('#b-dates', {
        mode: 'range', minDate: 'today', dateFormat: 'Y-m-d', altInput: true, altFormat: 'j M Y',
        locale: lang === 'en' ? 'default' : lang, disableMobile: true, appendTo: form, position: 'below',
        showMonths: window.innerWidth > 760 ? 2 : 1, onChange: function () { checkBusy(); }
      });
    }
    function apt() { return st.apt > -1 ? APTS[st.apt] : null; }
    function render() {
      sel.innerHTML = '<option value="-1">' + t('book.noApt') + '</option>' +
        APTS.map(function (a, i) { return '<option value="' + i + '">' + a.name + ' — ' + (function (z) { var f = CFG.zones.filter(function (x) { return x.es === z; })[0]; return f ? L(f) : z; })(a.zone) + '</option>'; }).join('');
      sel.value = String(st.apt);
      var a = apt();
      $('[data-book-stay]', dlg).hidden = false;
      // extras (cochera sólo si el depto tiene)
      var list = EXTRAS.filter(function (x) { return x.requires !== 'parking' || (a && a.parking); });
      Object.keys(st.extras).forEach(function (id) { if (!list.some(function (x) { return x.id === id; })) delete st.extras[id]; });
      $('[data-book-extras-wrap]', dlg).hidden = !a;
      $('[data-book-extras]', dlg).innerHTML = list.map(function (x) {
        return '<label class="check"><input type="checkbox" value="' + x.id + '"' + (st.extras[x.id] ? ' checked' : '') + ' data-book-extra><span>' + L(x.label) + '</span></label>';
      }).join('');
      $('[data-book-exps]', dlg).innerHTML = EXPS.map(function (e, i) {
        return '<label class="check check--exp"><input type="checkbox" value="' + i + '"' + (st.exps[i] ? ' checked' : '') + ' data-book-exp>' +
          '<img src="' + e.img + '" alt="" loading="lazy"><span><strong>' + L(e.name) + '</strong><small>' + L(e.duration) + ' · ' + L(e.place) + '</small></span></label>';
      }).join('');
      if (a && st.guests > a.sleeps) st.guests = a.sleeps;
      $('[data-book-guests]', dlg).textContent = st.guests;
      $('[data-book-max]', dlg).textContent = a ? t('book.maxGuests', { n: a.sleeps }) : '';
      if (bfp) { bfp.set('locale', lang === 'en' ? 'default' : lang); if (bfp.altInput) bfp.altInput.placeholder = t('book.datesPh'); if (bfp.selectedDates.length) bfp.setDate(bfp.selectedDates, false); }
      checkBusy();
    }
    function checkBusy() {
      var a = apt(), d = bfp ? bfp.selectedDates : [];
      $('[data-book-busy]', dlg).hidden = !(a && d.length === 2 && !isFree(a, d));
    }
    sel.addEventListener('change', function () { st.apt = parseInt(sel.value, 10); render(); });
    $$('[data-book-step]', dlg).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = apt(), max = a ? a.sleeps : 30;
        st.guests = Math.max(1, Math.min(max, st.guests + parseInt(b.getAttribute('data-book-step'), 10)));
        $('[data-book-guests]', dlg).textContent = st.guests;
      });
    });
    dlg.addEventListener('change', function (e) {
      if (e.target.hasAttribute('data-book-extra')) st.extras[e.target.value] = e.target.checked;
      if (e.target.hasAttribute('data-book-exp')) st.exps[e.target.value] = e.target.checked;
    });

    function open(opts) {
      opts = opts || {};
      if (opts.apt !== undefined) st.apt = opts.apt;
      if (opts.exp !== undefined) st.exps[opts.exp] = true;
      // hereda fechas y huéspedes de la búsqueda
      var d = (fp && fp.selectedDates.length === 2) ? fp.selectedDates : filterDates;
      if (bfp && d && d.length === 2 && bfp.selectedDates.length !== 2) bfp.setDate(d, false);
      if (typeof guests === 'number' && !opts.keepGuests) st.guests = guests;
      $('[data-book-msg]', dlg).textContent = '';
      render();
      dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
      if (lenis) lenis.stop();
      if (gsap && !reduced) gsap.fromTo(form, { xPercent: 12, opacity: 0 }, { xPercent: 0, opacity: 1, duration: .6, ease: 'power3.out' });
    }
    function close() { if (dlg.open) dlg.close(); }
    dlg.addEventListener('close', function () { if (lenis) lenis.start(); });
    $('[data-book-close]', dlg).addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var out = $('[data-book-msg]', dlg), a = apt();
      var name = form.name.value.trim();
      var exps = Object.keys(st.exps).filter(function (k) { return st.exps[k]; }).map(function (k) { return EXPS[k]; });
      if (!a && !exps.length) { out.textContent = t('book.errNothing'); sel.focus(); return; }
      if (!name) { out.textContent = t('book.errName'); form.name.focus(); return; }
      var d = bfp ? bfp.selectedDates : [];
      var lines = ['*Nueva consulta desde la web RGM*', ''];
      lines.push('• Departamento: ' + (a ? a.name + ' (' + a.zone + ')' : 'Sin alojamiento — solo experiencias'));
      lines.push('• Fechas: ' + (d.length === 2 ? fmtDay(d[0]) + ' → ' + fmtDay(d[1]) + ' (' + nightsBetween(d[0], d[1]) + ' noches)' : 'a definir'));
      lines.push('• Huéspedes: ' + st.guests);
      if (a) {
        var ex = EXTRAS.filter(function (x) { return st.extras[x.id]; }).map(function (x) { return x.label.es; });
        lines.push('• Extras: ' + (ex.length ? ex.join(', ') : 'ninguno'));
      }
      lines.push('• Experiencias: ' + (exps.length ? exps.map(function (x) { return x.name.es; }).join(', ') : 'ninguna'));
      if (a && d.length === 2 && !isFree(a, d)) lines.push('⚠ Figura ocupado en parte de esas fechas');
      lines.push('', '• Nombre: ' + name);
      if (form.phone.value.trim()) lines.push('• Teléfono: ' + form.phone.value.trim());
      lines.push('• Idioma del huésped: ' + LANG_NAMES[lang]);
      if (form.notes.value.trim()) lines.push('• Comentarios: ' + form.notes.value.trim());
      window.open(waLink(lines.join('\n')), '_blank', 'noopener');
      out.textContent = t('book.ok');
    });

    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-book-apt-i], [data-book-exp-i], [data-book-open]');
      if (!b) return;
      e.preventDefault();
      if (b.hasAttribute('data-book-apt-i')) open({ apt: parseInt(b.getAttribute('data-book-apt-i'), 10) });
      else if (b.hasAttribute('data-book-exp-i')) open({ exp: parseInt(b.getAttribute('data-book-exp-i'), 10) });
      else open({});
    });
    return { render: function () { if (dlg.open) render(); } };
  })();

  /* ================= Navegación entre páginas con transición ================= */
  function goTo(url) {
    if (!gsap || !bars.length || reduced) { location.href = url; return; }
    gsap.timeline()
      .set(bars, { transformOrigin: '50% 100%' })
      .to(bars, { scaleY: 1, duration: .6, ease: 'power3.in', stagger: { each: .025, from: 'edges' } })
      .add(function () { location.href = url; });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var href = a.getAttribute('href');
    if (!/^(\.\/|propiedades\.html)/.test(href)) return;
    // ./#seccion estando en la home → scroll interno
    if (PAGE === 'home' && href.indexOf('./#') === 0) return;
    e.preventDefault(); closeDrawer(); goTo(href);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted && bars.length && gsap) gsap.set(bars, { scaleY: 0 }); });

  /* ================= Contacto ================= */
  function updateContactPh() { /* placeholder se aplica vía data-i18n-attr */ }
  $('[data-contact]').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, out = $('[data-contact-msg]');
    var name = (f.first.value + ' ' + f.last.value).trim(), msg = f.msg.value.trim();
    if (!f.first.value.trim() || !msg) { out.textContent = t('ct.err'); (f.first.value.trim() ? f.msg : f.first).focus(); return; }
    var email = f.email.value.trim() ? ' (' + f.email.value.trim() + ')' : '';
    window.open(waLink('*Consulta desde la web RGM*\n• Nombre: ' + name + (f.email.value.trim() ? '\n• Email: ' + f.email.value.trim() : '') + '\n• Idioma del huésped: ' + LANG_NAMES[lang] + '\n• Mensaje: ' + msg), '_blank', 'noopener');
    out.textContent = t('ct.ok');
  });

  /* ================= Slider de departamentos ================= */
  var aptSlider = (function () {
    var stage = $('[data-apts]'); if (!stage) return null;
    var cur = 0, timer = null, AUTOPLAY = 6500;
    function els() { return { s: $$('.apts__slide', stage), c: $$('.apts__card', stage), t: $$('.apts__second-img', stage) }; }
    function mark(i) {
      var e = els();
      [e.s, e.c, e.t].forEach(function (list) { list.forEach(function (el, k) { el.classList.toggle('is-active', k === i); el.setAttribute('aria-hidden', k === i ? 'false' : 'true'); }); });
      e.c.forEach(function (card, k) { $$('a', card).forEach(function (a) { a.tabIndex = k === i ? 0 : -1; }); });
      $('[data-apts-curr]').textContent = pad(i + 1);
      $('[data-apts-live]').textContent = t('apts.live', { i: i + 1, n: APTS.length, name: APTS[i].name });
      var p = (i + 1) / APTS.length, fill = $('[data-apts-progress]');
      if (gsap) gsap.to(fill, { scaleX: p, duration: .8, ease: 'power3.out' }); else fill.style.transform = 'scaleX(' + p + ')';
    }
    function go(to, dir) {
      var n = APTS.length; if (n < 2) return;
      to = (to % n + n) % n; if (to === cur) return;
      dir = dir || (to > cur ? 1 : -1);
      var e = els(), from = cur; cur = to;
      if (gsap && !reduced) {
        var outs = [e.s[from], e.t[from]], ins = [e.s[to], e.t[to]];
        gsap.killTweensOf(outs.concat(ins, [e.c[from], e.c[to]]));
        gsap.set(ins, { zIndex: 2 }); gsap.set(outs, { zIndex: 1 });
        gsap.fromTo(ins, { clipPath: dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)', opacity: 1 }, { clipPath: 'inset(0 0 0 0%)', duration: 1.1, ease: 'expo.inOut', stagger: .08 });
        gsap.fromTo($$('img', ins[0]).concat($$('img', ins[1] || document.createElement('i'))), { scale: 1.18, xPercent: 6 * dir }, { scale: 1, xPercent: 0, duration: 1.5, ease: 'expo.out' });
        gsap.to(outs, { opacity: 0, duration: .01, delay: 1.1 });
        gsap.to(e.c[from], { autoAlpha: 0, y: -16, duration: .4, ease: 'power2.in' });
        gsap.fromTo(e.c[to], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', delay: .35 });
      }
      mark(to);
    }
    function play() { stop(); if (!reduced) timer = setInterval(function () { go(cur + 1, 1); }, AUTOPLAY); }
    function stop() { clearInterval(timer); }
    $('[data-apts-prev]').addEventListener('click', function () { go(cur - 1, -1); play(); });
    $('[data-apts-next]').addEventListener('click', function () { go(cur + 1, 1); play(); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(cur + 1, 1); play(); }
      if (e.key === 'ArrowLeft') { go(cur - 1, -1); play(); }
    });
    stage.addEventListener('mouseenter', stop); stage.addEventListener('mouseleave', play);
    stage.addEventListener('focusin', stop);

    // Drag / swipe con pointer events sobre la imagen principal
    var main = $('[data-apts-main]'), sx = 0, sy = 0, st = 0, dragging = false, locked = null;
    main.addEventListener('pointerdown', function (e) { if (e.button) return; dragging = true; locked = null; sx = e.clientX; sy = e.clientY; st = performance.now(); stop(); });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (locked === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (locked === 'x') { main.classList.add('is-dragging'); if (gsap) gsap.set($('.apts__slide.is-active img', main), { x: Math.max(-90, Math.min(90, dx * .35)) }); }
    });
    window.addEventListener('pointerup', function (e) {
      if (!dragging) return; dragging = false; main.classList.remove('is-dragging');
      var dx = e.clientX - sx, v = Math.abs(dx) / Math.max(1, performance.now() - st);
      if (gsap) gsap.to($('.apts__slide.is-active img', main), { x: 0, duration: .6, ease: 'power3.out' });
      if (locked === 'x' && (Math.abs(dx) > main.offsetWidth * .18 || v > .5)) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      play();
    });

    function refresh() {
      var e = els();
      if (gsap) { gsap.set(e.s.concat(e.t), { clearProps: 'all' }); gsap.set(e.c, { clearProps: 'all' }); }
      mark(Math.min(cur, APTS.length - 1));
    }
    refresh(); play();
    if (ST && gsap && !reduced) {
      gsap.to('.apts__second', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.apts', start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    return { refresh: refresh };
  })();

  /* ================= Carrusel de experiencias (Draggable + Inertia) ================= */
  var expSlider = (function () {
    var track = $('[data-exp-track]'), vp = $('[data-exp-viewport]'); if (!track) return null;
    var idx = 0, drag = null, positions = [];
    function measure() {
      var cards = $$('.exp-card', track);
      var maxX = Math.max(0, track.scrollWidth - vp.offsetWidth);
      positions = cards.map(function (c) { return -Math.min(c.offsetLeft, maxX); });
      return { minX: -maxX, maxX: 0 };
    }
    function nearest(x) {
      var best = 0; positions.forEach(function (p, i) { if (Math.abs(p - x) < Math.abs(positions[best] - x)) best = i; }); return best;
    }
    function update(i) {
      idx = i;
      $('[data-exp-curr]').textContent = pad(i + 1);
      $$('.exp-card', track).forEach(function (c, k) { c.classList.toggle('is-active', k === i); });
      var p = (i + 1) / EXPS.length, fill = $('[data-exp-progress]');
      if (gsap) gsap.to(fill, { scaleX: p, duration: .7, ease: 'power3.out' }); else fill.style.transform = 'scaleX(' + p + ')';
    }
    function goTo(i) {
      var b = measure(); i = Math.max(0, Math.min(EXPS.length - 1, i));
      // si la posición no cambia (final del track), igual avanzamos el índice
      if (gsap) gsap.to(track, { x: positions[i], duration: reduced ? 0 : 1, ease: 'expo.out', onUpdate: function () { if (drag) drag.update(); } });
      else track.style.transform = 'translateX(' + positions[i] + 'px)';
      update(i);
    }
    function build() {
      if (drag) drag.kill();
      var b = measure();
      if (window.Draggable && gsap) {
        drag = Draggable.create(track, {
          type: 'x', bounds: b, inertia: !!window.InertiaPlugin, edgeResistance: .85, dragClickables: false,
          allowNativeTouchScrolling: true, zIndexBoost: false,
          snap: function (v) { return positions[nearest(v)]; },
          onPress: function () { track.classList.add('is-dragging'); },
          onRelease: function () { track.classList.remove('is-dragging'); },
          onThrowComplete: function () { update(nearest(this.x)); },
          onDragEnd: function () { if (!window.InertiaPlugin) goTo(nearest(this.x)); }
        })[0];
      }
    }
    $('[data-exp-prev]').addEventListener('click', function () { goTo(idx - 1); });
    $('[data-exp-next]').addEventListener('click', function () { goTo(idx + 1); });
    function refresh() { build(); goTo(Math.min(idx, EXPS.length - 1)); }
    window.addEventListener('resize', function () { clearTimeout(refresh._t); refresh._t = setTimeout(refresh, 200); });
    refresh();
    return { refresh: refresh };
  })();

  /* ================= Marquee de testimonios ================= */
  var marquee = (function () {
    var track = $('[data-tes-track]'); if (!track || !gsap || reduced) return null;
    var tw = null;
    function refresh() {
      if (tw) tw.kill();
      gsap.set(track, { x: 0 });
      var half = track.scrollWidth / 2;
      tw = gsap.to(track, { x: -half, duration: half / 45, ease: 'none', repeat: -1 });
    }
    track.addEventListener('mouseenter', function () { if (tw) gsap.to(tw, { timeScale: 0, duration: .6 }); });
    track.addEventListener('mouseleave', function () { if (tw) gsap.to(tw, { timeScale: 1, duration: .6 }); });
    track.addEventListener('focusin', function () { if (tw) tw.pause(); });
    track.addEventListener('focusout', function () { if (tw) tw.resume(); });
    window.addEventListener('resize', function () { clearTimeout(refresh._t); refresh._t = setTimeout(refresh, 250); });
    refresh();
    return { refresh: refresh };
  })();

  /* ================= Scroll: hero, galería, reveals, contadores ================= */
  function scrollFx() {
    if (!gsap || !ST || reduced) return;

    // Hero: ken burns + parallax de salida
    if ($('.hero__img')) gsap.fromTo('.hero__img', { scale: 1.18 }, { scale: 1.04, duration: 2.6, ease: 'expo.out' });
    if ($('.hero')) gsap.to('.hero__media', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    if ($('.hero')) gsap.from(['.hero__stats > div', '.search'], { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: .12, delay: 1.1 });

    // Reveals (arrancan visibles; sólo se animan al entrar)
    $$('[data-reveal]').forEach(function (el, i) {
      gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: 'power3.out', delay: (i % 3) * .08, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    if ($('.exp-card')) gsap.from('.exp-card', { x: 120, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.exp__viewport', start: 'top 85%', once: true } });
    gsap.fromTo('.contact__img img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Contadores
    $$('[data-countup]').forEach(function (el) {
      var target = parseFloat(el.dataset.target || el.textContent) || 0, o = { v: 0 };
      ST.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () {
        gsap.to(o, { v: target, duration: 1.8, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
      } });
    });

    // Galería: pin + scroll horizontal
    var gal = $('[data-gallery]'), gtrack = $('[data-gal-track]');
    if (gal && gtrack) {
      var dist = function () { return Math.max(0, gtrack.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(gtrack).paddingLeft)); };
      gsap.to(gtrack, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: gal, start: 'top top', end: function () { return '+=' + dist(); },
          pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (self) { gsap.set('[data-gal-progress]', { scaleX: self.progress }); }
        }
      });
      $$('.gal__item img', gtrack).forEach(function (img) {
        img.addEventListener('load', function () { ST.refresh(); }, { once: true });
      });
    }
  }

  /* ================= Init ================= */
  renderAll();
  var start = function () {
    splitAll(true);
    scrollFx();
    curtainIn();
    onScroll();
    if (ST) ST.refresh();
  };
  if (document.fonts && document.fonts.ready) {
    var done = false, go = function () { if (!done) { done = true; start(); } };
    document.fonts.ready.then(go); setTimeout(go, 1500);
  } else start();
  window.addEventListener('load', function () { if (ST) ST.refresh(); });
})();
