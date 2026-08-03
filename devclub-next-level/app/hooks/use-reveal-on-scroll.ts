"use client";

import { useEffect } from "react";

/** Parte del elemento que debe verse para considerarlo visible. */
const VISIBLE_RATIO = 0.16;

/**
 * Añade la clase `is-visible` a cada elemento con `data-reveal` cuando entra en
 * pantalla. El fundido y el desplazamiento los define el CSS: aquí solo se
 * decide el "cuándo".
 *
 * Un solo IntersectionObserver vigila todos los elementos. Es mucho más barato
 * que calcular posiciones en el evento de scroll, porque el navegador hace el
 * trabajo fuera del hilo principal.
 */
export function useRevealOnScroll() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          // Una vez revelado ya no nos interesa: dejamos de observarlo.
          observer.unobserve(entry.target);
        });
      },
      { threshold: VISIBLE_RATIO },
    );

    document
      .querySelectorAll("[data-reveal]")
      .forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);
}
