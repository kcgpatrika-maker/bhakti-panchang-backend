import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import { bharatDiwasMap } from "./data/bharatDiwas.js";
import { composeDharmikMessage } from "./data/messageComposer.js";
import { resolveCanonicalFestivals, getFestivalHints } from "/data/festivalResolver.js";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;
const URL = "https://www.srimandir.com/hi/panchang";

async function fetchRaw() {
  const res = await fetch(URL);
  const html = await res.text();
  const $ = cheerio.load(html);
  const nextData = $("#__NEXT_DATA__").html();
  if (!nextData) return {};
  const parsed = JSON.parse(nextData);
  return parsed?.props?.pageProps || {};
}

function refineData(raw) {
  if (!raw) return {};

  // Panchang main info
  const refined = {
    date: raw?.panchangOne?.dateText || "",        // "15 जनवरी 2026"
    day: raw?.panchangOne?.dayName || "",          // "गुरुवार"
    sunrise: raw?.sunrise || "",
    sunset: raw?.sunset || "",
    moonrise: raw?.moonrise || "",
    moonset: raw?.moonset || "",
    vikramSamvat: raw?.vikramSamvat || "",
    shakaSamvat: raw?.shakaSamvat || "",
    month: raw?.monthName || "",
    paksha: raw?.paksha || "",
    tithi: raw?.tithi || "",
    // Keep full raw for future use
    fullData: raw
  };

  return refined;
}

app.get("/api/panchang", async (req, res) => {
  const raw = await fetchRaw();

  // तारीख और वार निकालना
  const date = raw?.panchangState?.lunarData?.headerTitle || "";
  const line1 = raw?.panchangState?.lunarData?.line1 || "";
  const day = line1.split(",").pop()?.trim() || "";

  // सूर्योदय, सूर्यास्त, चंद्रोदय, चंद्रास्त
  const sunMoonList = raw?.panchangState?.sunMoonInfo?.sunMoonList || []; 
  const sunrise = sunMoonList.find(item => item.header === "सूर्योदय")?.time || ""; 
  const sunset = sunMoonList.find(item => item.header === "सूर्यास्त")?.time || "";
  const moonrise = sunMoonList.find(item => item.header === "चंद्रोदय")?.time || ""; 
  const moonset = sunMoonList.find(item => item.header === "चन्द्रास्त")?.time || "";
      // विक्रम संवत और शक संवत
  const panchangTwo = raw?.panchangState?.panchangTwo || [];
  const vikramSamvat = panchangTwo.flat().find(item => item.title === "विक्रम संवत")?.description || "";
  const shakaSamvat = panchangTwo.flat().find(item => item.title === "शक संवत")?.description || "";

  // मास, पक्ष और तिथि
  const month = raw?.panchangState?.lunarData?.line2 || "";
  const tithiArr = raw?.panchangState?.panchangOne?.panchangOne || [];
  const tithiObj = tithiArr.find(item => item.title === "तिथि");
  const tithiFull = tithiObj?.description || "";

  let paksha = "";
  let tithi = "";
  if (tithiFull.includes(" ")) {
    const parts = tithiFull.split(" ");
    paksha = parts[0] + " " + parts[1];   // "कृष्ण पक्ष"
    tithi = parts.slice(2).join(" ");     // "द्वादशी"
  } else {
    tithi = tithiFull;
  }

  // आज के व्रत-त्योहार (line5 से) 
  const todayFestivalsLine = raw?.panchangState?.lunarData?.line5 || ""; 
  const todayFestivalsSrimandir = todayFestivalsLine 
    ? todayFestivalsLine.split(",").map(f => f.trim()) 
    : [];
  // Canonical festivals (rule-based) + merge with Srimandir 
  const todayFestivals = resolveCanonicalFestivals({ 
    tithi, paksha, month, todayFestivals: todayFestivalsSrimandir
  });
  // पूरे माह के upcoming festivals (festivals.festivals से) 
  const upcomingFestivals = Array.isArray(raw?.panchangState?.festivals?.festivals) 
    ? raw.panchangState.festivals.festivals.map(f => ({ 
      date: f.date, 
      festival: f.festival
    })) 
    : []; 
  // 🔔 प्रमुख दिवस-जयंती (लोकल bharatDiwasMap से)
  const todayKey = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" }).replace(/\//g,"-"); 
  const jayantiList = bharatDiwasMap[todayKey] || []; 
  // 📜 आज का धार्मिक संदेश (लोकल dharmikMessages से) 
  const weekday = new Date().toLocaleDateString("hi-IN", { weekday: "long" });
  const festivalHints = getFestivalHints(todayFestivals);
 const dharmikMessage = composeDharmikMessage({ 
   weekday, 
   tithi, 
   festivalHints
     });
  // फ्रंटएंड को भेजना 
  res.json({ 
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
  });
});

app.listen(PORT, () => { 
  console.log(`Bhakti Panchang backend running on port ${PORT}`);
});
