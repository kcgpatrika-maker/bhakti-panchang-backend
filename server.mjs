import express from "express";
import fetch from "node-fetch";
import cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

let cachedPanchang = null;

// SriMandir fetch via Cheerio
async function fetchSriMandir() {
  try {
    const res = await fetch("https://www.srimandir.com/panchang/date/13-01-2026");
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    function getText(label) {
      const el = $(`div:contains("${label}")`).next();
      return el.text().trim() || "—";
    }

    return {
      date: "2026-01-13",
      tithi: "Dashami Krishna-Paksha",
      nakshatra: "Vishakha (Till 12:07 AM)",
      yoga: "Shool (Till 7:05 PM)",
      karana: "Vishti (Till 3:18 PM)",
      sunrise: getText("Sunrise"),
      sunset: getText("Sunset"),
      moonrise: getText("Moonrise"),
      moonset: getText("Moonset"),
      vikram_samvat: "2082 (Kaalyukt)",
      shaka_samvat: "1947 (Vishvavasu)",
      sun_sign: "Sagittarius",
      moon_sign: "Libra",
      rahukaal: "2:48 PM – 4:08 PM",
      source: "srimandir.com"
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
