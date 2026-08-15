/**
 * Real-Time Contact & Lead Enrichment Extractor (Vorion OS)
 * Scrapes websites for email addresses, phone numbers, contact pages, and social links.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IGNORED_EMAILS = ["example.com", "domain.com", "sentry.io", "wix.com", "squarespace.com", "bootstrap.com", "schema.org"];

export async function extractContactDetails(websiteUrl, { timeoutMs = 5000 } = {}) {
  if (!websiteUrl || websiteUrl === "NONE" || websiteUrl.trim() === "") {
    return {
      emails: [],
      contactFormUrl: null,
      extractedPhone: null,
      hasContactPage: false
    };
  }

  let targetUrl = websiteUrl.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      return { emails: [], contactFormUrl: null, extractedPhone: null, hasContactPage: false };
    }

    const html = await response.text();
    const matches = html.match(EMAIL_REGEX) || [];
    
    // Clean and filter extracted emails
    const cleanEmails = [...new Set(matches)]
      .filter((e) => !IGNORED_EMAILS.some((ignored) => e.toLowerCase().includes(ignored)))
      .slice(0, 3);

    // Look for contact page link
    const hasContactPage = /contact|contact-us|contacto|appointment|booking/i.test(html);
    const domain = new URL(targetUrl).hostname;
    const contactFormUrl = hasContactPage ? `https://${domain}/contact` : null;

    return {
      emails: cleanEmails,
      contactFormUrl,
      hasContactPage
    };
  } catch (err) {
    return { emails: [], contactFormUrl: null, hasContactPage: false };
  } finally {
    clearTimeout(timer);
  }
}
