import { searchLiveGoogleMaps } from "./google-maps-live.mjs";
import { checkWebsiteHealth } from "./services/websiteHealthChecker.mjs";
import { computeOpportunity } from "./services/opportunityScoring.mjs";
import { generateWhatsAppSequence } from "./services/messageGenerator.mjs";

/**
 * 100% OPERATIONAL HYBRID GOOGLE MAPS PROSPECTING ENGINE
 * Combines Google Places API, Direct Extraction, and Live Website Health Diagnostics.
 */
export async function searchGoogleMapsProspects({ niche, city, country = "USA", apiKey = process.env.GOOGLE_MAPS_API_KEY }) {
  console.log(`[Hybrid Prospector Engine] Running analysis for: "${niche} in ${city}, ${country}"...`);
  
  // 1. Fetch raw listings from Google Maps Live Engine
  const rawListings = await searchLiveGoogleMaps(niche, city, apiKey);
  
  // 2. Perform automated website health diagnostics & opportunity scoring
  const enrichedProspects = await Promise.all(
    rawListings.map(async (item) => {
      const health = await checkWebsiteHealth(item.website);
      const scoreData = computeOpportunity(item, health, niche);

      const messageData = generateWhatsAppSequence({
        businessName: item.name,
        mapsUrl: item.sourceUrl || `https://www.google.com/maps/search/${encodeURIComponent(item.name + " " + city)}`,
        opportunity: scoreData,
        demoUrl: "https://vorion-preview.pages.dev/preview/miami-dental/",
        niche: niche,
        city: city
      });

      return {
        ...item,
        status: health.status,
        score: scoreData.score,
        reason: scoreData.label,
        painPoint: scoreData.label === "NO_WEBSITE" 
          ? `Sin sitio web en Google Maps (${item.city || city}). Fuga del 60% del tráfico móvil.`
          : scoreData.label === "WEBSITE_ACTIVE_GEO_TARGET"
            ? `Sitio web activo pero invisible en ChatGPT, Perplexity y Google AI Overviews.`
            : `Servidor web caído o inaccesible desde celular.`,
        pitchConcept: scoreData.recommendedPackage === "PACKAGE_4_AI_VISIBILITY"
          ? "AI Search Visibility & GEO System ($1,200 USD Setup)"
          : scoreData.recommendedPackage === "PACKAGE_1_EMERGENCY_RESTORE"
            ? "Emergency Restore + Servidor Cloudflare ($1,000 USD Setup)"
            : "Vorion Growth System + Bot IA 24/7 Sofía ($2,000 USD Setup)",
        proposalSubject: `Ideas para la visibilidad en IA y captación de clientes en ${item.name}`,
        proposalBody: messageData.customerMessages.step3_proposal,
        spanishReference: messageData.internalNotes.resumenEs,
        whatsAppScript: messageData.customerMessages.step1_hook
      };
    })
  );

  return enrichedProspects;
}
