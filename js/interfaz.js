'use strict';
/* Saltos del Saber · Ventanas sobre el juego: inicio, diálogos, pausa, fin y resultados. */
const Interfaz = (() => {
  const capa = document.getElementById('capa');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function abrir(html) { capa.innerHTML = html; capa.hidden = false; capa.scrollTop = 0; return capa; }
  function cerrar() { capa.hidden = true; capa.innerHTML = ''; }
  function abierta() { return !capa.hidden; }

  // Diálogo con retrato. "texto" es HTML escrito en el propio juego (no viene de la persona usuaria).
  function dialogo({ autor, etiqueta = '', titulo, texto, boton = 'CONTINUAR ▶' }) {
    return new Promise(resolve => {
      abrir(`<div class="panel" role="dialog" aria-modal="true" aria-labelledby="d-titulo" tabindex="-1">
        <div class="quien"><canvas class="retrato" aria-hidden="true"></canvas>
          <div>${etiqueta ? `<div class="tag">${esc(etiqueta)}</div>` : ''}<b id="d-titulo">${esc(titulo)}</b></div></div>
        <div class="texto">${texto}</div>
        <button type="button" class="btn" id="b-dialogo">${esc(boton)}</button>
      </div>`);
      Sprites.retrato(capa.querySelector('canvas'), autor, 4);
      const b = capa.querySelector('#b-dialogo'); const t0 = performance.now();
      b.addEventListener('click', () => { if (performance.now() - t0 > 300) resolve(); });
      capa.querySelector('.panel').focus();
      setTimeout(() => b.focus(), 320);
    });
  }

  function inicio(op, totalPreguntas) {
    return new Promise(resolve => {
      abrir(`<form class="panel" id="f-inicio" tabindex="-1" aria-labelledby="i-titulo">
        <div class="tag">SALTOS DEL SABER · MUNDO 1</div>
        <h2 id="i-titulo">Antes de empezar</h2>
        <label class="campo">Tu nombre <input id="in-nombre" maxlength="40" autocomplete="name" value="${esc(op.nombre || '')}" placeholder="Nombre y apellido"></label>
        <label class="campo">Grupo (opcional) <input id="in-grupo" maxlength="20" value="${esc(op.grupo || '')}" placeholder="Ej. 1.º A"></label>
        <label class="check"><input type="checkbox" id="in-tiempo" ${op.tiempo ? 'checked' : ''}> Tiempo límite para responder (20 segundos)</label>
        <label class="check"><input type="checkbox" id="in-sonido" ${op.sonido ? 'checked' : ''}> Sonido</label>
        <table class="controles"><tbody>
          <tr><th>Moverse</th><td>← → o A / D</td></tr>
          <tr><th>Saltar</th><td>Espacio, ↑ o W</td></tr>
          <tr><th>Lanzar gis</th><td>X (cuando tienes el poder)</td></tr>
          <tr><th>Pausa</th><td>P o Esc</td></tr>
          <tr><th>Responder</th><td>Clic, toque o teclas 1 a 4</td></tr>
        </tbody></table>
        <p class="nota">Este mundo tiene ${totalPreguntas} preguntas sobre Comenio, Rousseau, Pestalozzi, Fröbel y conceptos básicos.</p>
        <button class="btn" type="submit">COMENZAR ▶</button>
      </form>`);
      const f = capa.querySelector('#f-inicio');
      f.addEventListener('submit', e => {
        e.preventDefault();
        resolve({
          nombre: capa.querySelector('#in-nombre').value.trim(),
          grupo: capa.querySelector('#in-grupo').value.trim(),
          tiempo: capa.querySelector('#in-tiempo').checked,
          sonido: capa.querySelector('#in-sonido').checked
        });
      });
      setTimeout(() => capa.querySelector('#in-nombre').focus(), 50);
    });
  }

  function pausa({ continuar, reiniciar, sonido, alternarSonido }) {
    abrir(`<div class="panel" role="dialog" aria-modal="true" aria-labelledby="p-titulo" tabindex="-1">
      <div class="resultado" id="p-titulo">PAUSA</div>
      <div class="botones">
        <button type="button" class="btn" id="b-cont">CONTINUAR ▶</button>
        <button type="button" class="btn sec" id="b-son">SONIDO: ${sonido ? 'SÍ' : 'NO'}</button>
        <button type="button" class="btn sec" id="b-rein">REINICIAR MUNDO</button>
      </div>
      <p class="nota">Golpea desde abajo los bloques-libro con “?” para responder preguntas. Salta sobre los obstáculos para quitarlos del camino.</p>
    </div>`);
    capa.querySelector('#b-cont').addEventListener('click', continuar);
    capa.querySelector('#b-rein').addEventListener('click', reiniciar);
    capa.querySelector('#b-son').addEventListener('click', e => { e.target.textContent = 'SONIDO: ' + (alternarSonido() ? 'SÍ' : 'NO'); });
    setTimeout(() => capa.querySelector('#b-cont').focus(), 50);
  }

  function filasAutores(porAutor) {
    const claves = Object.keys(porAutor);
    if (!claves.length) return '';
    return `<table class="por-autor"><thead><tr><th>Tema</th><th>Correctas</th></tr></thead><tbody>${
      claves.map(k => `<tr><td>${esc(Preguntas.nombreAutor(k))}</td><td>${porAutor[k].ok} de ${porAutor[k].total}</td></tr>`).join('')
    }</tbody></table>`;
  }

  function finJuego(d, repetir) {
    abrir(`<div class="panel" role="dialog" aria-modal="true" tabindex="-1">
      <div class="resultado no">TE QUEDASTE SIN ÁNIMO</div>
      <p>No pasa nada: equivocarse y volver a intentar también es aprender.</p>
      <p>En este intento respondiste bien <b>${d.ok} de ${d.total}</b> preguntas y juntaste <b>${d.ideas}</b> focos de idea.</p>
      <button type="button" class="btn" id="b-rep">INTENTAR DE NUEVO ▶</button>
    </div>`);
    capa.querySelector('#b-rep').addEventListener('click', repetir);
    setTimeout(() => capa.querySelector('#b-rep').focus(), 320);
  }

  function resultados(d, repetir) {
    abrir(`<div class="panel ancho" role="dialog" aria-modal="true" aria-labelledby="r-titulo" tabindex="-1">
      <div class="resultado ok" id="r-titulo">¡MUNDO 1 COMPLETADO!</div>
      <p>Obtuviste el <b>Sello de Yverdon</b>. Pestalozzi estaría orgulloso.</p>
      <dl class="datos">
        <div><dt>Nombre</dt><dd>${esc(d.nombre)}</dd></div>
        <div><dt>Grupo</dt><dd>${esc(d.grupo || '—')}</dd></div>
        <div><dt>Puntaje</dt><dd>${d.puntos}</dd></div>
        <div><dt>Respuestas correctas</dt><dd>${d.ok} de ${d.total}</dd></div>
        <div><dt>Correctas al primer intento</dt><dd>${d.primerOk} de ${d.primerTotal}</dd></div>
        <div><dt>Focos de idea</dt><dd>${d.ideas}</dd></div>
        <div><dt>Tiempo</dt><dd>${d.tiempo}</dd></div>
        <div><dt>Fecha</dt><dd>${esc(d.fecha)}</dd></div>
      </dl>
      ${filasAutores(d.porAutor)}
      <div class="codigo">Código de verificación<b>${d.codigo}</b></div>
      <p class="nota">Si tu docente lo solicita, toma una captura de esta pantalla y súbela a Classroom o Teams.</p>
      <button type="button" class="btn" id="b-rep">JUGAR DE NUEVO ▶</button>
    </div>`);
    capa.querySelector('#b-rep').addEventListener('click', repetir);
    setTimeout(() => capa.querySelector('.panel').focus(), 50);
  }

  return { abrir, cerrar, abierta, dialogo, inicio, pausa, finJuego, resultados };
})();
