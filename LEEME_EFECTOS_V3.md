# V3 · Corrección de efectos invisibles

Nota histórica. Para el comportamiento de la V4, consulta `README.md`.

Extraer TODO el ZIP a una carpeta nueva y abrir `index.html`. Entrar con «Empezar el demo», seleccionar 01/02/03 y hacer scroll dentro de cada opción. Recargar la página permite volver a ver las aperturas. Los efectos respetan la preferencia de movimiento reducido del sistema/navegador.

## Causa encontrada

La entrega anterior no habilitaba el puente de visibilidad en `file://`. Sus páginas internas quedaban esperando un permiso que nunca llegaba, por lo que no se ejecutaban ni la apertura ni el post-hero. No era necesario que el navegador tuviera una copia vieja para que ocurriera.

Además, la apertura se recordaba en sessionStorage y una imagen no lista al llegar un temporizador de 180 ms provocaba que se descartara el efecto.

## Corrección

- `opening-bridge.js`: admite HTTP/HTTPS y archivos locales. Usa los eventos load del iframe, sin leer contentDocument entre orígenes opacos. Valida la ventana emisora exacta y el origen. En file:// se usa postMessage con destino comodín únicamente porque el origen es opaco.
- Los tres `assets/motion.js`: aceptan el permiso del padre en file://, esperan la carga real de la foto y conservan el estado por instancia de página. Ya no guardan un bloqueo de apertura en sessionStorage. Alternar opciones no la repite; recargar sí permite verla otra vez.
- La preferencia de movimiento reducido se sigue respetando. No se cambian los mecanismos, los textos del hero ni los datos deportivos.

## Verificación y límite

La prueba unitaria ejecutó el código real con dobles de DOM y mensajes: reprodujo cero registros/animaciones en el hijo file:// anterior y comprobó el intercambio corregido para file:// y HTTP, rechazo de ventanas/orígenes ajenos y espera de una foto tardía. No es una prueba visual de doble clic.

En Chromium por HTTP se recorrió el comparador y se comprobaron, con tiempos reales y scroll manual, las animaciones de las tres aperturas y los tres post-heroes. Resultados en `evidencia_08/fix_v3/`. La imagen adjunta es una hoja de fotogramas controlados de la apertura 03 por HTTP.

Este entorno bloquea la navegación file:// del navegador de pruebas. Por eso la apertura local corregida se verificó mediante pruebas de lógica, pero no se afirma haberla probado visualmente con doble clic en un navegador real. Las pruebas y los informes previos se conservan como históricos; esta corrección reemplaza sus indicaciones sobre sessionStorage y soporte file://.
