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
// Panchang fetch (Prokerala fallback)
async function fetchTMP(dateISO) {
  try {
    const res = await fetch("https://www.prokerala.com/astrology/panchang/", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return { tithi: "—", masa: "—", paksha: "—", sourceNote: "fallback" };
    const html = await res.text();

    // Regex tuned for Prokerala HTML
    const tithiMatch  = html.match(/<strong>तिथि<\/strong>\s*([^<]+)/i);
    const masaMatch   = html.match(/<strong>पूर्णिमांत<\/strong>\s*([^<]+)/i);
    const pakshaMatch = html.match(/(कृष्ण पक्ष|शुक्ल पक्ष)/i);

    const tithi  = tithiMatch && tithiMatch[1] ? cleanText(tithiMatch[1]) : "—";
    const masa   = masaMatch && masaMatch[1]   ? cleanText(masaMatch[1])   : "—";
    const paksha = pakshaMatch && pakshaMatch[1]? cleanText(pakshaMatch[1]) : "—";

    return { tithi, masa, paksha, sourceNote: "prokerala.com HTML" };
  } catch {
    return { tithi: "—", masa: "—", paksha: "—", sourceNote: "fallback" };
  }
}

// Panchang API endpoint
app.get("/api/panchang", async (req, res) => {
  try {
    const dateISO = req.query.date || new Date().toISOString().slice(0,10);
    const display_date = formatHindiDate(dateISO);

    const tmp = await fetchTMP(dateISO);

    // Static values
    const sunrise = "07:17";
    const sunset = "17:53";
    const moonrise = "10:00";
    const moonset = "21:30";
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
        tithi: tmp.tithi,
        paksha: tmp.paksha,
        masa: tmp.masa
      },
      source: tmp.sourceNote,
      note: tmp.sourceNote
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
