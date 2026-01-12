// data/masaCalculator.js
// Daily Tithi, Masa, Paksha adapter with robust cleaning & primary JSON source

// Clean up HTML/CSS/script noise and keep readable Devanagari/Latin words
function cleanText(v) {
  if (!v) return "—";
  return String(v)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")                  // remove any HTML tags
    .replace(/\{[^}]*\}/g, "")                // remove CSS blocks {...}
    .replace(/https?:\/\/\S+/g, "")           // remove URLs
    .replace(/&nbsp;|&amp;|&quot;|&#39;|&lt;|&gt;/g, " ")
    .replace(/[^a-zA-Z\u0900-\u097F\s]/g, " ") // keep only letters (EN + Devanagari) and spaces
    .replace(/\s+/g, " ")                     // collapse spaces
    .trim()
    .slice(0, 40);                            // avoid long garbage
}

// --- Primary: Panchang.click JSON API (no regex here)
async function fetchFromPanchangClick(dateISO) {
  try {
    const url = `https://panchang.click/panchang-api?date=${dateISO}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (PanchangFetcher)" }
    });
    if (!res.ok) return null;

    const j = await res.json();

    // Try common shapes: flat or nested
    const tithiRaw  = j.tithi ?? j.data?.tithi ?? j.panchang?.tithi;
    const masaRaw   = j.masa  ?? j.data?.masa  ?? j.panchang?.masa;
    const pakshaRaw = j.paksha?? j.data?.paksha?? j.panchang?.paksha;

    const tithi  = cleanText(tithiRaw);
    const masa   = cleanText(masaRaw);
    const paksha = cleanText(pakshaRaw);

    if (tithi !== "—" || masa !== "—" || paksha !== "—") {
      return { tithi, masa, paksha, sourceNote: "panchang.click JSON" };
    }
    return null;
  } catch {
    return null;
  }
}

// --- Fallback: Prokerala Panchang HTML (regex-based)
async function fetchFromProkerala(dateISO) {
  try {
    const url = "https://www.prokerala.com/astrology/panchang/";
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (PanchangFetcher)" }
    });
    if (!res.ok) return null;

    const html = await res.text();

    // Prefer concise label captures; page may vary
    const tithiMatch =
      html.match(/Tithi[^:]*:\s*([^\n<]+)/i) ||
      html.match(/Tithi<\/[^>]*>\s*<\/[^>]*>\s*([^<]+)/i);

    const masaMatch =
      html.match(/(?:Month|Masa)[^:]*:\s*([^\n<]+)/i) ||
      html.match(/(?:Month|Masa)<\/[^>]*>\s*<\/[^>]*>\s*([^<]+)/i);

    const pakshaMatch =
      html.match(/Paksha[^:]*:\s*([^\n<]+)/i) ||
      html.match(/Paksha<\/[^>]*>\s*<\/[^>]*>\s*([^<]+)/i);

    const tithi  = tithiMatch && tithiMatch[1] ? cleanText(tithiMatch[1]) : "—";
    const masa   = masaMatch && masaMatch[1]   ? cleanText(masaMatch[1])   : "—";
    const paksha = pakshaMatch && pakshaMatch[1]? cleanText(pakshaMatch[1]) : "—";

    if (tithi !== "—" || masa !== "—" || paksha !== "—") {
      return { tithi, masa, paksha, sourceNote: "prokerala.com HTML" };
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
