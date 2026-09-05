import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { 
  saveOrUpdateLead, 
  getLeads, 
  getMetrics, 
  updateLeadStage, 
  addLeadNote, 
  getCompaniesList,
  deleteDemoLeads,
  updateLeadProfessional,
  updateLeadEstimate,
  updateLeadAppointment,
  getAppointmentsCalendar,
  getProfessionalsList,
  getConversations,
  addMessageToConversation,
  markConversationAsRead,
  updateLeadTemperature,
  requestLeadDeposit
} from "./services/leadsStore.mjs";

import { 
  registerUser, 
  authenticateUser, 
  getUserProfile, 
  updateUserProfile, 
  getLocations, 
  addLocation, 
  removeLocation, 
  INDUSTRY_PRESETS, 
  TAX_PRESETS 
} from "./services/authStore.mjs";

import { 
  getFinancialSummary, 
  generateAccountantCSV, 
  calculateTaxBreakdown, 
  LEGAL_TAX_DISCLAIMER 
} from "./services/financeStore.mjs";

import { generateSofiaReply } from "./services/sofiaBrain.mjs";
import { CalendarService } from "./services/calendarService.mjs";

// Enterprise Hardening & Revenue Attribution Services
import { 
  validatePasswordStrength, 
  checkRateLimit, 
  recordFailedAttempt, 
  resetLoginAttempts, 
  securityHeadersMiddleware 
} from "./services/securityService.mjs";

import { correlationIdMiddleware, runSystemHealthCheck } from "./services/observabilityService.mjs";
import { logAuditEvent, getAuditLogs } from "./services/auditLogStore.mjs";
import { calculateRevenueAttribution } from "./services/revenueAttributionEngine.mjs";
import { takeOverLeadConversation, returnToSofia } from "./services/humanTakeoverService.mjs";
import { evaluateInquiryConfidence } from "./services/aiConfidenceEngine.mjs";
import { isEventAlreadyProcessed, recordProcessedEvent, verifyStripeSignature } from "./services/stripeReliability.mjs";
import { createDemoBusiness, resetDemoBusiness } from "./services/demoTenantEngine.mjs";
import { getAllVerticals, getVerticalConfig } from "./services/verticalEngine.mjs";
import { generateReviewRequest, trackReviewStatus } from "./services/reputationEngine.mjs";
import { deleteLeadRecording, exportLeadDataGDPR } from "./services/complianceStore.mjs";
import { requirePermission, PERMISSIONS } from "./services/rbacService.mjs";
import { trackUsageMetric, getTenantUsage } from "./services/usageMeteringStore.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const publicDir = path.join(rootDir, "vorion_public");

const app = express();
const PORT = process.env.PORT || 3000;
const calendar = new CalendarService();

const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET || process.env.ADMIN_PASSWORD || "vorion2026";
const SESSION_SECRET = process.env.SESSION_SECRET || "vorion_super_secret_session_key_2026";

function createSessionToken(user) {
  const timestamp = Date.now();
  const payload = JSON.stringify({
    id: user.id,
    tenant_id: user.tenant_id || `tenant_${user.id || "default"}`,
    username: user.username,
    company_name: user.company_name,
    industry: user.industry || "general",
    role: user.role || "owner",
    timestamp
  });
  const encodedPayload = Buffer.from(payload).toString("base64");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(encodedPayload).digest("hex");
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || !token.includes(".")) return false;
  try {
    const [encodedPayload, signature] = token.split(".");
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(encodedPayload).digest("hex");
    if (signature !== expectedSignature) return false;

    const payloadStr = Buffer.from(encodedPayload, "base64").toString("utf8");
    const data = JSON.parse(payloadStr);

    const ageMs = Date.now() - Number(data.timestamp);
    if (ageMs > 7 * 24 * 60 * 60 * 1000) return false; // 7 days expiration

    return data;
  } catch {
    return false;
  }
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      list[parts.shift().trim()] = decodeURI(parts.join("="));
    });
  }
  return list;
}

// ----------------------------------------------------------------------------
// Middlewares Globales
// ----------------------------------------------------------------------------
app.use(cors());
app.use(securityHeadersMiddleware);
app.use(correlationIdMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Anti-Caché Globales
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// ----------------------------------------------------------------------------
// Health Check Endpoint (P18 - Uptime Observability & Monitoring)
// ----------------------------------------------------------------------------
app.get("/health", (req, res) => {
  const health = runSystemHealthCheck();
  res.status(health.status === "healthy" ? 200 : 207).json(health);
});

// ----------------------------------------------------------------------------
// Middleware de Autenticación & Resolución de Tenant (P2 Isolation)
// ----------------------------------------------------------------------------
function authMiddleware(req, res, next) {
  const publicPaths = [
    "/health",
    "/webhook/retell",
    "/webhook/stripe",
    "/login.html",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/me",
    "/api/presets",
    "/api/verticals",
    "/api/public/book",
    "/api/sofia/chat"
  ];

  if (publicPaths.some(p => req.path === p || req.path.startsWith("/api/calendar"))) {
    return next();
  }

  if (req.path.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/)) {
    return next();
  }

  const cookies = parseCookies(req);
  const sessionCookie = cookies["vorion_session"];
  const headerToken = req.headers["x-dashboard-token"] || req.headers.authorization?.replace("Bearer ", "");
  
  const validSession = verifySessionToken(sessionCookie);
  const validHeader = headerToken === DASHBOARD_SECRET;

  if (validSession || validHeader) {
    req.user = validSession || { 
      id: "user_admin", 
      tenant_id: "tenant_admin", 
      username: "admin", 
      company_name: "all", 
      industry: "general", 
      role: "owner" 
    };
    return next();
  }

  if (req.accepts("html") && (req.path === "/" || req.path.includes("dashboard"))) {
    return res.redirect("/login.html");
  }

  return res.status(401).json({ 
    error: "No autorizado. Sesión inválida o expirada.", 
    requiresLogin: true 
  });
}

app.use(authMiddleware);

// ----------------------------------------------------------------------------
// Auth Endpoints (P1 Hardened Authentication)
// ----------------------------------------------------------------------------
app.post("/api/auth/register", (req, res) => {
  try {
    const { username, password, company_name, industry } = req.body;
    if (!username || !username.trim()) return res.status(400).json({ error: "Nombre de usuario requerido." });
    
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.message });
    }

    const user = registerUser({
      username: username.trim(),
      password: password.trim(),
      company_name: company_name ? company_name.trim() : "Mi Empresa",
      industry: industry || "general"
    });

    logAuditEvent({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: "USER_REGISTERED",
      resource_type: "AUTH",
      metadata: { username: user.username, company: user.company_name },
      ip: req.ip,
      user_agent: req.headers["user-agent"]
    });

    const token = createSessionToken(user);
    const isProduction = process.env.NODE_ENV === "production";
    res.setHeader("Set-Cookie", `vorion_session=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${isProduction ? "; Secure" : ""}`);
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Usuario y contraseña requeridos." });

  const clientIp = req.ip || "127.0.0.1";
  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: rateCheck.message });
  }

  let user = authenticateUser(username, password);
  if (!user && username === (process.env.ADMIN_USER || "admin") && password === DASHBOARD_SECRET) {
    user = { id: "user_admin", tenant_id: "tenant_admin", username: "admin", company_name: "Vorion Enterprise", industry: "general", role: "owner" };
  }

  if (user) {
    resetLoginAttempts(clientIp);

    logAuditEvent({
      tenant_id: user.tenant_id,
      user_id: user.id || user.username,
      action: "LOGIN",
      resource_type: "AUTH",
      metadata: { username: user.username },
      ip: clientIp,
      user_agent: req.headers["user-agent"]
    });

    const token = createSessionToken(user);
    const isProduction = process.env.NODE_ENV === "production";
    res.setHeader("Set-Cookie", `vorion_session=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${isProduction ? "; Secure" : ""}`);
    return res.json({ success: true, user });
  }

  recordFailedAttempt(clientIp);

  logAuditEvent({
    tenant_id: "unknown",
    user_id: username,
    action: "LOGIN_FAILED",
    resource_type: "AUTH",
    metadata: { attempted_username: username },
    ip: clientIp,
    user_agent: req.headers["user-agent"]
  });

  return res.status(401).json({ error: "Credenciales incorrectas o usuario no registrado." });
});

app.post("/api/auth/logout", (req, res) => {
  if (req.user) {
    logAuditEvent({
      tenant_id: req.user.tenant_id,
      user_id: req.user.id || req.user.username,
      action: "LOGOUT",
      resource_type: "AUTH",
      ip: req.ip
    });
  }
  res.setHeader("Set-Cookie", "vorion_session=; HttpOnly; Path=/; Max-Age=0");
  res.json({ success: true });
});

app.get("/api/auth/me", (req, res) => {
  const cookies = parseCookies(req);
  const valid = verifySessionToken(cookies["vorion_session"]);
  if (valid) return res.json({ authenticated: true, user: valid });
  return res.json({ authenticated: false });
});

app.get("/api/user/profile", (req, res) => {
  try {
    const profile = getUserProfile(req.user?.username || "admin");
    if (!profile) return res.status(404).json({ error: "Perfil no encontrado." });
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/user/profile", (req, res) => {
  try {
    const updated = updateUserProfile(req.user?.username || "admin", req.body);
    logAuditEvent({
      tenant_id: req.user?.tenant_id,
      user_id: req.user?.username,
      action: "SETTINGS_CHANGED",
      resource_type: "SETTINGS",
      metadata: { fields: Object.keys(req.body) }
    });
    res.json({ success: true, profile: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/presets", (req, res) => {
  res.json({ success: true, presets: INDUSTRY_PRESETS });
});

app.get("/api/verticals", (req, res) => {
  res.json({ success: true, verticals: getAllVerticals() });
});

// ----------------------------------------------------------------------------
// Sofia Revenue Attribution Engine & ROI Dashboard (P4 & P5)
// ----------------------------------------------------------------------------
app.get("/api/revenue/attribution", (req, res) => {
  try {
    const company = req.query.company || (req.user?.role === "owner" && req.user?.company_name !== "all" ? req.user?.company_name : null);
    const location_id = req.query.location_id || null;
    const includeDemo = req.query.includeDemo === "true";
    const username = req.user?.username || "admin";
    const tenant_id = req.user?.tenant_id;

    const data = calculateRevenueAttribution({
      tenant_id,
      company,
      location_id,
      username,
      includeDemo
    });

    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Módulo Multi-Sucursal (Multi-Location & Franquicias)
// ----------------------------------------------------------------------------
app.get("/api/locations", (req, res) => {
  try {
    const locations = getLocations(req.user?.username || "admin");
    res.json({ success: true, locations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/locations", (req, res) => {
  try {
    const locations = addLocation(req.user?.username || "admin", req.body);
    logAuditEvent({
      tenant_id: req.user?.tenant_id,
      user_id: req.user?.username,
      action: "BRANCH_CREATED",
      resource_type: "BRANCH",
      metadata: { name: req.body.name }
    });
    res.json({ success: true, locations });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/locations/:id", (req, res) => {
  try {
    const locations = removeLocation(req.user?.username || "admin", req.params.id);
    logAuditEvent({
      tenant_id: req.user?.tenant_id,
      user_id: req.user?.username,
      action: "BRANCH_DELETED",
      resource_type: "BRANCH",
      resource_id: req.params.id
    });
    res.json({ success: true, locations });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Módulo de Finanzas & Estimado de Impuestos Real (Multi-Sucursal & Consolidado)
// ----------------------------------------------------------------------------
app.get("/api/finance/tax-presets", (req, res) => {
  res.json({ success: true, taxPresets: TAX_PRESETS, disclaimer: LEGAL_TAX_DISCLAIMER });
});

app.get("/api/finance/summary", requirePermission(PERMISSIONS.VIEW_FINANCE), (req, res) => {
  try {
    const company = req.query.company || req.user?.company_name;
    const location_id = req.query.location_id || null;
    const username = req.user?.username || "admin";
    const summary = getFinancialSummary({ company, username, location_id });
    res.json({ success: true, ...summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/finance/export/csv", requirePermission(PERMISSIONS.EXPORT_DATA), (req, res) => {
  try {
    const company = req.query.company || req.user?.company_name;
    const location_id = req.query.location_id || null;
    const username = req.user?.username || "admin";
    const csvData = generateAccountantCSV({ company, username, location_id });
    
    logAuditEvent({
      tenant_id: req.user?.tenant_id,
      user_id: req.user?.username,
      action: "EXPORT_CREATED",
      resource_type: "FINANCE",
      metadata: { format: "csv" }
    });

    const filename = `vorion-reporte-contable-${new Date().toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(csvData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Sofia Copiloto IA con Evaluación de Confianza (P7 Business Knowledge)
// ----------------------------------------------------------------------------
app.post("/api/sofia/chat", (req, res) => {
  try {
    const { message } = req.body;
    const userProfile = getUserProfile(req.user?.username || "admin");
    const confidenceEval = evaluateInquiryConfidence(message, userProfile);
    const reply = generateSofiaReply(message, userProfile);

    trackUsageMetric(req.user?.tenant_id || "tenant_default", "ai_interactions", 1);

    return res.json({ reply, confidence: confidenceEval });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Bandeja Omnicanal Enterprise (Voz, WhatsApp, Instagram DMs)
// ----------------------------------------------------------------------------
app.get("/api/omnichannel/conversations", (req, res) => {
  try {
    const { company, location_id, channel } = req.query;
    const tenant_id = req.user?.tenant_id;
    const conversations = getConversations({ company, location_id, channel, tenant_id });
    res.json({ success: true, count: conversations.length, conversations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/omnichannel/messages", async (req, res) => {
  try {
    const { lead_id, text, sender, use_sofia } = req.body;
    if (!lead_id || !text) return res.status(400).json({ error: "lead_id y text son requeridos." });

    let msgText = text;
    let msgSender = sender || "agent";

    if (use_sofia) {
      const profile = getUserProfile(req.user?.username || "admin");
      msgText = generateSofiaReply(text, profile);
      msgSender = "sofia";
      trackUsageMetric(req.user?.tenant_id || "tenant_default", "ai_interactions", 1);
    } else {
      trackUsageMetric(req.user?.tenant_id || "tenant_default", "whatsapp_messages", 1);
    }

    const result = addMessageToConversation(lead_id, { sender: msgSender, text: msgText });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/omnichannel/read/:id", (req, res) => {
  try {
    const updated = markConversationAsRead(req.params.id);
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Human Takeover Management (P6)
// ----------------------------------------------------------------------------
app.post("/api/leads/:id/takeover", (req, res) => {
  try {
    const agentName = req.body.agent_name || req.user?.username || "Especialista";
    const updated = takeOverLeadConversation(req.params.id, {
      agentName,
      userId: req.user?.username || "agent",
      tenantId: req.user?.tenant_id || "tenant_default",
      branchId: req.body.location_id || "loc_main"
    });
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/leads/:id/return-to-sofia", (req, res) => {
  try {
    const updated = returnToSofia(req.params.id, {
      userId: req.user?.username || "agent",
      tenantId: req.user?.tenant_id || "tenant_default",
      branchId: req.body.location_id || "loc_main"
    });
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Demo Tenant Engine (P10)
// ----------------------------------------------------------------------------
app.post("/api/demo/create", (req, res) => {
  try {
    const result = createDemoBusiness({
      username: req.user?.username || "admin",
      business_name: req.body.business_name || "Apex Elite Roofing & Services",
      vertical: req.body.vertical || "roofing",
      phone: req.body.phone || "+1 (555) 019-2830",
      address: req.body.address || "742 Evergreen Terrace, Suite 100",
      deposit_amount: Number(req.body.deposit_amount) || 50
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/demo/reset", (req, res) => {
  try {
    const result = resetDemoBusiness();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Reputation Engine (P13 - Non-Gated Compliant Reviews)
// ----------------------------------------------------------------------------
app.get("/api/reputation/:id/request", (req, res) => {
  try {
    const requestData = generateReviewRequest(req.params.id, { username: req.user?.username || "admin" });
    res.json({ success: true, ...requestData });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/reputation/:id/status", (req, res) => {
  try {
    const { status } = req.body;
    const updated = trackReviewStatus(req.params.id, status, {
      userId: req.user?.username || "agent",
      tenantId: req.user?.tenant_id || "tenant_default"
    });
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Compliance & GDPR / Data Retention (P14 & P15)
// ----------------------------------------------------------------------------
app.delete("/api/leads/:id/recording", requirePermission(PERMISSIONS.MANAGE_RECORDINGS), (req, res) => {
  try {
    const updated = deleteLeadRecording(req.params.id, {
      userId: req.user?.username || "agent",
      tenantId: req.user?.tenant_id || "tenant_default"
    });
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/leads/:id/gdpr-export", (req, res) => {
  try {
    const exportData = exportLeadDataGDPR(req.params.id);
    res.json({ success: true, ...exportData });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Audit Logs & Usage Metering (P3 & P17)
// ----------------------------------------------------------------------------
app.get("/api/audit/logs", requirePermission(PERMISSIONS.VIEW_FINANCE), (req, res) => {
  try {
    const tenant_id = req.user?.role === "owner" && req.user?.company_name !== "all" ? req.user?.tenant_id : req.query.tenant_id;
    const branch_id = req.query.branch_id || null;
    const logs = getAuditLogs({ tenant_id, branch_id, limit: 100 });
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/usage/metering", requirePermission(PERMISSIONS.VIEW_FINANCE), (req, res) => {
  try {
    const tenant_id = req.user?.tenant_id || "tenant_default";
    const usage = getTenantUsage(tenant_id);
    res.json({ success: true, usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Armas de la Competencia: Temperatura de Leads, Señas y Respuestas Rápidas
// ----------------------------------------------------------------------------
app.patch("/api/leads/:id/temperature", (req, res) => {
  try {
    const { temperature } = req.body;
    if (!["hot", "warm", "cold"].includes(temperature)) {
      return res.status(400).json({ error: "Temperatura inválida. Use: hot, warm, o cold." });
    }
    const updated = updateLeadTemperature(req.params.id, temperature);
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/leads/:id/deposit", (req, res) => {
  try {
    const { amount } = req.body;
    const result = requestLeadDeposit(req.params.id, amount);
    
    logAuditEvent({
      tenant_id: req.user?.tenant_id,
      user_id: req.user?.username,
      action: "PAYMENT_LINK_CREATED",
      resource_type: "PAYMENT",
      resource_id: req.params.id,
      metadata: { amount }
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/quick-replies", (req, res) => {
  try {
    const profile = getUserProfile(req.user?.username || "admin");
    res.json({ success: true, quick_replies: profile?.quick_replies || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/quick-replies", (req, res) => {
  try {
    const { quick_replies } = req.body;
    const updatedProfile = updateUserProfile(req.user?.username || "admin", { quick_replies });
    res.json({ success: true, quick_replies: updatedProfile.quick_replies });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Webhooks Oficiales (Retell Voice & Stripe Idempotent)
// ----------------------------------------------------------------------------
app.post("/webhook/stripe", async (req, res) => {
  try {
    const event = req.body;
    const eventId = event.id || req.headers["stripe-event-id"];

    if (eventId && isEventAlreadyProcessed("stripe", eventId)) {
      console.log(`[Stripe Webhook] ⚡ Evento ya procesado previamente (Idempotente): ${eventId}`);
      return res.status(200).json({ received: true, idempotent: true });
    }

    if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
      const session = event.data?.object;
      const leadId = session?.client_reference_id || session?.metadata?.lead_id;

      if (leadId) {
        const leads = getLeads({ includeDemo: true });
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
          lead.deposit_paid = true;
          lead.deposit_amount = (session.amount_total || 5000) / 100;
          saveOrUpdateLead(lead);
        }
      }

      logAuditEvent({
        tenant_id: session?.metadata?.tenant_id || "tenant_default",
        action: "PAYMENT_RECEIVED",
        resource_type: "STRIPE",
        resource_id: eventId,
        metadata: { amount: session?.amount_total }
      });
    }

    if (eventId) {
      recordProcessedEvent({
        provider: "stripe",
        event_id: eventId,
        event_type: event.type || "unknown",
        status: "completed"
      });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] ❌ Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/webhook/retell", async (req, res) => {
  try {
    const { event, call } = req.body;
    if (!call) return res.status(200).json({ received: true });

    const callId = call.call_id;
    if (callId && isEventAlreadyProcessed("retell", callId)) {
      console.log(`[Retell Webhook] ⚡ Llamada ya registrada (Idempotente): ${callId}`);
      return res.status(200).json({ received: true, idempotent: true });
    }

    const companyName = call.call_analysis?.custom_analysis_data?.company_name || req.query.company || "Mi Empresa";

    const leadData = {
      call_id: call.call_id,
      is_demo: false,
      agent_id: call.agent_id,
      caller_phone: call.from_number || call.customer_number || "",
      caller_name: call.call_analysis?.custom_analysis_data?.caller_name || call.call_analysis?.caller_name || "Cliente",
      caller_email: call.call_analysis?.custom_analysis_data?.caller_email || call.call_analysis?.caller_email || "",
      company_name: companyName,
      call_status: call.call_status,
      start_timestamp: call.start_timestamp ? new Date(call.start_timestamp).toISOString() : new Date().toISOString(),
      duration_ms: call.duration_ms || (call.end_timestamp && call.start_timestamp ? call.end_timestamp - call.start_timestamp : 0),
      transcript: call.transcript || "",
      recording_url: call.recording_url || "",
      disconnection_reason: call.disconnection_reason || "",
      
      reason_for_call: call.call_analysis?.custom_analysis_data?.reason_for_call || call.call_analysis?.call_summary || "Consulta y Reserva de Servicio",
      urgency: call.call_analysis?.custom_analysis_data?.urgency || "normal",
      appointment_requested: Boolean(call.call_analysis?.custom_analysis_data?.appointment_requested ?? call.call_analysis?.appointment_requested ?? false),
      property_address: call.call_analysis?.custom_analysis_data?.property_address || "Dirección / Ubicación",
      service_type: call.call_analysis?.custom_analysis_data?.service_type || "Atención y Consulta",
      notes: call.call_analysis?.call_summary || "",
      source: "retell_voice_sofia"
    };

    const saved = saveOrUpdateLead(leadData);
    
    // Usage metering
    const durationMinutes = Math.ceil((leadData.duration_ms || 60000) / 60000);
    trackUsageMetric("tenant_default", "voice_calls", 1);
    trackUsageMetric("tenant_default", "voice_minutes", durationMinutes);

    if (callId) {
      recordProcessedEvent({
        provider: "retell",
        event_id: callId,
        event_type: "call_completed",
        status: "completed"
      });
    }

    logAuditEvent({
      tenant_id: "tenant_default",
      action: "LEAD_CREATED",
      resource_type: "VOICE_CALL",
      resource_id: saved.id,
      metadata: { caller_name: saved.caller_name, phone: saved.caller_phone }
    });

    return res.status(200).json({ success: true, call_id: call.call_id });
  } catch (err) {
    console.error("[Retell Webhook] ❌ Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// CRM API Endpoints (Leads, Metrics, Companies, Professionals, Calendar)
// ----------------------------------------------------------------------------
app.get("/api/leads", (req, res) => {
  const { company, location_id } = req.query;
  const tenant_id = req.user?.role === "owner" && req.user?.company_name !== "all" ? req.user?.tenant_id : null;
  const leads = getLeads({ tenant_id, company, location_id, includeDemo: true });
  res.json({ success: true, count: leads.length, leads });
});

app.get("/api/metrics", (req, res) => {
  const { company, location_id } = req.query;
  const metrics = getMetrics({ company, location_id });
  res.json({ success: true, metrics });
});

app.get("/api/companies", (req, res) => {
  const companies = getCompaniesList();
  res.json({ success: true, companies });
});

app.get("/api/professionals", (req, res) => {
  const { company, industry } = req.query;
  const professionals = getProfessionalsList({ company, industry: industry || req.user?.industry || "general" });
  res.json({ success: true, professionals });
});

app.get("/api/calendar/events", (req, res) => {
  const { company, location_id } = req.query;
  const appointments = getAppointmentsCalendar({ company, location_id });
  res.json({ success: true, appointments });
});

app.patch("/api/leads/:id/stage", (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    const updated = updateLeadStage(id, stage);
    
    logAuditEvent({
      tenant_id: req.user?.tenant_id,
      user_id: req.user?.username,
      action: "LEAD_STAGE_UPDATED",
      resource_type: "LEAD",
      resource_id: id,
      metadata: { new_stage: stage }
    });

    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/leads/:id/professional", (req, res) => {
  try {
    const { id } = req.params;
    const { professional } = req.body;
    if (!professional) return res.status(400).json({ error: "Profesional requerido." });
    const updated = updateLeadProfessional(id, professional);
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/leads/:id/estimate", (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    const updated = updateLeadEstimate(id, items);
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/leads/:id/appointment", (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date } = req.body;
    const updated = updateLeadAppointment(id, appointment_date);
    
    logAuditEvent({
      tenant_id: req.user?.tenant_id,
      user_id: req.user?.username,
      action: "APPOINTMENT_UPDATED",
      resource_type: "APPOINTMENT",
      resource_id: id,
      metadata: { appointment_date }
    });

    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/leads/:id/notes", (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const updated = addLeadNote(id, text);
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/public/book", (req, res) => {
  try {
    const { name, phone, email, address, service_type, appointment_date, company_name, industry } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "Nombre y teléfono son obligatorios." });

    const newLead = saveOrUpdateLead({
      call_id: `web_book_${Date.now()}`,
      is_demo: false,
      caller_name: name,
      caller_phone: phone,
      caller_email: email || "",
      property_address: address || "Presencial / En Línea",
      service_type: service_type || "Cita / Consulta General",
      reason_for_call: `Reserva Online Cal.so: ${service_type || "Cita / Turno"}`,
      company_name: company_name || "Mi Empresa",
      industry: industry || "general",
      appointment_date: appointment_date || new Date().toISOString(),
      appointment_requested: true,
      stage: "appointment",
      urgency: "normal",
      source: "web_booking_cal"
    });

    logAuditEvent({
      tenant_id: "tenant_default",
      action: "APPOINTMENT_CREATED",
      resource_type: "PUBLIC_BOOKING",
      resource_id: newLead.id,
      metadata: { client: name, phone }
    });

    res.json({ success: true, lead: newLead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/leads/simulate", (req, res) => {
  try {
    const ind = req.body.industry || req.user?.industry || "general";
    const preset = INDUSTRY_PRESETS[ind] || INDUSTRY_PRESETS.general;

    let defaultName = "Mateo Silva";
    let defaultReason = "Solicitó cita de corte y barba para mañana a las 5 PM";
    let defaultAddress = "Sucursal Principal / En el Local";
    let defaultTranscript = "Sofia: ¡Hola! Gracias por llamar a nuestro salón. Mi nombre es Sofia, ¿en qué podemos ayudarte?\nCliente: Hola, me gustaría agendar un corte y barba para mañana en la tarde.\nSofia: Con gusto, te he reservado tu turno con Carlos (Master Barber) para mañana a las 5:00 PM.";

    if (ind === "admin_consulting") {
      defaultName = "Lic. Andrea Morales";
      defaultReason = "Solicitó asesoría fiscal y revisión contable de empresa";
      defaultAddress = "Oficina Corporativa / Videollamada Zoom";
      defaultTranscript = "Sofia: Gracias por llamar a nuestra firma de consultoría. Mi nombre es Sofia.\nCliente: Hola, necesitamos asesoría para la estructuración fiscal de nuestra empresa.\nSofia: Excelente, he agendado una sesión de diagnóstico estratégico para este jueves a las 10:00 AM con el Lic. Roberto Méndez.";
    } else if (ind === "dental_medical") {
      defaultName = "Dr. Gabriel Mendoza";
      defaultReason = "Dolor molar y solicitud de evaluación odontológica urgente";
      defaultAddress = "Av. Central 840, Consultorio 4B";
      defaultTranscript = "Sofia: Gracias por comunicarte con la clínica dental. Mi nombre es Sofia.\nCliente: Hola, tengo una molestia fuerte en una muela y necesito una cita urgente.\nSofia: Comprendo, le he programado una evaluación prioritaria para hoy a las 4:00 PM con la Dra. Elena Gómez.";
    } else if (ind === "roofing" || ind === "trades_service") {
      defaultName = "Marcus Vance";
      defaultReason = "Gotera activa en tejado tras fuerte tormenta";
      defaultAddress = "Av. Palmas 400";
      defaultTranscript = "Sofia: Gracias por llamar a nuestra empresa de servicios y techos. Mi nombre es Sofia.\nCliente: Hola, tenemos una filtración de agua en el techo.\nSofia: Entendido, le he asignado una inspección técnica prioritaria para hoy a las 2:00 PM.";
    }

    const simulated = saveOrUpdateLead({
      call_id: `demo_${Date.now()}`,
      is_demo: true,
      industry: ind,
      caller_name: `[DEMO] ${req.body.caller_name || defaultName}`,
      caller_phone: req.body.caller_phone || "+1 (555) 019-2830",
      caller_email: req.body.caller_email || "cliente.demo@empresa.com",
      company_name: req.body.company_name || req.user?.company_name || "Mi Empresa",
      location_id: req.body.location_id || "loc_main",
      location_name: req.body.location_name || "Sede Principal / Centro",
      reason_for_call: req.body.reason_for_call || defaultReason,
      property_address: req.body.property_address || defaultAddress,
      assigned_professional: preset.defaultStaff[0],
      service_type: preset.defaultServices[0].name,
      deal_value: preset.defaultServices[0].price,
      urgency: req.body.urgency || "high",
      appointment_requested: true,
      duration_ms: 115000,
      transcript: defaultTranscript,
      recording_url: "https://cdn.retellai.com/recordings/sample.mp3"
    });

    res.json({ success: true, lead: simulated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/leads/demo", (req, res) => {
  try {
    const result = deleteDemoLeads();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(publicDir));

app.get("/", (req, res) => {
  const cookies = parseCookies(req);
  if (verifySessionToken(cookies["vorion_session"])) {
    return res.redirect("/dashboard.html");
  }
  return res.redirect("/login.html");
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 VORION UNIVERSAL ENTERPRISE OS ACTIVE (SOFIA 24/7)`);
  console.log(`======================================================`);
  console.log(`🌐 Local URL:      http://localhost:${PORT}`);
  console.log(`📊 CRM Dashboard:  http://localhost:${PORT}/dashboard.html`);
  console.log(`🔒 Login & Signup: http://localhost:${PORT}/login.html`);
  console.log(`⚡ Health Check:   http://localhost:${PORT}/health`);
  console.log(`======================================================\n`);
});
