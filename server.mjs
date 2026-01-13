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
// Panchang fetch (Gurdeep Arora primary)
async function fetchGurdeep(dateISO) {
  try {
    const res = await fetch("https://www.profgurdeeparora.com/panchang/today", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Regex tuned for Gurdeep Arora HTML
    const sunriseMatch   = html.match(/Sun Rise Time\s*<\/td>\s*<td[^>]*>([^<]+)/i);
    const sunsetMatch    = html.match(/Sun Set Time\s*<\/td>\s*<td[^>]*>([^<]+)/i);
    const moonriseMatch  = html.match(/Moon Rise\s*<\/td>\s*<td[^>]*>([^<]+)/i);
    const moonsetMatch   = html.match(/Moon Set\s*<\/td>\s*<td[^>]*>([^<]+)/i);
    const tithiMatch     = html.match(/Tithi\s*<\/td>\s*<td[^>]*>([^<]+)/i);
    const pakshaMatch    = html.match(/Paksha\s*<\/td>\s*<td[^>]*>([^<]+)/i);
    const masaMatch      = html.match(/Hindu Month\s*<\/td>\s*<td[^>]*>([^<]+)/i);
    const samvatMatch    = html.match(/Vikram Samvat\s*<\/td>\s*<td[^>]*>([^<]+)/i);

    return {
      sunrise: sunriseMatch ? cleanText(sunriseMatch[1]) : "—",
      sunset: sunsetMatch ? cleanText(sunsetMatch[1]) : "—",
      moonrise: moonriseMatch ? cleanText(moonriseMatch[1]) : "—",
      moonset: moonsetMatch ? cleanText(moonsetMatch[1]) : "—",
      tithi: tithiMatch ? cleanText(tithiMatch[1]) : "—",
      paksha: pakshaMatch ? cleanText(pakshaMatch[1]) : "—",
      masa: masaMatch ? cleanText(masaMatch[1]) : "—",
      vikram_samvat: samvatMatch ? cleanText(samvatMatch[1]) : "—",
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

    // Primary: Gurdeep Arora
    let data = await fetchGurdeep(dateISO);
    // Fallback: AstroShade
    if (!data) data = await fetchAstroShade(dateISO);

    const sunrise = data?.sunrise || "—";
    const sunset = data?.sunset || "—";
    const moonrise = data?.moonrise || "—";
    const moonset = data?.moonset || "—";
    const vikram_samvat = data?.vikram_samvat || "—";
    const shak_samvat = "1947"; // स्थिर मान, चाहें तो regex से जोड़ सकते हैं

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
