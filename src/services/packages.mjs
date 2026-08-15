/**
 * Definición oficial de Paquetes y Tiers de Vorion OS.
 * 
 * MODELO DE NEGOCIO:
 * - Sitio web / Landing page: $0 setup (sin costo de instalación, incluido).
 * - Niveles de suscripción mensual de Sofía (Asistente de IA):
 *   * Nivel 1 (Chat 24/7): $199/mes
 *   * Nivel 2 (Calificación + Agenda): $349 - $399/mes
 *   * Nivel 3 (Voz Completa con Retell AI): $599 - $899/mes
 * 
 * REGLA DE NEGOCIO OBLIGATORIA (REGLA 5):
 * Los precios y cupos de fundador se controlan MANUALMENTE por el usuario.
 * NUNCA automatizar el decremento de cupos ni cambiar precios solo.
 */

// Control manual de cupos de fundador (actualizado a mano por el usuario)
export const FOUNDER_RATE_ACTIVE = true;
export const FOUNDER_SLOTS_REMAINING = 3;

export const PACKAGES = {
  PACKAGE_1_EMERGENCY_RESTORE: {
    id: "PACKAGE_1_EMERGENCY_RESTORE",
    tier: "TIER_1_CHAT",
    nameEn: "Emergency Restore + 24/7 Chat Assistant",
    nameEs: "Restauración Móvil de Emergencia + Chat Asistente 24/7",
    setupCost: "$0 USD (Included / Sin costo de instalación)",
    monthlyRegular: "$199/mo",
    monthlyFounder: "$149/mo",
    descriptionEn: "High-speed mobile website on Cloudflare + 24/7 Chat Assistant to capture lost after-hours traffic.",
    descriptionEs: "Landing page móvil rápida en Cloudflare + Asistente de Chat 24/7 para captar clientes fuera de horario.",
  },
  PACKAGE_2_GROWTH_SYSTEM: {
    id: "PACKAGE_2_GROWTH_SYSTEM",
    tier: "TIER_2_QUALIFY_AND_BOOK",
    nameEn: "Vorion Growth System — Sofía Qualification & Booking",
    nameEs: "Vorion Growth System — Sofía Calificación y Agenda Automática",
    setupCost: "$0 USD (Included / Sin costo de instalación)",
    monthlyRegular: "$399/mo",
    monthlyFounder: "$349/mo",
    descriptionEn: "Complete conversion system: 24/7 AI Sales Assistant that qualifies leads and books appointments directly.",
    descriptionEs: "Sistema completo de conversión: Asistente IA 24/7 que califica clientes potenciales y agenda citas automáticamente.",
  },
  PACKAGE_3_VOICE_AUTOMATION: {
    id: "PACKAGE_3_VOICE_AUTOMATION",
    tier: "TIER_3_FULL_VOICE",
    nameEn: "Full Voice AI Receptionist — Sofía Phone Automation",
    nameEs: "Recepcionista de Voz IA Completa — Sofía Telefónica",
    setupCost: "$0 USD (Included / Sin costo de instalación)",
    monthlyRegular: "$899/mo",
    monthlyFounder: "$599/mo",
    descriptionEn: "Enterprise voice AI receptionist powered by Retell AI infrastructure. Answers incoming calls, handles emergency routing, and books appointments 24/7.",
    descriptionEs: "Recepcionista de voz con IA impulsada por infraestructura Retell AI. Atiende llamadas entrantes, filtra emergencias y agenda citas 24/7.",
  },
  PACKAGE_4_AI_VISIBILITY: {
    id: "PACKAGE_4_AI_VISIBILITY",
    tier: "TIER_GEO_SCHEMA",
    nameEn: "AI Search Visibility & GEO System",
    nameEs: "Sistema de Visibilidad en Motores de IA (GEO & Schema)",
    setupCost: "$0 USD (Included / Sin costo de instalación)",
    monthlyRegular: "$179/mo",
    monthlyFounder: "$149/mo",
    descriptionEn: "Schema.org JSON-LD structuring, Google Business Profile sync, and FAQ optimization for ChatGPT, Perplexity, and Google AI Overviews.",
    descriptionEs: "Estructuración Schema.org JSON-LD, sincronización de Google Business Profile y optimización FAQ para posicionar el sitio existente en ChatGPT, Perplexity y Google AI Overviews.",
  }
};

/**
 * Obtiene el precio activo según el flag manual FOUNDER_RATE_ACTIVE
 */
export function getActivePackageInfo(packageKey) {
  const pkg = PACKAGES[packageKey] || PACKAGES.PACKAGE_2_GROWTH_SYSTEM;
  const isFounder = FOUNDER_RATE_ACTIVE && FOUNDER_SLOTS_REMAINING > 0;
  
  return {
    ...pkg,
    isFounderRate: isFounder,
    activeMonthlyRate: isFounder ? pkg.monthlyFounder : pkg.monthlyRegular,
    slotsRemaining: FOUNDER_SLOTS_REMAINING
  };
}
