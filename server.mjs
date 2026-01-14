import * as cheerio from "cheerio";

async function fetchSriMandir(city = "jaipur", date = "2026-01-13") {
  try {
    const url = `https://www.srimandir.com/hi/panchang`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Fetch failed:", res.status);
      return { error: "fetch failed" };
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    function extractField(label) {
      let value = "";
      $("p").each((i, el) => {
        const text = $(el).text().trim();
        if (text.startsWith(label)) {
          value = text.replace(label + " :", "").trim();
        }
      });
      return value;
    }

    return {
      date,
      tithi: extractField("तिथि"),
      nakshatra: extractField("नक्षत्र"),
      yoga: extractField("योग"),
      karana: extractField("करण"),
      sunrise: extractField("सूर्योदय"),
      sunset: extractField("सूर्यास्त"),
      moonrise: extractField("चन्द्रोदय"),
      moonset: extractField("चंद्रास्त"),
      rahukaal: extractField("राहुकाल"),
      shubh_muhurat: extractField("शुभ मुहूर्त"),
      source: url
    };
  } catch (err) {
    console.error("SriMandir fetch error:", err);
    return { error: "exception" };
  }
}
function formatForPage(raw) {
  return {
    date: raw.date || "",
    sunrise: raw.sunrise || "",
    sunset: raw.sunset || "",
    moonrise: raw.moonrise || "",
    moonset: raw.moonset || "",
    tithi: raw.tithi || "",
    paksha: raw.tithi?.includes("कृष्ण") ? "कृष्ण पक्ष" :
            raw.tithi?.includes("शुक्ल") ? "शुक्ल पक्ष" : "",
    nakshatra: raw.nakshatra || "",
    yoga: raw.yoga || "",
    karana: raw.karana || "",
    rahukaal: raw.rahukaal || "",
    shubh_muhurat: raw.shubh_muhurat || "",
    // Maas, Samvat, Festivals बाद में raw से निकाल सकते हैं
    maas: raw.maas || "",
    maas_variants: {
      purnimant: raw.maas_purnimant || "",
      amanat: raw.maas_amanat || ""
    },
    vikram_samvat: raw.vikram_samvat || "",
    shak_samvat: raw.shak_samvat || "",
    festivals: raw.festivals || [],
    religious_message: raw.religious_message || "",
    source: raw.source
  };
}
import express from "express";
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api/raw", async (req,res) => {
  const raw = await fetchSriMandir(req.query.city || "jaipur", req.query.date || "2026-01-13");
  res.json(raw); // पूरा payload
});

app.get("/api/panchang", async (req,res) => {
  const raw = await fetchSriMandir(req.query.city || "jaipur", req.query.date || "2026-01-13");
  const clean = formatForPage(raw);
  res.json(clean); // फ्रंटएंड‑friendly JSON
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
