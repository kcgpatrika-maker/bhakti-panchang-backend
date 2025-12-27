import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { bharatDiwasMap } from "./data/bharatDiwas.js";
import { vratTyoharMap } from "./data/vratTyohar.js";

/* =========================
   PATH FIX
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   LOAD BHAKTI DATA
========================= */
const bhaktiPath = path.join(
  __dirname,
  "data",
  "bhakti-mantra-aarti.json"
);
const BHAKTI_DB = JSON.parse(
  fs.readFileSync(bhaktiPath, "utf-8")
);

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

/* =========================
   TITHI TABLE (2025 – BASE)
========================= */
const tithiTable2025 = {
  "12-25": { masa: "पौष", tithi: "शुक्ल पक्ष पंचमी" },
  "12-26": { masa: "पौष", tithi: "शुक्ल पक्ष षष्ठी" },
  "12-27": { masa: "पौष", tithi: "शुक्ल पक्ष सप्तमी" }
};

/* =========================
   PANCHANG CORE
========================= */
function getPanchang() {
  const now = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata"
    })
  );

  const dd = pad(now.getDate());
  const mm = pad(now.getMonth() + 1);
  const yyyy = now.getFullYear();
  const key = `${mm}-${dd}`;

  const tithiInfo =
    tithiTable2025[key] || {
      masa: "पौष",
      tithi: "जानकारी उपलब्ध नहीं"
    };

  /* 🔹 अलग-अलग लिस्ट */
  const vratList = vratTyoharMap[key] || [];
  const diwasList = bharatDiwasMap[key] || [];

  return {
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

    masa: tithiInfo.masa,
    paksha_tithi: tithiInfo.tithi,

    vratList,
    diwasList
  };
}

/* =========================
   APIs
========================= */

// Panchang API
app.get("/api/panchang", (req, res) => {
  res.json({
    success: true,
    data: getPanchang()
  });
});

// Ask Bhakti API
app.get("/api/ask-bhakti-all", (req, res) => {
  const q = (req.query.q || "").trim();

  if (!q || !BHAKTI_DB[q]) {
    return res.json({
      success: false,
      message: "डेटा उपलब्ध नहीं"
    });
  }

  res.json({
    success: true,
    deity: q,
    data: BHAKTI_DB[q]
  });
});

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
