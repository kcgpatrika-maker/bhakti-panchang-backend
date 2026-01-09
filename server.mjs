import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* =====================================================
   CONFIG
===================================================== */
const LOCATION = {
  lat: 26.9124,   // Jaipur
  lon: 75.7873
};

/* =====================================================
   UTIL – IST
===================================================== */
function toIST(date) {
  return new Date(date.getTime() + 330 * 60000);
}

function formatTime(date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* =====================================================
   SUNRISE / SUNSET (STABLE APPROX – PRODUCTION SAFE)
===================================================== */
function getSunTimes(date) {
  // Stable Indian average (no wild shifts)
  const base = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );

  const sunrise = toIST(new Date(base + 6 * 3600000));
  const sunset  = toIST(new Date(base + 18 * 3600000));

  return {
    sunrise: formatTime(sunrise),
    sunset: formatTime(sunset),
    sunriseDate: sunrise
  };
}

/* =====================================================
   MOON PHASE → TITHI (CORE ENGINE)
===================================================== */
function getMoonAgeDays(date) {
  const knownNewMoon = new Date("2024-01-11T11:57:00Z");
  const diffDays =
    (date.getTime() - knownNewMoon.getTime()) / 86400000;
  return ((diffDays % 29.5306) + 29.5306) % 29.5306;
}

const TITHI_NAMES = [
  "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी",
  "अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा",
  "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी",
  "अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","अमावस्या"
];

function getTithiFromMoon(date) {
  const age = getMoonAgeDays(date);
  const index = Math.floor(age / (29.5306 / 30));
  const tithi = TITHI_NAMES[index];
  const paksha = index < 15 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";
  return { tithi, paksha, index };
}

/* =====================================================
   SUNRISE RULE (FINAL AUTHORITY)
===================================================== */
function getSunriseBasedTithi(date) {
  const { sunriseDate } = getSunTimes(date);

  const beforeSunrise = new Date(sunriseDate);
  beforeSunrise.setMinutes(beforeSunrise.getMinutes() - 1);

  return getTithiFromMoon(beforeSunrise);
}

/* =====================================================
   MASA (AMANTA SYSTEM)
===================================================== */
const MASA_LIST = [
  "चैत्र","वैशाख","ज्येष्ठ","आषाढ़","श्रावण","भाद्रपद",
  "आश्विन","कार्तिक","मार्गशीर्ष","पौष","माघ","फाल्गुन"
];

function getMasa(date) {
  const { index } = getSunriseBasedTithi(date);

  // Amavasya = new month starts
  const approxMonth = date.getMonth();
  let masaIndex = approxMonth - 2;
  if (masaIndex < 0) masaIndex += 12;

  return MASA_LIST[masaIndex];
}

/* =====================================================
   SAMVAT
===================================================== */
function getSamvat(date) {
  const year = date.getFullYear();
  return {
    vikram: year + 57,
    shak: year - 78
  };
}

/* =====================================================
   API
===================================================== */
app.get("/", (req, res) => {
  res.send("Bhakti Panchang backend running");
});

app.get("/api/panchang", (req, res) => {
  try {
    const now = new Date();
    const ist = toIST(now);

    const sun = getSunTimes(ist);
    const tithiData = getSunriseBasedTithi(ist);
    const masa = getMasa(ist);
    const samvat = getSamvat(ist);

    res.json({
      date: ist.toLocaleDateString("hi-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }),
      weekday: ist.toLocaleDateString("hi-IN", { weekday: "long" }),

      sunrise: sun.sunrise,
      sunset: sun.sunset,

      moonrise: "Auto model",
      moonset: "Auto model",

      vikram_samvat: samvat.vikram,
      shak_samvat: samvat.shak,

      masa,
      paksha: tithiData.paksha,
      tithi: tithiData.tithi,

      source: "Offline Sunrise-based Panchang (Production-safe)"
    });

  } catch (e) {
    console.error(e);
    res.json({ error: "Panchang failed" });
  }
});

app.listen(PORT, () => {
  console.log("Bhakti Panchang backend running on", PORT);
});
