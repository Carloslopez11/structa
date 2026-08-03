"use client";

import { useEffect } from "react";
import {
  COUNT_DURATION_MS,
  COUNT_LONG_THRESHOLD,
  clamp,
} from "../lib/animation";

/** Parte del número que debe verse antes de empezar a contar. */
const VISIBLE_RATIO = 0.45;

/**
 * Hace que cada `<CountUp>` cuente desde cero cuando aparece en pantalla.
 *
 * El componente deja el valor final en atributos `data-*`; este hook lo lee del
 * DOM y anima el texto. Se hace así, y no con estado de React, porque cambiar
 * estado 60 veces por segundo obligaría a re-renderizar el árbol entero en cada
 * frame: escribir `textContent` toca un solo nodo.
 */
export function useAnimatedCounters() {
  useEffect(() => {
    // Guardamos los IDs de frame para poder cancelarlos al desmontar.
    const frames = new Set<number>();
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target as HTMLElement;
          // Cada número se anima una sola vez, aunque se vuelva a ver.
          if (element.dataset.counted === "true") return;
          element.dataset.counted = "true";

          const target = Number(element.dataset.count ?? 0);
          const decimals = Number(element.dataset.countDecimals ?? 0);
          const pad = Number(element.dataset.countPad ?? 0);
          const prefix = element.dataset.countPrefix ?? "";
          const suffix = element.dataset.countSuffix ?? "";

          const render = (value: number) => {
            // El relleno con ceros mantiene constante el número de caracteres,
            // así el bloque nunca cambia de ancho mientras cuenta.
            const text = value.toFixed(decimals).padStart(pad, "0");
            element.textContent = `${prefix}${text}${suffix}`;
          };

          // Con movimiento reducido mostramos el resultado, sin animación.
          if (prefersReducedMotion) {
            render(target);
            observer.unobserve(element);
            return;
          }

          const duration =
            target >= COUNT_LONG_THRESHOLD
              ? COUNT_DURATION_MS.long
              : COUNT_DURATION_MS.short;

          let startTime = 0;
          const step = (time: number) => {
            if (!startTime) startTime = time;
            const progress = clamp((time - startTime) / duration);
            // Easing "out cubic": arranca rápido y frena al final.
            const eased = 1 - Math.pow(1 - progress, 3);
            render(target * eased);

            if (progress < 1) {
              frames.add(requestAnimationFrame(step));
              return;
            }
            // Último fotograma exacto, sin errores de redondeo.
            render(target);
            observer.unobserve(element);
          };

          frames.add(requestAnimationFrame(step));
        });
      },
      { threshold: VISIBLE_RATIO },
    );

    document
      .querySelectorAll("[data-count]")
      .forEach((element) => observer.observe(element));

    return () => {
      frames.forEach((id) => cancelAnimationFrame(id));
      observer.disconnect();
    };
  }, []);
}
