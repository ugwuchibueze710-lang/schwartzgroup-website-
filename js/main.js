/* Schwartz Group — interactions */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header + mobile nav ---------- */
  const header = $('.site-header');
  const onScrollHeader = () => header && header.classList.toggle('solid', window.scrollY > 40);
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  const toggle = $('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open);
    });
    $$('.mobile-nav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('nav-open')));
  }

  /* ---------- Reveal on scroll ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.14 }) : null;
  $$('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* ---------- Neon power-on: buzz, blink twice, then stay on (every page) ---------- */
  (function powerOn() {
    const body = document.body;
    if (reduce) { body.classList.add('sign-on'); return; }
    // on-off pattern of a real neon tube striking: blink, blink, catch, steady
    const steps = [[true, 90], [false, 140], [true, 70], [false, 260], [true, 50], [false, 60], [true, 0]];
    let i = 0;
    const run = () => { const [on, wait] = steps[i++]; body.classList.toggle('sign-on', on); if (i < steps.length) setTimeout(run, wait); };
    setTimeout(run, 450);
  })();

  /* ---------- Living tree: wind gusts, leaf flutter, bends when you scroll ---------- */
  const sway = $('.tree-sway');
  if (sway && !reduce) {
    let bend = 0, bendV = 0, last = window.scrollY, gust = 0, gustTarget = 0, nextGust = 0;
    const tick = t => {
      const s = t / 1000;
      // wind: slow breathing sway + quicker shiver + random gusts
      if (s > nextGust) { gustTarget = (Math.random() * 1.4 + 0.4) * (Math.random() < .5 ? -1 : 1); nextGust = s + 2.5 + Math.random() * 4; }
      gustTarget *= 0.985; gust += (gustTarget - gust) * 0.04;
      const wind = Math.sin(s * 0.9) * 0.45 + Math.sin(s * 2.3 + 1.7) * 0.18 + Math.sin(s * 5.1) * 0.05 + gust;
      // scroll: the tree is pushed the way you scroll and springs back
      const dy = window.scrollY - last; last = window.scrollY;
      bendV += Math.max(-6, Math.min(6, dy)) * 0.05;
      bendV += -bend * 0.06; bendV *= 0.88; bend += bendV;
      const ang = Math.max(-3.2, Math.min(3.2, wind + bend));
      sway.style.transform = `rotate(${ang.toFixed(3)}deg) skewX(${(ang * 0.35).toFixed(3)}deg)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* scene parallax + objects that get nudged by mouse or finger */
  const scene = $('.scene');
  if (scene && !reduce) {
    if (window.innerWidth > 820) window.addEventListener('scroll', () => {
      const y = Math.min(window.scrollY, window.innerHeight);
      scene.style.translate = `0 ${y * 0.25}px`;
    }, { passive: true });
    const bump = el => { el.classList.add('bump'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('bump'), 380); };
    $$('.lay').forEach(el => el.addEventListener('touchstart', () => bump(el), { passive: true }));
  }

  /* ---------- Floating mini neon signs: foreground objects that roll with the scroll ---------- */
  const layer = $('.emblems');
  if (layer && !reduce) {
    const items = [];
    let seed = 11;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    function build() {
      layer.innerHTML = ''; items.length = 0;
      const vw = window.innerWidth, vh = window.innerHeight, mobile = vw < 820;
      const docH = Math.max(document.body.scrollHeight, vh * 3);
      const hasHero = !!$('.hero');
      const count = Math.round(docH / vh * (mobile ? 9 : 15));
      const copy = $('.hero-copy');
      const cr = copy ? copy.getBoundingClientRect() : null;
      for (let k = 0; k < count; k++) {
        const tier = rnd();
        if (hasHero && (k + 0.5) / count * docH > vh * 1.1) { rnd(); rnd(); rnd(); rnd(); rnd(); rnd(); continue; } // foreground signs live in the hero; the neon wall covers the rest
        const cls = tier < 0.18 ? 'near' : tier < 0.58 ? 'mid' : 'far';
        const base = (cls === 'near' ? 120 : cls === 'mid' ? 70 : 42) * (mobile ? 0.62 : 1);
        const w = base * (0.85 + rnd() * 0.35);
        const depth = cls === 'near' ? 1.55 : cls === 'mid' ? 1.0 : 0.6;
        let y = (k + rnd()) / count * docH;
        let xPct;
        const inHero = hasHero && y < vh;
        if (inHero) {
          xPct = rnd() * 100;                                   // anywhere across the hero...
          if (cr && xPct / 100 * vw > cr.left - 60 && xPct / 100 * vw < cr.right + 60 && y > cr.top - 60 && y < cr.bottom + 30) {
            if (mobile) y = cr.bottom + 40 + rnd() * Math.max(40, vh - cr.bottom - 80); else xPct = 62 + rnd() * 36; // ...but never on the headline
          }
        } else {
          xPct = rnd() < 0.5 ? rnd() * (mobile ? 9 : 11) : 100 - rnd() * (mobile ? 9 : 11); // page margins so text stays readable
        }
        const el = document.createElement('div');
        el.className = 'emblem ' + cls;
        el.style.width = w + 'px'; el.style.height = (w * 374 / 592) + 'px';
        el.innerHTML = '<img class="off" src="/img/mini-sign-off.png" alt=""><img class="on" src="/img/mini-sign-on.png" alt="">';
        layer.appendChild(el);
        items.push({ el, xPct, y, depth, w, ox: 0, oy: 0, vx: 0, vy: 0, va: 0, ang: 0, spin: (rnd() < .5 ? -1 : 1) * (0.05 + rnd() * 0.12), rot0: (rnd() - .5) * 40, sway: rnd() * Math.PI * 2 });
      }
    }
    // pointer for touch physics
    const P = { x: -9999, y: -9999, vx: 0, vy: 0 };
    const mv = (x, y) => { P.vx = x - P.x; P.vy = y - P.y; if (Math.abs(P.vx) > 200) P.vx = P.vy = 0; P.x = x; P.y = y; };
    window.addEventListener('pointermove', e => mv(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', e => { const t = e.touches[0]; t && mv(t.clientX, t.clientY); }, { passive: true });
    function render() {
      const sy = window.scrollY, vw = window.innerWidth, vh = window.innerHeight;
      for (const it of items) {
        const top = it.y - sy * it.depth;                       // parallax: near objects move faster
        if (top < -200 || top > vh + 200) { it.el.style.display = 'none'; continue; }
        it.el.style.display = '';
        const x = it.xPct / 100 * vw - it.w / 2 + Math.sin(sy / 260 + it.sway) * 10 * it.depth;
        // bump physics: the pointer pushes and spins them, a spring brings them home
        const cx = x + it.w / 2 + it.ox, cy = top + it.oy, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy), reach = 70 + it.w;
        if (d < reach && d > .1) { const f = (1 - d / reach) * 2.4; it.vx += dx / d * f + P.vx * .08; it.vy += dy / d * f + P.vy * .08; it.va += (dx * P.vy - dy * P.vx) / (reach * 40); }
        it.vx += -it.ox * .03; it.vy += -it.oy * .03; it.va += -it.ang * .03;
        it.vx *= .88; it.vy *= .88; it.va *= .9; it.ox += it.vx; it.oy += it.vy; it.ang += it.va;
        const rot = it.rot0 + sy * it.spin + it.ang;            // rolls as you scroll
        it.el.style.transform = `translate3d(${x + it.ox}px,${top + it.oy}px,0) rotate(${rot}deg)`;
      }
      P.vx *= .8; P.vy *= .8;
      requestAnimationFrame(render);
    }
    let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(build, 250); });
    window.addEventListener('load', build);
    build();
    requestAnimationFrame(render);
  }

  /* ---------- Page hero parallax ---------- */
  const phBg = $('.page-hero .bg');
  if (phBg && !reduce) window.addEventListener('scroll', () => { phBg.style.transform = `translateY(${window.scrollY * 0.3}px)`; }, { passive: true });

  /* ---------- Before / after sliders ---------- */
  $$('.ba').forEach(ba => {
    const wrap = $('.after-wrap', ba), handle = $('.handle', ba);
    const set = pct => { pct = Math.max(2, Math.min(98, pct)); wrap.style.clipPath = `inset(0 0 0 ${pct}%)`; handle.style.left = pct + '%'; };
    const fromEvent = e => { const r = ba.getBoundingClientRect(); const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; set(x / r.width * 100); };
    let drag = false;
    ba.addEventListener('pointerdown', e => { drag = true; ba.setPointerCapture(e.pointerId); fromEvent(e); });
    ba.addEventListener('pointermove', e => drag && fromEvent(e));
    ba.addEventListener('pointerup', () => drag = false);
    ba.addEventListener('pointercancel', () => drag = false);
    ba.tabIndex = 0;
    ba.addEventListener('keydown', e => {
      const cur = parseFloat(handle.style.left) || 50;
      if (e.key === 'ArrowLeft') set(cur - 5); if (e.key === 'ArrowRight') set(cur + 5);
    });
    // gentle intro sweep when it scrolls into view
    if (!reduce && 'IntersectionObserver' in window) {
      const o = new IntersectionObserver(es => es.forEach(en => {
        if (!en.isIntersecting) return; o.disconnect();
        let t0 = null;
        const anim = ts => { t0 = t0 || ts; const p = Math.min(1, (ts - t0) / 1600); set(50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p)); if (p < 1 && !drag) requestAnimationFrame(anim); };
        requestAnimationFrame(anim);
      }), { threshold: 0.5 });
      o.observe(ba);
    }
  });

  /* ---------- Testimonials ---------- */
  const testi = $('.testi');
  if (testi) {
    const qs = $$('.q', testi), dots = $$('.dots button', testi);
    let i = 0, timer;
    const show = n => { i = (n + qs.length) % qs.length; qs.forEach((q, k) => q.classList.toggle('active', k === i)); dots.forEach((d, k) => d.classList.toggle('active', k === i)); };
    const auto = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), 7000); };
    dots.forEach((d, k) => d.addEventListener('click', () => { show(k); auto(); }));
    show(0); auto();
  }

  /* ---------- Project filters ---------- */
  const filters = $('.filters');
  if (filters) {
    filters.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', filters).forEach(x => x.classList.toggle('active', x === b));
      const f = b.dataset.filter;
      $$('.proj').forEach(p => p.classList.toggle('hide', f !== 'all' && p.dataset.cat !== f));
    });
  }

  /* ---------- Today's hours highlight ---------- */
  const hours = $$('.hours li');
  if (hours.length) { const d = (new Date().getDay() + 6) % 7; hours[d] && hours[d].classList.add('today'); }

  /* ---------- Estimate form ---------- */
  $$('form.estimate-form').forEach(form => {
    const msg = $('.form-msg', form), btn = $('button[type=submit]', form);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      msg.className = 'form-msg';
      const orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = 'Sending…';
      try {
        const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) { msg.textContent = data.message || 'Thank you! We will be in touch shortly.'; msg.classList.add('ok'); form.reset(); }
        else throw new Error(data.message || 'send failed');
      } catch (err) {
        msg.innerHTML = 'Sorry, your message could not be sent right now. Please call us at <a href="tel:8128937737">812-893-7737</a> or email <a href="mailto:info@sg-homeimprovement.com">info@sg-homeimprovement.com</a>.';
        msg.classList.add('err');
      } finally { btn.disabled = false; btn.innerHTML = orig; }
    });
  });

  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
})();
