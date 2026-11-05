'use strict';
/* Saltos del Saber · Gráficos con estilo de 64 bits en 2D.
   Todo se dibuja con código (formas, degradados y contorno). Al cargar, cada personaje, bloque
   y fondo se dibuja una vez en una imagen interna (caché) a la resolución de la pantalla;
   durante el juego solo se copian esas imágenes, para que vaya fluido en celulares.

   Unidades: las funciones de dibujo trabajan en "unidades de arte" (el doble de la cuadrícula
   lógica del juego). Un bloque del nivel mide 16 unidades lógicas = 32 unidades de arte. */
const Sprites = (() => {
  const OUT = '#1A2133';

  // ---------- utilidades ----------
  function rgb(h) { h = h.replace('#', ''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function sh(h, a) { if (h[0] !== '#') return h; const [r, g, b] = rgb(h); const f = a < 0 ? (v => Math.round(v * (1 + a))) : (v => Math.round(v + (255 - v) * a)); return `rgb(${f(r)},${f(g)},${f(b)})`; }
  function L(c, x0, y0, x1, y1, cols) { const g = c.createLinearGradient(x0, y0, x1, y1); cols.forEach((k, i) => g.addColorStop(i / (cols.length - 1), k)); return g; }
  function Rg(c, x, y, r, cols, fx, fy) { const g = c.createRadialGradient(fx === undefined ? x : fx, fy === undefined ? y : fy, 0, x, y, r); cols.forEach((k, i) => g.addColorStop(i / (cols.length - 1), k)); return g; }
  function rr(c, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function el(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, Math.PI * 2); }
  function F(c, fill, lw, stroke) { c.fillStyle = fill; c.fill(); if (lw === undefined) lw = 1.4; if (lw) { c.lineWidth = lw; c.strokeStyle = stroke || OUT; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); } }
  function vol(c, col, x, y, w, h) { return L(c, x, y, x + w * 0.6, y + h, [sh(col, .3), col, sh(col, -.35)]); }
  function brillo(c, x, y, rx, ry, a, rot) { el(c, x, y, rx, ry, rot === undefined ? -.5 : rot); c.fillStyle = `rgba(255,255,255,${a === undefined ? .55 : a})`; c.fill(); }
  function linea(c, pts, col, lw) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.stroke(); }
  function limb(c, x, y, ang, len, w, col) { c.save(); c.translate(x, y); c.rotate(ang); rr(c, -w / 2, -w * 0.3, w, len + w * 0.3, w / 2); F(c, L(c, -w / 2, 0, w / 2, 0, [sh(col, .28), col, sh(col, -.3)])); c.restore(); return [x - Math.sin(ang) * len, y + Math.cos(ang) * len]; }
  function mano(c, x, y, skin) { el(c, x, y, 4.2, 4.2); F(c, Rg(c, x, y, 5.5, [sh(skin, .25), skin, sh(skin, -.2)], x - 1.5, y - 1.5), 1.2); }
  function zapato(c, x, y, col, ang) { c.save(); c.translate(x, y); c.rotate((ang || 0) * 0.4); el(c, 3, 1.5, 7.2, 4.4); F(c, L(c, 0, -3, 0, 6, [sh(col, .4), col, sh(col, -.35)]), 1.3); brillo(c, 1, -0.6, 2.6, 1, .45, 0); c.restore(); }

  // ---------- personajes (caja de 64 × 96 unidades, mirando a la derecha) ----------
  const PJ = {
    ale: { id: 'ale', piel: '#E2A877', pelo: '#3A2418', iris: '#5A3A22', estilo: 'coleta', ropa: '#24427A', pantalon: '#4A6FA5', zapato: '#F4F4F4', mochila: true, boca: 'abierta' },
    pestalozzi: { id: 'pestalozzi', piel: '#EDBB92', pelo: '#C9C3B8', iris: '#4A6A8A', estilo: 'revuelto', ropa: '#6B4630', pantalon: '#3D2A1F', zapato: '#2A2420', faldones: true, edad: true },
    comenio: { id: 'comenio', piel: '#E8B48C', pelo: '#1E1E26', canas: '#C8C4BC', iris: '#4A3A2A', estilo: 'gorro', barba: 'larga', ropa: '#2C2C34', pantalon: '#2C2C34', zapato: '#1E1E22', tunica: true, edad: true, objeto: 'libro' },
    rousseau: { id: 'rousseau', piel: '#EDC09A', pelo: '#B9A890', iris: '#5A4030', estilo: 'peluca', ropa: '#3E5C76', pantalon: '#2E3E4E', zapato: '#22262E', faldones: true, objeto: 'ramita' },
    froebel: { id: 'froebel', piel: '#EAB890', pelo: '#A8A39A', iris: '#4A6A7A', estilo: 'largo', ropa: '#2F4A35', pantalon: '#2A2A2E', zapato: '#1E1E22', edad: true, objeto: 'pelota' }
  };

  function peloAtras(c, P) {
    const g = (x, y, w, h) => vol(c, P.pelo, x, y, w, h);
    if (P.estilo === 'coleta') { c.save(); c.translate(15, 24); c.rotate(-0.35); el(c, -4, 10, 6, 11.5); F(c, g(-10, -1, 12, 22)); c.restore(); el(c, 16.5, 23.5, 2.8, 2.8); F(c, '#D64545', 1); }
    if (P.estilo === 'largo') {
      c.beginPath(); c.moveTo(16, 22); c.quadraticCurveTo(11, 40, 15, 49); c.lineTo(26, 47); c.lineTo(26, 30); c.closePath(); F(c, g(11, 20, 16, 30));
      c.beginPath(); c.moveTo(49, 22); c.quadraticCurveTo(53, 38, 49, 46); c.lineTo(42, 44); c.lineTo(44, 28); c.closePath(); F(c, g(40, 20, 14, 28));
    }
    if (P.estilo === 'revuelto') [[17, 20, 7], [21, 12, 7.5], [29, 8, 7.5], [38, 8.5, 7.5], [46, 13, 7], [50, 21, 6], [15, 30, 6], [51, 30, 5]].forEach(([x, y, r]) => { el(c, x, y, r, r); F(c, Rg(c, x, y, r + 2, [sh(P.pelo, .3), P.pelo, sh(P.pelo, -.28)], x - 2, y - 2), 1.3); });
    if (P.estilo === 'gorro') [[17, 30, 5.5], [49, 29, 5]].forEach(([x, y, r]) => { el(c, x, y, r, r * 1.3); F(c, vol(c, P.canas, x - r, y - r, r * 2, r * 2.6), 1.2); });
    if (P.estilo === 'peluca') {
      c.save(); c.translate(13, 34); el(c, 0, 4, 3.5, 7, 0.3); F(c, vol(c, P.pelo, -4, -3, 8, 14)); c.restore();
      c.beginPath(); c.moveTo(14, 31); c.lineTo(7.5, 27.5); c.lineTo(8, 35); c.closePath(); F(c, '#1B1B22', 1);
      c.beginPath(); c.moveTo(14, 31); c.lineTo(19.5, 27.5); c.lineTo(19, 34.5); c.closePath(); F(c, '#1B1B22', 1);
    }
  }
  function peloFrente(c, P) {
    const fill = Rg(c, 30, 14, 26, [sh(P.pelo, .35), P.pelo, sh(P.pelo, -.3)], 26, 10);
    if (P.estilo === 'coleta') {
      c.beginPath(); c.ellipse(33, 25.5, 18, 16.5, 0, Math.PI * 1.0, Math.PI * 1.98);
      [[49.5, 25], [46, 21], [42.5, 24.5], [38, 19.5], [33, 23.5], [28, 19], [23, 23.5], [17.5, 27], [15.5, 34]].forEach(p => c.lineTo(p[0], p[1]));
      c.closePath(); F(c, fill, 1.5); brillo(c, 30, 13, 6, 2, .35, -.2);
    } else if (P.estilo === 'revuelto') {
      [[24, 13, 5.5], [31, 11, 6], [38.5, 12, 5.5], [44.5, 16, 4.5]].forEach(([x, y, r]) => { el(c, x, y, r, r * 0.9); F(c, Rg(c, x, y, r + 2, [sh(P.pelo, .32), P.pelo, sh(P.pelo, -.22)], x - 2, y - 2), 1.2); });
      c.beginPath(); c.moveTo(17, 24); c.quadraticCurveTo(15.5, 32, 19, 37); c.lineTo(21, 30); c.closePath(); F(c, fill, 1.1);
    } else if (P.estilo === 'gorro') {
      c.beginPath(); c.ellipse(33, 22, 17.5, 12, 0, Math.PI, Math.PI * 2); c.quadraticCurveTo(33, 26, 15.5, 22); c.closePath();
      F(c, L(c, 20, 10, 40, 24, ['#4A4A55', '#1E1E26', '#0E0E14']), 1.5); brillo(c, 27, 14, 5, 1.8, .3, -.3);
    } else if (P.estilo === 'peluca') {
      c.beginPath(); c.ellipse(33, 25, 17.5, 16, 0, Math.PI * 1.0, Math.PI * 1.98); c.quadraticCurveTo(40, 15, 30, 16.5); c.quadraticCurveTo(20, 18.5, 16, 30); c.closePath(); F(c, fill, 1.5);
      [[17, 31], [17.5, 37]].forEach(([x, y]) => { el(c, x, y, 4.6, 3.2); F(c, Rg(c, x, y, 6, [sh(P.pelo, .32), P.pelo, sh(P.pelo, -.25)], x - 1, y - 1), 1.2); });
      brillo(c, 29, 12.5, 6, 1.8, .3, -.2);
    } else if (P.estilo === 'largo') {
      c.beginPath(); c.ellipse(33, 25.5, 17.8, 16.5, 0, Math.PI * 1.0, Math.PI * 1.98); c.quadraticCurveTo(44, 17, 36, 15.5); c.quadraticCurveTo(26, 17, 20, 22); c.quadraticCurveTo(17, 28, 16.5, 38); c.lineTo(15.2, 30); c.closePath(); F(c, fill, 1.5);
      brillo(c, 29, 12.5, 6, 1.8, .3, -.2);
    }
    if (P.barba === 'larga') {
      c.beginPath(); c.moveTo(19, 31); c.quadraticCurveTo(20, 44, 26, 52); c.quadraticCurveTo(31, 62, 34, 64); c.quadraticCurveTo(38, 58, 43, 50); c.quadraticCurveTo(48, 42, 48.5, 31);
      c.quadraticCurveTo(46, 38, 41, 39.5); c.quadraticCurveTo(34, 41, 27, 39.5); c.quadraticCurveTo(22, 37, 19, 31); c.closePath();
      F(c, Rg(c, 33, 44, 20, [sh(P.canas, .35), P.canas, sh(P.canas, -.3)], 29, 38), 1.4);
      c.beginPath(); c.moveTo(32, 36.5); c.quadraticCurveTo(36, 34.5, 39, 36); c.quadraticCurveTo(43, 35, 45.5, 37.5); c.quadraticCurveTo(41, 39.5, 38.5, 38.2); c.quadraticCurveTo(35, 40, 32, 36.5); c.closePath(); F(c, sh(P.canas, -.05), 1.1);
      c.strokeStyle = sh(P.canas, -.35); c.lineWidth = 0.8;
      [[28, 45, 30, 53], [34, 46, 34, 57], [40, 45, 38, 53]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo(a + 1, (b + e) / 2, d, e); c.stroke(); });
    }
  }
  function ojo(c, x, y, P, k) {
    k = k || 1; const ry = (P.edad ? 3.5 : 4.4) * k, rx = (P.edad ? 3 : 3.4) * k;
    el(c, x, y, rx, ry); F(c, '#FFFFFF', 1.1);
    el(c, x + 0.8 * k, y + 0.4, rx * 0.72, ry * 0.78); c.fillStyle = P.iris; c.fill();
    el(c, x + 0.9 * k, y + 0.6, rx * 0.38, ry * 0.42); c.fillStyle = '#14171F'; c.fill();
    el(c, x - 0.1, y - 1.3 * k, 0.95 * k, 1.15 * k); c.fillStyle = '#FFFFFF'; c.fill();
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 1.7; c.strokeStyle = OUT; c.stroke();
    if (P.edad) { c.beginPath(); c.ellipse(x, y - 0.8, rx + 0.5, ry, 0, Math.PI * 1.08, Math.PI * 1.92); c.lineWidth = 1.2; c.strokeStyle = sh(P.piel, -.4); c.stroke(); }
  }
  function cabeza(c, P) {
    const s = P.piel;
    el(c, 17.5, 30, 3.4, 4.4); F(c, Rg(c, 17.5, 30, 5, [sh(s, .1), sh(s, -.15)]), 1.2);
    el(c, 17.8, 30, 1.5, 2.4); c.fillStyle = sh(s, -.3); c.fill();
    el(c, 33, 27, 16.5, 16); F(c, Rg(c, 33, 27, 19, [sh(s, .32), s, sh(s, -.22)], 27, 19), 1.5);
    [[28.5, 35, 4.5], [44, 34, 3.5]].forEach(([x, y, r]) => { el(c, x, y, r, r * 0.7); c.fillStyle = P.edad ? 'rgba(220,110,100,.18)' : 'rgba(240,110,110,.3)'; c.fill(); });
    ojo(c, 31, 29, P, 1); ojo(c, 41.5, 29, P, 0.9);
    c.strokeStyle = P.estilo === 'gorro' ? '#6E6A64' : sh(P.pelo, -.35); c.lineWidth = 1.7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(27.5, 23.2); c.quadraticCurveTo(31, 21.5, 34, 23); c.stroke();
    c.beginPath(); c.moveTo(38.5, 22.8); c.quadraticCurveTo(41.5, 21.3, 44.5, 22.8); c.stroke();
    el(c, 38.6, 33.8, P.edad ? 2.6 : 2, P.edad ? 2.1 : 1.6); c.fillStyle = sh(s, -.16); c.fill(); brillo(c, 37.9, 33.1, 0.9, 0.6, .5, 0);
    if (P.boca === 'abierta') { c.beginPath(); c.moveTo(35, 37.5); c.quadraticCurveTo(38.5, 43, 42.2, 37.3); c.closePath(); F(c, '#8E2F3A', 1.1); el(c, 38.6, 40.4, 1.8, 0.9); c.fillStyle = '#E3727F'; c.fill(); }
    else { c.beginPath(); c.moveTo(35.5, 38); c.quadraticCurveTo(38.5, 40.4, 41.6, 37.8); c.lineWidth = 1.3; c.strokeStyle = sh(s, -.55); c.stroke(); }
    if (P.edad) { c.strokeStyle = 'rgba(90,50,40,.35)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(35, 35.2); c.quadraticCurveTo(33.6, 37, 35, 39.2); c.stroke(); linea(c, [26.5, 33, 29, 33.8], 'rgba(90,50,40,.3)', 0.8); }
    peloFrente(c, P);
  }
  function detalles(c, P) {
    const r = P.ropa;
    if (P.id === 'ale') {
      rr(c, 21, 40.5, 22, 8, 4); F(c, vol(c, sh(r, -.15), 21, 40, 22, 8), 1.2);
      linea(c, [29.5, 47, 28.6, 56], '#9CCBF0', 1.3); linea(c, [35.5, 47, 36.4, 56], '#9CCBF0', 1.3);
      el(c, 28.6, 56.6, 1.1, 1.1); c.fillStyle = '#E8F2FB'; c.fill(); el(c, 36.4, 56.6, 1.1, 1.1); c.fill();
      rr(c, 24, 59.5, 16, 7, 3); F(c, sh(r, -.12), 1);
      rr(c, 19.4, 45, 4, 16, 2); F(c, vol(c, '#E5A92A', 19, 45, 4, 16), 1); rr(c, 40.6, 45, 4, 16, 2); F(c, vol(c, '#E5A92A', 40, 45, 4, 16), 1);
      c.font = '800 4.6px Rubik, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#F2F6FB'; c.fillText('UPN', 32, 52.5);
    }
    if (P.id === 'pestalozzi' || P.id === 'rousseau') {
      rr(c, 27, 46, 10, 21, 3); F(c, vol(c, P.id === 'rousseau' ? '#E8D9A8' : '#E3D6B8', 27, 46, 10, 21), 1.1);
      [52, 57, 62].forEach(y => { el(c, 32, y, 0.9, 0.9); c.fillStyle = '#C9A13A'; c.fill(); });
      linea(c, [26.5, 46, 24.5, 62], sh(r, -.4), 1); linea(c, [37.5, 46, 39.5, 62], sh(r, -.4), 1);
      [[23.5, 56], [23.5, 61], [40.5, 56], [40.5, 61]].forEach(([x, y]) => { el(c, x, y, 1.1, 1.1); F(c, '#D9B44A', 0.6); });
    }
    if (P.id === 'pestalozzi') {
      el(c, 32, 46, 5.5, 3.8); F(c, '#FAFAFA', 1.1);
      c.beginPath(); c.moveTo(30.5, 48); c.lineTo(29, 55); c.lineTo(32, 52.5); c.lineTo(35, 55); c.lineTo(33.5, 48); c.closePath(); F(c, L(c, 29, 48, 35, 55, ['#FFFFFF', '#DDE3EA']), 1);
    }
    if (P.id === 'rousseau') [[32, 46.5, 4.4, 2.3], [32, 50, 3.8, 2.1], [32, 53.3, 3.1, 1.9]].forEach(([x, y, a, b]) => { el(c, x, y, a, b); F(c, L(c, x, y - b, x, y + b, ['#FFFFFF', '#DCE2EA']), 0.9); });
    if (P.id === 'comenio') { rr(c, 28.6, 43.5, 3.3, 9, 1); F(c, '#FAFAFA', 1); rr(c, 32.3, 43.5, 3.3, 9, 1); F(c, '#FAFAFA', 1); linea(c, [32, 64, 32, 89], 'rgba(0,0,0,.35)', 1); }
    if (P.id === 'froebel') {
      c.beginPath(); c.moveTo(27, 45); c.lineTo(37, 45); c.lineTo(32, 55); c.closePath(); F(c, '#F6F3EC', 1);
      c.beginPath(); c.moveTo(32, 47); c.lineTo(29, 45.2); c.lineTo(29, 48.8); c.closePath(); F(c, '#3A2A20', 0.8);
      c.beginPath(); c.moveTo(32, 47); c.lineTo(35, 45.2); c.lineTo(35, 48.8); c.closePath(); F(c, '#3A2A20', 0.8);
      linea(c, [26.5, 45.5, 25, 63], sh(r, -.45), 1); linea(c, [37.5, 45.5, 39, 63], sh(r, -.45), 1);
    }
  }
  function objeto(c, tipo, x, y) {
    if (tipo === 'libro') {
      c.save(); c.translate(x, y); c.rotate(-0.15);
      rr(c, -4, -11, 14, 17, 1.8); F(c, L(c, -4, -11, 10, 6, ['#B23A3A', '#8E2B2B', '#5E1B1B']), 1.3);
      rr(c, 8.5, -10, 2.6, 15, 1); F(c, '#F3EAD2', 0.8);
      c.fillStyle = '#E8C25A'; c.fillRect(-1.5, -7, 9, 1.2); c.fillRect(-1.5, -4.5, 7, 1); c.restore();
    }
    if (tipo === 'pelota') {
      const cx = x + 5, cy = y - 6, r = 6.5;
      ['#E5484D', '#F2B632', '#1A5FB4'].forEach((col, i) => { c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, r, i * 2.094 - 1.2, (i + 1) * 2.094 - 1.2); c.closePath(); c.fillStyle = col; c.fill(); });
      el(c, cx, cy, r, r); c.fillStyle = Rg(c, cx, cy, r, ['rgba(255,255,255,.35)', 'rgba(255,255,255,0)', 'rgba(0,0,0,.25)'], cx - 2, cy - 2); c.fill(); c.lineWidth = 1.3; c.strokeStyle = OUT; c.stroke();
      brillo(c, cx - 2.2, cy - 2.6, 2, 1.2, .7, -.5);
    }
    if (tipo === 'ramita') {
      c.beginPath(); c.moveTo(x + 1, y); c.quadraticCurveTo(x + 3, y - 8, x + 6, y - 16); c.strokeStyle = '#3E7A35'; c.lineWidth = 1.4; c.stroke();
      [[x + 3.5, y - 7, -0.8], [x + 5.5, y - 12, 0.7], [x + 2, y - 12, -1]].forEach(([a, b, r]) => { el(c, a, b, 3.6, 1.8, r); F(c, L(c, a - 3, b, a + 3, b, ['#9BDB7A', '#4E9A3E']), 0.8); });
      [[0, -2], [2, 0], [0, 2], [-2, 0]].forEach(([dx, dy]) => { el(c, x + 6 + dx, y - 17 + dy, 1.7, 1.7); c.fillStyle = '#FFFFFF'; c.fill(); });
      el(c, x + 6, y - 17, 1.1, 1.1); c.fillStyle = '#F2B632'; c.fill();
    }
  }
  function persona(c, P, pose, ph, sinSombra) {
    pose = pose || 'idle'; ph = ph || 0;
    const walk = pose === 'walk', jump = pose === 'jump';
    const s = walk ? Math.sin(ph) : 0;
    const bob = walk ? -Math.abs(Math.sin(ph)) * 1.6 : (pose === 'idle' ? Math.sin(ph) * 0.5 : 0);
    if (!sinSombra) { el(c, 32, 92, jump ? 11 : 17, jump ? 2.4 : 3.4); c.fillStyle = 'rgba(20,30,50,.22)'; c.fill(); }
    c.save(); c.translate(0, bob + (jump ? -6 : 0));
    const skin = P.piel, ropa = P.ropa;
    peloAtras(c, P);
    if (P.mochila) { rr(c, 9, 45, 15, 24, 6); F(c, vol(c, '#F2B632', 9, 45, 15, 24)); rr(c, 10, 58, 13, 8, 3); F(c, vol(c, '#D9951C', 10, 58, 13, 8), 1); }
    if (P.faldones) { c.beginPath(); c.moveTo(19, 60); c.quadraticCurveTo(13, 74, 15, 84); c.lineTo(25, 81); c.lineTo(27, 64); c.closePath(); F(c, vol(c, sh(ropa, -.15), 13, 60, 14, 24)); }
    const aB = jump ? 1.0 : 0.15 - s * 0.7;
    const hb = limb(c, 22, 50, aB, 16, 7.5, sh(ropa, -.18)); mano(c, hb[0], hb[1], sh(skin, -.08));
    if (!P.tunica) {
      const aL = jump ? 0.5 : -s * 0.55, aF = jump ? -0.9 : s * 0.55;
      const b = limb(c, 28, 64, aL, jump ? 17 : 21, 9, sh(P.pantalon, -.18)); zapato(c, b[0], b[1] - 1, sh(P.zapato, -.12), aL);
      const f = limb(c, 36, 64, aF, jump ? 15 : 21, 9, P.pantalon); zapato(c, f[0], f[1] - 1, P.zapato, aF);
    } else { zapato(c, 23 + s * 3, 87.5, P.zapato); zapato(c, 35 - s * 3, 87.5, P.zapato); }
    rr(c, 28.5, 38, 8, 9, 3); F(c, sh(skin, -.15), 1.1);
    if (P.tunica) { c.beginPath(); c.moveTo(22, 44); c.quadraticCurveTo(32, 41, 42, 44); c.quadraticCurveTo(47, 47, 47, 54); c.lineTo(51, 88); c.quadraticCurveTo(32, 92, 13, 88); c.lineTo(17, 54); c.quadraticCurveTo(17, 47, 22, 44); c.closePath(); F(c, vol(c, ropa, 13, 42, 38, 50)); }
    else { rr(c, 18, 44, 28, 25, 9); F(c, vol(c, ropa, 18, 44, 28, 25)); }
    detalles(c, P);
    const aF2 = jump ? -2.6 : -0.15 + s * 0.7;
    const h = limb(c, 42, 50, aF2, 16, 7.5, ropa);
    if (P.objeto) objeto(c, P.objeto, h[0], h[1]);
    mano(c, h[0], h[1], skin);
    cabeza(c, P);
    c.restore();
  }

  // ---------- obstáculos (miran a la izquierda) ----------
  function alcancia(c, ph) {
    el(c, 32, 45, 22, 3); c.fillStyle = 'rgba(20,30,50,.22)'; c.fill();
    [[16, 0, 1], [24, Math.PI, 0], [40, 0, 1], [48, Math.PI, 0]].forEach(([x, o, d]) => { const dy = Math.max(0, Math.sin(ph + o)) * 2; rr(c, x - 3.5, 33 - dy, 7, 11, 3); F(c, vol(c, d ? '#D9849A' : '#E896AA', x - 3.5, 33, 7, 11), 1.2); el(c, x, 43 - dy, 3.2, 1.4); c.fillStyle = '#8E4458'; c.fill(); });
    c.beginPath(); c.moveTo(55, 24); c.bezierCurveTo(63, 19, 63, 31, 57.5, 28.5); c.bezierCurveTo(54, 27, 57, 22, 60.5, 24); c.lineWidth = 2.6; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 1.3; c.strokeStyle = '#F4A3B5'; c.stroke();
    el(c, 37, 6.5, 6, 6); F(c, Rg(c, 37, 6.5, 7, ['#FFF4B0', '#F2B632', '#B9831A'], 35, 4.5), 1.2); el(c, 37, 6.5, 3.6, 3.6); c.lineWidth = 0.8; c.strokeStyle = '#B9831A'; c.stroke();
    el(c, 33, 25, 24, 15.5); F(c, Rg(c, 33, 25, 28, ['#FFE3EA', '#F4A3B5', '#C96A83'], 25, 15), 1.6);
    rr(c, 29, 9.5, 16, 3.6, 1.8); F(c, '#5A2A3A', 0.8);
    c.beginPath(); c.moveTo(16, 15); c.lineTo(19, 4.5); c.lineTo(25.5, 12); c.closePath(); F(c, L(c, 16, 4, 25, 15, ['#F8B9C8', '#D9849A']), 1.3);
    el(c, 10, 27, 6.2, 6.8); F(c, Rg(c, 10, 27, 8, ['#FFD6E0', '#E896AA', '#B85C74'], 8, 24), 1.4);
    el(c, 8.2, 26.5, 1.2, 2); c.fillStyle = '#7A3346'; c.fill(); el(c, 11.8, 26.5, 1.2, 2); c.fill();
    el(c, 19.5, 20, 3, 3.6); F(c, '#FFFFFF', 1); el(c, 18.6, 21, 1.6, 2.1); c.fillStyle = '#14171F'; c.fill(); el(c, 18, 20, 0.6, 0.7); c.fillStyle = '#FFF'; c.fill();
    linea(c, [15, 15.2, 23.5, 18.2], OUT, 2.2);
    c.beginPath(); c.moveTo(14, 34); c.quadraticCurveTo(17, 31.5, 20, 34); c.lineWidth = 1.3; c.strokeStyle = '#7A3346'; c.stroke();
    brillo(c, 28, 14.5, 9, 3.4, .55, -.25); brillo(c, 46, 30, 3, 1.2, .25, -.4);
  }
  function loro(c, ala) {
    c.beginPath(); c.moveTo(38, 34); c.quadraticCurveTo(52, 44, 57, 55); c.lineTo(49, 55); c.quadraticCurveTo(42, 46, 34, 38); c.closePath(); F(c, L(c, 38, 34, 56, 54, ['#E85A5A', '#9E2B2B']), 1.3);
    c.beginPath(); c.moveTo(35, 36); c.quadraticCurveTo(47, 48, 48, 56.5); c.lineTo(42, 56); c.quadraticCurveTo(38, 47, 32, 39); c.closePath(); F(c, L(c, 34, 36, 48, 56, ['#4A8FE0', '#1F4E9A']), 1.3);
    el(c, 30, 30, 13, 16, 0.35); F(c, Rg(c, 30, 30, 18, ['#9BEAA6', '#3DA35D', '#1F6B3A'], 25, 22), 1.5);
    el(c, 25.5, 36, 6.5, 9, 0.3); c.fillStyle = Rg(c, 25.5, 36, 9, ['rgba(220,240,140,.8)', 'rgba(160,210,90,0)']); c.fill();
    el(c, 22, 14, 10, 9.5); F(c, Rg(c, 22, 14, 12, ['#A8F0B2', '#3DA35D', '#1F6B3A'], 18, 9), 1.5);
    el(c, 19, 13, 4.3, 3.9); F(c, '#F6F2E8', 1); el(c, 18.2, 13.3, 1.8, 2.1); c.fillStyle = '#14171F'; c.fill(); el(c, 17.6, 12.4, 0.7, 0.8); c.fillStyle = '#FFF'; c.fill();
    linea(c, [15, 9, 22, 10.5], OUT, 1.6);
    c.beginPath(); c.moveTo(13.5, 11.5); c.quadraticCurveTo(3.5, 11.5, 4.5, 20.5); c.quadraticCurveTo(8, 17, 12.5, 19); c.closePath(); F(c, L(c, 4, 12, 13, 20, ['#FFE08A', '#F2B632', '#B9831A']), 1.3);
    c.beginPath(); c.moveTo(12.5, 18.5); c.quadraticCurveTo(9, 21, 12, 22.5); c.quadraticCurveTo(14, 21, 14, 19); c.closePath(); F(c, '#3A3A3A', 1);
    c.save(); c.translate(33, 25); c.rotate(-0.2 + ala); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(17, 2, 19, 17); c.quadraticCurveTo(8, 14.5, -2, 8); c.closePath(); F(c, L(c, 0, 0, 18, 16, ['#33994F', '#1F6B3A', '#14512B']), 1.3);
    linea(c, [12, 9, 17, 15], '#E85A5A', 1.6); linea(c, [8, 10, 12, 15], '#4A8FE0', 1.4); c.restore();
    linea(c, [28, 45, 27, 50.5], '#7A7F8A', 2); linea(c, [33, 45, 34, 50.5], '#7A7F8A', 2);
    linea(c, [24.5, 51, 29.5, 51], '#7A7F8A', 1.6); linea(c, [31.5, 51, 36.5, 51], '#7A7F8A', 1.6);
  }
  function regla(c) {
    el(c, 8.5, 64.5, 5.5, 3.2); F(c, L(c, 4, 61, 4, 68, ['#4A4A55', '#1E1E26']), 1.2); el(c, 19.5, 64.5, 5.5, 3.2); F(c, L(c, 14, 61, 14, 68, ['#4A4A55', '#1E1E26']), 1.2);
    linea(c, [4, 38, 0, 44], OUT, 2.4); linea(c, [4, 38, 0, 44], '#D9A45B', 1.2); el(c, 0, 45, 2.8, 2.8); F(c, '#EAC07E', 1.1);
    linea(c, [24, 37, 28.5, 30], OUT, 2.4); linea(c, [24, 37, 28.5, 30], '#D9A45B', 1.2); el(c, 29, 29, 2.8, 2.8); F(c, '#EAC07E', 1.1);
    rr(c, 4, 2, 20, 60, 3); F(c, L(c, 4, 0, 24, 0, ['#F3CA86', '#D9A45B', '#A8733A']), 1.6);
    c.strokeStyle = 'rgba(120,70,30,.22)'; c.lineWidth = 0.8;
    [[9, 4, 10.5, 30, 8.5, 60], [17, 4, 15.5, 28, 18, 60], [21, 10, 22, 30, 20.5, 56]].forEach(([a, b, cx, cy, d, e]) => { c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo(cx, cy, d, e); c.stroke(); });
    c.fillStyle = '#5A3A1E'; for (let i = 0; i < 14; i++) c.fillRect(4, 6 + i * 4, i % 5 === 0 ? 7 : 3.5, 0.9);
    c.font = '700 4px Rubik, Arial'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('10', 12, 46); c.fillText('20', 12, 54);
    el(c, 10.5, 22, 3.3, 3.9); F(c, '#FFFFFF', 1.1); el(c, 17.5, 22, 3.3, 3.9); F(c, '#FFFFFF', 1.1);
    el(c, 11.2, 23, 1.7, 2.1); c.fillStyle = '#14171F'; c.fill(); el(c, 16.8, 23, 1.7, 2.1); c.fill();
    linea(c, [6.5, 15.5, 13, 19], OUT, 2.2); linea(c, [21.5, 15.5, 15, 19], OUT, 2.2);
    c.beginPath(); c.moveTo(10, 32); c.quadraticCurveTo(14, 28, 18, 32); c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke();
    rr(c, 6, 4, 2.4, 54, 1.2); c.fillStyle = 'rgba(255,255,255,.28)'; c.fill();
  }

  // ---------- bloques y objetos (32 × 32 unidades) ----------
  function bloquePregunta(c, x, y) {
    rr(c, x + 1, y + 1, 30, 30, 4); F(c, L(c, x, y, x + 32, y + 32, ['#FFE58A', '#F2B632', '#C98A12']), 1.6);
    rr(c, x + 25.5, y + 3, 4.5, 26, 1.5); F(c, L(c, x + 25, 0, x + 30, 0, ['#FFF8E6', '#E5D7B4']), 0.8);
    c.strokeStyle = 'rgba(160,130,80,.5)'; c.lineWidth = 0.5; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(x + 26.5 + i * 0.7, y + 4); c.lineTo(x + 26.5 + i * 0.7, y + 28); c.stroke(); }
    rr(c, x + 4, y + 4, 19.5, 24, 3); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.2; c.stroke();
    el(c, x + 14, y + 16, 8, 8); F(c, Rg(c, x + 14, y + 16, 9, ['#3767B3', '#1F3864', '#132648'], x + 12, y + 13), 1.2);
    c.font = '800 13px Rubik, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFE58A'; c.fillText('?', x + 14, y + 16.8);
    c.beginPath(); c.moveTo(x + 18, y + 30); c.lineTo(x + 18, y + 37); c.lineTo(x + 20, y + 35); c.lineTo(x + 22, y + 37); c.lineTo(x + 22, y + 30); c.closePath(); F(c, L(c, x + 18, y + 30, x + 22, y + 37, ['#EE6060', '#B23030']), 1);
    brillo(c, x + 8, y + 6, 5, 1.6, .6, -.3);
  }
  function bloqueUsado(c, x, y) {
    rr(c, x + 1, y + 1, 30, 30, 4); F(c, L(c, x, y, x + 32, y + 32, ['#C49A64', '#A57A44', '#6E4C26']), 1.6);
    rr(c, x + 25.5, y + 3, 4.5, 26, 1.5); F(c, L(c, x + 25, 0, x + 30, 0, ['#F2E8D0', '#D8C8A4']), 0.8);
    rr(c, x + 4, y + 4, 19.5, 24, 3); c.strokeStyle = 'rgba(255,230,180,.35)'; c.lineWidth = 1.2; c.stroke();
    rr(c, x + 20, y + 12, 9, 8, 2); F(c, L(c, x + 20, y + 12, x + 20, y + 20, ['#E8E2D2', '#9AA5B1']), 1);
    el(c, x + 12, y + 16, 5, 5); c.strokeStyle = 'rgba(255,230,180,.45)'; c.lineWidth = 1.2; c.stroke();
  }
  function librero(c, x, y) {
    rr(c, x, y, 32, 32, 2); F(c, L(c, x, y, x, y + 32, ['#7A5236', '#5B3A29', '#3E2719']), 1.4);
    const lomos = [[5, '#C0392B', 26], [6, '#1A5FB4', 24], [4, '#2E7D4F', 27], [6, '#D98E04', 25], [5, '#6B3FA0', 23]]; let xx = x + 2.5;
    lomos.forEach(([w, col, h]) => { const yy = y + 29 - h; rr(c, xx, yy, w, h, 1); F(c, L(c, xx, 0, xx + w, 0, [sh(col, .3), col, sh(col, -.35)]), 0.7); c.fillStyle = 'rgba(255,226,140,.8)'; c.fillRect(xx + 0.8, yy + 4, w - 1.6, 1.1); c.fillRect(xx + 0.8, yy + h - 6, w - 1.6, 1.1); xx += w + 0.4; });
    c.fillStyle = L(c, 0, y + 29, 0, y + 32, ['#9A6E4A', '#6B4630']); c.fillRect(x + 1, y + 29, 30, 2.5);
  }
  function pilaLibros(c, x, y, w) {
    const libros = [{ col: '#2E7D4F', off: 2 }, { col: '#1A5FB4', off: 6 }, { col: '#C0392B', off: 0 }];
    for (let k = 2; k >= 0; k--) {
      const yy = y + 5 + k * 9, x0 = x + libros[k].off, W = w - 8, col = libros[k].col;
      rr(c, x0, yy, W, 9, 2); F(c, L(c, 0, yy, 0, yy + 9, [sh(col, .3), col, sh(col, -.35)]), 1.2);
      rr(c, x0 + W - 7, yy + 1.6, 6, 5.8, 1); F(c, L(c, 0, yy, 0, yy + 9, ['#FFF8E6', '#DCCBA6']), 0.6);
      c.fillStyle = 'rgba(255,226,140,.85)'; c.fillRect(x0 + 5, yy + 1.5, 1.2, 6); c.fillRect(x0 + 8, yy + 1.5, 1.2, 6);
      if (k === 0) { c.beginPath(); c.moveTo(x0 + 1, yy + 0.5); c.lineTo(x0 + 5, yy - 4.5); c.lineTo(x0 + W + 3, yy - 4.5); c.lineTo(x0 + W - 1, yy + 0.5); c.closePath(); F(c, L(c, 0, yy - 5, 0, yy, [sh(col, .45), sh(col, .15)]), 1.1); }
    }
  }
  function foco(c, x, y) {
    el(c, x, y, 20, 20); c.fillStyle = Rg(c, x, y, 20, ['rgba(255,226,120,.5)', 'rgba(255,226,120,0)']); c.fill();
    c.beginPath(); c.arc(x, y - 1, 7.2, Math.PI * 0.78, Math.PI * 2.22); c.lineTo(x + 3.6, y + 6); c.lineTo(x - 3.6, y + 6); c.closePath(); F(c, Rg(c, x, y - 1, 9, ['#FFFDE6', '#FFE066', '#E8B320'], x - 2, y - 4), 1.3);
    c.beginPath(); c.moveTo(x - 2, y + 5); c.lineTo(x - 2, y + 1); c.lineTo(x - 1, y - 1); c.lineTo(x, y + 1); c.lineTo(x + 1, y - 1); c.lineTo(x + 2, y + 1); c.lineTo(x + 2, y + 5); c.strokeStyle = '#E07A1F'; c.lineWidth = 0.9; c.stroke();
    rr(c, x - 4.2, y + 6, 8.4, 6.5, 1.8); F(c, L(c, x - 4, 0, x + 4, 0, ['#E8EDF2', '#9AA5B1', '#6B7785']), 1.1);
    linea(c, [x - 4, y + 8.3, x + 4, y + 8.3], 'rgba(60,70,80,.5)', 0.6); linea(c, [x - 4, y + 10.4, x + 4, y + 10.4], 'rgba(60,70,80,.5)', 0.6);
    el(c, x, y + 13.3, 2.2, 1.4); c.fillStyle = '#3A3F48'; c.fill();
    brillo(c, x - 3, y - 3.5, 1.7, 3.1, .8, 0.4);
  }
  function corazon(c, x, y, s, lleno) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.moveTo(0, 4); c.bezierCurveTo(-1, 2.5, -7, -1, -6, -4.5); c.bezierCurveTo(-5, -8, -1, -7.5, 0, -4.5); c.bezierCurveTo(1, -7.5, 5, -8, 6, -4.5); c.bezierCurveTo(7, -1, 1, 2.5, 0, 4); c.closePath();
    c.fillStyle = lleno ? Rg(c, 0, -2, 9, ['#FF9AA0', '#E5484D', '#A3262B'], -2.5, -4.5) : 'rgba(80,92,120,.75)'; c.fill(); c.lineWidth = 1.6 / s; c.strokeStyle = OUT; c.stroke();
    if (lleno) brillo(c, -3, -4.2, 1.6, 1, .8, -.5);
    c.restore();
  }
  function gis(c, x, y) {
    c.save(); c.translate(x, y); c.rotate(-0.5);
    rr(c, -3, -11, 6, 22, 2.5); F(c, L(c, -3, 0, 3, 0, ['#FFFFFF', '#F1F3F6', '#C3CBD6']), 1.2);
    el(c, 0, -10.5, 3, 1.4); F(c, '#FAFBFC', 0.9);
    c.restore();
  }
  // Suelo: pasto (fila superior) o tierra (filas inferiores). v = variante 0..3 para variar piedras.
  function sueloTile(c, conPasto, v) {
    c.fillStyle = conPasto ? L(c, 0, 0, 0, 32, ['#AE7442', '#9A6638']) : L(c, 0, 0, 0, 32, ['#8A5A30', '#6E4524']);
    c.fillRect(0, 0, 32, 32);
    for (let k = 0; k < 2; k++) {
      const px = 4 + ((v * 11 + k * 13) % 24), py = (conPasto ? 18 : 6) + ((v * 7 + k * 9) % (conPasto ? 10 : 20));
      el(c, px, py, 3.2 + k * 0.6, 2.3 + k * 0.4); F(c, Rg(c, px, py, 5, ['#C9C2B6', '#9A8F80', '#6E655A'], px - 1, py - 1), 0.8, 'rgba(40,25,15,.6)');
    }
    if (conPasto) {
      c.beginPath(); c.moveTo(0, 0); c.lineTo(32, 0); c.lineTo(32, 10);
      for (let x = 32; x >= 0; x -= 4) c.lineTo(x, ((x / 4) | 0) % 2 ? 10 : 13);
      c.closePath(); c.fillStyle = L(c, 0, 0, 0, 13, ['#A6E585', '#5FAE4B', '#3F8A35']); c.fill();
      c.beginPath(); for (let x = 32; x >= 0; x -= 4) c.lineTo(x, ((x / 4) | 0) % 2 ? 10 : 13); c.lineWidth = 1.2; c.strokeStyle = 'rgba(30,60,25,.6)'; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(0, 0, 32, 1.6);
      for (let x = 2 + v; x < 31; x += 5) { const hh = 3 + ((x * 13 + v) % 4); c.beginPath(); c.moveTo(x - 1.4, 0.5); c.lineTo(x + 0.4, -hh); c.lineTo(x + 1.6, 0.5); c.closePath(); c.fillStyle = ((x / 5) | 0) % 2 ? '#7CCB5E' : '#4E9A3E'; c.fill(); }
    }
  }

  // ---------- escenario ----------
  function nube(c, x, y, s, a) {
    c.save(); c.globalAlpha = a || 0.95; c.translate(x, y); c.scale(s, s);
    [[0, 4, 13], [15, -6, 17], [33, 2, 14], [18, 6, 15], [46, 7, 10]].forEach(([cx, cy, r]) => { el(c, cx, cy, r, r); c.fillStyle = Rg(c, cx, cy, r, ['#FFFFFF', '#FFFFFF', '#DCEAF7'], cx - r * 0.3, cy - r * 0.5); c.fill(); });
    c.restore();
  }
  function montes(c, base, picos, luz, sombra, nl, ns) {
    picos.forEach(([px, py, w]) => {
      const m = px + w * 0.15;
      c.beginPath(); c.moveTo(px - w, base); c.lineTo(px, py); c.lineTo(m, base); c.closePath(); c.fillStyle = luz; c.fill();
      c.beginPath(); c.moveTo(px, py); c.lineTo(px + w, base); c.lineTo(m, base); c.closePath(); c.fillStyle = sombra; c.fill();
      c.beginPath(); c.moveTo(px, py); c.lineTo(px - w * 0.55, base); c.lineTo(px - w * 0.2, base); c.closePath(); c.fillStyle = 'rgba(255,255,255,.06)'; c.fill();
      if (nl) {
        const f = 0.3, Ly = py + (base - py) * f, Lx = px - w * f, Rx = px + w * f;
        c.beginPath(); c.moveTo(px, py); c.lineTo(Lx, Ly); c.lineTo(px - w * 0.18, Ly + 5); c.lineTo(px - w * 0.06, Ly - 2); c.lineTo(px + w * 0.02, Ly + 6); c.closePath(); c.fillStyle = nl; c.fill();
        c.beginPath(); c.moveTo(px, py); c.lineTo(px + w * 0.02, Ly + 6); c.lineTo(px + w * 0.12, Ly + 1); c.lineTo(Rx, Ly); c.closePath(); c.fillStyle = ns; c.fill();
      }
    });
  }
  function pino(c, x, y, h) {
    c.fillStyle = '#5B3A29'; c.fillRect(x - 1.5, y - 4, 3, 4);
    for (let i = 0; i < 3; i++) {
      const w = (h * 0.42) * (1 - i * 0.22), top = y - 4 - h * (0.34 + i * 0.27), bot = y - 4 - h * (i * 0.22);
      c.beginPath(); c.moveTo(x - w, bot); c.lineTo(x, top); c.lineTo(x, bot); c.closePath(); c.fillStyle = '#3E8A4A'; c.fill();
      c.beginPath(); c.moveTo(x, top); c.lineTo(x + w, bot); c.lineTo(x, bot); c.closePath(); c.fillStyle = '#2A6436'; c.fill();
    }
  }
  // Castillo de Yverdon, sede del instituto de Pestalozzi (1805–1825), con bandera suiza.
  function castillo(c, x, y) {
    c.beginPath(); c.moveTo(x - 60, y + 96); c.quadraticCurveTo(x + 10, y + 70, x + 55, y + 74); c.quadraticCurveTo(x + 120, y + 76, x + 170, y + 96); c.closePath(); c.fillStyle = L(c, 0, y + 70, 0, y + 96, ['#86C46A', '#5E9E4E']); c.fill();
    rr(c, x + 16, y + 30, 72, 52, 2); F(c, L(c, x, y + 30, x + 60, y + 82, ['#ECE6D8', '#CFC6B3', '#A39880']), 1.2);
    for (let i = 0; i < 7; i++) { rr(c, x + 17 + i * 10.4, y + 23.5, 6, 8, 1); F(c, '#D9D1BF', 1); }
    [x, x + 86].forEach(tx => {
      rr(c, tx, y + 16, 22, 66, 3); F(c, L(c, tx, 0, tx + 22, 0, ['#F2ECE0', '#CFC6B3', '#958A72']), 1.2);
      c.beginPath(); c.moveTo(tx - 3, y + 17); c.lineTo(tx + 11, y - 16); c.lineTo(tx + 25, y + 17); c.closePath(); F(c, L(c, tx, 0, tx + 22, 0, ['#6A7DA0', '#3A4866', '#232D45']), 1.2);
      c.beginPath(); c.arc(tx + 11, y + 38, 3.4, Math.PI, 0); c.lineTo(tx + 14.4, y + 46); c.lineTo(tx + 7.6, y + 46); c.closePath(); F(c, '#3A2E2A', 0.8);
    });
    c.beginPath(); c.arc(x + 52, y + 66, 8, Math.PI, 0); c.lineTo(x + 60, y + 82); c.lineTo(x + 44, y + 82); c.closePath(); F(c, L(c, 0, y + 58, 0, y + 82, ['#5A4636', '#2E2420']), 1);
    [[x + 30, y + 44], [x + 70, y + 44]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 3, Math.PI, 0); c.lineTo(a + 3, b + 8); c.lineTo(a - 3, b + 8); c.closePath(); F(c, '#3A2E2A', 0.8); });
    linea(c, [x + 97, y - 16, x + 97, y - 34], '#5B3A29', 1.4);
    rr(c, x + 97, y - 34, 14, 10, 1); F(c, '#D52B1E', 0.8); c.fillStyle = '#FFFFFF'; c.fillRect(x + 102.6, y - 32, 2.8, 6); c.fillRect(x + 101, y - 30.4, 6, 2.8);
  }
  function burbuja(c, x, y, txt, dir) {
    c.font = '800 11px Rubik, Arial'; const w = c.measureText(txt).width + 16;
    rr(c, x, y, w, 22, 11); F(c, '#FFFFFF', 1.5);
    const bx = dir < 0 ? x + w - 18 : x + 14;
    c.beginPath(); c.moveTo(bx, y + 21); c.lineTo(bx + (dir < 0 ? 8 : -2), y + 30); c.lineTo(bx + 8, y + 21); c.closePath(); c.fillStyle = '#FFFFFF'; c.fill();
    linea(c, [bx, y + 21.6, bx + (dir < 0 ? 8 : -2), y + 30, bx + 8, y + 21.6], OUT, 1.5);
    c.fillStyle = '#1F3864'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(txt, x + 8, y + 11.5);
    return w;
  }
  function textoArte(c, s, x, y, size, col, align) {
    c.font = `800 ${size}px Rubik, Arial`; c.textAlign = align || 'left'; c.textBaseline = 'middle';
    c.lineWidth = Math.max(3, size * 0.22); c.strokeStyle = '#14203D'; c.lineJoin = 'round'; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y);
  }

  // ---------- caché ----------
  let K = 0;               // píxeles reales por unidad lógica del juego
  const C = {};            // imágenes listas para copiar
  const TAU = Math.PI * 2;
  function cachear(clave, caja, escala, ancla, fn) {
    const [x0, y0, w, h] = caja, px = K * escala;
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(w * px)); cv.height = Math.max(1, Math.ceil(h * px));
    const c = cv.getContext('2d'); c.setTransform(px, 0, 0, px, -x0 * px, -y0 * px);
    fn(c);
    C[clave] = { img: cv, w: w * escala, h: h * escala, ax: (ancla[0] - x0) * escala, ay: (ancla[1] - y0) * escala };
  }
  // Tamaños en el juego (unidades lógicas por unidad de arte)
  const E = { persona: 0.27, cerdo: 0.32, loro: 0.25, regla: 0.26, tile: 0.5 };
  const PIES = 89;   // altura de las suelas en la caja de personaje

  function preparar(k, forzar) {
    if (!k || (k === K && !forzar)) return;
    K = k;
    const cajaP = [-8, -8, 80, 106], anclaP = [32, PIES];
    ['ale', 'pestalozzi', 'comenio', 'rousseau', 'froebel'].forEach(id => {
      for (let i = 0; i < 4; i++) cachear(`${id}_quieto${i}`, cajaP, E.persona, anclaP, c => persona(c, PJ[id], 'idle', i * TAU / 4));
    });
    for (let i = 0; i < 8; i++) cachear(`ale_camina${i}`, cajaP, E.persona, anclaP, c => persona(c, PJ.ale, 'walk', i * TAU / 8));
    cachear('ale_salto', cajaP, E.persona, anclaP, c => persona(c, PJ.ale, 'jump', 0));
    for (let i = 0; i < 4; i++) cachear(`cerdo${i}`, [-2, -2, 70, 52], E.cerdo, [33, 44], c => alcancia(c, i * TAU / 4));
    for (let i = 0; i < 4; i++) cachear(`loro${i}`, [0, 0, 60, 60], E.loro, [28, 30], c => loro(c, Math.sin(i * TAU / 4) * 0.6));
    cachear('regla', [-6, -2, 40, 74], E.regla, [14, 67.5], c => regla(c));
    cachear('foco', [-21, -21, 42, 42], 0.5, [0, 0], c => foco(c, 0, 0));
    cachear('gis', [-10, -14, 20, 28], 0.5, [0, 0], c => gis(c, 0, 0));
    cachear('corazon', [-10, -10, 20, 18], 0.75, [0, 0], c => corazon(c, 0, 0, 1, true));
    const cajaT = [-6, -8, 44, 48];
    cachear('pregunta', cajaT, E.tile, [0, 0], c => bloquePregunta(c, 0, 0));
    cachear('usado', cajaT, E.tile, [0, 0], c => bloqueUsado(c, 0, 0));
    cachear('librero', cajaT, E.tile, [0, 0], c => librero(c, 0, 0));
    for (let v = 0; v < 4; v++) {
      cachear('pasto' + v, cajaT, E.tile, [0, 0], c => sueloTile(c, true, v));
      cachear('tierra' + v, cajaT, E.tile, [0, 0], c => sueloTile(c, false, v));
    }
    // Plataforma de libros por tramos: sola, inicio, medio y final
    const plat = { pilaS: [0, 32], pilaI: [0, 70], pilaM: [-20, 72], pilaD: [-38, 70] };
    Object.keys(plat).forEach(k2 => cachear(k2, cajaT, E.tile, [0, 0], c => {
      c.save(); c.beginPath(); c.rect(k2 === 'pilaI' || k2 === 'pilaS' ? -6 : 0, -8, k2 === 'pilaS' ? 44 : (k2 === 'pilaI' ? 38 : (k2 === 'pilaD' ? 38 : 32)), 48); c.clip();
      pilaLibros(c, plat[k2][0], 0, plat[k2][1]); c.restore();
    }));

    // Fondos (unidades de arte: 1280 × 360 por capa, se repiten en horizontal)
    cachear('cielo', [0, 0, 640, 360], 0.5, [0, 0], c => {
      c.fillStyle = L(c, 0, 0, 0, 360, ['#3E8ED8', '#7DBDF0', '#CDE8F8', '#F6EEDC']); c.fillRect(0, 0, 640, 360);
      el(c, 560, 52, 150, 150); c.fillStyle = Rg(c, 560, 52, 150, ['rgba(255,246,214,.95)', 'rgba(255,246,214,.35)', 'rgba(255,246,214,0)']); c.fill();
    });
    const repetir = (lista) => lista.concat(lista.map(([a, b, w]) => [a - 1280, b, w]), lista.map(([a, b, w]) => [a + 1280, b, w]));
    cachear('nubes', [0, 0, 1280, 360], 0.5, [0, 0], c => {
      [[60, 46, 1.1, .95], [330, 28, 0.8, .85], [560, 78, 0.7, .8], [800, 40, 1, .9], [1060, 66, 0.8, .85]].forEach(([x, y, s, a]) => nube(c, x, y, s, a));
    });
    cachear('montesLejos', [0, 0, 1280, 360], 0.5, [0, 0], c => {
      montes(c, 262, repetir([[40, 120, 110], [170, 96, 120], [300, 130, 95], [430, 88, 130], [600, 110, 120], [760, 100, 115], [900, 124, 100], [1050, 92, 125], [1200, 115, 110]]), '#A9C2E4', '#7F9CC7', '#FFFFFF', '#D8E4F4');
    });
    cachear('montesCerca', [0, 0, 1280, 360], 0.5, [0, 0], c => {
      montes(c, 272, repetir([[110, 170, 90], [250, 160, 110], [520, 175, 95], [700, 165, 100], [940, 172, 95], [1150, 160, 105]]), '#7FA6CF', '#5C82AF', '#F4F8FC', '#C9D8EC');
      c.fillStyle = L(c, 0, 170, 0, 275, ['rgba(236,244,250,0)', 'rgba(236,244,250,.75)']); c.fillRect(0, 170, 1280, 110);
    });
    cachear('lago', [0, 0, 1280, 360], 0.5, [0, 0], c => {
      c.fillStyle = L(c, 0, 252, 0, 280, ['#9FD0F2', '#5F9FD6']); c.fillRect(0, 254, 1280, 30);
      for (let i = 0; i < 26; i++) { const sx = (i * 97) % 1280, sy = 258 + (i % 3) * 5; linea(c, [sx, sy, sx + 10, sy], 'rgba(255,255,255,.7)', 1.2); }
    });
    cachear('castillo', [-70, -40, 250, 140], 0.5, [0, 0], c => castillo(c, 0, 0));
    cachear('colinas', [0, 0, 1280, 360], 0.5, [0, 0], c => {
      const yH = x => 270 + 12 * Math.sin(TAU * x / 1280 * 3) + 8 * Math.sin(TAU * x / 1280 * 5 + 1.3);
      c.beginPath(); c.moveTo(0, 360); for (let x = 0; x <= 1280; x += 8) c.lineTo(x, yH(x)); c.lineTo(1280, 360); c.closePath();
      c.fillStyle = L(c, 0, 250, 0, 300, ['#7CC466', '#4E9A3E']); c.fill();
      [[36, 26], [64, 32], [90, 22], [392, 24], [612, 26], [760, 30], [790, 22], [1010, 28], [1180, 24], [1210, 30]].forEach(([x, h]) => pino(c, x, yH(x) + 4, h));
      [180, 320, 540, 880, 1100].forEach(x => { const y = yH(x) + 8; [[0, 0, 9], [9, -3, 10], [18, 0, 8]].forEach(([a, b, r]) => { el(c, x + a, y + b, r, r * 0.8); c.fillStyle = Rg(c, x + a, y + b, r, ['#8ED472', '#4E9A3E', '#2F6E2C'], x + a - 3, y + b - 3); c.fill(); }); });
    });
  }

  // ---------- dibujo durante el juego (coordenadas lógicas del juego) ----------
  function dibujar(ctx, clave, x, y, flip) {
    const s = C[clave]; if (!s) return;
    if (!flip) ctx.drawImage(s.img, x - s.ax, y - s.ay, s.w, s.h);
    else { ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.drawImage(s.img, -s.ax, -s.ay, s.w, s.h); ctx.restore(); }
  }
  function capa(ctx, clave, desp) {
    const s = C[clave]; let x = -(((desp % s.w) + s.w) % s.w);
    for (; x < 320; x += s.w) ctx.drawImage(s.img, x, 0, s.w, s.h);
  }
  function fondo(ctx, cam, castilloX, t) {
    ctx.drawImage(C.cielo.img, 0, 0, 320, 180);
    capa(ctx, 'nubes', cam * 0.12 + t * 0.004);
    capa(ctx, 'montesLejos', cam * 0.2);
    capa(ctx, 'montesCerca', cam * 0.3);
    capa(ctx, 'lago', cam * 0.4);
    if (castilloX !== null) dibujar(ctx, 'castillo', castilloX - cam * 0.4, 83);
    capa(ctx, 'colinas', cam * 0.5);
  }
  function enArte(ctx, x, y, fn) { ctx.save(); ctx.translate(x, y); ctx.scale(0.5, 0.5); fn(ctx); ctx.restore(); }
  function texto(ctx, s, x, y, size, color, align) { enArte(ctx, x, y, c => textoArte(c, s, 0, 0, size * 2, color || '#FFFFFF', align)); }
  function globo(ctx, x, y, s, dir) { enArte(ctx, x, y, c => burbuja(c, 0, 0, s, dir)); }
  function bandera(ctx, x, y, tomada) {
    enArte(ctx, x, y, c => {
      linea(c, [0, 0, 0, 64], OUT, 3.6); linea(c, [0, 0, 0, 64], '#8A6040', 1.8);
      el(c, 0, -2, 3.2, 3.2); F(c, Rg(c, 0, -2, 4, ['#FFF1A6', '#F2B632', '#B9831A'], -1, -3), 1);
      c.beginPath(); c.moveTo(1.5, 3); c.quadraticCurveTo(10, 1, 20, 6); c.lineTo(1.5, 20); c.closePath();
      F(c, tomada ? L(c, 0, 3, 20, 20, ['#FFE58A', '#F2B632']) : L(c, 0, 3, 20, 20, ['#A9B6CC', '#7D8BA6']), 1.2);
    });
  }
  function meta(ctx, x, y, completo, t) {
    enArte(ctx, x, y, c => {
      linea(c, [0, 0, 0, 112], OUT, 4.4); linea(c, [0, 0, 0, 112], '#8A6040', 2.4);
      el(c, 0, -2, 4.5, 4.5); F(c, Rg(c, 0, -2, 5, ['#FFF1A6', '#F2B632', '#B9831A'], -1.5, -3.5), 1.2);
      const ola = Math.sin(t * 0.006) * 2;
      c.beginPath(); c.moveTo(2, 6); c.quadraticCurveTo(16, 2 + ola, 30, 8); c.lineTo(2, 32); c.closePath();
      F(c, completo ? L(c, 2, 6, 30, 30, ['#FFE58A', '#F2B632']) : L(c, 2, 6, 30, 30, ['#3767B3', '#1F3864']), 1.4);
      c.font = '800 6px Rubik, Arial'; c.fillStyle = completo ? '#1F3864' : '#FFFFFF'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('UPN', 6, 15);
    });
  }
  function proyectil(ctx, x, y) { enArte(ctx, x, y, c => { c.save(); c.rotate(0.6); rr(c, -1, -5, 7, 4, 2); F(c, '#FFFFFF', 1); c.restore(); }); }
  function polvo(ctx, x, y, a) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill(); }
  function hud(ctx, d) {
    enArte(ctx, 0, 0, c => {
      const n = Math.max(3, d.animo), anchoIzq = 112 + n * 20 + (d.gis ? 22 : 0);
      rr(c, 10, 8, anchoIzq, 34, 17); F(c, 'rgba(18,30,60,.72)', 2, 'rgba(255,255,255,.55)');
      for (let i = 0; i < n; i++) corazon(c, 30 + i * 20, 26, 1.2, i < d.animo);
      const xf = 30 + n * 20 + 6;
      c.save(); c.translate(xf, 22); c.scale(0.62, 0.62); foco(c, 0, 0); c.restore();
      textoArte(c, '× ' + d.ideas, xf + 14, 26, 16, '#FFFFFF');
      if (d.gis) { c.save(); c.translate(xf + 70, 25); c.scale(0.7, 0.7); gis(c, 0, 0); c.restore(); }
      rr(c, 236, 8, 168, 34, 17); F(c, 'rgba(18,30,60,.72)', 2, 'rgba(255,255,255,.55)');
      textoArte(c, d.mundo, 320, 19.5, 12, '#FFD977', 'center');
      c.font = '700 9.5px "Nunito Sans", Arial'; c.fillStyle = '#DCE6F5'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(d.nombre, 320, 33);
      rr(c, 508, 8, 122, 34, 17); F(c, 'rgba(18,30,60,.72)', 2, 'rgba(255,255,255,.55)');
      textoArte(c, String(d.puntos).padStart(6, '0'), 569, 26, 18, '#FFFFFF', 'center');
    });
  }

  // Pantalla de título: el paisaje se desplaza solo y los personajes del Mundo 1 esperan en fila.
  function titulo(ctx, t, tactil) {
    const cam = t * 0.03, lejos = cam * 0.4;
    fondo(ctx, cam, lejos - (lejos % 900) + 340, t);
    for (let x = 0; x < 320; x += 16) { dibujar(ctx, 'pasto' + ((x / 16) % 4), x, 148); dibujar(ctx, 'tierra' + ((x / 16 + 1) % 4), x, 164); }
    ctx.fillStyle = 'rgba(14,27,56,.18)'; ctx.fillRect(0, 0, 320, 180);
    const fila = [['comenio', 70], ['rousseau', 112], ['ale', 160], ['pestalozzi', 208], ['froebel', 250]];
    fila.forEach(([id, x], i) => {
      dibujar(ctx, `${id}_quieto${Math.floor(t / 260 + i) % 4}`, x, 148, id === 'pestalozzi' || id === 'froebel');
    });
    enArte(ctx, 0, 0, c => {
      c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      c.font = '800 44px Rubik, Arial';
      c.lineWidth = 12; c.strokeStyle = '#14203D'; c.strokeText('SALTOS DEL', 320, 70);
      c.fillStyle = L(c, 0, 50, 0, 90, ['#FFF3B0', '#FFD24A', '#E39B12']); c.fillText('SALTOS DEL', 320, 70);
      c.font = '800 70px Rubik, Arial';
      c.lineWidth = 14; c.strokeText('SABER', 320, 128);
      c.fillStyle = L(c, 0, 98, 0, 158, ['#FFF3B0', '#FFD24A', '#E39B12']); c.fillText('SABER', 320, 128);
      c.restore();
      textoArte(c, 'Una aventura pedagógica · UPN Unidad 112', 320, 176, 15, '#DCE6F5', 'center');
      if (Math.floor(t / 600) % 2 === 0) {
        const msg = tactil ? 'Toca para empezar' : 'Presiona Enter para empezar';
        c.font = '800 14px Rubik, Arial'; const w = c.measureText(msg).width + 36;
        rr(c, 320 - w / 2, 196, w, 30, 15); F(c, 'rgba(18,30,60,.72)', 2, 'rgba(255,255,255,.6)');
        textoArte(c, msg, 320, 211.5, 14, '#FFFFFF', 'center');
      }
    });
  }

  // Retrato redondo para las ventanas de pregunta y diálogo.
  function retrato(cv, clave) {
    const P = PJ[clave] || PJ.pestalozzi, px = 2;
    cv.width = 96 * px; cv.height = 96 * px;
    const c = cv.getContext('2d'); c.setTransform(px, 0, 0, px, 0, 0);
    c.fillStyle = Rg(c, 48, 40, 70, ['#E8F3FB', '#9CCBF0', '#3E8ED8'], 40, 30); c.fillRect(0, 0, 96, 96);
    c.save(); c.translate(48 - 33 * 1.7, 50 - 27 * 1.7); c.scale(1.7, 1.7); persona(c, P, 'idle', 0, true); c.restore();
  }

  return { preparar, dibujar, fondo, texto, globo, bandera, meta, proyectil, polvo, hud, titulo, retrato,
    get K() { return K; }, ESCALA: E, PIES };
})();
