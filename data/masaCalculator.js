// data/masaCalculator.js
// Adapter to fetch Tithi, Masa, Paksha daily with robust cleaning

// Clean up HTML/CSS/script noise and keep readable Devanagari/Latin words
function cleanText(v) {
  if (!v) return "—";
  return String(v)
    // Remove style/script tags and their content quickly if captured
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    // Remove any remaining HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove CSS blocks like {...}
    .replace(/\{[^}]*\}/g, "")
    // Replace special entities
    .replace(/&nbsp;|&amp;|&quot;|&#39;|&lt;|&gt;/g, " ")
    // Keep only letters (English + Devanagari) and spaces
    .replace(/[^a-zA-Z\u0900-\u097F\s]/g, " ")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim()
    // Limit length to avoid accidental long garbage
    .slice(0, 60);
}

// --- Primary: Panchang.click JSON API
async function fetchFromPanchangClick(dateISO) {
  try {
    const url = `https://panchang.click/panchang-api?date=${dateISO}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (PanchangFetcher)" },
      // Keep a modest timeout via AbortController if needed (optional)
    });
    if (!res.ok) return null;
    const j = await res.json();

    // Try common shapes
    const tithi = j.tithi ?? j.data?.tithi ?? j.panchang?.tithi;
    const masa  = j.masa  ?? j.data?.masa  ?? j.panchang?.masa;
    const paksha= j.paksha?? j.data?.paksha?? j.panchang?.paksha;

    if (tithi || masa || paksha) {
      return {
        tithi: cleanText(tithi),
        masa: cleanText(masa),
        paksha: cleanText(paksha),
        sourceNote: "panchang.click JSON"
      };
    }
    return null;
  } catch {
    return null;
  }
}

// --- Fallback: Prokerala Panchang HTML
// Note: Prokerala page may vary; regex aims to capture visible labels.
async function fetchFromProkerala(dateISO) {
  try {
    // Prokerala date filtering is page-driven; we parse general labels.
    const url = "https://www.prokerala.com/astrology/panchang/";
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (PanchangFetcher)" }
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Try multiple patterns to improve resilience
    const tithiMatch =
      html.match(/Tithi[^:]*:\s*([^\n<]+)/i) ||
      html.match(/Tithi<\/[^>]*>\s*<\/[^>]*>\s*([^<]+)/i);

    const monthMatch =
      html.match(/Month[^:]*:\s*([^\n<]+)/i) ||
      html.match(/Masa[^:]*:\s*([^\n<]+)/i) ||
      html.match(/Month<\/[^>]*>\s*<\/[^>]*>\s*([^<]+)/i) ||
      html.match(/Masa<\/[^>]*>\s*<\/[^>]*>\s*([^<]+)/i);

    const pakshaMatch =
      html.match(/Paksha[^:]*:\s*([^\n<]+)/i) ||
      html.match(/Paksha<\/[^>]*>\s*<\/[^>]*>\s*([^<]+)/i);

    const tithi = tithiMatch && tithiMatch[1] ? cleanText(tithiMatch[1]) : "—";
    const masa = monthMatch && monthMatch[1] ? cleanText(monthMatch[1]) : "—";
    const paksha = pakshaMatch && pakshaMatch[1] ? cleanText(pakshaMatch[1]) : "—";

    if (tithi !== "—" || masa !== "—" || paksha !== "—") {
      return {
        tithi,
        masa,
        paksha,
        sourceNote: "prokerala.com HTML"
      };
    }
    return null;
  } catch {
    return null;
  }
}

// --- Unified fetch (TMP = Tithi/Masa/Paksha)
export async function fetchTMP(dateISO) {
  // 1) Try Panchang.click
  const pc = await fetchFromPanchangClick(dateISO);
  if (pc) return pc;

  // 2) Fallback to Prokerala HTML
  const pk = await fetchFromProkerala(dateISO);
  if (pk) return pk;

  // 3) Final fallback
  return { tithi: "—", masa: "—", paksha: "—", sourceNote: "fallback" };
}
