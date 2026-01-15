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
  const raw = await fetchRaw();

  // तारीख और वार निकालना
  const date = raw?.panchangState?.lunarData?.headerTitle || "";
  const line1 = raw?.panchangState?.lunarData?.line1 || "";
  const day = line1.split(",").pop()?.trim() || "";

  // फ्रंटएंड को सिर्फ़ यही भेजना
  res.json({ date, day });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
