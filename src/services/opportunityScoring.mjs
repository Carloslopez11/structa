/**
 * Matriz de diagnóstico de necesidad -> Score de Oportunidad & Recomendación Inteligente de Paquetes.
 * Mientras más alto el score, más urgente/fácil es la venta.
 */

export const SCORE_LABELS = {
  NO_WEBSITE: { score: 5.0, emoji: "🔴", label: "NO_WEBSITE" },
  BROKEN_WEBSITE: { score: 4.5, emoji: "⚠️", label: "BROKEN_WEBSITE" },
  WEBSITE_NO_AI: { score: 3.5, emoji: "🟡", label: "WEBSITE_ACTIVE_NO_AI" },
  WEBSITE_HIGH_PRESENCE_GEO: { score: 3.8, emoji: "🧠", label: "WEBSITE_ACTIVE_GEO_TARGET" },
  WEBSITE_OPTIMIZED: { score: 1.5, emoji: "🟢", label: "WEBSITE_OPTIMIZED" },
};

// Nichos donde la mayoría ya tiene página web activa -> Se les ofrece Paquete 4 (Visibilidad en IA / GEO)
const HIGH_PRESENCE_NICHES = [
  "dentist", "dentista", "dental",
  "lawyer", "abogado", "attorney", "legal",
  "medical", "medico", "doctor", "clinic", "clinica",
  "accountant", "contador", "cpa"
];

/**
 * Recomienda uno de los 4 paquetes High-Ticket según el diagnóstico y el nicho.
 */
export function recommendPackage(scoreLabel, niche = "") {
  switch (scoreLabel) {
    case "NO_WEBSITE":
    case "BROKEN_WEBSITE":
      return "PACKAGE_1_EMERGENCY_RESTORE";
    case "WEBSITE_NO_AI":
      return "PACKAGE_2_GROWTH_SYSTEM";
    case "WEBSITE_HIGH_PRESENCE_GEO":
      return "PACKAGE_4_AI_VISIBILITY";
    default:
      return "PACKAGE_3_ENTERPRISE_DOMINATION";
  }
}

export function computeOpportunity(place, healthResult, niche = "") {
  let scoreKey;
  const isHighPresenceNiche = HIGH_PRESENCE_NICHES.some(n => 
    (niche || "").toLowerCase().includes(n) || (place.name || "").toLowerCase().includes(n)
  );

  if (healthResult.status === "NO_WEBSITE") {
    scoreKey = "NO_WEBSITE";
  } else if (healthResult.status === "BROKEN_WEBSITE") {
    scoreKey = "BROKEN_WEBSITE";
  } else if (healthResult.status === "WEBSITE_ACTIVE" && isHighPresenceNiche) {
    scoreKey = "WEBSITE_HIGH_PRESENCE_GEO";
  } else if (healthResult.status === "WEBSITE_ACTIVE" && !healthResult.hasAiAssistant) {
    scoreKey = "WEBSITE_NO_AI";
  } else {
    scoreKey = "WEBSITE_OPTIMIZED";
  }

  const meta = SCORE_LABELS[scoreKey];
  const rating = typeof place.rating === "number" ? place.rating : null;
  const reviews = typeof place.user_ratings_total === "number" ? place.user_ratings_total : 0;

  // Bonus: negocios con muchas reseñas y buen rating pierden más dinero por hora
  const priorityBoost = reviews >= 100 && rating && rating >= 4.2 ? 0.3 : 0;

  return {
    scoreKey,
    score: Number((meta.score + priorityBoost).toFixed(1)),
    emoji: meta.emoji,
    label: meta.label,
    recommendedPackage: recommendPackage(scoreKey, niche),
    hasAiAssistant: healthResult.hasAiAssistant,
    mobileOptimized: healthResult.mobileOptimized,
  };
}

/**
 * Texto de justificación de ROI/dolor comercial (uso interno, en español).
 */
export function buildRoiNarrative({ businessName, apiRank }) {
  return (
    `Diagnóstico interno (${businessName}): aproximadamente el 40% de las búsquedas ` +
    `en Google Maps y motores de IA (ChatGPT, Perplexity) ocurren fuera del horario laboral. ` +
    `Si la empresa no cuenta con datos estructurados Schema.org o con un asistente de IA 24/7, ` +
    `pierde clientes frente a competidores citados por los motores de IA. Posición API: #${apiRank}.`
  );
}
