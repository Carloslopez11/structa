#!/usr/bin/env node
import "dotenv/config";
import { syncAgentWithRetell, buildSofiaVoicePrompt } from "./services/voiceAgent.mjs";

function parseArgs(argv) {
  const args = {
    technicianName: null,
    businessName: "Texas Roofing Co.",
    agentId: null,
    webhookUrl: process.env.RETELL_WEBHOOK_URL || "",
    previewOnly: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--technician" || arg === "--technician-name") {
      args.technicianName = argv[++i];
    } else if (arg === "--business" || arg === "--business-name") {
      args.businessName = argv[++i];
    } else if (arg === "--agent-id") {
      args.agentId = argv[++i];
    } else if (arg === "--webhook-url") {
      args.webhookUrl = argv[++i];
    } else if (arg === "--preview") {
      args.previewOnly = true;
    }
  }

  return args;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));

  console.log("\n======================================================");
  console.log("🎙️  VORION VOICE AGENT SETUP — SOFÍA (RETELL AI)");
  console.log("======================================================\n");

  if (!args.technicianName || args.technicianName.trim() === "") {
    console.error(
      "❌ ERROR: El parámetro '--technician \"Nombre\"' es OBLIGATORIO.\n" +
      "Por regla de negocio estricta, nunca se inventa el nombre del técnico de guardia.\n\n" +
      "Uso correcto:\n" +
      '  node src/voiceAgentSetup.mjs --technician "Marcus Vance" [--business "Texas Roofing Co."] [--agent-id "agent_xxx"]\n'
    );
    process.exit(1);
  }

  if (args.previewOnly) {
    console.log("📄 Vista previa del prompt generado para Retell AI:\n");
    console.log(buildSofiaVoicePrompt({
      businessName: args.businessName,
      technicianName: args.technicianName,
      webhookUrl: args.webhookUrl
    }));
    console.log("\n======================================================\n");
    return;
  }

  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey || apiKey === "TU_RETELL_API_KEY_AQUI") {
    console.warn(
      "⚠️  RETELL_API_KEY no encontrada en .env.\n" +
      "Generando y mostrando la configuración del prompt que puedes copiar directamente a Retell AI Dashboard:\n"
    );
    console.log("--- PROMPT GENERADO ---");
    console.log(buildSofiaVoicePrompt({
      businessName: args.businessName,
      technicianName: args.technicianName,
      webhookUrl: args.webhookUrl
    }));
    console.log("------------------------\n");
    return;
  }

  console.log(`📡 Sincronizando agente con Retell AI para '${args.businessName}'...`);
  console.log(`👤 Técnico de guardia asignado: ${args.technicianName}`);

  try {
    const result = await syncAgentWithRetell({
      apiKey,
      agentId: args.agentId,
      businessName: args.businessName,
      technicianName: args.technicianName,
      webhookUrl: args.webhookUrl
    });

    console.log("\n✅ Agente de voz Sofía configurado con éxito en Retell AI!");
    console.log(`🆔 Agent ID: ${result.agent_id || args.agentId || "Generado"}`);
    console.log(`🌐 Webhook configurado: ${args.webhookUrl || "(Configurar en dashboard)"}\n`);
  } catch (err) {
    console.error(`\n❌ Error al sincronizar con Retell AI: ${err.message}\n`);
    process.exit(1);
  }
}

run();
