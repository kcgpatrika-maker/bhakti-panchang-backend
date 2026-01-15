import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SOURCE_URL = "https://www.srimandir.com/hi/panchang";

async function scrapePanchang() {
  const res = await fetch(SOURCE_URL);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Date & Day
  const date = $("meta[property='og:title']").attr("content")?.trim()
    || new Date().toLocaleDateString("hi-IN");
  const day = new Date().toLocaleDateString("hi-IN", { weekday: "long" });

  // Sunrise / Sunset
  const sunrise = $("div:contains('सूर्योदय')").next().text().trim() || "—";
  const sunset  = $("div:contains('सूर्यास्त')").next().text().trim() || "—";

  // Moonrise / Moonset
  const moonrise = $("div:contains('चंद्रोदय')").next().text().trim() || "—";
  const moonset  = $("div:contains('चंद्रास्त')").next().text().trim() || "—";

  // Vikram & Shak Samvat
  const vikramSamvat = $("div:contains('विक्रम संवत')").next().text().trim() || "—";
  const shakaSamvat  = $("div:contains('शक संवत')").next().text().trim() || "—";

  // Masa, Paksha, Tithi
  const month  = $("div:contains('मास')").next().text().trim() || "—";
  const paksha = $("div:contains('पक्ष')").next().text().trim() || "—";
  const tithi  = $("div:contains('तिथि')").next().text().trim() || "—";

  // Festivals
  const festivalList = [];
  $("li.festival, .festival-item").each((_, el) => {
    const txt = $(el).text().trim();
    if (txt) festivalList.push(txt);
  });

  return {
    date,
    day,
    sunrise,
    sunset,
    moonrise,
    moonset,
    vikramSamvat,
    shakaSamvat,
    month,
    paksha,
    tithi,
    festivalList,
    source: "Bhakti Panchang API"
  };
}

app.get("/api/panchang", async (req, res) => {
  try {
    const data = await scrapePanchang();
    res.json(data);
  } catch (err) {
    console.error("API error:", err.message);
    res.status(500).json({ error: "Panchang fetch failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Bhakti Panchang backend running on port ${PORT}`);
});
