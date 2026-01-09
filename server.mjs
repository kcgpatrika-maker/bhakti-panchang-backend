import express from "express";
import cors from "cors";

import { getSunMoonData } from "./data/astronomy/sunMoonCalculator.js";
import { getTithiFromMoon } from "./data/astronomy/tithiFromMoon.js";
import { getMasa } from "./data/masaCalculator.js";
import { getSamvat } from "./data/samvatCalculator.js";
import { tithiEventsMap } from "./data/tithiEvents.js";
import { dharmikMessages } from "./data/dharmikMessages.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

let cache = { date: null, data: null };

app.get("/", (req, res) => {
  res.send("Bhakti Panchang backend running");
});

app.get("/api/panchang", (req, res) => {
  try {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);

    if (cache.date === todayKey) {
      return res.json(cache.data);
    }

    const astro = getSunMoonData(now);
    const { tithi, paksha } = getTithiFromMoon(now);
    const masa = getMasa(now, tithi);
    const samvat = getSamvat(now);

    const festKey = `${masa} | ${tithi}`;
    const festivalList =
      tithiEventsMap[festKey] || ["कोई विशेष व्रत नहीं"];

    const weekday = now.toLocaleDateString("hi-IN", { weekday: "long" });

    let dharmikMessage =
      dharmikMessages.festival[festKey] ||
      dharmikMessages.tithi[tithi] ||
      dharmikMessages.weekday[weekday] ||
      dharmikMessages.default;

    const response = {
      date: now.toLocaleDateString("hi-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }),
      weekday,
      sunrise: astro.sunrise,
      sunset: astro.sunset,
      moonrise: astro.moonrise,
      moonset: astro.moonset,
      vikram_samvat: samvat.vikram_samvat,
      shak_samvat: samvat.shak_samvat,
      masa,
      paksha,
      tithi,
      dharmikMessage,
      festivalList,
      source: astro.source
    };

    cache = { date: todayKey, data: response };
    res.json(response);

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log("Bhakti Panchang backend running on", PORT);
});
