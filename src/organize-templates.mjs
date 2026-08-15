import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const rawTemplatesDir = path.join(rootDir, "app", "templates", "100-template-list-1.0");
const freelancerDir = path.join(rootDir, "app", "templates", "15-projetos-freelancers", "landing-pages");
const catalogJsonPath = path.join(rootDir, "app", "templates.json");

// Category Definition Rules
const categories = [
  {
    id: "restaurantes",
    name: "🍔 Restaurantes & Gastronomía",
    icon: "🍔",
    keywords: ["restaurant", "restaurante", "food", "cafe", "tasty", "cook", "bakery", "dinner", "pizza", "coffee", "bistro", "catering"],
    targetNiches: ["Restaurantes", "Pizzerías", "Cafeterías", "Panaderías", "Catering"],
    defaultPitch: "Landing page móvil con menú interactivo, fotos de platillos y botón de reserva/pedidos por WhatsApp."
  },
  {
    id: "salud",
    name: "🦷 Salud, Dentistas & Clínicas",
    icon: "🦷",
    keywords: ["dental", "dentist", "doctor", "health", "clinic", "clinica-medica", "consultorio-odontologico", "medical", "pharmacy", "hospital", "physio", "cardio"],
    targetNiches: ["Dentistas", "Clínicas Médicas", "Consultorios Odontológicos", "Laboratorios"],
    defaultPitch: "Landing page médica con agendamiento de citas online, especialidades y botón de llamadas de urgencia."
  },
  {
    id: "fitness",
    name: "🏋️ Gimnasios, Deporte & Fitness",
    icon: "🏋️",
    keywords: ["gym", "academia", "fitness", "sport", "workout", "cardio", "crossfit", "yoga", "training", "bike", "bicycling"],
    targetNiches: ["Gimnasios", "Personal Trainers", "Centros de Yoga", "Escuelas de Danza", "Ciclismo"],
    defaultPitch: "Landing page de alto impacto para captar socios con pase de prueba gratuito y planes de membresía."
  },
  {
    id: "automotriz",
    name: "🚗 Talleres, Mecánica & Automotriz",
    icon: "🚗",
    keywords: ["garage", "oficina-mecanica", "auto", "car", "mechanic", "repair", "vehicle", "wash", "tires", "motor"],
    targetNiches: ["Talleres Mecánicos", "Lavaderos de Autos", "Servicios de Grúa", "Venta de Repuestos"],
    defaultPitch: "Landing page rápida para talleres con botón de cotización en 1 clic y ubicación directa en Google Maps."
  },
  {
    id: "bienes_raices",
    name: "🏠 Bienes Raíces & Construcción",
    icon: "🏠",
    keywords: ["estate", "imobiliaria", "property", "house", "realty", "building", "construction", "architecture", "interior", "treviso"],
    targetNiches: ["Inmobiliarias", "Agentes Inmobiliarios", "Constructoras", "Diseñadores de Interiores"],
    defaultPitch: "Landing page de lujo con galería de propiedades, mapa interactivo y formulario de captación de compradores."
  },
  {
    id: "estetica",
    name: "💈 Barberías, Estética & Spas",
    icon: "💈",
    keywords: ["barber", "salao-beleza", "clinica-estetica", "salon", "beauty", "spa", "hair", "skin", "makeup", "wellness", "nail"],
    targetNiches: ["Barberías", "Salones de Belleza", "Spas", "Centros de Estética", "Manicura"],
    defaultPitch: "Landing page estilizada con menú de servicios, precios, fotos de cortes/tratamientos y reserva directa."
  },
  {
    id: "legal_consultoria",
    name: "⚖️ Legal, Finanzas & Consultoría",
    icon: "⚖️",
    keywords: ["advocacia", "contabilidade", "coach-consultor", "lawyer", "finance", "accounting", "tax", "legal", "consultant"],
    targetNiches: ["Estudios Jurídicos", "Abogados", "Contadores", "Asesores Financieros", "Coaches"],
    defaultPitch: "Landing page corporativa de alta autoridad con agendamiento de consultoría previa y acreditaciones."
  },
  {
    id: "mascotas",
    name: "🐶 Pet Shops & Veterinaria",
    icon: "🐶",
    keywords: ["pet", "petshop", "vet", "veterinary", "dog", "cat", "grooming"],
    targetNiches: ["Pet Shops", "Clínicas Veterinarias", "Peluquería Canina", "Guarderías de Mascotas"],
    defaultPitch: "Landing page enfocada en servicios para mascotas con agendamiento de baño, peluquería y vacunas."
  },
  {
    id: "educacion",
    name: "🎓 Educación & Cursos",
    icon: "🎓",
    keywords: ["escola", "escola-idiomas", "school", "course", "education", "academy", "training", "learn"],
    targetNiches: ["Escuelas de Idiomas", "Academias de Cursos", "Tutores", "Clases Particulares"],
    defaultPitch: "Landing page educativa para captación de alumnos con clase de prueba gratuita y planes de estudio."
  },
  {
    id: "tiendas_moda",
    name: "🛒 E-commerce & Tiendas de Ropa",
    icon: "🛒",
    keywords: ["loja", "loja-roupa", "shop", "store", "fashion", "boutique", "apparel", "clothing"],
    targetNiches: ["Tiendas de Ropa", "Boutiques de Moda", "Zapaterías", "Tiendas Online"],
    defaultPitch: "Landing page e-commerce con catálogo de colecciones, precios y botón directo de compra por WhatsApp."
  },
  {
    id: "servicios_hogar",
    name: "🛠️ Servicios del Hogar & Reformas",
    icon: "🛠️",
    keywords: ["plumbing", "electric", "cleaning", "handyman", "sprout", "repair", "roofing", "paint", "locksmith"],
    targetNiches: ["Fontaneros/Plomeros", "Electricistas", "Empresas de Limpieza", "Cerrajeros", "Reformas"],
    defaultPitch: "Landing page de emergencia con botón de llamada inmediata y testimonios de clientes locales satisfechos."
  },
  {
    id: "saas_tech",
    name: "💻 SaaS, Apps & Tecnología",
    icon: "💻",
    keywords: ["infoprodutor", "saas", "app", "software", "tech", "logic", "synthetica", "invention", "solid", "weather", "cloud"],
    targetNiches: ["Infoproductores", "Startups", "Empresas de Software", "Apps Móviles", "Servicios IT"],
    defaultPitch: "Landing page de conversión SaaS con presentación del producto, características y prueba gratuita."
  },
  {
    id: "agencias_portafolios",
    name: "💼 Portafolios & Agencias Creativas",
    icon: "💼",
    keywords: ["portfolio", "agency", "creative", "design", "ethereal", "karmo", "bodo", "knight", "snow", "megakit", "made", "john", "exigo", "clemo", "bino", "story"],
    targetNiches: ["Agencias de Marketing", "Diseñadores Freelance", "Fotógrafos", "Consultores"],
    defaultPitch: "Portafolio profesional interactivo para mostrar trabajos destacados y captar clientes de alto valor."
  }
];

function categorizeTemplate(folderName, htmlContent) {
  const contentLower = htmlContent.toLowerCase();
  const folderLower = folderName.toLowerCase();

  for (const cat of categories) {
    for (const kw of cat.keywords) {
      if (folderLower.includes(kw) || contentLower.includes(` ${kw} `) || contentLower.includes(`"${kw}"`)) {
        return cat;
      }
    }
  }

  return categories.find((c) => c.id === "agencias_portafolios");
}

const organizedCatalog = [];
let globalId = 1;

// 1. Process 100-template-list-1.0
if (fs.existsSync(rawTemplatesDir)) {
  const folders = fs.readdirSync(rawTemplatesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  folders.forEach((folder) => {
    const folderPath = path.join(rawTemplatesDir, folder);
    const files = fs.readdirSync(folderPath);
    const htmlFile = files.find((f) => /^index\.html?$/i.test(f)) || files.find((f) => /\.html$/i.test(f)) || "index.html";

    let htmlContent = "";
    try {
      htmlContent = fs.readFileSync(path.join(folderPath, htmlFile), "utf8");
    } catch (err) {}

    const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    let pageTitle = titleMatch ? titleMatch[1].trim() : folder.replace(/^\d+\s*/, "");
    pageTitle = pageTitle.replace(/\s*-\s*Free HTML5.*$/i, "").replace(/\s*\|\s*Free.*$/i, "");

    const catObj = categorizeTemplate(folder, htmlContent);
    const cleanId = String(globalId).padStart(3, "0");

    organizedCatalog.push({
      id: globalId,
      code: `TPL-${cleanId}`,
      folderName: folder,
      title: `${catObj.icon} Template #${cleanId} - ${pageTitle.slice(0, 32)}`,
      cleanTitle: pageTitle,
      category: catObj.name,
      categoryId: catObj.id,
      icon: catObj.icon,
      targetNiches: catObj.targetNiches,
      pitchSuggestion: catObj.defaultPitch,
      indexPath: `/templates/100-template-list-1.0/${encodeURIComponent(folder)}/${htmlFile}`,
      previewUrl: `/templates/100-template-list-1.0/${encodeURIComponent(folder)}/${htmlFile}`,
      tags: [catObj.name, ...catObj.targetNiches, "HTML5", "Responsive", "Mobile-First"],
      description: `Plantilla profesional optimizada para negocios de ${catObj.name}. Incluye secciones de servicios, portada de alto impacto y diseño adaptativo.`
    });
    globalId++;
  });
}

// 2. Process 15-projetos-freelancers/landing-pages
if (fs.existsSync(freelancerDir)) {
  const folders = fs.readdirSync(freelancerDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  folders.forEach((folder) => {
    const folderPath = path.join(freelancerDir, folder);
    const files = fs.readdirSync(folderPath);
    const htmlFile = files.find((f) => /^index\.html?$/i.test(f)) || files.find((f) => /\.html$/i.test(f)) || "index.html";

    let htmlContent = "";
    try {
      htmlContent = fs.readFileSync(path.join(folderPath, htmlFile), "utf8");
    } catch (err) {}

    const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    let pageTitle = titleMatch ? titleMatch[1].trim() : folder.replace(/-/g, " ");
    pageTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);

    const catObj = categorizeTemplate(folder, htmlContent);
    const cleanId = String(globalId).padStart(3, "0");

    organizedCatalog.push({
      id: globalId,
      code: `TPL-${cleanId}`,
      folderName: folder,
      title: `${catObj.icon} Freelancer Pro #${cleanId} - ${pageTitle.slice(0, 32)}`,
      cleanTitle: pageTitle,
      category: catObj.name,
      categoryId: catObj.id,
      icon: catObj.icon,
      targetNiches: catObj.targetNiches,
      pitchSuggestion: catObj.defaultPitch,
      indexPath: `/templates/15-projetos-freelancers/landing-pages/${encodeURIComponent(folder)}/${htmlFile}`,
      previewUrl: `/templates/15-projetos-freelancers/landing-pages/${encodeURIComponent(folder)}/${htmlFile}`,
      tags: [catObj.name, ...catObj.targetNiches, "Freelancer Pro", "HTML5", "Responsive", "Mobile-First"],
      description: `Proyecto Landing Page Freelancer Pro para ${catObj.name}. Optimizado específicamente para venta directa y conversión de clientes.`
    });
    globalId++;
  });
}

// Write unified 115 templates catalog
fs.writeFileSync(catalogJsonPath, JSON.stringify(organizedCatalog, null, 2), "utf8");
console.log(`✅ Indexed ${organizedCatalog.length} templates successfully! Catalog updated at: ${catalogJsonPath}`);

// Breakdown summary
const counts = {};
organizedCatalog.forEach((t) => {
  counts[t.category] = (counts[t.category] || 0) + 1;
});
console.log("\n📊 Unified Catalog Breakdown (115 Total Templates):");
Object.entries(counts).forEach(([cat, count]) => {
  console.log(`   └─ ${cat}: ${count} plantillas`);
});
