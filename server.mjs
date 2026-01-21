import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { bharatDiwasMap } from "./data/bharatDiwas.js";
import { composeDharmikMessage } from "./data/messageComposer.js";
import { resolveCanonicalFestivals, getFestivalHints } from "./data/festivalResolver.js";
import aartiData from "./data/aarti.json" assert { type: "json" };

const app = express();
app.use(cors());
app.use(express.json());

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
const BHAKTI_CACHE_DIR = path.join(__dirname, "cache", "bhakti");
if (!fs.existsSync(BHAKTI_CACHE_DIR)) fs.mkdirSync(BHAKTI_CACHE_DIR, { recursive: true });

// Load mantras.json
const mantrasPath = path.join(__dirname, "data", "mantras.json");
let mantrasData = Object.create(null);
try {
  const raw = fs.readFileSync(mantrasPath, { encoding: "utf-8" });
  mantrasData = JSON.parse(raw);
} catch (e) {
  console.error("❌ mantras.json load error:", e.message);
  mantrasData = Object.create(null);
}

// Build alias map
const ALIAS_MAP = Object.create(null);
function normalizeDeityName(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]+/g, "").trim();
}
Object.keys(mantrasData || {}).forEach(key => {
  if (!key) return;
  const entry = mantrasData[key] || {};
  ALIAS_MAP[normalizeDeityName(key)] = key;
  if (Array.isArray(entry.aliases)) entry.aliases.forEach(a => { if(a) ALIAS_MAP[normalizeDeityName(a)] = key; });
});

// Bhakti cache helpers
function getBhaktiCacheFile(deity) {
  let key = ALIAS_MAP[normalizeDeityName(deity)];
  if (!key) key = Object.keys(mantrasData).find(k => normalizeDeityName(k) === normalizeDeityName(deity));
  return path.join(BHAKTI_CACHE_DIR, `${key}.json`);
}
function readBhaktiCache(deity) {
  try { const file = getBhaktiCacheFile(deity); if(fs.existsSync(file)) return JSON.parse(fs.readFileSync(file,"utf-8")); } 
  catch(e){ console.error("Bhakti cache read error:", e.message); }
  return null;
}
function writeBhaktiCache(deity, data) {
  try { fs.writeFileSync(getBhaktiCacheFile(deity), JSON.stringify(data,null,2),"utf-8"); } 
  catch(e){ console.error("Bhakti cache write error:", e.message); }
}
function getEmptyBhaktiResponse(deity) {
  return {
    deity,
    available: { mantra:false,aarti:false,poojaVidhi:false,chalisa:false,stotra:false },
    content: { mantra:[], aarti:"", poojaVidhi:null, chalisa:"", stotra:[] },
    sourceNote: "डेटा उपलब्ध नहीं है"
  };
}
/* =====================================================
   🔱 BHAKТИ ASK SYSTEM – API
   ===================================================== */
// GET route (testing in browser)
app.get("/api/ask-bhakti", (req,res) => {
  const deityRaw = req.query.deity || "";
  const norm = normalizeDeityName(deityRaw);
  const key = ALIAS_MAP[norm];
  if(key && mantrasData[key] && Array.isArray(mantrasData[key].mantras)){
    return res.json({ deity:key, available:{mantra:true}, content:{mantra:mantrasData[key].mantras} });
  }
  return res.status(404).json({ error:"देवता नहीं मिला", debug:{ input:deityRaw, normalized:norm } });
});

// POST route (frontend integration)
app.post("/api/ask-bhakti", (req,res)=>{
  try{
    const deityRaw = req.body?.deity || "";
    const deity = deityRaw.trim();
    if(!deity) return res.status(400).json({ error:"देवता का नाम आवश्यक है" });

    const cached = readBhaktiCache(deity);
    if(cached) return res.json({ fromCache:true, ...cached });

    const key = ALIAS_MAP[normalizeDeityName(deity)];
    if(key && mantrasData[key] && Array.isArray(mantrasData[key].mantras)){
      const mantras = mantrasData[key].mantras.filter(m => m);
      const response = {
        deity:key,
        available:{ mantra:mantras.length>0, aarti:false, poojaVidhi:false, chalisa:false, stotra:false },
        content:{ mantra:mantras, aarti:"", poojaVidhi:null, chalisa:"", stotra:[] },
        sourceNote:"पारंपरिक मंत्र (स्थिर डेटा)"
      };
      writeBhaktiCache(deity,response);
      return res.json({ fromCache:false, ...response });
    }

    const emptyResp = getEmptyBhaktiResponse(deity);
    writeBhaktiCache(deity, emptyResp);
    return res.json({ fromCache:false, ...emptyResp });

  } catch(e){
    console.error("Ask Bhakti API error:", e.message);
    return res.status(500).json({ error:"Bhakti Ask System error" });
  }
});

app.listen(PORT, () => {
  console.log(`Bhakti Panchang backend running on port ${PORT}`);
});
