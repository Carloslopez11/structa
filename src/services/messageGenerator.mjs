import { getActivePackageInfo } from "./packages.mjs";

/**
 * Genera la secuencia de prospección de WhatsApp de 3 pasos.
 * 
 * REGLAS OBLIGATORIAS:
 * 1. NUNCA inventar un nombre de closer/firmante. `closerName` es OBLIGATORIO. Si falta, lanza Error.
 * 2. NUNCA mencionar oficinas físicas o sedes inventadas (Miami, São Paulo, etc.). Se presenta como equipo remoto internacional.
 * 3. NUNCA prometer resultados garantizados (posiciones fijas o citas forzadas en IA).
 */
export function generateWhatsAppSequence({
  businessName,
  mapsUrl,
  opportunity,
  demoUrl,
  closerName,
  city = "your area",
  niche = "services"
}) {
  if (!closerName || typeof closerName !== "string" || closerName.trim() === "") {
    throw new Error(
      "El parámetro 'closerName' es OBLIGATORIO para generar la secuencia de mensajes. No se permite valor por defecto silencioso."
    );
  }

  const cleanCloser = closerName.trim();
  const pkgInfo = getActivePackageInfo(opportunity.recommendedPackage);

  const step1 =
    `Hi ${businessName} team! Quick question regarding your profile on Google Maps... 📍\n` +
    `I noticed something about how it shows up to people searching after hours — do you have 2 minutes this week?`;

  let step3 = "";

  if (opportunity.scoreKey === "NO_WEBSITE") {
    step3 =
      `Thanks for getting back to me! Quick context: your Google Maps listing doesn't currently have a direct website link for mobile booking. ` +
      `When potential customers search after 7 PM or on weekends, many bounce to other providers who offer instant booking.\n\n` +
      `We build fast, mobile-friendly landing pages (no installation cost) with 24/7 AI lead capture.\n\n` +
      `I put together a 30-second preview of what an always-on version could look like for ${businessName}: ${demoUrl}\n\n` +
      `Our monthly service is ${pkgInfo.activeMonthlyRate}${pkgInfo.isFounderRate ? ` (Founder rate, ${pkgInfo.slotsRemaining} slots remaining)` : ""}.\n\n` +
      `Would you be open to taking a quick look?\n\nBest regards,\n${cleanCloser} | Vorion Digital`;
  } else if (opportunity.scoreKey === "BROKEN_WEBSITE") {
    step3 =
      `Thanks for the reply! I ran a quick check and your current website link isn't loading properly right now, which may cause mobile visitors to bounce.\n\n` +
      `We provide high-speed, protected landing pages (no installation fee) backed by 24/7 AI response.\n\n` +
      `Here is a 30-second preview of a restored version for ${businessName}: ${demoUrl}\n\n` +
      `Our monthly service is ${pkgInfo.activeMonthlyRate}${pkgInfo.isFounderRate ? ` (Founder rate, ${pkgInfo.slotsRemaining} slots remaining)` : ""}.\n\n` +
      `Open to taking a look?\n\nBest regards,\n${cleanCloser} | Vorion Digital`;
  } else if (opportunity.recommendedPackage === "PACKAGE_4_AI_VISIBILITY" || opportunity.scoreKey === "WEBSITE_HIGH_PRESENCE_GEO") {
    step3 =
      `Thanks for getting back to me!\n\n` +
      `Your website is live, but when locals search conversational AI engines like ChatGPT, Perplexity, or Google AI Overviews for top ${niche} in ${city}, ` +
      `unstructured code and missing Schema.org JSON-LD data often prevent AI engines from citing your services.\n\n` +
      `We implement verified technical Schema structuring and Google Business Profile AI sync so AI engines can properly read and reference your site.\n\n` +
      `📌 Note: While no one can guarantee specific placement rankings in AI models, our engineering ensures your data is verified and fully indexable.\n\n` +
      `Monthly optimization is ${pkgInfo.activeMonthlyRate}${pkgInfo.isFounderRate ? ` (Founder rate, ${pkgInfo.slotsRemaining} slots remaining)` : ""}.\n\n` +
      `Here's a 30-second preview: ${demoUrl}\n\n` +
      `Open to a quick 5-minute chat?\n\nBest regards,\n${cleanCloser} | Vorion Digital`;
  } else {
    // Active website - Sofía 24/7 AI qualification & booking
    step3 =
      `Thanks for getting back to me! Your website looks solid, but it's currently missing an automated 24/7 assistant like Sofía to capture inquiries after hours or on weekends when the office is closed.\n\n` +
      `Here's a 30-second interactive preview of what Sofía would look like capturing and qualifying leads for ${businessName}: ${demoUrl}\n\n` +
      `Monthly service is ${pkgInfo.activeMonthlyRate}${pkgInfo.isFounderRate ? ` (Founder rate, ${pkgInfo.slotsRemaining} slots remaining)` : ""}.\n\n` +
      `Would you like to take a look?\n\nBest regards,\n${cleanCloser} | Vorion Digital`;
  }

  return {
    customerMessages: {
      step1_hook: step1,
      step2_wait: "(Esperar respuesta del cliente antes de continuar — no enviar el paso 3 en frío.)",
      step3_proposal: step3,
    },
    internalNotes: {
      resumenEs: `Prospecto: ${businessName}. Diagnóstico: ${opportunity.emoji || "🎯"} ${opportunity.label} (Score ${opportunity.score}). Paquete: ${pkgInfo.nameEs} — ${pkgInfo.activeMonthlyRate}.`,
      closerAsignado: cleanCloser,
      posicionamiento: "Equipo remoto internacional especializado en sistemas de conversión e infraestructura de IA."
    },
    recommendedPackage: pkgInfo,
  };
}
