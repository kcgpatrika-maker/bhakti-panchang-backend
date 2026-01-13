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

    // Helper to extract value from table row
    function extractValue(label) {
      const regex = new RegExp(`<td[^>]*>${label}\\s*<\\/td>\\s*<td[^>]*>([^<]+)<\\/td>`, "i");
      const match = html.match(regex);
      return match ? cleanText(match[1]) : "—";
    }

    return {
      sunrise: extractValue("Sun Rise Time"),
      sunset: extractValue("Sun Set Time"),
      moonrise: extractValue("Moon Rise"),
      moonset: extractValue("Moon Set"),
      tithi: extractValue("Tithi"),
      paksha: extractValue("Paksha"),
      masa: extractValue("Hindu Month"),
      vikram_samvat: extractValue("Vikram Samvat"),
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
