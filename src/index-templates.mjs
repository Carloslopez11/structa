import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const templatesDir = path.join(rootDir, "app", "templates", "100-template-list-1.0");
const catalogJsonPath = path.join(rootDir, "app", "templates.json");

if (!fs.existsSync(templatesDir)) {
  console.error("Templates directory not found:", templatesDir);
  process.exit(1);
}

const categoryMap = {
  food: "Restaurantes & Gastronomía",
  tasty: "Restaurantes & Gastronomía",
  cook: "Restaurantes & Gastronomía",
  cardio: "Gimnasios & Salud",
  garage: "Talleres & Mecánica",
  bike: "Deportes & Ciclismo",
  bicycling: "Deportes & Ciclismo",
  weather: "Servicios & SaaS",
  portfolio: "Portafolios & Agencias",
  ethereal: "Corporativo & Negocios",
  synthetica: "SaaS & Tecnología",
  sprout: "Agro & Naturaleza",
  snow: "Servicios & Turismo",
  megakit: "Multiuso & Empresa",
  knight: "Landing Page Corporativa",
  new: "Apps & Móviles",
  treviso: "Bienes Raíces & Inmobiliaria",
  story: "Noticias & Contenido",
  infinity: "Multiuso Premium",
  made: "Diseño & Creativos",
  john: "Portafolio Personal & Freelance",
  rage: "Entretenimiento & Juegos",
  solid: "Moderno & Minimalista",
  invention: "Innovación & Startups",
  exigo: "Consultoría & Servicios",
  logic: "Software & Tecnología",
  clemo: "Agencias de Marketing",
  bino: "Negocios Locales",
};

function detectCategory(folderName) {
  const lower = folderName.toLowerCase();
  for (const [key, category] of Object.entries(categoryMap)) {
    if (lower.includes(key)) return category;
  }
  return "Negocios Locales & Servicios";
}

const folders = fs.readdirSync(templatesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

console.log(`🔎 Indexing ${folders.length} template folders...`);

const catalog = [];

folders.forEach((folder, idx) => {
  const fullPath = path.join(templatesDir, folder);
  const files = fs.readdirSync(fullPath);
  const indexFile = files.find((f) => /^index\.html?$/i.test(f)) || files.find((f) => /\.html$/i.test(f)) || "index.html";

  // Format clean name
  const rawName = folder.replace(/^\d+\s*/, "").replace(/-master$/i, "");
  const cleanTitle = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const category = detectCategory(folder);

  catalog.push({
    id: idx + 1,
    folderName: folder,
    title: `Template #${String(idx + 1).padStart(2, "0")} - ${cleanTitle}`,
    rawName: cleanTitle,
    category: category,
    indexPath: `/templates/100-template-list-1.0/${encodeURIComponent(folder)}/${indexFile}`,
    previewUrl: `/templates/100-template-list-1.0/${encodeURIComponent(folder)}/${indexFile}`,
    tags: [category, cleanTitle, "HTML5", "Responsive", "Mobile-First"],
    description: `Plantilla profesional de alta conversión optimizada para celulares y escritorio. Ideal para negocios de ${category}.`
  });
});

fs.writeFileSync(catalogJsonPath, JSON.stringify(catalog, null, 2), "utf8");
console.log(`✅ Generated catalog with ${catalog.length} templates at: ${catalogJsonPath}`);
