import express from "express";
import cors from "cors";
import { fetchProkeralaPanchang } from "./data/prokerala/fetchProkeralaPanchang.js";
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* ===============================
   LOCATION (FIXED)
================================ */
const LOCATION = {
  name: "Jaipur, India",
  lat: 26.9124,
  lon: 75.7873
};

/* ===============================
   SUNRISE / SUNSET (STABLE MODEL)
   (good enough for tithi-lock)
================================ */
function getSunriseSunset(date) {
  // Simple seasonal model (IST)
  // avoids node / API errors
  const month = date.getMonth() + 1;

  let sunrise = "06:45 am";
  let sunset = "05:45 pm";

  if (month >= 4 && month <= 8) {
    sunrise = "05:30 am";
    sunset = "07:00 pm";
  } else if (month >= 9 && month <= 10) {
    sunrise = "06:00 am";
    sunset = "06:15 pm";
  }

  return { sunrise, sunset };
}

/* ===============================
   AMAVASYA TABLE (ANCHOR)
   Sunrise-accepted dates (IST)
================================ */
const AMAVASYA_TABLE = [
  { date: "2025-12-30", masa: "पौष" },

  { date: "2026-01-29", masa: "माघ" },
  { date: "2026-02-27", masa: "फाल्गुन" },
  { date: "2026-03-29", masa: "चैत्र" },
  { date: "2026-04-27", masa: "वैशाख" },
  { date: "2026-05-27", masa: "ज्येष्ठ" },
  { date: "2026-06-25", masa: "आषाढ़" },
  { date: "2026-07-25", masa: "श्रावण" },
  { date: "2026-08-23", masa: "भाद्रपद" },
  { date: "2026-09-22", masa: "आश्विन" },
  { date: "2026-10-21", masa: "कार्तिक" },
  { date: "2026-11-19", masa: "मार्गशीर्ष" },
  { date: "2026-12-19", masa: "पौष" }
];

const TITHI_NAMES = [
  "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी",
  "अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","अमावस्या",
  "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी",
  "अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा"
];

function toDateKey(d) {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor((a - b) / oneDay);
}

/* ===============================
   CORE PANCHANG ENGINE
================================ */
function getMasaPakshaTithi(today) {
  // Sunrise-locked date
  const sunriseDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    6, 0, 0
  );

  const sunriseKey = toDateKey(sunriseDate);

  // Find latest Amavasya <= sunrise
  let base = null;
  for (let i = AMAVASYA_TABLE.length - 1; i >= 0; i--) {
    if (AMAVASYA_TABLE[i].date <= sunriseKey) {
      base = AMAVASYA_TABLE[i];
      break;
    }
  }

  if (!base) {
    return { masa: "—", paksha: "—", tithi: "—" };
  }

  const amavasyaDate = new Date(base.date + "T06:00:00+05:30");
  let index = daysBetween(sunriseDate, amavasyaDate) % 30;
  if (index < 0) index += 30;

  const tithi = TITHI_NAMES[index];
  const paksha = index <= 14 ? "कृष्ण पक्ष" : "शुक्ल पक्ष";
  const masa = base.masa;

  return { masa, paksha, tithi };
}

/* ===============================
   SAMVAT (AUTO, NO MANUAL CHANGE)
================================ */
function getSamvat(today) {
  const year = today.getFullYear();
  return {
    vikram_samvat: year + 57,
    shak_samvat: year - 78
  };
}

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.send("Bhakti Panchang backend running");
});

/* ===============================
   PANCHANG API (FINAL)
================================ */
app.get("/api/panchang", (req, res) => {
  try {
    const today = new Date();

    const { sunrise, sunset } = getSunriseSunset(today);
    const { masa, paksha, tithi } = getMasaPakshaTithi(today);
    const samvat = getSamvat(today);

    res.json({
      date: today.toLocaleDateString("hi-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }),
      weekday: today.toLocaleDateString("hi-IN", { weekday: "long" }),

      sunrise,
      sunset,
      moonrise: "Auto model",
      moonset: "Auto model",

      vikram_samvat: samvat.vikram_samvat,
      shak_samvat: samvat.shak_samvat,

      masa,
      paksha,
      tithi,

      source: "Sunrise-locked Panchang (Offline, Amavasya-based)",
      location: LOCATION.name
    });

  } catch (err) {
    console.error("Panchang Error:", err);
    res.json({ success: false });
  }
});
app.get("/api/test-prokerala", async (req, res) => {
  try {
    const data = await fetchProkeralaPanchang("2026-01-10");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log("Bhakti Panchang backend running on port", PORT);
});
