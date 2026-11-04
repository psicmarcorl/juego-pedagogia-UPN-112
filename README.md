# Saltos del Saber

Videojuego de plataformas en 2D, con estética de 8 bits, para repasar pedagogía y a sus autores.
Departamento Psicopedagógico · Universidad Pedagógica Nacional, Unidad 112.

Ale, estudiante de la UPN, recorre mundos inspirados en pedagogos y pedagogas. Al golpear desde abajo
los **bloques-libro con “?”** aparece una pregunta. Cada respuesta, correcta o no, muestra una explicación
breve y su fuente. Equivocarse en una pregunta nunca quita vidas: la pregunta vuelve más adelante.

## Estado actual

| Mundo | Escenario | Mentor | Estado |
| --- | --- | --- | --- |
| 1 | Los Alpes de Pestalozzi | Pestalozzi (con Comenio, Rousseau y Fröbel) | **Jugable** |
| 2 | La Casa de los Niños | Montessori | Pendiente |
| 3 | La Colonia Gorki | Makarenko | Pendiente |
| 4 | Los Círculos de Cultura | Freire | Pendiente |
| 5 | El Taller de Frankenstein | Meirieu | Pendiente |
| 6 | La Ciudad Crítica | McLaren | Pendiente |
| Extra | El Valle de México | Por definir | Pendiente |

## Cómo jugar

- **Moverse:** flechas ← → o A / D
- **Saltar:** Espacio, ↑ o W (mantén presionado para saltar más alto)
- **Lanzar gis:** X, cuando tienes el poder Gis
- **Pausa:** P o Esc
- **Responder:** clic, toque o teclas 1 a 4

En celular o tableta aparecen botones en pantalla. Se juega mejor con el teléfono en horizontal.

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
(ver abajo) y la tipografía de 8 bits se reemplaza por una genérica si no hay conexión.

## Cómo editar las preguntas

Las preguntas están en `datos/preguntas.csv`, que se abre con Excel o Google Sheets. Una fila por pregunta:

| Columna | Qué escribir |
| --- | --- |
| `mundo` | Número de mundo (1 a 6) |
| `tipo` | `opcion_multiple`, `verdadero_falso`, `quien_lo_dijo` o `relacionar` |
| `autor` | `concepto`, `comenio`, `rousseau`, `pestalozzi`, `froebel`, `montessori`, `makarenko`, `freire`, `meirieu` o `mclaren` |
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
js/sprites.js                 personajes, bloques y fondos en pixel art (dibujados con código)
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
