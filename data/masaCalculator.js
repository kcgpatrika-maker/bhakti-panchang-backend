// Adapter for Tithi, Masa, Paksha
function cleanText(v) {
  return v ? String(v).replace(/[\s<>]+/g, " ").trim() : "—";
}

// --- Panchang.click JSON API
async function fetchFromPanchangClick(dateISO) {
  try {
    const res = await fetch(`https://panchang.click/panchang-api?date=${dateISO}`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return null;
    const j = await res.json();
    const tithi = j.tithi || j.data?.tithi || j.panchang?.tithi;
    const masa = j.masa || j.data?.masa || j.panchang?.masa;
    const paksha = j.paksha || j.data?.paksha || j.panchang?.paksha;
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

// --- Prokerala HTML fallback
async function fetchFromProkerala(dateISO) {
  try {
    const res = await fetch("https://www.prokerala.com/astrology/panchang/", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const tithi = (html.match(/Tithi[^:]*:\s*([^\n<]+)/i) || [])[1];
    const masa = (html.match(/Month[^:]*:\s*([^\n<]+)/i) || [])[1];
    const paksha = (html.match(/Paksha[^:]*:\s*([^\n<]+)/i) || [])[1];
    if (tithi || masa || paksha) {
      return {
        tithi: cleanText(tithi),
        masa: cleanText(masa),
        paksha: cleanText(paksha),
        sourceNote: "prokerala.com HTML"
      };
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
