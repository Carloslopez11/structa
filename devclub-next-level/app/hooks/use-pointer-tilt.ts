"use client";

import { useEffect } from "react";
import { TILT_MAX_DEGREES, clamp } from "../lib/animation";

/**
 * Inclina ligeramente cualquier elemento con `data-premium-hover` según dónde
 * esté el puntero, y coloca un brillo en esa misma posición.
 *
 * Detalle importante: hay **un solo listener** en `document`, no uno por
 * tarjeta. Con `closest()` averiguamos sobre qué componente está el puntero.
 * Con decenas de tarjetas en la página, un listener por cada una sería
 * memoria y trabajo desperdiciados.
 *
 * Se desactiva por completo en pantallas táctiles y con movimiento reducido.
 */
export function usePointerTilt() {
  useEffect(() => {
    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if (!supportsHover.matches || prefersReducedMotion.matches) return;

    let activeElement: HTMLElement | null = null;

    /** Devuelve el elemento a su posición de reposo y limpia las variables. */
    const reset = (element: HTMLElement | null) => {
      if (!element) return;
      element.style.setProperty("--tilt-x", "0deg");
      element.style.setProperty("--tilt-y", "0deg");
      element.style.setProperty("--hover-x", "50%");
      element.style.setProperty("--hover-y", "50%");
      element.classList.remove("is-pointer-active");
    };

    const onPointerMove = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(
        "[data-premium-hover]",
      );

      // Si cambiamos de tarjeta, la anterior tiene que volver a su sitio.
      if (target !== activeElement) {
        reset(activeElement);
        activeElement = target ?? null;
      }
      if (!target) return;

      // Posición del puntero dentro del elemento, de 0 a 1.
      const rect = target.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width);
      const y = clamp((event.clientY - rect.top) / rect.height);

      target.style.setProperty("--hover-x", `${(x * 100).toFixed(1)}%`);
      target.style.setProperty("--hover-y", `${(y * 100).toFixed(1)}%`);
      // Arriba inclina hacia atrás, abajo hacia delante: de ahí el 0.5 − y.
      target.style.setProperty(
        "--tilt-x",
        `${((0.5 - y) * TILT_MAX_DEGREES.x).toFixed(2)}deg`,
      );
      target.style.setProperty(
        "--tilt-y",
        `${((x - 0.5) * TILT_MAX_DEGREES.y).toFixed(2)}deg`,
      );
      target.classList.add("is-pointer-active");
    };

    const onPointerOut = (event: PointerEvent) => {
      const next = event.relatedTarget as Element | null;
      // Solo soltamos si el puntero salió de verdad del componente,
      // no al pasar por encima de un hijo.
      if (activeElement && (!next || !activeElement.contains(next))) {
        reset(activeElement);
        activeElement = null;
      }
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerout", onPointerOut, { passive: true });

    return () => {
      reset(activeElement);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerOut);
    };
  }, []);
}
