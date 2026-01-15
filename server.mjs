import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;
const URL = "https://www.srimandir.com/hi/panchang";

async function fetchRaw() {
  const res = await fetch(URL);
  const html = await res.text();
  const $ = cheerio.load(html);
  const nextData = $("#__NEXT_DATA__").html();
  if (!nextData) return {};
  const parsed = JSON.parse(nextData);
  return parsed?.props?.pageProps || {};
}

function refineData(raw) {
  if (!raw) return {};

  // Panchang main info
  const refined = {
    date: raw?.panchangOne?.dateText || "",        // "15 जनवरी 2026"
    day: raw?.panchangOne?.dayName || "",          // "गुरुवार"
    sunrise: raw?.sunrise || "",
    sunset: raw?.sunset || "",
    moonrise: raw?.moonrise || "",
    moonset: raw?.moonset || "",
    vikramSamvat: raw?.vikramSamvat || "",
    shakaSamvat: raw?.shakaSamvat || "",
    month: raw?.monthName || "",
    paksha: raw?.paksha || "",
    tithi: raw?.tithi || "",
    // Keep full raw for future use
    fullData: raw
  };

  return refined;
}

app.get("/api/panchang", async (req, res) => {
  try {
    const raw = await fetchRaw();
    const refined = refineData(raw);
    res.json(refined);
  } catch (err) {
    console.error("Error fetching Panchang:", err);
    res.status(500).json({ error: "Failed to fetch Panchang data" });
  }
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
