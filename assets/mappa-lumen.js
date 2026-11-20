// Mappa dei ricordi di Lumen in 3D, versione leggera per il sito: canvas 2D con proiezione prospettica,
// senza librerie. Gira da sola; si trascina per ruotare, rotellina o pizzico per ingrandire, si tocca una luce
// per leggere il ricordo. I dati vengono dall'account di prova di Lumen: persone e ricordi sono inventati.
(function () {
  const box = document.getElementById('lu-mappa');
  if (!box) return;
  const canvas = box.querySelector('canvas');
  const tip = box.querySelector('.lu-tip');
  const ctx = canvas.getContext('2d');

  const DATA = {"areas":[["Chi sono",2],["Infanzia",3],["Famiglia",3],["Amore",2],["Amicizie",1],["Lavoro",2],["Passioni",2],["Luoghi",1],["Valori",1],["Consigli",1],["Vita pratica",1],["Momenti",1]],"nodes":[[4,"Infanzia","I sassi piatti con il nonno Vincenzo"],[5,"Infanzia","La paura del temporale"],[6,"Famiglia","I nipoti Luca e Sofia"],[7,"Amore","Il primo incontro con Franco"],[8,"Amore","Il matrimonio a Maiori"],[9,"Lavoro","Maestra elementare per 35 anni"],[10,"Passioni","L'orto dietro casa"],[11,"Passioni","Le canzoni di Mina"],[12,"Chi sono","Mariuccia"],[13,"Vita pratica","Dove sono i documenti"],[14,"Infanzia","La casa di via Roma a Salerno"],[15,"Famiglia","Mamma Assunta in cucina"],[16,"Famiglia","Il papà ferroviere"],[17,"Amicizie","Carla, l'amica di sempre"],[18,"Lavoro","Il primo giorno di scuola da maestra"],[19,"Luoghi","La costiera amalfitana"],[20,"Valori","Non rimandare le telefonate"],[21,"Consigli","Il ragù si fa con pazienza"],[22,"Chi sono","Ironica e testarda"],[23,"Momenti","La nascita di Luca"]],"edges":[[4,5,0.8],[4,12,0.8],[6,9,0.8],[7,8,0.8],[7,13,0.8],[8,13,0.8],[4,9,0.8],[11,12,0.8],[14,15,0.8],[14,16,0.8],[14,19,0.8],[4,14,0.8],[15,21,0.8],[15,16,0.8],[11,15,0.8],[4,16,0.8],[17,20,0.8],[14,17,0.8],[9,18,0.8],[11,18,0.8],[8,19,0.8],[7,19,0.8],[20,22,0.8],[6,21,0.8],[21,23,0.8],[12,22,0.8],[11,22,0.8],[6,23,0.8],[7,23,0.8],[8,23,0.8],[14,23,0.8],[5,14,0.5],[13,23,0.5],[12,16,0.5]],"people":[["Franco",[7,8,13,23]],["nonna Rosa",[5,14]],["Luca",[6,23]],["Assunta",[11,15]],["Michele",[12,16]],["Vincenzo",[4]],["Sofia",[6]],["Mina",[11]],["Carla",[17]],["Peppino",[18]]]};
  const PERSONA = 'Anna';
  const HUES = { 'Chi sono': '#9ba1c4', Infanzia: '#f2c98a', Famiglia: '#f0a28e', Amore: '#f08fb0', Amicizie: '#a7d98f',
    Lavoro: '#8fb8f0', Passioni: '#d29af0', Luoghi: '#7fd6c8', Valori: '#f0d878', Consigli: '#c4cf8a',
    'Vita pratica': '#9fb0c8', Momenti: '#e8b4d8' };
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  // Numeri casuali ripetibili: la mappa ha sempre la stessa forma
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const dirRnd = () => { const t = rnd() * 6.283, u = rnd() * 2 - 1, s = Math.sqrt(1 - u * u); return [s * Math.cos(t), u, s * Math.sin(t)]; };

  // Aree su un anello attorno al centro, ricordi dentro la loro area, persone vicino ai loro ricordi
  const areas = DATA.areas.map(([key, count], i, all) => {
    const a = (i / all.length) * Math.PI * 2;
    return { key, count, c: rgb(HUES[key] || '#c9c4d8'), r: 0.13 + 0.04 * count,
      p: [Math.cos(a) * 1.4, Math.sin(i * 1.9) * 0.14, Math.sin(a) * 1.4] };
  });
  const areaOf = Object.fromEntries(areas.map((a) => [a.key, a]));
  const nodes = DATA.nodes.map(([id, area, title]) => {
    const A = areaOf[area], d = dirRnd(), k = A.r * (0.25 + rnd() * 0.45);
    return { id, title, A, p: [A.p[0] + d[0] * k, A.p[1] + d[1] * k, A.p[2] + d[2] * k], ph: rnd() * 6.28 };
  });
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges = DATA.edges.filter(([a, b]) => byId[a] && byId[b]).map(([a, b, w]) => [byId[a], byId[b], w]);
  const people = DATA.people.map(([name, ids]) => {
    const ns = ids.map((i) => byId[i]).filter(Boolean);
    const m = [0, 1, 2].map((k) => ns.reduce((s, n) => s + n.p[k], 0) / ns.length);
    const d = dirRnd();
    return { name, ns, p: [m[0] * 1.18 + d[0] * 0.12, m[1] * 0.6 - 0.25 + d[1] * 0.1, m[2] * 1.18 + d[2] * 0.12] };
  });
  const dust = Array.from({ length: 140 }, () => { const d = dirRnd(), k = 2.2 + rnd() * 1.8; return { p: [d[0] * k, d[1] * k * 0.7, d[2] * k], s: 0.4 + rnd() * 1.1, a: 0.15 + rnd() * 0.35 }; });

  // Telecamera in orbita
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const START = { yaw: 0.6, pitch: 0.85, dist: 3.6 };
  let yaw = START.yaw, pitch = START.pitch, dist = START.dist, idleUntil = 0;
  let W = 0, H = 0, F = 0, dpr = 1;

  function resize() {
    const r = box.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height; F = Math.min(W * 0.92, H * 0.98);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function proj(p) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x = p[0] * cy - p[2] * sy, z1 = p[0] * sy + p[2] * cy;
    const y = p[1] * cp - z1 * sp, z = p[1] * sp + z1 * cp;
    const depth = z + dist, k = F / Math.max(depth, 0.3);
    return { x: W / 2 + x * k, y: H * 0.54 - y * k, k, depth };
  }

  let hover = null, t0 = performance.now();
  function draw(now) {
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    // polvere di stelle
    for (const d of dust) { const q = proj(d.p); if (q.depth < 0.4) continue; ctx.fillStyle = `rgba(220,215,255,${d.a})`; ctx.beginPath(); ctx.arc(q.x, q.y, d.s, 0, 6.283); ctx.fill(); }
    const A = areas.map((a) => ({ a, q: proj(a.p) })).sort((u, v) => v.q.depth - u.q.depth);
    // fili tra i ricordi
    ctx.lineWidth = 1;
    for (const [n1, n2, w] of edges) {
      const q1 = proj(n1.p), q2 = proj(n2.p), lit = hover && (hover === n1 || hover === n2);
      ctx.strokeStyle = rgba(n1.A.c, lit ? 0.75 : 0.16 * w + 0.04);
      ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
    }
    // persone, legate ai loro ricordi da fili tenui
    for (const pe of people) {
      const q = proj(pe.p);
      ctx.strokeStyle = 'rgba(154,166,255,.10)';
      for (const n of pe.ns) { const qn = proj(n.p); ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(qn.x, qn.y); ctx.stroke(); }
      ctx.fillStyle = 'rgba(205,214,255,.75)'; ctx.beginPath(); ctx.arc(q.x, q.y, 1.6, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(190,196,230,.75)'; ctx.font = `500 ${Math.max(10, 0.042 * q.k)}px Figtree, sans-serif`; ctx.textAlign = 'center';
      ctx.fillText(pe.name, q.x, q.y + Math.max(13, 0.07 * q.k));
    }
    // aree: bolle luminose, dalla più lontana alla più vicina
    for (const { a, q } of A) {
      const r = a.r * q.k;
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 1.08);
      g.addColorStop(0, rgba(a.c, 0.03)); g.addColorStop(0.7, rgba(a.c, 0.07)); g.addColorStop(0.93, rgba(a.c, 0.28)); g.addColorStop(1, rgba(a.c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, r * 1.08, 0, 6.283); ctx.fill();
      ctx.strokeStyle = rgba(a.c, 0.45); ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 6.283); ctx.stroke();
      ctx.textAlign = 'center'; ctx.font = `600 ${Math.max(11, 0.05 * q.k)}px Figtree, sans-serif`;
      const label = a.key, cnt = ' ' + a.count, wl = ctx.measureText(label).width;
      ctx.font = `500 ${Math.max(10, 0.042 * q.k)}px Figtree, sans-serif`; const wc = ctx.measureText(cnt).width;
      const lx = q.x - (wl + wc) / 2, ly = q.y - r - 8;
      ctx.textAlign = 'left'; ctx.font = `600 ${Math.max(11, 0.05 * q.k)}px Figtree, sans-serif`; ctx.fillStyle = 'rgba(232,228,240,.85)'; ctx.fillText(label, lx, ly);
      ctx.font = `500 ${Math.max(10, 0.042 * q.k)}px Figtree, sans-serif`; ctx.fillStyle = 'rgba(160,160,185,.7)'; ctx.fillText(cnt, lx + wl, ly);
    }
    // ricordi: luci che pulsano piano
    for (const n of nodes) {
      const q = proj(n.p); n.q = q;
      const pulse = still ? 1 : 0.8 + 0.2 * Math.sin(t * 1.6 + n.ph), on = n === hover;
      const R = (on ? 16 : 9) * pulse * Math.min(1.4, q.k / F * 3.2);
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, R);
      g.addColorStop(0, 'rgba(255,248,236,.95)'); g.addColorStop(0.25, rgba(n.A.c, 0.55)); g.addColorStop(1, rgba(n.A.c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, R, 0, 6.283); ctx.fill();
    }
    // il centro: la Persona
    const c = proj([0, 0, 0]), pulse = still ? 1 : 0.9 + 0.1 * Math.sin(t * 1.1);
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 34 * pulse);
    g.addColorStop(0, 'rgba(255,246,228,1)'); g.addColorStop(0.18, 'rgba(255,230,190,.5)'); g.addColorStop(1, 'rgba(255,220,170,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, 34 * pulse, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(246,239,228,.95)'; ctx.textAlign = 'center'; ctx.font = `400 ${Math.max(15, 0.075 * c.k)}px Georgia, "Times New Roman", serif`;
    ctx.fillText(PERSONA, c.x, c.y + Math.max(26, 0.13 * c.k));
  }

  let visible = false, last = performance.now();
  function frame(now) {
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!still && !drag && now > idleUntil) yaw += dt * 0.12;
    draw(now);
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(([e]) => {
    const was = visible; visible = e.isIntersecting;
    if (visible && !was) { last = performance.now(); requestAnimationFrame(frame); }
  }).observe(box);

  // Trascinare per ruotare, rotellina o pizzico per ingrandire, toccare una luce per leggere il ricordo
  const pts = new Map(); let drag = false, pinch0 = 0, dist0 = dist, moved = 0;
  const clampDist = (d) => Math.min(6, Math.max(1.7, d));
  const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function pick(x, y) {
    let best = null, bd = 18 * 18;
    for (const n of nodes) { if (!n.q) continue; const dx = n.q.x - x, dy = n.q.y - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = n; } }
    return best;
  }
  function showTip(n, x, y) {
    hover = n;
    if (!n) { tip.hidden = true; return; }
    tip.innerHTML = `<span style="color:${HUES[n.A.key]}">${n.A.key}</span>${n.title}`;
    tip.hidden = false;
    tip.style.left = Math.min(Math.max(x, 90), W - 90) + 'px'; tip.style.top = Math.max(y - 14, 40) + 'px';
  }
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, local(e)); moved = 0;
    drag = true; box.classList.add('active'); idleUntil = performance.now() + 4000;
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); dist0 = dist; }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = local(e);
    if (!pts.has(e.pointerId)) { if (e.pointerType === 'mouse') { const n = pick(p[0], p[1]); showTip(n, p[0], p[1]); canvas.style.cursor = n ? 'pointer' : 'grab'; } return; }
    const prev = pts.get(e.pointerId); pts.set(e.pointerId, p);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch0) dist = clampDist(dist0 * pinch0 / d); return; }
    const dx = p[0] - prev[0], dy = p[1] - prev[1]; moved += Math.abs(dx) + Math.abs(dy);
    yaw += dx * 0.006; pitch = Math.min(1.35, Math.max(-0.2, pitch + dy * 0.004));
    idleUntil = performance.now() + 4000;
    if (moved > 6) showTip(null);
  });
  const up = (e) => {
    const p = local(e);
    if (pts.size === 1 && moved < 6) { const n = pick(p[0], p[1]); showTip(n, p[0], p[1]); }
    pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; if (!pts.size) drag = false;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', () => { box.classList.remove('active'); if (!pts.size) showTip(null); });
  // La rotellina ingrandisce solo dopo un clic sulla mappa, così scorrendo la pagina non si resta bloccati
  canvas.addEventListener('wheel', (e) => {
    if (!box.classList.contains('active')) return;
    e.preventDefault(); dist = clampDist(dist * Math.exp(e.deltaY * 0.0012)); idleUntil = performance.now() + 4000;
  }, { passive: false });
  canvas.addEventListener('dblclick', () => { yaw = START.yaw; pitch = START.pitch; dist = START.dist; });
  box.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
    const z = b.dataset.zoom;
    if (z === '0') { yaw = START.yaw; pitch = START.pitch; dist = START.dist; } else dist = clampDist(dist * (z === '+' ? 0.82 : 1.22));
    idleUntil = performance.now() + 4000;
  }));

  window.addEventListener('resize', resize);
  resize();
  if (!visible) draw(performance.now());
})();
