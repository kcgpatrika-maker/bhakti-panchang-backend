import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Default location: Jaipur
const DEFAULT_LAT = 26.9124;
const DEFAULT_LON = 75.7873;

// Utility: degrees <-> radians
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

// NOAA Sunrise/Sunset (simplified, good enough for daily use)
function getSunTimes(date, lat, lon) {
  // Helper: day of year
  const n = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86400000);

  // Longitude hour
  const lngHour = lon / 15;

  function calcTime(isSunrise) {
    const t = isSunrise ? n + ((6 - lngHour) / 24) : n + ((18 - lngHour) / 24);
    const M = (0.9856 * t) - 3.289;
    let L = M + (1.916 * Math.sin(toRad(M))) + (0.020 * Math.sin(toRad(2 * M))) + 282.634;
    L = ((L % 360) + 360) % 360;
    let RA = toDeg(Math.atan(0.91764 * Math.tan(toRad(L))));
    RA = ((RA % 360) + 360) % 360;
    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = RA + (Lquadrant - RAquadrant);
    RA = RA / 15;
    const sinDec = 0.39782 * Math.sin(toRad(L));
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH = (Math.cos(toRad(90.833)) - (sinDec * Math.sin(toRad(lat)))) / (cosDec * Math.cos(toRad(lat)));
    if (cosH > 1 || cosH < -1) return null; // Polar day/night cases
    const H = isSunrise ? (360 - toDeg(Math.acos(cosH))) : toDeg(Math.acos(cosH));
    const Hhrs = H / 15;
    let T = Hhrs + RA - (0.06571 * t) - 6.622;
    let UT = ((T - lngHour) % 24 + 24) % 24;
    const hours = Math.floor(UT);
    const minutes = Math.floor((UT - hours) * 60);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes));
  }

  const sunrise = calcTime(true);
  const sunset = calcTime(false);
  return { sunrise, sunset };
}

// Simple Moonrise/Moonset approximation (using SunCalc-like idea via moon hour angle)
// Note: For accuracy across all latitudes/dates, a full ephemeris is needed.
// This lightweight approximation works reasonably for daily mobile display.
function getMoonTimes(date, lat, lon) {
  // Based on iterative search for when moon altitude crosses 0° (sea level), step 5 minutes
  // Moon position approximation using simplified lunar model
  function moonCoords(d) {
    // days since J2000
    const dDays = (d - Date.UTC(2000, 0, 1, 12)) / 86400000;

    // mean longitude, mean anomaly, ecliptic longitude (simplified)
    const L = toRad((13.1763966 * dDays + 318.351) % 360);
    const M = toRad((13.1763966 * dDays - 0.1114041 * dDays + 36.340) % 360); // rough
    const F = toRad((93.2720950 + 13.229350 * dDays) % 360); // argument of latitude (rough)

    // Ecliptic longitude lambda (very simplified)
    const lambda = L + toRad(6.289) * Math.sin(M);
    const beta = toRad(5.128) * Math.sin(F);

    // Obliquity
    const e = toRad(23.4397);

    // RA/Dec
    const sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda);
    const sinBeta = Math.sin(beta), cosBeta = Math.cos(beta);
    const ra = Math.atan2(sinLambda * Math.cos(e) - Math.tan(beta) * Math.sin(e), cosLambda);
    const dec = Math.asin(sinBeta * Math.cos(e) + Math.cos(beta) * Math.sin(e) * sinLambda);
    return { ra, dec };
  }

  function siderealTime(d, lon) {
    const jd = d / 86400000 + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    const theta = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000.0;
    return toRad(((theta + lon) % 360 + 360) % 360);
  }

  function altitude(d, lat, lon) {
    const { ra, dec } = moonCoords(d);
    const st = siderealTime(d, lon);
    const H = st - ra;
    return Math.asin(Math.sin(toRad(lat)) * Math.sin(dec) + Math.cos(toRad(lat)) * Math.cos(dec) * Math.cos(H));
  }

  function findCrossing(target) {
    const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0);
    let prevAlt = altitude(start, lat, toRad(lon));
    let rise = null, set = null;
    for (let m = 5; m <= 24 * 60; m += 5) {
      const t = start + m * 60000;
      const alt = altitude(t, lat, toRad(lon));
      if (prevAlt < target && alt >= target && !rise) rise = new Date(t);
      if (prevAlt > target && alt <= target && !set) set = new Date(t);
      prevAlt = alt;
      if (rise && set) break;
    }
    return { rise, set };
  }

  return findCrossing(0); // sea-level horizon
}

// Format HH:MM (local time)
function fmtTime(d) {
  if (!d) return "—";
  try {
    const local = new Date(d);
    return local.toTimeString().slice(0, 5);
  } catch {
    return "—";
  }
}

// Samvat calculations (approximate but practical)
function computeSamvats(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  // Shaka Samvat: starts around Mar 22 (Mar 21 in leap years)
  const isLeap = ((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0);
  const shakaStartDay = isLeap ? 21 : 22;
  const shaka = (m > 3 || (m === 3 && d >= shakaStartDay)) ? (y - 78) : (y - 79);

  // Vikram Samvat (North India, Chaitra Shukla start around late March/early April)
  const vikram = (m >= 4) ? (y + 57) : (y + 56);

  return { vikram_samvat: String(vikram), shak_samvat: String(shaka) };
}

// Try fetching tithi/masa/paksha from a static page (adapter)
// Note: This uses regex on visible text; you can tune patterns to the site you choose.
async function fetchTithiMasaPaksha(dateISO) {
  try {
    // Example static page (replace with a reliable source later)
    // Here we attempt a generic “daily panchang” page that prints values as plain text.
    const url = `https://example.com/daily-panchang?date=${dateISO}`; // TODO: replace
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const html = await res.text();

    // Very generic regex patterns (adjust to actual page text)
    const tithi = (html.match(/Tithi(?:\s*):(?:\s*)([^\n<]+)/i) || [])[1];
    const masa = (html.match(/Masa(?:\s*):(?:\s*)([^\n<]+)/i) || [])[1];
    const paksha = (html.match(/Paksha(?:\s*):(?:\s*)([^\n<]+)/i) || [])[1];

    const clean = (v) => (v ? v.trim().replace(/[\s<>]+/g, " ") : "—");
    return {
      tithi: clean(tithi),
      masa: clean(masa),
      paksha: clean(paksha),
      sourceNote: "static-html-adapter"
    };
  } catch {
    return { tithi: "—", masa: "—", paksha: "—", sourceNote: "fallback" };
  }
}

async function buildPanchang(dateISO, lat, lon) {
  const date = new Date(dateISO);
  const { sunrise, sunset } = getSunTimes(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())), lat, lon);
  const { rise: moonrise, set: moonset } = getMoonTimes(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())), lat, lon);
  const samvats = computeSamvats(date);
  const tmp = await fetchTithiMasaPaksha(dateISO);

  return {
    date: dateISO,
    sunrise: fmtTime(sunrise),
    sunset: fmtTime(sunset),
    moonrise: fmtTime(moonrise),
    moonset: fmtTime(moonset),
    vikram_samvat: samvats.vikram_samvat,
    shak_samvat: samvats.shak_samvat,
    masa: tmp.masa,
    paksha: tmp.paksha,
    tithi: tmp.tithi,
    source: "NOAA+moon approximation + adapter",
    note: tmp.sourceNote
  };
}

// Simple cache (per-date)
const cache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

app.get("/api/panchang", async (req, res) => {
  try {
    const dateISO = (req.query.date || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const lat = req.query.lat ? parseFloat(req.query.lat) : DEFAULT_LAT;
    const lon = req.query.lon ? parseFloat(req.query.lon) : DEFAULT_LON;

    const key = `${dateISO}:${lat}:${lon}`;
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && (now - cached.ts) < CACHE_TTL) {
      return res.json({ ...cached.data, cached: true });
    }

    const data = await buildPanchang(dateISO, lat, lon);
    cache.set(key, { ts: now, data });
    res.json({ ...data, cached: false });
  } catch (err) {
    res.status(500).json({ error: "Panchang data unavailable", detail: err.message });
  }
});

app.get("/", (req, res) => res.send("Panchang API running (no external packages)"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
