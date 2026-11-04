// Copia datos/preguntas.csv dentro de js/preguntas-respaldo.js.
// Así el juego funciona aunque se abra index.html con doble clic (sin servidor).
// Uso: node herramientas/generar-respaldo.js
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const csv = fs.readFileSync(path.join(raiz, 'datos', 'preguntas.csv'), 'utf8').replace(/^﻿/, '');
const js = "'use strict';\n/* Copia automática de datos/preguntas.csv. No edites este archivo: edita el CSV y vuelve a generarlo con\n   node herramientas/generar-respaldo.js */\nconst PREGUNTAS_RESPALDO = " + JSON.stringify(csv) + ';\n';
fs.writeFileSync(path.join(raiz, 'js', 'preguntas-respaldo.js'), js);
console.log('js/preguntas-respaldo.js actualizado (' + csv.split(/\r?\n/).filter(Boolean).length + ' líneas).');
