import express from "express";
import cors from "cors";

import { getFreePanchang } from "./data/freePanchangSource.js";
import { tithiEventsMap } from "./data/tithiEvents.js";
import { getTithiData } from "./data/tithiCalendar.js";
import { getTithiFromTable } from "./data/tithiFromTable.js";
import { getSamvat } from "./data/samvatCalculator.js";
import { getMasa } from "./data/masaCalculator.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

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

    const freePanchang = await getPanchangFromFreeSource();
    const tithiData = getTithiFromTable(today);
    const samvat = getSamvat(today);
    const masa = getMasa(today);
    
    let festivalList = [];

    // 1️⃣ Exact match
    const exactKey = `${tithiData.masa} | ${tithiData.paksha} ${tithiData.tithi}`;
    if (tithiEventsMap[exactKey]) {
      festivalList = tithiEventsMap[exactKey];
    }

    // 2️⃣ Any मास
    if (festivalList.length === 0) {
      const anyKey = `किसी भी मास | ${tithiData.paksha} ${tithiData.tithi}`;
      if (tithiEventsMap[anyKey]) {
        festivalList = tithiEventsMap[anyKey];
      }
    }

    // 3️⃣ Simple तिथि
    if (festivalList.length === 0) {
      const simpleKey = `${tithiData.masa} | ${tithiData.tithi}`;
      if (tithiEventsMap[simpleKey]) {
        festivalList = tithiEventsMap[simpleKey];
      }
    }

    if (festivalList.length === 0) {
      festivalList = ["कोई विशेष व्रत नहीं"];
    }

    res.json({
      date: today.toLocaleDateString("hi-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long"
  }),
  sunrise: freePanchang.sunrise ?? "—",
  sunset: freePanchang.sunset ?? "—",
  moonrise: freePanchang.moonrise ?? "—",
  moonset: freePanchang.moonset ?? "—",
  vikram_samvat: samvat.vikram_samvat,
  shak_samvat: samvat.shak_samvat,
  masa,
  tithi: tithiData.tithi,
  paksha: tithiData.paksha,
  source: freePanchang.note ?? "Free source",
  festivalList
});

  } catch (err) {
    console.error("Panchang API Error:", err);
    res.json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log("Bhakti Panchang backend running on port", PORT);
});
