import { writeFile } from "node:fs/promises";

function escapeCsvValue(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportProspectsToCsv(prospects, filePath) {
  const headers = [
    "apiRank",
    "businessName",
    "address",
    "phone",
    "rating",
    "reviewCount",
    "mapsUrl",
    "website",
    "webStatus",
    "opportunityScore",
    "recommendedPackage",
  ];

  const rows = prospects.map((p) =>
    [
      p.apiRank,
      p.businessName,
      p.address,
      p.phone,
      p.rating ?? "",
      p.reviewCount ?? 0,
      p.mapsUrl,
      p.website ?? "",
      p.opportunity.label,
      p.opportunity.score,
      p.opportunity.recommendedPackage,
    ]
      .map(escapeCsvValue)
      .join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  await writeFile(filePath, csvContent, "utf-8");
  return filePath;
}
