'use strict';
/* Saltos del Saber · Mapas de los niveles.
   El mapa es una cuadrícula de 11 filas (0 = arriba). Las filas 9 y 10 son el suelo.
   Símbolos:  G suelo · B librero · = plataforma de libros · o foco de idea
              ? bloque-libro con pregunta (premio: focos) · g pregunta con poder Gis · h pregunta con corazón */
const Niveles = {
  mundo1() {
    const W = 192, H = 11;
    const g = Array.from({ length: H }, () => Array(W).fill('.'));
    const put = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
    const fila = (x1, x2, y, c) => { for (let x = x1; x <= x2; x++) put(x, y, c); };
    const torre = (x, y1, c = 'B') => { for (let y = y1; y <= 8; y++) put(x, y, c); };
    const ent = [];

    fila(0, W - 1, 9, 'G'); fila(0, W - 1, 10, 'G');
    [[30, 32], [66, 68], [104, 106], [140, 143]].forEach(([a, b]) => { fila(a, b, 9, '.'); fila(a, b, 10, '.'); });

    // Tramo 1: primeros bloques-libro
    put(8, 5, '?');
    put(12, 5, 'B'); put(13, 5, '?'); put(14, 5, 'B');
    ent.push({ tipo: 'cerdo', x: 20, y: 8 });
    fila(22, 25, 6, '='); fila(22, 25, 5, 'o');
    torre(27, 7);
    put(30, 6, 'o'); put(31, 5, 'o'); put(32, 6, 'o');

    // Tramo 2: el poder Gis y la primera escalera
    put(36, 5, 'B'); put(37, 5, 'g'); put(38, 5, 'B'); put(39, 5, '?'); put(40, 5, 'B');
    fila(37, 39, 2, 'o');
    ent.push({ tipo: 'loro', x: 45, y: 4 });
    torre(48, 8); torre(49, 7); torre(50, 6); torre(51, 5);
    fila(52, 54, 5, '='); fila(52, 54, 3, 'o');
    ent.push({ tipo: 'regla', x: 57, y: 8 });
    fila(60, 63, 6, '='); put(61, 2, '?');
    put(66, 6, 'o'); put(67, 5, 'o'); put(68, 6, 'o');

    // Tramo 3: punto de control y torres
    ent.push({ tipo: 'bandera', x: 72, y: 8 });
    ent.push({ tipo: 'cerdo', x: 77, y: 8 }); ent.push({ tipo: 'cerdo', x: 81, y: 8 });
    fila(84, 88, 7, 'o');
    torre(91, 7); ent.push({ tipo: 'regla', x: 94, y: 8 }); torre(97, 6);
    put(100, 5, 'h');
    put(104, 6, 'o'); put(105, 5, 'o'); put(106, 6, 'o');

    // Tramo 4: pirámide de libros
    torre(110, 8); torre(111, 7); torre(112, 6); torre(113, 6); torre(114, 7); torre(115, 8);
    ent.push({ tipo: 'loro', x: 120, y: 3 });
    put(124, 5, 'B'); put(125, 5, '?'); put(126, 5, '?'); put(127, 5, 'B');
    ent.push({ tipo: 'cerdo', x: 131, y: 8 }); ent.push({ tipo: 'cerdo', x: 135, y: 8 });
    fila(140, 143, 6, 'o');

    // Tramo final: escalera, mentor y meta
    torre(148, 8); torre(149, 7); torre(150, 6); torre(151, 5); torre(152, 5);
    fila(156, 160, 7, 'o');
    ent.push({ tipo: 'regla', x: 164, y: 8 });
    ent.push({ tipo: 'mentor', x: 176, y: 8, autor: 'pestalozzi' });
    ent.push({ tipo: 'meta', x: 184, y: 8 });

    return {
      id: '1-1', mundo: 1, nombre: 'Los Alpes de Pestalozzi', mentor: 'pestalozzi',
      ancho: W, alto: H, mapa: g, entidades: ent, inicio: { x: 3, y: 8 }, castilloX: 1268
    };
  }
};
