import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* =========================
   PATH FIX
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   IMPORT DAY DATA
========================= */
import { bharatDiwasMap } from "./bharatDiwas.js";
import { vratTyoharMap } from "./vratTyohar.js";

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
   TITHI TABLE (LIMITED)
========================= */
const tithiTable2025 = {
  "12-26": { masa: "पौष", tithi: "शुक्ल पक्ष षष्ठी" },
  "12-27": { masa: "पौष", tithi: "शुक्ल पक्ष सप्तमी" },
  "12-28": { masa: "पौष", tithi: "शुक्ल पक्ष अष्टमी" }
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

  const keyMMDD = `${mm}-${dd}`;

  const tithiInfo =
    tithiTable2025[keyMMDD] || {
      masa: "पौष",
      tithi: "जानकारी उपलब्ध नहीं"
    };

  /* Bharat Diwas */
  const bharatDiwas =
    bharatDiwasMap[keyMMDD] || [];

  /* Vrat / Tyohar */
  const vratTyohar =
    vratTyoharMap[keyMMDD] || [];

  return {
    date: `${dd} ${getHindiMonth(now.getMonth())} ${yyyy}`,
    day: now.toLocaleDateString("hi-IN", {
      weekday: "long"
    }),

    masa: tithiInfo.masa,
    paksha_tithi: tithiInfo.tithi,

    samvat: {
      vikram: 2082,
      shak: 1947
    },

    sunMoon: {
      sunrise: "06:55",
      sunset: "17:42",
      moonrise: "19:10",
      moonset: "07:30"
    },

    vrat_tyohar:
      vratTyohar.length > 0
        ? vratTyohar
        : ["कोई विशेष व्रत नहीं"],

    bharat_diwas:
      bharatDiwas.length > 0
        ? bharatDiwas
        : []
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
  console.log(`Server running on port ${PORT}`);
});
