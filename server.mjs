import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

let cachedPanchang = null;

// Gurdeep fetch (only essential fields)
async function fetchGurdeep() {
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
        dataMap[title] = value;
      }
    });

    return {
      date: new Date().toISOString().slice(0,10),
      sunrise: dataMap["Sun Rise Time"] || "—",
      sunset: dataMap["Sun Set Time"] || "—",
      moonrise: dataMap["Moon Rise"] || "—",
      moonset: dataMap["Moon Set"] || "—",
      tithi: dataMap["Tithi"] || "—",
      paksha: dataMap["Paksha"] || "—",
      masa: dataMap["Hindu Month"] || "—",
      vikram_samvat: dataMap["Vikram Samvat"] || "—",
      source: "profgurdeeparora.com"
    };
  } catch {
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
    cachedPanchang = await fetchGurdeep();
    scheduleMidnightFetch(); // reschedule for next midnight
  }, millisTillMidnight);
}

// API endpoint
app.get("/api/panchang", (req, res) => {
  if (cachedPanchang) {
    res.json(cachedPanchang);
  } else {
    res.json({ note: "Data not yet fetched" });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  cachedPanchang = await fetchGurdeep(); // initial fetch
  scheduleMidnightFetch(); // schedule daily fetch
});
