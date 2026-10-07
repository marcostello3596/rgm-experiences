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
  // Versión liviana (800px) para tarjetas y miniaturas: menos memoria y decodificación más rápida al scrollear
  function sm(src) { return /^img\/(apts\/|exp-)/.test(src) ? src.replace(/^img\//, 'img/sm/') : src; }
  function fmtNum(n) { return n == null ? '—' : String(n).replace('.', lang === 'en' ? '.' : ','); }
  // Departamento vs casa, monoambiente y datos sin cargar (null)
  function aptPrefix(a) { return a.kind === 'house' ? t('apts.prefixHouse') : t('apts.prefix'); }
  function aptLabel(a) { return a.kind === 'house' ? t('apts.prefixHouse') + ' ' + a.name : a.name; }
  function fmtRooms(n) { return n === 0 ? t('apts.studio') : fmtNum(n); }
  function maxGuests(a) { return a && a.sleeps ? a.sleeps : 12; }
  function waLink(text) { return 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(text); }

  function applyStatic() {
    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n'), { n: APTS.length }); });
    $$('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':'); el.setAttribute(p[0].trim(), t(p[1].trim()));
      });
    });
    document.title = PAGE === 'exp' && CUR_EXP ? t('x.metaTitle', { name: L(CUR_EXP.name) }) : PAGE === 'apt' && CUR_APT ? t(CUR_APT.kind === 'house' ? 'apt.metaTitleHouse' : 'apt.metaTitle', { name: CUR_APT.name, zone: CUR_APT.zone }) : t(PAGE === 'props' ? 'props.metaTitle' : PAGE === 'exps' ? 'xs.metaTitle' : 'meta.title');
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
    $$('[data-hero-count]').forEach(function (el) { el.textContent = t('hero.count', { n: APTS.length, m: EXPS.length }); });
    rollify();
  }
  // Links y botones de texto: el texto "rueda" al pasar el mouse (ver .roll en v2.css)
  function rollify() {
    $$('.nav__links a, .footer__list a, .drawer__link, .btn:not(.btn--wa), .props__clear').forEach(function (el) {
      if (el.children.length || !el.textContent.trim()) return;
      el.innerHTML = '<span class="roll"><span>' + esc(el.textContent) + '</span></span>';
    });
  }

  function setLang(next) {
    if (next === lang) return;
    lang = next; html.lang = next;
    try { localStorage.setItem('rgm-lang', next); } catch (e) { /* sin storage */ }
    // Deshacer SplitText ANTES de cambiar los textos: revert() restaura el HTML
    // original y, si se hace después, vuelve a poner el idioma anterior.
    splits.forEach(function (s) { s.revert(); });
    splits = [];
    renderAll();
    splitAll(false);
    if (ST) ST.refresh();
    try { document.dispatchEvent(new CustomEvent('rgm:lang')); } catch (e) { /* navegadores viejos */ }
  }
  $$('.lang__btn').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
  });

  /* ================= Render de datos ================= */
  // Las fuentes no traen flechas ni ⌂: van como SVG
  var ARR = '<svg class="arr" viewBox="0 0 18 10" aria-hidden="true"><path d="M0 5h16.5M12.5 1l4 4-4 4"/></svg>';
  var HOUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 7.5L8 3l5.5 4.5V13h-11z"/></svg>';
  var PEAKS = '<svg viewBox="0 0 64 14" aria-hidden="true"><path d="M1 13 L14 3 L21 8 L31 1 L41 9 L47 5 L63 13"/></svg>';
  var esc = function (x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
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
    // La columna izquierda es un mapa (se crea una sola vez; no se rehace al cambiar de idioma)
    if (!$('[data-apts-map]', main)) main.innerHTML = '<div class="apts__map" data-apts-map></div><span class="apts__badge" data-apts-badge hidden></span>';
    second.innerHTML = APTS.map(function (a, i) {
      return '<div class="apts__second-img"><img decoding="async" src="' + sm(a.img2) + '" alt="" loading="lazy" draggable="false"></div>';
    }).join('');
    cards.innerHTML = APTS.map(function (a) {
      return '<article class="apts__card">' +
        '<p class="eyebrow apts__zone">' + zoneName(a.zone) + '</p>' +
        '<h3 class="apts__name">' + aptPrefix(a) + ' <em>' + a.name + '</em></h3>' +
        '<p class="apts__tag">' + L(a.tag) + '</p>' +
        '<dl class="facts"><div><dt>' + t('apts.bedrooms') + '</dt><dd>' + fmtRooms(a.bedrooms) + '</dd></div>' +
        '<div><dt>' + t('apts.baths') + '</dt><dd>' + fmtNum(a.baths) + '</dd></div>' +
        '<div><dt>' + t('apts.sleeps') + '</dt><dd>' + fmtNum(a.sleeps) + '</dd></div></dl>' +
        '<a class="link-cta" href="' + aptURL(a) + '">' + t('apts.cta') + ' ' + ARR + '</a>' +
        '</article>';
    }).join('');
    $('[data-apts-total]').textContent = '/ ' + pad(APTS.length);
  }

  /* ---------- Home: departamentos de la ciudad sobre el mapa ilustrado ---------- */
  var MAPD = window.RGM_MAP || null;
  function mapXY(lat, lon) { return [(lon - MAPD.box[2]) * MAPD.kx, (MAPD.box[0] - lat) * MAPD.ky]; }
  function cityApts() { return APTS.map(function (a, i) { return { a: a, i: i }; }).filter(function (o) { return o.a.kind !== 'house' && o.a.coords; }); }
  // minutos caminando (distancia en línea recta × 1,3 por la cuadrícula, a 75 m/min)
  function walkMin(m) { return Math.max(1, Math.round(m * 1.3 / 75)); }
  function distToLine(p, line) {
    var best = Infinity;
    for (var k = 0; k < line.length - 1; k++) {
      var a = mapXY(line[k][0], line[k][1]), b = mapXY(line[k + 1][0], line[k + 1][1]);
      var dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1;
      var u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
      var x = a[0] + u * dx - p[0], y = a[1] + u * dy - p[1];
      best = Math.min(best, Math.sqrt(x * x + y * y));
    }
    return best;
  }
  function walks(a) {
    var p = mapXY(a.coords[0], a.coords[1]), pi = mapXY(MAPD.plazas.Independencia[0], MAPD.plazas.Independencia[1]);
    return [
      ['where.indep', walkMin(Math.hypot(p[0] - pi[0], p[1] - pi[1]))],
      ['where.peat', walkMin(distToLine(p, MAPD.peatonal))],
      ['where.arist', walkMin(distToLine(p, MAPD.aristides))]
    ];
  }
  function renderWhere() {
    var list = $('[data-wlist]'); if (!list || !MAPD) return;
    var zoneName = function (z) { var f = CFG.zones.filter(function (x) { return x.es === z; })[0]; return f ? L(f) : z; };
    list.innerHTML = cityApts().map(function (o, k) {
      var a = o.a, facts = [
        a.bedrooms === 0 ? t('apts.studio') : a.bedrooms != null ? a.bedrooms + ' ' + t(a.bedrooms === 1 ? 'apts.bedroom1' : 'apts.bedrooms').toLowerCase() : '',
        a.sleeps ? t('props.upTo', { n: a.sleeps }) : ''
      ].filter(Boolean).join(' · ');
      return '<li class="wcard" data-k="' + k + '">' +
        '<a class="wcard__img" href="' + aptURL(a) + '" tabindex="-1" aria-hidden="true" data-cursor="cur.view"><img decoding="async" src="' + sm(a.img) + '" alt="" loading="lazy">' +
          (a.badge ? '<span class="wcard__badge">' + esc(L(a.badge)) + '</span>' : '') + '</a>' +
        '<div class="wcard__body">' +
          '<p class="wcard__n"><span>' + pad(k + 1) + '</span>' + esc(zoneName(a.zone)) + '</p>' +
          '<h3 class="wcard__name"><a href="' + aptURL(a) + '">' + aptPrefix(a) + ' <em>' + esc(a.name) + '</em></a></h3>' +
          '<p class="wcard__tag">' + esc(L(a.tag)) + '</p>' +
          '<ul class="wcard__walk" aria-label="' + esc(t('where.walk')) + '">' + walks(a).map(function (w) { return '<li><b>' + w[1] + ' min</b>' + esc(t(w[0])) + '</li>'; }).join('') + '</ul>' +
          (facts ? '<p class="wcard__facts">' + esc(facts) + '</p>' : '') +
        '</div></li>';
    }).join('');
    if (typeof wmap !== 'undefined' && wmap) wmap.labels();
  }
  function renderCasa() {
    var dl = $('[data-casa-facts]'); if (!dl) return;
    var h = APTS.filter(function (a) { return a.kind === 'house'; })[0]; if (!h) return;
    dl.innerHTML = [['apts.bedrooms', fmtRooms(h.bedrooms)], ['apts.baths', fmtNum(h.baths)], ['apts.sleeps', fmtNum(h.sleeps)]]
      .map(function (f) { return '<div><dt>' + t(f[0]) + '</dt><dd>' + f[1] + '</dd></div>'; }).join('');
  }
  // Experiencias en la home: tarjetas (carrusel en celular, grilla en escritorio)
  function renderXgrid() {
    var g = $('[data-xgrid]'); if (!g) return;
    g.innerHTML = EXPS.map(function (e, i) {
      return '<li class="xcard">' +
        '<a class="xcard__img" href="' + expURL(e) + '" tabindex="-1" aria-hidden="true" data-cursor="cur.view"><img decoding="async" src="' + sm(e.img) + '" alt="" loading="lazy"><span class="xcard__n">' + pad(i + 1) + '</span></a>' +
        '<div class="xcard__body"><h3 class="xcard__name"><a href="' + expURL(e) + '">' + esc(L(e.name)) + '</a></h3>' +
        '<p class="xcard__meta">' + esc(L(e.place)) + '<br>' + esc(L(e.duration)) + '</p>' +
        '<button type="button" class="xcard__add" data-book-exp-i="' + i + '" aria-label="' + esc(t('exp.book') + ': ' + L(e.name)) + '">+</button></div>' +
        '</li>';
    }).join('');
  }

  function renderTes() {
    var track = $('[data-tes-track]'); if (!track) return;
    var real = TES.filter(function (r) { return !r.sample; }), sec = $('#testimonios');
    if (sec) sec.hidden = !real.length;
    if (!real.length) { track.innerHTML = ''; return; }
    var one = real.map(function (r) {
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

  function renderTicker() {
    var track = $('[data-ticker]'); if (!track) return;
    var one = EXPS.map(function (e) { return '<span class="ticker__item">' + esc(L(e.name)) + PEAKS + '</span>'; }).join('');
    track.innerHTML = '<div class="ticker__run">' + one + '</div><div class="ticker__run">' + one + '</div>';
  }

  function renderGallery() {
    var track = $('[data-gal-track]'); if (!track || track.children.length) return;
    track.innerHTML = '<div class="gal__intro"><h2 class="h2" data-i18n-html="gal.title">' + t('gal.title') + '</h2>' +
      '<p class="gal__hint"><span data-i18n="gal.hint">' + t('gal.hint') + '</span> ' + ARR + '</p></div>' +
      GAL.map(function (src, i) { return '<figure class="gal__item" style="margin:0"><img decoding="async" src="' + src + '" alt="" loading="lazy"><figcaption>' + pad(i + 1) + ' / ' + pad(GAL.length) + '</figcaption></figure>'; }).join('');
  }

  function renderAll() {
    applyStatic(); renderZones(); renderApts(); renderWhere(); renderXgrid(); renderCasa(); renderTes(); renderFaq(); renderGallery(); renderTicker();
    updateGuestsLabel(); updateContactPh();
    if (PAGE === 'props') applyFilters();
    if (typeof booking !== 'undefined' && booking) booking.render();
    if (typeof aptPage !== 'undefined' && aptPage) aptPage.render();
    if (typeof expPage !== 'undefined' && expPage) expPage.render();
    if (typeof expsPage !== 'undefined' && expsPage) expsPage.render();
    if (typeof fixLinks === 'function') fixLinks();
    if (aptSlider) aptSlider.refresh();
    if (expSlider) expSlider.refresh();
    if (marquee) marquee.refresh();
    if (fp) { fp.set('locale', lang === 'en' ? 'default' : lang); if (fp.altInput) fp.altInput.placeholder = fp.input.getAttribute('placeholder') || t('search.datesPh'); if (fp.selectedDates.length) fp.setDate(fp.selectedDates, false); }
    rollify(); cursorTargets();
    if (typeof hero2 !== 'undefined' && hero2) hero2.fit();
    if (typeof introFx !== 'undefined' && introFx) introFx.split();
  }

  /* ================= Split headings ================= */
  var splits = [], wordSplit = null;
  function splitAll(animate) {
    splits.forEach(function (s) { s.revert(); });
    splits = [];
    $$('[data-split]').forEach(function (el) {
      el.classList.add('is-split');
      if (!window.SplitText || reduced) return;
      var hero = el.getAttribute('data-split') === 'hero';
      var s = hero
        ? new SplitText(el, { type: 'chars', charsClass: 'split-char' })
        : new SplitText(el, { type: 'lines', linesClass: 'split-line-inner', mask: 'lines' });
      splits.push(s);
      if (hero) { wordSplit = s; return; }
      if (!animate) return;
      {
        gsap.from(s.lines, {
          yPercent: 125, duration: 1.2, ease: 'expo.out', stagger: .09,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      }
    });
  }

  /* ================= Lenis ================= */
  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({
      lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false,
      prevent: function (node) { return !!(node.closest && node.closest('[data-lenis-prevent], dialog')); }
    });
    if (gsap && ST) {
      ST.config({ ignoreMobileResize: true });
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
  // Primera visita de la sesión: contador de carga sobre la cortina
  var loader = (function () {
    var first = false;
    try { first = !sessionStorage.getItem('rgm-seen'); sessionStorage.setItem('rgm-seen', '1'); } catch (e) { first = false; }
    if (!first || !curtain || !gsap || reduced) return null;
    var box = document.createElement('div'); box.className = 'curtain__load';
    box.innerHTML = '<span class="curtain__brand">RGM Experiences — <span data-i18n="load.label">' + t('load.label') + '</span></span><span class="curtain__num">0</span>';
    curtain.appendChild(box);
    var num = $('.curtain__num', box), o = { v: 0 }, waiting = null, done = false;
    gsap.to(o, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: function () { num.textContent = Math.round(o.v); },
      onComplete: function () { done = true; if (waiting) finish(waiting); } });
    function finish(cb) { gsap.to(box, { opacity: 0, y: -20, duration: .45, ease: 'power2.in', onComplete: function () { box.remove(); cb(); } }); }
    return { then: function (cb) { if (done) finish(cb); else waiting = cb; } };
  })();
  function curtainIn(onLift) {
    if (!gsap || !bars.length || reduced) { if (curtain) curtain.style.display = 'none'; if (onLift) onLift(); return; }
    var lift = function () {
      gsap.set(bars, { scaleY: 1, transformOrigin: '50% 0%' });
      gsap.to(bars, { scaleY: 0, duration: 1, ease: 'power4.inOut', stagger: { each: .03, from: 'center' }, delay: .05, onComplete: curtainOff });
      if (onLift) gsap.delayedCall(.35, onLift);
    };
    if (loader) loader.then(lift); else lift();
  }
  function curtainOn() { if (curtain) curtain.style.visibility = 'visible'; }
  function curtainOff() { if (curtain) curtain.style.visibility = 'hidden'; }
  function curtainTo(cb) {
    // salto largo: cubrimos, saltamos y descubrimos. Salto corto: scroll suave.
    var target = cb.target, far = target && Math.abs(target.getBoundingClientRect().top) > window.innerHeight * 1.6;
    if (!gsap || !bars.length || reduced || !far) { cb(); return; }
    curtainOn();
    gsap.timeline({ onComplete: curtainOff })
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
  var nav = $('[data-nav]'), hero = $('#hero'), lastY = 0, heroH = 200, ticking = false;
  var mcEl = $('.mobile-cta'), waEl = $('[data-wa-float]'), st = {};
  function measure() { heroH = hero ? hero.offsetHeight - 80 : 200; }
  function flag(el, cls, on, key) { if (el && st[key] !== on) { st[key] = on; el.classList.toggle(cls, on); } }
  function onScroll() {
    ticking = false;
    var y = lenis ? lenis.scroll : (window.scrollY || window.pageYOffset);
    flag(nav, 'is-solid', y > 40, 'solid');
    if (y > lastY + 2 && y > heroH && !drawerOpen) flag(nav, 'is-hidden', true, 'hidden');
    else if (y < lastY - 2 || y <= heroH) flag(nav, 'is-hidden', false, 'hidden');
    lastY = y;
    flag(mcEl, 'is-visible', y > heroH, 'mc');
    if (waEl && gsap) {
      var show = y > heroH * .6;
      if (waEl._shown !== show) { waEl._shown = show; gsap.to(waEl, { autoAlpha: show ? 1 : 0, scale: show ? 1 : .6, duration: .4, ease: 'power2.out', overwrite: true }); }
    }
  }
  function queueScroll() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  if (gsap) gsap.set('[data-wa-float]', { autoAlpha: 0, scale: .6 });
  measure();
  window.addEventListener('resize', function () { measure(); queueScroll(); });
  window.addEventListener('load', measure);
  if (lenis) lenis.on('scroll', queueScroll); else window.addEventListener('scroll', queueScroll, { passive: true });

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
    l.textContent = l.hasAttribute('data-short') ? guests : guests === 1 ? t('search.guest1') : t('search.guestN', { n: guests });
    $('[data-guests-count]').textContent = guests;
  }
  var pop = $('[data-guests-pop]'), tog = $('[data-guests-toggle]');
  function setPop(open) { if (!pop) return; pop.hidden = !open; tog.setAttribute('aria-expanded', open); }
  if (pop && tog) {
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
  }

  var PAGE = ($('.rgm-page') && $('.rgm-page').getAttribute('data-page')) || 'home';
  var CUR_APT = PAGE === 'apt' ? APTS.filter(function (a) { return a.slug === $('.rgm-page').getAttribute('data-slug'); })[0] : null;
  var CUR_EXP = PAGE === 'exp' ? EXPS.filter(function (x) { return x.slug === $('.rgm-page').getAttribute('data-slug'); })[0] : null;
  var expURL = function (x) { return 'experiencias/' + x.slug + '/'; };
  var PROPS_URL = 'propiedades/';
  var aptURL = function (a) { return 'propiedades/' + a.slug + '/'; };
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

  if (window.flatpickr && $('#s-dates')) {
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

  if ($('[data-search]')) $('[data-search]').addEventListener('submit', function (e) {
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
    var fits = function (a) { return (!guestsFiltered || !a.sleeps || a.sleeps >= guests) && isFree(a, d); };
    var list = APTS.filter(fits).concat(APTS.filter(function (a) { return !fits(a); }));
    var zoneName = function (z) { var f = CFG.zones.filter(function (x) { return x.es === z; })[0]; return f ? L(f) : z; };
    grid.innerHTML = list.map(function (a) {
      return '<article class="prop">' +
        '<a class="prop__media" href="' + aptURL(a) + '" tabindex="-1" aria-hidden="true">' +
          (a.badge ? '<span class="apts__badge">' + L(a.badge) + '</span>' : '') +
          '<img decoding="async" class="prop__img" src="' + sm(a.img) + '" alt="" loading="lazy">' +
          '<img decoding="async" class="prop__img prop__img--2" src="' + sm(a.img2) + '" alt="" loading="lazy">' +
        '</a>' +
        '<div class="prop__body">' +
          '<p class="eyebrow prop__zone">' + zoneName(a.zone) + '</p>' +
          '<h2 class="prop__name"><a href="' + aptURL(a) + '">' + aptLabel(a) + '</a></h2>' +
          '<p class="prop__tag">' + L(a.tag) + '</p>' +
          '<ul class="prop__facts">' + [
            a.bedrooms === 0 ? t('apts.studio') : a.bedrooms != null ? a.bedrooms + ' ' + t(a.bedrooms === 1 ? 'apts.bedroom1' : 'apts.bedrooms').toLowerCase() : '',
            a.baths != null ? fmtNum(a.baths) + ' ' + t(a.baths === 1 ? 'apts.bath1' : 'apts.baths').toLowerCase() : '',
            a.sleeps ? t('props.upTo', { n: a.sleeps }) : ''
          ].filter(Boolean).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
          '<div class="prop__foot"><a class="btn btn--outline btn--small-inline" href="' + aptURL(a) + '">' + t(a.kind === 'house' ? 'apt.viewHouse' : 'apt.view') + '</a><button type="button" class="btn btn--small-inline" data-book-apt-i="' + APTS.indexOf(a) + '">' + t('props.cta') + '</button></div>' +
        '</div></article>';
    }).join('');
    $('[data-props-count]').textContent = list.length === 1 ? t('props.count1') : t('props.countN', { n: list.length });
    // chips
    var chips = [];
    if (d.length) chips.push('<button type="button" class="chip" data-chip="dates" aria-label="' + t('props.removeChip') + ': ' + fmtRange(d) + '">' + fmtRange(d) + ' <span aria-hidden="true">×</span></button>');
    if (guestsFiltered) chips.push('<button type="button" class="chip" data-chip="guests" aria-label="' + t('props.removeChip') + '">' + (guests === 1 ? t('search.guest1') : t('search.guestN', { n: guests })) + ' <span aria-hidden="true">×</span></button>');
    $('[data-props-chips]').innerHTML = chips.join('');
    $$('.props__meta [data-props-clear]').forEach(function (b) { b.hidden = !chips.length; });
    rollify(); cursorTargets();
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
        locale: lang === 'en' ? 'default' : lang, disableMobile: true, inline: true, appendTo: $('[data-book-cal]', dlg),
        showMonths: 1, onChange: function () { checkBusy(); }
      });
    }
    function apt() { return st.apt > -1 ? APTS[st.apt] : null; }
    function render() {
      sel.innerHTML = '<option value="-1">' + t('book.noApt') + '</option>' +
        APTS.map(function (a, i) { return '<option value="' + i + '">' + aptLabel(a) + ' — ' + (function (z) { var f = CFG.zones.filter(function (x) { return x.es === z; })[0]; return f ? L(f) : z; })(a.zone) + '</option>'; }).join('');
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
          '<img decoding="async" src="' + sm(e.img) + '" alt="" loading="lazy"><span><strong>' + L(e.name) + '</strong><small>' + L(e.duration) + ' · ' + L(e.place) + '</small></span></label>';
      }).join('');
      if (a && st.guests > maxGuests(a)) st.guests = maxGuests(a);
      $('[data-book-guests]', dlg).textContent = st.guests;
      $('[data-book-max]', dlg).textContent = a && a.sleeps ? t('book.maxGuests', { n: a.sleeps }) : '';
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
        var a = apt(), max = a ? maxGuests(a) : 30;
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
      var d = opts.dates || ((fp && fp.selectedDates.length === 2) ? fp.selectedDates : filterDates);
      if (bfp && d && d.length === 2 && (opts.dates || bfp.selectedDates.length !== 2)) bfp.setDate(d, false);
      st.guests = opts.guests || guests;
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
      lines.push('• Departamento: ' + (a ? (a.kind === 'house' ? 'Casa ' : '') + a.name + ' (' + a.zone + ')' : 'Sin alojamiento — solo experiencias'));
      var nn = d.length === 2 ? nightsBetween(d[0], d[1]) : 0;
      lines.push('• Fechas: ' + (d.length === 2 ? (nn ? fmtDay(d[0]) + ' → ' + fmtDay(d[1]) + ' (' + nn + (nn === 1 ? ' noche)' : ' noches)') : fmtDay(d[0])) : 'a definir'));
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
      closeDrawer();
      if (b.hasAttribute('data-book-apt-i')) open({ apt: parseInt(b.getAttribute('data-book-apt-i'), 10) });
      else if (b.hasAttribute('data-book-exp-i')) open({ exp: parseInt(b.getAttribute('data-book-exp-i'), 10) });
      else open({});
    });
    return { render: function () { if (dlg.open) render(); }, open: open };
  })();


  /* Teselas del mapa entonadas a la paleta: se tiñen una sola vez al cargar (canvas),
     así no hay filtros CSS que repinten el mapa en cada frame del scroll */
  function warmTiles(url, opts) {
    var Warm = window.L.TileLayer.extend({
      createTile: function (coords, done) {
        var tile = document.createElement('canvas'), size = this.getTileSize(), img = new Image();
        tile.width = size.x; tile.height = size.y;
        img.crossOrigin = 'anonymous';
        img.onload = function () {
          var c = tile.getContext('2d');
          c.drawImage(img, 0, 0, size.x, size.y);
          c.globalCompositeOperation = 'multiply'; c.fillStyle = '#f7ecdf'; c.fillRect(0, 0, size.x, size.y);
          done(null, tile);
        };
        img.onerror = function (e) { done(e, tile); };
        img.src = this.getTileUrl(coords);
        return tile;
      }
    });
    return new Warm(url, opts);
  }

  /* ================= Mapa de ubicaciones (/propiedades/) ================= */
  (function propsMap() {
    var el = $('[data-props-map]'); if (!el || PAGE !== 'props') return;
    var map = null, markers = [];
    function init() {
      if (map || !window.L) return;
      var pts = APTS.filter(function (a) { return a.coords; });
      // La rueda del mouse sigue scrolleando la página (no hace zoom ni frena el scroll suave).
      // En pantallas táctiles el mapa no se arrastra con un dedo, así el scroll de la página no se traba; zoom con los botones.
      var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      map = window.L.map(el, { scrollWheelZoom: false, dragging: !touch, tap: false, zoomControl: true, attributionControl: true });
      // Mapa base gris claro (sin filtros CSS: los filtros sobre las teselas hacen pesado el scroll)
      var esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_';
      warmTiles(esri + 'Base/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16, attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap' }).addTo(map);
      window.L.tileLayer(esri + 'Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16 }).addTo(map);
      pts.forEach(function (a, i) {
        var icon = window.L.divIcon({ className: '', html: '<span class="pmap__pin">' + (a.kind === 'house' ? HOUSE : (APTS.indexOf(a) + 1)) + '</span>', iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -18] });
        var m = window.L.marker(a.coords, { icon: icon, title: aptLabel(a), alt: aptLabel(a) }).addTo(map);
        m._apt = a; markers.push(m);
      });
      popups(); view('city');
    }
    function popups() {
      markers.forEach(function (m) {
        var a = m._apt, z = CFG.zones.filter(function (x) { return x.es === a.zone; })[0];
        m.bindPopup('<div class="pmap__pop"><img decoding="async" src="' + sm(a.img) + '" alt=""><div><p class="eyebrow">' + (z ? L(z) : a.zone) + '</p><strong>' + aptLabel(a) + '</strong><a href="' + aptURL(a) + '">' + t(a.kind === 'house' ? 'apt.viewHouse' : 'apt.view') + ' →</a></div></div>');
      });
    }
    function view(v) {
      $$('[data-map-view]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-map-view') === v); });
      var pts = APTS.filter(function (a) { return a.coords && (v === 'all' || a.zone !== 'Potrerillos'); }).map(function (a) { return a.coords; });
      if (!map || !pts.length) return;
      if (map._loaded) map.flyToBounds(pts, { padding: [60, 60], maxZoom: 16, duration: .9 });
      else map.fitBounds(pts, { padding: [60, 60], maxZoom: 16 });
    }
    $$('[data-map-view]').forEach(function (b) { b.addEventListener('click', function () { init(); view(b.getAttribute('data-map-view')); }); });
    document.addEventListener('rgm:lang', function () { if (map) popups(); });
    var tries = 0;
    // Fuera de pantalla el mapa no se compone (sus teselas son muchas capas y pesan al scrollear)
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { el.classList.toggle('is-off', !e[0].isIntersecting); }, { rootMargin: '200px' }).observe(el);
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 600); };
    (function wait() { if (window.L) idle(init, { timeout: 2500 }); else if (tries++ < 50) setTimeout(wait, 200); })();
  })();

  /* ================= Ficha de departamento (/propiedades/<slug>/) ================= */
  var aptPage = (function () {
    if (PAGE !== 'apt' || !CUR_APT) return null;
    var a = CUR_APT, D = (window.RGM_DETAILS || {})[a.slug] || {};
    var AM = window.RGM_AMENITIES || {}, GR = window.RGM_AMENITY_GROUPS || {}, PL = window.RGM_PLACES || {};
    var gallery = D.gallery && D.gallery.length ? D.gallery : [a.img, a.img2];
    var zoneName = function (z) { var f = CFG.zones.filter(function (x) { return x.es === z; })[0]; return f ? L(f) : z; };
    var afp = null, ag = Math.min(2, maxGuests(a));

    function render() {
      $('[data-apt-crumb]').textContent = aptLabel(a);
      $('[data-apt-title]').innerHTML = aptPrefix(a) + ' <em>' + a.name + '</em>';
      if (a.kind === 'house') $$('[data-i18n="apt.eyebrow"]').forEach(function (el) { el.textContent = t('apt.eyebrowHouse'); });
      $('[data-apt-zone]').textContent = zoneName(a.zone);
      $('[data-apt-stats]').innerHTML = [
        ['apt.guests', fmtNum(a.sleeps)], ['apt.bedrooms', fmtRooms(a.bedrooms)], ['apt.baths', fmtNum(a.baths)], ['apt.beds', fmtNum(D.beds != null ? D.beds : a.bedrooms)]
      ].map(function (x) { return '<div><dt class="eyebrow">' + t(x[0]) + '</dt><dd>' + x[1] + '</dd></div>'; }).join('');
      $('[data-apt-gallery]').innerHTML = gallery.slice(0, 5).map(function (src, i) {
        return '<button type="button" class="apt-gal__tile" data-lightbox-open="' + i + '" aria-label="' + t('apt.viewAll') + ' ' + (i + 1) + '/' + gallery.length + '">' +
          (i === 0 && a.badge ? '<span class="apts__badge">' + L(a.badge) + '</span>' : '') +
          '<img decoding="async" src="' + (i ? sm(src) : src) + '" alt="" ' + (i > 1 ? 'loading="lazy"' : '') + '></button>';
      }).join('');
      $('[data-apt-h2]').innerHTML = L(D.title) || L(a.tag);
      $('[data-apt-intro]').textContent = L(D.intro) || L(a.tag);
      $('[data-apt-overview]').innerHTML = (D.overview || []).map(function (b) {
        return '<div class="apt-ov"><h3 class="apt-ov__t">' + L(b.t) + '</h3><p>' + L(b.p) + '</p></div>';
      }).join('');
      var am = D.amenities || {};
      $('[data-apt-amenities]').innerHTML = Object.keys(am).map(function (g) {
        return '<div class="amen"><h3 class="amen__t">' + L(GR[g]) + '</h3><ul class="amen__list">' +
          am[g].map(function (id) { return '<li>' + (AM[id] ? L(AM[id]) : id) + '</li>'; }).join('') + '</ul></div>';
      }).join('');
      var loc = D.location || {};
      $('[data-apt-loc-text]').textContent = L(loc.text) || '';
      $('[data-apt-times]').innerHTML = (loc.times || []).map(function (x) {
        return '<li><span>' + (PL[x[0]] ? L(PL[x[0]]) : x[0]) + '</span><strong>' + t('apt.min', { n: x[1] }) + '</strong></li>';
      }).join('');
      var q = encodeURIComponent(a.coords ? a.coords.join(',') : (loc.map || (a.zone + ', Mendoza')));
      var map = $('[data-apt-map]');
      if (!map.firstChild) map.innerHTML = '<iframe title="Mapa" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' + q + '&output=embed"></iframe>';
      $('[data-apt-maplink]').href = 'https://www.google.com/maps/search/?api=1&query=' + q;
      var revs = TES.filter(function (r) { return !r.sample && r.where && r.where.split(' · ')[0] === aptLabel(a); });
      $('[data-apt-reviews]').innerHTML = revs.length ? revs.map(function (r) {
        return '<article class="apt-rev"><div class="tes-card__stars"><span aria-label="5/5">★★★★★</span>' + (r.sample ? '<span class="tes-card__sample">' + t('tes.sample') + '</span>' : '') + '</div>' +
          '<p>' + L(r.text) + '</p><div class="tes-card__who"><span class="tes-card__avatar">' + r.name.charAt(0) + '</span><div><div class="tes-card__name">' + r.name + '</div></div></div></article>';
      }).join('') : '<p class="muted">' + t('apt.noReviews') + '</p>';
      $('[data-apt-guests]').textContent = ag;
      $('[data-apt-max]').textContent = a.sleeps ? t('book.maxGuests', { n: a.sleeps }) : '';
      var wide = $('[data-apt-wide]'); wide.src = gallery[gallery.length - 1];
      // Sin fotos todavía (una sola imagen): galería de una columna, sin foto ancha ni "ver todas"
      var few = gallery.length < 2;
      $('[data-apt-gallery]').classList.toggle('apt-gal--single', few);
      $$('.apt-gal__all, .apt-img').forEach(function (el) { el.hidden = few; });
      $('[data-apt-stats]').hidden = a.sleeps == null && a.bedrooms == null;
      // otros departamentos
      $('[data-apt-more]').innerHTML = APTS.filter(function (x) { return x !== a; }).slice(0, 3).map(function (x) {
        return '<article class="prop"><a class="prop__media" href="' + aptURL(x) + '" tabindex="-1" aria-hidden="true">' +
          '<img decoding="async" class="prop__img" src="' + sm(x.img) + '" alt="" loading="lazy"><img decoding="async" class="prop__img prop__img--2" src="' + sm(x.img2) + '" alt="" loading="lazy"></a>' +
          '<div class="prop__body"><p class="eyebrow prop__zone">' + zoneName(x.zone) + '</p><h3 class="prop__name"><a href="' + aptURL(x) + '">' + aptLabel(x) + '</a></h3>' +
          '<p class="prop__tag">' + L(x.tag) + '</p></div></article>';
      }).join('');
      if (afp) { afp.set('locale', lang === 'en' ? 'default' : lang); if (afp.altInput) afp.altInput.placeholder = t('book.datesPh'); if (afp.selectedDates.length) afp.setDate(afp.selectedDates, false); }
    }

    // Tabs (con flechas del teclado)
    var tabs = $$('[role="tab"]');
    function select(tab) {
      tabs.forEach(function (x) {
        var on = x === tab;
        x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        $('#' + x.getAttribute('aria-controls')).hidden = !on;
      });
      var pane = $('#' + tab.getAttribute('aria-controls'));
      if (gsap && !reduced) gsap.fromTo(pane, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' });
      if (ST) ST.refresh();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
        var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); select(n);
      });
    });

    // Tarjeta de consulta
    if (window.flatpickr) {
      afp = flatpickr('#a-dates', { mode: 'range', minDate: 'today', dateFormat: 'Y-m-d', altInput: true, altFormat: 'j M Y',
        locale: lang === 'en' ? 'default' : lang, disableMobile: true, showMonths: window.innerWidth > 1100 ? 2 : 1, position: 'below right',
        disable: (a.booked || []).map(function (r) { var e = parseISO(r[1]); e.setDate(e.getDate() - 1); return { from: r[0], to: toISO(e) }; }) });
    }
    $$('[data-apt-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        ag = Math.max(1, Math.min(maxGuests(a), ag + parseInt(b.getAttribute('data-apt-step'), 10)));
        $('[data-apt-guests]').textContent = ag;
      });
    });
    $('[data-apt-book]').addEventListener('click', function () {
      if (booking) booking.open({ apt: APTS.indexOf(a), dates: afp && afp.selectedDates.length === 2 ? afp.selectedDates.slice() : null, guests: ag });
    });

    // Lightbox
    var lb = $('[data-lightbox]'), li = 0;
    function show(i) {
      li = (i + gallery.length) % gallery.length;
      $('[data-lightbox-img]', lb).src = gallery[li];
      $('[data-lightbox-count]', lb).textContent = pad(li + 1) + ' / ' + pad(gallery.length);
      if (gsap && !reduced) gsap.fromTo($('[data-lightbox-img]', lb), { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: .5, ease: 'power2.out' });
    }
    document.addEventListener('click', function (e) {
      var o = e.target.closest && e.target.closest('[data-lightbox-open]'); if (!o) return;
      show(parseInt(o.getAttribute('data-lightbox-open'), 10) || 0);
      lb.showModal(); if (lenis) lenis.stop();
    });
    $('[data-lightbox-prev]', lb).addEventListener('click', function () { show(li - 1); });
    $('[data-lightbox-next]', lb).addEventListener('click', function () { show(li + 1); });
    $('[data-lightbox-close]', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', function () { if (lenis) lenis.start(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') show(li + 1); if (e.key === 'ArrowLeft') show(li - 1); });

    render();
    if (gsap && !reduced && ST) {
      gsap.from('.apt-gal__tile', { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .07, delay: .4 });
      gsap.fromTo('.apt-img img', { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.apt-img', start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    return { render: render };
  })();


  /* ================= Ficha de experiencia (/experiencias/<slug>/) ================= */
  var expPage = (function () {
    if (PAGE !== 'exp' || !CUR_EXP) return null;
    var x = CUR_EXP, D = (window.RGM_EXP_DETAILS || {})[x.slug] || {};
    var gallery = D.gallery && D.gallery.length ? D.gallery : [x.img];
    var xfp = null, people = 2;
    function render() {
      $('[data-x-crumb]').textContent = L(x.name);
      var words = L(x.name).split(' '), last = words.pop();
      $('[data-x-title]').innerHTML = (words.length ? words.join(' ') + ' ' : '') + '<em>' + last + '</em>';
      $('[data-x-place]').textContent = L(x.place);
      var f = D.facts || {};
      $('[data-x-stats]').innerHTML = [
        [x.type === 'service' ? 'exp.modality' : 'x.duration', L(x.duration)], ['x.group', L(f.group) || '—'], ['x.transfer', f.transfer ? t('x.transferYes') : '—'], ['x.langs', f.langs || 'ES']
      ].map(function (r) { return '<div><dt class="eyebrow">' + t(r[0]) + '</dt><dd>' + r[1] + '</dd></div>'; }).join('');
      $('[data-x-gallery]').innerHTML = gallery.slice(0, 5).map(function (src, i) {
        return '<button type="button" class="apt-gal__tile" data-lightbox-open="' + i + '" aria-label="' + t('apt.viewAll') + ' ' + (i + 1) + '/' + gallery.length + '"><img decoding="async" src="' + src + '" alt="" ' + (i > 1 ? 'loading="lazy"' : '') + '></button>';
      }).join('');
      $('[data-x-h2]').innerHTML = L(D.title) || L(x.name);
      $('[data-x-intro]').textContent = L(D.intro) || L(x.text);
      $('[data-x-itinerary]').innerHTML = (D.itinerary || []).map(function (st) {
        return '<li class="timeline__item"><span class="timeline__h">' + (L(st.h) || '') + '</span><div><h3 class="apt-ov__t">' + L(st.t) + '</h3><p>' + L(st.p) + '</p></div></li>';
      }).join('');
      var li = function (arr, cls) { return '<ul class="amen__list ' + cls + '">' + (arr || []).map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>'; };
      $('[data-x-includes]').innerHTML = '<div class="amen"><h3 class="amen__t">' + t('x.inc') + '</h3>' + li(L(D.includes), 'is-inc') + '</div>' +
        (D.excludes ? '<div class="amen"><h3 class="amen__t">' + t('x.exc') + '</h3>' + li(L(D.excludes), 'is-exc') + '</div>' : '');
      $('[data-x-info]').innerHTML = (D.info || []).map(function (b) { return '<div class="apt-ov"><h3 class="apt-ov__t">' + L(b.t) + '</h3><p>' + L(b.p) + '</p></div>'; }).join('');
      $('[data-x-people]').textContent = people;
      $('[data-x-wide]').src = gallery[1] || gallery[0];
      $('[data-x-more]').innerHTML = EXPS.filter(function (o) { return o !== x; }).slice(0, 3).map(function (o) {
        return '<article class="prop"><a class="prop__media" href="' + expURL(o) + '" tabindex="-1" aria-hidden="true"><img decoding="async" class="prop__img" src="' + o.img + '" alt="" loading="lazy"></a>' +
          '<div class="prop__body"><p class="eyebrow prop__zone">' + L(o.place) + '</p><h3 class="prop__name"><a href="' + expURL(o) + '">' + L(o.name) + '</a></h3>' +
          '<p class="prop__tag">' + L(o.text) + '</p></div></article>';
      }).join('');
      if (xfp) { xfp.set('locale', lang === 'en' ? 'default' : lang); if (xfp.altInput) xfp.altInput.placeholder = t('x.datePh'); if (xfp.selectedDates.length) xfp.setDate(xfp.selectedDates, false); }
    }
    var tabs = $$('[role="tab"]');
    function select(tab) {
      tabs.forEach(function (b) { var on = b === tab; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; $('#' + b.getAttribute('aria-controls')).hidden = !on; });
      if (gsap && !reduced) gsap.fromTo($('#' + tab.getAttribute('aria-controls')), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' });
      if (ST) ST.refresh();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); select(n); });
    });
    if (window.flatpickr) xfp = flatpickr('#x-date', { minDate: 'today', dateFormat: 'Y-m-d', altInput: true, altFormat: 'j M Y', locale: lang === 'en' ? 'default' : lang, disableMobile: true, position: 'below right' });
    $$('[data-x-step]').forEach(function (b) { b.addEventListener('click', function () { people = Math.max(1, Math.min(20, people + parseInt(b.getAttribute('data-x-step'), 10))); $('[data-x-people]').textContent = people; }); });
    $('[data-x-book]').addEventListener('click', function () {
      var d = xfp && xfp.selectedDates.length ? [xfp.selectedDates[0], xfp.selectedDates[0]] : null;
      if (booking) booking.open({ apt: -1, exp: EXPS.indexOf(x), dates: d, guests: people });
    });
    var lb = $('[data-lightbox]'), cur = 0;
    function show(i) { cur = (i + gallery.length) % gallery.length; $('[data-lightbox-img]', lb).src = gallery[cur]; $('[data-lightbox-count]', lb).textContent = pad(cur + 1) + ' / ' + pad(gallery.length); }
    document.addEventListener('click', function (e) { var o = e.target.closest && e.target.closest('[data-lightbox-open]'); if (!o) return; show(parseInt(o.getAttribute('data-lightbox-open'), 10) || 0); lb.showModal(); if (lenis) lenis.stop(); });
    $('[data-lightbox-prev]', lb).addEventListener('click', function () { show(cur - 1); });
    $('[data-lightbox-next]', lb).addEventListener('click', function () { show(cur + 1); });
    $('[data-lightbox-close]', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', function () { if (lenis) lenis.start(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
    render();
    if (gsap && !reduced && ST) {
      gsap.from('.apt-gal__tile', { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .07, delay: .4 });
      gsap.fromTo('.apt-img img', { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.apt-img', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from('.timeline__item', { x: -24, opacity: 0, duration: .8, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: '.timeline', start: 'top 85%', once: true } });
    }
    return { render: render };
  })();


  /* ================= Listado de experiencias (/experiencias/) ================= */
  var expsPage = (function () {
    if (PAGE !== 'exps') return null;
    var grid = $('[data-xs-grid]'), type = 'all', first = true;
    try { var q = new URLSearchParams(location.search).get('tipo'); if (q && /^(tour|wine|service)$/.test(q)) type = q; } catch (e) {}
    function render() {
      var list = EXPS.filter(function (x) { return type === 'all' || x.type === type; });
      grid.innerHTML = list.map(function (x) {
        var i = EXPS.indexOf(x);
        return '<article class="prop xs-card">' +
          '<a class="prop__media xs-card__media" href="' + expURL(x) + '" tabindex="-1" aria-hidden="true">' +
            '<span class="apts__badge">' + L(x.duration) + '</span><img decoding="async" class="prop__img" src="' + sm(x.img) + '" alt="" loading="lazy"></a>' +
          '<div class="prop__body"><p class="eyebrow prop__zone">' + L(x.place) + '</p>' +
            '<h2 class="prop__name"><a href="' + expURL(x) + '">' + L(x.name) + '</a></h2>' +
            '<p class="prop__tag">' + L(x.text) + '</p>' +
            '<div class="prop__foot"><a class="btn btn--outline btn--small-inline" href="' + expURL(x) + '">' + t('x.view') + '</a>' +
            '<button type="button" class="btn btn--small-inline" data-book-exp-i="' + i + '">' + t('exp.book') + '</button></div>' +
          '</div></article>';
      }).join('');
      $('[data-xs-count]').textContent = list.length === 1 ? t('xs.count1') : t('xs.countN', { n: list.length });
      $$('[data-xs-type]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-xs-type') === type ? 'true' : 'false'); });
      rollify(); cursorTargets();
      if (gsap && !reduced && !first) gsap.from($$('.xs-card', grid), { y: 30, opacity: 0, duration: .7, stagger: .06, ease: 'power3.out' });
      first = false;
      if (ST) ST.refresh();
    }
    $$('[data-xs-type]').forEach(function (b) {
      b.addEventListener('click', function () {
        type = b.getAttribute('data-xs-type'); render();
        try { history.replaceState(null, '', location.pathname + (type === 'all' ? '' : '?tipo=' + type)); } catch (e) {}
      });
    });
    render();
    return { render: render };
  })();

  /* ================= Navegación entre páginas con transición ================= */
  // Abriendo los archivos directo (file://) las carpetas no cargan su index.html solas:
  // en ese caso agregamos "index.html" a los links de carpeta (propiedades/, experiencias/…).
  var IS_FILE = location.protocol === 'file:';
  function fixUrl(u) { return IS_FILE ? String(u).replace(/\/(?=[?#]|$)/, '/index.html') : u; }
  function fixLinks() {
    if (!IS_FILE) return;
    $$('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (/^(https?:|mailto:|tel:|#)/.test(h)) return;
      var f = fixUrl(h); if (f !== h) a.setAttribute('href', f);
    });
  }
  function goTo(url) {
    url = fixUrl(url);
    if (!gsap || !bars.length || reduced) { location.href = url; return; }
    curtainOn();
    gsap.timeline()
      .set(bars, { transformOrigin: '50% 100%' })
      .to(bars, { scaleY: 1, duration: .6, ease: 'power3.in', stagger: { each: .025, from: 'edges' } })
      .add(function () { location.href = url; });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var href = a.getAttribute('href');
    if (!/^(\.\/|propiedades|experiencias|index\.html)/.test(href)) return;
    // ./#seccion estando en la home → scroll interno
    if (PAGE === 'home' && href.indexOf('./#') === 0) return;
    e.preventDefault(); closeDrawer(); goTo(href);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted && bars.length && gsap) { gsap.set(bars, { scaleY: 0 }); curtainOff(); } });

  /* ================= Contacto ================= */
  function updateContactPh() { /* placeholder se aplica vía data-i18n-attr */ }
  if ($('[data-contact]')) $('[data-contact]').addEventListener('submit', function (e) {
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
    function els() { return { s: [], c: $$('.apts__card', stage), t: $$('.apts__second-img', stage) }; }
    // Mapa con todos los alojamientos; se centra en el del slide activo
    var mapEl = null, map = null, pins = [];
    function pinIcon(a, on) {
      return window.L.divIcon({ className: 'apts-pin', html: '<span class="pmap__pin' + (on ? ' is-on' : '') + '">' + (a.kind === 'house' ? HOUSE : '') + '</span>', iconSize: [34, 34], iconAnchor: [17, 17] });
    }
    function mapInit() {
      mapEl = mapEl || $('[data-apts-map]', stage);
      if (map || !window.L || !mapEl) return;
      map = window.L.map(mapEl, { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, tap: false, attributionControl: true });
      var esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_';
      warmTiles(esri + 'Base/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16, attribution: '&copy; Esri, &copy; OpenStreetMap' }).addTo(map);
      window.L.tileLayer(esri + 'Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16 }).addTo(map);
      pins = APTS.map(function (a, i) {
        if (!a.coords) return null;
        var m = window.L.marker(a.coords, { icon: pinIcon(a, i === cur), keyboard: false, title: aptLabel(a) }).addTo(map);
        m.on('click', function () { go(i, i > cur ? 1 : -1); play(); });
        return m;
      });
      mapTo(cur, true);
      if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { mapEl.classList.toggle('is-off', !e[0].isIntersecting); }, { rootMargin: '200px' }).observe(mapEl);
    }
    function mapTo(i, now) {
      var a = APTS[i], badge = $('[data-apts-badge]', stage);
      if (badge) { badge.hidden = !a.badge; badge.textContent = a.badge ? L(a.badge) : ''; }
      if (!map || !a.coords) return;
      pins.forEach(function (m, k) { if (m) { m.setIcon(pinIcon(APTS[k], k === i)); m.setZIndexOffset(k === i ? 1000 : 0); } });
      var z = a.zone === 'Potrerillos' ? 13 : 16;
      if (now || reduced || !gsap || !map._loaded) { map.setView(a.coords, z, { animate: false }); return; }
      var far = map.getCenter().distanceTo(window.L.latLng(a.coords)) > 4000;
      if (false) {}
      else if (!far) map.flyTo(a.coords, z, { duration: 1.1, easeLinearity: .25 });
      else {
        // Saltos largos (ciudad ↔ Potrerillos): fundido en vez de alejar el mapa
        gsap.to(mapEl, { opacity: 0, duration: .35, ease: 'power2.in', onComplete: function () {
          map.setView(a.coords, z, { animate: false });
          gsap.to(mapEl, { opacity: 1, duration: .7, ease: 'power2.out', delay: .15 });
        } });
      }
    }
    (function waitL(n) { if (window.L) { var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 300); }; idle(mapInit, { timeout: 2000 }); } else if (n < 60) setTimeout(function () { waitL(n + 1); }, 200); })(0);
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
        var outs = [e.t[from]].filter(Boolean), ins = [e.t[to]].filter(Boolean);
        gsap.killTweensOf(outs.concat(ins, [e.c[from], e.c[to]]));
        gsap.set(ins, { zIndex: 2 }); gsap.set(outs, { zIndex: 1 });
        gsap.fromTo(ins, { clipPath: dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)', opacity: 1 }, { clipPath: 'inset(0 0 0 0%)', duration: 1.1, ease: 'expo.inOut' });
        gsap.fromTo($$('img', ins[0] || document.createElement('i')), { scale: 1.18, xPercent: 6 * dir }, { scale: 1, xPercent: 0, duration: 1.5, ease: 'expo.out' });
        gsap.to(outs, { opacity: 0, duration: .01, delay: 1.1 });
        gsap.to(e.c[from], { autoAlpha: 0, y: -16, duration: .4, ease: 'power2.in' });
        gsap.fromTo(e.c[to], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', delay: .35 });
      }
      mark(to);
      mapTo(to);
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
      if (locked === 'x') main.classList.add('is-dragging');
    });
    window.addEventListener('pointerup', function (e) {
      if (!dragging) return; dragging = false; main.classList.remove('is-dragging');
      var dx = e.clientX - sx, v = Math.abs(dx) / Math.max(1, performance.now() - st);
      if (locked === 'x' && (Math.abs(dx) > main.offsetWidth * .18 || v > .5)) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      play();
    });

    function refresh() {
      var e = els();
      if (gsap && e.t.length) gsap.set(e.t, { clearProps: 'all' });
      if (gsap && e.c.length) gsap.set(e.c, { clearProps: 'all' });
      if (!e.c.length) return;
      mark(Math.min(cur, APTS.length - 1));
      mapTo(Math.min(cur, APTS.length - 1), true);
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
    // Fuera de pantalla no anima (ahorra repintados mientras se scrollea el resto de la página)
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { if (tw) e[0].isIntersecting ? tw.resume() : tw.pause(); }, { rootMargin: '100px' }).observe(track);
    return { refresh: refresh };
  })();

  /* ================= Hero editorial ================= */
  var hero2 = (function () {
    var sec = $('#hero'), word = $('[data-hero-word]'), frame = $('[data-hero-frame]');
    if (!sec || !word || !frame) return null;
    var zoom = $('.hero__zoom', frame), pic = $('.hero__pic', frame), fig = $('.hero__fig', frame);

    // "Mendoza" ocupa exactamente el ancho de la grilla (medido sobre el trazo real de las letras)
    var cv = document.createElement('canvas').getContext('2d');
    function fit() {
      var avail = word.parentNode.clientWidth; if (!avail) return;
      var txt = word.textContent.trim(), ls = -.05, px, ml;
      cv.font = '400 100px Gambarino';
      var m = cv.measureText(txt);
      if (m.actualBoundingBoxRight && document.fonts && document.fonts.check('100px Gambarino')) {
        // ancho de tinta a 100px, descontando el tracking negativo entre letras
        var ink = m.actualBoundingBoxLeft + m.actualBoundingBoxRight + ls * 100 * (txt.length - 1);
        px = 100 * avail / ink;
        ml = m.actualBoundingBoxLeft * px / 100;   // corrimiento para que la tinta arranque en el borde
      } else {
        word.style.fontSize = '100px'; word.style.marginLeft = '0px';
        px = 100 * avail / (word.getBoundingClientRect().width || avail); ml = 0;
      }
      word.style.fontSize = px + 'px';
      word.style.marginLeft = ml + 'px';
      sec.style.setProperty('--ws', px + 'px');
    }
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(); if (ST) ST.refresh(); });
    window.addEventListener('resize', function () { clearTimeout(fit._t); fit._t = setTimeout(fit, 120); });

    // Hora local de Mendoza
    var clk = $('[data-clock]');
    if (clk && window.Intl) {
      var f = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Mendoza' });
      var tick = function () { clk.textContent = f.format(new Date()); };
      tick(); setInterval(tick, 20000);
    }

    // Entrada: se arma en pausa (fija los estados iniciales bajo la cortina) y corre cuando la cortina sube
    function intro() {
      if (!gsap || reduced) return null;
      var tl = gsap.timeline({ paused: true });
      tl.from('.hero__kick', { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: .25 }, .1);
      if (wordSplit) tl.from(wordSplit.chars, { yPercent: 102, duration: 1.4, ease: 'expo.out', stagger: .05 }, .05);
      tl.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' }, .25)
        .from(zoom, { scale: 1.4, duration: 2, ease: 'expo.out' }, .55)
        .from(fig, { xPercent: -101, duration: 1, ease: 'expo.out' }, 1.3)
        .from(['.hero__side', '.search--hero'], { y: 26, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: .1 }, .9)
        .add(function () {
          var br = gsap.to(zoom, { scale: 1.07, duration: 14, ease: 'sine.inOut', repeat: -1, yoyo: true });
          if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { e[0].isIntersecting ? br.resume() : br.pause(); }).observe(frame);
        });
      return tl;
    }

    // Scroll: la foto enmarcada se expande hasta ocupar toda la pantalla (sólo escritorio)
    function scroll() {
      if (!gsap || !ST || reduced) return;
      var mm = gsap.matchMedia();
      mm.add('(min-width: 901px) and (min-height: 600px)', function () {
        var g = {}, st = { p: 0 };
        function geo() {
          var W = frame.offsetWidth, H = frame.offsetHeight, VW = sec.offsetWidth, VH = window.innerHeight;
          g.sx = VW / W; g.sy = VH / H;
          g.dx = VW / 2 - (frame.offsetLeft + W / 2); g.dy = VH / 2 - (frame.offsetTop + H / 2);
        }
        function apply() {
          var p = st.p, sx = 1 + (g.sx - 1) * p, sy = 1 + (g.sy - 1) * p, k = Math.max(sx, sy);
          gsap.set(frame, { x: g.dx * p, y: g.dy * p, scaleX: sx, scaleY: sy });
          gsap.set(pic, { scaleX: k / sx, scaleY: k / sy });
          if (fig) fig.style.opacity = Math.max(0, 1 - p * 8);
        }
        geo();
        var tw = gsap.to(st, {
          p: 1, ease: 'power2.inOut', onUpdate: apply,
          // refreshPriority: los pines se calculan antes que el resto (si no, lo de abajo queda desfasado)
          scrollTrigger: { trigger: sec, start: 'top top', end: '+=85%', pin: true, scrub: true, anticipatePin: 1, refreshPriority: 2,
            onRefreshInit: function () { gsap.set(frame, { x: 0, y: 0, scaleX: 1, scaleY: 1 }); gsap.set(pic, { scaleX: 1, scaleY: 1 }); },
            onRefresh: function () { geo(); apply(); } }
        });
        return function () { tw.kill(); gsap.set([frame, pic], { clearProps: 'transform' }); if (fig) fig.style.opacity = ''; };
      });
      mm.add('(max-width: 900px)', function () {
        var tw = gsap.fromTo(pic, { yPercent: -5, scale: 1.1 }, { yPercent: 5, scale: 1.1, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
        return function () { tw.kill(); };
      });
    }
    return { fit: fit, intro: intro, scroll: scroll };
  })();

  /* ================= Cinta de experiencias (sigue la dirección del scroll) ================= */
  (function ticker() {
    var track = $('[data-ticker]'); if (!track || !gsap || reduced) return;
    var x = 0, dir = 1, on = true, w = 0;
    function measure() { var r = $('.ticker__run', track); w = r ? r.offsetWidth : 0; }
    measure();
    document.addEventListener('rgm:lang', measure);
    window.addEventListener('resize', function () { clearTimeout(measure._t); measure._t = setTimeout(measure, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { on = e[0].isIntersecting; }, { rootMargin: '80px' }).observe(track);
    gsap.ticker.add(function (time, dt) {
      if (!on || !w) return;
      var v = lenis ? lenis.velocity : 0;
      if (v > .5) dir = 1; else if (v < -.5) dir = -1;
      x -= dir * (dt / 16.67) * (2.6 + Math.min(Math.abs(v), 60) * .3);
      if (x <= -w) x += w; else if (x > 0) x -= w;
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
    });
  })();

  /* ================= Botones principales con "imán" (sólo mouse) ================= */
  (function magnet() {
    if (!gsap || reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    $$('.btn--go, .nav__book').forEach(function (b) {
      var xTo = gsap.quickTo(b, 'x', { duration: .6, ease: 'power3' }), yTo = gsap.quickTo(b, 'y', { duration: .6, ease: 'power3' });
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .18); yTo((e.clientY - r.top - r.height / 2) * .3);
      });
      b.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  })();

  /* ================= Cursor con etiqueta (sólo mouse) ================= */
  function cursorTargets() {
    var set = function (sel, key) { $$(sel).forEach(function (el) { el.setAttribute('data-cursor', key); }); };
    set('.exp__viewport, .apts__main', 'cur.drag');
    set('.prop__media', 'cur.view');
    set('.apt-gal__tile', 'cur.zoom');
  }
  (function cursor() {
    if (!gsap || reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var el = document.createElement('div'); el.className = 'cursor'; el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    var xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
    var cur = '', first = true;
    window.addEventListener('pointermove', function (e) {
      if (first) { gsap.set(el, { x: e.clientX, y: e.clientY }); first = false; }
      xTo(e.clientX); yTo(e.clientY);
      var tg = e.target.closest && e.target.closest('[data-cursor]');
      var want = tg && !(e.target.closest('a, button') && !tg.matches('.prop__media, .apt-gal__tile, .wcard__img, .xcard__img')) ? t(tg.getAttribute('data-cursor')) : '';
      if (want === cur) return;
      cur = want;
      if (want) { el.textContent = want; gsap.to(el, { scale: 1, duration: .5, ease: 'expo.out', overwrite: 'auto' }); }
      else gsap.to(el, { scale: 0, duration: .35, ease: 'power3.out', overwrite: 'auto' });
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cur = ''; gsap.to(el, { scale: 0, duration: .3 }); });
  })();

  /* ================= Manifiesto: las palabras se encienden con el scroll ================= */
  var introFx = (function () {
    var el = $('[data-words]'); if (!el) return null;
    var words = [], prog = 0, last = -1;
    function paint(p) {
      var n = Math.round(p * words.length); if (n === last) return; last = n;
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('is-on', i < n);
    }
    function split() {
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
              var w = document.createElement('span'); w.className = 'w'; w.textContent = p; frag.appendChild(w);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1) { if (n.classList.contains('ii')) n.classList.add('w'); else if (!n.classList.contains('w')) walk(n); }
        });
      })(el);
      words = $$('.w', el); last = -1;
      paint(!gsap || !ST || reduced ? 1 : prog);
    }
    if (gsap && ST && !reduced) ST.create({ trigger: el, start: 'top 82%', end: 'bottom 50%', onUpdate: function (st) { prog = st.progress; paint(prog); }, onRefresh: function (st) { prog = st.progress; paint(prog); } });
    return { split: split };
  })();

  /* ================= Mapa ilustrado del centro ================= */
  var wmap = (function () {
    var root = $('[data-wmap]'), list = $('[data-wlist]');
    if (!root || !list || !MAPD) return null;
    var W = MAPD.size[0], H = MAPD.size[1];
    // Encuadre: casi cuadrado en celular (los deptos y la Peatonal), más amplio en escritorio (hasta el Parque)
    var VB = { s: [960, 330, 1600, 1380], l: [110, 330, 2620, 1560] };
    var vb = null, cur = -1, pins = [], items = cityApts();
    function line(pts) { return 'M' + pts.map(function (p) { var q = mapXY(p[0], p[1]); return q[0].toFixed(0) + ' ' + q[1].toFixed(0); }).join(' L'); }
    // base y calles resaltadas en capas separadas: el dibujo de las calles no vuelve a pintar el mapa entero
    root.innerHTML = '<svg class="wmap__svg" preserveAspectRatio="none" aria-hidden="true">' +
      '<image href="img/map-centro.svg" x="0" y="0" width="' + W + '" height="' + H + '"/></svg>' +
      '<svg class="wmap__svg wmap__svg--hl" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="wmap__hl" pathLength="1" d="' + line(MAPD.aristides) + '"/>' +
      '<path class="wmap__hl" pathLength="1" d="' + line(MAPD.peatonal) + '"/></svg>' +
      '<div class="wmap__layer" data-wmap-layer></div>';
    var svgs = $$('svg', root), layer = $('[data-wmap-layer]', root);
    function pct(x, y) { return 'left:' + ((x - vb[0]) / vb[2] * 100).toFixed(3) + '%;top:' + ((y - vb[1]) / vb[3] * 100).toFixed(3) + '%'; }
    function inView(x, y, m) { return x > vb[0] + m && x < vb[0] + vb[2] - m && y > vb[1] + m && y < vb[1] + vb[3] - m; }
    // nombres de plazas y calles + pines (se rehacen al cambiar idioma o encuadre)
    function labels() {
      if (!vb) return;
      var h = '';
      Object.keys(MAPD.plazas).forEach(function (k) {
        var q = mapXY(MAPD.plazas[k][0], MAPD.plazas[k][1]);
        if (inView(q[0], q[1], 60)) h += '<span class="wmap__lbl wmap__lbl--plaza' + (k === 'Independencia' ? ' is-main' : '') + '" style="' + pct(q[0], q[1]) + '">Plaza<br>' + k + '</span>';
      });
      var small = vb === VB.s;
      var streets = [['aristides', small ? 'Arístides' : 'Arístides Villanueva', small ? .82 : .62], ['peatonal', small ? 'Peatonal' : 'Peatonal Sarmiento', .5]];
      streets.forEach(function (s) {
        var pts = MAPD[s[0]], a = mapXY(pts[0][0], pts[0][1]), b = mapXY(pts[pts.length - 1][0], pts[pts.length - 1][1]);
        var ang = Math.atan2(a[1] - b[1], a[0] - b[0]) * 180 / Math.PI; if (ang > 90 || ang < -90) ang += 180;
        var x = b[0] + (a[0] - b[0]) * s[2], y = b[1] + (a[1] - b[1]) * s[2];
        if (!inView(x, y, 40)) { x = Math.max(x, vb[0] + vb[2] * .2); y = b[1] + (a[1] - b[1]) * ((x - b[0]) / ((a[0] - b[0]) || 1)); }
        h += '<span class="wmap__lbl wmap__lbl--street" style="' + pct(x, y) + ';--a:' + ang.toFixed(1) + 'deg">' + s[1] + '</span>';
      });
      var pk = mapXY(MAPD.parque[0], MAPD.parque[1]);
      h += inView(pk[0], pk[1], 40)
        ? '<span class="wmap__lbl wmap__lbl--park" style="' + pct(pk[0] + 60, pk[1]) + '">' + esc(t('where.park')) + '</span>'
        : '<span class="wmap__lbl wmap__lbl--park is-edge" style="' + pct(vb[0], vb[1] + vb[3] * .06) + '">← ' + esc(t('where.park')) + '</span>';
      h += items.map(function (o, k) {
        var q = mapXY(o.a.coords[0], o.a.coords[1]);
        return '<button type="button" class="wmap__pin" data-k="' + k + '" style="' + pct(q[0], q[1]) + '" aria-label="' + esc(aptLabel(o.a)) + '">' +
          '<span class="wmap__num">' + pad(k + 1) + '</span><span class="wmap__name">' + esc(o.a.name) + '</span></button>';
      }).join('');
      layer.innerHTML = h;
      pins = $$('.wmap__pin', layer);
      spread(); place(); mark(cur < 0 ? 0 : cur, true);
    }
    // etiquetas: si tapan un pin u otra etiqueta, se corren un poco
    function place() {
      var boxes = pins.map(function (p) { var r = $('.wmap__num', p).getBoundingClientRect(); return [r.left - 3, r.top - 3, r.right + 3, r.bottom + 3]; });
      var hit = function (r) { return boxes.some(function (b) { return r[0] < b[2] && r[2] > b[0] && r[1] < b[3] && r[3] > b[1]; }); };
      $$('.wmap__lbl:not(.is-edge)', layer).forEach(function (l) {
        var tries = [[0, 0], [0, 15], [0, -15], [18, 0], [-18, 0], [0, 26], [0, -26], [26, 14], [-26, 14], [0, 38], [0, -38]];
        for (var i = 0; i < tries.length; i++) {
          l.style.setProperty('--ox', tries[i][0] + 'px'); l.style.setProperty('--oy', tries[i][1] + 'px');
          var r = l.getBoundingClientRect(), box = [r.left, r.top, r.right, r.bottom];
          if (!hit(box) || i === tries.length - 1) { boxes.push(box); break; }
        }
      });
    }
    // pines muy cercanos (España I y II están a media cuadra): se separan en pantalla
    function spread() {
      var R = root.getBoundingClientRect(); if (!R.width) return;
      var pos = pins.map(function (p) { return [parseFloat(p.style.left) / 100 * R.width, parseFloat(p.style.top) / 100 * R.height]; });
      pins.forEach(function (p) { p.style.removeProperty('--dx'); });
      for (var i = 0; i < pos.length; i++) for (var j = i + 1; j < pos.length; j++) {
        var d = Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1]);
        if (d < 30) { var o = (30 - d) / 2 + 2; pins[i].style.setProperty('--dx', -o + 'px'); pins[j].style.setProperty('--dx', o + 'px'); }
      }
    }
    function frame() {
      var small = window.innerWidth < 640, v = small ? VB.s : VB.l;
      if (vb && vb.join() === v.join()) { spread(); place(); return; }
      vb = v;
      svgs.forEach(function (s) { s.setAttribute('viewBox', v.join(' ')); });
      root.style.aspectRatio = v[2] + ' / ' + v[3];
      labels();
    }
    // departamento activo: pin + tarjeta
    function mark(k, quiet) {
      if (k < 0 || k >= items.length) return;
      cur = k;
      pins.forEach(function (p, i) { p.classList.toggle('is-on', i === k); });
      $$('.wcard', list).forEach(function (c, i) { c.classList.toggle('is-on', i === k); });
    }
    function scrollCard(k) {
      var c = $$('.wcard', list)[k]; if (!c) return;
      if (list.scrollWidth > list.clientWidth + 4) list.scrollTo({ left: c.offsetLeft - list.offsetLeft - (list.clientWidth - c.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
    }
    layer.addEventListener('click', function (e) {
      var p = e.target.closest('.wmap__pin'); if (!p) return;
      var k = parseInt(p.getAttribute('data-k'), 10); mark(k); scrollCard(k);
    });
    layer.addEventListener('pointerover', function (e) { var p = e.target.closest && e.target.closest('.wmap__pin'); if (p && e.pointerType === 'mouse') mark(parseInt(p.getAttribute('data-k'), 10)); });
    list.addEventListener('pointerover', function (e) { var c = e.target.closest && e.target.closest('.wcard'); if (c && e.pointerType === 'mouse') mark(parseInt(c.getAttribute('data-k'), 10)); });
    list.addEventListener('focusin', function (e) { var c = e.target.closest('.wcard'); if (c) mark(parseInt(c.getAttribute('data-k'), 10)); });
    // carrusel (celular): la tarjeta centrada marca su pin
    var sx = 0;
    list.addEventListener('scroll', function () {
      if (sx) return;
      sx = requestAnimationFrame(function () {
        sx = 0;
        if (list.scrollWidth <= list.clientWidth + 4) return;
        var mid = list.scrollLeft + list.clientWidth / 2, best = 0, bd = Infinity;
        $$('.wcard', list).forEach(function (c, i) { var d = Math.abs(c.offsetLeft - list.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
        if (best !== cur) mark(best);
      });
    }, { passive: true });
    frame();
    window.addEventListener('resize', function () { clearTimeout(frame._t); frame._t = setTimeout(frame, 120); });
    // entrada: las calles se dibujan y los pines aparecen
    function intro() {
      if (!gsap || !ST || reduced) return;
      ST.create({ trigger: root, start: 'top 75%', once: true, onEnter: function () {
        root.classList.add('is-in');
        gsap.fromTo(pins, { scale: 0 }, { scale: 1, duration: .7, ease: 'back.out(2)', stagger: .07, delay: .35, clearProps: 'transform' });
      } });
    }
    return { labels: labels, intro: intro };
  })();

  /* ================= Scroll: hero, galería, reveals, contadores ================= */
  function scrollFx() {
    if (!gsap || !ST || reduced) return;

    // Hero: la foto se expande con el scroll
    if (hero2) hero2.scroll();
    if (wmap) wmap.intro();

    // Imágenes que se descubren de abajo hacia arriba al entrar
    $$('[data-reveal-img]').forEach(function (fig) {
      var st = { trigger: fig, start: 'top 88%', once: true }, img = $('img', fig);
      gsap.fromTo(fig, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: st });
      if (img) gsap.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 2, ease: 'expo.out', scrollTrigger: st });
    });

    // Reveals (arrancan visibles; sólo se animan al entrar)
    $$('[data-reveal]').forEach(function (el, i) {
      gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: 'power3.out', delay: (i % 3) * .08, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    if ($('.exp-card')) gsap.from('.exp-card', { x: 120, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.exp__viewport', start: 'top 85%', once: true } });
    if ($('.contact__img img')) gsap.fromTo('.contact__img img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Contadores
    $$('[data-countup]').forEach(function (el) {
      var target = parseFloat(el.dataset.target || el.textContent) || 0, o = { v: 0 };
      ST.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () {
        gsap.to(o, { v: target, duration: 1.8, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
      } });
    });

    // Footer: la marca RGM sube mientras aparece
    if ($('.footer__mark svg')) gsap.fromTo('.footer__mark svg', { yPercent: 35 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer__mark', start: 'top bottom', end: 'bottom bottom', scrub: true } });

    // Galería: pin + scroll horizontal
    var gal = $('[data-gallery]'), gtrack = $('[data-gal-track]');
    if (gal && gtrack) {
      var dist = function () { return Math.max(0, gtrack.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(gtrack).paddingLeft)); };
      gsap.to(gtrack, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: gal, start: 'top top', end: function () { return '+=' + dist(); },
          pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 1,
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
    if (hero2) hero2.fit();
    splitAll(true);
    var heroTl = hero2 ? hero2.intro() : null;
    scrollFx();
    curtainIn(function () { if (heroTl) heroTl.play(); });
    onScroll();
    if (ST) ST.refresh();
  };
  if (document.fonts && document.fonts.ready) {
    var done = false, go = function () { if (!done) { done = true; start(); } };
    document.fonts.ready.then(go); setTimeout(go, 1500);
  } else start();
  window.addEventListener('load', function () { if (ST) ST.refresh(); });
})();
