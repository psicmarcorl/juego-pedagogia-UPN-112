'use strict';
/* Saltos del Saber · Mapas y textos de los niveles.
   El mapa es una cuadrícula de 11 filas (0 = arriba). Las filas 9 y 10 son el suelo.
   Símbolos:  G suelo · B bloque sólido (librero, cajón de fruta o estante) · = plataforma
              o foco de idea · p cubo rosa (una Pista) · T torre rosa · C escalera café
              ? pregunta (premio: focos) · g pregunta con poder Gis · h pregunta con corazón
              e pregunta que, al acertar, despliega una escalera café */
const Niveles = (() => {
  function base(W) {
    const H = 11;
    const g = Array.from({ length: H }, () => Array(W).fill('.'));
    const put = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
    const fila = (x1, x2, y, c) => { for (let x = x1; x <= x2; x++) put(x, y, c); };
    const torre = (x, y1, c = 'B') => { for (let y = y1; y <= 8; y++) put(x, y, c); };
    const hueco = (a, b) => { fila(a, b, 9, '.'); fila(a, b, 10, '.'); };
    fila(0, W - 1, 9, 'G'); fila(0, W - 1, 10, 'G');
    return { g, H, put, fila, torre, hueco };
  }
  const REINTENTO = ok => `<p>Acertaste <b>${ok} de 3</b>. Equivocarse también es parte de aprender: revisa las explicaciones y probemos con otras tres preguntas.</p>`;

  function mundo1() {
    const W = 192, { g, H, put, fila, torre, hueco } = base(W), ent = [];
    [[30, 32], [66, 68], [104, 106], [140, 143]].forEach(([a, b]) => hueco(a, b));

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
      id: '1-1', mundo: 1, nombre: 'Los Alpes de Pestalozzi', tema: 'alpes', mentor: 'pestalozzi',
      ancho: W, alto: H, mapa: g, entidades: ent, inicio: { x: 3, y: 8 }, castilloX: 1268, escaleras: [],
      sello: 'Sello de Yverdon', poder: 'corazon',
      textos: {
        intro: '<p>Suiza, finales del siglo XVIII. En este mundo conocerás a los clásicos: <b>Comenio, Rousseau, Pestalozzi y Fröbel</b>.</p><p>Golpea desde abajo los <b>bloques-libro con “?”</b> para responder preguntas. Si aciertas, ganas puntos y premios; si te equivocas, verás la explicación y la pregunta volverá más adelante.</p><p>Salta sobre los obstáculos para quitarlos del camino. Al final te espera Pestalozzi.</p>',
        mentorNombre: 'Johann Heinrich Pestalozzi', mentorCorto: 'Pestalozzi',
        saludo: '<p>¡Hola, Ale! Soy Pestalozzi. Pasé mi vida enseñando a niños pobres y huérfanos, convencido de que educar es desarrollar en armonía <b>la cabeza, el corazón y la mano</b>.</p><p>Antes de seguir, respóndeme tres preguntas. Con dos aciertos obtendrás el <b>Sello de Yverdon</b>.</p>',
        exito: ok => `<p>Acertaste <b>${ok} de 3</b>. Te entrego el poder <b>Corazón</b> (+1 de ánimo) y el <b>Sello de Yverdon</b>.</p><p>El banderín de meta está justo detrás de mí.</p>`,
        reintento: REINTENTO
      }
    };
  }

  function mundo2() {
    const W = 200, { g, H, put, fila, torre, hueco } = base(W), ent = [];
    hueco(33, 35); hueco(72, 74);

    // Calle de San Lorenzo
    put(8, 5, '?');
    put(12, 5, 'B'); put(13, 5, '?'); put(14, 5, 'B');
    ent.push({ tipo: 'cerdo', x: 20, y: 8 });
    fila(22, 25, 6, '='); fila(22, 25, 5, 'o');
    torre(28, 7);
    put(33, 6, 'o'); put(34, 5, 'o'); put(35, 6, 'o');
    put(39, 5, 'B'); put(40, 5, '?'); put(41, 5, 'e'); put(42, 5, 'B');
    fila(51, 56, 2, '='); fila(51, 55, 1, 'o'); put(56, 1, 'p');      // zona alta: solo se llega por la escalera café
    ent.push({ tipo: 'loro', x: 60, y: 3 });
    ent.push({ tipo: 'regla', x: 64, y: 8 });
    fila(66, 69, 6, '='); put(67, 2, '?');
    put(72, 6, 'o'); put(73, 5, 'o'); put(74, 6, 'o');
    ent.push({ tipo: 'cerdo', x: 78, y: 8 }); ent.push({ tipo: 'cerdo', x: 82, y: 8 });
    fila(85, 89, 7, 'o');
    torre(91, 7);
    ent.push({ tipo: 'bandera', x: 95, y: 8 });                        // puerta de la Casa dei Bambini

    // Aula de la Casa dei Bambini
    torre(101, 8, 'T'); torre(102, 7, 'T'); torre(103, 6, 'T');
    fila(106, 109, 6, '='); put(107, 2, '?'); put(106, 5, 'o'); put(108, 5, 'o'); put(109, 5, 'o');
    ent.push({ tipo: 'regla', x: 112, y: 8 });
    put(115, 5, 'B'); put(116, 5, 'e'); put(117, 5, 'B');
    fila(125, 130, 2, '='); fila(125, 129, 1, 'o');                    // segunda zona alta
    ent.push({ tipo: 'cerdo', x: 133, y: 8 }); ent.push({ tipo: 'cerdo', x: 137, y: 8 });
    ent.push({ tipo: 'loro', x: 134, y: 3 });
    torre(141, 8, 'T'); torre(142, 7, 'T'); torre(143, 6, 'T'); torre(144, 6, 'T'); torre(145, 7, 'T'); torre(146, 8, 'T');
    fila(150, 153, 6, '='); put(151, 2, '?'); fila(150, 153, 5, 'o');
    ent.push({ tipo: 'regla', x: 157, y: 8 });
    ent.push({ tipo: 'cerdo', x: 161, y: 8 });
    put(165, 5, 'B'); put(166, 5, '?'); put(167, 5, 'B');
    fila(171, 175, 7, 'o');
    ent.push({ tipo: 'regla', x: 179, y: 8 });
    ent.push({ tipo: 'mentor', x: 186, y: 8, autor: 'montessori' });
    ent.push({ tipo: 'meta', x: 194, y: 8 });

    return {
      id: '2-1', mundo: 2, nombre: 'La Casa de los Niños', tema: 'roma', mentor: 'montessori',
      ancho: W, alto: H, mapa: g, entidades: ent, inicio: { x: 3, y: 8 }, interiorDesde: 98,
      enemigos: { cerdo: 'pupitre', loro: 'medalla', regla: 'reloj' },
      // Cada caja "e" despliega, al acertar, columnas de escalera café: [x, fila superior]
      escaleras: [
        { bloque: [41, 5], pasos: [[45, 8], [46, 7], [47, 6], [48, 5], [49, 4]] },
        { bloque: [116, 5], pasos: [[119, 8], [120, 7], [121, 6], [122, 5], [123, 4]] }
      ],
      sello: 'Sello de San Lorenzo', poder: 'pista',
      textos: {
        intro: '<p>Roma, 1907, barrio de San Lorenzo. Aquí María Montessori abrió su primera <b>Casa dei Bambini</b>. En este mundo conocerás también a <b>Dewey, Decroly y Freinet</b>, de la Escuela Nueva.</p><p>Recorre la calle hasta la puerta de la Casa y entra al aula. Algunas cajas de material, si aciertas, despliegan una <b>escalera café</b> hacia una zona alta. Allí hay un <b>cubo rosa</b> que guarda una Pista: en una pregunta difícil, tacha dos opciones incorrectas.</p><p>Cuidado con el pupitre clavado, la medalla del premio y el reloj de la prisa.</p>',
        mentorNombre: 'María Montessori', mentorCorto: 'Montessori',
        saludo: '<p>Benvenuta, Ale. Soy María Montessori. Aprendí observando a los niños: cuando el ambiente está preparado, eligen su trabajo, se concentran y aprenden por sí mismos.</p><p>Respóndeme tres preguntas. Con dos aciertos obtendrás el <b>Sello de San Lorenzo</b>.</p>',
        exito: ok => `<p>Acertaste <b>${ok} de 3</b>. Te entrego el <b>Sello de San Lorenzo</b> y una <b>Pista</b> para una pregunta difícil.</p><p>El banderín está justo detrás de mí.</p>`,
        reintento: REINTENTO
      }
    };
  }

  // W agua del río (se cae como en un hoyo) · balsa: plataforma que se mueve · colono: compañero que se une a Ale
  function mundo3() {
    const W = 202, { g, H, put, fila, torre } = base(W), ent = [];
    fila(74, 99, 9, 'W'); fila(74, 99, 10, 'W');

    // Tramo 1: los campos
    put(8, 5, '?');
    put(12, 5, 'B'); put(13, 5, '?'); put(14, 5, 'B');
    ent.push({ tipo: 'colono', x: 17, y: 8 });
    ent.push({ tipo: 'cerdo', x: 21, y: 8 });
    fila(23, 26, 6, '='); fila(23, 26, 5, 'o');
    torre(29, 7);
    ent.push({ tipo: 'regla', x: 33, y: 8 });
    ent.push({ tipo: 'letrero', x: 36, y: 8, texto: 'cercana' });
    put(40, 5, 'B'); put(41, 5, 'h'); put(42, 5, 'B');
    ent.push({ tipo: 'loro', x: 46, y: 3 });
    torre(50, 8); torre(51, 7); torre(52, 6); torre(53, 5);
    fila(54, 57, 5, '='); fila(54, 56, 3, 'o');
    ent.push({ tipo: 'colono', x: 57, y: 4 });
    ent.push({ tipo: 'cerdo', x: 61, y: 8 }); ent.push({ tipo: 'cerdo', x: 64, y: 8 });
    fila(66, 69, 6, '='); put(67, 2, '?');
    // Tramo 2: el río Kolomak, con balsas que van y vienen
    [78, 84, 90, 96].forEach((x, i) => ent.push({ tipo: 'balsa', x, y: 8, fase: i * 0.6 }));
    [80, 86, 92].forEach(x => put(x, 6, 'o'));
    ent.push({ tipo: 'loro', x: 87, y: 3 });
    ent.push({ tipo: 'bandera', x: 102, y: 8 });                      // letrero de la perspectiva media
    ent.push({ tipo: 'colono', x: 106, y: 8 });
    // Tramo 3: el patio de la colonia
    torre(110, 8); torre(111, 7); torre(112, 6);
    fila(116, 119, 6, '='); put(117, 2, '?'); fila(116, 119, 5, 'o');
    ent.push({ tipo: 'regla', x: 122, y: 8 });
    put(126, 5, 'B'); put(127, 5, '?'); put(128, 5, 'B');
    ent.push({ tipo: 'cerdo', x: 132, y: 8 }); ent.push({ tipo: 'loro', x: 136, y: 3 });
    torre(140, 8); torre(141, 7); torre(142, 6); torre(143, 6); torre(144, 7); torre(145, 8);
    fila(150, 153, 6, '='); put(151, 2, '?'); fila(150, 153, 5, 'o');
    ent.push({ tipo: 'regla', x: 157, y: 8 }); ent.push({ tipo: 'cerdo', x: 161, y: 8 });
    put(165, 5, 'B'); put(166, 5, '?'); put(167, 5, 'B');
    fila(171, 175, 7, 'o');
    ent.push({ tipo: 'letrero', x: 177, y: 8, texto: 'lejana' });
    [182, 183, 184].forEach(x => ent.push({ tipo: 'fila', x, y: 8 }));   // destacamento formado
    ent.push({ tipo: 'mentor', x: 188, y: 8, autor: 'makarenko' });
    ent.push({ tipo: 'meta', x: 196, y: 8 });

    return {
      id: '3-1', mundo: 3, nombre: 'La Colonia Gorki', tema: 'ucrania', mentor: 'makarenko', ultimo: true, jefe: true,
      ancho: W, alto: H, mapa: g, entidades: ent, inicio: { x: 3, y: 8 }, patioDesde: 104, escaleras: [],
      enemigos: { cerdo: 'rodadora', loro: 'cuervo', regla: 'espanta' },
      decor: [{ img: 'jata', x: 200, y: 106 }, { img: 'jata', x: 640, y: 106 }, { img: 'tallerColonia', x: 1120, y: 98 }, { img: 'tallerCarpinteria', x: 1430, y: 107 }, { img: 'tallerColonia', x: 1740, y: 98 }],
      sello: 'Sello de Poltava', poder: 'colectivo',
      textos: {
        intro: '<p>Ucrania, 1920, cerca de Poltava. Antón Makarenko recibe a niños y jóvenes que la guerra dejó sin hogar y, con ellos, levanta la <b>Colonia Gorki</b>. En este mundo conocerás también a <b>Vygotsky, Krupskaya y Pistrak</b>.</p><p>En el camino hay <b>tres colonos</b> sentados solos: tócalos y se unirán a ti. Si un obstáculo te golpea, un compañero recibe el golpe por ti.</p><p>Para cruzar el <b>río Kolomak</b>, salta entre las balsas. Cuidado con la rodadora del desorden, el cuervo egoísta y el espantapájaros de la apatía.</p>',
        mentorNombre: 'Antón Makarenko', mentorCorto: 'Makarenko',
        saludo: '<p>Bienvenida a la colonia, Ale. Soy Antón Makarenko. Aquí nadie se educa solo: el <b>colectivo</b> trabaja, decide y se cuida a sí mismo.</p><p>Respóndeme tres preguntas. Con dos aciertos obtendrás el <b>Sello de Poltava</b>.</p>',
        exito: ok => `<p>Acertaste <b>${ok} de 3</b>. Te entrego el <b>Sello de Poltava</b> y el poder <b>Colectivo</b>: un compañero te acompañará desde el inicio de cada mundo.</p><p>El banderín está justo detrás de mí.</p>`,
        reintento: REINTENTO,
        jefeIntro: '<p>¡Cuidado, Ale! Del almacén de la colonia salió una máquina enorme: la <b>Gran Máquina Bancaria</b>. Está hecha con todo lo que combatimos: pupitres clavados, reglas, relojes de la prisa, medallas y un loro que repite.</p><p>Solo “deposita” datos en la cabeza de los estudiantes, como decía Paulo Freire. Para detenerla, <b>atúrdela</b> con tres golpes de gis o saltando sobre ella desde los tablones. Luego <b>toca sus candados</b>: cada uno se abre con una pregunta de un mundo.</p><p>Escóndete detrás de la paca cuando el loro grite.</p>',
        jefeFin: '<p>¡La máquina se desarmó! Las ideas que guardaba vuelven a quienes aprenden.</p><p>Pestalozzi, Montessori y yo te felicitamos, Ale: aprendiste con la cabeza, el corazón y la mano; con un ambiente preparado; y en colectivo.</p>'
      }
    };
  }

  // Arena del jefe final: una sola pantalla en el patio de la colonia, al atardecer
  function arena() {
    const W = 20, { g, H, put, fila } = base(W);
    fila(2, 5, 6, '=');
    put(7, 8, 'B');
    const ent = [{ tipo: 'animador', x: 0, y: 8, autor: 'pestalozzi' }, { tipo: 'animador', x: 1, y: 8, autor: 'montessori' }, { tipo: 'animador', x: 2, y: 8, autor: 'makarenko' }];
    return { ancho: W, alto: H, mapa: g, entidades: ent };
  }

  const lista = [
    { n: 1, nombre: 'Los Alpes de Pestalozzi', crear: mundo1 },
    { n: 2, nombre: 'La Casa de los Niños', crear: mundo2 },
    { n: 3, nombre: 'La Colonia Gorki', crear: mundo3 }
  ];
  return { lista, crear: n => (lista.find(m => m.n === n) || lista[0]).crear(), existe: n => lista.some(m => m.n === n), arena, mundo1, mundo2, mundo3 };
})();
