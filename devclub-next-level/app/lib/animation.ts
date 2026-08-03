/**
 * Valores compartidos por todas las animaciones de la página.
 * Están aquí para que ajustar el ritmo de una escena sea cambiar un número
 * en un solo sitio, y no buscarlo repetido dentro de los componentes.
 */

/** Limita un número a un rango. Por defecto 0–1, que es el rango de progreso. */
export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

/**
 * Tramos de la secuencia del hero, medidos en progreso de scroll
 * (0 = la escena acaba de fijarse, 1 = está a punto de soltarse).
 *
 * Cada tramo se convierte en una variable CSS con su propio 0–1, así que las
 * capas de la escena pueden animarse en momentos distintos y solapados.
 */
export const SCENE_STEPS = {
  /** El hero orbital se desenfoca y se va. */
  heroOut: { start: 0.18, length: 0.34 },
  /** Destello de luz que tapa el cambio de escena. */
  flash: { start: 0.35, length: 0.28 },
  /** Entrada del retrato del desarrollador. */
  humanIn: { start: 0.47, length: 0.31 },
  /** Recorrido de cámara dentro de la escena humana. */
  humanTravel: { start: 0.58, length: 0.36 },
} as const;

/** Cuánto se acerca la cámara a la posición del puntero en cada frame (0–1). */
export const POINTER_EASING = 0.08;

/** Por debajo de esta diferencia damos el movimiento por terminado. */
export const POINTER_SETTLED = 0.0005;

/** Duración del conteo de números, en milisegundos. */
export const COUNT_DURATION_MS = { short: 1300, long: 1800 } as const;

/** A partir de este valor el número usa la duración larga. */
export const COUNT_LONG_THRESHOLD = 1000;

/** Inclinación máxima de las tarjetas al pasar el puntero, en grados. */
export const TILT_MAX_DEGREES = { x: 5, y: 6 } as const;
