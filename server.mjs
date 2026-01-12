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

// Demo Panchang dataset (expand later or replace with API)
const demoPanchang = {
  "2026-01-12": {
    vikram_samvat: "2082",
    shak_samvat: "1947",
    masa: "पौष",
    paksha: "शुक्ल",
    tithi: "द्वितीया"
  },
  "2026-01-13": {
    vikram_samvat: "2082",
    shak_samvat: "1947",
    masa: "पौष",
    paksha: "शुक्ल",
    tithi: "तृतीया"
  }
  // आगे और dates जोड़ सकते हो
};

async function fetchPanchang(dateISO, lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const date = new Date(dateISO);
  const times = SunCalc.getTimes(date, lat, lon);
  const moonTimes = SunCalc.getMoonTimes(date, lat, lon);

  const dataset = demoPanchang[dateISO] || {
    vikram_samvat: "—",
    shak_samvat: "—",
    masa: "—",
    paksha: "—",
    tithi: "—"
  };

  return {
    date: dateISO,
    sunrise: formatTime(times.sunrise),
    sunset: formatTime(times.sunset),
    moonrise: moonTimes.rise ? formatTime(moonTimes.rise) : "—",
    moonset: moonTimes.set ? formatTime(moonTimes.set) : "—",
    ...dataset,
    source: "SunCalc + Demo Dataset"
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

    const data = await fetchPanchang(dateISO, lat, lon);
    panchangCache.date = dateISO;
    panchangCache.data = data;
    panchangCache.timestamp = now;

    res.json({ ...data, cached: false });
  } catch (err) {
    res.status(500).json({ error: "Panchang data unavailable", detail: err.message });
  }
});

app.get("/", (req, res) => res.send("Panchang API running"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
