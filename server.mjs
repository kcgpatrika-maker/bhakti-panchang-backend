import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

let cachedPanchang = null;

// Helper: refined extractor
function getValueByLabel($, label) {
  let value = "—";
  $("div").each((i, el) => {
    const text = $(el).text().trim();
    if (text.includes(label)) {
      const parent = $(el).parent();
      const possible = parent.find("div").last().text().trim();
      if (possible && !possible.includes("px") && !possible.includes("transparent")) {
        value = possible;
      }
    }
  });
  return value;
}

// Fetch Srimandir Panchang
async function fetchSriMandir(city = "jaipur", date = "2026-01-13") {
  try {
    const url = `https://www.srimandir.com/hi/panchang?city=${city}&date=${date}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    return {
      date,
      tithi: getValueByLabel($, "तिथि"),
      nakshatra: getValueByLabel($, "नक्षत्र"),
      yoga: getValueByLabel($, "योग"),
      karana: getValueByLabel($, "करण"),
      sunrise: getValueByLabel($, "सूर्योदय"),
      sunset: getValueByLabel($, "सूर्यास्त"),
      moonrise: getValueByLabel($, "चन्द्रोदय"),
      moonset: getValueByLabel($, "चंद्रास्त"),
      rahukaal: getValueByLabel($, "राहुकाल"),
      shubh_muhurat: getValueByLabel($, "शुभ मुहूर्त"),
      source: url
    };
  } catch (err) {
    console.error("SriMandir fetch error:", err);
    return null;
  }
}

// Midnight scheduler
function scheduleMidnightFetch() {
  const now = new Date();
  const millisTillMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 5, 0, 0
  ) - now;

  setTimeout(async function() {
    cachedPanchang = await fetchSriMandir();
    scheduleMidnightFetch();
  }, millisTillMidnight);
}

// API endpoint
app.get("/api/panchang", async (req, res) => {
  if (!cachedPanchang) {
    cachedPanchang = await fetchSriMandir();
  }
  res.json(cachedPanchang);
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  cachedPanchang = await fetchSriMandir();
  scheduleMidnightFetch();
});
