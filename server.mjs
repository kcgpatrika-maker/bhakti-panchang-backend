import express from "express";
import cors from "cors";

import { getPanchangFromFreeSource } from "./data/freePanchangSource.js";
import { tithiEventsMap } from "./data/tithiEvents.js";
import { getTithiFromTable } from "./data/tithiFromTable.js";
import { getSamvat } from "./data/samvatCalculator.js";
import { getMasa } from "./data/masaCalculator.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ===============================
// PANCHANG DAILY CACHE
// ===============================
let dailyPanchangCache = {
  dateKey: null,
  data: null
};

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
    const todayKey = today.toISOString().slice(0, 10); // YYYY-MM-DD

    // ✅ CACHE HIT
    if (dailyPanchangCache.dateKey === todayKey) {
      return res.json(dailyPanchangCache.data);
    }

    // ===============================
    // DATA SOURCES
    // ===============================
    const freePanchang = await getPanchangFromFreeSource();
    const tithiData = getTithiFromTable(today);
    const samvat = getSamvat(today);
    const masa = getMasa(today);

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
      const simpleKey = `${masa} | ${tithiData.tithi}`;
      if (tithiEventsMap[simpleKey]) {
        festivalList = tithiEventsMap[simpleKey];
      }
    }

    if (festivalList.length === 0) {
      festivalList = ["कोई विशेष व्रत नहीं"];
    }

    // ===============================
    // FINAL RESPONSE OBJECT
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
      source: freePanchang.note ?? "Free source",
      festivalList
    };

    // ===============================
    // SAVE TO CACHE
    // ===============================
    dailyPanchangCache.dateKey = todayKey;
    dailyPanchangCache.data = responseData;

    // ===============================
    // RESPONSE
    // ===============================
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
