import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { bharatDiwasMap } from "./data/bharatDiwas.js";
import { composeDharmikMessage } from "./data/messageComposer.js";
import { resolveCanonicalFestivals, getFestivalHints } from "./data/festivalResolver.js";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;
const URL = "https://www.srimandir.com/hi/panchang";

/* =====================================================
   🔸 CACHE SETUP START
   ===================================================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.join(__dirname, "cache");

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
}

function todayKeyISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getCacheFile() {
  return path.join(CACHE_DIR, `${todayKeyISO()}.json`);
}

function readCache() {
  try {
    const file = getCacheFile();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    }
  } catch (e) {
    console.error("Cache read error:", e.message);
  }
  return null;
}

function writeCache(data) {
  try {
    fs.writeFileSync(getCacheFile(), JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Cache write error:", e.message);
  }
}
/* =====================================================
   🔸 CACHE SETUP END
   ===================================================== */
/* =====================================================
   🔱 BHAKTI ASK SYSTEM – PART 1 (HELPERS + CACHE)
   ===================================================== */
// 🔸 Bhakti cache directory
const BHAKTI_CACHE_DIR = path.join(__dirname, "cache", "bhakti");
if (!fs.existsSync(BHAKTI_CACHE_DIR)) {
  fs.mkdirSync(BHAKTI_CACHE_DIR, { recursive: true });
}

// 🔸 normalize deity name
function normalizeDeityName(name = "") {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, "")
    .trim();
}

// 🔸 cache helpers
function getBhaktiCacheFile(deity) {
  const key = normalizeDeityName(deity);
  return path.join(BHAKTI_CACHE_DIR, `${key}.json`);
}
function readBhaktiCache(deity) {
  try {
    const file = getBhaktiCacheFile(deity);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    }
  } catch (e) {
    console.error("Bhakti cache read error:", e.message);
  }
  return null;
}
function writeBhaktiCache(deity, data) {
  try {
    const file = getBhaktiCacheFile(deity);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Bhakti cache write error:", e.message);
  }
}

// 🔸 fallback empty response
function getEmptyBhaktiResponse(deity) {
  return {
    deity,
    available: { mantra: false, aarti: false, poojaVidhi: false, chalisa: false, stotra: false },
    content: { mantra: [], aarti: "", poojaVidhi: null, chalisa: "", stotra: [] },
    sourceNote: "डेटा उपलब्ध नहीं है"
  };
}

// 🔸 Load mantras.json (safe + utf-8)
const mantrasPath = path.join(__dirname, "data", "mantras.json");
let mantrasData = Object.create(null);

try {
  const raw = fs.readFileSync(mantrasPath, { encoding: "utf-8" });
  mantrasData = JSON.parse(raw);
} catch (e) {
  console.error("❌ mantras.json load error:", e.message);
  mantrasData = Object.create(null);
}

// 🔸 Build alias map (safe)
const ALIAS_MAP = Object.create(null);

Object.keys(mantrasData || {}).forEach((key) => {
  if (!key) return;

  const entry = mantrasData[key] || {};
  ALIAS_MAP[normalizeDeityName(key)] = key;

  if (Array.isArray(entry.aliases)) {
    entry.aliases.forEach((a) => {
      if (a) ALIAS_MAP[normalizeDeityName(a)] = key;
    });
  }
});

async function fetchRaw() {
  const res = await fetch(URL);
  const html = await res.text();
  const $ = cheerio.load(html);
  const nextData = $("#__NEXT_DATA__").html();
  if (!nextData) return {};
  const parsed = JSON.parse(nextData);
  return parsed?.props?.pageProps || {};
}

app.get("/api/panchang", async (req, res) => {

  /* =====================================================
     🔸 CACHE CHECK (NEW)
     ===================================================== */
  const cached = readCache();
  if (cached) {
    return res.json(cached);
  }
  /* ===================================================== */

  let raw;
  try {
    raw = await fetchRaw();
  } catch (e) {
    console.error("Fetch failed:", e.message);
    // यदि fetch fail हो जाए और cache भी न हो
    return res.status(503).json({ error: "Panchang data unavailable" });
  }

  // तारीख और वार
  const date = raw?.panchangState?.lunarData?.headerTitle || "";
  const line1 = raw?.panchangState?.lunarData?.line1 || "";
  const day = line1.split(",").pop()?.trim() || "";

  // सूर्योदय, सूर्यास्त, चंद्रोदय, चंद्रास्त
  const sunMoonList = raw?.panchangState?.sunMoonInfo?.sunMoonList || [];
  const sunrise = sunMoonList.find(i => i.header === "सूर्योदय")?.time || "";
  const sunset  = sunMoonList.find(i => i.header === "सूर्यास्त")?.time || "";
  const moonrise = sunMoonList.find(i => i.header === "चंद्रोदय")?.time || "";
  const moonset  = sunMoonList.find(i => i.header === "चन्द्रास्त")?.time || "";

  // विक्रम संवत और शक संवत
  const panchangTwo = raw?.panchangState?.panchangTwo || [];
  const vikramSamvat = panchangTwo.flat().find(i => i.title === "विक्रम संवत")?.description || "";
  const shakaSamvat  = panchangTwo.flat().find(i => i.title === "शक संवत")?.description || "";

  // मास, पक्ष और तिथि
  const month = raw?.panchangState?.lunarData?.line2 || "";
  const tithiArr = raw?.panchangState?.panchangOne?.panchangOne || [];
  const tithiObj = tithiArr.find(i => i.title === "तिथि");
  const tithiFull = tithiObj?.description || "";

  let paksha = "";
  let tithi = "";
  if (tithiFull.includes(" ")) {
    const parts = tithiFull.split(" ");
    paksha = parts[0] + " " + parts[1];
    tithi = parts.slice(2).join(" ");
  } else {
    tithi = tithiFull;
  }

  // आज के व्रत-त्योहार
  const todayFestivalsLine = raw?.panchangState?.lunarData?.line5 || "";
  const todayFestivalsSrimandir = todayFestivalsLine
    ? todayFestivalsLine.split(",").map(f => f.trim())
    : [];

  const todayFestivals = resolveCanonicalFestivals({
    tithi,
    paksha,
    month,
    todayFestivals: todayFestivalsSrimandir
  });

  const upcomingFestivals = Array.isArray(raw?.panchangState?.festivals?.festivals)
    ? raw.panchangState.festivals.festivals.map(f => ({
        date: f.date,
        festival: f.festival
      }))
    : [];

  // प्रमुख दिवस-जयंती
  const todayKey = new Date()
    .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })
    .replace(/\//g, "-");
  const jayantiList = bharatDiwasMap[todayKey] || [];

  // आज का धार्मिक संदेश
  const weekday = new Date().toLocaleDateString("hi-IN", { weekday: "long" });
  const festivalHints = getFestivalHints(todayFestivals);
  const dharmikMessage = composeDharmikMessage({
    weekday,
    tithi,
    festivalHints
  });

  const responseData = {
    date,
    day,
    sunrise,
    sunset,
    moonrise,
    moonset,
    vikramSamvat,
    shakaSamvat,
    month,
    paksha,
    tithi,
    festivalList: todayFestivals,
    upcomingFestivals,
    jayantiList,
    dharmikMessage
  };

  /* =====================================================
     🔸 CACHE SAVE (NEW)
     ===================================================== */
  writeCache(responseData);
  /* ===================================================== */

  res.json(responseData);
});
/* =====================================================
   🔱 BHAKTI ASK SYSTEM – PART 2 (API ROUTE)
   ===================================================== */
app.use(express.json());

// ✅ GET route (for browser testing)
app.get("/api/ask-bhakti", (req, res) => {
  const deity = req.query.deity || "";
  const key = ALIAS_MAP[normalizeDeityName(deity)];
  if (key && mantrasData[key]) {
    return res.json({
      deity: key,
      mantras: mantrasData[key].mantras
    });
  }
  return res.status(404).json({ error: "देवता नहीं मिला" });
});

// ✅ POST route (for frontend integration)
app.post("/api/ask-bhakti", async (req, res) => {
  try {
    const deityRaw = req.body?.deity || "";
    const deity = deityRaw.trim();

    if (!deity) {
      return res.status(400).json({ error: "देवता का नाम आवश्यक है" });
    }

    // 1. Cache check
    const cachedBhakti = readBhaktiCache(deity);
    if (cachedBhakti) {
      return res.json({ fromCache: true, ...cachedBhakti });
    }

    // 2. JSON lookup (mantra only, normalized)
const key = ALIAS_MAP[normalizeDeityName(deity)];

if (key && mantrasData[key] && Array.isArray(mantrasData[key].mantras)) {
  const mantras = mantrasData[key].mantras.filter(m => m && m.text);

  const response = {
    deity: key,
    available: {
      mantra: mantras.length > 0,
      aarti: false,
      poojaVidhi: false,
      chalisa: false,
      stotra: false
    },
    content: {
      mantra: mantras,
      aarti: "",
      poojaVidhi: null,
      chalisa: "",
      stotra: []
    },
    sourceNote: "पारंपरिक मंत्र (स्थिर डेटा)"
  };

  writeBhaktiCache(deity, response);
  return res.json({ fromCache: false, ...response });
}

    // 3. Fallback empty response
    const emptyResponse = getEmptyBhaktiResponse(deity);
    writeBhaktiCache(deity, emptyResponse);
    return res.json({ fromCache: false, ...emptyResponse });

  } catch (e) {
    console.error("Ask Bhakti API error:", e.message);
    return res.status(500).json({ error: "Bhakti Ask System error" });
  }
});

/* =====================================================
   🔱 BHAKTI ASK SYSTEM – PART 2 END
   ===================================================== */

app.listen(PORT, () => {
  console.log(`Bhakti Panchang backend running on port ${PORT}`);
});
