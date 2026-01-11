import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const panchangCache = { date: null, data: null, timestamp: 0 };
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function fetchDrikPanchang(dateISO) {
  const url = `https://www.drikpanchang.com/panchang/panchang/${dateISO}-panchang.html`;

  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error("Drik Panchang fetch failed");

  const html = await res.text();
  const $ = cheerio.load(html);

  function getValue(label) {
    let value = "—";
    $("table tr").each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length === 2) {
        const key = $(tds[0]).text().trim();
        if (key.includes(label)) {
          value = $(tds[1]).text().trim();
        }
      }
    });
    return value;
  }

  return {
    date: dateISO,
    sunrise: getValue("Sunrise"),
    sunset: getValue("Sunset"),
    moonrise: getValue("Moonrise"),
    moonset: getValue("Moonset"),
    vikram_samvat: getValue("Vikram Samvat"),
    shak_samvat: getValue("Shaka Samvat"),
    masa: getValue("Month"),
    paksha: getValue("Paksha"),
    tithi: getValue("Tithi"),
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
