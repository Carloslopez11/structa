"use client";

import { type RefObject, useEffect } from "react";
import {
  POINTER_EASING,
  POINTER_SETTLED,
  SCENE_STEPS,
  clamp,
} from "../lib/animation";

/**
 * Traduce el scroll y la posición del puntero a variables CSS.
 *
 * El JavaScript solo escribe números; todo el movimiento visible lo hace el CSS
 * leyendo esas variables. Por eso la animación es reversible sin código extra:
 * si el usuario sube, los números bajan y las capas vuelven solas.
 *
 * Un único bucle actualiza las dos secciones fijadas. Antes había un listener de
 * scroll por sección, y el navegador repetía el trabajo en cada frame.
 */
export function useSceneProgress(
  sequenceRef: RefObject<HTMLElement | null>,
  formationRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const sequence = sequenceRef.current;
    const formation = formationRef.current;
    if (!sequence) return;

    let frame = 0;
    let running = false;

    // Dónde está el puntero (target) y dónde está la cámara (actual).
    // La cámara persigue al puntero poco a poco en lugar de saltar a él.
    const pointer = { targetX: 0, targetY: 0, x: 0, y: 0 };

    /** Convierte el progreso general en el 0–1 de un tramo concreto. */
    const stepProgress = (
      progress: number,
      step: { start: number; length: number },
    ) => clamp((progress - step.start) / step.length);

    /** Cuánto ha avanzado una sección fijada, de 0 a 1. */
    const sectionProgress = (section: HTMLElement) => {
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      return clamp(-rect.top / scrollable);
    };

    const updateScroll = () => {
      const progress = sectionProgress(sequence);
      sequence.style.setProperty("--scene-progress", progress.toFixed(4));
      sequence.style.setProperty(
        "--hero-out",
        stepProgress(progress, SCENE_STEPS.heroOut).toFixed(4),
      );
      // El destello sube y baja: seno de 0 a π da 0 → 1 → 0.
      sequence.style.setProperty(
        "--flash",
        Math.sin(stepProgress(progress, SCENE_STEPS.flash) * Math.PI).toFixed(4),
      );
      sequence.style.setProperty(
        "--human-in",
        stepProgress(progress, SCENE_STEPS.humanIn).toFixed(4),
      );
      sequence.style.setProperty(
        "--human-travel",
        stepProgress(progress, SCENE_STEPS.humanTravel).toFixed(4),
      );

      if (!formation) return;
      formation.style.setProperty(
        "--formation-progress",
        sectionProgress(formation).toFixed(4),
      );
    };

    /** Acerca la cámara al puntero. Devuelve false cuando ya llegó. */
    const updatePointer = () => {
      pointer.x += (pointer.targetX - pointer.x) * POINTER_EASING;
      pointer.y += (pointer.targetY - pointer.y) * POINTER_EASING;
      sequence.style.setProperty("--pointer-x", pointer.x.toFixed(4));
      sequence.style.setProperty("--pointer-y", pointer.y.toFixed(4));

      return (
        Math.abs(pointer.targetX - pointer.x) > POINTER_SETTLED ||
        Math.abs(pointer.targetY - pointer.y) > POINTER_SETTLED
      );
    };

    const tick = () => {
      updateScroll();
      if (updatePointer()) {
        frame = requestAnimationFrame(tick);
      } else {
        // La cámara ya está en su sitio: dejamos de pedir frames.
        running = false;
      }
    };

    const requestTick = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      // De coordenadas de pantalla a un rango −1…1 con el centro en 0.
      pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.targetY = (event.clientY / window.innerHeight - 0.5) * 2;
      requestTick();
    };

    const resetPointer = () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
      requestTick();
    };

    updateScroll();
    updatePointer();
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick);
    sequence.addEventListener("pointermove", onPointerMove, { passive: true });
    sequence.addEventListener("pointerleave", resetPointer);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", requestTick);
      sequence.removeEventListener("pointermove", onPointerMove);
      sequence.removeEventListener("pointerleave", resetPointer);
    };
  }, [sequenceRef, formationRef]);
}
