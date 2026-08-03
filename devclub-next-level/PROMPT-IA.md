# Prompt maestro — DevClub Scroll Experience

Pega este prompt completo en Claude, Gemini o cualquier IA que vaya a revisar el proyecto.

---

Actúa como un ingeniero senior de frontend especializado en landing pages cinematográficas, storytelling por scroll, React, TypeScript, CSS moderno, rendimiento y accesibilidad.

## Contexto

Estamos construyendo una página institucional para un concurso de DevClub. Los criterios de evaluación son:

- 50% impacto visual y originalidad.
- 30% animaciones y microinteracciones.
- 20% calidad y organización del código.

La experiencia principal empieza con un núcleo orbital y se transforma, mediante el scroll, en la escena de un joven desarrollador. No queremos un video automático: el usuario debe controlar la animación al bajar y también al subir. La escena humana no puede quedar como una imagen estática después de aparecer.

Ya existe una versión funcional. Tu función es mejorarla respetando la misma línea de código, no crear otra página ni sustituir decisiones que ya funcionan. El código debe seguir siendo comprensible para una persona amateur que tendrá que exponerlo y defender cada decisión.

## Dirección visual obligatoria

La identidad debe sentirse tecnológica, cinematográfica, madura y coherente. No uses verde neón saturado ni grandes áreas blancas puras.

Usa este sistema de color como fuente única:

- Fondo principal: `#050806`.
- Superficie oscura: `#0A100C`.
- Superficie elevada: `#101A13`.
- Blanco cálido: `#E7EBE4`.
- Texto secundario claro: `#B8C0B6`.
- Verde principal: `#759F59`.
- Verde claro para pequeños acentos: `#9BBC81`.
- Verde profundo: `#365432`.
- Líneas: `rgba(132, 166, 109, 0.18)`.

El verde claro solo se permite en detalles pequeños: etiquetas, líneas de progreso, bordes activos y destellos. Las superficies grandes deben usar negro, verde profundo o blanco cálido. Evita combinar nuevos colores fuera de esta paleta.

## Comportamiento obligatorio del scroll

La sección inicial debe permanecer fija mientras la página recorre aproximadamente `400vh`.

1. De 0% a 18%: hero orbital visible.
2. De 18% a 52%: el hero sale, el núcleo acelera y el destello llena la pantalla.
3. De 47% a 78%: aparece el joven desarrollador mediante máscara circular.
4. De 58% a 94%: la escena humana continúa moviéndose con el scroll:
   - la fotografía hace un desplazamiento y zoom muy suaves;
   - el texto sube ligeramente;
   - los paneles de código se mueven a velocidades y direcciones distintas;
   - una línea de escaneo atraviesa al personaje;
   - un indicador muestra el progreso de la escena;
   - todo debe funcionar en reversa al subir.

La primera imagen orbital también debe moverse completa, no solo el núcleo del centro. El fondo rasterizado hace un parallax suave con el mouse y con el progreso del scroll; el núcleo, las órbitas y el texto se mueven en capas separadas para crear profundidad.

Usa un solo listener pasivo de scroll, `requestAnimationFrame`, valores limitados entre 0 y 1 y variables CSS. No agregues una dependencia pesada si la solución actual ya funciona. Conserva `prefers-reduced-motion`.

## Microinteracciones premium obligatorias

- En dispositivos con mouse, tarjetas, módulos y botones deben responder a la posición del puntero.
- Usa el atributo existente `data-premium-hover` y variables CSS (`--hover-x`, `--hover-y`, `--tilt-x`, `--tilt-y`).
- Mantén inclinaciones pequeñas, entre 5 y 6 grados como máximo.
- Combina elevación, brillo localizado y cambio de borde; no hagas movimientos bruscos.
- En pantallas táctiles no dependas del hover para mostrar información.
- Con `prefers-reduced-motion`, elimina inclinaciones, parallax y transiciones no esenciales.

## Contadores obligatorios

Todos los números que representan resultados o progreso deben empezar en 0 y llegar al valor final cuando entran en pantalla. Ya existe el componente reutilizable `CountUp`.

- Usa `IntersectionObserver` para iniciar cada contador una sola vez.
- Usa `requestAnimationFrame` y una curva `ease-out`.
- Conserva prefijos, sufijos, decimales y ceros iniciales.
- No conviertas fechas, horarios, años, líneas de código o identificadores técnicos en contadores.
- Si el usuario prefiere movimiento reducido, muestra inmediatamente el valor final.

## Reglas de implementación

- Stack existente: React + TypeScript + CSS.
- Conserva la arquitectura actual y los archivos existentes.
- Archivos principales: `app/devclub-experience.tsx` y `app/globals.css`.
- No instales GSAP, Framer Motion ni otra librería: esta versión usa APIs nativas del navegador y variables CSS.
- No reescribas toda la página.
- No cambies copy, secciones o imágenes sin justificarlo.
- No agregues colores nuevos.
- Mantén la transición orbital y la escena humana como protagonistas; las demás interacciones deben ser cortas, sutiles y coherentes.
- Evita saltos de layout, scroll horizontal accidental y animaciones que dependan solo del tiempo.
- Mantén texto legible y contraste WCAG AA.
- En móvil, conserva el concepto con una composición vertical y menos elementos simultáneos.
- Todo debe poder explicarse línea por línea en una entrevista técnica.

## Tu tarea

Primero audita el código y enumera solo problemas comprobables. Después propone cambios pequeños y concretos. Finalmente entrega un diff, no una reescritura completa. No modifiques más de dos archivos por respuesta. Para cada cambio explica:

1. qué problema resuelve;
2. cómo se conecta con el progreso del scroll;
3. impacto en escritorio y móvil;
4. impacto en rendimiento y accesibilidad.

## Checklist antes de responder

- La persona también se mueve con el scroll.
- La imagen orbital completa se mueve; no solo el núcleo.
- El movimiento se revierte al subir.
- Los elementos con `data-premium-hover` responden al mouse sin marear.
- Los resultados numéricos cuentan desde 0 al entrar en pantalla.
- El verde ya no domina visualmente.
- Negro, verde y blanco cálido forman un sistema coherente.
- No hay texto ilegible sobre la fotografía.
- No hay transformaciones bruscas al terminar la escena.
- La versión móvil mantiene la narrativa.
- `prefers-reduced-motion` elimina movimientos no esenciales.
- No hay errores de TypeScript, lint o build.

Si una idea no mejora claramente uno de los tres criterios del concurso, no la implementes.
