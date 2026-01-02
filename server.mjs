import express from "express";
import cors from "cors";

import { getTodayPanchang } from "./data/panchangEngine.js";
import { tithiEventsMap } from "./data/tithiEvents.js";

const app = express();
app.use(cors());

/* ===============================
   HELPER: FESTIVAL FINDER (SAFE)
=============================== */
function getFestivalList(masa, tithi) {
  const list = [];

  if (!masa || !tithi) return list;

  const exactKey = `${masa} | ${tithi}`;
  const anyMasaKey = `किसी भी मास | ${tithi}`;

  if (Array.isArray(tithiEventsMap[exactKey])) {
    list.push(...tithiEventsMap[exactKey]);
  }

  if (Array.isArray(tithiEventsMap[anyMasaKey])) {
    list.push(...tithiEventsMap[anyMasaKey]);
  }

  return list;
}

/* ===============================
   PANCHANG API
=============================== */
app.get("/api/panchang", (req, res) => {
  try {
    const p = getTodayPanchang();

    const masa = p.masa || "";
    const tithi = p.tithi || "";

    const festivalList = getFestivalList(masa, tithi);

    res.json({
      success: true,
      data: {
        date: p.date,
        day: p.day,

        sunMoon: {
          sunrise: p.sunrise,
          sunset: p.sunset,
          moonrise: p.moonrise,
          moonset: p.moonset
        },

        vikram_samvat: p.vikram_samvat,
        shak_samvat: p.shak_samvat,
        masa: masa || "—",
        paksha_tithi: tithi || "तिथि जानकारी अपडेट प्रक्रिया में है",

        festivalList: Array.isArray(festivalList) && festivalList.length > 0
          ? festivalList
          : ["कोई विशेष व्रत नहीं"]
      }
    });

  } catch (err) {
    console.error("Panchang API Error:", err);

    res.json({
      success: false,
      message: "पंचांग लोड नहीं हो सका"
    });
  }
});

/* ===============================
   ROOT
=============================== */
app.get("/", (req, res) => {
  res.send("Bhakti Panchang backend running");
});

/* ===============================
   SERVER START
=============================== */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Bhakti Panchang backend running on port", PORT);
});
