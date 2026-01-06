import express from "express";
import cors from "cors";

import { getDrikPanchang } from "./data/drik/drikFetcher.js";
import { getSunMoonData } from "./data/astronomy/sunMoonCalculator.js";
import { getTithiFromMoon } from "./data/astronomy/tithiFromMoon.js";
import { getMoonRiseSet } from "./data/astronomy/moonRiseSet.js";
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

// ===============================
// PANCHANG DATA (STEP-K-10 FINAL)
// ===============================
let panchang = null;

// 1️⃣ TRY: Drik Panchang (Auto / Free / Long-term)
try {
  panchang = await getDrikPanchang(today);
} catch (e) {
  console.log("Drik Panchang failed, fallback…");
}

// 2️⃣ FALLBACK: PAC / Astronomy
if (!panchang || panchang.tithi === "—") {
  const astro = getSunMoonData(today);
  const moonData = getMoonRiseSet(today);
  const tithiMoon = getTithiFromMoon(today);

  panchang = {
    sunrise: astro.sunrise,
    sunset: astro.sunset,
    moonrise: moonData.moonrise,
    moonset: moonData.moonset,
    tithi: tithiMoon.tithi,
    paksha: tithiMoon.paksha,
    masa,
    source: "Sun & Moon: PAC (Fallback)"
  };
}

// 3️⃣ FINAL SAFETY: Formula
if (!panchang.tithi || !panchang.paksha) {
  const safe = getTithiByMoonFormula(today);
  panchang.tithi = safe.tithi;
  panchang.paksha = safe.paksha;
  panchang.source += " + Formula";
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

  sunrise: panchang.sunrise,
  sunset: panchang.sunset,
  moonrise: panchang.moonrise,
  moonset: panchang.moonset,

  vikram_samvat: samvat.vikram_samvat,
  shak_samvat: samvat.shak_samvat,

  masa: panchang.masa ?? masa,
  paksha: panchang.paksha,
  tithi: panchang.tithi,

  dharmikMessage,
  festivalList,

  source: panchang.source
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
