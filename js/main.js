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
  // punto más cercano de una línea (en metros del mapa) → [x, y, distancia]
  function nearestOn(p, line) {
    var best = [0, 0, Infinity];
    for (var k = 0; k < line.length - 1; k++) {
      var a = line[k], b = line[k + 1], dx = b[0] - a[0], dy = b[1] - a[1], q = dx * dx + dy * dy || 1;
      var u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / q));
      var x = a[0] + u * dx, y = a[1] + u * dy, d = Math.hypot(x - p[0], y - p[1]);
      if (d < best[2]) best = [x, y, d];
    }
    return best;
  }
  // Referencias: hasta el borde de Plaza Independencia y hasta el punto más cercano de la Peatonal y de Arístides
  var TARGETS = MAPD ? (function () {
    var xy = function (pts) { return pts.map(function (p) { return mapXY(p[0], p[1]); }); };
    var plaza = xy(MAPD.indep), peat = xy(MAPD.peatonal), arist = xy(MAPD.aristides);
    return [
      { k: 'plaza', key: 'where.indep', short: 'where.indepS', at: function (p) { return nearestOn(p, plaza); } },
      { k: 'peat', key: 'where.peat', at: function (p) { return nearestOn(p, peat); } },
      { k: 'arist', key: 'where.arist', at: function (p) { return nearestOn(p, arist); } }
    ];
  })() : [];
  // Por departamento: posición en el mapa y, para cada referencia, punto de llegada y minutos a pie
  var CITY = MAPD ? cityApts().map(function (o) {
    var p = mapXY(o.a.coords[0], o.a.coords[1]), w = {};
    TARGETS.forEach(function (tg) { var r = tg.at(p); w[tg.k] = { x: r[0], y: r[1], min: walkMin(r[2]) }; });
    return { a: o.a, p: p, w: w };
  }) : [];
  function aptFacts(a) {
    return [
      a.bedrooms === 0 ? t('apts.studio') : a.bedrooms != null ? a.bedrooms + ' ' + t(a.bedrooms === 1 ? 'apts.bedroom1' : 'apts.bedrooms').toLowerCase() : '',
      a.sleeps ? t('props.upTo', { n: a.sleeps }) : ''
    ].filter(Boolean).join(' · ');
  }
  function walkList(c, short) {
    return TARGETS.map(function (tg) { return '<li data-t="' + tg.k + '"><b>' + c.w[tg.k].min + ' min</b><span>' + esc(t(short && tg.short ? tg.short : tg.key)) + '</span></li>'; }).join('');
  }
  // Dos vistas de los mismos departamentos: lista (escritorio) y tarjetas sobre el mapa (celular y tablet)
  function renderWhere() {
    var list = $('[data-wlist]'), car = $('[data-wcar]'); if (!list || !MAPD) return;
    list.innerHTML = CITY.map(function (c, k) {
      var a = c.a;
      return '<li class="wcard" data-k="' + k + '">' +
        '<a class="wcard__img" href="' + aptURL(a) + '" tabindex="-1" aria-hidden="true" data-cursor="cur.view"><img decoding="async" src="' + sm(a.img) + '" alt="" loading="lazy">' +
          (a.badge ? '<span class="wcard__badge">' + esc(L(a.badge)) + '</span>' : '') + '</a>' +
        '<div class="wcard__body">' +
          '<p class="wcard__n"><span>' + pad(k + 1) + '</span>' + esc(aptFacts(a)) + '</p>' +
          '<h3 class="wcard__name"><a href="' + aptURL(a) + '">' + aptPrefix(a) + ' <em>' + esc(a.name) + '</em></a></h3>' +
          '<p class="wcard__tag">' + esc(L(a.tag)) + '</p>' +
          '<ul class="wcard__walk" aria-label="' + esc(t('where.walk')) + '">' + walkList(c) + '</ul>' +
        '</div></li>';
    }).join('');
    if (car) car.innerHTML = CITY.map(function (c, k) {
      var a = c.a;
      return '<li class="wcar__item" data-k="' + k + '">' +
        '<a class="wcar__img" href="' + aptURL(a) + '" tabindex="-1" aria-hidden="true"><img decoding="async" src="' + sm(a.img) + '" alt="" loading="lazy">' +
          (a.badge ? '<span class="wcar__badge">' + esc(L(a.badge)) + '</span>' : '') + '</a>' +
        '<div class="wcar__body">' +
          '<p class="wcar__n"><span>' + pad(k + 1) + '</span>' + esc(aptFacts(a)) + '</p>' +
          '<h3 class="wcar__name"><a href="' + aptURL(a) + '"><span class="sr-only">' + aptPrefix(a) + ' </span><em>' + esc(a.name) + '</em></a></h3>' +
          '<ul class="wcar__walk" aria-label="' + esc(t('where.walk')) + '">' + walkList(c, true) + '</ul>' +
        '</div></li>';
    }).join('');
    if (typeof wmap !== 'undefined' && wmap) wmap.sync();
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
      var same = {};
      pts.forEach(function (a, i) {
        // dos departamentos en el mismo edificio (misma dirección): el segundo pin se corre al costado
        var key = a.coords.join(','), d = same[key] = (same[key] || 0) + 1, dx = (d - 1) * 30;
        var icon = window.L.divIcon({ className: '', html: '<span class="pmap__pin">' + (a.kind === 'house' ? HOUSE : (APTS.indexOf(a) + 1)) + '</span>', iconSize: [34, 34], iconAnchor: [17 - dx, 17], popupAnchor: [dx, -18] });
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
        ['apt.guests', fmtNum(a.sleeps)], ['apt.bedrooms', fmtRooms(a.bedrooms)], ['apt.baths', fmtNum(a.baths)], ['apt.beds', D.beds && typeof D.beds === 'object' ? L(D.beds) : fmtNum(D.beds != null ? D.beds : a.bedrooms)]
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

  /* ================= Mapa ilustrado del centro (interactivo) =================
   * Cámara propia (sin librerías): el mapa base es una imagen SVG dentro de una capa que sólo se
   * traslada/escala con transform; al quedar quieto se "fija" al tamaño nuevo para verse nítido.
   * Calles resaltadas, recorridos a pie, pines y nombres van en capas aparte, en coordenadas de pantalla
   * (no se agrandan con el zoom). Gestos: arrastrar, pellizcar, Ctrl/⌘ + rueda, doble clic y botones.
   * En el celular el mapa no captura el dedo (la página tiene que poder scrollear): para moverlo
   * libremente se abre en pantalla completa. */
  var wmap = (function () {
    var root = $('[data-wmap]');
    if (!root || !MAPD || !CITY.length) return null;
    var W = MAPD.size[0], H = MAPD.size[1];
    var sec = root.closest('.where') || root, wrap = root.parentNode;
    var list = $('[data-wlist]'), car = $('[data-wcar]'), chipsBox = $('.wmap__chips', root), toastEl = $('[data-wmap-toast]', root);
    var scaleEl = $('.wmap__bar', root), fullBtn = $('[data-wmap-full]', root);
    var finePtr = window.matchMedia('(hover: hover) and (pointer: fine)');
    var XY = function (pts) { return pts.map(function (p) { return mapXY(p[0], p[1]); }); };
    var PEAT = XY(MAPD.peatonal), ARIS = XY(MAPD.aristides), INDEP = XY(MAPD.indep);
    var PLZ = Object.keys(MAPD.plazas).map(function (k) { return { k: k, p: mapXY(MAPD.plazas[k][0], MAPD.plazas[k][1]) }; });
    var PARK = MAPD.parkLbl;
    function wline(pts) { return 'M' + pts.map(function (q) { return q[0].toFixed(0) + ' ' + q[1].toFixed(0); }).join('L'); }

    // ---------- capas ----------
    root.insertAdjacentHTML('afterbegin',
      // Peatonal, Arístides y la plaza van dentro del mapa (se escalan con él: no se redibujan en cada cuadro)
      '<div class="wmap__world" aria-hidden="true"><img class="wmap__base" src="img/map-centro.svg" alt="" draggable="false" decoding="async">' +
        '<svg class="wmap__wink" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
          '<path class="wmap__zone" d="' + wline(INDEP) + 'Z"/><path class="wmap__glow" data-z="peat" d="' + wline(PEAT) + '"/><path class="wmap__glow" data-z="arist" d="' + wline(ARIS) + '"/>' +
          '<path class="wmap__hl" data-z="arist" pathLength="1" d="' + wline(ARIS) + '"/><path class="wmap__hl" data-z="peat" pathLength="1" d="' + wline(PEAT) + '"/></svg></div>' +
      // recorridos a pie: en pantalla (finos y del mismo tamaño con cualquier zoom)
      '<svg class="wmap__ink" aria-hidden="true"><g class="wmap__rays"></g></svg>' +
      '<div class="wmap__layer"></div>');
    var world = $('.wmap__world', root), ink = $('.wmap__ink', root), layer = $('.wmap__layer', root);
    var raysG = $('.wmap__rays', ink);

    // ---------- pines ----------
    var pins = CITY.map(function (c, k) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'wmap__pin'; b.setAttribute('data-k', k);
      b.setAttribute('aria-label', aptLabel(c.a));
      b.innerHTML = '<span class="wmap__num">' + pad(k + 1) + '</span><span class="wmap__name">' + esc(c.a.name) + '</span><span class="wmap__mins"></span>';
      layer.appendChild(b); return b;
    });
    // ---------- nombres: plazas, parque, Peatonal/Arístides y calles (según el zoom) ----------
    var LBL = [];
    function addLbl(cls, htmlStr, x, y, a, pr, txt, extra) {
      var el = document.createElement('span');
      el.className = 'wmap__lbl ' + cls; el.innerHTML = htmlStr; layer.appendChild(el);
      var o = { el: el, x: x, y: y, a: a || 0, pr: pr, txt: txt || htmlStr, extra: extra || '', w: 0, h: 0, v: false, ox: 0, oy: 0 };
      LBL.push(o); return o;
    }
    PLZ.forEach(function (z) { addLbl('wmap__lbl--plaza' + (z.k === 'Independencia' ? ' is-main' : ''), '<small>Plaza</small>' + esc(z.k), z.p[0], z.p[1], 0, z.k === 'Independencia' ? 0 : 1, 'P' + z.k); });
    var mainLbl = LBL[PLZ.map(function (z) { return z.k; }).indexOf('Independencia')];
    var parkLbl = addLbl('wmap__lbl--park', esc(t('where.park')), PARK[0], PARK[1], 0, 1, 'park');
    function lineAnchors(pts, step, first) {
      var out = [], acc = 0, next = first;
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        while (l > 0 && acc + l >= next) {
          var u = (next - acc) / l, ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
          if (ang > 90) ang -= 180; if (ang <= -90) ang += 180;
          out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, ang]); next += step;
        }
        acc += l;
      }
      return out;
    }
    lineAnchors(PEAT, 120, 60).forEach(function (q) { addLbl('wmap__lbl--hl', 'Peatonal Sarmiento', q[0], q[1], q[2], 1, 'peat', ' translateY(-13px)'); });
    lineAnchors(ARIS, 420, 330).forEach(function (q) { addLbl('wmap__lbl--hl', 'Arístides Villanueva', q[0], q[1], q[2], 1, 'arist', ' translateY(-13px)'); });
    MAPD.streets.forEach(function (s) { addLbl('wmap__lbl--st' + (s[1] < 3 ? ' is-av' : ''), esc(s[0]), s[2], s[3], s[4], s[1], s[0]); });
    var ORDER = LBL.slice().sort(function (a, b) { return a.pr - b.pr; });
    var edge = document.createElement('button');
    edge.type = 'button'; edge.className = 'wmap__edge'; layer.appendChild(edge);
    var bubs = TARGETS.map(function () { var b = document.createElement('span'); b.className = 'wmap__bub'; layer.appendChild(b); return b; });
    function measureLbls() { LBL.forEach(function (o) { o.w = o.el.offsetWidth; o.h = o.el.offsetHeight; }); }

    // ---------- cámara ----------
    var cam = { x: W / 2, y: H / 2, s: .3 }, S0 = 0, vw = 1, vh = 1, it = 0, ib = 0, yc = 0;
    var sMin = .1, sMax = 1.6, fitA = null, userMoved = false, full = false, mode = 'all', cur = -1;
    var BOUNDS = (function () {
      var pts = CITY.map(function (c) { return c.p; }).concat(PLZ.map(function (z) { return z.p; }), PEAT);
      var e = ARIS[0], west = ARIS.filter(function (q) { return Math.hypot(q[0] - e[0], q[1] - e[1]) < 520; });
      pts = pts.concat(west);
      return box(pts, 60);
    })();
    function box(pts, m) {
      var b = [Infinity, Infinity, -Infinity, -Infinity];
      pts.forEach(function (q) { b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); });
      return [b[0] - m, b[1] - m, b[2] + m, b[3] + m];
    }
    var sx = function (x) { return (x - cam.x) * cam.s + vw / 2; };
    var sy = function (y) { return (y - cam.y) * cam.s + yc; };
    function clampC(c) {
      var s = Math.max(sMin, Math.min(sMax, c.s)), hw = vw / 2 / s;
      return { s: s, x: Math.max(hw, Math.min(W - hw, c.x)), y: Math.max(yc / s, Math.min(H - (vh - yc) / s, c.y)) };
    }
    function fit(b, padPx, maxS) {
      var w = Math.max(40, vw - 2 * padPx), h = Math.max(40, vh - it - ib - 2 * padPx);
      var s = Math.min(w / Math.max(b[2] - b[0], 1), h / Math.max(b[3] - b[1], 1));
      if (maxS) s = Math.min(s, maxS);
      return clampC({ x: (b[0] + b[2]) / 2, y: (b[1] + b[3]) / 2, s: s });
    }
    function measure() {
      vw = root.clientWidth || 1; vh = root.clientHeight || 1;
      it = chipsBox ? chipsBox.offsetTop + chipsBox.offsetHeight + 8 : 12;
      var carOn = car && car.offsetParent && getComputedStyle(car).display !== 'none';
      ib = carOn ? vh - car.offsetTop + 8 : 30;
      if (vh - it - ib < 160) ib = Math.max(20, vh - it - 160);
      yc = it + (vh - it - ib) / 2;
      root.style.setProperty('--it', it + 'px'); root.style.setProperty('--ib', ib + 'px');
      ink.setAttribute('viewBox', '0 0 ' + vw.toFixed(0) + ' ' + vh.toFixed(0));
      sMin = Math.max(vw / W, vh / H);
      fitA = fit(BOUNDS, 34);
      sMax = Math.max(1.5, fitA.s * 3.2);
    }

    // ---------- dibujo de cada cuadro ----------
    var P = [], VIS = [], rafId = 0;
    function lblT(o, x, y) { return 'translate3d(' + (x + o.ox).toFixed(1) + 'px,' + (y + o.oy).toFixed(1) + 'px,0)' + (o.a ? ' rotate(' + o.a + 'deg)' : '') + ' translate(-50%,-50%)' + o.extra; }
    function render() {
      if (!S0) return;
      var k = cam.s / S0;
      world.style.transform = 'translate3d(' + sx(0).toFixed(2) + 'px,' + sy(0).toFixed(2) + 'px,0) scale(' + k.toFixed(5) + ')';
      // pines (los que quedan casi encima se separan un poco)
      P = CITY.map(function (c) { return [sx(c.p[0]), sy(c.p[1])]; });
      for (var i = 0; i < P.length; i++) for (var j = i + 1; j < P.length; j++) {
        var d = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]);
        if (d < 30) { var o = (30 - d) / 2 + 1; P[i][0] -= o; P[j][0] += o; }
      }
      pins.forEach(function (el, i) { el.style.transform = 'translate3d(' + P[i][0].toFixed(1) + 'px,' + P[i][1].toFixed(1) + 'px,0)'; });
      rays();
      VIS.forEach(function (o) { o.el.style.transform = lblT(o, sx(o.x), sy(o.y)); });
      if (edge.classList.contains('is-v')) edge.style.transform = 'translate3d(0,' + Math.max(it + 16, Math.min(vh - ib - 16, sy(PARK[1]))).toFixed(1) + 'px,0) translateY(-50%)';
      // escala gráfica
      var Ls = [25, 50, 100, 200, 300, 500, 1000], L = 25;
      Ls.forEach(function (m) { if (m * cam.s <= 92) L = m; });
      scaleEl.style.setProperty('--w', (L * cam.s).toFixed(1) + 'px');
      if (scaleEl.getAttribute('data-l') !== String(L)) { scaleEl.setAttribute('data-l', L); scaleEl.lastChild.textContent = (L >= 1000 ? L / 1000 + ' km' : L + ' m'); }
    }
    function schedule() { if (!rafId) rafId = requestAnimationFrame(function () { rafId = 0; render(); }); }
    var cto = 0;
    function commit() {
      clearTimeout(cto);
      S0 = cam.s;
      var far = cam.s < .3;
      if (far !== root.classList.contains('is-far')) { root.classList.toggle('is-far', far); measureLbls(); }
      world.style.width = (W * S0).toFixed(1) + 'px'; world.style.height = (H * S0).toFixed(1) + 'px';
      root.classList.remove('is-moving');
      render(); place();
    }
    function commitSoon(ms) { clearTimeout(cto); cto = setTimeout(commit, ms == null ? 160 : ms); }
    function moving() { root.classList.add('is-moving'); }

    // ---------- recorridos a pie del departamento elegido ----------
    var rayEls = TARGETS.map(function () {
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.innerHTML = '<path class="wmap__ray"/><circle class="wmap__end" r="4.5"/>';
      raysG.appendChild(g); return g;
    });
    function rayTargets() { return mode === 'all' ? TARGETS : TARGETS.filter(function (tg) { return tg.k === mode; }); }
    var bubW = [0, 0, 0], BUBR = [];
    function rays() {
      var ts = rayTargets(), avoid = P.map(function (q) { return [q[0] - 18, q[1] - 18, q[0] + 18, q[1] + 18]; });
      if (cur > -1 && P[cur]) avoid.push([P[cur][0] + 14, P[cur][1] - 15, P[cur][0] + 34 + nameW(cur), P[cur][1] + 15]);
      BUBR = [];
      rayEls.forEach(function (g, i) {
        var tg = TARGETS[i], on = cur > -1 && ts.indexOf(tg) > -1;
        g.style.display = on ? '' : 'none'; bubs[i].classList.toggle('is-v', on);
        if (!on) return;
        var c = CITY[cur], a = P[cur] || [sx(c.p[0]), sy(c.p[1])], e = c.w[tg.k], ex = sx(e.x), ey = sy(e.y);
        g.firstChild.setAttribute('d', 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1));
        g.lastChild.setAttribute('cx', ex.toFixed(1)); g.lastChild.setAttribute('cy', ey.toFixed(1));
        // los minutos van junto al punto de llegada, en el primer lugar libre
        var dx = ex - a[0], dy = ey - a[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy, ny = ux;
        var hw = (bubW[i] || 60) / 2 + 3, hh = 12, best = null;
        var cands = [[ux * (hw + 8), uy * 22], [nx * 26, ny * 26], [-nx * 26, -ny * 26], [ux * (hw + 8) + nx * 26, uy * 22 + ny * 26], [ux * (hw + 8) - nx * 26, uy * 22 - ny * 26], [ux * (hw + 30), uy * 46], [nx * 48, ny * 48], [-nx * 48, -ny * 48], [-ux * (hw + 10), -uy * 26]];
        cands.some(function (o) {
          var bx = ex + o[0], by = ey + o[1], r = [bx - hw, by - hh, bx + hw, by + hh];
          if (hit(r, avoid)) return false;
          best = r; return true;
        });
        if (!best) { var o0 = cands[0]; best = [ex + o0[0] - hw, ey + o0[1] - hh, ex + o0[0] + hw, ey + o0[1] + hh]; }
        avoid.push(best); BUBR.push(best);
        bubs[i].style.transform = 'translate3d(' + ((best[0] + best[2]) / 2).toFixed(1) + 'px,' + ((best[1] + best[3]) / 2).toFixed(1) + 'px,0) translate(-50%,-50%)';
      });
    }
    function nameW(k) { return pins[k].children[1].offsetWidth || 70; }
    var WALK = '<svg viewBox="0 0 12 16" aria-hidden="true"><circle cx="7" cy="2" r="1.6"/><path d="M6.2 4.6 4 6.4 3.4 9M6.2 4.6l1 4.2 2.3 2M7.2 8.8 5.6 12 4.4 15M9.5 6.6 7 5.4"/></svg>';
    function fillBubs() {
      if (cur < 0) return;
      TARGETS.forEach(function (tg, i) { bubs[i].innerHTML = WALK + '<b>' + CITY[cur].w[tg.k].min + ' min</b>'; bubW[i] = bubs[i].offsetWidth; });
    }

    // ---------- nombres visibles: por zoom, sin pisarse entre sí ni con pines y controles ----------
    function setVis(o, on) { if (o.v === on) return; o.v = on; o.el.classList.toggle('is-v', on); }
    function overlap(r, list) { var a = 0; list.forEach(function (b) { a += Math.max(0, Math.min(r[2], b[2]) - Math.max(r[0], b[0])) * Math.max(0, Math.min(r[3], b[3]) - Math.max(r[1], b[1])); }); return a; }
    function hit(r, list) { for (var i = 0; i < list.length; i++) { var b = list[i]; if (r[0] < b[2] && r[2] > b[0] && r[1] < b[3] && r[3] > b[1]) return true; } return false; }
    function place() {
      var occ = [[0, 0, vw, it - 4]];
      if (ib > 40) occ.push([0, vh - ib + 6, vw, vh]);
      occ.push([vw - 62, it - 8, vw, it + 140]);              // botones de zoom
      occ.push([0, vh - ib - 40, 150, vh - ib]);              // escala
      var pinR = P.map(function (q) { return [q[0] - 18, q[1] - 18, q[0] + 18, q[1] + 18]; });
      occ = occ.concat(pinR);
      if (cur > -1 && P[cur]) occ.push([P[cur][0] + 14, P[cur][1] - 15, P[cur][0] + 34 + nameW(cur), P[cur][1] + 15]);
      // minutos debajo de cada pin ("Cerca de"): el elegido y los más cerca primero; si se pisan, se ocultan
      if (mode !== 'all') {
        var bk = CITY.map(function (c, k) { return k; }).sort(function (a, b) { return (b === cur) - (a === cur) || CITY[a].w[mode].min - CITY[b].w[mode].min; });
        var badges = [];
        bk.forEach(function (k) {
          var q = P[k], r = [q[0] - 22, q[1] + 15, q[0] + 22, q[1] + 32];
          var off = hit(r, badges) || hit(r, pinR.filter(function (b, i) { return i !== k; }));
          pins[k].classList.toggle('mins-off', off); if (!off) badges.push(r);
        });
        occ = occ.concat(badges);
      }
      // aviso del parque (fuera de cuadro, en el borde izquierdo)
      var pOut = sx(PARK[0]) < 30;
      if (pOut) { var ey = Math.max(it + 16, Math.min(vh - ib - 16, sy(PARK[1]))); occ.push([0, ey - 20, edge.offsetWidth + 8, ey + 20]); }
      // los minutos de los recorridos se ubican antes que los nombres (los nombres se corren o se ocultan)
      rays(); occ = occ.concat(BUBR.map(function (r) { return [r[0] - 3, r[1] - 3, r[2] + 3, r[3] + 3]; }));
      var allow = cam.s >= .46 ? 3 : cam.s >= .27 ? 2 : 1, shown = [];
      ORDER.forEach(function (o) {
        var ok = o.pr <= allow, r;
        if (ok) {
          var x = sx(o.x), y = sy(o.y), rad = o.a * Math.PI / 180, c = Math.abs(Math.cos(rad)), s = Math.abs(Math.sin(rad));
          var hw = (o.w * c + o.h * s) / 2 + 4, hh = (o.w * s + o.h * c) / 2 + 3;
          if (o.extra) { y -= 13 * c; x += 13 * Math.sin(rad); }
          // las plazas prueban correrse un poco si algo las tapa; Plaza Independencia siempre se muestra
          var tries = o.pr < 2 && !o.a && !o.extra ? [[0, 0], [0, -hh * 1.2], [0, hh * 1.2], [-hw * .6, 0], [hw * .6, 0], [0, -hh * 2], [0, hh * 2], [-hw * .8, -hh * 1.2], [hw * .8, -hh * 1.2], [-hw * .8, hh * 1.2], [hw * .8, hh * 1.2], [0, -hh * 3], [0, hh * 3], [-hw * 1.1, 0], [hw * 1.1, 0], [0, -hh * 4], [0, hh * 4]] : [[0, 0]], pick = null;
          var least = Infinity, leastI = 0;
          for (var i = 0; i < tries.length && !pick; i++) {
            var cx = x + tries[i][0], cy = y + tries[i][1], rr = [cx - hw, cy - hh, cx + hw, cy + hh];
            if (rr[0] < 4 || rr[1] < 4 || rr[2] > vw - 4 || rr[3] > vh - 4) continue;
            if (hit(rr, occ)) { var ov = overlap(rr, occ); if (ov < least) { least = ov; leastI = i; } continue; }
            pick = tries[i]; r = rr;
          }
          // Plaza Independencia no se oculta: va donde menos tape
          if (!pick && o === mainLbl && x > 0 && x < vw && y > it && y < vh - ib) { pick = tries[leastI]; r = [x + pick[0] - hw, y + pick[1] - hh, x + pick[0] + hw, y + pick[1] + hh]; }
          ok = !!pick && !shown.some(function (p) { return p.txt === o.txt && Math.hypot(sx(p.x) - sx(o.x), sy(p.y) - sy(o.y)) < 300; });
          if (ok) { o.ox = pick[0]; o.oy = pick[1]; }
        }
        if (ok) { occ.push(r); shown.push(o); o.el.style.transform = lblT(o, sx(o.x), sy(o.y)); }
        setVis(o, ok);
      });
      VIS = shown;
      // el parque fuera de cuadro: aviso en el borde (lleva al parque)
      edge.classList.toggle('is-v', pOut && !parkLbl.v);
      if (pOut) render();
    }

    // ---------- animación de cámara ----------
    var anim = null;
    function stopAnim() { if (anim) { cancelAnimationFrame(anim.raf); anim = null; } if (inert) { cancelAnimationFrame(inert); inert = 0; } }
    function flyTo(to, dur) {
      to = clampC(to); stopAnim();
      if (reduced || dur === 0) { cam = to; commit(); return; }
      var from = { x: cam.x, y: cam.y, s: cam.s }, t0 = performance.now();
      var ms = Math.min(from.s, to.s), dist = Math.hypot((to.x - from.x) * ms, (to.y - from.y) * ms), zr = Math.abs(Math.log(to.s / from.s));
      if (dist < 1 && zr < .01) { commit(); return; }
      dur = dur || Math.min(1500, 650 + dist * .45 + zr * 420);
      moving();
      anim = { raf: 0 };
      (function step(now) {
        if (!anim) return;
        var u = Math.min(1, (now - t0) / dur), e = u < .5 ? 8 * u * u * u * u : 1 - 8 * Math.pow(1 - u, 4);
        cam = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, s: from.s * Math.pow(to.s / from.s, e) };
        render();
        if (u < 1) anim.raf = requestAnimationFrame(step); else { anim = null; commit(); }
      })(t0);
    }
    function zoomAt(px, py, f, c) {
      c = c || cam;
      var mx = (px - vw / 2) / c.s + c.x, my = (py - yc) / c.s + c.y, s = Math.max(sMin, Math.min(sMax, c.s * f));
      return clampC({ s: s, x: mx - (px - vw / 2) / s, y: my - (py - yc) / s });
    }
    function zoomBy(f, px, py) { userMoved = true; flyTo(zoomAt(px == null ? vw / 2 : px, py == null ? yc : py, f, anim ? null : cam), 520); }

    // ---------- selección ----------
    function frameFor(k) {
      var c = CITY[k], pts = [c.p].concat(rayTargets().map(function (tg) { return [c.w[tg.k].x, c.w[tg.k].y]; }));
      return fit(box(pts, 90), 46, Math.max(fitA.s * 2.3, .62));
    }
    function select(k, o) {
      o = o || {};
      if (k < 0 || k >= CITY.length) return;
      if (k !== cur) {
        cur = k;
        pins.forEach(function (p, i) { p.classList.toggle('is-on', i === k); });
        $$('.wcard', list).concat(car ? $$('.wcar__item', car) : []).forEach(function (c) { c.classList.toggle('is-on', +c.getAttribute('data-k') === k); });
        fillBubs();
        raysG.classList.remove('is-anim'); void raysG.getBoundingClientRect(); raysG.classList.add('is-anim');
        rays(); if (!o.fly) commitSoon(80);
      }
      if (o.scroll) scrollCard(k);
      if (o.fly) { userMoved = true; flyTo(frameFor(k)); }
    }
    function scrollCard(k, instant) {
      var c = car && $('.wcar__item[data-k="' + k + '"]', car); if (!c || car.scrollWidth <= car.clientWidth + 4) return;
      carLock = Date.now() + 700;
      car.scrollTo({ left: c.offsetLeft - 12, behavior: reduced || instant ? 'auto' : 'smooth' });
    }
    // "Cerca de": ordena por minutos a pie y muestra los minutos en cada pin
    function setMode(m, quiet) {
      mode = m;
      sec.setAttribute('data-near', m); root.setAttribute('data-near', m);
      $$('[data-mode]', chipsBox).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mode') === m ? 'true' : 'false'); });
      var order = CITY.map(function (c, k) { return k; });
      if (m !== 'all') order.sort(function (a, b) { return CITY[a].w[m].min - CITY[b].w[m].min || a - b; });
      reorder(list, '.wcard', order, true); if (car) { carLock = Date.now() + 600; reorder(car, '.wcar__item', order, false); car.scrollLeft = 0; }
      pins.forEach(function (p, k) { p.lastChild.textContent = m === 'all' ? '' : CITY[k].w[m].min + ' min'; });
      var first = order[0]; cur = -1; select(first, { fly: false });
      if (quiet) return;
      userMoved = m !== 'all';
      if (m === 'all') flyTo(fitA);
      else {
        var pts = []; CITY.forEach(function (c) { pts.push(c.p, [c.w[m].x, c.w[m].y]); });
        if (m === 'plaza') pts = pts.concat(INDEP);
        flyTo(fit(box(pts, 70), 30));
      }
    }
    function reorder(el, sel, order, flip) {
      if (!el) return;
      var items = $$(sel, el), before = {};
      if (flip && !reduced) items.forEach(function (n) { before[n.getAttribute('data-k')] = n.getBoundingClientRect().top; });
      order.forEach(function (k) { var n = $(sel + '[data-k="' + k + '"]', el); if (n) el.appendChild(n); });
      if (flip && !reduced && items[0] && items[0].animate) items.forEach(function (n) {
        var d = before[n.getAttribute('data-k')] - n.getBoundingClientRect().top;
        if (Math.abs(d) > 1) n.animate([{ transform: 'translateY(' + d + 'px)' }, { transform: 'none' }], { duration: 750, easing: 'cubic-bezier(.19,1,.22,1)' });
      });
    }

    // ---------- avisos ----------
    var tt = 0;
    function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200); }

    // ---------- gestos ----------
    var ptrs = {}, drag = null, pinch = null, inert = 0, vel = [0, 0], lastMv = 0, lastTap = 0, dragged = 0, touchStart = null;
    function rel(e) { var r = root.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function ui(e) { return e.target.closest && e.target.closest('.wmap__chips, .wmap__ctrl, .wcar, .wmap__toast'); }
    function pinchInfo() { var ids = Object.keys(ptrs), a = ptrs[ids[0]], b = ptrs[ids[1]]; return { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }; }
    root.addEventListener('pointerdown', function (e) {
      if (ui(e) || e.button > 0) return;
      if (e.pointerType === 'touch' && !full) { touchStart = [e.clientX, e.clientY]; return; }
      ptrs[e.pointerId] = rel(e); stopAnim();
      var n = Object.keys(ptrs).length;
      if (n === 1) { drag = { p: rel(e), moved: false, id: e.pointerId }; vel = [0, 0]; }
      if (n === 2) { pinch = pinchInfo(); if (drag) drag.moved = true; try { root.setPointerCapture(e.pointerId); } catch (x) { /* nada */ } moving(); }
    });
    root.addEventListener('pointermove', function (e) {
      if (touchStart && e.pointerType === 'touch' && !full) {
        var dx = e.clientX - touchStart[0], dy = e.clientY - touchStart[1];
        if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 1.4 && !ui(e)) { touchStart = null; toast(t('where.touchHint')); }
        return;
      }
      if (!ptrs[e.pointerId]) return;
      var prev = ptrs[e.pointerId], now = rel(e); ptrs[e.pointerId] = now;
      if (Object.keys(ptrs).length >= 2 && pinch) {
        var q = pinchInfo(), z = zoomAt(q.m[0], q.m[1], q.d / pinch.d);
        z.x -= (q.m[0] - pinch.m[0]) / z.s; z.y -= (q.m[1] - pinch.m[1]) / z.s;
        cam = clampC(z); pinch = q; userMoved = true; schedule(); return;
      }
      if (!drag) return;
      if (!drag.moved) {
        if (Math.hypot(now[0] - drag.p[0], now[1] - drag.p[1]) < 6) return;
        drag.moved = true; try { root.setPointerCapture(e.pointerId); } catch (x) { /* nada */ }
        root.classList.add('is-drag'); moving();
      }
      var ddx = now[0] - prev[0], ddy = now[1] - prev[1], tm = performance.now(), dt = Math.max(8, tm - lastMv);
      vel = [vel[0] * .3 + ddx / dt * .7, vel[1] * .3 + ddy / dt * .7]; lastMv = tm;
      cam = clampC({ x: cam.x - ddx / cam.s, y: cam.y - ddy / cam.s, s: cam.s }); userMoved = true; schedule();
    });
    function up(e) {
      touchStart = null;
      if (!ptrs[e.pointerId]) return;
      delete ptrs[e.pointerId];
      var ids = Object.keys(ptrs);
      if (ids.length === 1) { pinch = null; drag = { p: ptrs[ids[0]], moved: true, id: +ids[0] }; vel = [0, 0]; return; }
      if (ids.length) return;
      pinch = null; root.classList.remove('is-drag');
      var d = drag; drag = null;
      if (d && d.moved) {
        dragged = Date.now();
        if (performance.now() - lastMv < 60 && Math.hypot(vel[0], vel[1]) > .15 && !reduced) inertia(); else commitSoon(60);
      } else if (e.pointerType === 'touch' && full && e.type === 'pointerup') {
        // doble toque: acercar
        var p = rel(e);
        if (Date.now() - lastTap < 300) { zoomBy(2, p[0], p[1]); lastTap = 0; } else lastTap = Date.now();
      }
    }
    root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
    function inertia() {
      var last = performance.now();
      (function step(now) {
        var dt = Math.min(32, now - last); last = now;
        vel = [vel[0] * Math.pow(.92, dt / 16), vel[1] * Math.pow(.92, dt / 16)];
        cam = clampC({ x: cam.x - vel[0] * dt / cam.s, y: cam.y - vel[1] * dt / cam.s, s: cam.s }); render();
        if (Math.hypot(vel[0], vel[1]) > .02) inert = requestAnimationFrame(step); else { inert = 0; commit(); }
      })(last);
    }
    root.addEventListener('wheel', function (e) {
      if (ui(e)) return;
      if (e.ctrlKey || e.metaKey || full) {
        e.preventDefault(); stopAnim(); moving();
        var p = rel(e), dy = Math.max(-60, Math.min(60, e.deltaMode ? e.deltaY * 20 : e.deltaY));
        cam = zoomAt(p[0], p[1], Math.exp(-dy * (e.ctrlKey ? .012 : .004))); userMoved = true; schedule(); commitSoon(180);
      } else if (finePtr.matches && Math.abs(e.deltaY) > Math.abs(e.deltaX)) toast(t('where.ctrlHint'));
    }, { passive: false });
    root.addEventListener('dblclick', function (e) { if (ui(e) || e.target.closest('.wmap__pin')) return; var p = rel(e); zoomBy(e.shiftKey ? .5 : 2, p[0], p[1]); });
    root.addEventListener('keydown', function (e) {
      if (e.target !== root) return;
      var step = 120 / cam.s, m = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (m) { e.preventDefault(); userMoved = true; flyTo({ x: cam.x + m[0], y: cam.y + m[1], s: cam.s }, 380); }
      else if (e.key === '+' || e.key === '=') zoomBy(1.6);
      else if (e.key === '-') zoomBy(1 / 1.6);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && full) setFull(false); });

    // ---------- clics ----------
    layer.addEventListener('click', function (e) {
      if (Date.now() - dragged < 250) return;
      var p = e.target.closest('.wmap__pin');
      if (p) { select(+p.getAttribute('data-k'), { fly: true, scroll: true }); return; }
      if (e.target.closest('.wmap__edge')) { userMoved = true; flyTo({ x: PARK[0] + 380, y: PARK[1], s: Math.max(fitA.s, .3) }); }
    });
    layer.addEventListener('pointerover', function (e) {
      var p = e.pointerType === 'mouse' && e.target.closest && e.target.closest('.wmap__pin');
      if (p) select(+p.getAttribute('data-k'));
    });
    $$('[data-wmap-zoom]', root).forEach(function (b) { b.addEventListener('click', function () { zoomBy(+b.getAttribute('data-wmap-zoom') > 0 ? 1.7 : 1 / 1.7); }); });
    $$('[data-mode]', chipsBox).forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); }); });
    if (list) {
      list.addEventListener('pointerover', function (e) { var c = e.pointerType === 'mouse' && e.target.closest && e.target.closest('.wcard'); if (c) select(+c.getAttribute('data-k')); });
      list.addEventListener('focusin', function (e) { var c = e.target.closest('.wcard'); if (c) select(+c.getAttribute('data-k')); });
      list.addEventListener('click', function (e) { var c = e.target.closest('.wcard'); if (c && !e.target.closest('a')) select(+c.getAttribute('data-k'), { fly: true }); });
    }
    // tarjetas sobre el mapa: la que queda primera elige su departamento y la cámara va hacia él
    var carLock = 0, cst = 0;
    if (car) car.addEventListener('click', function (e) { var c = e.target.closest('.wcar__item'); if (c && !e.target.closest('a')) { select(+c.getAttribute('data-k'), { fly: true, scroll: true }); } });
    if (car) car.addEventListener('scroll', function () {
      clearTimeout(cst);
      cst = setTimeout(function () {
        if (Date.now() < carLock) return;
        var x0 = car.scrollLeft + 12, best = -1, bd = Infinity;
        $$('.wcar__item', car).forEach(function (c) { var d = Math.abs(c.offsetLeft - x0); if (d < bd) { bd = d; best = +c.getAttribute('data-k'); } });
        if (best > -1 && best !== cur) select(best, { fly: true });
      }, 120);
    }, { passive: true });

    // ---------- pantalla completa (celular / tablet) ----------
    function setFull(on, fromPop) {
      if (on === full) return;
      full = on;
      if (on) {
        wrap.style.height = wrap.offsetHeight + 'px';
        root.classList.add('is-full'); html.classList.add('wmap-lock');
        if (lenis) lenis.stop();
        try { history.pushState({ wmap: 1 }, ''); } catch (x) { /* nada */ }
      } else {
        root.classList.remove('is-full'); html.classList.remove('wmap-lock'); wrap.style.height = '';
        if (lenis) lenis.start();
        if (!fromPop && history.state && history.state.wmap) try { history.back(); } catch (x) { /* nada */ }
      }
      if (fullBtn) fullBtn.setAttribute('aria-label', t(on ? 'where.close' : 'where.expand'));
      carLock = Date.now() + 800;
      resize(true); if (cur > -1) scrollCard(cur, true);
      if (on) root.focus({ preventScroll: true });
    }
    if (fullBtn) fullBtn.addEventListener('click', function () { setFull(!full); });
    window.addEventListener('popstate', function () { if (full) setFull(false, true); });

    // ---------- tamaño ----------
    function resize(keep) {
      var c = cam, sFitOld = fitA ? fitA.s : 0;
      measure();
      if (!S0 || (!userMoved && !keep)) cam = fitA;
      else cam = clampC({ x: c.x, y: c.y, s: keep || !sFitOld ? c.s : c.s * fitA.s / sFitOld });
      measureLbls(); commit();
    }
    // el tamaño del mapa o de las tarjetas cambia (rotación, idioma, fuentes): se vuelve a encuadrar
    var rzt = 0, lastSig = '';
    function sig() { return root.clientWidth + 'x' + root.clientHeight + ':' + (car ? car.offsetHeight + '/' + car.offsetTop : ''); }
    function onResize() {
      clearTimeout(rzt);
      rzt = setTimeout(function () { var g = sig(); if (g === lastSig) return; lastSig = g; resize(false); }, 120);
    }
    if (window.ResizeObserver) { var ro = new ResizeObserver(onResize); ro.observe(root); if (car) ro.observe(car); } else window.addEventListener('resize', onResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measureLbls(); place(); });

    // ---------- arranque ----------
    measure(); cam = fitA; lastSig = sig(); measureLbls();
    select(0);
    if (gsap && ST && !reduced) cam = clampC({ x: fitA.x, y: fitA.y, s: fitA.s * .86 });
    else root.classList.add('is-in');
    commit();
    function intro() {
      if (!gsap || !ST || reduced) { root.classList.add('is-in'); return; }
      ST.create({ trigger: root, start: 'top 78%', once: true, onEnter: function () {
        root.classList.add('is-in');
        if (!userMoved) flyTo(fitA, 1700);
        gsap.fromTo($$('.wmap__num', layer), { scale: 0 }, { scale: 1, duration: .7, ease: 'back.out(2)', stagger: .06, delay: .45, clearProps: 'transform' });
      } });
    }
    return {
      intro: intro,
      // después de volver a dibujar las tarjetas (cambio de idioma): mantener orden, selección y textos
      sync: function () {
        parkLbl.el.textContent = t('where.park'); edge.textContent = '← ' + t('where.park');
        if (fullBtn) fullBtn.setAttribute('aria-label', t(full ? 'where.close' : 'where.expand'));
        var k = cur; setMode(mode, true); if (k > -1) { cur = -1; select(k); }
        var g = sig(); if (g !== lastSig) { lastSig = g; var c0 = cam, f0 = fitA; measure(); cam = userMoved ? clampC(c0) : (c0 === f0 || !S0 ? fitA : clampC({ x: fitA.x, y: fitA.y, s: fitA.s * c0.s / f0.s })); }
        measureLbls(); commit();
      }
    };
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
