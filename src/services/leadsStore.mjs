import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "../..");
const dataDir = path.join(rootDir, "data");
const leadsFilePath = path.join(dataDir, "leads.json");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(leadsFilePath)) {
    fs.writeFileSync(leadsFilePath, JSON.stringify([], null, 2), "utf8");
  }
}

/**
 * Carga todos los leads almacenados en data/leads.json
 */
export function getLeads() {
  ensureDataDir();
  try {
    const content = fs.readFileSync(leadsFilePath, "utf8");
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("[LeadsStore] Error leyendo leads.json:", err.message);
    return [];
  }
}

/**
 * Guarda o actualiza un lead capturado por Retell AI webhook o formulario
 */
export function saveOrUpdateLead(leadData) {
  ensureDataDir();
  const leads = getLeads();
  const callId = leadData.call_id || leadData.id || `lead_${Date.now()}`;
  
  const existingIndex = leads.findIndex((l) => l.call_id === callId || l.id === callId);

  const timestamp = new Date().toISOString();
  const leadEntry = {
    id: callId,
    call_id: callId,
    caller_name: leadData.caller_name || leadData.name || "Unknown Caller",
    caller_phone: leadData.caller_phone || leadData.from_number || leadData.phone || "",
    agent_id: leadData.agent_id || "",
    call_status: leadData.call_status || "completed",
    start_timestamp: leadData.start_timestamp || timestamp,
    duration_ms: leadData.duration_ms || leadData.duration_seconds * 1000 || 0,
    transcript: leadData.transcript || "",
    recording_url: leadData.recording_url || "",
    disconnection_reason: leadData.disconnection_reason || "",
    
    // Post-Call Analysis (Retell AI)
    reason_for_call: leadData.reason_for_call || leadData.call_analysis?.reason_for_call || "General Inquiry",
    urgency: leadData.urgency || leadData.call_analysis?.urgency || "normal",
    appointment_requested: Boolean(leadData.appointment_requested ?? leadData.call_analysis?.appointment_requested),
    appointment_time: leadData.appointment_time || leadData.call_analysis?.appointment_time || null,
    service_type: leadData.service_type || leadData.call_analysis?.service_type || "Roof Inspection / Repair",
    notes: leadData.notes || leadData.call_analysis?.call_summary || "",
    
    source: leadData.source || "retell_voice_sofia",
    created_at: existingIndex >= 0 ? leads[existingIndex].created_at : timestamp,
    updated_at: timestamp
  };

  if (existingIndex >= 0) {
    leads[existingIndex] = { ...leads[existingIndex], ...leadEntry };
  } else {
    leads.unshift(leadEntry);
  }

  fs.writeFileSync(leadsFilePath, JSON.stringify(leads, null, 2), "utf8");
  return leadEntry;
}

/**
 * Calcula métricas en tiempo real para el panel de control
 */
export function getMetrics() {
  const leads = getLeads();
  const totalCalls = leads.length;
  
  const appointmentsRequested = leads.filter((l) => l.appointment_requested).length;
  const highUrgencyCalls = leads.filter((l) => l.urgency === "high" || l.urgency === "emergency").length;
  
  const totalDurationMs = leads.reduce((acc, l) => acc + (Number(l.duration_ms) || 0), 0);
  const avgDurationSeconds = totalCalls > 0 ? Math.round(totalDurationMs / totalCalls / 1000) : 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const callsToday = leads.filter((l) => (l.created_at || "").startsWith(todayStr)).length;

  return {
    totalCalls,
    appointmentsRequested,
    highUrgencyCalls,
    avgDurationSeconds,
    callsToday,
    appointmentConversionRate: totalCalls > 0 ? `${Math.round((appointmentsRequested / totalCalls) * 100)}%` : "0%",
    lastUpdated: new Date().toISOString()
  };
}
