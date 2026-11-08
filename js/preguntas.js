'use strict';
/* Saltos del Saber · Banco de preguntas y ventana de pregunta/retroalimentación.
   Las preguntas se leen de datos/preguntas.csv. Si el archivo no se puede leer
   (por ejemplo, al abrir index.html con doble clic), se usa la copia de js/preguntas-respaldo.js. */
const Preguntas = (() => {
  const SEGUNDOS = 20;
  const AUTORES = {
    concepto:   { nombre: 'Concepto clave', corto: 'Conceptos' },
    comenio:    { nombre: 'Juan Amós Comenio', corto: 'Comenio' },
    rousseau:   { nombre: 'Jean-Jacques Rousseau', corto: 'Rousseau' },
    pestalozzi: { nombre: 'Johann Heinrich Pestalozzi', corto: 'Pestalozzi' },
    froebel:    { nombre: 'Friedrich Fröbel', corto: 'Fröbel' },
    montessori: { nombre: 'María Montessori', corto: 'Montessori' },
    dewey:      { nombre: 'John Dewey', corto: 'Dewey' },
    decroly:    { nombre: 'Ovide Decroly', corto: 'Decroly' },
    freinet:    { nombre: 'Célestin Freinet', corto: 'Freinet' },
    vygotsky:   { nombre: 'Lev Vygotsky', corto: 'Vygotsky' },
    krupskaya:  { nombre: 'Nadezhda Krupskaya', corto: 'Krupskaya' },
    pistrak:    { nombre: 'Moisei Pistrak', corto: 'Pistrak' },
    makarenko:  { nombre: 'Antón Makarenko', corto: 'Makarenko' },
    freire:     { nombre: 'Paulo Freire', corto: 'Freire' },
    meirieu:    { nombre: 'Philippe Meirieu', corto: 'Meirieu' },
    mclaren:    { nombre: 'Peter McLaren', corto: 'McLaren' }
  };

  let todas = [], cola = [], stats = null;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normal = s => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '_');
  function barajar(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // Lee CSV separado por comas o por punto y coma (Excel en español a veces usa ;).
  function leerCSV(texto) {
    texto = texto.replace(/^﻿/, '');
    const primera = texto.split(/\r?\n/)[0] || '';
    const sep = (primera.split(';').length > primera.split(',').length) ? ';' : ',';
    const filas = []; let fila = [], campo = '', comillas = false;
    for (let i = 0; i < texto.length; i++) {
      const ch = texto[i];
      if (comillas) {
        if (ch === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else comillas = false; }
        else campo += ch;
      } else if (ch === '"') comillas = true;
      else if (ch === sep) { fila.push(campo); campo = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && texto[i + 1] === '\n') i++;
        fila.push(campo); filas.push(fila); fila = []; campo = '';
      } else campo += ch;
    }
    if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }
    return filas.filter(f => f.some(c => c.trim() !== ''));
  }

  function convertir(filas) {
    if (!filas.length) return [];
    const cab = filas[0].map(normal);
    const col = n => cab.indexOf(n);
    const idx = { mundo: col('mundo'), tipo: col('tipo'), autor: col('autor'), pregunta: col('pregunta'),
      a: col('opcion_a'), b: col('opcion_b'), c: col('opcion_c'), d: col('opcion_d'),
      correcta: col('correcta'), explicacion: col('explicacion'), fuente: col('fuente') };
    const lista = [];
    filas.slice(1).forEach((f, n) => {
      const v = k => (idx[k] >= 0 ? (f[idx[k]] || '').trim() : '');
      const opcionesTodas = [v('a'), v('b'), v('c'), v('d')];
      const opciones = opcionesTodas.filter(Boolean);
      const letra = v('correcta').toUpperCase();
      const pos = 'ABCD'.indexOf(letra) >= 0 ? 'ABCD'.indexOf(letra) : parseInt(letra, 10) - 1;
      const correcta = opcionesTodas[pos] ? opciones.indexOf(opcionesTodas[pos]) : -1;
      const mundo = parseInt(v('mundo'), 10);
      if (!v('pregunta') || opciones.length < 2 || correcta < 0 || !mundo) return;
      const tipo = normal(v('tipo'));
      lista.push({ id: n, mundo, tipo, autor: normal(v('autor')) || 'concepto', pregunta: v('pregunta'), opciones, correcta,
        explicacion: v('explicacion'), fuente: v('fuente'), vf: tipo.indexOf('verdadero') >= 0, vista: false });
    });
    return lista;
  }

  function decodificar(buf) {
    try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
    catch (e) { return new TextDecoder('windows-1252').decode(buf); }
  }

  async function cargar(mundo) {
    let lista = [], origen = 'respaldo';
    try {
      const r = await fetch('datos/preguntas.csv', { cache: 'no-store' });
      if (r.ok) { lista = convertir(leerCSV(decodificar(await r.arrayBuffer()))); origen = 'csv'; }
    } catch (e) { /* sin servidor: se usa la copia de respaldo */ }
    if (!lista.some(q => q.mundo === mundo) && typeof PREGUNTAS_RESPALDO === 'string') {
      lista = convertir(leerCSV(PREGUNTAS_RESPALDO)); origen = 'respaldo';
    }
    todas = lista.filter(q => q.mundo === mundo);
    reiniciar();
    return { total: todas.length, origen };
  }

  function reiniciar() {
    todas.forEach(q => { q.vista = false; });
    cola = barajar(todas);
    stats = { total: 0, ok: 0, primerTotal: 0, primerOk: 0, porAutor: {} };
  }

  let ultima = null;
  function siguiente() {
    if (!cola.length) cola = barajar(todas.filter(q => q !== ultima));
    if (!cola.length) cola = todas.slice();
    ultima = cola.shift();
    return ultima;
  }

  function registrar(q, ok) {
    stats.total++; if (ok) stats.ok++;
    if (!q.vista) { q.vista = true; stats.primerTotal++; if (ok) stats.primerOk++; }
    const a = stats.porAutor[q.autor] || (stats.porAutor[q.autor] = { ok: 0, total: 0 });
    a.total++; if (ok) a.ok++;
    if (!ok) cola.push(q);
  }

  function nombreAutor(clave) { return (AUTORES[clave] || { corto: clave }).corto; }

  // Muestra la pregunta; devuelve una promesa que se resuelve con true/false cuando la persona cierra la retroalimentación.
  function mostrar(q, op) {
    return new Promise(resolve => {
      const esConcepto = !AUTORES[q.autor] || q.autor === 'concepto';
      const retratoClave = esConcepto ? op.mentor : q.autor;
      const tituloTxt = esConcepto ? `${nombreAutor(op.mentor)} pregunta` :
        (q.autor === op.mentor ? `${nombreAutor(q.autor)} pregunta` : `Pregunta sobre ${AUTORES[q.autor].nombre}`);
      const orden = q.vf ? q.opciones.map((_, i) => i) : barajar(q.opciones.map((_, i) => i));
      const puedePista = !q.vf && q.opciones.length >= 4 && op.pistas > 0 && typeof op.usarPista === 'function';
      const raiz = Interfaz.abrir(`
        <div class="panel" role="dialog" aria-modal="true" aria-labelledby="q-texto" tabindex="-1">
          <div class="quien"><canvas class="retrato" aria-hidden="true"></canvas>
            <div><div class="tag">${esc(op.etiqueta)}</div><b>${esc(tituloTxt)}</b></div></div>
          <p id="q-texto" class="q-texto">${esc(q.pregunta)}</p>
          <div class="opciones">${orden.map((oi, k) => `<button type="button" class="opcion" data-oi="${oi}"><span>${k + 1}</span>${esc(q.opciones[oi])}</button>`).join('')}</div>
          ${puedePista ? `<button type="button" class="btn sec" id="b-pista">Usar pista (${op.pistas})</button>` : ''}
          ${op.tiempo ? '<div class="timer"><small>TIEMPO</small><i><b></b></i></div>' : ''}
          <p class="pista">Elige con el ratón, tocando la opción o con las teclas 1 a ${orden.length}.</p>
        </div>`);
      Sprites.retrato(raiz.querySelector('canvas'), retratoClave, 4);
      const panel = raiz.querySelector('.panel');
      const botones = Array.from(raiz.querySelectorAll('.opcion'));
      const t0 = performance.now();
      let listo = false, reloj = null;

      function elegir(oi, agotado) {
        if (listo) return;
        if (!agotado && performance.now() - t0 < 350) return; // evita respuestas accidentales al abrir
        listo = true; clearTimeout(reloj);
        document.removeEventListener('keydown', teclas, true);
        const ok = oi === q.correcta;
        registrar(q, ok);
        retroalimentar(q, ok, oi, agotado, op).then(() => resolve(ok));
      }
      function teclas(e) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= orden.length) { e.preventDefault(); e.stopPropagation(); if (!botones[n - 1].disabled) elegir(orden[n - 1], false); return; }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const i = botones.indexOf(document.activeElement);
          const j = e.key === 'ArrowDown' ? (i + 1) % botones.length : (i <= 0 ? botones.length - 1 : i - 1);
          botones[j].focus();
        }
      }
      botones.forEach(b => b.addEventListener('click', () => elegir(+b.dataset.oi, false)));
      // Pista (poder de Montessori): tacha dos opciones incorrectas
      const bp = raiz.querySelector('#b-pista');
      if (bp) bp.addEventListener('click', () => {
        if (listo || performance.now() - t0 < 350) return;
        barajar(botones.filter(b => +b.dataset.oi !== q.correcta)).slice(0, 2).forEach(b => { b.classList.add('tachada'); b.disabled = true; });
        bp.remove(); op.usarPista();
        const libre = botones.find(b => !b.disabled); if (libre) libre.focus();
      });
      document.addEventListener('keydown', teclas, true);
      if (op.tiempo) {
        raiz.querySelector('.timer b').style.animationDuration = SEGUNDOS + 's';
        reloj = setTimeout(() => elegir(-1, true), SEGUNDOS * 1000);
      }
      panel.focus();
    });
  }

  function retroalimentar(q, ok, oi, agotado, op) {
    return new Promise(resolve => {
      Sonido.reproducir(ok ? 'bien' : 'mal');
      const cab = ok
        ? '<div class="resultado ok">¡CORRECTO!<br>+500 PUNTOS</div>'
        : `<div class="resultado no">${agotado ? 'SE ACABÓ EL TIEMPO' : 'CASI...'}</div>`;
      const detalle = ok ? '' :
        `<p><b>La respuesta correcta es:</b> ${esc(q.opciones[q.correcta])}.</p>` +
        (oi >= 0 ? `<p class="elegida">Elegiste: ${esc(q.opciones[oi])}.</p>` : '');
      const premio = ok && op.premio ? `<p class="premio"><b>Obtienes:</b> ${esc(op.premio)}</p>` : '';
      const nota = ok ? '' : '<p class="nota">No pierdes ánimo. Esta pregunta volverá más adelante.</p>';
      const raiz = Interfaz.abrir(`
        <div class="panel" role="dialog" aria-modal="true" aria-live="polite" tabindex="-1">
          ${cab}${detalle}
          ${q.explicacion ? `<p>${esc(q.explicacion)}</p>` : ''}
          ${premio}${nota}
          ${q.fuente ? `<div class="fuente">Fuente: ${esc(q.fuente)}</div>` : ''}
          <button type="button" class="btn" id="b-seguir">${ok ? 'CONTINUAR' : 'SEGUIR JUGANDO'} ▶</button>
        </div>`);
      const b = raiz.querySelector('#b-seguir');
      const t0 = performance.now();
      b.addEventListener('click', () => { if (performance.now() - t0 > 300) resolve(); });
      raiz.querySelector('.panel').focus();
      setTimeout(() => b.focus(), 320);
    });
  }

  return { cargar, reiniciar, siguiente, mostrar, nombreAutor, AUTORES, esc,
    get estadisticas() { return stats; }, get total() { return todas.length; } };
})();
