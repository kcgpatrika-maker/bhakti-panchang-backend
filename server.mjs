import express from "express";
import cors from "cors";

import { getPanchangFromFreeSource } from "./data/freePanchangSource.js";
import { tithiEventsMap } from "./data/tithiEvents.js";
import { getTithiFromTable } from "./data/tithiFromTable.js";
import { getSamvat } from "./data/samvatCalculator.js";
import { getMasa } from "./data/masaCalculator.js";
import { dharmikMessages } from "./data/dharmikMessages.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ===============================
// DAILY CACHE
// ===============================
let dailyPanchangCache = {
  dateKey: null,
  data: null
};

// ===============================
// TITHI FORMULA FALLBACK
// ===============================
function getTithiByMoonFormula(date) {
  const knownNewMoon = new Date("2024-01-11T11:57:00Z"); // reference
  const diffMs = date - knownNewMoon;
  const days = diffMs / (1000 * 60 * 60 * 24);

  const moonAge = ((days % 29.53) + 29.53) % 29.53;
  const tithiIndex = Math.floor(moonAge / 0.984) + 1;

  const tithiNames = [
    "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी",
    "अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा",
    "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी",
    "अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","अमावस्या"
  ];

  const tithi = tithiNames[tithiIndex - 1] || "—";
  const paksha = tithiIndex <= 15 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";

  return { tithi, paksha };
}

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.send("Bhakti Panchang backend running");
});

// ===============================
// PANCHANG API
// ===============================
app.get("/api/panchang", async (req, res) => {
  try {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    // ✅ CACHE HIT
    if (dailyPanchangCache.dateKey === todayKey) {
      return res.json(dailyPanchangCache.data);
    }

    // ===============================
    // DATA SOURCES
    // ===============================
    const freePanchang = await getPanchangFromFreeSource();
    const samvat = getSamvat(today);
    const masa = getMasa(today);

    let tithiData = getTithiFromTable(today);

    // 👉 FALLBACK if table fails
    if (!tithiData || !tithiData.tithi || !tithiData.paksha) {
      tithiData = getTithiByMoonFormula(today);
    }

    // ===============================
    // FESTIVAL LOGIC
    // ===============================
    let festivalList = [];

    const exactKey = `${masa} | ${tithiData.paksha} ${tithiData.tithi}`;
    if (tithiEventsMap[exactKey]) {
      festivalList = tithiEventsMap[exactKey];
    }

    if (festivalList.length === 0) {
      const anyKey = `किसी भी मास | ${tithiData.paksha} ${tithiData.tithi}`;
      if (tithiEventsMap[anyKey]) {
        festivalList = tithiEventsMap[anyKey];
      }
    }

    if (festivalList.length === 0) {
      festivalList = ["कोई विशेष व्रत नहीं"];
    }

    // ===============================
    // DHARMIK MESSAGE
    // ===============================
    let dharmikMessage = dharmikMessages.default;

    const festivalKey = `${masa} | ${tithiData.tithi}`;
    if (dharmikMessages.festival[festivalKey]) {
      dharmikMessage = dharmikMessages.festival[festivalKey];
    } else if (dharmikMessages.tithi[tithiData.tithi]) {
      dharmikMessage = dharmikMessages.tithi[tithiData.tithi];
    } else {
      const weekday = today.toLocaleDateString("hi-IN", { weekday: "long" });
      if (dharmikMessages.weekday[weekday]) {
        dharmikMessage = dharmikMessages.weekday[weekday];
      }
    }

    // ===============================
    // FINAL RESPONSE
    // ===============================
    const responseData = {
      date: today.toLocaleDateString("hi-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }),
      weekday: today.toLocaleDateString("hi-IN", {
        weekday: "long"
      }),
      sunrise: freePanchang.sunrise ?? "—",
      sunset: freePanchang.sunset ?? "—",
      moonrise: freePanchang.moonrise ?? "—",
      moonset: freePanchang.moonset ?? "—",
      vikram_samvat: samvat.vikram_samvat,
      shak_samvat: samvat.shak_samvat,
      masa,
      paksha: tithiData.paksha,
      tithi: tithiData.tithi,
      dharmikMessage,
      source: freePanchang.note ?? "Free source",
      festivalList
    };

    // SAVE CACHE
    dailyPanchangCache.dateKey = todayKey;
    dailyPanchangCache.data = responseData;

    res.json(responseData);

  } catch (err) {
    console.error("Panchang API Error:", err);
    res.json({ success: false });
  }
});

// ===============================
app.listen(PORT, () => {
  console.log("Bhakti Panchang backend running on port", PORT);
});
