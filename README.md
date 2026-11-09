# Saltos del Saber

Videojuego de plataformas en 2D, con gráficos al estilo de las consolas de 64 bits, para repasar pedagogía y a sus autores.
Departamento Psicopedagógico · Universidad Pedagógica Nacional, Unidad 112.

Ale, estudiante de la UPN, recorre mundos inspirados en pedagogos y pedagogas. Al golpear desde abajo
los **bloques-libro con “?”** aparece una pregunta. Cada respuesta, correcta o no, muestra una explicación
breve y su fuente. Equivocarse en una pregunta nunca quita vidas: la pregunta vuelve más adelante.

## Estado actual

| Mundo | Escenario | Mentor | Estado |
| --- | --- | --- | --- |
| 1 | Los Alpes de Pestalozzi | Pestalozzi (con Comenio, Rousseau y Fröbel) | **Jugable** |
| 2 | La Casa de los Niños (Roma, 1907) | Montessori (con Dewey, Decroly y Freinet) | **Jugable** |
| 3 | La Colonia Gorki (Ucrania, 1920) | Makarenko (con Vygotsky, Krupskaya y Pistrak) | **Jugable** · último mundo |
| Final | La Gran Máquina Bancaria | Jefe final, al terminar el Mundo 3 | **Jugable** |

## Cómo jugar

- **Moverse:** flechas ← → o A / D
- **Saltar:** Espacio, ↑ o W (mantén presionado para saltar más alto)
- **Lanzar gis:** X, cuando tienes el poder Gis
- **Pausa:** P o Esc
- **Responder:** clic, toque o teclas 1 a 4

En celular o tableta aparecen botones en pantalla. Se juega mejor con el teléfono en horizontal.

En la pantalla de inicio se elige el mundo. Al terminar uno, el botón **Siguiente mundo** lleva al que sigue.

**Jefe final.** Al llegar a la meta del Mundo 3 aparece la **Gran Máquina Bancaria**, armada con los obstáculos de
los tres mundos. Lanza monedas, golpea el suelo con su regla y su loro grita “¡Repite!” (la paca sirve de escudo).
Se aturde con tres golpes de gis o saltando sobre ella desde los tablones; aturdida, al tocarla se abre uno de sus
**tres candados** con una pregunta del Mundo 1, 2 y 3, en ese orden. Si Ale pierde todo el ánimo, solo se repite la pelea.
Al vencerla aparece la **constancia de recorrido**: sellos, puntaje y respuestas correctas de cada mundo completado en
ese navegador, puntaje total y un código de verificación para subir a Classroom o Teams.

**Mundo 3.** Ale cruza los campos de la Colonia Gorki, el río Kolomak y el patio de la colonia. Tres **colonos**
sentados en el camino se unen a ella al tocarlos y la siguen en fila: si un obstáculo la golpea, un compañero recibe el
golpe. El río se cruza saltando entre **balsas** que se mueven. Al superar a Makarenko se obtiene el poder **Colectivo**:
un compañero acompaña a Ale desde el inicio de cada mundo (se guarda en el navegador).

**Mundo 2.** Ale recorre una calle de San Lorenzo y entra al aula de la Casa dei Bambini. Algunas cajas de material,
al responder bien, despliegan una **escalera café** hacia una zona alta. Allí hay un **cubo rosa** que da una **Pista**:
en una pregunta de opción múltiple, el botón *Usar pista* tacha dos opciones incorrectas. Montessori también entrega
una Pista al superarla. Las pistas se guardan en el navegador (máximo 3) y sirven en cualquier mundo.

Al final del Mundo 1, Pestalozzi plantea tres preguntas. Con dos aciertos se obtiene el **Sello de Yverdon**
y se puede llegar a la meta. La pantalla final muestra puntaje, aciertos por autor y un **código de
verificación**, que el estudiante puede capturar y subir a Classroom o Teams.

## Cómo abrirlo

**Opción 1. Con un enlace (recomendada).** Activa GitHub Pages una sola vez:

1. En GitHub, entra al repositorio y abre **Settings → Pages**.
2. En **Source** elige **Deploy from a branch**.
3. Elige la rama **main** y la carpeta **/ (root)**. Guarda.
4. En uno o dos minutos el juego estará en:
   `https://psicmarcorl.github.io/juego-pedagogia-UPN-112/`

GitHub Pages en un repositorio privado requiere un plan de pago de GitHub. Si el repositorio es privado
y no quieres cambiarlo a público, usa la opción 2.

**Opción 2. Sin internet.** Descarga el repositorio (botón **Code → Download ZIP**), descomprímelo y abre
`index.html` con doble clic. En este modo el juego usa la copia de respaldo de las preguntas
(ver abajo) y, si no hay conexión, la tipografía redonda se reemplaza por una genérica.

## Cómo editar las preguntas

Las preguntas están en `datos/preguntas.csv`, que se abre con Excel o Google Sheets. Una fila por pregunta:

| Columna | Qué escribir |
| --- | --- |
| `mundo` | Número de mundo (1 a 6) |
| `tipo` | `opcion_multiple`, `verdadero_falso`, `quien_lo_dijo` o `relacionar` |
| `autor` | `concepto`, `comenio`, `rousseau`, `pestalozzi`, `froebel`, `montessori`, `dewey`, `decroly`, `freinet`, `makarenko`, `vygotsky`, `krupskaya` o `pistrak` |
| `pregunta` | Texto de la pregunta |
| `opcion_a` … `opcion_d` | Opciones de respuesta. En verdadero o falso, solo A y B |
| `correcta` | Letra de la opción correcta (A, B, C o D) |
| `explicacion` | Retroalimentación breve que se muestra después de responder |
| `fuente` | Referencia en formato APA 7 |

El juego cambia el orden de las opciones en cada partida, así que la respuesta correcta puede estar
siempre en la columna A. Al guardar desde Excel, elige **CSV UTF-8 (delimitado por comas)** para que se
conserven los acentos.

El juego en línea (opción 1) lee el CSV directamente. Para que la versión sin internet (opción 2) también
tenga tus cambios, hay que regenerar la copia de respaldo con `node herramientas/generar-respaldo.js`.
Si no tienes Node.js instalado, pídeselo a quien te ayude con el repositorio.

## Estructura

```
index.html                    el juego
css/estilos.css               estilos de pantallas y ventanas
js/sprites.js                 personajes, bloques y fondos con volumen y luz (dibujados con código)
js/niveles.js                 mapas de los mundos
js/motor.js                   física, obstáculos, cámara y flujo del juego
js/preguntas.js               lectura del banco y ventana de preguntas
js/interfaz.js                pantallas de inicio, pausa y resultados
js/sonido.js                  efectos de sonido sintetizados
js/preguntas-respaldo.js      copia automática del CSV para abrir sin servidor
datos/preguntas.csv           banco de preguntas editable
herramientas/generar-respaldo.js
```

No usa librerías externas. Todos los personajes y gráficos son originales.

## Referencias de apoyo

Las referencias se verificarán contra las ediciones disponibles en la biblioteca de la Unidad.

- Abbagnano, N. y Visalberghi, A. (1964). *Historia de la pedagogía*. Fondo de Cultura Económica.
- Comenio, J. A. *Didáctica magna*. (Obra original publicada en 1657)
- Pestalozzi, J. H. *Cómo Gertrudis enseña a sus hijos*. (Obra original publicada en 1801)
- Rousseau, J.-J. *Emilio, o De la educación*. (Obra original publicada en 1762)
