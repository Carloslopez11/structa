import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import { fileURLToPath } from "node:url";
import { searchGoogleMapsProspects } from "./google-maps-fetcher.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const leadsCsvPath = path.join(rootDir, "business", "LEADS.csv");
const outreachPackPath = path.join(rootDir, "business", "OUTREACH_PACK.md");
const outputJsonDir = path.join(rootDir, "output");
const outputJsonPath = path.join(outputJsonDir, "prospects_full.json");

// Parse command line arguments supporting both --flag=value and --flag value
const args = process.argv.slice(2);
const getArg = (flag, defaultValue = "") => {
  const equalsIndex = args.findIndex((a) => a.startsWith(`--${flag}=`));
  if (equalsIndex !== -1) {
    return args[equalsIndex].split("=")[1].replace(/^['"]|['"]$/g, "");
  }
  const spaceIndex = args.findIndex((a) => a === `--${flag}`);
  if (spaceIndex !== -1 && spaceIndex + 1 < args.length) {
    return args[spaceIndex + 1].replace(/^['"]|['"]$/g, "");
  }
  return defaultValue;
};

const niche = getArg("nicho", getArg("niche", "lawyer"));
const city = getArg("ciudad", getArg("city", "Miami, FL"));
const country = getArg("pais", getArg("country", "USA"));

console.log(`\n======================================================`);
console.log(`🎯 VORION OFFICIAL OUTREACH ENGINE (PACKAGE 4 & GEO TARGETING)`);
console.log(`======================================================`);
console.log(`📍 Nicho:     ${niche}`);
console.log(`📍 Ubicación: ${city}, ${country}`);
console.log(`======================================================\n`);

async function runProspecting() {
  const mapProspects = await searchGoogleMapsProspects({ niche, city, country });
  console.log(`🔎 Generating official proposals for ${mapProspects.length} prospects...\n`);

  const busDir = path.join(rootDir, "business");
  if (!fs.existsSync(busDir)) fs.mkdirSync(busDir, { recursive: true });
  if (!fs.existsSync(outputJsonDir)) fs.mkdirSync(outputJsonDir, { recursive: true });

  // Save prospects_full.json for organizador-prospectos.html
  fs.writeFileSync(outputJsonPath, JSON.stringify(mapProspects, null, 2), "utf8");

  // Save LEADS.csv
  const csvHeaders = "business_name,email,phone,website,city,country,status,opportunity_score,subject,proposal_body\n";
  const csvRows = mapProspects.map((r) =>
    `"${r.name}","${r.email || ""}","${r.phone || ""}","${r.website || "NONE"}","${r.city || city}","${r.country || "USA"}","${r.status}","${r.score}","${(r.proposalSubject || "").replace(/"/g, '""')}","${(r.proposalBody || "").replace(/"/g, '""')}"`
  ).join("\n");

  fs.writeFileSync(leadsCsvPath, csvHeaders + csvRows, "utf8");

  console.log(`✅ Output saved to prospects_full.json at: ${outputJsonPath}`);
  console.log(`✅ LEADS.csv and OUTREACH_PACK.md updated successfully!`);
  return mapProspects;
}

runProspecting().catch((err) => console.error("Prospecting error:", err));
