import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { bharatDiwasMap } from "./data/bharatDiwas.js";
import { composeDharmikMessage } from "./data/messageComposer.js";
import { resolveCanonicalFestivals, getFestivalHints } from "./data/festivalResolver.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const URL = "https://www.srimandir.com/hi/panchang";

const sankalpPath = path.join(__dirname, "data", "sankalp.txt");
let SANKALP_TEXT = "";

try {
  SANKALP_TEXT = fs.readFileSync(sankalpPath, "utf-8").trim();
} catch (e) {
  console.error("❌ sankalp.txt load error:", e.message);
  SANKALP_TEXT = "";
}
/* =====================================================
   🔸 CACHE SETUP START
   ===================================================== */
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

    writeCache(responseData);
    res.json(responseData);
});
/* =====================================================
   🔱 BHAKTI ASK SYSTEM – HELPERS
   ===================================================== */

// mantras.json
const mantrasPath = path.join(__dirname, "data", "mantras.json");
let mantrasData = {};
try {
  mantrasData = JSON.parse(fs.readFileSync(mantrasPath, "utf-8"));
} catch (e) {
  console.error("❌ mantras.json load error:", e.message);
  mantrasData = {};
}

// aartis.json
const aartisPath = path.join(__dirname, "data", "aartis.json");
let aartisData = {};
try {
  aartisData = JSON.parse(fs.readFileSync(aartisPath, "utf-8"));
} catch (e) {
  console.error("❌ aartis.json load error:", e.message);
  aartisData = {};
}

// poojaVidhi.json
const poojaVidhiPath = path.join(__dirname, "data", "poojaVidhi.json");
let poojaVidhiData = {};
try { poojaVidhiData = JSON.parse(fs.readFileSync(poojaVidhiPath, "utf-8")); }
catch (e) { console.error("❌ poojaVidhi.json load error:", e.message); poojaVidhiData = {}; }

// chalisa.json
const chalisaPath = path.join(__dirname, "data", "chalisa.json");
let chalisaData = {};
try {
  chalisaData = JSON.parse(fs.readFileSync(chalisaPath, "utf-8"));
} catch (e) {
  console.error("❌ chalisa.json load error:", e.message);
  chalisaData = {};
}

// normalize (Hindi + English)
function normalizeDeityName(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]+/g, "").trim();
}

// minimal internal synonyms (aliases न हों तब भी हिन्दी/English काम करें)
const INTERNAL_SYNONYMS = {
  ganesh: ["गणेश", "ganesha", "vinayak", "vinayaka", "ganapati", "गणपति"],
  shiv: ["शिव", "mahadev", "bholenath", "shankar", "शंकर"],
  hanuman: ["हनुमान", "bajrangbali", "maruti", "pavanputra", "pawanputra"],
  krishna: ["कृष्ण", "कन्हैया", "govind", "gopal", "श्याम"],
  ram: ["राम", "raghunath", "sitaram", "रघुनाथ"],
  durga: ["दुर्गा", "parvati", "mahakali", "अम्बा", "अम्बिका"],
  lakshmi: ["लक्ष्मी", "mahalakshmi", "श्री"],
  saraswati: ["सरस्वती", "vidyadevi", "शारदा"],
  vishnu: ["विष्णु", "narayan", "नारायण"],
  shani: ["शनि", "shanidev"],
};

// alias maps (दोनों datasets अलग‑अलग रखें)
const ALIAS_MANTRA = {};
const ALIAS_AARTI = {};
function addAlias(map, key, alias) {
  if (alias) map[normalizeDeityName(alias)] = key;
}

// mantras.json → keys + aliases
Object.keys(mantrasData).forEach((key) => {
  addAlias(ALIAS_MANTRA, key, key);
  (mantrasData[key].aliases || []).forEach((a) => addAlias(ALIAS_MANTRA, key, a));
});

// aartis.json → keys + aliases (यदि मौजूद)
Object.keys(aartisData).forEach((key) => {
  addAlias(ALIAS_AARTI, key, key);
  (aartisData[key].aliases || []).forEach((a) => addAlias(ALIAS_AARTI, key, a));
});

// internal synonyms दोनों maps में जोड़ें
Object.entries(INTERNAL_SYNONYMS).forEach(([canonical, list]) => {
  const mantraTarget =
    Object.keys(mantrasData).find((k) => normalizeDeityName(k) === normalizeDeityName(canonical));
  const aartiTarget =
    Object.keys(aartisData).find((k) => normalizeDeityName(k) === normalizeDeityName(canonical));
  list.forEach((a) => {
    if (mantraTarget) addAlias(ALIAS_MANTRA, mantraTarget, a);
    if (aartiTarget) addAlias(ALIAS_AARTI, aartiTarget, a);
  });
});

/* -----------------------------------------------------
   Merge‑aware resolve: दोनों datasets से key पकड़ें
   ----------------------------------------------------- */
function resolveKeys(deityRaw = "") {
  const norm = normalizeDeityName(deityRaw);

  const mantraKey = MANTRA_ALIAS[norm] || Object.keys(mantrasData).find(k => normalize(k) === norm) || null;
  const aartiKey = AARTI_ALIAS[norm] || Object.keys(aartisData).find(k => normalize(k) === norm) || null;
  const chalisaKey = normalize(name);
  const poojaKey = normalize(name);
  const canonical = mantraKey || aartiKey || chalisaKey || poojaKey;
  return { canonical, mantraKey, aartiKey, chalisaKey, poojaKey };
}

/* -----------------------------------------------------
   Cache helpers (Bhakti only)
   ----------------------------------------------------- */
const BHAKTI_CACHE_DIR = path.join(__dirname, "cache", "bhakti");
if (!fs.existsSync(BHAKTI_CACHE_DIR)) fs.mkdirSync(BHAKTI_CACHE_DIR, { recursive: true });

function getBhaktiCacheFile(deity) {
  const { canonical } = resolveKeys(deity);
  const key = canonical || "unknown";
  return path.join(BHAKTI_CACHE_DIR, `${key}.json`);
}
function readBhaktiCache(deity) {
  try {
    const file = getBhaktiCacheFile(deity);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) {
    console.error("Bhakti cache read error:", e.message);
  }
  return null;
}
function writeBhaktiCache(deity, data) {
  try {
    fs.writeFileSync(getBhaktiCacheFile(deity), JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Bhakti cache write error:", e.message);
  }
}
function getEmptyResponse(name) {
  return {
    deity: name,
    available: { mantra: false, aarti: false, poojaVidhi: false, chalisa: false, stotra: false },
    content: { mantra: [], aarti: [], poojaVidhi: null, chalisa: "", stotra: [] },
    sourceNote: "डेटा उपलब्ध नहीं है",
  };
}

/* =====================================================
   🔱 BHAKTI ASK SYSTEM – API (Ask Section Only)
   ===================================================== */

// GET (AskNews.jsx uses this)
app.get("/api/ask-bhakti", (req, res) => {
  try {
    const deity = (req.query.deity || "").trim();
    if (!deity) {
      return res.status(400).json({ error: "देवी/देवता का नाम आवश्यक है" });
    }

    const { canonical, mantraKey, aartiKey } = resolveKeys(deity);
    const poojaKey = canonical;

    if (!canonical) {
      return res.status(404).json({ error: "देवी/देवता/त्योहार नहीं मिला" });
    }

    // मंत्र (UNCHANGED)
    const mantrasArr = Array.isArray(mantrasData[mantraKey]?.mantras)
      ? mantrasData[mantraKey].mantras
      : [];

    // आरती (UNCHANGED)
    const aartisArr = normalizeAartiItems(
      Array.isArray(aartisData[aartiKey]?.aartis)
        ? aartisData[aartiKey].aartis
        : []
    );

    // पूजा विधि (FIXED)
    const sankalpItem = { type: "sankalp", text: SANKALP_TEXT };
    const poojaEntries = Array.isArray(poojaVidhiData[poojaKey])
      ? poojaVidhiData[poojaKey]
      : [];
    const poojaArr = [sankalpItem, ...poojaEntries];
    
    // 🔴 CHALISA LOGIC (FINAL)
    const chalisaArr = chalisaData[canonical]
      ? [{ pdf: chalisaData[canonical].pdf, source: chalisaData[canonical].source }]
      : [];

   
    return res.json({
      deity: canonical,
      available: {
        mantra: mantrasArr.length > 0,
        aarti: aartisArr.length > 0,
        poojaVidhi: poojaArr.length > 1, // sankalp + pdf
        chalisa: chalisaArr.length > 0,
        stotra: false
      },
      content: {
        mantra: mantrasArr,
        aarti: aartisArr,
        poojaVidhi: poojaArr,
        chalisa: chalisaArr,
        stotra: [],
      },
      sourceNote: "पारंपरिक स्थिर भक्ति डेटा",
    });
  } catch (e) {
    console.error("Ask Bhakti API error:", e.message);
    return res.status(500).json({ error: "Bhakti Ask System error" });
  }
});

// POST (cache enabled)
app.post("/api/ask-bhakti", (req, res) => {
  try {
    const deity = (req.body?.deity || "").trim();
    if (!deity) {
      return res.status(400).json({ error: "देवी/देवता का नाम आवश्यक है" });
    }

    const cached = readBhaktiCache(deity);
    if (cached) return res.json({ fromCache: true, ...cached });

    const { canonical, mantraKey, aartiKey } = resolveKeys(deity);
    const poojaKey = canonical;

    if (!canonical) {
      const empty = getEmptyBhaktiResponse(deity);
      writeBhaktiCache(deity, empty);
      return res.json({ fromCache: false, ...empty });
    }

    // मंत्र (UNCHANGED)
    const mantrasArr = Array.isArray(mantrasData[mantraKey]?.mantras)
      ? mantrasData[mantraKey].mantras
      : [];

    // आरती (UNCHANGED)
    const aartisArr = normalizeAartiItems(
      Array.isArray(aartisData[aartiKey]?.aartis)
        ? aartisData[aartiKey].aartis
        : []
    );

    // पूजा विधि (FIXED)
    const sankalpItem = { type: "sankalp", text: SANKALP_TEXT };
    const poojaEntries = Array.isArray(poojaVidhiData[poojaKey])
      ? poojaVidhiData[poojaKey]
      : [];
    const poojaArr = [sankalpItem, ...poojaEntries];
    
    // 🔴 CHALISA LOGIC (FINAL)
    const chalisaArr = chalisaData[canonical]
      ? [{ pdf: chalisaData[canonical].pdf, source: chalisaData[canonical].source }]
      : [];

    
    const response = {
      deity: canonical,
      available: {
        mantra: mantrasArr.length > 0,
        aarti: aartisArr.length > 0,
        poojaVidhi: poojaArr.length > 1,
        chalisa: chalisaArr.length > 0,
        stotra: false,
      },
      content: {
        mantra: mantrasArr,
        aarti: aartisArr,
        poojaVidhi: poojaArr,
        chalisa: chalisaArr,
        stotra: [],
      },
      sourceNote: "पारंपरिक स्थिर भक्ति डेटा",
    };

    writeBhaktiCache(deity, response);
    return res.json({ fromCache: false, ...response });
  } catch (e) {
    console.error("Ask Bhakti API error:", e.message);
    return res.status(500).json({ error: "Bhakti Ask System error" });
  }
});

app.listen(PORT, () => {
  console.log(`Bhakti Panchang backend running on port ${PORT}`);
});
