import express from "express";
import cors from "cors";
import { getSunTimes, getMoonTimes } from "./data/astronomy/sunMoonCalculator.js";
import { computeSamvats } from "./data/samvatCalculator.js";
import { fetchTMP } from "./data/masaCalculator.js";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;
const DEFAULT_LAT = 26.9124;
const DEFAULT_LON = 75.7873;
const DEFAULT_TZ = "Asia/Kolkata";

// --- Utility functions
function fmtTime(d, tz = DEFAULT_TZ) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz
  }).format(d);
}

const hindiMonths = ["जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];
const hindiWeekdays = ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"];

function formatHindiDate(dateISO) {
  const d = new Date(dateISO);
  return `${d.getDate()} ${hindiMonths[d.getMonth()]} ${d.getFullYear()} | ${hindiWeekdays[d.getDay()]}`;
}

// --- Panchang builder
async function buildPanchang(dateISO, lat, lon, tz = DEFAULT_TZ) {
  const localDate = new Date(dateISO);
  const utcDay = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));

  const { sunrise, sunset } = getSunTimes(utcDay, lat, lon);
  const { rise: moonrise, set: moonset } = getMoonTimes(utcDay, lat, lon);
  const samvats = computeSamvats(localDate);
  const tmp = await fetchTMP(dateISO);

  return {
    date: dateISO,
    display_date: formatHindiDate(dateISO),
    sunrise: fmtTime(sunrise, tz),
    sunset: fmtTime(sunset, tz),
    moonrise: fmtTime(moonrise, tz),
    moonset: fmtTime(moonset, tz),
    vikram_samvat: samvats.vikram_samvat,
    shak_samvat: samvats.shak_samvat,
    masa: tmp.masa,
    paksha: tmp.paksha,
    tithi: tmp.tithi,
    source: "NOAA+moon approximation + adapter",
    note: tmp.sourceNote
  };
}

// --- Routes
app.get("/api/panchang", async (req, res) => {
  const dateISO = (req.query.date || new Date().toISOString().slice(0, 10));
  const lat = req.query.lat ? parseFloat(req.query.lat) : DEFAULT_LAT;
  const lon = req.query.lon ? parseFloat(req.query.lon) : DEFAULT_LON;
  const tz = req.query.tz || DEFAULT_TZ;

  const data = await buildPanchang(dateISO, lat, lon, tz);
  res.json(data);
});

app.get("/api/panchang/view", async (req, res) => {
  const dateISO = (req.query.date || new Date().toISOString().slice(0, 10));
  const lat = req.query.lat ? parseFloat(req.query.lat) : DEFAULT_LAT;
  const lon = req.query.lon ? parseFloat(req.query.lon) : DEFAULT_LON;
  const tz = req.query.tz || DEFAULT_TZ;

  const data = await buildPanchang(dateISO, lat, lon, tz);
  const lines = [
    `📅 ${dateISO} | ${data.display_date}`,
    `🌅 सूर्योदय: ${data.sunrise} | 🌇 सूर्यास्त: ${data.sunset}`,
    `🌙 चंद्रोदय: ${data.moonrise} | 🌑 चंद्रास्त: ${data.moonset}`,
    `विक्रम संवत: ${data.vikram_samvat} | शक संवत: ${data.shak_samvat}`,
    `मास: ${data.masa} | पक्ष: ${data.paksha} | तिथि: ${data.tithi}`,
    `📌 स्रोत: ${data.source} (${data.note})`
  ];
  res.json({ lines, data });
});

app.get("/", (req, res) => res.send("Panchang API running"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
