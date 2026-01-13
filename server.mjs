import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Helper: हिंदी में तारीख़ format करना
function formatHindiDate(dateISO) {
  const days = ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"];
  const months = ["जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];

  const d = new Date(dateISO);
  const dayName = days[d.getDay()];
  const monthName = months[d.getMonth()];
  const dayNum = d.getDate();

  return `${dayNum} ${monthName} ${d.getFullYear()} | ${dayName}`;
}

// Clean text helper
function cleanText(v) {
  if (!v) return "—";
  return String(v)
    .replace(/<[^>]*>/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/&nbsp;|&amp;|&quot;|&#39;|&lt;|&gt;/g, " ")
    .replace(/[^a-zA-Z\u0900-\u097F\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}
// Panchang fetch (AstroShade primary)
async function fetchAstroShade(dateISO) {
  try {
    const res = await fetch("https://www.astroshade.com/panchang", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Regex tuned for AstroShade HTML
    const tithiMatch  = html.match(/तिथि[^<]*:\s*([^<]+)/i);
    const masaMatch   = html.match(/मास[^<]*:\s*([^<]+)/i);
    const pakshaMatch = html.match(/(कृष्ण पक्ष|शुक्ल पक्ष)/i);
    const sunriseMatch = html.match(/सूर्योदय[^<]*:\s*([^<]+)/i);
    const sunsetMatch  = html.match(/सूर्यास्त[^<]*:\s*([^<]+)/i);
    const moonriseMatch = html.match(/चन्द्रोदय[^<]*:\s*([^<]+)/i);
    const moonsetMatch  = html.match(/चंद्रास्त[^<]*:\s*([^<]+)/i);

    return {
      tithi: tithiMatch ? cleanText(tithiMatch[1]) : "—",
      masa: masaMatch ? cleanText(masaMatch[1]) : "—",
      paksha: pakshaMatch ? cleanText(pakshaMatch[0]) : "—",
      sunrise: sunriseMatch ? cleanText(sunriseMatch[1]) : "—",
      sunset: sunsetMatch ? cleanText(sunsetMatch[1]) : "—",
      moonrise: moonriseMatch ? cleanText(moonriseMatch[1]) : "—",
      moonset: moonsetMatch ? cleanText(moonsetMatch[1]) : "—",
      sourceNote: "astroshade.com HTML"
    };
  } catch {
    return null;
  }
}
// Panchang fetch (Gurdeep Arora fallback)
async function fetchGurdeep(dateISO) {
  try {
    const res = await fetch("https://profgurdeeparora.com/panchang/today", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return null;
    const html = await res.text();

    const tithiMatch  = html.match(/तिथि[^<]*:\s*([^<]+)/i);
    const masaMatch   = html.match(/मास[^<]*:\s*([^<]+)/i);
    const pakshaMatch = html.match(/(कृष्ण पक्ष|शुक्ल पक्ष)/i);

    return {
      tithi: tithiMatch ? cleanText(tithiMatch[1]) : "—",
      masa: masaMatch ? cleanText(masaMatch[1]) : "—",
      paksha: pakshaMatch ? cleanText(pakshaMatch[0]) : "—",
      sourceNote: "profgurdeeparora.com HTML"
    };
  } catch {
    return null;
  }
}
// Panchang API endpoint
app.get("/api/panchang", async (req, res) => {
  try {
    const dateISO = req.query.date || new Date().toISOString().slice(0,10);
    const display_date = formatHindiDate(dateISO);

    let data = await fetchAstroShade(dateISO);
    if (!data) data = await fetchGurdeep(dateISO);

    const sunrise = data?.sunrise || "07:17";
    const sunset = data?.sunset || "17:52";
    const moonrise = data?.moonrise || "09:20";
    const moonset = data?.moonset || "20:25";
    const vikram_samvat = "2082";
    const shak_samvat = "1947";

    res.json({
      date: dateISO,
      display_date,
      sunrise,
      sunset,
      moonrise,
      moonset,
      vikram_samvat,
      shak_samvat,
      panchang: {
        tithi: data?.tithi || "—",
        paksha: data?.paksha || "—",
        masa: data?.masa || "—"
      },
      source: data?.sourceNote || "fallback",
      note: data?.sourceNote || "fallback"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
