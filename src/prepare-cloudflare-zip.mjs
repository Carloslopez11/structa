import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const appDir = path.join(rootDir, "app");
const distDir = path.join(rootDir, "dist");
const zipOutputPath = path.join(distDir, "vorion-cloudflare-site.zip");

console.log(`\n======================================================`);
console.log(`⚡ PREPARING CLOUDFLARE PAGES DEPLOYMENT PACKAGE`);
console.log(`======================================================\n`);

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 1. Ensure index.html exists at root of app/
const rootIndexHtml = path.join(appDir, "index.html");
if (!fs.existsSync(rootIndexHtml)) {
  console.error("❌ Error: index.html not found in root of app/ folder!");
  process.exit(1);
}

console.log("✅ Verified: index.html exists at top level of app/ directory.");

// 2. Prepare sample private preview template: app/preview/miami-dental/index.html
const previewDir = path.join(appDir, "preview", "miami-dental");
if (!fs.existsSync(previewDir)) {
  fs.mkdirSync(previewDir, { recursive: true });
}

const previewIndexContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Concept Preview | Miami Dental Care</title>
  <link rel="stylesheet" href="/index.css">
  <style>
    .preview-banner {
      background: #ef4444;
      color: white;
      text-align: center;
      padding: 8px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="preview-banner">
    ⚠️ Private Concept Preview. This is a non-indexed demonstration for Miami Dental Care prepared by Vorion Agency.
  </div>
  <div style="max-width: 800px; margin: 40px auto; text-align: center; font-family: sans-serif; color: #fff;">
    <h1>🦷 Miami Dental Care - High-Converting Mobile Demo</h1>
    <p>Landing page médica de alta velocidad con Asistente de Ventas IA 24/7 ("Sofía") integrado.</p>
    <a href="/" style="color: #00f2fe; text-decoration: none; font-weight: bold;">← Volver al Catálogo Vorion</a>
  </div>
  <script src="/ai-sales-bot.js"></script>
</body>
</html>`;

fs.writeFileSync(path.join(previewDir, "index.html"), previewIndexContent, "utf8");
console.log("✅ Prepared private client concept preview at: app/preview/miami-dental/index.html");

// 3. Compress app/ into vorion-cloudflare-site.zip
try {
  console.log("⏳ Compressing app/ directory to ZIP for Cloudflare Pages Drag & Drop...");
  const psCmd = `powershell -Command "Compress-Archive -Path '${appDir}\\*' -DestinationPath '${zipOutputPath}' -Force"`;
  execSync(psCmd);
  
  const stats = fs.statSync(zipOutputPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`\n======================================================`);
  console.log(`🎉 CLOUDFLARE PAGES ZIP PACKAGE CREATED SUCCESSFULLY!`);
  console.log(`======================================================`);
  console.log(`📁 Package File: ${zipOutputPath}`);
  console.log(`📦 Size:         ${sizeMb} MB`);
  console.log(`🌐 Ready to Drag & Drop into Cloudflare Pages!`);
  console.log(`======================================================\n`);
} catch (err) {
  console.error("Error creating ZIP package:", err.message);
}
