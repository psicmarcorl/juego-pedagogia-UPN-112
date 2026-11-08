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
    froebel: { id: 'froebel', piel: '#EAB890', pelo: '#A8A39A', iris: '#4A6A7A', estilo: 'largo', ropa: '#2F4A35', pantalon: '#2A2A2E', zapato: '#1E1E22', edad: true, objeto: 'pelota' },
    // Mundo 2
    montessori: { id: 'montessori', piel: '#EDBF98', pelo: '#3E2C26', iris: '#4A3020', estilo: 'chongo', ropa: '#35293E', pantalon: '#35293E', zapato: '#1E1A22', tunica: true, objeto: 'cubo' },
    dewey: { id: 'dewey', piel: '#EDBF98', pelo: '#9C948A', iris: '#4A6A8A', estilo: 'raya', bigote: true, lentes: true, ropa: '#5B6475', pantalon: '#4A5262', zapato: '#2A2420', edad: true, objeto: 'martillo' },
    decroly: { id: 'decroly', piel: '#E8B48C', pelo: '#3A2A22', iris: '#4A3A2A', estilo: 'calvo', candado: true, lentes: true, ropa: '#E6E9EE', pantalon: '#3A3836', zapato: '#1E1E22', objeto: 'lupa' },
    // Mundo 3
    makarenko: { id: 'makarenko', piel: '#E8B48C', pelo: '#2B2B2B', iris: '#4A3A2A', estilo: 'corto', lentes: true, ropa: '#6B6A3A', pantalon: '#3A3A2A', zapato: '#2A2018', objeto: 'poema' },
    vygotsky: { id: 'vygotsky', piel: '#EDBF98', pelo: '#2A2420', iris: '#4A3A2A', estilo: 'atras', lentes: true, ropa: '#3E4452', pantalon: '#2E3340', zapato: '#1E1E22', objeto: 'libroAzul' },
    krupskaya: { id: 'krupskaya', piel: '#EDBF98', pelo: '#9A948C', iris: '#4A6A8A', estilo: 'chongo', ropa: '#4A4A55', pantalon: '#4A4A55', zapato: '#1E1A22', tunica: true, edad: true, objeto: 'cartilla' },
    pistrak: { id: 'pistrak', piel: '#E2AE84', pelo: '#2A2220', iris: '#4A3A2A', estilo: 'raya', ropa: '#5A4A3A', pantalon: '#3A3A44', zapato: '#2A2420', objeto: 'martillo' },
    colono: { id: 'colono', piel: '#E8B48C', pelo: '#6E4A2A', iris: '#4A3A2A', estilo: 'gorra', ropa: '#D9C9A0', pantalon: '#4A4A55', zapato: '#3A2A20', boca: 'abierta' },
    freinet: { id: 'freinet', piel: '#E2AE84', pelo: '#2A2220', iris: '#4A3A2A', estilo: 'boina', ropa: '#7A5A3A', pantalon: '#3E3A44', zapato: '#2A2420', objeto: 'periodico' }
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
    if (P.estilo === 'chongo') { el(c, 16, 15, 8, 7.5); F(c, Rg(c, 16, 15, 10, [sh(P.pelo, .35), P.pelo, sh(P.pelo, -.3)], 13, 12), 1.4); c.strokeStyle = sh(P.pelo, .25); c.lineWidth = 0.8; c.beginPath(); c.arc(16, 15, 4.5, 3.6, 5.6); c.stroke(); }
    if (P.estilo === 'calvo' || P.estilo === 'boina' || P.estilo === 'gorra' || P.estilo === 'corto') { el(c, 17.5, 27, 4.5, 7); F(c, vol(c, P.pelo, 13, 20, 9, 14), 1.2); }
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
    else if (P.estilo === 'chongo') {
      c.beginPath(); c.ellipse(33, 25, 17.6, 16.4, 0, Math.PI * 1.0, Math.PI * 1.98); c.quadraticCurveTo(46, 17, 39, 15.5); c.quadraticCurveTo(35, 17.5, 33, 15.5); c.quadraticCurveTo(25, 16, 20, 21); c.quadraticCurveTo(16.5, 26, 16.5, 33); c.lineTo(15.4, 29); c.closePath(); F(c, fill, 1.5);
      linea(c, [33, 15.5, 31.5, 10], sh(P.pelo, -.4), 1); brillo(c, 27, 12, 5.5, 1.6, .3, -.3); brillo(c, 41, 13, 3.5, 1.2, .25, .3);
    } else if (P.estilo === 'raya') {
      c.beginPath(); c.ellipse(33, 24.5, 17.3, 15.5, 0, Math.PI * 1.0, Math.PI * 1.97); c.quadraticCurveTo(46, 16.5, 37, 16); c.quadraticCurveTo(27, 16.5, 21, 21.5); c.quadraticCurveTo(17, 26, 16.5, 32); c.lineTo(15.6, 28); c.closePath(); F(c, fill, 1.5);
      linea(c, [27, 11, 24, 19], sh(P.pelo, -.35), 1); brillo(c, 35, 11.5, 6, 1.6, .3, -.15);
    } else if (P.estilo === 'calvo') {
      brillo(c, 30, 14.5, 7, 3, .35, -.2);
      c.beginPath(); c.moveTo(16.5, 23); c.quadraticCurveTo(15, 31, 18.5, 37); c.lineTo(21, 30); c.quadraticCurveTo(19.5, 26, 16.5, 23); c.closePath(); F(c, fill, 1.1);
      c.beginPath(); c.moveTo(49.3, 22); c.quadraticCurveTo(50.5, 26, 48.5, 30); c.lineTo(47.5, 25); c.closePath(); F(c, fill, 1);
    } else if (P.estilo === 'corto') {
      c.beginPath(); c.ellipse(33, 24.5, 17.2, 15.2, 0, Math.PI * 1.0, Math.PI * 1.97); [[49, 23], [46, 19], [41, 18.5], [36, 17], [31, 18.5], [26, 18], [21, 22], [17, 28], [16, 31]].forEach(p => c.lineTo(p[0], p[1])); c.closePath(); F(c, fill, 1.5); brillo(c, 30, 12, 6, 1.6, .3, -.2);
    } else if (P.estilo === 'atras') {
      c.beginPath(); c.ellipse(33, 24.5, 17.4, 15.6, 0, Math.PI * 1.0, Math.PI * 1.97); c.quadraticCurveTo(46, 15.5, 34, 14.2); c.quadraticCurveTo(23, 15, 18, 24); c.lineTo(16, 31); c.closePath(); F(c, fill, 1.5);
      c.strokeStyle = sh(P.pelo, .3); c.lineWidth = 0.7; [[22, 15], [28, 12.5], [34, 11.5]].forEach(([a, b]) => { c.beginPath(); c.moveTo(a + 12, b + 2); c.quadraticCurveTo(a + 4, b - 1, a - 4, b + 4); c.stroke(); });
    } else if (P.estilo === 'gorra') {
      c.beginPath(); c.ellipse(33, 24.5, 17.2, 15, 0, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(46, 22); c.lineTo(20, 24); c.lineTo(16.5, 32); c.closePath(); F(c, fill, 1.3);
      el(c, 32, 15, 18.5, 7.5, -0.05); F(c, Rg(c, 30, 12, 20, ['#8A8F99', '#5A5F6A', '#3A3E48'], 26, 10), 1.5);
      c.beginPath(); c.moveTo(38, 19.5); c.quadraticCurveTo(50, 18.5, 55, 22); c.quadraticCurveTo(49, 24.5, 38, 22.5); c.closePath(); F(c, L(c, 38, 18, 55, 24, ['#5A5F6A', '#2E323A']), 1.3);
      el(c, 32, 9, 2, 1.4); c.fillStyle = '#3A3E48'; c.fill(); brillo(c, 26, 12, 5, 1.4, .25, -.15);
    } else if (P.estilo === 'boina') {
      c.beginPath(); c.ellipse(33, 24.5, 17.4, 15.5, 0, Math.PI * 1.0, Math.PI * 1.97); c.quadraticCurveTo(44, 19, 34, 19.5); c.quadraticCurveTo(24, 20, 17, 30); c.closePath(); F(c, fill, 1.4);
      el(c, 32, 13.5, 19.5, 6.5, -0.12); F(c, Rg(c, 30, 11, 20, ['#4A5A80', '#2A3550', '#161D30'], 26, 9), 1.5);
      rr(c, 30.5, 6.3, 3, 3.5, 1.2); F(c, '#2A3550', 1); brillo(c, 26, 11.5, 6, 1.6, .25, -.15);
    }
    if (P.bigote) { c.beginPath(); c.moveTo(34, 36.2); c.quadraticCurveTo(38.5, 33.6, 43.5, 36.2); c.quadraticCurveTo(39, 38.2, 34, 36.2); c.closePath(); F(c, L(c, 34, 34, 34, 38, [sh(P.pelo, .15), sh(P.pelo, -.2)]), 1); }
    if (P.candado) {
      c.beginPath(); c.moveTo(33.5, 36); c.quadraticCurveTo(38.5, 33.4, 44, 36); c.quadraticCurveTo(45, 41, 41.5, 45.5); c.quadraticCurveTo(38.5, 48, 35.5, 45.5); c.quadraticCurveTo(32.5, 41, 33.5, 36); c.closePath();
      F(c, Rg(c, 38.5, 41, 8, [sh(P.pelo, .25), P.pelo, sh(P.pelo, -.25)], 37, 38), 1.2);
      c.beginPath(); c.moveTo(36, 39.2); c.quadraticCurveTo(38.6, 40.6, 41.4, 39); c.lineWidth = 1.2; c.strokeStyle = '#8E4A3A'; c.stroke();
    }
    if (P.lentes) {
      c.lineWidth = 1.1; c.strokeStyle = '#2A2420'; c.beginPath(); c.arc(31, 29, 4.9, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(41.5, 29, 4.4, 0, Math.PI * 2); c.stroke();
      linea(c, [35.9, 28.4, 37.1, 28.4], '#2A2420', 1.1); linea(c, [26.1, 28.2, 19, 27.4], '#2A2420', 1.1); brillo(c, 29.4, 27.2, 1.2, 0.7, .6, -.5); brillo(c, 40.2, 27.2, 1.1, 0.6, .6, -.5);
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
    else if (!P.candado) { c.beginPath(); c.moveTo(35.5, 38.2); c.quadraticCurveTo(38.5, 40.5, 41.6, 38); c.lineWidth = 1.3; c.strokeStyle = sh(s, -.55); c.stroke(); }
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
    if (P.id === 'montessori') {
      for (let i = 0; i < 7; i++) { el(c, 22.5 + i * 3.2, 45.5 + Math.sin(i / 6 * Math.PI) * 1.6, 2, 1.7); F(c, '#FBF8F2', 0.7); }
      el(c, 32, 49, 2.3, 2.7); F(c, Rg(c, 32, 49, 3, ['#FFF1A6', '#E3B23C', '#9C7417'], 31, 48), 0.9);
      linea(c, [32, 54, 32, 86], 'rgba(0,0,0,.28)', 1); [58, 64, 70].forEach(y => { el(c, 32, y, 0.9, 0.9); c.fillStyle = '#6E5E78'; c.fill(); });
    }
    if (P.id === 'dewey' || P.id === 'decroly') {
      c.beginPath(); c.moveTo(27, 45); c.lineTo(37, 45); c.lineTo(32, 57); c.closePath(); F(c, '#F6F3EC', 1);
      if (P.id === 'dewey') { c.beginPath(); c.moveTo(32, 47); c.lineTo(30.6, 49); c.lineTo(31.4, 58); c.lineTo(32.6, 58); c.lineTo(33.4, 49); c.closePath(); F(c, '#8A2E2E', 0.8); }
      else {
        c.beginPath(); c.moveTo(32, 47.5); c.lineTo(29, 45.6); c.lineTo(29, 49.4); c.closePath(); F(c, '#1E1E22', 0.8);
        c.beginPath(); c.moveTo(32, 47.5); c.lineTo(35, 45.6); c.lineTo(35, 49.4); c.closePath(); F(c, '#1E1E22', 0.8); rr(c, 38.5, 52, 4.5, 5, 1); F(c, '#9CCBF0', 0.8);
      }
      linea(c, [26.5, 45.5, 25, 63], sh(r, -.4), 1); linea(c, [37.5, 45.5, 39, 63], sh(r, -.4), 1);
    }
    if (P.id === 'freinet') {
      c.beginPath(); c.moveTo(27, 45); c.lineTo(37, 45); c.lineTo(32, 54); c.closePath(); F(c, '#BFD6EA', 1);
      c.strokeStyle = 'rgba(60,40,20,.35)'; c.lineWidth = 0.7; for (let x = 21; x < 45; x += 2.4) { c.beginPath(); c.moveTo(x, 56); c.lineTo(x, 68); c.stroke(); }
      rr(c, 22, 58, 7, 5, 1.5); F(c, sh(r, -.12), 0.8); rr(c, 35, 58, 7, 5, 1.5); F(c, sh(r, -.12), 0.8);
    }
    if (P.id === 'makarenko') {
      rr(c, 27, 44, 10, 4, 1.5); F(c, sh(r, -.2), 1); linea(c, [32, 48, 32, 62], 'rgba(0,0,0,.35)', 1); [51, 56].forEach(y => { el(c, 32, y, 0.9, 0.9); c.fillStyle = '#C9A13A'; c.fill(); });
      rr(c, 24, 49, 6, 5, 1); F(c, sh(r, -.12), 0.8); rr(c, 34, 49, 6, 5, 1); F(c, sh(r, -.12), 0.8);
      rr(c, 18, 61, 28, 3.4, 1); F(c, '#4A2E16', 1); rr(c, 30, 60.5, 4.5, 4.4, 0.8); F(c, '#D9B44A', 0.8);
      linea(c, [20, 45, 44, 61], '#4A2E16', 1.8);
    }
    if (P.id === 'vygotsky' || P.id === 'pistrak') {
      c.beginPath(); c.moveTo(27, 45); c.lineTo(37, 45); c.lineTo(32, 56); c.closePath(); F(c, P.id === 'pistrak' ? '#C9D4E0' : '#F6F3EC', 1);
      if (P.id === 'vygotsky') { c.beginPath(); c.moveTo(32, 47); c.lineTo(30.8, 49); c.lineTo(31.4, 57); c.lineTo(32.6, 57); c.lineTo(33.2, 49); c.closePath(); F(c, '#2E4A6E', 0.8); }
      linea(c, [26.5, 45.5, 25, 63], sh(r, -.4), 1); linea(c, [37.5, 45.5, 39, 63], sh(r, -.4), 1);
    }
    if (P.id === 'krupskaya') { c.beginPath(); c.moveTo(25, 45); c.quadraticCurveTo(32, 50, 39, 45); c.lineTo(37, 44); c.quadraticCurveTo(32, 47.5, 27, 44); c.closePath(); F(c, '#F4F1EA', 0.9); linea(c, [32, 50, 32, 86], 'rgba(0,0,0,.25)', 1); }
    if (P.id === 'colono') { c.beginPath(); c.moveTo(28, 45); c.lineTo(36, 45); c.lineTo(32, 51); c.closePath(); F(c, sh(r, -.12), 0.9); rr(c, 18, 61, 28, 2.6, 1); F(c, '#8A6A3A', 0.8); [50, 55].forEach(y => { el(c, 32, y, 0.8, 0.8); c.fillStyle = '#6E5A3A'; c.fill(); }); }
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
    if (tipo === 'poema' || tipo === 'libroAzul') { c.save(); c.translate(x, y); c.rotate(-0.15); rr(c, -4, -11, 14, 17, 1.8); F(c, L(c, -4, -11, 10, 6, tipo === 'poema' ? ['#C0503A', '#9E3A2A', '#6E2418'] : ['#4A7AC8', '#2E5A9E', '#1E3A6E']), 1.3); rr(c, 8.5, -10, 2.6, 15, 1); F(c, '#F3EAD2', 0.8); c.fillStyle = '#E8C25A'; c.fillRect(-1.5, -7, 9, 1.2); c.fillRect(-1.5, -4.5, 7, 1); c.restore(); }
    if (tipo === 'cartilla') { c.save(); c.translate(x, y); c.rotate(-0.1); rr(c, -4, -14, 15, 17, 1); F(c, L(c, -4, -14, 11, 3, ['#FBF6EA', '#E6DCC6']), 1.1); c.font = '800 6px Rubik, Arial'; c.fillStyle = '#8E2620'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('А Б В', 3.5, -9); c.fillStyle = 'rgba(42,36,32,.45)'; for (let i = 0; i < 3; i++) c.fillRect(-2, -5 + i * 2.6, 11, 0.8); c.restore(); }
    if (tipo === 'cubo') cuboRosa(c, x - 2, y - 12, 11);
    if (tipo === 'martillo') { c.save(); c.translate(x, y); c.rotate(-0.5); rr(c, -1.6, -18, 3.2, 20, 1.4); F(c, L(c, -2, 0, 2, 0, ['#E0B07A', '#B9844C']), 1.1); rr(c, -6, -22, 12, 5, 1.5); F(c, L(c, 0, -22, 0, -17, ['#C9D2DE', '#7A8494']), 1.1); c.restore(); }
    if (tipo === 'lupa') { c.save(); c.translate(x, y); c.rotate(-0.6); rr(c, -1.6, -6, 3.2, 9, 1.4); F(c, '#2A2420', 1); el(c, 0, -12, 6, 6); F(c, Rg(c, -1.5, -13.5, 7, ['rgba(230,245,255,.95)', 'rgba(160,205,240,.75)']), 1.6, '#B9843A'); brillo(c, -2, -14, 1.8, 1, .8, -.5); c.restore(); }
    if (tipo === 'periodico') { c.save(); c.translate(x, y); c.rotate(-0.12); rr(c, -4, -16, 15, 19, 1); F(c, L(c, -4, -16, 11, 3, ['#FBF6EA', '#E6DCC6']), 1.1); c.fillStyle = '#2A2420'; c.fillRect(-2, -14, 11, 2.2); c.fillStyle = 'rgba(42,36,32,.45)'; for (let i = 0; i < 5; i++) c.fillRect(-2, -10 + i * 2.4, (i % 2 ? 9 : 11), 0.8); c.restore(); }
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

  // ================= Mundo 3: Colonia Gorki (Ucrania, 1920) =================
  const reduce = false;
function rodadora(c,rot){
  el(c,24,46,15,2.6); c.fillStyle='rgba(20,30,50,.22)'; c.fill();
  c.save(); c.translate(24,26); c.rotate(rot);
  el(c,0,0,20,19); F(c,Rg(c,0,0,21,['rgba(240,214,160,.95)','rgba(201,165,106,.95)','rgba(142,106,58,.95)'],-6,-6),1.6);
  c.lineCap='round';
  for(let i=0;i<14;i++){ const a=i*0.9; c.beginPath(); c.moveTo(Math.cos(a)*18,Math.sin(a)*17); c.quadraticCurveTo(Math.cos(a+1.7)*5,Math.sin(a+1.7)*5,Math.cos(a+2.6)*17,Math.sin(a+2.6)*16); c.strokeStyle=i%2?'#7A5A30':'#A07A44'; c.lineWidth=1.1; c.stroke(); }
  for(let i=0;i<8;i++){ const a=i*0.785+0.3; linea(c,[Math.cos(a)*18,Math.sin(a)*17,Math.cos(a)*23,Math.sin(a)*22],'#7A5A30',1); }
  c.restore();
  el(c,17,22,3.4,4); F(c,'#FFFFFF',1.1); el(c,29,22,3.4,4); F(c,'#FFFFFF',1.1);
  el(c,16.2,23,1.7,2.1); c.fillStyle='#14171F'; c.fill(); el(c,28.2,23,1.7,2.1); c.fill();
  linea(c,[12.5,16.5,20,19],OUT,2); linea(c,[33.5,16.5,26,19],OUT,2);
  c.beginPath(); c.moveTo(17,32); c.lineTo(20,30); c.lineTo(23,32); c.lineTo(26,30); c.lineTo(29,32); c.lineWidth=1.4; c.strokeStyle=OUT; c.stroke();
}
function cuervo(c,ala){
  c.beginPath(); c.moveTo(40,30); c.lineTo(58,26); c.lineTo(56,32); c.lineTo(58,38); c.lineTo(40,36); c.closePath(); F(c,L(c,40,26,58,38,['#3A4258','#151A26']),1.3);
  el(c,32,32,15,10,0.1); F(c,Rg(c,32,32,17,['#4E5A78','#22283A','#0E121C'],27,27),1.5);
  el(c,18,23,9,8.5); F(c,Rg(c,18,23,10,['#56628A','#22283A','#0E121C'],15,19),1.5);
  c.beginPath(); c.moveTo(11,21); c.lineTo(1,24.5); c.lineTo(11,27.5); c.closePath(); F(c,L(c,1,21,11,28,['#C9C2B0','#7A7466']),1.2);
  linea(c,[2,24.5,-6,30],'#B9861A',1.4); [[-1,26],[-3.5,27.6],[-6,29.2]].forEach(([a,b])=>{ el(c,a,b,1.8,1.1,0.6); F(c,'#F2C14A',0.6); });
  el(c,16.5,21,3,3); F(c,'#FFFFFF',1); el(c,15.8,21.4,1.5,1.6); c.fillStyle='#14171F'; c.fill();
  linea(c,[12.5,17.6,19.5,18.6],OUT,1.6);
  c.save(); c.translate(33,26); c.rotate(-0.6+ala); c.beginPath(); c.moveTo(-6,0); c.quadraticCurveTo(10,-12,24,-14); c.lineTo(20,-8); c.lineTo(23,-5); c.quadraticCurveTo(10,2,-2,6); c.closePath(); F(c,L(c,-6,-14,24,6,['#56628A','#22283A','#0E121C']),1.3); c.restore();
  brillo(c,28,27,6,1.6,.25,-.2);
  linea(c,[30,41,29,46],'#5A5040',1.6); linea(c,[35,41,36,46],'#5A5040',1.6);
}
function espantapajaros(c){
  el(c,26,70,13,2.4); c.fillStyle='rgba(20,30,50,.22)'; c.fill();
  rr(c,24,30,5,40,1.5); F(c,L(c,24,0,29,0,['#B98450','#7A5230']),1.2);
  rr(c,3,35,46,5,2); F(c,L(c,0,35,0,40,['#B98450','#7A5230']),1.2);
  [[1,38,-1],[51,38,1]].forEach(([x,y,d])=>{ for(let k=0;k<4;k++) linea(c,[x,y,x+d*(4+k),y-3+k*2.4],'#E8C35A',1.2); });
  c.beginPath(); c.moveTo(9,33); c.lineTo(44,33); c.lineTo(41,58); c.lineTo(12,58); c.closePath(); F(c,L(c,9,33,44,58,['#E0584A','#C0392B','#8E2620']),1.4);
  c.save(); c.clip(); c.strokeStyle='rgba(40,10,10,.35)'; c.lineWidth=1.4; for(let x=12;x<44;x+=6){ c.beginPath(); c.moveTo(x,33); c.lineTo(x,58); c.stroke(); } for(let y=37;y<58;y+=6){ c.beginPath(); c.moveTo(9,y); c.lineTo(44,y); c.stroke(); } c.restore();
  rr(c,30,44,8,7,1); F(c,'#4A6FA5',0.9);
  el(c,26.5,22,12,11.5); F(c,Rg(c,26.5,22,13,['#EED7AE','#D9B98A','#A88456'],22,17),1.5);
  c.strokeStyle='rgba(90,60,30,.4)'; c.lineWidth=0.7; for(let i=0;i<4;i++){ c.beginPath(); c.moveTo(16+i*6,12); c.lineTo(17+i*6,32); c.stroke(); }
  el(c,22,21,2.6,2.6); F(c,'#1E1E26',1); el(c,31,21,2.6,2.6); F(c,'#1E1E26',1);
  [[20.5,19.5,23.5,22.5],[23.5,19.5,20.5,22.5]].forEach(p=>linea(c,p,'#F2F2F2',0.6));
  c.beginPath(); c.moveTo(20,28.5); c.lineTo(33,28.5); c.lineWidth=1.3; c.strokeStyle=OUT; c.stroke(); for(let x=21;x<33;x+=2.6) linea(c,[x,27,x,30],OUT,0.9);
  for(let k=0;k<6;k++) linea(c,[18+k*3,32,17+k*3.2,36],'#E8C35A',1.1);
  el(c,26.5,12,20,4); F(c,L(c,6,8,46,16,['#F2D27A','#D9B04A','#A88430']),1.3);
  c.beginPath(); c.moveTo(17,12); c.quadraticCurveTo(18,2,26.5,2); c.quadraticCurveTo(35,2,36,12); c.closePath(); F(c,L(c,17,2,36,12,['#F2D27A','#C99A3A']),1.3);
  rr(c,17.5,8.5,18.5,2.5,1); F(c,'#8E2620',0.6);
}
// ---------- bloques (32 × 32) ----------
function troncoPreg(c,x,y,usado){
  el(c,x+16,y+16,15.5,15.5); F(c,Rg(c,x+16,y+16,16,['#7A5230','#5A3A20','#3A2412']),1.6);
  el(c,x+16,y+16,12.6,12.6); F(c,Rg(c,x+15,y+14,13,usado?['#D9B07A','#B98450','#8A5A2E']:['#F8E2B8','#E6BA80','#C98E55'],x+12,y+11),1);
  c.strokeStyle='rgba(120,70,30,.35)'; c.lineWidth=0.7; [10,7.5,5].forEach(r=>{ c.beginPath(); c.arc(x+16,y+16,r,0,Math.PI*2); c.stroke(); });
  linea(c,[x+16,y+4,x+18,y+11],'rgba(80,40,15,.55)',0.9);
  if(usado){ linea(c,[x+8,y+22,x+24,y+9],'rgba(60,30,10,.7)',1.6); linea(c,[x+10,y+24,x+26,y+11],'rgba(255,240,210,.5)',0.8); return; }
  el(c,x+16,y+16,7.8,7.8); F(c,Rg(c,x+16,y+16,9,['#3767B3','#1F3864','#132648'],x+14,y+13),1.3);
  c.font='800 12px Rubik, Arial'; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#FFE58A'; c.fillText('?',x+16,y+16.8);
  brillo(c,x+9,y+8,4,1.4,.5,-.6);
}
function paca(c,x,y){
  rr(c,x+1,y+1,30,30,3); F(c,L(c,x,y,x+32,y+32,['#F6DA88','#DDB54E','#B08A2E']),1.5);
  c.strokeStyle='rgba(150,110,30,.55)'; c.lineWidth=0.7;
  for(let i=0;i<16;i++){ const yy=y+3+((i*7)%27), xx=x+2+((i*11)%22); c.beginPath(); c.moveTo(xx,yy); c.lineTo(xx+6,yy+((i%3)-1)*1.5); c.stroke(); }
  c.strokeStyle='rgba(255,245,200,.6)'; for(let i=0;i<8;i++){ const yy=y+5+((i*9)%22), xx=x+4+((i*13)%20); c.beginPath(); c.moveTo(xx,yy); c.lineTo(xx+5,yy-1); c.stroke(); }
  [9,23].forEach(d=>{ rr(c,x+d-1,y+1,2.6,30,1); F(c,'#8A5A2E',0.6); });
}
function lena(c,x,y){
  rr(c,x,y,32,32,2); F(c,'#4A3020',1.4);
  [[7,8],[16,7],[25,8],[11.5,16.5],[20.5,16.5],[7,25],[16,25],[25,25]].forEach(([a,b],i)=>{ const r=4.8+(i%3)*0.4; el(c,x+a,y+b,r,r); F(c,'#6E4A2A',0.9); el(c,x+a,y+b,r-1.4,r-1.4); c.fillStyle=Rg(c,x+a,y+b,r,['#F0D3A0','#C9945A'],x+a-1,y+b-1); c.fill(); c.beginPath(); c.arc(x+a,y+b,r*0.45,0,Math.PI*2); c.strokeStyle='rgba(120,70,30,.4)'; c.lineWidth=0.5; c.stroke(); });
}
function tablones(c,x,y,w,postes){
  if(postes!==false){ [x+5,x+w-11].forEach(px=>{ rr(c,px,y+6,6,46,1.5); F(c,L(c,px,0,px+6,0,['#9A6E44','#5E3E22']),1.2); }); }
  rr(c,x,y,w,8,1.5); F(c,L(c,0,y,0,y+8,['#E6B87A','#C08A50','#8E5E30']),1.4);
  for(let k=16;k<w;k+=16) linea(c,[x+k,y+0.8,x+k,y+7.2],'rgba(70,40,15,.6)',1);
  for(let k=4;k<w-2;k+=16){ el(c,x+k,y+4,0.8,0.8); c.fillStyle='#3A3A3A'; c.fill(); if(k+8<w-2){ el(c,x+k+8,y+4,0.8,0.8); c.fill(); } }
  linea(c,[x+1,y+1.2,x+w-1,y+1.2],'rgba(255,255,255,.35)',0.8);
}
function balsa(c,x,y,w){
  [[0,'#A07448'],[7,'#8A6038']].forEach(([dy,col])=>{ rr(c,x,y+dy,w,8,4); F(c,L(c,0,y+dy,0,y+dy+8,[sh(col,.3),col,sh(col,-.35)]),1.2); el(c,x+w-2,y+dy+4,3,4); F(c,'#E6C08A',0.9); });
  [x+8,x+w/2,x+w-10].forEach(rx=>{ linea(c,[rx,y-0.5,rx,y+15.5],'#D9C49A',2.2); linea(c,[rx+1.6,y-0.5,rx+1.6,y+15.5],'#B9A27A',1); });
  brillo(c,x+w/2,y+2,w/2-6,0.9,.3,0);
}
function camino(c,x0,x1,y,h){
  h=h||64;
  c.fillStyle=L(c,0,y,0,y+h,['#9A7448','#7A5A36','#4E3820']); c.fillRect(x0,y,x1-x0,h);
  for(let x=Math.floor(x0/16)*16;x<x1;x+=16){ for(let k=0;k<2;k++){ const px=x+((x*7+k*11)%14)+1, py=y+14+((x*3+k*13)%(h-18)); if(px<x0||px>x1) continue; el(c,px,py,2.2+k*0.5,1.6); c.fillStyle='rgba(60,40,20,.45)'; c.fill(); } }
  c.beginPath(); c.moveTo(x0,y); c.lineTo(x1,y); c.lineTo(x1,y+5); for(let x=x1;x>=x0;x-=5) c.lineTo(x,y+(((x/5)|0)%2?5:7.5)); c.closePath(); c.fillStyle=L(c,0,y,0,y+8,['#A6D877','#6FAE48','#4E8A34']); c.fill();
  c.fillStyle='rgba(255,255,255,.25)'; c.fillRect(x0,y,x1-x0,1.4);
  for(let x=x0+3;x<x1-2;x+=7){ if(((x/7)|0)%4===1){ linea(c,[x,y+0.5,x+1,y-11],'#C99A3A',1); el(c,x+1.3,y-12.5,1.3,2.8,0.15); c.fillStyle='#E8C35A'; c.fill(); } else { const hh=2.5+((x*13)%3); c.beginPath(); c.moveTo(x-1.2,y+0.5); c.lineTo(x+0.3,y-hh); c.lineTo(x+1.4,y+0.5); c.closePath(); c.fillStyle='#5E9E42'; c.fill(); } }
}
function agua(c,x0,x1,y,t,h){
  h=h||70;
  c.fillStyle=L(c,0,y,0,y+h,['#7FC0E8','#3E86BE','#1E4A6E']); c.fillRect(x0,y,x1-x0,h);
  const o=reduce?0:t*0.002;
  c.beginPath(); c.moveTo(x0,y+2); for(let x=x0;x<=x1;x+=4) c.lineTo(x,y+2+Math.sin(x*0.09+o*2)*1.6); c.lineTo(x1,y-2); c.lineTo(x0,y-2); c.closePath(); c.fillStyle='#BFE6F8'; c.fill();
  for(let i=0;i<12;i++){ const sx=x0+((i*53+(reduce?0:t*0.015))%(x1-x0)), sy=y+8+(i%4)*10; linea(c,[sx,sy,sx+10,sy],'rgba(255,255,255,.45)',1); }
}
function letrero(c,x,y,txt){
  rr(c,x-2,y,4,46,1); F(c,L(c,x-2,0,x+2,0,['#B98450','#7A5230']),1.1);
  c.font='800 7px Rubik, Arial'; const w=c.measureText(txt).width+16;
  c.beginPath(); c.moveTo(x-6,y+4); c.lineTo(x+w-8,y+4); c.lineTo(x+w,y+11); c.lineTo(x+w-8,y+18); c.lineTo(x-6,y+18); c.closePath(); F(c,L(c,0,y+4,0,y+18,['#F0D3A0','#C9945A']),1.3);
  c.fillStyle='#4A2E16'; c.textAlign='left'; c.textBaseline='middle'; c.fillText(txt,x,y+11.5);
}
// ---------- paisaje ucraniano ----------
function cieloVerano(c){
  c.fillStyle=L(c,0,0,0,360,['#2F7FD0','#6FB2EA','#BFE2F6','#EAF6F2']); c.fillRect(0,0,640,360);
  el(c,540,40,120,120); c.fillStyle=Rg(c,540,40,120,['rgba(255,250,225,.9)','rgba(255,250,225,0)']); c.fill();
}
function cumulo(c,x,y,s){ c.save(); c.translate(x,y); c.scale(s,s); [[0,10,16],[18,-2,20],[40,4,17],[58,12,13],[28,12,18]].forEach(([a,b,r])=>{ el(c,a,b,r,r); c.fillStyle=Rg(c,a,b,r,['#FFFFFF','#FFFFFF','#D7E4EE'],a-r*0.3,b-r*0.5); c.fill(); }); c.fillStyle='rgba(180,200,215,.35)'; c.fillRect(-14,18,86,6); c.restore(); }
function estepa(c){
  c.beginPath(); c.moveTo(0,250); for(let x=0;x<=640;x+=16) c.lineTo(x,236+Math.sin(x*0.012)*8+Math.sin(x*0.031+1)*4); c.lineTo(640,300); c.lineTo(0,300); c.closePath(); c.fillStyle=L(c,0,226,0,300,['#A9C98A','#8DB46A']); c.fill();
  c.fillStyle=L(c,0,180,0,260,['rgba(234,246,242,0)','rgba(234,246,242,.55)']); c.fillRect(0,180,640,80);
}
function campoTrigo(c,x0,x1,y,h){
  c.fillStyle=L(c,0,y,0,y+h,['#F2D27A','#DDB54E','#C9962E']); c.fillRect(x0,y,x1-x0,h);
  for(let x=x0;x<x1;x+=3){ const hh=4+((x*7)%5); linea(c,[x,y+2,x+0.6,y-hh],((x/3)|0)%3?'#E8C35A':'#C99A3A',1); }
  for(let r=0;r<3;r++) for(let x=x0+((r*5)%9);x<x1;x+=9){ linea(c,[x,y+6+r*6,x+2,y+3+r*6],'rgba(160,110,30,.45)',0.8); }
}
function molino(c,x,y,s,rot){
  c.save(); c.translate(x,y); c.scale(s,s);
  c.beginPath(); c.moveTo(-9,0); c.lineTo(-6,-38); c.lineTo(6,-38); c.lineTo(9,0); c.closePath(); F(c,L(c,-9,0,9,0,['#B08458','#8A6038','#5E3E22']),1.3);
  c.beginPath(); c.moveTo(-9,-38); c.lineTo(0,-50); c.lineTo(9,-38); c.closePath(); F(c,L(c,-9,-50,9,-38,['#7A5A3A','#4A3020']),1.3);
  rr(c,-3,-14,6,10,1); F(c,'#3A2412',1);
  c.translate(0,-38); c.rotate(rot);
  for(let i=0;i<4;i++){ c.save(); c.rotate(i*Math.PI/2); rr(c,-1,0,2,30,1); F(c,'#5E3E22',0.8); rr(c,1,8,7,22,0.5); F(c,'rgba(240,226,190,.95)',0.8); linea(c,[1,14,8,14],'#8A6038',0.5); linea(c,[1,20,8,20],'#8A6038',0.5); linea(c,[1,26,8,26],'#8A6038',0.5); c.restore(); }
  el(c,0,0,2.6,2.6); F(c,'#3A2412',1);
  c.restore();
}
function abedul(c,x,y,h){
  rr(c,x-2.5,y-h,5,h,2); F(c,L(c,x-3,0,x+3,0,['#FFFFFF','#E8E6DE','#B9B6AA']),1);
  for(let i=0;i<6;i++){ const yy=y-h+8+i*(h-12)/6; c.fillStyle='#2A2A2A'; c.fillRect(x-2.5+((i*3)%3),yy,2+(i%2),1); }
  [[-8,-h+4,10],[6,-h+2,11],[0,-h-6,10],[-4,-h+12,8],[7,-h+12,8]].forEach(([a,b,r])=>{ el(c,x+a,y+b,r,r*0.85); c.fillStyle=Rg(c,x+a,y+b,r,['#C8E89A','#8BC660','#5E9E42'],x+a-3,y+b-3); c.fill(); });
}
function girasol(c,x,y,h,rot){
  linea(c,[x,y,x+1,y-h],'#4E8A34',2.2);
  [[-1,-h*0.45,-1],[1,-h*0.65,1]].forEach(([d,b,s])=>{ el(c,x+s*6,y+b,6,3,s*-0.5); F(c,L(c,x,y+b-3,x,y+b+3,['#8BC660','#4E8A34']),0.8); });
  c.save(); c.translate(x+1,y-h); c.rotate(rot||0);
  for(let i=0;i<14;i++){ c.save(); c.rotate(i*Math.PI/7); el(c,0,-9,2.6,5.4); c.fillStyle=i%2?'#F6C431':'#F2B01E'; c.fill(); c.lineWidth=0.6; c.strokeStyle='rgba(120,80,10,.7)'; c.stroke(); c.restore(); }
  el(c,0,0,5.8,5.8); F(c,Rg(c,0,0,6,['#8A5A2E','#5A3A1A','#3A2412']),1);
  c.fillStyle='rgba(30,15,5,.6)'; for(let i=0;i<9;i++){ el(c,Math.cos(i*2.4)*3,Math.sin(i*2.4)*3,0.6,0.6); c.fill(); }
  c.restore();
}
function jata(c,x,y,w,h){
  rr(c,x,y,w,h,2); F(c,L(c,x,y,x+w,y+h,['#FFFFFB','#F1F1EA','#D8D9CF']),1.3);
  c.fillStyle='rgba(120,90,60,.3)'; c.fillRect(x,y+h-6,w,6);
  [[x+w*0.2],[x+w*0.62]].forEach(([wx])=>{ rr(c,wx,y+h*0.32,w*0.18,h*0.32,1); F(c,L(c,0,y,0,y+h,['#5FA8D8','#2E6E9E']),1.4,'#2A5B8A'); linea(c,[wx+w*0.09,y+h*0.32,wx+w*0.09,y+h*0.64],'#F4F1EA',1); linea(c,[wx,y+h*0.48,wx+w*0.18,y+h*0.48],'#F4F1EA',1); rr(c,wx-2,y+h*0.3,w*0.18+4,2.4,1); F(c,'#3E86BE',0.6); });
  rr(c,x+w*0.43,y+h*0.42,w*0.13,h*0.58,1); F(c,L(c,0,y,0,y+h,['#8A6038','#5E3E22']),1.1);
  c.beginPath(); c.moveTo(x-10,y+4); c.quadraticCurveTo(x+w*0.1,y-h*0.55,x+w*0.5,y-h*0.62); c.quadraticCurveTo(x+w*0.9,y-h*0.55,x+w+10,y+4); c.quadraticCurveTo(x+w*0.5,y+10,x-10,y+4); c.closePath();
  F(c,L(c,0,y-h*0.6,0,y+8,['#E2BE6E','#C9A25A','#9A7838']),1.4);
  c.save(); c.clip(); c.strokeStyle='rgba(120,90,30,.45)'; c.lineWidth=0.7; for(let i=0;i<26;i++){ const xx=x-8+i*(w+16)/26; c.beginPath(); c.moveTo(xx,y-h*0.6); c.lineTo(xx+3,y+8); c.stroke(); } c.restore();
}
function taller(c,x,y,w,h,txt){
  c.beginPath(); c.moveTo(x-8,y+2); c.lineTo(x+w/2,y-h*0.42); c.lineTo(x+w+8,y+2); c.closePath(); F(c,L(c,0,y-h*0.42,0,y,['#6E4A2A','#4A3020']),1.4);
  rr(c,x,y,w,h,1); F(c,'#8A5E36',1.4);
  for(let k=0;k*8<h;k++){ rr(c,x+0.5,y+k*8,w-1,8,3.5); c.fillStyle=L(c,0,y+k*8,0,y+k*8+8,['#B98450','#9A6A3E','#6E4A2A']); c.fill(); c.lineWidth=0.6; c.strokeStyle='rgba(50,30,10,.55)'; c.stroke(); el(c,x+1.5,y+k*8+4,2.4,3.6); c.fillStyle='#E6C08A'; c.fill(); el(c,x+w-1.5,y+k*8+4,2.4,3.6); c.fill(); }
  [[x+w*0.18],[x+w*0.66]].forEach(([wx])=>{ rr(c,wx,y+h*0.3,w*0.16,h*0.3,1); F(c,L(c,0,y,0,y+h,['#FFE6B0','#E8B86A']),1.3); linea(c,[wx+w*0.08,y+h*0.3,wx+w*0.08,y+h*0.6],'#6E4A2A',1); });
  rr(c,x+w*0.42,y+h*0.45,w*0.16,h*0.55,1); F(c,L(c,0,y,0,y+h,['#6E4A2A','#3A2412']),1.2);
  if(txt){ c.font='800 6.4px Rubik, Arial'; const tw=c.measureText(txt).width+12; rr(c,x+w/2-tw/2,y-12,tw,11,1.5); F(c,L(c,0,y-12,0,y-1,['#F4ECDC','#D9CCB2']),1.1); c.fillStyle='#5A2E16'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,x+w/2,y-6.2); }
}
function humo(c,x,y,t){ for(let i=0;i<4;i++){ const k=((t*0.0008+i*0.25)%1); el(c,x+k*14,y-k*36,4+k*6,4+k*6); c.fillStyle=`rgba(235,235,235,${0.55*(1-k)})`; c.fill(); } }
function juncos(c,x,y){ for(let i=0;i<6;i++){ linea(c,[x+i*3,y,x+i*3+(i%2?2:-1),y-12-(i%3)*4],'#5E8A3A',1.2); } el(c,x+7,y-17,1.4,3.4); c.fillStyle='#6E4A2A'; c.fill(); }
function sauce(c,x,y){ linea(c,[x,y,x+2,y-34],'#6E5038',3); [[-14,-38,14],[0,-46,16],[14,-36,14]].forEach(([a,b,r])=>{ el(c,x+a,y+b,r,r*0.9); c.fillStyle=Rg(c,x+a,y+b,r,['#B4D98A','#7FAE58','#55823A'],x+a-3,y+b-4); c.fill(); }); c.strokeStyle='rgba(85,130,58,.85)'; c.lineWidth=1; for(let i=-20;i<=20;i+=4){ c.beginPath(); c.moveTo(x+i,y-34); c.quadraticCurveTo(x+i*1.1,y-18,x+i*1.15,y-6); c.stroke(); } }
function caminoTile(c, arriba, v) {
  c.fillStyle = arriba ? L(c, 0, 0, 0, 32, ['#9A7448', '#86643E']) : L(c, 0, 0, 0, 32, ['#7A5A36', '#5E442A']); c.fillRect(0, 0, 32, 32);
  for (let k = 0; k < 3; k++) { const px = 3 + ((v * 9 + k * 11) % 26), py = (arriba ? 12 : 3) + ((v * 5 + k * 7) % (arriba ? 16 : 26)); el(c, px, py, 2.2 + (k % 2) * 0.6, 1.6); c.fillStyle = 'rgba(60,40,20,.45)'; c.fill(); }
  if (arriba) {
    c.beginPath(); c.moveTo(0, 0); c.lineTo(32, 0); c.lineTo(32, 5); for (let x = 32; x >= 0; x -= 4) c.lineTo(x, ((x / 4) | 0) % 2 ? 5 : 7.5); c.closePath(); c.fillStyle = L(c, 0, 0, 0, 8, ['#A6D877', '#6FAE48', '#4E8A34']); c.fill();
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(0, 0, 32, 1.4);
    for (let x = 2 + v; x < 31; x += 6) { if ((x + v) % 3 === 0) { linea(c, [x, 0.5, x + 1, -11], '#C99A3A', 1); el(c, x + 1.3, -12.5, 1.3, 2.8, 0.15); c.fillStyle = '#E8C35A'; c.fill(); } else { c.beginPath(); c.moveTo(x - 1.2, 0.5); c.lineTo(x + 0.3, -3); c.lineTo(x + 1.4, 0.5); c.closePath(); c.fillStyle = '#5E9E42'; c.fill(); } }
  }
}
function aguaTile(c, arriba) {
  c.fillStyle = arriba ? L(c, 0, 0, 0, 32, ['#7FC0E8', '#3E86BE']) : L(c, 0, 0, 0, 32, ['#3E86BE', '#1E4A6E']); c.fillRect(0, 0, 32, 32);
  if (arriba) { c.beginPath(); c.moveTo(0, 3); for (let x = 0; x <= 32; x += 4) c.lineTo(x, 3 + Math.sin(x * 0.2) * 1.4); c.lineTo(32, 0); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#BFE6F8'; c.fill(); }
  [[4, 12], [18, 20], [8, 27]].forEach(([x, y]) => linea(c, [x, y, x + 9, y], 'rgba(255,255,255,.35)', 1));
}

  // ================= Mundo 2: Roma, 1907 =================
  function cuboRosa(c, x, y, s) {
    const d = s * 0.27;
    rr(c, x, y, s, s, 1.5); F(c, L(c, x, y, x + s, y + s, ['#FBD3DD', '#F09AB0', '#C9667F']), 1.2);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + d, y - d); c.lineTo(x + s + d, y - d); c.lineTo(x + s, y); c.closePath(); F(c, '#FCE0E7', 1);
    c.beginPath(); c.moveTo(x + s, y); c.lineTo(x + s + d, y - d); c.lineTo(x + s + d, y + s - d); c.lineTo(x + s, y + s); c.closePath(); F(c, '#D97A92', 1);
  }
  // Obstáculos (miran a la izquierda)
  function pupitre(c, ph) {
    el(c, 32, 54, 26, 3.2); c.fillStyle = 'rgba(20,30,50,.22)'; c.fill();
    const a = Math.sin(ph) * 3;
    [[14, a], [44, -a]].forEach(([x, d]) => {
      c.beginPath(); c.moveTo(x, 30); c.bezierCurveTo(x - 6, 38, x + 6, 44, x + d, 52); c.lineWidth = 4.2; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 2.2; c.strokeStyle = '#4A505C'; c.stroke();
      el(c, x + d, 52.5, 5, 2.2); F(c, '#2E333C', 1); el(c, x + 1, 40, 2.2, 2.2); F(c, Rg(c, x + 1, 40, 3, ['#D9DEE6', '#7A8494']), 0.8);
    });
    rr(c, 44, 30, 22, 5, 1.5); F(c, L(c, 44, 30, 44, 35, ['#C99A62', '#8E5E30']), 1.2); rr(c, 61, 12, 5, 20, 1.5); F(c, L(c, 61, 0, 66, 0, ['#C99A62', '#8E5E30']), 1.2);
    rr(c, 6, 14, 44, 18, 3); F(c, L(c, 6, 14, 40, 32, ['#D9A86A', '#B9824A', '#8A5A2E']), 1.5);
    c.beginPath(); c.moveTo(4, 14.5); c.lineTo(50, 7.5); c.lineTo(52, 11); c.lineTo(6, 18); c.closePath(); F(c, L(c, 4, 7, 4, 18, ['#EEC48A', '#C99A62']), 1.3);
    el(c, 42, 7, 3.4, 2.4); F(c, '#1E1E26', 1); brillo(c, 41, 6.2, 1, 0.5, .6, 0);
    el(c, 17, 21.5, 3.6, 4); F(c, '#FFFFFF', 1.1); el(c, 27, 21.5, 3.6, 4); F(c, '#FFFFFF', 1.1);
    el(c, 16.2, 22.5, 1.8, 2.2); c.fillStyle = '#14171F'; c.fill(); el(c, 26.2, 22.5, 1.8, 2.2); c.fill();
    linea(c, [12.5, 15.8, 20, 18.4], OUT, 2); linea(c, [31.5, 15.8, 24, 18.4], OUT, 2);
    c.beginPath(); c.moveTo(16, 29.5); c.quadraticCurveTo(22, 26, 28, 29.5); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
    brillo(c, 14, 16, 6, 1.2, .35, -.12);
  }
  function medalla(c, ala) {
    [[-1, '#2F6FD0'], [1, '#D64545']].forEach(([d, col]) => { c.save(); c.translate(32, 24); c.rotate(d * (0.55 + ala * 0.2)); rr(c, -4, -26, 8, 24, 1.5); F(c, L(c, -4, -26, 4, -2, [sh(col, .25), col, sh(col, -.25)]), 1.2); c.restore(); });
    [-1, 1].forEach(d => { c.save(); c.translate(32 + d * 13, 33); c.rotate(d * (0.4 + ala)); el(c, d * 8, -3, 9, 4.5, d * -0.3); F(c, Rg(c, d * 8, -3, 10, ['#FFFFFF', '#E8EEF6', '#B9C6D8']), 1.2); c.restore(); });
    el(c, 32, 36, 14, 14); F(c, Rg(c, 32, 36, 15, ['#FFF4B0', '#F2B632', '#B9831A'], 28, 31), 1.6);
    el(c, 32, 36, 10, 10); c.lineWidth = 1; c.strokeStyle = '#C99520'; c.stroke();
    c.beginPath(); c.moveTo(25.5, 32.5); c.quadraticCurveTo(28, 30.5, 30, 32.5); c.moveTo(34, 32.5); c.quadraticCurveTo(36, 30.5, 38.5, 32.5); c.lineWidth = 1.8; c.strokeStyle = OUT; c.stroke();
    linea(c, [25, 30, 29.5, 30.6], OUT, 1.4); linea(c, [34.5, 30.6, 39, 30], OUT, 1.4);
    c.beginPath(); c.moveTo(27.5, 39.5); c.quadraticCurveTo(32, 43.5, 37, 38.5); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
    brillo(c, 26.5, 30, 4, 2, .6, -.5);
  }
  function reloj(c, sonando) {
    el(c, 24, 57, 15, 2.6); c.fillStyle = 'rgba(20,30,50,.22)'; c.fill();
    linea(c, [15, 44, 11, 55], OUT, 3.4); linea(c, [33, 44, 37, 55], OUT, 3.4); el(c, 10, 55.5, 4, 2); F(c, '#2E333C', 1); el(c, 38, 55.5, 4, 2); F(c, '#2E333C', 1);
    const v = sonando ? 1.5 : -1.5;
    [[12, v], [36, -v]].forEach(([x, d]) => { c.beginPath(); c.arc(x + d, 10, 6.5, Math.PI, 0); c.closePath(); F(c, L(c, x - 6, 4, x + 6, 10, ['#FFF1A6', '#E3B23C', '#9C7417']), 1.3); });
    linea(c, [24, 4, 24, 11], OUT, 2); el(c, 24, 3.5, 2.2, 2.2); F(c, '#E3B23C', 1);
    el(c, 24, 30, 18, 18); F(c, Rg(c, 24, 30, 20, ['#FF8A80', '#D64545', '#8E2020'], 18, 22), 1.7);
    el(c, 24, 30, 13.5, 13.5); F(c, Rg(c, 24, 30, 14, ['#FFFFFF', '#F3F0E8']), 1.2);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r2 = i % 3 ? 12 : 10; linea(c, [24 + Math.cos(a) * 11, 30 + Math.sin(a) * 11, 24 + Math.cos(a) * r2, 30 + Math.sin(a) * r2], '#5A5A62', i % 3 ? 0.8 : 1.4); }
    el(c, 19.5, 28, 2.8, 3.2); F(c, '#FFFFFF', 1); el(c, 28.5, 28, 2.8, 3.2); F(c, '#FFFFFF', 1);
    el(c, 19, 28.8, 1.4, 1.8); c.fillStyle = '#14171F'; c.fill(); el(c, 28, 28.8, 1.4, 1.8); c.fill();
    linea(c, [15.5, 23.5, 21.5, 25.5], OUT, 1.8); linea(c, [32.5, 23.5, 26.5, 25.5], OUT, 1.8);
    linea(c, [24, 32, 24, 38.5], '#8E2020', 1.4); linea(c, [24, 32, 29, 35], '#1E1E26', 1.2);
    c.beginPath(); c.moveTo(19.5, 36.5); c.quadraticCurveTo(22, 35, 23, 36.5); c.lineWidth = 1.3; c.strokeStyle = OUT; c.stroke();
    brillo(c, 13, 22, 4, 2, .45, -.6);
    if (sonando) [[2, 6], [44, 6], [0, 16], [47, 16]].forEach(([x, y]) => linea(c, [x, y, x + (x < 24 ? -4 : 4), y - 2], '#C0392B', 1.4));
  }
  // Bloques (32 × 32)
  function vetas(c, x, y, w, h, col) { c.strokeStyle = col; c.lineWidth = 0.6; for (let i = 0; i < 4; i++) { const yy = y + 4 + i * (h - 8) / 3; c.beginPath(); c.moveTo(x + 2, yy); c.bezierCurveTo(x + w * 0.3, yy - 2, x + w * 0.6, yy + 2, x + w - 2, yy - 1); c.stroke(); } }
  function caja(c, x, y) {
    rr(c, x + 1, y + 1, 30, 30, 3); F(c, L(c, x, y, x + 32, y + 32, ['#F8E2B8', '#E6BA80', '#BB8650']), 1.6);
    vetas(c, x + 1, y + 1, 30, 30, 'rgba(140,90,40,.28)');
    rr(c, x + 4, y + 4, 24, 24, 2); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.1; c.stroke();
    [[3, 3], [25, 3], [3, 25], [25, 25]].forEach(([a, b]) => { rr(c, x + a, y + b, 4, 4, 1); F(c, L(c, 0, y + b, 0, y + b + 4, ['#F6D77A', '#B88A22']), 0.7); });
    el(c, x + 16, y + 16, 8.5, 8.5); F(c, Rg(c, x + 16, y + 16, 9.5, ['#3767B3', '#1F3864', '#132648'], x + 14, y + 13), 1.3);
    c.font = '800 13px Rubik, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFE58A'; c.fillText('?', x + 16, y + 16.8);
    brillo(c, x + 9, y + 5.5, 5, 1.4, .55, -.25);
  }
  function cajaUsada(c, x, y) {
    rr(c, x + 1, y + 1, 30, 30, 3); F(c, L(c, x, y, x + 32, y + 32, ['#C99A62', '#A57A44', '#6E4C26']), 1.6);
    vetas(c, x + 1, y + 1, 30, 30, 'rgba(60,35,15,.25)'); linea(c, [x + 3, y + 10, x + 29, y + 10], 'rgba(40,20,10,.45)', 1);
    el(c, x + 16, y + 19, 3, 3); F(c, Rg(c, x + 16, y + 19, 3.5, ['#F6D77A', '#B88A22'], x + 15, y + 18), 1);
  }
  function fruta(c, x, y) {
    rr(c, x + 1, y + 1, 30, 30, 2); F(c, L(c, x, y, x, y + 32, ['#D9AE74', '#B98450', '#8A5A2E']), 1.5);
    [11, 21].forEach(d => linea(c, [x + 2, y + d, x + 30, y + d], 'rgba(60,30,10,.55)', 1.4));
    c.font = '800 5.5px Rubik, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(90,40,20,.75)'; c.fillText('ROMA', x + 16, y + 26);
    c.save(); c.beginPath(); c.rect(x + 1.5, y - 8, 29, 11); c.clip();
    [[7, 3, '#F28C28'], [15, 1, '#FFD74A'], [23, 3, '#F28C28'], [11, -1, '#F28C28'], [20, -1, '#FFD74A']].forEach(([a, b, col]) => { el(c, x + a, y + b, 5, 4.6); F(c, Rg(c, x + a, y + b, 6, [sh(col, .4), col, sh(col, -.3)], x + a - 2, y + b - 2), 1.1); });
    c.restore();
    el(c, x + 12.5, y - 4.5, 3, 1.4, -0.6); F(c, '#4E9A3E', 0.8);
  }
  function estante(c, x, y) {
    rr(c, x, y, 32, 32, 2); F(c, L(c, x, y, x, y + 32, ['#D9AE74', '#B98450', '#8A5A2E']), 1.4);
    c.fillStyle = '#6E4524'; c.fillRect(x + 2, y + 2, 28, 12.5); c.fillRect(x + 2, y + 17, 28, 12.5);
    [[4, 7], [12, 6], [19, 5], [25, 4]].forEach(([a, s]) => { rr(c, x + a, y + 14.5 - s, s, s, 0.6); F(c, L(c, 0, y + 14.5 - s, 0, y + 14.5, ['#FBD3DD', '#E58AA3']), 0.6); });
    rr(c, x + 4, y + 23, 24, 6, 1); F(c, L(c, 0, y + 23, 0, y + 29, ['#E6C08A', '#B98450']), 0.8);
    [8, 14, 20, 26].forEach(a => { el(c, x + a - 1, y + 22, 1.6, 1.6); F(c, '#3A2A20', 0.5); });
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x + 1, y + 15, 30, 1.4);
  }
  function toldo(c, x, y, w, A) {
    A = A || 14;
    linea(c, [x - 3, y + 1, x + w + 3, y + 1], OUT, 3.4); linea(c, [x - 3, y + 1, x + w + 3, y + 1], '#8A8F99', 1.6);
    c.save(); c.beginPath(); c.moveTo(x, y + 2); c.lineTo(x + w, y + 2); c.lineTo(x + w + 5, y + A); c.lineTo(x - 5, y + A); c.closePath(); c.clip();
    for (let i = -1; i < w / 8 + 2; i++) { c.fillStyle = (i + 8) % 2 ? '#F4E3C3' : '#C0392B'; c.fillRect(x - 6 + i * 8, y, 8, A + 2); }
    c.fillStyle = L(c, 0, y + 2, 0, y + A, ['rgba(255,255,255,.25)', 'rgba(0,0,0,.18)']); c.fillRect(x - 6, y, w + 12, A + 2); c.restore();
    c.beginPath(); c.moveTo(x, y + 2); c.lineTo(x + w, y + 2); c.lineTo(x + w + 5, y + A); c.lineTo(x - 5, y + A); c.closePath(); c.lineWidth = 1.3; c.strokeStyle = OUT; c.stroke();
    for (let xx = x - 5; xx < x + w + 5; xx += 8) { c.beginPath(); c.arc(xx + 4, y + A, 4, 0, Math.PI); c.closePath(); c.fillStyle = (((xx - x + 5) / 8 | 0) + 8) % 2 ? '#F4E3C3' : '#C0392B'; c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke(); }
  }
  function barras(c, x, y, w) {
    const rod = (x0, yy, len, h) => { for (let i = 0; i * 16 < len; i++) { const sx = x0 + i * 16, sw = Math.min(16, len - i * 16); rr(c, sx, yy, sw, h, 0.8); F(c, L(c, 0, yy, 0, yy + h, (i + 64) % 2 ? ['#7FB0F0', '#2F6FD0', '#1E4E9A'] : ['#FF9A90', '#D64545', '#9E2B2B']), 1.1); } brillo(c, x0 + len / 2, yy + 2, Math.max(1, len / 2 - 3), 0.9, .35, 0); };
    rod(x + 8, y + 16, w - 16, 15); rod(x, y + 1, w, 15);
  }
  function torreTile(c, x, y) {
    const s = 32, d = 4;
    c.beginPath(); c.moveTo(x + 1, y + d + 1); c.lineTo(x + d + 1, y + 1); c.lineTo(x + s, y + 1); c.lineTo(x + s - d, y + d + 1); c.closePath(); F(c, '#FCE0E7', 1.1);
    c.beginPath(); c.moveTo(x + s - d, y + d + 1); c.lineTo(x + s, y + 1); c.lineTo(x + s, y + s - d); c.lineTo(x + s - d, y + s); c.closePath(); F(c, '#D97A92', 1.1);
    rr(c, x + 1, y + d + 1, s - d - 1, s - d - 1, 1.5); F(c, L(c, x, y, x + s, y + s, ['#FBD3DD', '#F09AB0', '#D9788F']), 1.3);
    brillo(c, x + 7, y + d + 5, 4, 1.2, .5, -.3);
  }
  function cafeTile(c, x, y) {
    const d = 4;
    c.beginPath(); c.moveTo(x + 1, y + d + 1); c.lineTo(x + d + 1, y + 1); c.lineTo(x + 32, y + 1); c.lineTo(x + 28, y + d + 1); c.closePath(); F(c, '#C99A6A', 1.1);
    rr(c, x + 1, y + d + 1, 27, 31 - d, 1.5); F(c, L(c, x, y, x, y + 32, ['#B98450', '#8B5A2B', '#5E3A1A']), 1.3);
    c.beginPath(); c.moveTo(x + 28, y + d + 1); c.lineTo(x + 32, y + 1); c.lineTo(x + 32, y + 32 - d); c.lineTo(x + 28, y + 32); c.closePath(); F(c, '#6E4524', 1.1);
    vetas(c, x + 1, y + d + 1, 27, 31 - d, 'rgba(40,20,5,.25)');
  }
  function adoquinTile(c, arriba, v) {
    c.fillStyle = '#3E3630'; c.fillRect(0, 0, 32, 32);
    const y0 = arriba ? 10 : 0;
    for (let r = -1; r < 5; r++) for (let i = -1; i < 3; i++) {
      const sx = i * 16 + (((r + 4) % 2) ? 8 : 0), sy = y0 + r * 8 + 1, k = ((i + 4) * 7 + (r + 4) * 13 + v) % 5;
      if (sy + 7 < y0) continue;
      rr(c, sx + 0.6, sy, 14.8, 6.8, 2); c.fillStyle = L(c, 0, sy, 0, sy + 7, [['#9A8C7E', '#8A7C6E', '#A89A8A', '#7E7266', '#958778'][k], ['#6E6258', '#5E544A', '#766A5E', '#564C44', '#665A50'][k]]); c.fill();
      c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(sx + 2, sy + 0.8, 9, 1.1);
    }
    if (arriba) { c.fillStyle = L(c, 0, 0, 0, 10, ['#F4ECDC', '#E3D6BC', '#B9AA8E']); c.fillRect(0, 0, 32, 10); linea(c, [0, 0.6, 32, 0.6], 'rgba(255,255,255,.7)', 1.2); linea(c, [0, 10, 32, 10], OUT, 1.2); linea(c, [16 + v * 3, 1, 16 + v * 3, 10], 'rgba(120,100,70,.35)', 0.8); }
    c.fillStyle = 'rgba(0,0,0,' + (arriba ? .08 : .2) + ')'; c.fillRect(0, 0, 32, 32);
  }
  function duelaTile(c, arriba, v) {
    c.fillStyle = '#8A5A2E'; c.fillRect(0, 0, 32, 32);
    const y0 = arriba ? 6 : 0;
    c.save(); c.beginPath(); c.rect(0, y0, 32, 32 - y0); c.clip();
    for (let r = -1; r < 6; r++) for (let i = -1; i < 3; i++) {
      const cx = i * 16 + 8, cy = y0 + 4 + r * 8, k = ((i + 4) * 5 + (r + 4) * 3 + v) % 4;
      c.save(); c.translate(cx, cy); c.rotate((i + r + 8) % 2 ? 0.72 : -0.72); rr(c, -9.5, -2.7, 19, 5.4, 1);
      c.fillStyle = ['#D9A06A', '#C98E55', '#E3B07A', '#BB824A'][k]; c.fill(); c.lineWidth = 0.6; c.strokeStyle = 'rgba(70,40,15,.55)'; c.stroke(); c.restore();
    }
    c.restore();
    if (arriba) { c.fillStyle = L(c, 0, 0, 0, 6, ['#F0CB96', '#C98E55']); c.fillRect(0, 0, 32, 6); linea(c, [0, 0.6, 32, 0.6], 'rgba(255,255,255,.55)', 1.2); linea(c, [0, 6, 32, 6], 'rgba(70,40,15,.6)', 1); }
    c.fillStyle = 'rgba(40,20,5,' + (arriba ? .08 : .22) + ')'; c.fillRect(0, 0, 32, 32);
  }
  function pista(c, x, y) {
    el(c, x, y, 16, 16); c.fillStyle = Rg(c, x, y, 16, ['rgba(255,200,220,.6)', 'rgba(255,200,220,0)']); c.fill();
    cuboRosa(c, x - 6, y - 4, 11);
    c.font = '800 8px Rubik, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.strokeStyle = '#8E3A52'; c.lineWidth = 2; c.strokeText('?', x - 0.5, y + 1.6); c.fillText('?', x - 0.5, y + 1.6);
    [[9, -9], [-10, -7], [10, 6]].forEach(([a, b]) => { c.beginPath(); c.moveTo(x + a, y + b - 2.5); c.lineTo(x + a + 0.8, y + b - 0.8); c.lineTo(x + a + 2.5, y + b); c.lineTo(x + a + 0.8, y + b + 0.8); c.lineTo(x + a, y + b + 2.5); c.lineTo(x + a - 0.8, y + b + 0.8); c.lineTo(x + a - 2.5, y + b); c.lineTo(x + a - 0.8, y + b - 0.8); c.closePath(); c.fillStyle = '#FFFFFF'; c.fill(); });
  }
  // Fondos de Roma
  function nubeRosa(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); [[0, 0, 10, 26], [22, -4, 13, 30], [46, 1, 9, 22]].forEach(([a, b, ry, rx]) => { el(c, a, b, rx, ry); c.fillStyle = Rg(c, a, b - 3, rx, ['rgba(255,240,225,.95)', 'rgba(250,196,170,.75)', 'rgba(240,160,140,0)']); c.fill(); }); c.restore(); }
  function cupula(c, x, base, s, col) {
    c.fillStyle = col; c.fillRect(x - 30 * s, base - 26 * s, 60 * s, 26 * s);
    c.beginPath(); c.ellipse(x, base - 26 * s, 30 * s, 30 * s, 0, Math.PI, 0); c.fill();
    c.fillRect(x - 5 * s, base - 66 * s, 10 * s, 12 * s); c.beginPath(); c.ellipse(x, base - 66 * s, 5 * s, 5 * s, 0, Math.PI, 0); c.fill(); c.fillRect(x - 0.8 * s, base - 78 * s, 1.6 * s, 9 * s);
  }
  function pinoRomano(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.moveTo(-2, 0); c.quadraticCurveTo(2, -30, 8, -52); c.lineTo(11, -52); c.quadraticCurveTo(6, -30, 3, 0); c.closePath(); c.fillStyle = '#6E4A32'; c.fill();
    [[-16, -56, 22, 8], [10, -62, 28, 10], [34, -56, 20, 8], [8, -52, 34, 9]].forEach(([a, b, rx, ry]) => { el(c, a, b, rx, ry); c.fillStyle = Rg(c, a, b - 4, rx, ['#8DB46A', '#5E8A42', '#3C6A30'], a - 6, b - 6); c.fill(); });
    c.restore();
  }
  function cipres(c, x, y, h) { c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x - 9, y - h * 0.3, x - 6, y - h * 0.75, x, y - h); c.bezierCurveTo(x + 6, y - h * 0.75, x + 9, y - h * 0.3, x, y); c.closePath(); c.fillStyle = L(c, x - 8, 0, x + 8, 0, ['#4E7A48', '#2F5233', '#1E3A24']); c.fill(); }
  function edificio(c, x, y, w, h, col, pisos) {
    rr(c, x, y, w, h, 1); F(c, L(c, x, y, x + w, y, [sh(col, .18), col, sh(col, -.18)]), 1.3);
    c.fillStyle = sh(col, -.25); c.fillRect(x - 2, y, w + 4, 5); linea(c, [x - 2, y + 5, x + w + 2, y + 5], 'rgba(60,30,15,.5)', 1);
    c.fillStyle = '#B4532A'; c.fillRect(x - 4, y - 5, w + 8, 5);
    const cols = Math.floor(w / 26);
    for (let p = 0; p < pisos; p++) for (let i = 0; i < cols; i++) {
      const wx = x + 8 + i * (w - 12) / cols, wy = y + 14 + p * 34;
      rr(c, wx, wy, 10, 18, 1); F(c, L(c, 0, wy, 0, wy + 18, ['#3A2E2A', '#5A4636']), 0.9);
      rr(c, wx - 6, wy, 5.5, 18, 0.6); F(c, L(c, wx - 6, 0, wx, 0, ['#6E9A7A', '#4F7A5A']), 0.8); rr(c, wx + 10.5, wy, 5.5, 18, 0.6); F(c, L(c, wx + 10, 0, wx + 16, 0, ['#6E9A7A', '#4F7A5A']), 0.8);
      if (p === 1) { rr(c, wx - 5, wy + 18, 20, 3, 1); F(c, '#E8DCC6', 0.8); for (let k = 0; k < 5; k++) linea(c, [wx - 4 + k * 4.5, wy + 21, wx - 4 + k * 4.5, wy + 27], '#2A2420', 0.8); linea(c, [wx - 5, wy + 27, wx + 15, wy + 27], '#2A2420', 1); [0, 8].forEach(d => { el(c, wx + d, wy + 16.5, 2.6, 2); c.fillStyle = '#D64545'; c.fill(); }); }
    }
  }
  function ropaTendida(c, x0, y0, x1, y1) {
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 12, x1, y1); c.lineWidth = 0.9; c.strokeStyle = '#4A3E36'; c.stroke();
    [[0.2, '#F4F1EA', 9, 13], [0.38, '#7FB8EC', 8, 11], [0.56, '#E5484D', 10, 9], [0.74, '#F2D6C9', 7, 12]].forEach(([t, col, w, h]) => { const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + 12 * 4 * t * (1 - t) * 0.9; rr(c, x - w / 2, y, w, h, 1.5); F(c, L(c, 0, y, 0, y + h, [sh(col, .15), sh(col, -.12)]), 0.8); });
  }
  function puertaCasa(c, x, y) {
    rr(c, x - 22, y - 50, 96, 116, 2); F(c, L(c, x - 22, 0, x + 74, 0, ['#F0D49A', '#E3A85A', '#C98A3E']), 1.4);
    rr(c, x - 14, y - 30, 80, 14, 2); F(c, L(c, 0, y - 30, 0, y - 16, ['#F4ECDC', '#D9CCB2']), 1.2);
    c.font = '800 6.2px Rubik, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#4A3420'; c.fillText('CASA DEI BAMBINI', x + 26, y - 23);
    c.beginPath(); c.moveTo(x, y + 66); c.lineTo(x, y + 12); c.ellipse(x + 26, y + 12, 26, 22, 0, Math.PI, 0); c.lineTo(x + 52, y + 66); c.closePath(); F(c, L(c, 0, y - 10, 0, y + 66, ['#E8DCC6', '#C9B898']), 1.4);
    c.beginPath(); c.moveTo(x + 5, y + 66); c.lineTo(x + 5, y + 14); c.ellipse(x + 26, y + 14, 21, 18, 0, Math.PI, 0); c.lineTo(x + 47, y + 66); c.closePath(); F(c, L(c, 0, y - 6, 0, y + 66, ['#FFE6B0', '#F2C27A', '#D9984A']), 1.2);
    c.fillStyle = 'rgba(120,70,30,.25)'; c.fillRect(x + 5, y + 50, 42, 16);
    c.font = '700 4.5px "Nunito Sans", Arial'; c.fillStyle = '#6E5A44'; c.fillText('Via dei Marsi 58', x + 26, y - 13);
  }
  function ventana(c, x, y, w, h) {
    c.save(); c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.ellipse(x + w / 2, y + w / 2, w / 2, w / 2, 0, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); c.clip();
    c.fillStyle = L(c, 0, y, 0, y + h, ['#F2A07A', '#F8C894', '#FCE6C2']); c.fillRect(x, y, w, h);
    c.fillStyle = '#D6A39C'; c.fillRect(x, y + h * 0.62, w, h); cupula(c, x + w * 0.62, y + h * 0.66, 0.42, '#D6A39C');
    c.fillStyle = '#C98E78'; [[0, 0.76, 0.3], [0.3, 0.72, 0.25], [0.55, 0.8, 0.45]].forEach(([a, b, ww]) => c.fillRect(x + w * a, y + h * b, w * ww, h));
    pinoRomano(c, x + w * 0.18, y + h * 0.86, 0.4);
    c.restore();
    c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.ellipse(x + w / 2, y + w / 2, w / 2, w / 2, 0, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); c.lineWidth = 6; c.strokeStyle = '#FBF6EA'; c.stroke(); c.lineWidth = 1.3; c.strokeStyle = OUT; c.stroke();
    linea(c, [x + w / 2, y, x + w / 2, y + h], '#FBF6EA', 3); linea(c, [x, y + h * 0.55, x + w, y + h * 0.55], '#FBF6EA', 3);
    rr(c, x - 6, y + h, w + 12, 6, 2); F(c, '#F4EEDF', 1.2);
    [[x - 14, 1], [x + w + 2, -1]].forEach(([cx, d]) => { c.beginPath(); c.moveTo(cx, y - 4); c.quadraticCurveTo(cx + d * 10, y + h * 0.5, cx + (d > 0 ? 2 : 10), y + h + 4); c.lineTo(cx + (d > 0 ? 12 : 0), y + h + 4); c.quadraticCurveTo(cx + (d > 0 ? 14 : -2), y + h * 0.4, cx + 12, y - 4); c.closePath(); F(c, L(c, cx, 0, cx + 12, 0, ['#F8E2D6', '#E8C2B0']), 1.1); });
  }
  function paredAula(c) {
    c.fillStyle = L(c, 0, 0, 0, 300, ['#F7EBD3', '#EDDAB6']); c.fillRect(0, 0, 1280, 300);
    [60, 380, 700, 1020].forEach(x => ventana(c, x, 62, 92, 150));
    c.save(); c.globalCompositeOperation = 'screen';
    [60, 380, 700, 1020].forEach(a => { c.beginPath(); c.moveTo(a, 212); c.lineTo(a + 92, 212); c.lineTo(a + 182, 296); c.lineTo(a + 70, 296); c.closePath(); c.fillStyle = 'rgba(255,226,170,.28)'; c.fill(); });
    c.restore();
    // Tondo (la Madonna della Seggiola de Rafael colgaba en las Casas de los Niños)
    el(c, 240, 118, 25, 25); F(c, Rg(c, 240, 118, 27, ['#F6D77A', '#C99520', '#8A6510'], 232, 110), 1.6);
    el(c, 240, 118, 19, 19); F(c, Rg(c, 240, 118, 20, ['#E9C6A0', '#C98A5A', '#7A4A3A'], 234, 112), 1);
    el(c, 234, 121, 9, 11, 0.3); c.fillStyle = '#2F5FA8'; c.fill(); el(c, 244, 124, 8, 9, -0.3); c.fillStyle = '#B83A3A'; c.fill();
    el(c, 236, 108, 4.5, 5); c.fillStyle = '#EBC29C'; c.fill(); el(c, 245, 114, 3.6, 4); c.fill();
    rr(c, 540, 160, 80, 44, 3); F(c, L(c, 0, 160, 0, 204, ['#3E5A48', '#2F4A3A']), 3, '#8A5A2E');
    c.font = 'italic 700 15px "Nunito Sans", Arial'; c.fillStyle = 'rgba(245,245,235,.9)'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('a   m   s', 580, 182);
    rr(c, 880, 120, 60, 80, 2); F(c, L(c, 0, 120, 0, 200, ['#F4ECDC', '#E3D6BC']), 2, '#8A5A2E');
    [[890, 132, '#D64545'], [904, 140, '#2F6FD0'], [918, 132, '#3DA35D'], [896, 160, '#F2B632'], [912, 168, '#D64545'], [926, 158, '#2F6FD0']].forEach(([a, b, col]) => { el(c, a, b, 4, 4); c.fillStyle = col; c.fill(); });
    c.font = '800 7px Rubik, Arial'; c.fillStyle = '#6E4524'; c.fillText('1 · 2 · 3', 910, 190);
    c.fillStyle = L(c, 0, 222, 0, 296, ['#B7CCAE', '#97B08E']); c.fillRect(0, 226, 1280, 74);
    c.fillStyle = '#F4EEDF'; c.fillRect(0, 221, 1280, 6); linea(c, [0, 227, 1280, 227], 'rgba(60,40,20,.35)', 1);
    for (let x = 10; x < 1280; x += 80) { rr(c, x, 236, 64, 48, 3); c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,.35)'; c.stroke(); }
    [[300, 1], [820, 1]].forEach(([tx]) => {
      rr(c, tx, 258, 58, 6, 2); F(c, L(c, 0, 258, 0, 264, ['#E6C08A', '#B98450']), 1.2); [tx + 4, tx + 50].forEach(x => linea(c, [x, 264, x, 296], '#8A5A2E', 2.4));
      [[tx - 16, 0], [tx + 64, 1]].forEach(([x, d]) => { rr(c, x, 272, 14, 4, 1); F(c, '#D9AE74', 1); linea(c, [x + 2, 276, x + 2, 296], '#8A5A2E', 2); linea(c, [x + 12, 276, x + 12, 296], '#8A5A2E', 2); rr(c, x + (d ? 10 : 0), 256, 4, 16, 1); F(c, '#D9AE74', 1); });
    });
    [[170, 0], [640, 0], [1160, 0]].forEach(([x]) => { el(c, x + 11, 296, 12, 3); c.fillStyle = 'rgba(0,0,0,.15)'; c.fill(); rr(c, x, 274, 22, 22, 3); F(c, L(c, x, 0, x + 22, 0, ['#E07A4A', '#B4532A']), 1.2); [[-10, -14], [0, -22], [10, -15], [-4, -8], [6, -9]].forEach(([a, b]) => { el(c, x + 11 + a * 0.8, 274 + b * 0.7, 6, 3, a * 0.08); F(c, '#5E9E4E', 0.8); }); });
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
  const E = { persona: 0.27, cerdo: 0.32, loro: 0.25, regla: 0.26, tile: 0.5, pupitre: 0.26, medalla: 0.25, reloj: 0.3, rodadora: 0.3, cuervo: 0.25, espanta: 0.27, colono: 0.2 };
  const PIES = 89;   // altura de las suelas en la caja de personaje

  function preparar(k, forzar) {
    if (!k || (k === K && !forzar)) return;
    K = k;
    const cajaP = [-8, -8, 80, 106], anclaP = [32, PIES];
    ['ale', 'pestalozzi', 'comenio', 'rousseau', 'froebel', 'montessori', 'makarenko'].forEach(id => {
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

    // ----- Mundo 2 -----
    for (let i = 0; i < 4; i++) cachear(`pupitre${i}`, [-2, -2, 72, 60], E.pupitre, [32, 54], c => pupitre(c, i * TAU / 4));
    for (let i = 0; i < 4; i++) cachear(`medalla${i}`, [-4, -8, 72, 64], E.medalla, [32, 36], c => medalla(c, Math.sin(i * TAU / 4) * 0.5));
    cachear('reloj0', [-6, -2, 60, 62], E.reloj, [24, 56], c => reloj(c, false));
    cachear('reloj1', [-6, -2, 60, 62], E.reloj, [24, 56], c => reloj(c, true));
    cachear('pista', [-17, -17, 34, 34], 0.5, [0, 0], c => pista(c, 0, 0));
    cachear('portal', [-24, -52, 100, 120], 0.5, [26, 66], c => puertaCasa(c, 0, 0));
    cachear('caja', cajaT, E.tile, [0, 0], c => caja(c, 0, 0));
    cachear('cajaUsada', cajaT, E.tile, [0, 0], c => cajaUsada(c, 0, 0));
    cachear('fruta', cajaT, E.tile, [0, 0], c => fruta(c, 0, 0));
    cachear('estante', cajaT, E.tile, [0, 0], c => estante(c, 0, 0));
    cachear('torre', cajaT, E.tile, [0, 0], c => torreTile(c, 0, 0));
    cachear('cafe', cajaT, E.tile, [0, 0], c => cafeTile(c, 0, 0));
    for (let v = 0; v < 4; v++) {
      cachear('adoquinA' + v, cajaT, E.tile, [0, 0], c => { c.save(); c.beginPath(); c.rect(0, 0, 32, 32); c.clip(); adoquinTile(c, true, v); c.restore(); });
      cachear('adoquinB' + v, cajaT, E.tile, [0, 0], c => { c.save(); c.beginPath(); c.rect(0, 0, 32, 32); c.clip(); adoquinTile(c, false, v); c.restore(); });
      cachear('duelaA' + v, cajaT, E.tile, [0, 0], c => { c.save(); c.beginPath(); c.rect(0, 0, 32, 32); c.clip(); duelaTile(c, true, v); c.restore(); });
      cachear('duelaB' + v, cajaT, E.tile, [0, 0], c => { c.save(); c.beginPath(); c.rect(0, 0, 32, 32); c.clip(); duelaTile(c, false, v); c.restore(); });
    }
    // Plataformas por tramos (inicio, medio, final, sola), alineadas cada 32 unidades
    const tramos = { I: [0, -6, 38], M: [-32, 0, 32], D: [-64, 0, 38], S: [0, -6, 44] };
    Object.keys(tramos).forEach(k2 => {
      const [x0, cx, cw] = tramos[k2];
      cachear('toldo' + k2, cajaT, E.tile, [0, 0], c => { c.save(); c.beginPath(); c.rect(cx, -8, cw, 48); c.clip(); toldo(c, x0, 0, k2 === 'S' ? 32 : 96, 24); c.restore(); });
      cachear('barras' + k2, cajaT, E.tile, [0, 0], c => { c.save(); c.beginPath(); c.rect(cx, -8, cw, 48); c.clip(); barras(c, x0, 0, k2 === 'S' ? 32 : 96); c.restore(); });
    });
    cachear('romaCielo', [0, 0, 640, 360], 0.5, [0, 0], c => {
      c.fillStyle = L(c, 0, 0, 0, 360, ['#E9876A', '#F5A878', '#FAD3A0', '#FCEBCB']); c.fillRect(0, 0, 640, 360);
      el(c, 120, 170, 190, 190); c.fillStyle = Rg(c, 120, 170, 190, ['rgba(255,236,190,.95)', 'rgba(255,214,150,.45)', 'rgba(255,214,150,0)']); c.fill();
      el(c, 120, 172, 24, 24); c.fillStyle = Rg(c, 120, 172, 24, ['#FFFBEA', '#FFE7A8', 'rgba(255,220,150,0)']); c.fill();
    });
    cachear('romaNubes', [0, 0, 1280, 360], 0.5, [0, 0], c => { [[120, 60, 1], [420, 36, 0.7], [760, 70, 0.9], [1060, 44, 0.75]].forEach(([x, y, s]) => nubeRosa(c, x, y, s)); });
    cachear('romaHorizonte', [0, 0, 1280, 360], 0.5, [0, 0], c => {
      const col = '#D6A39C'; c.fillStyle = col;
      const techos = [0, 230, 40, 218, 70, 226, 110, 212, 150, 222, 200, 214, 250, 224, 300, 210, 350, 220, 400, 216, 440, 226, 480, 218, 560, 222, 600, 214, 650, 226, 700, 216, 760, 224, 820, 212, 880, 222, 940, 216, 1000, 226, 1060, 214, 1120, 222, 1180, 218, 1240, 226, 1280, 230];
      for (let i = 0; i < techos.length - 2; i += 2) c.fillRect(techos[i], techos[i + 1], techos[i + 2] - techos[i], 262 - techos[i + 1]);
      cupula(c, 520, 214, 1.05, col); cupula(c, 170, 220, 0.55, col); cupula(c, 330, 214, 0.45, col); cupula(c, 980, 218, 0.6, col);
      [[392, 160], [1160, 170]].forEach(([x, y]) => { c.fillRect(x, y, 14, 220 - y + 40); c.beginPath(); c.moveTo(x - 2, y); c.lineTo(x + 7, y - 14); c.lineTo(x + 16, y); c.closePath(); c.fill(); });
      c.fillStyle = L(c, 0, 190, 0, 262, ['rgba(250,214,170,0)', 'rgba(250,214,170,.65)']); c.fillRect(0, 190, 1280, 72);
    });
    cachear('romaAcueducto', [0, 0, 1280, 360], 0.5, [0, 0], c => {
      const top = 214;
      c.fillStyle = L(c, 0, top, 0, top + 12, ['#F0CFA2', '#D9A877']); c.fillRect(0, top, 1280, 12); linea(c, [0, top, 1280, top], 'rgba(120,70,40,.5)', 1);
      for (let x = 0; x < 1280; x += 40) {
        c.fillStyle = L(c, x, 0, x + 10, 0, ['#E8BE8C', '#C99662']); c.fillRect(x, top + 12, 10, 60);
        c.beginPath(); c.moveTo(x + 10, top + 72); c.lineTo(x + 10, top + 30); c.ellipse(x + 25, top + 30, 15, 14, 0, Math.PI, 0); c.lineTo(x + 40, top + 72); c.closePath(); c.fillStyle = 'rgba(120,70,50,.22)'; c.fill();
      }
      [[70, 250, 1], [250, 246, 0.85], [600, 250, 0.95], [900, 248, 0.8], [1150, 250, 1]].forEach(([x, y, s]) => pinoRomano(c, x, y, s));
      [[190, 70], [206, 52], [330, 64], [740, 70], [756, 54], [1030, 66]].forEach(([x, h]) => cipres(c, x, 266, h));
    });
    cachear('romaEdificios', [0, 0, 1280, 360], 0.5, [0, 0], c => {
      [[40, 124, 90, '#E3A85A', 4], [130, 100, 96, '#C9673F', 5], [430, 136, 90, '#EBC57A', 4], [520, 112, 100, '#D98C55', 4], [820, 124, 96, '#C9673F', 4], [916, 144, 84, '#EBC57A', 3], [1160, 104, 96, '#E3A85A', 5]]
        .forEach(([x, y, w, col, p]) => edificio(c, x, y, w, 296 - y, col, p));
      ropaTendida(c, 100, 150, 160, 140); ropaTendida(c, 490, 160, 550, 150); ropaTendida(c, 880, 156, 940, 162);
    });
    cachear('aula', [0, 0, 1280, 360], 0.5, [0, 0], c => paredAula(c));

    // ----- Mundo 3 -----
    for (let i = 0; i < 4; i++) cachear(`colono_quieto${i}`, cajaP, E.colono, anclaP, c => persona(c, PJ.colono, 'idle', i * TAU / 4));
    for (let i = 0; i < 8; i++) cachear(`colono_camina${i}`, cajaP, E.colono, anclaP, c => persona(c, PJ.colono, 'walk', i * TAU / 8));
    cachear('colono_salto', cajaP, E.colono, anclaP, c => persona(c, PJ.colono, 'jump', 0));
    for (let i = 0; i < 4; i++) cachear(`rodadora${i}`, [-6, -2, 60, 52], E.rodadora, [24, 47], c => rodadora(c, -i * TAU / 4));
    for (let i = 0; i < 4; i++) cachear(`cuervo${i}`, [-10, 0, 72, 52], E.cuervo, [30, 30], c => cuervo(c, Math.sin(i * TAU / 4) * 0.5));
    cachear('espanta', [-4, 0, 60, 74], E.espanta, [26, 70], c => espantapajaros(c));
    cachear('troncoQ', cajaT, E.tile, [0, 0], c => troncoPreg(c, 0, 0, false));
    cachear('troncoU', cajaT, E.tile, [0, 0], c => troncoPreg(c, 0, 0, true));
    cachear('paca', cajaT, E.tile, [0, 0], c => paca(c, 0, 0));
    cachear('lena', cajaT, E.tile, [0, 0], c => lena(c, 0, 0));
    for (let v = 0; v < 4; v++) {
      cachear('caminoA' + v, [-6, -16, 44, 52], E.tile, [0, 0], c => { c.save(); c.beginPath(); c.rect(0, -16, 32, 48); c.clip(); caminoTile(c, true, v); c.restore(); });
      cachear('caminoB' + v, cajaT, E.tile, [0, 0], c => { c.save(); c.beginPath(); c.rect(0, 0, 32, 32); c.clip(); caminoTile(c, false, v); c.restore(); });
    }
    cachear('aguaA', cajaT, E.tile, [0, 0], c => aguaTile(c, true));
    cachear('aguaB', cajaT, E.tile, [0, 0], c => aguaTile(c, false));
    Object.keys(tramos).forEach(k2 => {
      const [x0, cx, cw] = tramos[k2];
      cachear('tablon' + k2, cajaT, E.tile, [0, 0], c => { c.save(); c.beginPath(); c.rect(cx, -8, cw, 48); c.clip(); const w = k2 === 'S' ? 32 : 96; rr(c, x0 + 3, 9, w - 6, 9, 2); F(c, L(c, 0, 9, 0, 18, ['#8A5E36', '#5E3E22']), 1.2); tablones(c, x0, 0, w, false); c.restore(); });
    });
    cachear('balsa', [-4, -4, 104, 26], 0.5, [0, 0], c => balsa(c, 0, 0, 96));
    [['cercana', 'Perspectiva cercana'], ['media', 'Perspectiva media'], ['lejana', 'Perspectiva lejana']].forEach(([k2, txt]) => cachear('letrero_' + k2, [-10, -4, 130, 54], 0.5, [0, 46], c => letrero(c, 0, 0, txt)));
    cachear('jata', [-20, -40, 140, 100], 0.5, [0, 0], c => jata(c, 0, 0, 92, 52));
    cachear('tallerColonia', [-14, -50, 200, 140], 0.5, [0, 0], c => taller(c, 0, 0, 170, 86, 'КОЛОНИЯ им. М. ГОРЬКОГО'));
    cachear('tallerCarpinteria', [-14, -40, 150, 112], 0.5, [0, 0], c => taller(c, 0, 0, 120, 68, 'Taller de carpintería'));
    cachear('ucCielo', [0, 0, 640, 360], 0.5, [0, 0], c => cieloVerano(c));
    cachear('ucNubes', [0, 0, 1280, 360], 0.5, [0, 0], c => { [[80, 50, 1], [420, 32, 0.75], [760, 70, 0.6], [1050, 40, 0.9]].forEach(([x, y, s]) => cumulo(c, x, y, s)); });
    cachear('ucEstepa', [0, 0, 1280, 360], 0.5, [0, 0], c => {
      c.beginPath(); c.moveTo(0, 250); for (let x = 0; x <= 1280; x += 16) c.lineTo(x, 236 + Math.sin(x * TAU / 1280 * 6) * 8 + Math.sin(x * TAU / 1280 * 15 + 1) * 4); c.lineTo(1280, 300); c.lineTo(0, 300); c.closePath(); c.fillStyle = L(c, 0, 226, 0, 300, ['#A9C98A', '#8DB46A']); c.fill();
      molino(c, 520, 238, 1.3, 0.3); molino(c, 1120, 240, 1.0, 0.9);
      [[60, 64], [82, 52], [104, 58], [600, 60], [622, 48], [860, 62], [882, 54], [1200, 58]].forEach(([x, h]) => abedul(c, x, 262, h));
      c.fillStyle = L(c, 0, 180, 0, 260, ['rgba(234,246,242,0)', 'rgba(234,246,242,.45)']); c.fillRect(0, 180, 1280, 80);
    });
    cachear('ucTrigo', [0, 0, 1280, 360], 0.5, [0, 0], c => campoTrigo(c, 0, 1280, 254, 46));
    cachear('ucGirasoles', [0, 0, 1280, 360], 0.5, [0, 0], c => { [[150, -0.2], [176, -0.1], [202, -0.25], [470, 0.1], [496, 0], [790, -0.1], [816, 0.1], [1100, -0.2], [1126, 0]].forEach(([x, r], i) => girasol(c, x, 300, 38 + (i * 7) % 10, r)); });
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
  function fondo(ctx, cam, nivel, t) {
    if (nivel.tema === 'roma') return fondoRoma(ctx, cam, nivel, t);
    if (nivel.tema === 'ucrania') return fondoUcrania(ctx, cam, nivel, t);
    const castilloX = nivel.castilloX === undefined ? null : nivel.castilloX;
    ctx.drawImage(C.cielo.img, 0, 0, 320, 180);
    capa(ctx, 'nubes', cam * 0.12 + t * 0.004);
    capa(ctx, 'montesLejos', cam * 0.2);
    capa(ctx, 'montesCerca', cam * 0.3);
    capa(ctx, 'lago', cam * 0.4);
    if (castilloX !== null) dibujar(ctx, 'castillo', castilloX - cam * 0.4, 83);
    capa(ctx, 'colinas', cam * 0.5);
  }
  // Roma: calle al atardecer y, desde la puerta de la Casa dei Bambini, el aula.
  function fondoRoma(ctx, cam, nivel, t) {
    ctx.drawImage(C.romaCielo.img, 0, 0, 320, 180);
    capa(ctx, 'romaNubes', cam * 0.08 + t * 0.003);
    capa(ctx, 'romaHorizonte', cam * 0.15);
    capa(ctx, 'romaAcueducto', cam * 0.3);
    capa(ctx, 'romaEdificios', cam * 0.55);
    const xi = nivel.interiorDesde * 16 - cam;
    if (xi < 320) {
      ctx.save(); ctx.beginPath(); ctx.rect(xi, 0, 320 - xi, 180); ctx.clip();
      capa(ctx, 'aula', (cam - nivel.interiorDesde * 16) * 0.85 + 40);
      ctx.restore();
      const g = ctx.createLinearGradient(xi - 6, 0, xi + 3, 0); g.addColorStop(0, '#F4E6C8'); g.addColorStop(1, '#C9A877');
      ctx.fillStyle = g; ctx.fillRect(xi - 6, 0, 9, 180); ctx.fillStyle = OUT; ctx.fillRect(xi + 3, 0, 0.8, 180); ctx.fillRect(xi - 6.4, 0, 0.6, 180);
    }
  }
  // Ucrania: cielo de verano, estepa, trigo y, según el tramo, jatas o talleres de la colonia.
  function fondoUcrania(ctx, cam, nivel, t) {
    ctx.drawImage(C.ucCielo.img, 0, 0, 320, 180);
    capa(ctx, 'ucNubes', cam * 0.08 + t * 0.003);
    capa(ctx, 'ucEstepa', cam * 0.2);
    capa(ctx, 'ucTrigo', cam * 0.4);
    (nivel.decor || []).forEach(d => { const x = d.x - cam * 0.6; if (x > -110 && x < 330) dibujar(ctx, d.img, x, d.y); });
    capa(ctx, 'ucGirasoles', cam * 0.7);
  }
  function esInterior(nivel, tx) { return nivel.tema === 'roma' && tx >= nivel.interiorDesde; }
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
      const n = Math.max(3, d.animo), anchoIzq = 112 + n * 20 + (d.gis ? 22 : 0) + (d.pistas ? 42 : 0) + (d.compas ? 42 : 0);
      rr(c, 10, 8, anchoIzq, 34, 17); F(c, 'rgba(18,30,60,.72)', 2, 'rgba(255,255,255,.55)');
      for (let i = 0; i < n; i++) corazon(c, 30 + i * 20, 26, 1.2, i < d.animo);
      const xf = 30 + n * 20 + 6;
      c.save(); c.translate(xf, 22); c.scale(0.62, 0.62); foco(c, 0, 0); c.restore();
      textoArte(c, '× ' + d.ideas, xf + 14, 26, 16, '#FFFFFF');
      if (d.gis) { c.save(); c.translate(xf + 70, 25); c.scale(0.7, 0.7); gis(c, 0, 0); c.restore(); }
      if (d.compas) { const xc = xf + 72 + (d.gis ? 22 : 0) + (d.pistas ? 42 : 0); c.drawImage(C.colono_quieto0.img, xc - 12, 9, C.colono_quieto0.w * 1.45, C.colono_quieto0.h * 1.45); textoArte(c, '×' + d.compas, xc + 9, 26, 14, '#FFE6B0'); }
      if (d.pistas) { const xp = xf + 72 + (d.gis ? 22 : 0); c.save(); c.translate(xp, 26); c.scale(0.75, 0.75); cuboRosa(c, -6, -5, 11); c.restore(); textoArte(c, '×' + d.pistas, xp + 9, 26, 14, '#FFD6E0'); }
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
    fondo(ctx, cam, { tema: 'alpes', castilloX: lejos - (lejos % 900) + 340 }, t);
    for (let x = 0; x < 320; x += 16) { dibujar(ctx, 'pasto' + ((x / 16) % 4), x, 148); dibujar(ctx, 'tierra' + ((x / 16 + 1) % 4), x, 164); }
    ctx.fillStyle = 'rgba(14,27,56,.18)'; ctx.fillRect(0, 0, 320, 180);
    const fila = [['comenio', 50], ['rousseau', 82], ['pestalozzi', 114], ['ale', 150], ['montessori', 186], ['makarenko', 220], ['froebel', 254]];
    fila.forEach(([id, x], i) => {
      dibujar(ctx, `${id}_quieto${Math.floor(t / 260 + i) % 4}`, x, 148, i > 3);
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

  return { preparar, dibujar, fondo, esInterior, texto, globo, bandera, meta, proyectil, polvo, hud, titulo, retrato,
    get K() { return K; }, ESCALA: E, PIES };
})();
