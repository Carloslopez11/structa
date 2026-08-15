import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { saveOrUpdateLead, getLeads, getMetrics } from "./services/leadsStore.mjs";
import { CalendarService } from "./services/calendarService.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const publicDir = path.join(rootDir, "public");

const app = express();
const PORT = process.env.PORT || 3000;
const calendar = new CalendarService();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------------------------------------------------------------
// Autenticación simple para el Panel de Control (Tarea 4)
// ----------------------------------------------------------------------------
const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET || process.env.ADMIN_PASSWORD || "vorion2026";

function authMiddleware(req, res, next) {
  // Las rutas de webhook y herramientas de Retell deben ser públicas
  if (req.path.startsWith("/webhook") || req.path.startsWith("/api/calendar") || req.path === "/health") {
    return next();
  }

  // Token en Header o Query Param (?token=...)
  const token = req.headers["x-dashboard-token"] || req.query.token || req.headers.authorization?.replace("Bearer ", "");
  
  // Si no está configurada la protección en producción o si el token coincide
  if (!process.env.REQUIRE_AUTH || token === DASHBOARD_SECRET) {
    return next();
  }

  // Para navegadores accediendo a / o /dashboard.html sin token cuando REQUIRE_AUTH=true
  if (req.accepts("html") && req.path.includes("dashboard")) {
    return res.status(401).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Vorion HQ — Acceso Protegido</title></head>
      <body style="background:#0b1120;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="background:#1e293b;padding:32px;border-radius:12px;text-align:center;max-width:360px;width:100%;border:1px solid #334155;">
          <h2 style="margin-top:0;">🔒 Vorion OS</h2>
          <p style="color:#94a3b8;font-size:14px;">Ingresa el token de acceso para ver las métricas de tu negocio.</p>
          <form onsubmit="event.preventDefault(); window.location.href='/dashboard.html?token=' + encodeURIComponent(document.getElementById('t').value);">
            <input id="t" type="password" placeholder="Token de acceso..." style="width:100%;padding:10px;border-radius:6px;border:1px solid #475569;background:#0f172a;color:#fff;box-sizing:border-box;margin-bottom:12px;" required />
            <button type="submit" style="width:100%;padding:10px;border-radius:6px;border:none;background:#00f2fe;color:#000;font-weight:bold;cursor:pointer;">Entrar al Dashboard</button>
          </form>
        </div>
      </body>
      </html>
    `);
  }

  return res.status(401).json({ error: "No autorizado. Token de dashboard inválido o ausente." });
}

app.use(authMiddleware);

// ----------------------------------------------------------------------------
// 1. Healthcheck (para Railway, Render, Uptime monitors)
// ----------------------------------------------------------------------------
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "vorion-prospector-server",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ----------------------------------------------------------------------------
// 2. Webhook Oficial de Retell AI (Tarea 2)
// ----------------------------------------------------------------------------
app.post("/webhook/retell", async (req, res) => {
  try {
    const { event, call } = req.body;
    console.log(`\n[Retell Webhook] 📡 Evento recibido: "${event}" para Call ID: ${call?.call_id || "N/A"}`);

    if (!call) {
      return res.status(200).json({ received: true, note: "No call object in payload" });
    }

    // Extraer datos de llamada y Post-Call Analysis
    const leadData = {
      call_id: call.call_id,
      agent_id: call.agent_id,
      caller_phone: call.from_number || call.customer_number || "",
      call_status: call.call_status,
      start_timestamp: call.start_timestamp ? new Date(call.start_timestamp).toISOString() : new Date().toISOString(),
      duration_ms: call.duration_ms || (call.end_timestamp && call.start_timestamp ? call.end_timestamp - call.start_timestamp : 0),
      transcript: call.transcript || "",
      recording_url: call.recording_url || "",
      disconnection_reason: call.disconnection_reason || "",
      
      // Datos de Post-Call Analysis configurados en Retell
      caller_name: call.call_analysis?.custom_analysis_data?.caller_name || call.call_analysis?.caller_name || "Unknown Caller",
      reason_for_call: call.call_analysis?.custom_analysis_data?.reason_for_call || call.call_analysis?.call_summary || "General Inquiry",
      urgency: call.call_analysis?.custom_analysis_data?.urgency || "normal",
      appointment_requested: Boolean(
        call.call_analysis?.custom_analysis_data?.appointment_requested ?? 
        call.call_analysis?.appointment_requested ?? 
        false
      ),
      property_address: call.call_analysis?.custom_analysis_data?.property_address || "",
      notes: call.call_analysis?.call_summary || ""
    };

    // Guardar en data/leads.json
    const saved = saveOrUpdateLead(leadData);
    console.log(`[Retell Webhook] ✅ Lead procesado y guardado: ${saved.caller_name} (${saved.caller_phone}) | Urgencia: ${saved.urgency}`);

    return res.status(200).json({ success: true, call_id: call.call_id });
  } catch (err) {
    console.error("[Retell Webhook] ❌ Error procesando webhook:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 3. Custom Tools para Retell AI — Google Calendar (Tarea 3)
// ----------------------------------------------------------------------------
app.post("/api/calendar/check-availability", async (req, res) => {
  try {
    const { startIso, endIso } = req.body;
    const result = await calendar.checkSlotAvailability({ startIso, endIso });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/calendar/book", async (req, res) => {
  try {
    const { callerName, callerPhone, propertyAddress, serviceType, startIso, endIso, notes } = req.body;
    const booking = await calendar.createAppointment({
      callerName,
      callerPhone,
      propertyAddress,
      serviceType,
      startIso,
      endIso,
      notes
    });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 4. API Endpoints para el Dashboard
// ----------------------------------------------------------------------------
app.get("/api/leads", (req, res) => {
  const leads = getLeads();
  res.json({ success: true, count: leads.length, leads });
});

app.get("/api/metrics", (req, res) => {
  const metrics = getMetrics();
  res.json({ success: true, metrics });
});

// ----------------------------------------------------------------------------
// 5. Servir Panel de Control y Archivos Estáticos
// ----------------------------------------------------------------------------
app.use(express.static(publicDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "dashboard.html"));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 VORION PRODUCTION SERVER ACTIVE`);
  console.log(`======================================================`);
  console.log(`🌐 Local URL:      http://localhost:${PORT}`);
  console.log(`📊 Dashboard:      http://localhost:${PORT}/dashboard.html`);
  console.log(`🎙️ Retell Webhook: http://localhost:${PORT}/webhook/retell`);
  console.log(`📁 Public Dir:     ${publicDir}`);
  console.log(`======================================================\n`);
});
