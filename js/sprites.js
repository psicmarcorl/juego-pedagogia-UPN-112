'use strict';
/* Saltos del Saber · Gráficos en pixel art.
   Todos los personajes, bloques y fondos se dibujan con código: no hay imágenes externas. */
const Sprites = (() => {
  const BASE = { s: '#EAB98C', e: '#1B2333', m: '#A0523D', k: '#1D1D1D', g: '#8A94A6' };

  // Genera un personaje de 12 × 16 píxeles a partir de rasgos (cabello, barba, lentes, ropa).
  function persona(o) {
    const W = 12, H = 16;
    const g = Array.from({ length: H }, () => Array(W).fill('.'));
    const set = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
    const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c); };
    const paso = o.pose === 'paso', salto = o.pose === 'salto';

    if (o.style === 'long') { rect(2, 2, 1, 7, 'h'); rect(9, 2, 1, 7, 'h'); }
    if (o.style === 'bun') { rect(2, 2, 1, 3, 'h'); rect(9, 2, 1, 3, 'h'); }
    rect(3, 2, 6, 5, 's'); set(5, 7, 's'); set(6, 7, 's');

    if (o.dress) rect(2, 8, 8, 7, 'c');
    else {
      rect(2, 8, 8, 5, 'c');
      if (paso) { rect(2, 13, 2, 2, 'p'); rect(8, 13, 2, 2, 'p'); }
      else if (salto) { rect(3, 13, 2, 1, 'p'); rect(7, 13, 2, 2, 'p'); }
      else { rect(3, 13, 2, 2, 'p'); rect(7, 13, 2, 2, 'p'); }
    }
    if (salto) { rect(1, 6, 1, 3, 'c'); set(1, 5, 's'); }
    else { rect(1, 9, 1, 2, 'c'); set(1, 11, 's'); }
    rect(10, 9, 1, 2, 'c'); set(10, 11, 's');
    rect(5, 8, 2, 1, 'w'); if (o.cravat) rect(5, 8, 2, 3, 'w');
    if (o.belt) rect(2, 11, 8, 1, 't');
    if (o.scarf) { rect(4, 8, 4, 1, 'r'); rect(6, 9, 1, 2, 'r'); }
    if (o.pack) { rect(3, 8, 1, 4, 'y'); rect(8, 8, 1, 4, 'y'); }

    if (o.dress) { rect(3, 15, 2, 1, 'k'); rect(7, 15, 2, 1, 'k'); }
    else if (paso) { rect(1, 15, 3, 1, 'k'); rect(8, 15, 3, 1, 'k'); }
    else if (salto) { rect(2, 14, 3, 1, 'k'); rect(7, 15, 3, 1, 'k'); }
    else { rect(2, 15, 3, 1, 'k'); rect(7, 15, 3, 1, 'k'); }

    set(4, 4, 'e'); set(7, 4, 'e'); set(5, 6, 'm'); set(6, 6, 'm');

    if (o.style === 'wild') {
      rect(2, 1, 8, 2, 'h'); rect(2, 3, 1, 3, 'h'); rect(9, 3, 1, 3, 'h');
      set(1, 2, 'h'); set(10, 2, 'h'); set(1, 4, 'h'); set(10, 4, 'h'); set(4, 0, 'h'); set(7, 0, 'h');
    } else { rect(3, 1, 6, 2, 'h'); set(3, 3, 'h'); set(8, 3, 'h'); }
    if (o.style === 'bun') rect(4, 0, 4, 1, 'h');
    if (o.style === 'pony') { rect(9, 2, 2, 1, 'h'); rect(10, 3, 1, 3, 'h'); }
    if (o.style === 'wig') { rect(2, 3, 1, 2, 'h'); rect(9, 3, 1, 2, 'h'); }
    if (o.style === 'cap') { rect(2, 3, 1, 2, 'x'); rect(9, 3, 1, 2, 'x'); set(3, 3, 'x'); set(8, 3, 'x'); }

    if (o.beard === 'full') { rect(3, 5, 6, 2, 'b'); rect(4, 7, 4, 1, 'b'); set(5, 6, 'm'); set(6, 6, 'm'); }
    if (o.beard === 'long') { rect(3, 5, 6, 2, 'b'); rect(4, 7, 4, 3, 'b'); set(5, 6, 'm'); set(6, 6, 'm'); }
    if (o.beard === 'goatee') { rect(4, 6, 4, 1, 'b'); rect(5, 7, 2, 1, 'b'); }
    if (o.glasses) { set(3, 4, 'g'); set(5, 4, 'g'); set(6, 4, 'g'); set(8, 4, 'g'); }
    return g;
  }

  const PERSONAJES = {
    ale:        { style: 'pony', pack: true, pal: { h: '#3A2418', s: '#D9A066', c: '#1F3864', w: '#7FB8EC', p: '#4A6FA5', y: '#F2B632', m: '#9C4A3A' } },
    pestalozzi: { style: 'wild', cravat: true, pal: { h: '#CFC8BB', c: '#5B3A29', w: '#FFFFFF', p: '#3D2A1F' } },
    comenio:    { style: 'cap', beard: 'long', pal: { h: '#1A1A1A', x: '#9A958C', b: '#B5B0A6', c: '#262626', w: '#262626', p: '#262626', m: '#6E5A4E' } },
    rousseau:   { style: 'wig', pal: { h: '#8B6B4A', c: '#3E5C76', w: '#F2EFE6', p: '#2E3E4E' } },
    froebel:    { style: 'long', pal: { h: '#A8A39A', c: '#2F3B2F', w: '#E8E4D8', p: '#2A2A2A' } },
    montessori: { style: 'bun', dress: true, pal: { h: '#6E6862', c: '#3B2A4A', w: '#F2EFE6' } },
    makarenko:  { style: 'short', glasses: true, belt: true, pal: { h: '#2B2B2B', c: '#6B6A3A', w: '#57562E', p: '#3A3A2A', t: '#3B2A1A' } },
    freire:     { style: 'short', beard: 'full', glasses: true, pal: { h: '#F1F1EE', b: '#F1F1EE', s: '#C68B5E', c: '#C9B48A', w: '#EFE6D0', p: '#5A4A3A', m: '#7A4A3A', g: '#9C8A70' } },
    meirieu:    { style: 'short', glasses: true, scarf: true, pal: { h: '#B8B8B8', c: '#2D3E63', w: '#E8E8E8', p: '#2A2A2A', r: '#B33A3A' } },
    mclaren:    { style: 'long', beard: 'goatee', pal: { h: '#D7D7D7', b: '#D7D7D7', c: '#262626', w: '#4A4A4A', p: '#2A2A3A', k: '#111111' } }
  };

  const S = {};
  for (const k in PERSONAJES) {
    const pal = Object.assign({}, BASE, PERSONAJES[k].pal);
    S[k] = { g: persona(PERSONAJES[k]), pal };
    S[k + '_paso'] = { g: persona(Object.assign({}, PERSONAJES[k], { pose: 'paso' })), pal };
    S[k + '_salto'] = { g: persona(Object.assign({}, PERSONAJES[k], { pose: 'salto' })), pal };
  }

  const PIG_PAL = { p: '#F4A3B5', d: '#C96A83', e: '#1B2333', k: '#5A2A3A', y: '#F2B632' };
  const PIG = [
    '......yy......',
    '..d...yy...d..',
    '..pppppppppp..',
    '.pkpppppppppp.',
    'ppeppppppppppd',
    'ddpppppppppppd',
    'ddpppppppppppp',
    '.pppppppppppp.',
    '..pppppppppp..'];
  S.pig = { g: PIG.concat(['..kk.kk.kk.kk.']), pal: PIG_PAL };
  S.pig2 = { g: PIG.concat(['.kk.kk.kk.kk..']), pal: PIG_PAL };
  S.loro = { g: [
    '....gggg....',
    '...gggggg...',
    '..ggweggg...',
    'yyyggggggg..',
    '.yygggggggg.',
    '...ggggggggg',
    '...grrgggggg',
    '...grrggggg.',
    '....gggggg..',
    '.....gggg...',
    '.....rrrrr..',
    '....k..k....',
    '...kk.kk....'], pal: { g: '#3DA35D', y: '#F2B632', w: '#FFFFFF', e: '#1B2333', r: '#D64545', k: '#5A3A1A' } };
  // Segundo cuadro del loro: el ala sube.
  S.loro2 = { g: S.loro.g.map((r, i) => (i === 6 || i === 7) ? r.replace(/r/g, 'g') : (i === 4 || i === 5) ? r.slice(0, 4) + 'rr' + r.slice(6) : r), pal: S.loro.pal };
  S.regla = { g: [
    'wwwwwwww', 'mwwwwwww', 'wwwwwwww', 'wkkwwkkw', 'wkewwekw', 'mwwwwwww', 'wwkkkkww', 'wkwwwwkw',
    'mmwwwwww', 'wwwwwwww', 'mwwwwwww', 'wwwwwwww', 'mmwwwwww', 'wwwwwwww', '.k....k.', 'kk....kk'],
    pal: { w: '#D9A45B', m: '#6B4423', k: '#1B2333', e: '#FFFFFF' } };
  S.bulb = { g: ['..yyyy..', '.yllyyy.', 'yllyyyyy', 'ylyyyyyy', 'yyyyyyyy', '.yyyyyy.', '..yyyy..', '..gggg..', '..hhhh..', '...gg...'],
    pal: { y: '#FFD43B', l: '#FFF6C2', g: '#9AA5B1', h: '#6B7785' } };
  S.heart = { g: ['.rr.rr.', 'rrrrrrr', 'rlrrrrr', '.rrrrr.', '..rrr..', '...r...'], pal: { r: '#E5484D', l: '#FFB3B5' } };
  S.heartOff = { g: S.heart.g, pal: { r: '#56607A', l: '#56607A' } };
  S.heartBig = { g: ['.rrr..rrr.', 'rrrrrrrrrr', 'rllrrrrrrr', 'rlrrrrrrrr', 'rrrrrrrrrr', '.rrrrrrrr.', '..rrrrrr..', '...rrrr...', '....rr....'], pal: { r: '#E5484D', l: '#FFB3B5' } };
  S.gis = { g: ['.ww.', 'wwwl', 'wwwl', 'wwwl', 'wwwl', 'wwwl', 'wwwl', 'wwwl', 'wwwl', 'wwwl', 'wwwl', '.ll.'], pal: { w: '#FFFFFF', l: '#C9D2DE' } };
  const QG = { g: ['.nnn.', 'n...n', '....n', '...n.', '..n..', '.....', '..n..'], pal: { n: '#1F3864' } };

  function pintar(c, spr, x, y, s = 1, flip = false) {
    const g = spr.g, pal = spr.pal;
    for (let j = 0; j < g.length; j++) {
      const row = g[j];
      for (let i = 0; i < row.length; i++) {
        const col = pal[row[i]]; if (!col) continue;
        c.fillStyle = col;
        const xi = flip ? row.length - 1 - i : i;
        c.fillRect(x + xi * s, y + j * s, s, s);
      }
    }
  }

  function nuevo(w, h) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return [cv, cv.getContext('2d')]; }
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

  const cache = new Map();
  function img(clave, flip = false) {
    const id = clave + (flip ? '|f' : '');
    if (cache.has(id)) return cache.get(id);
    const spr = S[clave];
    const [cv, c] = nuevo(spr.g[0].length, spr.g.length);
    pintar(c, spr, 0, 0, 1, flip);
    cache.set(id, cv);
    return cv;
  }
  function dibujar(ctx, clave, x, y, flip = false) { ctx.drawImage(img(clave, flip), Math.round(x), Math.round(y)); }
  function retrato(cv, clave, escala = 4) {
    const spr = S[clave] || S.pestalozzi;
    cv.width = spr.g[0].length * escala; cv.height = spr.g.length * escala;
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    pintar(c, spr, 0, 0, escala);
  }

  // ---------- Bloques del escenario (16 × 16) ----------
  const TILES = {};
  function motas(c, v, y0) {
    for (let k = 0; k < 3; k++) {
      const xx = (v * 5 + k * 7) % 13, yy = y0 + ((v * 3 + k * 5) % (14 - y0));
      R(c, xx, yy, 2, 2, '#7D4F28');
    }
  }
  function qblock(c, x, y) {
    R(c, x, y, 16, 16, '#9A6A12'); R(c, x + 1, y + 1, 14, 14, '#F2B632');
    R(c, x + 1, y + 1, 14, 1, '#FFD977'); R(c, x + 1, y + 1, 1, 14, '#FFD977');
    [[2, 2], [13, 2], [2, 13], [13, 13]].forEach(([a, b]) => R(c, x + a, y + b, 1, 1, '#9A6A12'));
    pintar(c, QG, x + 5, y + 4);
  }
  (function crearTiles() {
    for (let v = 0; v < 4; v++) {
      let [cv, c] = nuevo(16, 16);
      R(c, 0, 0, 16, 16, '#A06A3A'); R(c, 0, 0, 16, 4, '#5FAE4B');
      R(c, 2 + v, 0, 4, 1, '#8AD46F'); R(c, 10 - v, 0, 3, 1, '#8AD46F'); R(c, 0, 4, 16, 1, '#7D4F28');
      motas(c, v, 6); TILES['pasto' + v] = cv;
      [cv, c] = nuevo(16, 16); R(c, 0, 0, 16, 16, '#A06A3A'); motas(c, v + 4, 0); TILES['tierra' + v] = cv;
    }
    let [cv, c] = nuevo(16, 16);
    R(c, 0, 0, 16, 16, '#5B3A29');
    const lomos = [[3, '#C0392B'], [4, '#1A5FB4'], [3, '#2E7D4F'], [4, '#D98E04']]; let xx = 1;
    lomos.forEach(([w, col], i) => { const top = 1 + (i % 2); R(c, xx, top, w, 14 - (i % 2), col); R(c, xx, top + 3, w, 1, 'rgba(255,255,255,.35)'); R(c, xx, top + 9, w, 1, 'rgba(0,0,0,.2)'); xx += w; });
    TILES.libros = cv;

    [cv, c] = nuevo(16, 16); qblock(c, 0, 0); TILES.pregunta = cv;

    [cv, c] = nuevo(16, 16);
    R(c, 0, 0, 16, 16, '#6B4A2A'); R(c, 1, 1, 14, 14, '#A57A44'); R(c, 1, 1, 14, 1, '#BE9560');
    [[2, 2], [13, 2], [2, 13], [13, 13]].forEach(([a, b]) => R(c, a, b, 1, 1, '#6B4A2A'));
    R(c, 4, 5, 8, 6, '#8C6538'); R(c, 7, 5, 2, 6, '#6B4A2A');
    TILES.usado = cv;

    [cv, c] = nuevo(16, 16);
    const cols = ['#C0392B', '#1A5FB4', '#2E7D4F', '#D98E04'];
    for (let k = 0; k < 4; k++) {
      const y = k * 4, off = k % 2;
      R(c, 0, y, 16, 4, cols[k]); R(c, off ? 1 : 12, y + 1, 3, 2, '#F3EAD2');
      R(c, off ? 6 : 3, y + 1, 2, 2, 'rgba(255,255,255,.35)'); R(c, 0, y + 3, 16, 1, 'rgba(0,0,0,.25)');
    }
    TILES.plataforma = cv;
  })();

  // ---------- Fondos que se repiten (parallax) ----------
  function capaMontes(amp, col, nieve, k1, k2, fase) {
    const [cv, c] = nuevo(640, 180);
    for (let x = 0; x < 640; x += 4) {
      const v = 0.7 * Math.abs(Math.sin(x * Math.PI * k1 / 640 + fase)) + 0.3 * Math.abs(Math.sin(x * Math.PI * k2 / 640 + fase * 2));
      const h = Math.round(v * amp / 2) * 2;
      R(c, x, 150 - h, 4, h + 30, col);
      if (nieve && h > amp * 0.6) R(c, x, 150 - h, 4, 4, nieve);
    }
    return cv;
  }
  function nube(c, x, y, col) { R(c, x + 6, y, 14, 4, col); R(c, x, y + 4, 28, 6, col); R(c, x + 3, y + 10, 20, 2, col); }
  function capaNubes(col) {
    const [cv, c] = nuevo(640, 70);
    [[24, 30], [150, 18], [262, 40], [400, 26], [520, 46]].forEach(([x, y]) => nube(c, x, y, col));
    return cv;
  }
  const CAPAS = {
    montes: capaMontes(92, '#B4C8E4', '#F5F9FD', 3, 7, 0.4),
    colinas: capaMontes(30, '#7FB069', null, 2, 5, 1.1),
    nubes: capaNubes('#FFFFFF'),
    nochesLejos: capaMontes(72, '#2A4C86', null, 2, 5, 0.6),
    nochesCerca: capaMontes(40, '#1F3864', null, 3, 7, 2.2),
    nubesNoche: capaNubes('rgba(255,255,255,.16)')
  };

  function techo(c, x, y, w, h, col) { for (let r = 0; r < h; r++) { const ww = Math.max(2, Math.round(w * (r + 1) / h)); R(c, x + Math.round((w - ww) / 2), y + r, ww, 1, col); } }
  // Castillo de Yverdon, sede del instituto de Pestalozzi (1805–1825).
  function castillo(c, x, y, col = '#9FB3D1', oscuro = '#7D93B6') {
    R(c, x + 8, y + 12, 48, 40, col); for (let i = 0; i < 6; i++) R(c, x + 8 + i * 8, y + 8, 4, 4, col);
    R(c, x, y + 4, 14, 48, col); R(c, x + 50, y + 4, 14, 48, col);
    techo(c, x - 1, y - 8, 16, 12, oscuro); techo(c, x + 49, y - 8, 16, 12, oscuro);
    R(c, x + 5, y + 14, 3, 5, oscuro); R(c, x + 56, y + 14, 3, 5, oscuro);
    R(c, x + 28, y + 30, 8, 22, oscuro); R(c, x + 18, y + 20, 3, 4, oscuro); R(c, x + 43, y + 20, 3, 4, oscuro);
  }

  function pilaLibros(c, x, y, w, cols) {
    for (let k = 0; k < 3; k++) {
      const off = (k % 2) * 2, yy = y + k * 4;
      R(c, x + off, yy, w - 2, 4, cols[k % cols.length]);
      R(c, x + off + w - 6, yy + 1, 3, 2, '#F3EAD2');
      R(c, x + off + 3, yy + 1, 2, 2, 'rgba(255,255,255,.35)');
      R(c, x + off, yy + 3, w - 2, 1, 'rgba(0,0,0,.25)');
    }
  }

  function texto(c, s, x, y, size = 8, color = '#FFFFFF', align = 'left', sombra = '#1B2333', off = 1) {
    c.font = size + 'px "Press Start 2P", "Courier New", monospace';
    c.textAlign = align; c.textBaseline = 'top';
    if (sombra) { c.fillStyle = sombra; c.fillText(s, x + off, y + off); }
    c.fillStyle = color; c.fillText(s, x, y);
  }

  // Pantalla de título animada.
  let cieloNoche = null;
  function titulo(c, t, tactil) {
    if (!cieloNoche) { cieloNoche = c.createLinearGradient(0, 0, 0, 180); cieloNoche.addColorStop(0, '#0E1B38'); cieloNoche.addColorStop(1, '#3D77C4'); }
    c.fillStyle = cieloNoche; c.fillRect(0, 0, 320, 180);
    for (let i = 0; i < 44; i++) { const x = (i * 71) % 320, y = (i * 29) % 96; if ((i + Math.floor(t / 500)) % 7) R(c, x, y, 1, 1, '#DFE9FF'); }
    const nx = -Math.round(t * 0.006) % 640;
    c.drawImage(CAPAS.nubesNoche, nx, 24); c.drawImage(CAPAS.nubesNoche, nx + 640, 24);
    c.drawImage(CAPAS.nochesLejos, 0, 0); c.drawImage(CAPAS.nochesCerca, 0, 0);
    const cols = [['#C0392B', '#1A5FB4', '#2E7D4F'], ['#D98E04', '#6B3FA0', '#C0392B'], ['#2E7D4F', '#D98E04', '#1A5FB4']];
    for (let x = -8, i = 0; x < 320; x += 54, i++) pilaLibros(c, x, 148, 56, cols[i % 3]);
    R(c, 0, 160, 320, 20, '#5B3A29'); R(c, 0, 160, 320, 2, '#7A5236');
    texto(c, 'SALTOS DEL', 160, 22, 16, '#FFD977', 'center', '#1B2333', 2);
    texto(c, 'SABER', 160, 44, 24, '#FFD977', 'center', '#1B2333', 2);
    // "PEDAGÓGICA": la tilde se dibuja a mano para no depender de la fuente.
    const linea = 'UNA AVENTURA PEDAGOGICA';
    texto(c, linea, 160, 78, 8, '#C9D4E8', 'center');
    c.font = '8px "Press Start 2P", "Courier New", monospace';
    const x0 = 160 - c.measureText(linea).width / 2 + c.measureText('UNA AVENTURA PEDAG').width;
    R(c, Math.round(x0) + 4, 74, 2, 1, '#C9D4E8'); R(c, Math.round(x0) + 3, 75, 2, 1, '#C9D4E8');
    texto(c, 'UPN UNIDAD 112', 160, 92, 8, '#7FB8EC', 'center');
    if (Math.floor(t / 600) % 2 === 0) texto(c, tactil ? 'TOCA PARA EMPEZAR' : 'PRESIONA ENTER', 160, 112, 8, '#FFFFFF', 'center');
    const orden = ['pestalozzi', 'montessori', 'makarenko', 'ale', 'freire', 'meirieu', 'mclaren'];
    orden.forEach((k, i) => dibujar(c, k, 52 + i * 34, 132 - ((Math.floor(t / 380) + i) % 2)));
  }

  return { S, TILES, CAPAS, dibujar, retrato, castillo, texto, titulo, pintar };
})();
