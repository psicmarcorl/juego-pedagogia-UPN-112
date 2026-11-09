'use strict';
/* Saltos del Saber · Motor del juego: física, colisiones, cámara, obstáculos, preguntas y pantallas. */
(() => {
  const VW = 320, VH = 180, T = 16, OFFY = 4, G = 0.35, MAX_CAIDA = 6, PASO = 1000 / 60, ALTO_ALE = 22;
  const SOLIDOS = new Set(['G', 'B', '=', '?', 'g', 'h', 'e', 'U', 'T', 'C']);
  const BLOQUES_PREGUNTA = new Set(['?', 'g', 'h', 'e']);
  // Tamaño de la caja de choque de cada obstáculo según su dibujo
  const DIM = { cerdo: [14, 10], pupitre: [16, 11], loro: [12, 12], medalla: [12, 12], regla: [8, 16], reloj: [12, 16], rodadora: [13, 13], cuervo: [14, 11], espanta: [12, 18] };
  const ENEMIGOS = new Set(['cerdo', 'loro', 'regla']);
  const lienzo = document.getElementById('lienzo');
  const ctx = lienzo.getContext('2d');
  const esTactil = window.matchMedia('(pointer: coarse)').matches;
  document.body.classList.toggle('tactil', esTactil);

  // ---------- Preferencias guardadas en este navegador ----------
  const opciones = { nombre: '', grupo: '', tiempo: false, sonido: true, mundo: 1 };
  try { Object.assign(opciones, JSON.parse(localStorage.getItem('sds-opciones') || '{}')); } catch (e) { /* sin almacenamiento */ }
  function guardarOpciones() { try { localStorage.setItem('sds-opciones', JSON.stringify(opciones)); } catch (e) { /* sin almacenamiento */ } }
  Sonido.activo = opciones.sonido;

  // ---------- Entrada (teclado y botones táctiles) ----------
  const Entrada = {
    izq: false, der: false, saltar: false, gis: false,
    pulsos: { saltar: false, gis: false },
    poner(n, v) { if (v && !this[n] && n in this.pulsos) this.pulsos[n] = true; this[n] = v; },
    fin() { this.pulsos.saltar = false; this.pulsos.gis = false; },
    limpiar() { this.izq = this.der = this.saltar = this.gis = false; this.fin(); }
  };
  const TECLAS = { ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der', Space: 'saltar', ArrowUp: 'saltar',
    KeyW: 'saltar', KeyZ: 'saltar', KeyX: 'gis', KeyJ: 'gis', KeyK: 'gis' };

  document.addEventListener('keydown', e => {
    if (Interfaz.abierta()) { if (e.code === 'Escape' && estado === 'pausa') reanudar(); return; }
    if (estado === 'titulo' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); abrirInicio(); return; }
    if ((e.code === 'KeyP' || e.code === 'Escape') && estado === 'jugando') { e.preventDefault(); pausar(); return; }
    const a = TECLAS[e.code];
    if (a) { e.preventDefault(); Entrada.poner(a, true); }
  });
  document.addEventListener('keyup', e => { const a = TECLAS[e.code]; if (a) Entrada.poner(a, false); });
  window.addEventListener('blur', () => Entrada.limpiar());
  document.addEventListener('visibilitychange', () => { if (document.hidden && estado === 'jugando') pausar(); });

  document.querySelectorAll('[data-accion]').forEach(b => {
    const a = b.dataset.accion;
    const on = e => {
      e.preventDefault();
      if (estado === 'titulo') { abrirInicio(); return; }
      b.classList.add('activa'); Entrada.poner(a, true);
      try { b.setPointerCapture(e.pointerId); } catch (_) { /* opcional */ }
    };
    const off = () => { b.classList.remove('activa'); Entrada.poner(a, false); };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('lostpointercapture', off);
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
  lienzo.addEventListener('click', () => { if (estado === 'titulo') abrirInicio(); });

  // Barra inferior
  const bPausa = document.getElementById('b-pausa'), bSonido = document.getElementById('b-sonido'), bPantalla = document.getElementById('b-pantalla');
  function pintarSonido() { bSonido.textContent = 'Sonido: ' + (Sonido.activo ? 'sí' : 'no'); bSonido.setAttribute('aria-pressed', String(Sonido.activo)); }
  function alternarSonido() { Sonido.activo = !Sonido.activo; opciones.sonido = Sonido.activo; guardarOpciones(); Sonido.iniciar(); pintarSonido(); return Sonido.activo; }
  pintarSonido();
  bSonido.addEventListener('click', alternarSonido);
  bPausa.addEventListener('click', () => { if (estado === 'jugando') pausar(); else if (estado === 'pausa') reanudar(); });
  bPantalla.addEventListener('click', () => {
    const el = document.documentElement;
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    } catch (e) { /* no disponible */ }
  });

  // ---------- Estado del juego ----------
  let estado = 'titulo';   // titulo · inicio · jugando · pregunta · mentor · pausa · fin · completo
  let J = null, nivel = null, reloj = 0;
  // Pistas (poder de Montessori): se guardan en este navegador y sirven en cualquier mundo
  let pistas = 0;
  try { pistas = Math.min(3, parseInt(localStorage.getItem('sds-pistas') || '0', 10) || 0); } catch (e) { /* sin almacenamiento */ }
  function guardarPistas() { try { localStorage.setItem('sds-pistas', String(pistas)); } catch (e) { /* sin almacenamiento */ } }
  function sumarPista() { pistas = Math.min(3, pistas + 1); guardarPistas(); }
  function usarPista() { pistas = Math.max(0, pistas - 1); guardarPistas(); }

  // Colectivo (poder de Makarenko): un compañero acompaña a Ale desde el inicio de cada mundo
  let colectivo = false;
  try { colectivo = localStorage.getItem('sds-colectivo') === '1'; } catch (e) { /* sin almacenamiento */ }
  function ganarColectivo() { colectivo = true; try { localStorage.setItem('sds-colectivo', '1'); } catch (e) { /* sin almacenamiento */ } }

  function nuevoJuego(n) {
    nivel = Niveles.crear(n || nivel.mundo);
    J = {
      mapa: nivel.mapa.map(r => r.slice()), W: nivel.ancho, H: nivel.alto,
      ent: [], items: [], proy: [], part: [], golpes: [], crece: [],
      puntos: 0, ideas: 0, animo: 3, maxAnimo: 5, gis: false, compas: colectivo ? 1 : 0, estela: [], balsas: [],
      mentorHecho: false, mentorEnCurso: false, completo: false, frames: 0, cam: 0
    };
    // Ale mide un bloque y medio de alto (22 unidades) con el estilo nuevo.
    const y0 = (nivel.inicio.y + 1) * T + OFFY - ALTO_ALE;
    J.checkpoint = { x: nivel.inicio.x * T + 3, y: y0 };
    J.jug = { x: J.checkpoint.x, y: y0, w: 10, h: ALTO_ALE, vx: 0, vy: 0, suelo: false, dir: 1, coyote: 0, buffer: 0, inv: 0, anim: 0 };
    nivel.entidades.forEach(d => J.ent.push(crearEntidad(d)));
    J.balsas = J.ent.filter(e => e.tipo === 'balsa');
    Preguntas.reiniciar();
  }

  function crearEntidad(d) {
    const base = (d.y + 1) * T + OFFY, px = d.x * T;
    switch (d.tipo) {
      case 'cerdo': case 'loro': case 'regla': {
        // El comportamiento depende del tipo; el dibujo, del mundo (p. ej., en Roma el "cerdo" es el pupitre clavado)
        const arte = (nivel.enemigos && nivel.enemigos[d.tipo]) || d.tipo, [w, h] = DIM[arte];
        if (d.tipo === 'cerdo') return { tipo: 'cerdo', arte, x: px + (16 - w) / 2, y: base - h, w, h, vx: -0.45, vy: 0, vivo: true, activo: false };
        if (d.tipo === 'loro') return { tipo: 'loro', arte, x0: px, y0: d.y * T + OFFY, x: px, y: d.y * T + OFFY, w, h, t: 0, dir: -1, vivo: true, activo: false };
        return { tipo: 'regla', arte, x: px + (16 - w) / 2, y: base - h, w, h, vx: 0, vy: 0, espera: 60, vivo: true, activo: false };
      }
      case 'bandera': return { tipo: 'bandera', x: px + 6, y: base - 32, tomada: false };
      case 'letrero': return { tipo: 'letrero', x: px, y: base, texto: d.texto };
      case 'colono': return { tipo: 'colono', x: px + 3, y: base - 14, w: 10, h: 14, unido: false };
      case 'fila': return { tipo: 'fila', x: px + 8, y: base };
      case 'animador': return { tipo: 'animador', x: px + 8, y: base, autor: d.autor };
      case 'balsa': return { tipo: 'balsa', x0: px - 24, x: px - 24, y: base - 2, w: 48, h: 6, amp: 24, fase: d.fase || 0, dx: 0 };
      case 'mentor': return { tipo: 'mentor', x: px + 2, y: base - 16, w: 12, h: 16, autor: d.autor };
      case 'meta': return { tipo: 'meta', x: px + 6, y: base - 56 };
      default: return { tipo: 'nada' };
    }
  }

  // ---------- Colisiones con el escenario ----------
  function solido(tx, ty) {
    if (tx < 0 || tx >= J.W) return true;
    if (ty < 0 || ty >= J.H) return false;
    return SOLIDOS.has(J.mapa[ty][tx]);
  }
  const filaDe = py => Math.floor((py - OFFY) / T);
  function moverX(o) {
    o.chocoX = false;
    if (!o.vx) return;
    o.x += o.vx;
    const t0 = filaDe(o.y), t1 = filaDe(o.y + o.h - 1);
    if (o.vx > 0) {
      const tx = Math.floor((o.x + o.w - 1) / T);
      for (let ty = t0; ty <= t1; ty++) if (solido(tx, ty)) { o.x = tx * T - o.w; o.vx = 0; o.chocoX = true; return; }
    } else {
      const tx = Math.floor(o.x / T);
      for (let ty = t0; ty <= t1; ty++) if (solido(tx, ty)) { o.x = (tx + 1) * T; o.vx = 0; o.chocoX = true; return; }
    }
  }
  function moverY(o) {
    o.suelo = false;
    o.y += o.vy;
    const tx0 = Math.floor(o.x / T), tx1 = Math.floor((o.x + o.w - 1) / T);
    if (o.vy > 0) {
      const ty = filaDe(o.y + o.h - 1);
      for (let tx = tx0; tx <= tx1; tx++) if (solido(tx, ty)) { o.y = ty * T + OFFY - o.h; o.vy = 0; o.suelo = true; return null; }
    } else if (o.vy < 0) {
      const ty = filaDe(o.y), golpes = [];
      for (let tx = tx0; tx <= tx1; tx++) if (solido(tx, ty)) golpes.push(tx);
      if (golpes.length) { o.y = (ty + 1) * T + OFFY; o.vy = 0; return { ty, golpes }; }
    }
    return null;
  }
  const cruza = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ---------- Efectos visuales ----------
  function textoFlotante(s, x, y, color = '#FFFFFF') { J.part.push({ tipo: 'texto', s, x, y, vida: 50, color }); }
  function polvo(x, y) { for (let i = 0; i < 6; i++) J.part.push({ tipo: 'polvo', x, y, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 2, vida: 18 }); }

  function sumarIdeas(n) {
    for (let i = 0; i < n; i++) {
      J.ideas++;
      if (J.ideas % 50 === 0 && J.animo < J.maxAnimo) { J.animo++; Sonido.reproducir('poder'); textoFlotante('+1', J.jug.x, J.jug.y - 12, '#FFB3B5'); }
    }
  }

  // ---------- Jugadora ----------
  function moverBalsas() {
    J.balsas.forEach(b => { const nx = b.x0 + Math.sin(J.frames * 0.018 + b.fase) * b.amp; b.dx = nx - b.x; b.x = nx; });
  }
  function actualizarJugadora() {
    const p = J.jug, E = Entrada;
    if (p.balsa) p.x += p.balsa.dx;
    p.balsa = null;
    const acel = p.suelo ? 0.3 : 0.2, max = 2.0;
    if (E.izq && !E.der) { p.vx = Math.max(p.vx - acel, -max); p.dir = -1; }
    else if (E.der && !E.izq) { p.vx = Math.min(p.vx + acel, max); p.dir = 1; }
    else { const f = p.suelo ? 0.25 : 0.08; p.vx = p.vx > 0 ? Math.max(0, p.vx - f) : Math.min(0, p.vx + f); }

    if (E.pulsos.saltar) p.buffer = 7; else if (p.buffer > 0) p.buffer--;
    if (p.suelo) p.coyote = 6; else if (p.coyote > 0) p.coyote--;
    if (p.buffer > 0 && p.coyote > 0) { p.vy = -6.9; p.buffer = 0; p.coyote = 0; Sonido.reproducir('salto'); }
    if (!E.saltar && p.vy < -2.5) p.vy = -2.5;
    p.vy = Math.min(p.vy + G, MAX_CAIDA);

    moverX(p);
    const m = J.ent.find(e => e.tipo === 'mentor');
    if (m && !J.mentorHecho && p.x + p.w > m.x - 6) { p.x = m.x - 6 - p.w; if (p.vx > 0) p.vx = 0; }
    const pieAntes = p.y + p.h;
    const golpe = moverY(p);
    if (golpe) golpearCabeza(golpe);
    if (!p.suelo && p.vy >= 0) for (const b of J.balsas) {
      if (pieAntes <= b.y + 1 && p.y + p.h >= b.y && p.x + p.w > b.x + 2 && p.x < b.x + b.w - 2) { p.y = b.y - p.h; p.vy = 0; p.suelo = true; p.balsa = b; break; }
    }
    // Rastro para que los compañeros sigan a Ale
    const ult = J.estela[0], cx = p.x + p.w / 2, cy = p.y + p.h;
    if (!ult || Math.abs(ult.x - cx) + Math.abs(ult.y - cy) > 1) { J.estela.unshift({ x: cx, y: cy, dir: p.dir, suelo: p.suelo }); if (J.estela.length > 90) J.estela.pop(); }
    J.quieta = Math.abs(p.vx) < 0.2 && p.suelo;

    if (E.pulsos.gis && J.gis && J.proy.length < 2) {
      J.proy.push({ x: p.dir > 0 ? p.x + p.w : p.x - 4, y: p.y + 5, w: 4, h: 4, vx: p.dir * 3.6, vy: -1.2, vida: 110, rebotes: 0 });
      Sonido.reproducir('gis');
    }

    // Focos de idea
    const tx0 = Math.floor(p.x / T), tx1 = Math.floor((p.x + p.w - 1) / T), ty0 = filaDe(p.y), ty1 = filaDe(p.y + p.h - 1);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (J.mapa[ty] && J.mapa[ty][tx] === 'o') { J.mapa[ty][tx] = '.'; sumarIdeas(1); J.puntos += 10; Sonido.reproducir('foco'); }
      if (J.mapa[ty] && J.mapa[ty][tx] === 'p') { J.mapa[ty][tx] = '.'; sumarPista(); J.puntos += 200; Sonido.reproducir('poder'); textoFlotante('+1 PISTA', p.x - 12, p.y - 10, '#FFD6E0'); }
    }
    if (p.inv > 0) p.inv--;
    p.anim += Math.abs(p.vx);
    if (p.y > VH + 24) caer();
  }

  function golpearCabeza({ ty, golpes }) {
    const p = J.jug, cx = p.x + p.w / 2;
    let tx = golpes[0];
    golpes.forEach(g => { if (Math.abs(g * T + 8 - cx) < Math.abs(tx * T + 8 - cx)) tx = g; });
    if (ty < 0 || tx < 0 || tx >= J.W) return;
    const c = J.mapa[ty][tx];
    J.golpes.push({ tx, ty, t: 10 });
    Sonido.reproducir('golpe');
    // Los obstáculos parados sobre el bloque golpeado salen volando
    J.ent.forEach(e => {
      if (ENEMIGOS.has(e.tipo) && e.vivo && Math.abs(e.y + e.h - (ty * T + OFFY)) < 3 && e.x + e.w > tx * T && e.x < tx * T + T) derrotar(e);
    });
    if (BLOQUES_PREGUNTA.has(c)) { J.mapa[ty][tx] = 'U'; abrirPregunta(c, tx, ty); }
  }

  function abrirPregunta(tipo, tx, ty) {
    estado = 'pregunta';
    const premio = tipo === 'g' ? 'el poder Gis. Lánzalo con la tecla X (o el botón GIS) para detener obstáculos.'
      : tipo === 'h' ? 'un corazón: +1 de ánimo.' : tipo === 'e' ? 'una escalera café hacia una zona alta.' : '3 focos de idea.';
    const q = Preguntas.siguiente();
    const etiqueta = `MUNDO ${nivel.mundo} · ${nivel.tema === 'roma' ? 'CAJA DE MATERIAL' : 'BLOQUE-LIBRO'}`;
    Preguntas.mostrar(q, { etiqueta, premio, tiempo: opciones.tiempo, mentor: nivel.mentor, pistas, usarPista }).then(ok => {
      Interfaz.cerrar();
      if (ok) {
        J.puntos += 500;
        const x = tx * T, y = ty * T + OFFY;
        if (tipo === 'e') {
          const esc = nivel.escaleras.find(s => s.bloque[0] === tx && s.bloque[1] === ty);
          if (esc) { J.crece = esc.pasos.slice(); J.creceReloj = 0; textoFlotante('¡ESCALERA!', x - 8, y - 12, '#FFD977'); }
        } else if (tipo === 'g' || tipo === 'h') J.items.push({ clase: tipo === 'g' ? 'gis' : 'corazon', x: x + 2, y, yMeta: y - 14, w: 12, h: 12 });
        else { for (let i = 0; i < 3; i++) J.part.push({ tipo: 'foco', x: x + 4, y: y - 6, vx: (i - 1) * 0.6, vy: -3.2 - i * 0.4, vida: 34 }); sumarIdeas(3); Sonido.reproducir('foco'); }
      }
      Entrada.limpiar();
      estado = 'jugando';
    });
  }

  function danar() {
    const p = J.jug;
    if (p.inv > 0) return;
    if (J.compas > 0) {
      J.compas--; p.inv = 100; Sonido.reproducir('pisar'); polvo(p.x, p.y + 8);
      textoFlotante('¡TE CUBRO!', p.x - 18, p.y - 12, '#FFE6B0');
      return;
    }
    if (J.gis) J.gis = false; else J.animo--;
    p.inv = 100; Sonido.reproducir('dano');
    if (J.animo <= 0) perder();
  }
  function caer() {
    J.animo--; Sonido.reproducir('dano');
    if (J.animo <= 0) { perder(); return; }
    const p = J.jug;
    p.x = J.checkpoint.x; p.y = J.checkpoint.y; p.vx = 0; p.vy = 0; p.inv = 90;
  }
  function derrotar(e) {
    e.vivo = false; J.puntos += 100;
    polvo(e.x + e.w / 2, e.y + e.h / 2);
    textoFlotante('+100', e.x, e.y - 6);
  }

  // ---------- Obstáculos ----------
  function actualizarEntidades() {
    const p = J.jug;
    J.ent.forEach(e => {
      if (!ENEMIGOS.has(e.tipo) || !e.vivo) return;
      if (!e.activo && Math.abs(e.x - (J.cam + VW / 2)) < VW / 2 + 48) e.activo = true;
      if (!e.activo) return;
      if (e.tipo === 'cerdo') {
        e.vy = Math.min(e.vy + G, MAX_CAIDA);
        const v = e.vx; moverX(e); if (e.chocoX) e.vx = -v;
        moverY(e);
        if (e.suelo) {
          const frente = e.vx < 0 ? e.x - 1 : e.x + e.w;
          if (!solido(Math.floor(frente / T), filaDe(e.y + e.h + 1))) e.vx = -e.vx;
        }
        if (e.y > VH + 40) e.vivo = false;
      } else if (e.tipo === 'loro') {
        e.t++;
        const nx = e.x0 + Math.sin(e.t * 0.02) * 44;
        e.dir = nx < e.x ? -1 : 1; e.x = nx;
        e.y = e.y0 + Math.sin(e.t * 0.08) * 8;
      } else if (e.tipo === 'regla') {
        e.vy = Math.min(e.vy + G, MAX_CAIDA);
        moverY(e);
        if (e.suelo && --e.espera <= 0) { e.vy = -5.2; e.espera = 70 + Math.floor(Math.random() * 40); }
      }
      if (cruza(p, e)) {
        if (p.vy > 0 && p.y + p.h - e.y < 9) { derrotar(e); p.vy = Entrada.saltar ? -6 : -4; Sonido.reproducir('pisar'); }
        else danar();
      }
    });

    // Gis lanzado
    J.proy.forEach(g => {
      g.vy += 0.25;
      moverX(g); if (g.chocoX) g.vida = 0;
      moverY(g); if (g.suelo) { g.vy = -2.8; if (++g.rebotes > 3) g.vida = 0; }
      if (--g.vida <= 0) return;
      J.ent.forEach(e => { if (ENEMIGOS.has(e.tipo) && e.vivo && g.vida > 0 && cruza(g, e)) { derrotar(e); g.vida = 0; Sonido.reproducir('pisar'); } });
    });
    J.proy = J.proy.filter(g => g.vida > 0 && g.y < VH + 20);

    // Premios que salen de los bloques
    // (suben del bloque y luego caminan hacia la jugadora, como un objeto que rueda)
    J.items.forEach(it => {
      if (!it.libre) {
        it.y -= 1;
        if (it.y <= it.yMeta) { it.libre = true; it.vx = (p.x + p.w / 2 < it.x + it.w / 2) ? -0.7 : 0.7; it.vy = 0; }
        return;
      }
      it.vy = Math.min(it.vy + G, MAX_CAIDA);
      const v = it.vx; moverX(it); if (it.chocoX) it.vx = -v;
      moverY(it);
      if (it.y > VH + 20) it.tomado = true;
      else if (cruza(p, it)) {
        it.tomado = true; Sonido.reproducir('poder');
        if (it.clase === 'gis') { J.gis = true; textoFlotante('GIS', it.x, it.y - 8, '#FFD977'); }
        else { J.animo = Math.min(J.maxAnimo, J.animo + 1); textoFlotante('+1', it.x, it.y - 8, '#FFB3B5'); }
      }
    });
    J.items = J.items.filter(it => !it.tomado);

    // Punto de control, mentor y meta
    J.ent.forEach(e => {
      if (e.tipo === 'colono' && !e.unido && cruza(p, e)) {
        e.unido = true; J.compas = Math.min(5, J.compas + 1); Sonido.reproducir('poder');
        textoFlotante('¡ME UNO!', e.x - 10, e.y - 10, '#FFE6B0');
      }
      if (e.tipo === 'bandera' && !e.tomada && p.x > e.x) {
        e.tomada = true; J.checkpoint = { x: e.x, y: (8 + 1) * T + OFFY - ALTO_ALE };
        Sonido.reproducir('foco'); textoFlotante('PUNTO DE CONTROL', e.x - 56, e.y - 12, '#FFD977');
      }
      if (e.tipo === 'mentor' && !J.mentorHecho && !J.mentorEnCurso && p.suelo && p.x + p.w >= e.x - 8) encuentroMentor(e);
      if (e.tipo === 'meta' && J.mentorHecho && !J.completo && p.x + p.w >= e.x) { if (nivel.jefe && !J.jefeHecho) iniciarJefe(); else completar(); }
    });

    J.golpes.forEach(b => b.t--); J.golpes = J.golpes.filter(b => b.t > 0);
    // Escalera café: aparece una columna cada pocos cuadros
    if (J.crece.length && ++J.creceReloj % 9 === 0) {
      const [cx, top] = J.crece.shift();
      for (let ty = top; ty <= 8; ty++) if (J.mapa[ty][cx] === '.' || J.mapa[ty][cx] === 'o') J.mapa[ty][cx] = 'C';
      J.golpes.push({ tx: cx, ty: top, t: 10 });
      Sonido.reproducir('golpe');
    }
    actualizarParticulas();
  }
  function actualizarParticulas() {
    J.part.forEach(q => {
      q.vida--;
      if (q.tipo === 'texto') q.y -= 0.4;
      else { q.x += q.vx; q.y += q.vy; q.vy += 0.22; }
    });
    J.part = J.part.filter(q => q.vida > 0);
  }

  // ---------- Encuentro con el mentor ----------
  async function encuentroMentor(m) {
    const tx = nivel.textos;
    J.mentorEnCurso = true; estado = 'mentor'; Entrada.limpiar();
    J.jug.vx = 0;
    await Interfaz.dialogo({ autor: m.autor, etiqueta: 'ENCUENTRO CON EL MENTOR', titulo: tx.mentorNombre, texto: tx.saludo, boton: 'ESTOY LISTA ▶' });
    for (;;) {
      let ok = 0;
      for (let i = 0; i < 3; i++) {
        const q = Preguntas.siguiente();
        const etiqueta = `ENCUENTRO CON ${tx.mentorCorto.toUpperCase()} · ${i + 1} DE 3`;
        if (await Preguntas.mostrar(q, { etiqueta, premio: '', tiempo: opciones.tiempo, mentor: nivel.mentor, pistas, usarPista })) { ok++; J.puntos += 500; }
      }
      if (ok >= 2) {
        J.mentorHecho = true; Sonido.reproducir('poder');
        if (nivel.poder === 'pista') sumarPista();
        else if (nivel.poder === 'colectivo') { ganarColectivo(); J.compas = Math.min(5, J.compas + 1); }
        else J.animo = Math.min(J.maxAnimo, J.animo + 1);
        await Interfaz.dialogo({ autor: m.autor, etiqueta: 'ENCUENTRO CON EL MENTOR', titulo: '¡Muy bien!', texto: tx.exito(ok) });
        break;
      }
      await Interfaz.dialogo({ autor: m.autor, etiqueta: 'ENCUENTRO CON EL MENTOR', titulo: 'Casi lo logras', texto: tx.reintento(ok), boton: 'INTENTAR OTRA VEZ ▶' });
    }
    Interfaz.cerrar(); Entrada.limpiar();
    J.mentorEnCurso = false; estado = 'jugando';
  }

  // ---------- Fin del nivel ----------
  function formatoTiempo(frames) { const s = Math.floor(frames / 60); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function codigo(s) {
    let h = 0x811c9dc5;
    for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
    const h2 = Math.imul(h ^ 0x5bd1e995, 0x27d4eb2d) >>> 0;
    const a = (h.toString(36).toUpperCase() + '0000').slice(0, 4), b = (h2.toString(36).toUpperCase() + '0000').slice(0, 4);
    return a + '-' + b;
  }
  function datosPartida() {
    const st = Preguntas.estadisticas;
    const fecha = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
    const d = { mundo: nivel.mundo, sello: nivel.sello, mentor: nivel.textos.mentorNombre,
      nombre: opciones.nombre || 'Estudiante', grupo: opciones.grupo, puntos: J.puntos, ideas: J.ideas, ok: st.ok, total: st.total,
      primerOk: st.primerOk, primerTotal: st.primerTotal, porAutor: st.porAutor, tiempo: formatoTiempo(J.frames), fecha };
    d.codigo = codigo([d.nombre, d.grupo, d.puntos, d.ok, d.total, d.fecha, 'SDS-M' + nivel.mundo].join('|'));
    return d;
  }
  // ---------- Resultados guardados por mundo (para la constancia final) ----------
  function leerResultados() { try { return JSON.parse(localStorage.getItem('sds-resultados') || '{}'); } catch (e) { return {}; } }
  function guardarResultado(d) {
    const r = leerResultados();
    r[d.mundo] = { puntos: d.puntos, ok: d.ok, total: d.total, fecha: d.fecha, nombre: d.nombre };
    try { localStorage.setItem('sds-resultados', JSON.stringify(r)); } catch (e) { /* sin almacenamiento */ }
  }
  function datosConstancia() {
    const r = leerResultados();
    const mundos = Niveles.lista.map(m => { const nv = Niveles.crear(m.n); return { n: m.n, nombre: m.nombre, sello: nv.sello, r: r[m.n] || null }; });
    const total = mundos.reduce((a, m) => a + (m.r ? m.r.puntos : 0), 0);
    const fecha = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
    const nombre = opciones.nombre || 'Estudiante';
    return { nombre, grupo: opciones.grupo, mundos, total, fecha, completo: mundos.every(m => m.r),
      codigo: codigo([nombre, opciones.grupo, total, mundos.map(m => m.r ? m.r.ok + '/' + m.r.total : '-').join(','), fecha, 'SDS-FINAL'].join('|')) };
  }
  function volverAlInicio() { Interfaz.cerrar(); J = null; Entrada.limpiar(); estado = 'titulo'; }

  // ---------- Jefe final: la Gran Máquina Bancaria ----------
  const COLORES_CANDADO = ['pestalozzi', 'montessori', 'makarenko'];
  function cajaJefe(B) { return { x: B.x + 10, y: B.y - 86, w: 68, h: 86 }; }
  async function iniciarJefe() {
    estado = 'mentor'; Entrada.limpiar();
    await Interfaz.dialogo({ autor: 'makarenko', etiqueta: '¡CUIDADO!', titulo: 'Algo sale del almacén', texto: nivel.textos.jefeIntro, boton: '¡A ENFRENTARLA! ▶' });
    Interfaz.cerrar();
    const A = Niveles.arena();
    J.mapa = A.mapa.map(r => r.slice()); J.W = A.ancho; J.H = A.alto;
    J.ent = A.entidades.map(crearEntidad); J.balsas = []; J.items = []; J.proy = []; J.part = []; J.golpes = []; J.crece = []; J.estela = []; J.ataques = [];
    J.arena = true; J.cam = 0; J.gis = true;
    const p = J.jug; p.x = 40; p.y = (8 + 1) * T + OFFY - p.h; p.vx = 0; p.vy = 0; p.inv = 60; p.dir = 1;
    J.checkpoint = { x: 40, y: p.y };
    J.jefe = { x: 220, y: (8 + 1) * T + OFFY, dir: -1, modo: 'camina', abiertos: 0, ataque: null, aviso: 0, post: 0, sig: 120, n: 0, golpesGis: 0, aturdido: 0, t: 0, flash: 0, golpe: 0.95 };
    textoFlotante('¡TIENES GIS! TECLA X', 20, 70, '#FFD977');
    Entrada.limpiar(); estado = 'jugando';
  }
  function aturdir(B) {
    B.modo = 'aturdida'; B.aturdido = 360; B.ataque = null; B.aviso = 0; B.post = 0; B.golpesGis = 0; B.golpe = 0.95;
    Sonido.reproducir('golpe'); textoFlotante('¡ATURDIDA! TOCA UN CANDADO', B.x - 40, B.y - 104, '#FFD977');
  }
  function lanzarAtaque(B) {
    const extra = B.abiertos;
    if (B.ataque === 'monedas') {
      [[-1.4, -3.4], [-2.0, -3.9], [-2.6, -2.8], [-1.1, -4.4]].slice(0, 3 + (extra > 0 ? 1 : 0)).forEach(([vx, vy]) => J.ataques.push({ tipo: 'moneda', x: B.x + 20, y: B.y - 40, w: 8, h: 8, vx: vx - extra * 0.2, vy, vida: 260, botes: 0 }));
      Sonido.reproducir('foco');
    } else if (B.ataque === 'regla') {
      J.ataques.push({ tipo: 'onda', x: B.x - 12, y: B.y - 10, w: 14, h: 10, vx: -2.3 - extra * 0.3, vy: 0, vida: 240 });
      Sonido.reproducir('golpe');
    } else {
      J.ataques.push({ tipo: 'grito', x: B.x - 14, y: B.y - 22, w: 14, h: 14, vx: -2.1 - extra * 0.3, vy: 0, vida: 240 });
      textoFlotante('¡REPITE!', B.x - 10, B.y - 108, '#FFFFFF'); Sonido.reproducir('mal');
    }
  }
  function actualizarJefe() {
    const B = J.jefe, p = J.jug;
    B.t++; if (B.flash > 0) B.flash--;
    // Ataques en vuelo
    J.ataques.forEach(a => {
      a.vida--; a.x += a.vx;
      if (a.tipo === 'moneda') { a.vy += 0.16; a.y += a.vy; if (a.y + a.h >= (8 + 1) * T + OFFY) { a.y = (8 + 1) * T + OFFY - a.h; a.vy *= -0.45; a.vx *= 0.7; if (++a.botes > 2) a.vida = 0; } }
      if (a.tipo === 'grito' && solido(Math.floor((a.x + a.w / 2) / T), filaDe(a.y + a.h / 2))) { a.vida = 0; polvo(a.x, a.y + 6); }
      if (a.x < -20) a.vida = 0;
      if (a.vida > 0 && p.inv === 0 && cruza(p, a)) { a.vida = 0; danar(); }
    });
    J.ataques = J.ataques.filter(a => a.vida > 0);
    if (B.modo === 'rota') return;
    const hb = cajaJefe(B);
    if (B.modo === 'aturdida') {
      if (--B.aturdido <= 0) { B.modo = 'camina'; B.sig = 60; }
      else if (estado === 'jugando' && cruza(p, hb)) abrirCandado(B);
      return;
    }
    if (B.modo === 'golpeada') { if (--B.aturdido <= 0) { B.modo = 'camina'; B.sig = 70; } return; }
    // Camina y ataca
    if (!B.ataque) {
      B.x += B.dir * [0.45, 0.6, 0.75][B.abiertos];
      if (B.x < 128) { B.x = 128; B.dir = 1; } if (B.x > 222) { B.x = 222; B.dir = -1; }
      if (--B.sig <= 0) { B.ataque = ['monedas', 'regla', 'loro'][B.n++ % 3]; B.aviso = 45; }
    } else if (B.aviso > 0) {
      B.aviso--;
      if (B.ataque === 'regla') B.golpe = 0.95 + (45 - B.aviso) / 45 * 1.5;
      if (B.aviso === 0) { lanzarAtaque(B); B.post = 30; if (B.ataque === 'regla') B.golpe = 0.6; }
    } else if (--B.post <= 0) { B.ataque = null; B.golpe = 0.95; B.sig = [170, 140, 110][B.abiertos]; }
    // Contacto: salto encima = aturdir; de lado = golpe a Ale
    if (p.inv === 0 && cruza(p, hb)) {
      if (p.vy > 0 && p.y + p.h - hb.y < 14) { aturdir(B); p.vy = -6; Sonido.reproducir('pisar'); }
      else { danar(); p.vx = -3; p.x = Math.max(0, p.x - 8); }
    }
    // Gis: tres impactos la aturden
    J.proy.forEach(g => { if (g.vida > 0 && cruza(g, hb)) { g.vida = 0; B.flash = 10; B.golpesGis++; Sonido.reproducir('golpe'); if (B.golpesGis >= 3) aturdir(B); } });
  }
  function abrirCandado(B) {
    estado = 'pregunta'; Entrada.limpiar();
    const n = B.abiertos + 1, q = Preguntas.deMundo(n);
    Preguntas.mostrar(q, { etiqueta: `CANDADO ${n} DE 3 · MUNDO ${n}`, premio: 'abrir el candado ' + n + '.', tiempo: opciones.tiempo, mentor: COLORES_CANDADO[n - 1], pistas, usarPista }).then(ok => {
      Interfaz.cerrar(); Entrada.limpiar();
      const p = J.jug; p.x = Math.max(8, B.x - 40); p.vx = 0; p.inv = 70;
      if (ok) {
        B.abiertos++; J.puntos += 1000; B.flash = 20;
        textoFlotante('¡CANDADO ABIERTO!', B.x - 20, B.y - 104, '#FFD977');
        if (B.abiertos >= 3) romperJefe(B); else { B.modo = 'golpeada'; B.aturdido = 50; }
      } else { B.modo = 'camina'; B.sig = 90; }
      estado = 'jugando';
    });
  }
  function romperJefe(B) {
    B.modo = 'rota'; J.jefeHecho = true; J.ataques = [];
    J.puntos += 3000; sumarIdeas(20); Sonido.reproducir('meta');
    for (let i = 0; i < 26; i++) J.part.push({ tipo: 'foco', x: B.x + 20 + Math.random() * 50, y: B.y - 60 - Math.random() * 30, vx: (Math.random() - 0.5) * 3, vy: -3 - Math.random() * 3, vida: 70 + Math.random() * 40 });
    for (let i = 0; i < 16; i++) polvo(B.x + Math.random() * 80, B.y - Math.random() * 80);
    setTimeout(finalDelJuego, 2600);
  }
  async function finalDelJuego() {
    J.completo = true; estado = 'completo';
    J.puntos += J.animo * 200;
    await Interfaz.dialogo({ autor: 'makarenko', etiqueta: 'FIN DEL JUEGO', titulo: '¡Lo lograste, Ale!', texto: nivel.textos.jefeFin, boton: 'VER RESULTADOS ▶' });
    const d = datosPartida(); guardarResultado(d);
    Interfaz.resultados(d, reiniciarMundo, null, () => Interfaz.constancia(datosConstancia(), volverAlInicio));
  }

  function completar() {
    J.completo = true; estado = 'completo';
    J.puntos += J.animo * 200;
    textoFlotante('BONO ' + J.animo * 200, J.jug.x - 20, J.jug.y - 14, '#FFD977');
    Sonido.reproducir('meta');
    const sig = nivel.mundo + 1;
    setTimeout(() => { const d = datosPartida(); guardarResultado(d); Interfaz.resultados(d, reiniciarMundo, Niveles.existe(sig) ? () => iniciarMundo(sig) : null); }, 1400);
  }
  function perder() {
    estado = 'fin';
    const st = Preguntas.estadisticas;
    setTimeout(() => Interfaz.finJuego({ ok: st.ok, total: st.total, ideas: J.ideas }, J.arena ? reintentarJefe : reiniciarMundo), 600);
  }
  function reiniciarMundo() { Interfaz.cerrar(); nuevoJuego(nivel.mundo); Entrada.limpiar(); estado = 'jugando'; }
  // Si Ale pierde todo el ánimo durante el jefe, vuelve a intentar la pelea (no todo el mundo)
  function reintentarJefe() { Interfaz.cerrar(); J.animo = 3; J.completo = false; J.jefeHecho = false; iniciarJefe(); }
  function pausar() {
    estado = 'pausa'; Entrada.limpiar();
    Interfaz.pausa({ continuar: reanudar, reiniciar: reiniciarMundo, sonido: Sonido.activo, alternarSonido });
  }
  function reanudar() { Interfaz.cerrar(); Entrada.limpiar(); estado = 'jugando'; }

  async function iniciarMundo(n) {
    estado = 'intro'; Interfaz.cerrar();
    opciones.mundo = n; guardarOpciones();
    try { await Preguntas.cargar(n); } catch (e) { /* se usa lo que haya */ }
    nuevoJuego(n);
    await Interfaz.dialogo({ autor: 'ale', etiqueta: 'MUNDO ' + n, titulo: nivel.nombre, texto: nivel.textos.intro, boton: '¡A JUGAR! ▶' });
    Interfaz.cerrar(); Entrada.limpiar();
    estado = 'jugando';
  }
  async function abrirInicio() {
    if (estado !== 'titulo') return;
    estado = 'inicio';
    const o = await Interfaz.inicio(opciones, Niveles.lista);
    Object.assign(opciones, o); guardarOpciones();
    Sonido.activo = opciones.sonido; Sonido.iniciar(); pintarSonido();
    iniciarMundo(opciones.mundo);
  }

  // ---------- Dibujo (estilo 64: imágenes en caché a la resolución de la pantalla) ----------
  // Elige la imagen de cada bloque según el mundo (y, en Roma, si es la calle o el aula)
  function nombreTile(c, tx, ty) {
    const roma = nivel.tema === 'roma', dentro = Sprites.esInterior(nivel, tx);
    if (nivel.tema === 'ucrania') {
      const plat = x => x >= 0 && x < J.W && J.mapa[ty][x] === '=';
      if (c === 'G') return 'camino' + ((ty > 0 && J.mapa[ty - 1][tx] === 'G') ? 'B' : 'A') + (tx % 4);
      if (c === 'W') return (ty > 0 && J.mapa[ty - 1][tx] === 'W') ? 'aguaB' : 'aguaA';
      if (c === 'B') return tx >= nivel.patioDesde ? 'lena' : 'paca';
      if (c === '=') { const i = plat(tx - 1), d = plat(tx + 1); return 'tablon' + (i && d ? 'M' : (!i && d ? 'I' : (i && !d ? 'D' : 'S'))); }
      if (BLOQUES_PREGUNTA.has(c)) return 'troncoQ';
      if (c === 'U') return 'troncoU';
      return null;
    }
    const plat = x => x >= 0 && x < J.W && J.mapa[ty][x] === '=';
    if (c === 'G') {
      const arriba = !(ty > 0 && J.mapa[ty - 1][tx] === 'G');
      if (!roma) return (arriba ? 'pasto' : 'tierra') + (tx % 4);
      return (dentro ? 'duela' : 'adoquin') + (arriba ? 'A' : 'B') + (tx % 4);
    }
    if (c === 'B') return roma ? (dentro ? 'estante' : 'fruta') : 'librero';
    if (c === '=') {
      const i = plat(tx - 1), d = plat(tx + 1), k = i && d ? 'M' : (!i && d ? 'I' : (i && !d ? 'D' : 'S'));
      return (roma ? (dentro ? 'barras' : 'toldo') : 'pila') + k;
    }
    if (BLOQUES_PREGUNTA.has(c)) return roma ? 'caja' : 'pregunta';
    if (c === 'U') return roma ? 'cajaUsada' : 'usado';
    if (c === 'T') return 'torre';
    if (c === 'C') return 'cafe';
    return null;
  }
  function dibujarNivel(t) {
    const cam = J.cam, S = Sprites;
    S.fondo(ctx, cam, J.arena ? { tema: 'arena' } : nivel, t);

    const tx0 = Math.max(0, Math.floor(cam / T) - 1), tx1 = Math.min(J.W - 1, tx0 + 22);
    const esSuelo = (tx, ty) => tx < 0 || tx >= J.W || J.mapa[ty][tx] === 'G';
    for (let ty = 0; ty < J.H; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const c = J.mapa[ty][tx]; if (c === '.') continue;
      const x = tx * T - cam;
      let y = ty * T + OFFY;
      const gb = J.golpes.find(b => b.tx === tx && b.ty === ty);
      if (gb) y -= Math.sin((10 - gb.t) / 10 * Math.PI) * 4;
      if (c === 'o') { S.dibujar(ctx, 'foco', x + 8, y + 7 + Math.sin(reloj * 0.08 + tx) * 1.2); continue; }
      if (c === 'p') { S.dibujar(ctx, 'pista', x + 8, y + 8 + Math.sin(reloj * 0.08) * 1.5); continue; }
      const nombre = nombreTile(c, tx, ty);
      if (nombre) S.dibujar(ctx, nombre, x, y);
      if (c === 'G') {
        if (!esSuelo(tx - 1, ty)) { ctx.fillStyle = 'rgba(20,12,6,.35)'; ctx.fillRect(x, y + 2, 1.2, T); }
        if (!esSuelo(tx + 1, ty)) { ctx.fillStyle = 'rgba(20,12,6,.35)'; ctx.fillRect(x + T - 1.2, y + 2, 1.2, T); }
      }
    }
    // Hoyos: sombra en el fondo
    for (let tx = tx0; tx <= tx1; tx++) {
      if (J.mapa[9][tx] === '.' && J.mapa[10][tx] === '.') {
        const g = ctx.createLinearGradient(0, 152, 0, 180); g.addColorStop(0, 'rgba(40,28,18,0)'); g.addColorStop(1, 'rgba(14,9,6,.55)');
        ctx.fillStyle = g; ctx.fillRect(tx * T - cam, 152, T, 28);
      }
    }

    J.ent.forEach(e => {
      const x = e.x - cam;
      if (x < -80 || x > VW + 60) return;
      if (e.tipo === 'cerdo' && e.vivo) S.dibujar(ctx, e.arte + (Math.floor(reloj / 7) % 4), x + e.w / 2, e.y + e.h, e.vx > 0);
      else if (e.tipo === 'loro' && e.vivo) S.dibujar(ctx, e.arte + (Math.floor(reloj / 6) % 4), x + e.w / 2, e.y + e.h / 2, e.dir > 0);
      else if (e.tipo === 'regla' && e.vivo) S.dibujar(ctx, e.arte === 'reloj' ? 'reloj' + (e.vy < 0 || (e.suelo && e.espera < 20) ? Math.floor(reloj / 4) % 2 : 0) : 'regla', x + e.w / 2, e.y + e.h);
      else if (e.tipo === 'balsa') S.dibujar(ctx, 'balsa', x, e.y);
      else if (e.tipo === 'letrero') S.dibujar(ctx, 'letrero_' + e.texto, x + 6, e.y);
      else if (e.tipo === 'colono' && !e.unido) { S.dibujar(ctx, 'colono_quieto' + (Math.floor(reloj / 16) % 4), x + e.w / 2, e.y + e.h); S.globo(ctx, x - 10, e.y - 22 + Math.sin(reloj * 0.1) * 1.2, '¡Hola!', 1); }
      else if (e.tipo === 'animador') {
        S.dibujar(ctx, e.autor + '_quieto' + (Math.floor(reloj / 16 + e.x) % 4), x, e.y - Math.abs(Math.sin(reloj * 0.08 + e.x)) * 2, false);
        if (e.autor === 'montessori' && J.jefe && J.jefe.modo !== 'rota' && Math.floor(reloj / 240) % 2 === 0) S.globo(ctx, x - 14, e.y - 44, '¡Tú puedes, Ale!', 1);
      }
      else if (e.tipo === 'fila') S.dibujar(ctx, 'colono_quieto' + (Math.floor(reloj / 16 + e.x) % 4), x, e.y, true);
      else if (e.tipo === 'bandera' && nivel.tema === 'ucrania') S.dibujar(ctx, 'letrero_media', x, e.y + 32);
      else if (e.tipo === 'bandera') {
        if (nivel.tema === 'roma') S.dibujar(ctx, 'portal', x + 2, e.y + 32);
        else S.bandera(ctx, x, e.y, e.tomada);
      } else if (e.tipo === 'mentor') {
        S.dibujar(ctx, e.autor + '_quieto' + (Math.floor(reloj / 16) % 4), x + e.w / 2, e.y + e.h, true);
        if (!J.mentorHecho) S.globo(ctx, x - 42, e.y - 34 + Math.sin(reloj * 0.1) * 1.2, '¡Te espero, Ale!', -1);
      } else if (e.tipo === 'meta') S.meta(ctx, x, e.y, J.completo, reloj * 16);
    });

    J.items.forEach(it => {
      const x = it.x - cam;
      if (it.clase === 'gis') S.dibujar(ctx, 'gis', x + it.w / 2, it.y + it.h / 2);
      else S.dibujar(ctx, 'corazon', x + it.w / 2, it.y + it.h / 2 + 1);
    });
    if (J.jefe && J.arena) {
      const B = J.jefe;
      if (B.modo === 'rota') S.jefeRoto(ctx, B.x - cam, B.y);
      else {
        const temblor = (B.aviso > 0 && B.ataque !== 'regla') || B.modo === 'golpeada' ? Math.sin(reloj * 1.7) * 1.4 : 0;
        if (B.flash > 0 && Math.floor(B.flash / 3) % 2) ctx.globalAlpha = 0.55;
        S.jefe(ctx, B.x - cam + temblor, B.y, reloj * 16, { abiertos: B.abiertos, modo: B.modo === 'aturdida' ? 'aturdida' : 'normal', golpe: B.golpe });
        ctx.globalAlpha = 1;
      }
      (J.ataques || []).forEach(a => S.ataqueJefe(ctx, { tipo: a.tipo, x: a.x - cam, y: a.y, w: a.w, h: a.h }, reloj * 16));
    }
    J.proy.forEach(g => S.proyectil(ctx, g.x - cam, g.y));

    const p = J.jug;
    for (let i = J.compas; i >= 1; i--) {
      const r = J.estela[Math.min(J.estela.length - 1, i * 9)];
      if (!r) continue;
      const clave = !r.suelo ? 'colono_salto' : (!J.quieta ? 'colono_camina' + (Math.floor(reloj / 5 + i) % 8) : 'colono_quieto' + (Math.floor(reloj / 16 + i) % 4));
      S.dibujar(ctx, clave, r.x - cam, r.y, r.dir < 0);
    }
    if (!(p.inv > 0 && Math.floor(p.inv / 4) % 2)) {
      const clave = !p.suelo ? 'ale_salto'
        : (Math.abs(p.vx) > 0.2 ? 'ale_camina' + (Math.floor(p.anim / 4) % 8) : 'ale_quieto' + (Math.floor(reloj / 16) % 4));
      S.dibujar(ctx, clave, p.x + p.w / 2 - cam, p.y + p.h, p.dir < 0);
    }

    J.part.forEach(q => {
      if (q.tipo === 'texto') S.texto(ctx, q.s, q.x - cam, q.y, 7, q.color);
      else if (q.tipo === 'foco') S.dibujar(ctx, 'foco', q.x - cam + 4, q.y + 5);
      else S.polvo(ctx, q.x - cam, q.y, Math.min(1, q.vida / 12));
    });
    S.hud(ctx, { animo: J.animo, ideas: J.ideas, gis: J.gis, pistas, compas: J.compas, puntos: J.puntos, mundo: 'MUNDO ' + nivel.id, nombre: nivel.nombre, jefe: J.arena && J.jefe ? { abiertos: J.jefe.abiertos } : null });
    if (J.jefeHecho && J.arena) S.texto(ctx, '¡LO LOGRASTE!', 160, 64, 20, '#FFD977', 'center');
  }

  // ---------- Bucle principal ----------
  function actualizar() {
    reloj++;
    if (J && estado === 'jugando') {
      J.frames++;
      moverBalsas();
      actualizarJugadora();
      if (estado === 'jugando' || estado === 'pregunta' || estado === 'mentor') actualizarEntidades();
      if (J.jefe && J.arena && estado === 'jugando') actualizarJefe();
      J.cam = Math.max(0, Math.min(J.W * T - VW, Math.round(J.jug.x + J.jug.w / 2 - 140)));
    } else if (J && (estado === 'completo' || estado === 'fin')) {
      actualizarParticulas();
      if (J.jefe && J.arena) J.jefe.t++;
    }
    Entrada.fin();
  }
  function dibujar(t) {
    const k = Sprites.K;
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (estado === 'titulo' || estado === 'inicio' || !J) Sprites.titulo(ctx, t, esTactil);
    else dibujarNivel(t);
  }
  let ultimo = performance.now(), acum = 0;
  function bucle(ahora) {
    acum += Math.min(100, ahora - ultimo); ultimo = ahora;
    while (acum >= PASO) { actualizar(); acum -= PASO; }
    dibujar(ahora);
    requestAnimationFrame(bucle);
  }

  // ---------- Tamaño de la pantalla ----------
  function ajustar() {
    const barra = document.getElementById('barra');
    const bh = barra ? barra.offsetHeight + 12 : 60;
    const vw = document.documentElement.clientWidth || innerWidth;
    const vh = (window.visualViewport && window.visualViewport.height) || innerHeight;
    const horizontal = vw > vh;
    let aw = vw - 36, ah = vh - bh - 36;
    if (esTactil && horizontal) aw -= 2 * 120;
    else if (esTactil) ah -= 170;
    const w = Math.max(200, Math.floor(Math.min(aw, ah * 16 / 9)));
    lienzo.style.width = w + 'px'; lienzo.style.height = Math.floor(w * 9 / 16) + 'px';
    // Resolución interna según el tamaño real en pantalla (2 a 3 píxeles por unidad del juego)
    const k = Math.max(2, Math.min(3, Math.round(w * (window.devicePixelRatio || 1) / VW)));
    if (k !== Sprites.K) { Sprites.preparar(k); lienzo.width = VW * k; lienzo.height = VH * k; }
  }
  window.addEventListener('resize', ajustar);
  window.addEventListener('orientationchange', ajustar);
  ajustar();

  // Cuando llega la tipografía, se vuelven a generar las imágenes que llevan texto (bloque "?", "UPN").
  const fuente = (document.fonts && document.fonts.load) ? document.fonts.load('800 16px Rubik') : Promise.resolve();
  fuente.catch(() => {}).then(() => { Sprites.preparar(Sprites.K, true); });
  requestAnimationFrame(bucle);

  // Acceso para pruebas automáticas
  window.__sds = { get estado() { return estado; }, get J() { return J; }, iniciarJefe: () => iniciarJefe() };
})();
