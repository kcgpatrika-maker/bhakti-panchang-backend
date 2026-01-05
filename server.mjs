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

/* ===============================
   DAILY CACHE
================================ */
let dailyPanchangCache = {
  dateKey: null,
  data: null
};

/* ===============================
   TITHI FALLBACK (FINAL AUTHORITY)
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
   API
================================ */
app.get("/api/panchang", async (req, res) => {
  try {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    if (dailyPanchangCache.dateKey === todayKey) {
      return res.json(dailyPanchangCache.data);
    }

    const freePanchang = await getPanchangFromFreeSource();
    const samvat = getSamvat(today);
    const masa = getMasa(today);

    let tithiData = getTithiFromTable(today);

    if (!tithiData?.tithi || !tithiData?.paksha) {
      tithiData = getTithiByMoonFormula(today);
    }

    /* ===============================
       FESTIVAL
    ================================ */
    let festivalList = [];

    const festKey = `${masa} | ${tithiData.tithi}`;
    if (tithiEventsMap[festKey]) {
      festivalList = tithiEventsMap[festKey];
    }

    if (festivalList.length === 0) {
      festivalList = ["कोई विशेष व्रत नहीं"];
    }

    /* ===============================
       DHARMIK MESSAGE (FINAL FIX)
    ================================ */
    let dharmikMessage = dharmikMessages.default;

    // Festival priority
    const msgKey = `${masa} | ${tithiData.tithi}`;
    if (dharmikMessages.festival[msgKey]) {
      dharmikMessage = dharmikMessages.festival[msgKey];
    }
    // Tithi
    else if (dharmikMessages.tithi[tithiData.tithi]) {
      dharmikMessage = dharmikMessages.tithi[tithiData.tithi];
    }
    // Weekday
    else {
      const weekday = today.toLocaleDateString("hi-IN", { weekday: "long" });
      dharmikMessage =
        dharmikMessages.weekday[weekday] ?? dharmikMessages.default;
    }

    const responseData = {
      date: today.toLocaleDateString("hi-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }),
      weekday: today.toLocaleDateString("hi-IN", { weekday: "long" }),
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
      festivalList,
      source: freePanchang.note ?? "Free source"
    };

    dailyPanchangCache = { dateKey: todayKey, data: responseData };
    res.json(responseData);

  } catch (err) {
    console.error("Panchang API Error:", err);
    res.json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log("Bhakti Panchang backend running on port", PORT);
});
