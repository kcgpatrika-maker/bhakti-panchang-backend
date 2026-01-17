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

app.listen(PORT, () => {
  console.log(`Bhakti Panchang backend running on port ${PORT}`);
});
