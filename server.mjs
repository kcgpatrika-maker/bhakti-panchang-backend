import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const panchangCache = { date: null, data: null, timestamp: 0 };
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function fetchDrikPanchang(dateISO) {
  // सही URL format
  const url = `https://www.drikpanchang.com/panchang/day-panchang.html?date=${dateISO}`;

  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error("Drik Panchang fetch failed");

  const html = await res.text();
  const $ = cheerio.load(html);

  // Helper: label और value निकालना
  function getValueByLabel($, label) {
    let value = "—";
    $(".dpElement").each((_, el) => {
      const key = $(el).find(".dpElementLabel").text().trim();
      const val = $(el).find(".dpElementValue").text().trim();
      if (key && key.includes(label)) {
        value = val;
      }
    });
    return value;
  }

  return {
    date: dateISO,
    sunrise: getValueByLabel($, "Sunrise"),
    sunset: getValueByLabel($, "Sunset"),
    moonrise: getValueByLabel($, "Moonrise"),
    moonset: getValueByLabel($, "Moonset"),
    vikram_samvat: getValueByLabel($, "Vikram Samvat"),
    shak_samvat: getValueByLabel($, "Shaka Samvat"),
    masa: getValueByLabel($, "Masa"),
    paksha: getValueByLabel($, "Paksha"),
    tithi: getValueByLabel($, "Tithi"),
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
