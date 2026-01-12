import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const panchangCache = { date: null, data: null, timestamp: 0 };
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Helper: bilingual label matching
function getValueByLabels($, labels) {
  let value = "—";
  $(".dpElement").each((_, el) => {
    const key = $(el).find(".dpElementLabel").text().trim();
    const val = $(el).find(".dpElementValue").text().trim();
    if (labels.some(l => key.includes(l))) {
      value = val;
    }
  });
  return value;
}

async function fetchDrikPanchang(dateISO) {
  const url = `https://www.drikpanchang.com/panchang/day-panchang.html?date=${dateISO}`;

  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error("Drik Panchang fetch failed");

  const html = await res.text();
  const $ = cheerio.load(html);

  // Direct selectors for sunrise/sunset/moonrise/moonset
  const sunrise = $("#dpSunrise").text().trim() || getValueByLabels($, ["Sunrise", "सूर्योदय"]);
  const sunset = $("#dpSunset").text().trim() || getValueByLabels($, ["Sunset", "सूर्यास्त"]);
  const moonrise = $("#dpMoonrise").text().trim() || getValueByLabels($, ["Moonrise", "चंद्रोदय"]);
  const moonset = $("#dpMoonset").text().trim() || getValueByLabels($, ["Moonset", "चंद्रास्त"]);

  return {
    date: dateISO,
    sunrise: sunrise || "—",
    sunset: sunset || "—",
    moonrise: moonrise || "—",
    moonset: moonset || "—",
    vikram_samvat: getValueByLabels($, ["Vikram Samvat", "विक्रम संवत"]),
    shak_samvat: getValueByLabels($, ["Shaka Samvat", "शक संवत"]),
    masa: getValueByLabels($, ["Month", "मास", "Chandramasa"]),
    paksha: getValueByLabels($, ["Paksha", "पक्ष"]),
    tithi: getValueByLabels($, ["Tithi", "तिथि"]),
    source: "Drik Panchang (scraped)"
  };
}

app.get("/api/panchang", async (req, res) => {
  try {
    const dateISO = req.query.date || new Date().toISOString().slice(0, 10);
    const now = Date.now();

    if (panchangCache.date === dateISO && now - panchangCache.timestamp < CACHE_TTL) {
      return res.json({ ...panchangCache.data, cached: true });
    }

    const data = await fetchDrikPanchang(dateISO);
    panchangCache.date = dateISO;
    panchangCache.data = data;
    panchangCache.timestamp = now;

    res.json({ ...data, cached: false });
  } catch (err) {
    res.status(500).json({ error: "Panchang data unavailable", detail: err.message });
  }
});

app.get("/", (req, res) => res.send("Drik Panchang API running"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
