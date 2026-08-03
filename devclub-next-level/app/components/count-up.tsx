type CountUpProps = {
  /** Valor al que llega el contador. */
  value: number;
  /** Decimales visibles, por ejemplo 1 para "1.8". */
  decimals?: number;
  /** Mínimo de caracteres del número: fuerza ceros a la izquierda ("01"). */
  pad?: number;
  prefix?: string;
  suffix?: string;
};

/**
 * Un número que cuenta desde cero al entrar en pantalla.
 *
 * El componente solo pinta el estado inicial y deja el valor final en atributos
 * `data-*`. Quien anima es el hook `useAnimatedCounters`, que los lee del DOM.
 * Así el conteo no provoca re-renders de React en cada frame.
 */
export function CountUp({
  value,
  decimals = 0,
  pad = 0,
  prefix = "",
  suffix = "",
}: CountUpProps) {
  // El contador vive dentro de titulares enormes. Si el texto pasara de "0" a
  // "42" el bloque cambiaría de ancho y empujaría lo que tiene al lado, así que
  // reservamos desde el principio los caracteres del valor final.
  const width = Math.max(pad, value.toFixed(decimals).length);
  const initial = (0).toFixed(decimals).padStart(width, "0");

  return (
    <span
      className="count-up"
      data-count={value}
      data-count-decimals={decimals}
      data-count-pad={width}
      data-count-prefix={prefix}
      data-count-suffix={suffix}
      // El texto cambia 60 veces por segundo: sin esto un lector de pantalla
      // intentaría leer cada paso intermedio.
      role="img"
      aria-label={`${prefix}${value}${suffix}`}
    >
      {prefix}
      {initial}
      {suffix}
    </span>
  );
}
