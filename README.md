# Demo privada GTL AI · Andrés Felipe Herrera González

El `index.html` de la raíz es la portada. «Empezar el demo» abre el comparador con las opciones 01, 02 y 03. No requiere compilar, volver a descargar el repositorio ni ejecutar un ensamblador.

## Abrir la demo

1. Extrae el ZIP completo en una carpeta. No abras el HTML desde el visor del ZIP.
2. Abre `index.html` de la raíz y pulsa «Empezar el demo». El efecto 01 empieza después de la transición de GTL AI. Cada vez que cambias de opción, la pestaña elegida vuelve al hero y repite su apertura. Usa los botones o las flechas, Inicio y Fin en el selector.
3. Si el navegador restringe los iframes locales, abre una terminal en la carpeta del ZIP extraído y ejecuta `python -m http.server 8000 --bind 127.0.0.1`. En Windows puedes usar `py` y en macOS/Linux `python3` en lugar de `python`. Luego abre `http://127.0.0.1:8000/` en el navegador. Los sufijos `#01`, `#02` y `#03` seleccionan directamente una opción.

También puedes abrir `01/index.html`, `02/index.html` y `03/index.html` por separado. Los enlaces Demo 01, Demo 02 y Demo 03 de la portada llevan a esos mismos HTML. El puente de la V4 contempla tanto `file://` como HTTP.

## Fuente y cambios

Plantilla: Gallinas-Valientes-Demo, revisión `fe06ee86abe79d604a22e91aba85e816a154e776`, del ZIP fuente. El manifiesto registra los hashes de los originales. La V4 conserva el diseño, el video y el póster de la portada, y adapta `welcome.js` para distinguir entre precargar y activar una pestaña. El puente no recarga los iframes.

## Pruebas y alcance

La prueba de regresión de esta revisión está en `evidencia_08/fix_v4/`. Verifica el JavaScript real con un DOM, mensajes de iframe y fotogramas simulados. Los informes, scripts de QA y capturas de revisiones anteriores que se listan abajo quedan como historial.

- HTTP local: respuesta 200 y bytes exactos para 19 archivos de la raíz y de las tres páginas, comprobados desde una extracción limpia.
- Chromium, **simulación en memoria**: recorrido Empezar → 01 → 02 → 03 → 01, con Enter, flechas e Inicio; foto visible y agenda presente en cada marco. Capturas en escritorio y móvil (390 × 780), más movimiento reducido. El MP4 original reprodujo en modo normal; en modo reducido quedó el póster, sin reproducción.
- Puente: prueba unitaria con DOM simulado para rechazar orígenes y ventanas ajenos, y comprobar carga, portada cerrada, pestaña activa y documento visible.
- Preflight individual anterior: fotos, openings, post-hero pasivo y agenda con Enter, en Chromium con recursos en memoria. Resultados en `evidencia_06/preflight/`.
- Límite: la política del navegador del entorno bloqueó la navegación real a localhost y a `file://`. No se certifica el recorrido real de iframes ni el intercambio de mensajes de extremo a extremo. Las capturas se etiquetan como simulación.

Uso interno. No publicado ni enviado. Verifica los derechos de uso antes de difundir la demo.
