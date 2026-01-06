import express from "express";
import cors from "cors";

// Astronomy (PAC-based, offline)
import { getSunMoonData } from "./data/astronomy/sunMoonCalculator.js";
import { getTithiFromMoon } from "./data/astronomy/tithiFromMoon.js";

// Panchang logic
import { tithiEventsMap } from "./data/tithiEvents.js";
import { getSamvat } from "./data/samvatCalculator.js";
import { getMasa } from "./data/masaCalculator.js";
import { dharmikMessages } from "./data/dharmikMessages.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* ===============================
   DAILY CACHE (per date)
================================ */
let dailyPanchangCache = {
  dateKey: null,
  data: null
};

/* ===============================
   TITHI FALLBACK (MOON AGE)
================================ */
function getTithiByMoonFormula(date) {
  const knownNewMoon = new Date("2024-01-11T11:57:00Z");
  const diffDays = (date - knownNewMoon) / (1000 * 60 * 60 * 24);

  const moonAge = ((diffDays % 29.53) + 29.53) % 29.53;
  const index = Math.floor(moonAge / 0.984) + 1;

  const names = [
    "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी",
    "अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा",
    "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी",
    "अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","अमावस्या"
  ];

  const tithi = names[index - 1] || "—";
  const paksha = index <= 15 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";

  return { tithi, paksha };
}

/* ===============================
   MASA CORRECTION (AMAVASYA RULE)
================================ */
function correctMasa(masa, tithi, paksha) {
  if (tithi === "प्रतिपदा" && paksha === "शुक्ल पक्ष") {
    const nextMasa = {
      "पौष": "माघ",
      "माघ": "फाल्गुन",
      "फाल्गुन": "चैत्र",
      "चैत्र": "वैशाख",
      "वैशाख": "ज्येष्ठ",
      "ज्येष्ठ": "आषाढ़",
      "आषाढ़": "श्रावण",
      "श्रावण": "भाद्रपद",
      "भाद्रपद": "आश्विन",
      "आश्विन": "कार्तिक",
      "कार्तिक": "मार्गशीर्ष",
      "मार्गशीर्ष": "पौष"
    };
    return nextMasa[masa] ?? masa;
  }
  return masa;
}

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.send("Bhakti Panchang backend running");
});

/* ===============================
   PANCHANG API
================================ */
app.get("/api/panchang", async (req, res) => {
  try {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    // CACHE HIT
    if (dailyPanchangCache.dateKey === todayKey) {
      return res.json(dailyPanchangCache.data);
    }

    // ---- ASTRONOMY (SUN + MOON) ----
    const astro = getSunMoonData(today);

    // ---- TITHI / PAKSHA ----
    let tithiData = getTithiFromMoon(today);
    if (!tithiData?.tithi || !tithiData?.paksha) {
      tithiData = getTithiByMoonFormula(today);
    }

    // ---- SAMVAT & MASA ----
    const samvat = getSamvat(today);
    const rawMasa = getMasa(today);
    const masa = correctMasa(rawMasa, tithiData.tithi, tithiData.paksha);

    // ---- FESTIVALS ----
    let festivalList = [];
    const festKey = `${masa} | ${tithiData.tithi}`;
    if (tithiEventsMap[festKey]) {
      festivalList = tithiEventsMap[festKey];
    }
    if (festivalList.length === 0) {
      festivalList = ["कोई विशेष व्रत नहीं"];
    }

    // ---- DHARMIK MESSAGE ----
    let dharmikMessage = dharmikMessages.default;

    if (dharmikMessages.festival[festKey]) {
      dharmikMessage = dharmikMessages.festival[festKey];
    } else if (dharmikMessages.tithi[tithiData.tithi]) {
      dharmikMessage = dharmikMessages.tithi[tithiData.tithi];
    } else {
      const weekday = today.toLocaleDateString("hi-IN", { weekday: "long" });
      if (dharmikMessages.weekday[weekday]) {
        dharmikMessage = dharmikMessages.weekday[weekday];
      }
    }

    // ---- FINAL RESPONSE ----
    const responseData = {
      date: today.toLocaleDateString("hi-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }),
      weekday: today.toLocaleDateString("hi-IN", { weekday: "long" }),

      sunrise: astro.sunrise,
      sunset: astro.sunset,
      moonrise: astro.moonrise,
      moonset: astro.moonset,

      vikram_samvat: samvat.vikram_samvat,
      shak_samvat: samvat.shak_samvat,

      masa,
      paksha: tithiData.paksha,
      tithi: tithiData.tithi,

      dharmikMessage,
      festivalList,
      source: astro.source
    };

    // SAVE CACHE
    dailyPanchangCache = {
      dateKey: todayKey,
      data: responseData
    };

    res.json(responseData);

  } catch (err) {
    console.error("Panchang API Error:", err);
    res.json({ success: false });
  }
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log("Bhakti Panchang backend running on port", PORT);
});
