import express from "express";
import cors from "cors";

import bhaktiMaster from "./data/bhaktiMaster.js";
import { getTithiData } from "./data/tithiCalendar.js";
import { getTithiEvents } from "./data/tithiEvents.js";

const app = express();
app.use(cors());

/* ---------------- PANCHANG API ---------------- */

app.get("/api/panchang", (req, res) => {
  const today = new Date();

  const dateStr = today.toLocaleDateString("hi-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const dayStr = today.toLocaleDateString("hi-IN", {
    weekday: "long"
  });

  const tithiData = getTithiData(today);
  const events = getTithiEvents(today);

  res.json({
    success: true,
    data: {
      date: dateStr,
      day: dayStr,
      sunMoon: {
        sunrise: "06:55",
        sunset: "17:42",
        moonrise: "19:10",
        moonset: "07:30"
      },
      vikram_samvat: 2082,
      shak_samvat: 1947,
      masa: tithiData.masa,
      paksha_tithi: tithiData.tithi,
      vratList: events.vrat.length ? events.vrat : ["कोई विशेष व्रत नहीं"],
      diwasList: events.diwas.length ? events.diwas : ["कोई विशेष दिवस नहीं"]
    }
  });
});

/* ---------------- ASK BHAKTI ---------------- */

app.get("/api/ask-bhakti", (req, res) => {
  const q = req.query.q || "";

  const list = Object.keys(bhaktiMaster).map(key => ({
    id: key,
    name: bhaktiMaster[key].name
  }));

  res.json({ success: true, data: list });
});

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Bhakti Panchang backend running on port", PORT);
});
