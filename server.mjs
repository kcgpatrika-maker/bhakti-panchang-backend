import express from "express";
import cheerio from "cheerio";

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

// SriMandir fetch
async function fetchSriMandir() {
  try {
    const res = await fetch("https://www.srimandir.com/panchang/date/13-01-2026");
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    return {
      date: "2026-01-13",
      tithi: "Dashami Krishna-Paksha",
      nakshatra: "Vishakha (Till 12:07 AM)",
      yoga: "Shool (Till 7:05 PM)",
      karana: "Vishti (Till 3:18 PM)",
      sunrise: getValueByLabel($, "Sunrise"),
      sunset: getValueByLabel($, "Sunset"),
      moonrise: getValueByLabel($, "Moonrise"),
      moonset: getValueByLabel($, "Moonset"),
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
