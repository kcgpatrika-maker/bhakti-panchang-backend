import express from "express";
import cors from "cors";
import SunCalc from "suncalc";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Default location (Jaipur, India)
const DEFAULT_LAT = 26.9124;
const DEFAULT_LON = 75.7873;

const panchangCache = { date: null, data: null, timestamp: 0 };
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function formatTime(dateObj) {
  if (!dateObj) return "—";
  return dateObj.toTimeString().slice(0, 5); // HH:MM
}

async function fetchBasicPanchang(dateISO, lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const date = new Date(dateISO);
  const times = SunCalc.getTimes(date, lat, lon);
  const moonTimes = SunCalc.getMoonTimes(date, lat, lon);

  return {
    date: dateISO,
    sunrise: formatTime(times.sunrise),
    sunset: formatTime(times.sunset),
    moonrise: moonTimes.rise ? formatTime(moonTimes.rise) : "—",
    moonset: moonTimes.set ? formatTime(moonTimes.set) : "—",
    vikram_samvat: "—", // Placeholder
    shak_samvat: "—",   // Placeholder
    masa: "—",          // Placeholder
    paksha: "—",        // Placeholder
    tithi: "—",         // Placeholder
    source: "SunCalc (astronomical calculation)"
  };
}

app.get("/api/panchang", async (req, res) => {
  try {
    const dateISO = req.query.date || new Date().toISOString().slice(0, 10);
    const lat = req.query.lat ? parseFloat(req.query.lat) : DEFAULT_LAT;
    const lon = req.query.lon ? parseFloat(req.query.lon) : DEFAULT_LON;
    const now = Date.now();

    if (panchangCache.date === dateISO && now - panchangCache.timestamp < CACHE_TTL) {
      return res.json({ ...panchangCache.data, cached: true });
    }

    const data = await fetchBasicPanchang(dateISO, lat, lon);
    panchangCache.date = dateISO;
    panchangCache.data = data;
    panchangCache.timestamp = now;

    res.json({ ...data, cached: false });
  } catch (err) {
    res.status(500).json({ error: "Panchang data unavailable", detail: err.message });
  }
});

app.get("/", (req, res) => res.send("Basic Panchang API running"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
