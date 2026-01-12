function cleanText(v) { return v ? String(v).trim() : "—"; }

async function fetchFromPanchangClick(dateISO) { /* try JSON/HTML */ }
async function fetchFromHinduCalendar(dateISO) { /* try HTML */ }

export async function fetchTMP(dateISO) {
  const pc = await fetchFromPanchangClick(dateISO);
  if (pc) return pc;
  const hc = await fetchFromHinduCalendar(dateISO);
  if (hc) return hc;
  return { tithi: "—", masa: "—", paksha: "—", sourceNote: "fallback" };
}
