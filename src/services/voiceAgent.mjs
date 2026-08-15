/**
 * Servicio de configuración y sincronización del Agente de Voz Sofía en Retell AI.
 * 
 * REGLAS OBLIGATORIAS:
 * 1. El aviso de grabación ("This call may be recorded for quality and training purposes.") es
 *    OBLIGATORIO al inicio del prompt del agente, por leyes de consentimiento en EE. UU. (Regla 4).
 * 2. NUNCA inventar el nombre del técnico de guardia. `technicianName` es un parámetro OBLIGATORIO.
 *    Si está vacío, la función DEBE fallar inmediatamente con un error claro (Regla 2).
 * 3. NUNCA inventar oficinas físicas ni sedes falsas (Regla 1).
 * 4. Las credenciales SIEMPRE vienen de .env (RETELL_API_KEY) (Regla 7).
 */

const RETELL_API_BASE = "https://api.retellai.com";

/**
 * Genera el prompt oficial de Sofía para Retell AI
 */
export function buildSofiaVoicePrompt({
  businessName = "Texas Roofing Co.",
  technicianName,
  tradeType = "roofing contractor",
  serviceArea = "the local area",
  webhookUrl = ""
}) {
  if (!technicianName || typeof technicianName !== "string" || technicianName.trim() === "") {
    throw new Error(
      "El parámetro 'technicianName' es OBLIGATORIO para configurar el agente de voz Sofía. No se permite valor por defecto silencioso."
    );
  }

  const cleanTechnician = technicianName.trim();

  // Prompt con aviso legal obligatorio de grabación al inicio (Regla 4)
  return `## MANDATORY LEGAL DISCLOSURE (MUST BE DELIVERED FIRST):
"This call may be recorded for quality assurance and appointment coordination."

## AGENT IDENTITY & ROLE:
You are Sofía, the 24/7 Virtual Receptionist and Lead Coordinator for ${businessName}.
You speak in a warm, professional, calm, and reassuring American English tone.
You assist callers inquiring about ${tradeType} services, emergency storm damage repairs, and roof inspections in ${serviceArea}.

## ON-CALL TECHNICIAN & ESCALATIONS:
- The designated on-call field technician for emergency escalations is: ${cleanTechnician}.
- If a caller reports active water leakage, collapsing ceilings, or urgent storm damage, prioritize capturing their address and phone number immediately to notify ${cleanTechnician}.

## CORE RESPONSIBILITIES:
1. Greet the caller warmly and identify their primary need.
2. For Routine Inquiries / Inspections:
   - Ask for their full name, best callback phone number, and physical property address.
   - Ask for a brief description of the roof issue (missing shingles, leak, insurance claim inspection, age of roof).
   - Offer to schedule an on-site assessment slot.
3. For Urgent Leaks & Emergencies:
   - Stay calm and empathetic.
   - Confirm property safety (ensure no electrical hazards).
   - Secure address and phone immediately so ${cleanTechnician} can review urgent dispatch.
4. For Price Questions:
   - Explain that exact pricing requires a direct physical inspection of roof pitch, square footage, and materials, but inspections and initial estimates are provided without obligation.
5. Close the call politely, confirming the next step and that the team has their details.

## STRICT BEHAVIORAL BOUNDARIES:
- Do NOT provide final binding structural guarantees or quotes without on-site inspection.
- Do NOT invent fake physical office addresses. You represent the customer support team coordinating field technicians in the area.
- Keep responses concise (1 to 2 sentences per turn) to sound natural over telephone audio.`;
}

/**
 * Crea o actualiza el agente Sofía en Retell AI
 */
export function createOrUpdateVoiceAgentConfig({
  apiKey,
  agentId = null,
  businessName = "Texas Roofing Co.",
  technicianName,
  webhookUrl = ""
}) {
  const resolvedApiKey = apiKey || process.env.RETELL_API_KEY;
  if (!resolvedApiKey) {
    throw new Error("RETELL_API_KEY no está configurada en .env ni fue provista.");
  }

  if (!technicianName || technicianName.trim() === "") {
    throw new Error("El parámetro 'technicianName' es OBLIGATORIO.");
  }

  const prompt = buildSofiaVoicePrompt({ businessName, technicianName, webhookUrl });

  return {
    agent_name: `Sofía - 24/7 Receptionist (${businessName})`,
    voice_id: "11labs-Adrian", // High-clarity natural telephony voice
    language: "en-US",
    general_prompt: prompt,
    begin_message: `Thank you for calling ${businessName}. This call may be recorded. My name is Sofía, how can I help you today?`,
    webhook_url: webhookUrl,
    responsiveness: 0.9,
    interruption_sensitivity: 0.8,
    enable_backchannel: true,
    ambient_sound: "coffee-shop",
    post_call_analysis_data: [
      { type: "string", name: "caller_name", description: "Full name of the caller" },
      { type: "string", name: "reason_for_call", description: "Main reason for the call (leak, inspection, estimate, emergency)" },
      { type: "string", name: "urgency", description: "Urgency level: low, normal, high, or emergency" },
      { type: "boolean", name: "appointment_requested", description: "Whether the caller requested an inspection or appointment" },
      { type: "string", name: "property_address", description: "Physical address of the roof property" }
    ]
  };
}

/**
 * Publica la configuración a la API de Retell AI
 */
export async function syncAgentWithRetell({
  apiKey,
  agentId = null,
  businessName = "Texas Roofing Co.",
  technicianName,
  webhookUrl = ""
}) {
  const token = apiKey || process.env.RETELL_API_KEY;
  if (!token) {
    throw new Error("RETELL_API_KEY es requerida para sincronizar con Retell AI.");
  }

  const payload = createOrUpdateVoiceAgentConfig({
    apiKey: token,
    agentId,
    businessName,
    technicianName,
    webhookUrl
  });

  const url = agentId 
    ? `${RETELL_API_BASE}/update-agent/${agentId}` 
    : `${RETELL_API_BASE}/create-agent`;

  const method = agentId ? "PATCH" : "POST";

  const response = await fetch(url, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Retell AI API devolvió status ${response.status}: ${errorText}`);
  }

  return await response.json();
}
