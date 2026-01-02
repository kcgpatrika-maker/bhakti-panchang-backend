// server.mjs

import express from "express";
import cors from "cors";

// ===== Data imports =====
import { getPanchangFromFreeSource } from "./data/freePanchangSource.js";
import { tithiEventsMap } from "./data/tithiEvents.js";

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

    // Free source fetch
    const freePanchang = await getPanchangFromFreeSource();

    // Festival / व्रत list
    const key = `${freePanchang.masa} | ${freePanchang.tithi}`;
    const festivalList = tithiEventsMap[key] || ["कोई विशेष व्रत नहीं"];

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
  vikram_samvat: freePanchang.vikram_samvat ?? "—",
  shak_samvat: freePanchang.shak_samvat ?? "—",
  masa: freePanchang.masa ?? "—",
  tithi: freePanchang.tithi ?? "—",
  paksha: freePanchang.paksha ?? "—",
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
