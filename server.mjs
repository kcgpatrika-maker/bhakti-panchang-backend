import express from "express";
import * as cheerio from "cheerio";

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

// Panchang fetch (Gurdeep Arora primary, using cheerio)
async function fetchGurdeep(dateISO) {
  try {
    const res = await fetch("https://www.profgurdeeparora.com/panchang/today", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    let dataMap = {};
    $("table tr").each((_, el) => {
      const title = $(el).find("td").eq(0).text().trim();
      const value = $(el).find("td").eq(1).text().trim();
      if (title && value) {
        dataMap[title] = cleanText(value);
      }
    });

    return {
      sunrise: dataMap["Sun Rise Time"] || "—",
      sunset: dataMap["Sun Set Time"] || "—",
      moonrise: dataMap["Moon Rise"] || "—",
      moonset: dataMap["Moon Set"] || "—",
      tithi: dataMap["Tithi"] || "—",
      paksha: dataMap["Paksha"] || "—",
      masa: dataMap["Hindu Month"] || "—",
      vikram_samvat: dataMap["Vikram Samvat"] || "—",
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

    // अगर Gurdeep से डेटा न मिले तो fallback note दिखाएँ
    if (!data) {
      return res.json({
        date: dateISO,
        display_date,
        sunrise: "—",
        sunset: "—",
        moonrise: "—",
        moonset: "—",
        vikram_samvat: "—",
        shak_samvat: "1947",
        panchang: {
          tithi: "—",
          paksha: "—",
          masa: "—"
        },
        source: "fallback",
        note: "Gurdeep Arora site not reachable"
      });
    }

    res.json({
      date: dateISO,
      display_date,
      sunrise: data.sunrise,
      sunset: data.sunset,
      moonrise: data.moonrise,
      moonset: data.moonset,
      vikram_samvat: data.vikram_samvat,
      shak_samvat: "1947", // स्थिर मान
      panchang: {
        tithi: data.tithi,
        paksha: data.paksha,
        masa: data.masa
      },
      source: data.sourceNote,
      note: data.sourceNote
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
