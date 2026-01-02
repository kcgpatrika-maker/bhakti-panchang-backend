// server.mjs

import express from "express";
import cors from "cors";

// ===== Data imports =====
import { getPanchangFromFreeSource } from "./data/freePanchangSource.js";
import { tithiEventsMap } from "./data/tithiEvents.js";
import { getTithiData } from "./data/tithiCalendar.js";
import { getSamvat } from "./data/samvatCalculator.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.send("Bhakti Panchang backend is running!");
});

// ===============================
// PANCHANG API - Route B
// ===============================
app.get("/api/panchang", async (req, res) => {
  try {
    const today = new Date();
    const tithiData = getTithiData(today);
    const samvat = getSamvat(today);

    // Free source fetch
    const freePanchang = await getPanchangFromFreeSource();
    

    let festivalList = [];

// 1️⃣ Exact match: मास + पक्ष + तिथि
const exactKey = `${tithiData.masa} | ${tithiData.paksha} ${tithiData.tithi}`;
if (tithiEventsMap[exactKey]) {
  festivalList = tithiEventsMap[exactKey];
}

// 2️⃣ Any मास match
if (festivalList.length === 0) {
  const anyMasaKey = `किसी भी मास | ${tithiData.paksha} ${tithiData.tithi}`;
  if (tithiEventsMap[anyMasaKey]) {
    festivalList = tithiEventsMap[anyMasaKey];
  }
}

// 3️⃣ तिथि-only (जैसे अमावस्या / पूर्णिमा)
if (festivalList.length === 0) {
  const simpleKey = `${tithiData.masa} | ${tithiData.tithi}`;
  if (tithiEventsMap[simpleKey]) {
    festivalList = tithiEventsMap[simpleKey];
  }
}

// 4️⃣ Final fallback
if (festivalList.length === 0) {
  festivalList = ["कोई विशेष व्रत नहीं"];
}

    res.json({
  date: today.toLocaleDateString("hi-IN", {
  day: "2-digit",
  month: "long",
  year: "numeric"
}),
  sunrise: freePanchang.sunrise ?? "—",
  sunset: freePanchang.sunset ?? "—",
  moonrise: freePanchang.moonrise ?? "—",
  moonset: freePanchang.moonset ?? "—",
  vikram_samvat: samvat.vikram_samvat,
  shak_samvat: samvat.shak_samvat,
  masa: tithiData.masa ?? "—",
  tithi: tithiData.tithi,
  paksha: tithiData.paksha,
  source: freePanchang.note ?? "Free Source",
  festivalList
});
  } catch (err) {
    console.error("Panchang API Error:", err);

    res.json({
      success: false,
      message: "पंचांग लोड नहीं हो सका",
    });
  }
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`Bhakti Panchang backend running on port ${PORT}`);
});
