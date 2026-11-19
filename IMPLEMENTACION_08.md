# 08 · Motion de firma · Andrés Felipe Herrera González

**Revisión vigente V4:** la apertura 01 espera a que termine la transición de la portada y las tres aperturas se repiten al cambiar de pestaña. Consultar `README.md` y `evidencia_08/fix_v4/`. El resto del informe y `LEEME_EFECTOS_V3.md` documentan revisiones anteriores.

Implementación sobre una copia íntegra del ZIP 06, con los seis candidatos elegidos en el ZIP 07. Abrir `index.html`; para el comparador completo, servir esta carpeta por HTTP. No se publicó el demo.

## Actualización vigente · Hero de campeón y meta olímpica

Por solicitud del usuario, la portada de bienvenida y los heroes 01/02/03 abren ahora con **«Campeón panamericano.»** y **«Rumbo a los Juegos Olímpicos.»**. El nombre pasa a un segundo nivel visual. Se precisa debajo del título que el oro fue en **dobles masculino, Juegos Panamericanos Toronto 2015**. La frase olímpica expresa la aspiración solicitada; no anuncia una clasificación o convocatoria confirmada.

Cambios de esta revisión: `index.html`, `01/index.html`, `02/index.html`, `03/index.html` y sus tres CSS. `welcome.css`, `welcome.js`, `opening-bridge.js`, video, póster y los tres motores de motion permanecen idénticos a la entrega anterior. Todo el HTML desde el primer post-hero hasta el final de cada opción permanece idéntico, incluidas agendas, resultados, créditos y enlaces.

Verificación actual: los nueve pares de opción/ancho (320, 390 y 1280 px) muestran el título a mayor tamaño que el nombre, la meta olímpica visible, fotografías cargadas y sin desbordamiento horizontal. Se recorrió la bienvenida y 01 → 02 → 03 → 01 en el comparador real por HTTP. `evidencia_08/actualizacion_hero.json` registra la integridad; `evidencia_08/hero_actualizado/resultados_hero.json` registra los tamaños y comprobaciones. Las capturas actuales están en `evidencia_08/hero_actualizado/`.

Las secciones siguientes documentan la primera implementación de motion y sus pruebas históricas; las capturas anteriores fuera de `hero_actualizado/` muestran la jerarquía editorial previa a esta revisión. Los fixtures de `qa08/` se regeneraron con los heroes actuales.

## Base e integridad · Primera entrega de motion

SHA-256 del ZIP 06 recibido: `dc9be674b74c634ebd3b5319ddf62f1588bfb7141f2b32551395c18f07d17d83`. Coincide con el indicado en `INDICE_SCOUTING.md` del 07.

Se conservaron todos los archivos originales. Solo cambian nueve archivos: los tres HTML individuales, sus tres CSS y sus tres `assets/motion.js`. El HTML raíz, `opening-bridge.js`, `welcome.css`, `welcome.js`, el video, el póster y los assets originales de la introducción permanecen idénticos byte por byte. Las agendas, las credenciales, los pies de foto y todos los href de las tres páginas también permanecen idénticos. Ver `evidencia_08/integridad.json`.

## Referencia → página/selector → mecanismo

| ID | Referencia y localización | Página / selector | Gesto implementado |
| --- | --- | --- | --- |
| 01-E | [Image Stack Intro, Demo 2](https://tympanus.net/Development/ImageStackGrid/index2.html), apertura de Pleasure City; [controlador](https://github.com/codrops/ImageStackGrid/blob/main/src/js/demo2/galleryController.js) | `01/index.html` · `.podium > .plate` · `.motion08-sheet` | Tres recortes verticales contiguos de F05, muestreados sobre la misma imagen completa. Parten apilados y ocluidos en el tercio central, rotan y se separan hacia sus tres destinos. Coinciden con la imagen real al cerrar; no se usa un zoom global. |
| 01-P | [Sliced Text Effect](https://tympanus.net/Development/SlicedTextEffect/), freed, FX3 | `01/index.html` · `#duplas .names .surname` · `.motion08-slice > span` | Cuatro ventanas por palabra. Los cortes del mismo glifo divergen en X/Y y rotación, después se registran. Cada banda se observa por separado; compañero, resultado y tarjeta quedan fijos. El nombre accesible completo se conserva una sola vez. |
| 02-E | [Rapid Layers](https://tympanus.net/Development/RapidLayersAnimation/), Commotion; [revealer](https://github.com/codrops/RapidLayersAnimation/blob/master/src/js/revealer.js) | `02/index.html` · `#opening .mount` · `.motion08-sleeve` | Pasada papel, pasada verde y retirada verde. Cada manga y su imagen interior se trasladan con magnitudes opuestas, igual duración y easing: los detalles del retrato quedan registrados en la frontera. Las placas traseras y el crédito no se animan. |
| 02-P | [FlipDown](https://pbutcher.uk/flipdown/); [CSS del rotor](https://github.com/PButcher/flipdown/blob/master/src/flipdown.css) | `02/index.html` · `#registro .result .digits` · `.motion08-leaf` | Dos rotores de dos caras, perspectiva y eje horizontal central. Las hojas cruzan −90° y cierran en −180°. Se revelan únicamente 1 y 3 desde tarjetas neutras; el guion queda fijo. No hay reloj ni resultados ficticios. |
| 03-E | [Podium](https://podium.global/), transición de proyecto; [caso de sus autores](https://tympanus.net/codrops/2026/06/23/podium-building-a-website-where-running-becomes-storytelling/), Transition; [respaldo técnico Flip](https://gsap.com/docs/v3/Plugins/Flip.md) | `03/index.html` · `.photo-square` · `.motion08-contact` | Una sola copia de F06 parte como ficha en la esquina superior derecha. La traslación y la escala cambian juntas hasta coincidir con los cuatro bordes y los hitos de la foto final. No hay fundido ni cambio de encuadre. |
| 03-P | [Layout Formations](https://tympanus.net/Development/OnScrollLayoutFormations/), segunda retícula Vision / Focus / Essence; [animateSecondGrid](https://github.com/codrops/OnScrollLayoutFormations/blob/main/js/index.js) | `03/index.html` · `#modalidades [aria-labelledby="equipos"] .roster` · `.motion08-carrier` | Nombre y tira forman un mismo portador visual. Asienta primero el centro geométrico; después los extremos, con pendientes opuestas. Las cajas en flujo, el título, la plata y las otras nóminas permanecen fijos. La amplitud se limita para mantener completos los nombres. |

No se eligieron sustitutos ni se montaron los candidatos descartados.

## Secuencias y disparadores

- Opening 01: asientos escalonados 70/120/170 ms y cierre a 720 ms; móvil 50/85/120 y cierre a 620 ms.
- Opening 02: papel 0–290 ms, verde 100–380 ms y retirada hasta 690 ms; móvil 0–250, 80–330 y 590 ms.
- Opening 03: ficha inicial sostenida aproximadamente 80 ms; encaje a 690 ms, o 570 ms en móvil.
- Post 01: aproximadamente 50% de cada banda visible; 510 ms por banda, 430 en móvil. Si coinciden en escritorio, la segunda lleva 75 ms de desfase.
- Post 02: aproximadamente 50% del resultado visible; 460 ms + 75 ms de desfase, o 380 + 60 en móvil.
- Post 03: aproximadamente 70% de la primera nómina visible; centro 220 ms, extremos desde 100 hasta 520 ms; en móvil, extremos desde 80 hasta 450 ms.

Se retiraron los anteriores desplazamientos de tarjetas, placas y tiras. No se combinan con los nuevos efectos. El post es de reloj, una vez tras entrar en vista; el scroll solo comprueba visibilidad. No hay pin, scrub, hover, clic ni seguimiento del cursor.

El puente HTTP original se reutiliza sin modificaciones: validación de origen y ventana padre; `gtl-opening-ready` / `gtl-opening-visibility`. Los iframes ocultos esperan el permiso. El opening se recuerda por opción en `sessionStorage`, además de conservar su estado en el iframe: volver a una opción no lo repite. Se cancela y entrega el estado final ante pérdida de visibilidad, resize o preferencia reducida. Una foto tardía o una entrada por ancla entrega el estado final para evitar un reinicio visual.

## Estado final y accesibilidad

Los HTML y CSS estáticos son el estado final. Las copias visuales son decorativas y se crean para la animación; no contienen datos exclusivos. Se conservan imágenes reales, alt y créditos. En 01 continúa el fallback F05 → F01 con su pie correspondiente. El marcador tiene lectura semántica «Uno a tres» y los nombres de las duplas conservan «Andrés Felipe Herrera». En 03, las cajas de lista no se transforman: el portador interior mueve juntos nombre y soporte.

## Verificación realizada

| Prueba | Resultado y evidencia |
| --- | --- |
| Extracción limpia | Se creó un ZIP de preflight, se extrajo a una carpeta nueva y esa extracción sustituyó la carpeta servida antes de las últimas pruebas. No depende de archivos fuera del paquete. |
| Tres rutas directas por HTTP | `01/index.html`, `02/index.html`, `03/index.html`: título, foto cargada, agenda, destinos internos y ausencia de overflow comprobados. `resultados_rutas_y_sin_js.json`. |
| Hub real | Bienvenida → Empezar el demo → 01 → 02 → 03 → 01 observado por HTTP. La última pasada se hizo sobre la extracción limpia. |
| Teclado del selector | ArrowRight pasó de 01 a 02 y de 02 a 03; Home volvió a 01. `aria-selected` devolvió 02 / 03 / 01. El comparador y sus hashes originales se conservaron. |
| Scroll natural | Tres páginas instrumentadas, usando el mismo código de producción, sin congelar ni acelerar los tiempos. Tras scroll normal: 8 animaciones de cortes en 01, 2 rotores en 02 y 3 portadores en 03. `resultados_scroll_natural.json`. |
| Escritorio y móvil | Viewports internos de Chromium de 1280×900, 390×844 y 320×844. Las 18 combinaciones opening/post pasaron: fotos cargadas, disparos registrados y sin overflow horizontal. `resultados_responsive.json`. Son viewports de iframe; no se simularon dispositivos físicos ni Safari. |
| Saltos de layout | Sin entradas de layout-shift en las secuencias instrumentadas y las pasadas de scroll natural. No es una medición Lighthouse ni una garantía para toda condición de carga. |
| Movimiento reducido | Se forzó el retorno de la consulta `prefers-reduced-motion` en el fixture: cero animaciones en las tres opciones, a 320 px. `resultados_reducido.json`. No se cambió la preferencia del sistema del navegador. |
| Sin JS de aplicación | Copias de los tres HTML sin su script de aplicación: foto visible, agenda y nombres presentes; marcador visual final completo. El servidor de preview inyecta su propio script de recarga, por eso el contador del DOM marca 1; no es `motion.js`. La revisión de los archivos confirma que los fixtures no incluyen scripts propios. |
| Integridad editorial | Credenciales, pies, agendas y enlaces comparados contra el 06. Solo los nueve archivos de las opciones cambiaron. `integridad.json`. |

## Evidencia visual y comparación

`evidencia_08/NN-opening-390.jpg` y `NN-post-390.jpg` contienen inicio / intermedio / final a tamaño de viewport 390 px. Los pares `*-1280.jpg` muestran el mismo procedimiento a 1280 px, reducidos al 33% en la hoja de contacto. `hub-final-01.jpg` muestra el comparador real. Las capturas se obtuvieron del navegador; no son imágenes sintetizadas.

Los fotogramas controlados se generan mediante `qa08/index.html?option=01&phase=opening&width=390` (cambiar opción, fase o ancho). El fixture fija `Animation.currentTime` para inspeccionar geometría; para un post resuelve la apertura y centra la pieza antes de congelarla. Esta instrumentación está aislada en `qa08/` y nunca la cargan los HTML de producción. No se presenta ese scroll programático como navegación real. `phase=natural` en `qa08/01.html?option=01&phase=natural&t=0` registra los tiempos reales y requiere scroll normal.

El cotejo mecánico comprobó: tres destinos de recorte y registro final en 01-E; glifos seccionados y compañero inmóvil en 01-P; igualdad de desplazamientos opuestos en 02-E; perspectiva, canto y dos caras en 02-P; continuidad de caja e imagen en 03-E; centro primero y extremos de signos opuestos en 03-P.

**Límite de referencia:** el 07 no contiene fotogramas externos verificados. Se pudieron abrir cinco demos externos mediante recuperación web; el caso de Podium devolvió 403. No se descargaron ni se midieron clips externos, por lo que no se acredita una comparación visual cuadro a cuadro contra esos videos. La comparación se apoya en las fichas y mecanismos del 07, junto con los fotogramas propios de esta entrega. El respaldo técnico de GSAP no se atribuye al código de Podium.

**Modelo:** el nombre del ZIP conserva la denominación de la etapa solicitada. Este entorno no expone un selector para ejecutar Astra 6.1, de modo que no se afirma haber cambiado a ese modelo.

## Archivos añadidos

`IMPLEMENTACION_08.md`, `evidencia_08/`, `qa08/`. Los directorios originales de QA y evidencia 05/06 se conservan como históricos; no acreditan esta implementación. No hay nuevas dependencias, fuentes ni fotos.
