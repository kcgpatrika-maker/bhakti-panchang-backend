import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const DEFAULT_LAT = 26.9124;
const DEFAULT_LON = 75.7873;
const DEFAULT_TZ = "Asia/Kolkata";

// --- Utils
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

function fmtTime(d, tz = DEFAULT_TZ) {
  if (!d) return "—";
  try {
    const f = new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz
    });
    return f.format(d);
  } catch {
    return "—";
  }
}

// Hindi months and weekdays
const hindiMonths = [
  "जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून",
  "जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"
];
const hindiWeekdays = [
  "रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"
];

function formatHindiDate(dateISO) {
  const d = new Date(dateISO);
  const day = d.getDate();
  const month = hindiMonths[d.getMonth()];
  const year = d.getFullYear();
  const weekday = hindiWeekdays[d.getDay()];
  return `${day} ${month} ${year} | ${weekday}`;
}

// --- Sun times (NOAA simplified)
function getSunTimes(utcMidnight, lat, lon) {
  const y = utcMidnight.getUTCFullYear();
  const m = utcMidnight.getUTCMonth();
  const d = utcMidnight.getUTCDate();
  const n = Math.floor((Date.UTC(y, m, d) - Date.UTC(y, 0, 0)) / 86400000);
  const lngHour = lon / 15;

  function calcTime(isSunrise) {
    const t = isSunrise ? n + ((6 - lngHour) / 24) : n + ((18 - lngHour) / 24);
    const M = (0.9856 * t) - 3.289;
    let L = M + (1.916 * Math.sin(toRad(M))) + (0.020 * Math.sin(toRad(2 * M))) + 282.634;
    L = ((L % 360) + 360) % 360;
    let RA = toDeg(Math.atan(0.91764 * Math.tan(toRad(L))));
    RA = ((RA % 360) + 360) % 360;
    const Lq = Math.floor(L / 90) * 90;
    const RAq = Math.floor(RA / 90) * 90;
    RA = (RA + (Lq - RAq)) / 15;
    const sinDec = 0.39782 * Math.sin(toRad(L));
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH = (Math.cos(toRad(90.833)) - (sinDec * Math.sin(toRad(lat)))) / (cosDec * Math.cos(toRad(lat)));
    if (cosH > 1 || cosH < -1) return null;
    const H = isSunrise ? (360 - toDeg(Math.acos(cosH))) : toDeg(Math.acos(cosH));
    const Hhrs = H / 15;
    let T = Hhrs + RA - (0.06571 * t) - 6.622;
    let UT = ((T - lngHour) % 24 + 24) % 24;
    const hh = Math.floor(UT);
    const mm = Math.floor((UT - hh) * 60);
    return new Date(Date.UTC(y, m, d, hh, mm));
  }

  return { sunrise: calcTime(true), sunset: calcTime(false) };
}

// --- Moonrise/Moonset (approximation by altitude crossing)
function getMoonTimes(utcMidnight, latDeg, lonDeg) {
  function moonCoords(ms) {
    const dDays = (ms - Date.UTC(2000, 0, 1, 12)) / 86400000;
    const L = toRad((13.1763966 * dDays + 318.351) % 360);
    const M = toRad((13.1763966 * dDays - 0.1114041 * dDays + 36.340) % 360);
    const F = toRad((93.2720950 + 13.229350 * dDays) % 360);
    const lambda = L + toRad(6.289) * Math.sin(M);
    const beta = toRad(5.128) * Math.sin(F);
    const e = toRad(23.4397);
    const sinL = Math.sin(lambda), cosL = Math.cos(lambda);
    const sinB = Math.sin(beta);
    const ra = Math.atan2(sinL * Math.cos(e) - Math.tan(beta) * Math.sin(e), cosL);
    const dec = Math.asin(sinB * Math.cos(e) + Math.cos(beta) * Math.sin(e) * sinL);
    return { ra, dec };
  }
  function sidereal(ms, lonDegLocal) {
    const jd = ms / 86400000 + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    const theta = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000.0;
    const thetaDeg = ((theta + lonDegLocal) % 360 + 360) % 360;
    return toRad(thetaDeg);
  }
  function altitude(ms, latDegLocal, lonDegLocal) {
    const { ra, dec } = moonCoords(ms);
    const st = sidereal(ms, lonDegLocal);
    const H = st - ra;
    return Math.asin(Math.sin(toRad(latDegLocal)) * Math.sin(dec) + Math.cos(toRad(latDegLocal)) * Math.cos(dec) * Math.cos(H));
  }
  function findCrossing(target = 0) {
    const start = Date.UTC(utcMidnight.getUTCFullYear(), utcMidnight.getUTCMonth(), utcMidnight.getUTCDate(), 0, 0);
    let prevAlt = altitude(start, latDeg, lonDeg);
    let rise = null, set = null;
    for (let m = 5; m <= 24 * 60; m += 5) {
      const t = start + m * 60000;
      const alt = altitude(t, latDeg, lonDeg);
      if (prevAlt < target && alt >= target && !rise) rise = new Date(t);
      if (prevAlt > target && alt <= target && !set) set = new Date(t);
      prevAlt = alt;
      if (rise && set) break;
    }
    return { rise, set };
  }
  return findCrossing(0);
}

// --- Samvats (North India convention)
function computeSamvats(localDate) {
  const y = localDate.getFullYear();
  const m = localDate.getMonth() + 1;
  const d = localDate.getDate();
  const isLeap = ((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0);
  const shakaStartDay = isLeap ? 21 : 22; // Mar 21/22
  const shak = (m > 3 || (m === 3 && d >= shakaStartDay)) ? (y - 78) : (y - 79);
  const vikram = (m >= 4) ? (y + 57) : (y + 56);
  return { vikram_samvat: String(vikram), shak_samvat: String(shak) };
}

// --- Tithi/Masa/Paksha adapter (panchang.click, hinducalendar.com)
function cleanText(v) {
  return v ? String(v).replace(/[\s<>]+/g, " ").trim() : "—";
}

async function fetchFromPanchangClick(dateISO) {
  const urls = [
    `https://panchang.click/panchang-api?date=${dateISO}`,
    `https://panchang.click/panchang-widget?date=${dateISO}`
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) continue;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await res.json();
        const tithi = j.tithi || j.data?.tithi || j.panchang?.tithi;
        const masa = j.masa || j.data?.masa || j.panchang?.masa;
        const paksha = j.paksha || j.data?.paksha || j.panchang?.paksha;
        if (tithi || masa || paksha) {
          return {
            tithi: cleanText(tithi),
            masa: cleanText(masa),
            paksha: cleanText(paksha),
            sourceNote: "panchang.click (JSON)"
          };
        }
      } else {
        const html = await res.text();
        const tithi = (html.match(/Tithi\s*[:\-]\s*([^\n<]+)/i) || [])[1];
        const masa = (html.match(/Masa\s*[:\-]\s*([^\n<]+)/i) || [])[1];
        const paksha = (html.match(/Paksha\s*[:\-]\s*([^\n<]+)/i) || [])[1];
        if (tithi || masa || paksha) {
          return {
            tithi: cleanText(tithi),
            masa: cleanText(masa),
            paksha: cleanText(paksha),
            sourceNote: "panchang.click (HTML)"
          };
        }
      }
    } catch {
      // try next URL
    }
  }
  return null;
}

async function fetchFromHinduCalendar(dateISO) {
  const url = `https://www.hinducalendar.com/panchang/${dateISO}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const html = await res.text();
    // Generic patterns; may need tuning if site’s markup is different
    const tithi = (html.match(/Tithi\s*[:\-]\s*([^\n<]+)/i) || [])[1];
    const masa = (html.match(/M[aā]sa\s*[:\-]\s*([^\n<]+)/i) || html.match(/Month\s*[:\-]\s*([^\n<]+)/i) || [])[1];
    const paksha = (html.match(/Paksha\s*[:\-]\s*([^\n<]+)/i) || [])[1];
    if (tithi || masa || paksha) {
      return {
        tithi: cleanText(tithi),
        masa: cleanText(masa),
        paksha: cleanText(paksha),
        sourceNote: "hinducalendar.com (HTML)"
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchTMP(dateISO) {
  const pc = await fetchFromPanchangClick(dateISO);
  if (pc) return pc;
  const hc = await fetchFromHinduCalendar(dateISO);
  if (hc) return hc;
  return { tithi: "—", masa: "—", paksha: "—", sourceNote: "fallback" };
}
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

// --- Cache
const cache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

app.get("/api/panchang", async (req, res) => {
  try {
    const dateISO = (req.query.date || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const lat = req.query.lat ? parseFloat(req.query.lat) : DEFAULT_LAT;
    const lon = req.query.lon ? parseFloat(req.query.lon) : DEFAULT_LON;
    const tz = req.query.tz || DEFAULT_TZ;

    const key = `${dateISO}:${lat}:${lon}:${tz}`;
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && (now - cached.ts) < CACHE_TTL) {
      return res.json({ ...cached.data, cached: true });
    }

    const data = await buildPanchang(dateISO, lat, lon, tz);
    cache.set(key, { ts: now, data });
    res.json({ ...data, cached: false });
  } catch (err) {
    res.status(500).json({ error: "Panchang data unavailable", detail: err?.message || String(err) });
  }
});

// Optional: formatted view for frontend
app.get("/api/panchang/view", async (req, res) => {
  try {
    const dateISO = (req.query.date || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const lat = req.query.lat ? parseFloat(req.query.lat) : DEFAULT_LAT;
    const lon = req.query.lon ? parseFloat(req.query.lon) : DEFAULT_LON;
    const tz = req.query.tz || DEFAULT_TZ;

    const data = await buildPanchang(dateISO, lat, lon, tz);

    const lines = [
      `📅 ${dateISO} | ${data.display_date}`,
      ``,
      `🌅 सूर्योदय: ${data.sunrise} | 🌇 सूर्यास्त: ${data.sunset}`,
      ``,
      `🌙 चंद्रोदय: ${data.moonrise} | 🌑 चंद्रास्त: ${data.moonset}`,
      ``,
      `विक्रम संवत: ${data.vikram_samvat} | शक संवत: ${data.shak_samvat}`,
      ``,
      `मास: ${data.masa} | पक्ष: ${data.paksha} | तिथि: ${data.tithi}`,
      ``,
      `📌 स्रोत: ${data.source} (${data.note})`
    ];

    res.json({ lines, data });
  } catch (err) {
    res.status(500).json({ error: "View unavailable", detail: err?.message || String(err) });
  }
});

app.get("/", (req, res) => res.send("Panchang API running (no external packages)"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
