function cleanText(v) { return v ? String(v).trim() : "—"; }

async function fetchFromPanchangClick(dateISO) {
  try {
    const res = await fetch(`https://panchang.click/panchang-api?date=${dateISO}`);
    if (!res.ok) return null;
    const j = await res.json();
    return {
      tithi: cleanText(j.tithi),
      masa: cleanText(j.masa),
      paksha: cleanText(j.paksha),
      sourceNote: "panchang.click JSON"
    };
  } catch { return null; }
}

async function fetchFromProkerala(dateISO) {
  try {
    const res = await fetch("https://www.prokerala.com/astrology/panchang/");
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
  } catch { return null; }
}

export async function fetchTMP(dateISO) {
  const pc = await fetchFromPanchangClick(dateISO);
  if (pc) return pc;
  const pk = await fetchFromProkerala(dateISO);
  if (pk) return pk;
  return { tithi: "—", masa: "—", paksha: "—", sourceNote: "fallback" };
}
