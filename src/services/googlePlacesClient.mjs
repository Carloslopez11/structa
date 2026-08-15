const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";
const NEXT_PAGE_DELAY_MS = 2200; // Google requires 2.2s delay for next_page_token

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GooglePlacesClient {
  constructor({ apiKey, language = "en", region = "us" }) {
    if (!apiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY no está configurada.");
    }
    this.apiKey = apiKey;
    this.language = language;
    this.region = region;
  }

  /**
   * Multi-Page Search: Fetches up to 3 pages (60 total Google API results) per query.
   */
  async textSearch(query, { maxPages = 3 } = {}) {
    const results = [];
    let pageToken = null;
    let page = 0;

    do {
      const url = new URL(TEXT_SEARCH_URL);
      url.searchParams.set("query", query);
      url.searchParams.set("key", this.apiKey);
      url.searchParams.set("language", this.language);
      url.searchParams.set("region", this.region);
      if (pageToken) {
        url.searchParams.set("pagetoken", pageToken);
        await sleep(NEXT_PAGE_DELAY_MS);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Google Places Text Search fallo con HTTP ${response.status}`);
      }
      const data = await response.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(`Google Places Text Search devolvio status="${data.status}"`);
      }

      for (const item of data.results || []) {
        results.push(item);
      }

      pageToken = data.next_page_token || null;
      page += 1;
    } while (pageToken && page < maxPages);

    return results.map((item, index) => ({ ...item, apiRank: index + 1 }));
  }
}
