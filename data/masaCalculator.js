// data/masaCalculator.js
// Adapter to fetch Tithi, Masa, Paksha daily with robust cleaning

function cleanText(v) {
  if (!v) return "—";
  return String(v)
    .replace(/<[^>]*>/g, "")                  // remove HTML tags
    .replace(/\{[^}]*\}/g, "")                // remove CSS blocks {...}
    .replace(/https?:\/\/\S+/g, "")           // remove URLs
    .replace(/&nbsp;|&amp;|&quot;|&#39;|&lt;|&gt;/g, " ")
    .replace(/[^a-zA-Z\u0900-\u097F\s]/g, " ") // keep only letters (EN + Devanagari)
    .replace(/\s+/g, " ")                     // collapse spaces
    .trim()
    .slice(0, 30);
}

// --- Primary: Panchang.click JSON API (currently not working without API key)
async function fetchFromPanchangClick(dateISO) {
  try {
    const url = `https://panchang.click/panchang-api?date=${dateISO}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const j = await res.json();

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

// --- Refined Fallback: Prokerala Panchang HTML
async function fetchFromProkerala(dateISO) {
  try {
    const res = await fetch("https://www.prokerala.com/astrology/panchang/", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Capture only visible table cell text
    const tithiMatch  = html.match(/Tithi[^<]*<\/td>\s*<td[^>]*>([^<]+)/i);
    const masaMatch   = html.match(/(?:Month|Masa)[^<]*<\/td>\s*<td[^>]*>([^<]+)/i);
    const pakshaMatch = html.match(/Paksha[^<]*<\/td>\s*<td[^>]*>([^<]+)/i);

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

// --- Unified fetch
export async function fetchTMP(dateISO) {
  const pc = await fetchFromPanchangClick(dateISO);
  if (pc) return pc;

  const pk = await fetchFromProkerala(dateISO);
  if (pk) return pk;

  return { tithi: "—", masa: "—", paksha: "—", sourceNote: "fallback" };
}
