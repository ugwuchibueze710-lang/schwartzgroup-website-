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

  /* ---------- Neon sign + wall switch ---------- */
  const hero = $('.hero');
  if (hero) {
    let on = false, busy = false, actx = null;
    const stateTxt = $('.switch-hint .state');

    function clickSound(isOn) {
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        const t = actx.currentTime;
        // mechanical toggle "clack": short filtered noise burst + low thump
        const len = Math.floor(actx.sampleRate * 0.035);
        const buf = actx.createBuffer(1, len, actx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
        const src = actx.createBufferSource(); src.buffer = buf;
        const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = isOn ? 2600 : 2100; bp.Q.value = 1.2;
        const g = actx.createGain(); g.gain.value = 0.55;
        src.connect(bp).connect(g).connect(actx.destination); src.start(t);
        const o = actx.createOscillator(), og = actx.createGain();
        o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.05);
        og.gain.setValueAtTime(0.25, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        o.connect(og).connect(actx.destination); o.start(t); o.stop(t + 0.07);
        if (isOn) { // brief neon transformer buzz while it strikes
          const b = actx.createOscillator(), bg = actx.createGain();
          b.type = 'sawtooth'; b.frequency.value = 120;
          bg.gain.setValueAtTime(0.0001, t + 0.05); bg.gain.exponentialRampToValueAtTime(0.025, t + 0.1);
          bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
          const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
          b.connect(lp).connect(bg).connect(actx.destination); b.start(t + 0.05); b.stop(t + 0.8);
        }
      } catch (e) { /* audio not available */ }
    }

    function setState(v) {
      on = v;
      hero.classList.toggle('on', on);
      document.body.classList.toggle('sign-on', on);
      try { localStorage.setItem('sgNeon', on ? '1' : '0'); } catch (e) {}
      $$('[data-switch]').forEach(b => b.setAttribute('aria-pressed', on));
      if (stateTxt) stateTxt.textContent = on ? 'Sign is on. Flip the switch by the door to turn it off.' : 'Flip the switch by the front door to light the sign.';
    }

    function flip() {
      if (busy) return;
      const next = !on;
      clickSound(next);
      if (!next || reduce) { setState(next); return; }
      // real neon strikes with a few flickers before it stabilises
      busy = true;
      const seq = [60, 70, 40, 120, 50, 90, 30];
      let i = 0, s = true;
      setState(true);
      (function step() {
        if (i >= seq.length) { setState(true); busy = false; return; }
        s = !s; hero.classList.toggle('on', s); document.body.classList.toggle('sign-on', s); i++;
        setTimeout(step, seq[i - 1]);
      })();
    }
    $$('[data-switch]').forEach(b => b.addEventListener('click', flip));
    let saved = false;
    try { saved = localStorage.getItem('sgNeon') === '1'; } catch (e) {}
    setState(saved);   // the sign remembers its state from page to page

    /* ---- cable: from the header neon sign down to the wall switch ---- */
    const cable = $('.hero-cable'), brandSign = $('.site-header .nsign'), wallSw = $('.wall-switch');
    function drawCable() {
      if (!cable || !brandSign || !wallSw) return;
      const hr = hero.getBoundingClientRect(), br = brandSign.getBoundingClientRect(), wr = wallSw.getBoundingClientRect();
      const sx = br.right - br.width * 0.06 - hr.left, sy = br.bottom - br.height * 0.08 - hr.top;   // bottom-right bolt
      const ex = wr.left + wr.width / 2 - hr.left, ey = wr.top - hr.top + 1;                      // top of the switch box
      const scr = $('.scene').getBoundingClientRect();
      const mob = window.innerWidth < 820;
      const mx = ex - Math.min(22, wr.width * 3.5);                // runs down the siding just left of the switch
      const my = scr.top - hr.top + scr.height * 0.655;           // meets the house at the eave over the garage
      const dx = mx - sx;
      // a real cable hangs under its own weight: one smooth sagging span from the sign's bolt to the eave
      const sag = mob ? 30 : 70;
      const dy = my - sy;
      const c1x = mob ? sx + dx * 1.6 : sx + dx * 0.45, c1y = mob ? sy + 40 : sy + dy * 0.12;
      const c2x = mob ? mx + 20 : sx + dx * 0.8,        c2y = mob ? my - 160 : sy + dy * 0.62 + sag * 0.5;
      const d = `M${sx} ${sy} C${c1x} ${c1y} ${c2x} ${c2y} ${mx} ${my} L${mx} ${ey - 10} Q${mx} ${ey - 3} ${mx + 6} ${ey - 3} L${ex - 4} ${ey - 3} Q${ex} ${ey - 3} ${ex} ${ey}`;
      cable.querySelectorAll('path').forEach(pth => pth.setAttribute('d', d));
      cable.querySelectorAll('rect').forEach(r => r.remove());
      [0.35, 0.7].forEach(t => {                          // two cable clips on the wall run
        const y = my + (ey - 10 - my) * t;
        const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('x', mx - 3); r.setAttribute('y', y); r.setAttribute('width', 6); r.setAttribute('height', 3); r.setAttribute('rx', 1);
        cable.appendChild(r);
      });
      cable.style.opacity = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.45));
    }
    let cTick = false;
    const reqCable = () => { if (!cTick) { cTick = true; requestAnimationFrame(() => { drawCable(); cTick = false; }); } };
    window.addEventListener('scroll', reqCable, { passive: true });
    window.addEventListener('resize', reqCable);
    window.addEventListener('load', drawCable);
    drawCable();


    /* subtle parallax of the scene as you scroll away */
    const scene = $('.scene');
    if (scene && !reduce) {
      window.addEventListener('scroll', () => {
        const y = Math.min(window.scrollY, window.innerHeight);
        scene.style.translate = `0 ${y * 0.25}px`;
      }, { passive: true });
    }
  } else {
    // inner pages: the header sign is always lit
    document.body.classList.add('sign-on');
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
