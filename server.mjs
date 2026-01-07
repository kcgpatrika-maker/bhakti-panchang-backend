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
    "à¤ªà¥�à¤°à¤¤à¤¿à¤ªà¤¦à¤¾","à¤¦à¥�à¤µà¤¿à¤¤à¥€à¤¯à¤¾","à¤¤à¥ƒà¤¤à¥€à¤¯à¤¾","à¤šà¤¤à¥�à¤°à¥�à¤¥à¥€","à¤ªà¤‚à¤šà¤®à¥€","à¤·à¤·à¥�à¤ à¥€","à¤¸à¤ªà¥�à¤¤à¤®à¥€",
    "à¤…à¤·à¥�à¤Ÿà¤®à¥€","à¤¨à¤µà¤®à¥€","à¤¦à¤¶à¤®à¥€","à¤�à¤•à¤¾à¤¦à¤¶à¥€","à¤¦à¥�à¤µà¤¾à¤¦à¤¶à¥€","à¤¤à¥�à¤°à¤¯à¥‹à¤¦à¤¶à¥€","à¤šà¤¤à¥�à¤°à¥�à¤¦à¤¶à¥€","à¤ªà¥‚à¤°à¥�à¤£à¤¿à¤®à¤¾",
    "à¤ªà¥�à¤°à¤¤à¤¿à¤ªà¤¦à¤¾","à¤¦à¥�à¤µà¤¿à¤¤à¥€à¤¯à¤¾","à¤¤à¥ƒà¤¤à¥€à¤¯à¤¾","à¤šà¤¤à¥�à¤°à¥�à¤¥à¥€","à¤ªà¤‚à¤šà¤®à¥€","à¤·à¤·à¥�à¤ à¥€","à¤¸à¤ªà¥�à¤¤à¤®à¥€",
    "à¤…à¤·à¥�à¤Ÿà¤®à¥€","à¤¨à¤µà¤®à¥€","à¤¦à¤¶à¤®à¥€","à¤�à¤•à¤¾à¤¦à¤¶à¥€","à¤¦à¥�à¤µà¤¾à¤¦à¤¶à¥€","à¤¤à¥�à¤°à¤¯à¥‹à¤¦à¤¶à¥€","à¤šà¤¤à¥�à¤°à¥�à¤¦à¤¶à¥€","à¤…à¤®à¤¾à¤µà¤¸à¥�à¤¯à¤¾"
  ];

  const tithi = names[index - 1] || "â€”";
  const paksha = index <= 15 ? "à¤¶à¥�à¤•à¥�à¤² à¤ªà¤•à¥�à¤·" : "à¤•à¥ƒà¤·à¥�à¤£ à¤ªà¤•à¥�à¤·";

  return { tithi, paksha };
}

/* ===============================
   MASA CORRECTION (AMAVASYA RULE)
================================ */
function correctMasa(masa, tithi, paksha) {
  if (tithi === "à¤ªà¥�à¤°à¤¤à¤¿à¤ªà¤¦à¤¾" && paksha === "à¤¶à¥�à¤•à¥�à¤² à¤ªà¤•à¥�à¤·") {
    const nextMasa = {
      "à¤ªà¥Œà¤·": "à¤®à¤¾à¤˜",
      "à¤®à¤¾à¤˜": "à¤«à¤¾à¤²à¥�à¤—à¥�à¤¨",
      "à¤«à¤¾à¤²à¥�à¤—à¥�à¤¨": "à¤šà¥ˆà¤¤à¥�à¤°",
      "à¤šà¥ˆà¤¤à¥�à¤°": "à¤µà¥ˆà¤¶à¤¾à¤–",
      "à¤µà¥ˆà¤¶à¤¾à¤–": "à¤œà¥�à¤¯à¥‡à¤·à¥�à¤ ",
      "à¤œà¥�à¤¯à¥‡à¤·à¥�à¤ ": "à¤†à¤·à¤¾à¤¢à¤¼",
      "à¤†à¤·à¤¾à¤¢à¤¼": "à¤¶à¥�à¤°à¤¾à¤µà¤£",
      "à¤¶à¥�à¤°à¤¾à¤µà¤£": "à¤­à¤¾à¤¦à¥�à¤°à¤ªà¤¦",
      "à¤­à¤¾à¤¦à¥�à¤°à¤ªà¤¦": "à¤†à¤¶à¥�à¤µà¤¿à¤¨",
      "à¤†à¤¶à¥�à¤µà¤¿à¤¨": "à¤•à¤¾à¤°à¥�à¤¤à¤¿à¤•",
      "à¤•à¤¾à¤°à¥�à¤¤à¤¿à¤•": "à¤®à¤¾à¤°à¥�à¤—à¤¶à¥€à¤°à¥�à¤·",
      "à¤®à¤¾à¤°à¥�à¤—à¤¶à¥€à¤°à¥�à¤·": "à¤ªà¥Œà¤·"
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
      festivalList = ["à¤•à¥‹à¤ˆ à¤µà¤¿à¤¶à¥‡à¤· à¤µà¥�à¤°à¤¤ à¤¨à¤¹à¥€à¤‚"];
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
