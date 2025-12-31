import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import bhaktiMaster from "./data/bhaktiMaster.js";
import { bharatDiwasMap } from "./data/bharatDiwas.js";
import { vratTyoharMap } from "./data/vratTyohar.js";
import { tithiCalendar } from "./data/tithiCalendar.js";
import { tithiEventsMap } from "./data/tithiEvents.js";

/* =========================
   PATH FIX
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   APP INIT
========================= */
const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   HELPERS
========================= */
function pad(n) {
  return n.toString().padStart(2, "0");
}

function getHindiMonth(i) {
  return [
    "जनवरी","फरवरी","मार्च","अप्रैल","मई","जून",
    "जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"
  ][i];
}

function getDateKey(dateObj) {
  return dateObj.toISOString().split("T")[0];
}

/* =========================
   PANCHANG CORE
========================= */
function getTithiAndEvents(today) {
  const dateKey = getDateKey(today);
  const info = tithiCalendar[dateKey];

  if (!info) {
    return {
      masa: "—",
      tithi: "तिथि जानकारी अपडेट प्रक्रिया में है",
      vrat: [],
      diwas: []
    };
  }

  const exactKey = `${info.masa} | ${info.paksha} ${info.tithi}`;
  const anyMasaKey = `किसी भी मास | ${info.tithi}`;

  const events =
    tithiEventsMap[exactKey] ||
    tithiEventsMap[anyMasaKey] ||
    [];

  const vratList = events.filter(e => e.type === "vrat").map(e => e.name);
  const diwasList = events.filter(e => e.type === "diwas").map(e => e.name);

  return {
    masa: info.masa,
    tithi: `${info.paksha} ${info.tithi}`,
    vrat: vratList.length ? vratList : [],
    diwas: diwasList.length ? diwasList : []
  };
}

/* =========================
   PANCHANG API
========================= */
app.get("/api/panchang", (req, res) => {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const dd = pad(now.getDate());
  const yyyy = now.getFullYear();

  const tithiData = getTithiAndEvents(now);

  res.json({
    success: true,
    data: {
      date: `${dd} ${getHindiMonth(now.getMonth())} ${yyyy}`,
      day: now.toLocaleDateString("hi-IN", { weekday: "long" }),
      sunMoon: {
        sunrise: "06:55",
        sunset: "17:42",
        moonrise: "19:10",
        moonset: "07:30"
      },
      vikram_samvat: 2082,
      shak_samvat: 1947,
      masa: tithiData.masa || "—",
      paksha_tithi: tithiData.tithi || "तिथि जानकारी अपडेट प्रक्रिया में है",
      vratList: tithiData.vrat.length ? tithiData.vrat : ["कोई विशेष व्रत नहीं"],
      diwasList: tithiData.diwas.length ? tithiData.diwas : ["कोई विशेष दिवस नहीं"]
    }
  });
});

/* =========================
   Ask Bhakti : Single Devta
========================= */
app.get("/api/ask-bhakti/:devta", (req, res) => {
  const devtaKey = req.params.devta.toLowerCase().trim();
  const data = bhaktiMaster[devtaKey];

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "देवता की जानकारी उपलब्ध नहीं है"
    });
  }

  res.json({ success: true, data });
});

/* =========================
   Ask Bhakti : Full List
========================= */
app.get("/api/ask-bhakti", (req, res) => {
  const list = Object.values(bhaktiMaster).map(d => ({
    id: d.id,
    name: d.name
  }));
  res.json({ success: true, data: list });
});

/* =========================
   Ask Bhakti : Query All Sections
   (for full mantra, aarti, puja, chalisa, stotra)
========================= */
app.get("/api/ask-bhakti-all", (req, res) => {
  const q = (req.query.q || "").toLowerCase().trim();
  const devtaKey = Object.keys(bhaktiMaster).find(
    key => key.toLowerCase() === q
  );

  if (!devtaKey) {
    return res.status(404).json({ success: false, message: "देवता की जानकारी उपलब्ध नहीं है" });
  }

  const data = bhaktiMaster[devtaKey];
  res.json({ success: true, data });
});

// =========================
// Root
app.get("/", (req, res) => {
  res.send("Bhakti Panchang Backend Running");
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
