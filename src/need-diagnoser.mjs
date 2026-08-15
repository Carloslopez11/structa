/* ==========================================================================
   VORION PRECISION NEED DIAGNOSER ENGINE
   ========================================================================== */

export function diagnoseBusinessNeed(business) {
  const name = business.name;
  const status = business.status || (business.website ? "WEBSITE_ACTIVE" : "NO_WEBSITE");
  
  let painPointType = "";
  let urgentNeed = "";
  let recommendedPackage = "";
  let customizedPitch = "";

  if (status === "NO_WEBSITE") {
    painPointType = "Falta de Canal de Conversión en Google Maps";
    urgentNeed = "Cerca del 60% de los usuarios que encuentran a " + name + " en Google Maps desde su smartphone abandonan la búsqueda porque no encuentran un sitio web o botón de cita rápida.";
    recommendedPackage = "Paquete 2: Vorion Growth System + Bot IA 24/7 ($2,490 USD)";
    customizedPitch = `Al no contar con un sitio web enlazado en Google Maps, las personas que buscan servicios en su zona terminan contactando a la competencia que sí ofrece un enlace de agendamiento instantáneo.`;
  } else if (status === "BROKEN_WEBSITE") {
    painPointType = "Falla de Servidor & Fuga Directa de Pacientes/Clientes";
    urgentNeed = "El sitio web enlazado en Google Maps presenta un fallo técnico (enlace roto o servidor no responde). Esto destruye la confianza del cliente al instante.";
    recommendedPackage = "Paquete 1: Emergency Restore + Servidor Cloudflare ($1,250 USD)";
    customizedPitch = `Un enlace web roto en Google Maps genera desconfianza inmediata y hace que el 100% del tráfico interesado rebote hacia otros establecimientos.`;
  } else {
    painPointType = "Falta de Atención e Inteligencia Artificial Fuera de Horario (24/7)";
    urgentNeed = "El 40% de las consultas ocurren después de las 7:00 PM o en fines de semana cuando el personal no está disponible para responder llamadas.";
    recommendedPackage = "Paquete 2: Upgrade a Bot IA 24/7 Sofía ($2,490 USD)";
    customizedPitch = `Su sitio web actual es informativo pero estático; no captura activamente los datos ni agenda citas de los usuarios que navegan de noche o fuera de horario comercial.`;
  }

  return {
    painPointType,
    urgentNeed,
    recommendedPackage,
    customizedPitch
  };
}
