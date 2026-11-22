/* Neon field: a living wall of tiny Schwartz Group neon signs behind the page.
   They are physical objects: parallax with the scroll, swing with scroll momentum,
   get pushed / spun when the mouse or a finger touches them, then settle back. */
(function () {
  const canvas = document.createElement('canvas');
  canvas.className = 'neon-field';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const sign = new Image();
  sign.src = '/img/mini-sign-on.png';           // 592 x 374, real neon sign render (tubes + glass + bolts)
  const SW = 592, SH = 374;

  // soft light that each sign throws onto the dark wall behind it
  function makeLight(r, g, b) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const grd = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, `rgba(${r},${g},${b},.55)`); grd.addColorStop(.45, `rgba(${r},${g},${b},.18)`); grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = grd; x.fillRect(0, 0, 128, 128); return c;
  }
  const lightBlue = makeLight(50, 120, 255), lightGold = makeLight(255, 180, 70);

  // pre-blurred copy for the far layer (depth of field)
  let farSprite = null;
  sign.onload = () => {
    const c = document.createElement('canvas'); c.width = SW / 2; c.height = SH / 2;
    const x = c.getContext('2d'); x.filter = 'blur(2px)'; x.drawImage(sign, 0, 0, c.width, c.height);
    farSprite = c; build();
  };

  const LAYERS = [
    { depth: 0.35, n: 95, min: 26, max: 36, alpha: 0.55, far: true },
    { depth: 0.65, n: 44, min: 40, max: 56, alpha: 0.8 },
    { depth: 1.0,  n: 20, min: 62, max: 84, alpha: 1.0 },
  ];
  let W = 0, H = 0, dpr = 1, items = [];
  let seed = 3; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    const area = (W * H) / (1440 * 900);
    items = []; seed = 3;
    LAYERS.forEach(L => {
      const worldH = H * 1.7;
      const count = Math.max(8, Math.round(L.n * area * 1.7));
      for (let i = 0; i < count; i++) {
        const w = L.min + rnd() * (L.max - L.min);
        items.push({
          L, w, h: w * SH / SW, worldH,
          bx: rnd() * (W + 80) - 40, by: rnd() * worldH,
          ox: 0, oy: 0, vx: 0, vy: 0,
          a: (rnd() - 0.5) * 0.6, a0: 0, va: 0,
          phase: rnd() * Math.PI * 2, speed: 0.6 + rnd() * 1.2,
          gold: rnd() < 0.35,
        });
      }
    });
    items.forEach(it => it.a0 = it.a);
  }

  // pointer (mouse + touch)
  const P = { x: -9999, y: -9999, vx: 0, vy: 0, t: 0 };
  function setPointer(x, y) {
    const now = performance.now(), dt = Math.max(16, now - P.t);
    if (P.t) { P.vx = (x - P.x) / dt * 16; P.vy = (y - P.y) / dt * 16; }
    P.x = x; P.y = y; P.t = now;
  }
  window.addEventListener('pointermove', e => setPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) setPointer(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchstart', e => { const t = e.touches[0]; if (t) { P.t = 0; setPointer(t.clientX, t.clientY); } }, { passive: true });
  const leave = () => { P.x = P.y = -9999; P.vx = P.vy = 0; };
  window.addEventListener('pointerleave', leave); window.addEventListener('touchend', () => setTimeout(leave, 300));

  // scroll momentum
  let lastScroll = window.scrollY, scrollVel = 0;

  function frame(t) {
    const sy = window.scrollY;
    scrollVel = scrollVel * 0.8 + (sy - lastScroll) * 0.2; lastScroll = sy;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const time = t / 1000;
    const R = Math.max(90, Math.min(W, H) * 0.14);

    for (const it of items) {
      const L = it.L;
      // base screen position: parallax + wrap so the wall never runs out
      let y = ((it.by - sy * L.depth) % it.worldH + it.worldH) % it.worldH - (it.worldH - H) / 2;
      const x = it.bx;
      if (!reduce) {
        // touch / mouse: push away + spin, like brushing real objects
        const cx = x + it.ox, cy = y + it.oy;
        const dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
        const reach = R * (0.6 + L.depth * 0.6);
        if (d < reach && d > 0.1) {
          const f = (1 - d / reach) * (1.6 + L.depth * 1.4);
          it.vx += dx / d * f + P.vx * 0.06 * (1 - d / reach);
          it.vy += dy / d * f + P.vy * 0.06 * (1 - d / reach);
          it.va += ((dx * P.vy - dy * P.vx) / (reach * 60)) * (1 - d / reach);
        }
        // scroll momentum makes them swing on their mounts
        it.vy -= scrollVel * 0.018 * L.depth;
        it.va += scrollVel * 0.00018 * (it.gold ? 1 : -1);
        // spring back home + damping
        it.vx += -it.ox * 0.022; it.vy += -it.oy * 0.022; it.va += (it.a0 - it.a) * 0.02;
        it.vx *= 0.9; it.vy *= 0.9; it.va *= 0.92;
        it.ox += it.vx; it.oy += it.vy; it.a += it.va;
      }
      const px = x + it.ox, py = y + it.oy;
      if (py < -120 || py > H + 120) continue;

      // continuous glow: each sign breathes on its own rhythm and lights the wall
      const pulse = 0.72 + 0.28 * Math.sin(time * it.speed + it.phase);
      if (!L.far) {
        const lw = it.w * 3.4;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = L.alpha * pulse * 0.55;
        ctx.drawImage(it.gold ? lightGold : lightBlue, px - lw / 2, py - lw * 0.36, lw, lw * 0.72);
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = L.alpha * (0.85 + 0.15 * pulse);
      ctx.save();
      ctx.translate(px, py); ctx.rotate(it.a);
      ctx.drawImage(L.far && farSprite ? farSprite : sign, -it.w / 2, -it.h / 2, it.w, it.h);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    P.vx *= 0.85; P.vy *= 0.85;
    if (!document.hidden) requestAnimationFrame(frame);
  }

  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(frame); });
  if (sign.complete) sign.onload();
  requestAnimationFrame(frame);
})();
