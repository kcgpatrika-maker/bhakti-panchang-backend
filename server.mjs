import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import { vratTyoharMap } from "./data/vratTyohar.js";
import { bharatDiwasMap } from "./data/bharatDiwas.js";

const app = express();
app.use(cors());

/* =========================
   भारतीय दिवस / जयंती मैप
   ========================= */
const indianDayMap = {
  "01-26": ["🇮🇳 गणतंत्र दिवस"],
  "08-15": ["🇮🇳 स्वतंत्रता दिवस"],
  "10-02": ["गांधी जयंती"],
  "01-23": ["नेताजी सुभाष चंद्र बोस जयंती"],
  "04-14": ["डॉ. भीमराव अंबेडकर जयंती"],
  "09-05": ["शिक्षक दिवस"],
};

/* =========================
   वार (Day names)
   ========================= */
const vaarMap = [
  "रविवार",
  "सोमवार",
  "मंगलवार",
  "बुधवार",
  "गुरुवार",
  "शुक्रवार",
  "शनिवार",
];

/* =========================
   मास + तिथि (Base Logic)
   NOTE: यह production-safe fallback है
   ========================= */
function getTithiPaksha(date) {
  // SIMPLE LOGIC (stable fallback)
  const day = date.getDate();

  const paksha = day <= 15 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";
  const tithiNumber = day <= 15 ? day : day - 15;

  const tithiNames = [
    "प्रतिपदा",
    "द्वितीया",
    "तृतीया",
    "चतुर्थी",
    "पंचमी",
    "षष्ठी",
    "सप्तमी",
    "अष्टमी",
    "नवमी",
    "दशमी",
    "एकादशी",
    "द्वादशी",
    "त्रयोदशी",
    "चतुर्दशी",
    "अमावस्या / पूर्णिमा",
  ];

  return `${paksha} ${tithiNames[tithiNumber - 1]}`;
}

function getMaas(month) {
  const maasMap = [
    "चैत्र",
    "वैशाख",
    "ज्येष्ठ",
    "आषाढ़",
    "श्रावण",
    "भाद्रपद",
    "आश्विन",
    "कार्तिक",
    "मार्गशीर्ष",
    "पौष",
    "माघ",
    "फाल्गुन",
  ];
  return maasMap[month] || "";
}

/* =========================
   Panchang API (Stable)
   ========================= */
app.get("/api/panchang", (req, res) => {
  const today = new Date();
  
  // Date formatting
  const months = ["जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];
  const dateStr = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  const dayStr = today.toLocaleDateString('hi-IN', { weekday: 'long' });

  // Fallback logic
  const sunrise = "आज उपलब्ध नहीं";
  const sunset = "आज उपलब्ध नहीं";
  const moonrise = "आज उपलब्ध नहीं";
  const moonset = "आज उपलब्ध नहीं";

  const vikramSamvat = 2082; // example, dynamic calculation possible
  const shakSamvat = 1947;   // example

  const masa = "फाल्गुन"; // placeholder, dynamic calculation possible
  const paksha_tithi = "कृष्ण पक्ष पंचमी"; // placeholder

  // Vrat / Tyohar
  const dateKey = `${today.getDate()}-${today.getMonth()+1}`; // e.g., "20-12"
  let vratTyohar = [];
  if (vratTyoharMap[dateKey]) vratTyohar.push(vratTyoharMap[dateKey]);
  if (bharatDiwasMap[dateKey]) vratTyohar.push(bharatDiwasMap[dateKey]);
  if (vratTyohar.length === 0) vratTyohar.push("कोई विशेष व्रत नहीं");

  // Ask slides placeholder
  const ask_slides = [
    { title: "आरती", content: "आरती का विवरण..." },
    { title: "चालीसा", content: "चालीसा का विवरण..." },
    { title: "पूजा विधि", content: "पूजा विधि का विवरण..." },
    { title: "मंत्र", content: "मंत्र का विवरण..." },
    { title: "कथा", content: "कथा का विवरण..." }
  ];

  const panchang = {
    date: dateStr,
    day: dayStr,
    sunrise,
    sunset,
    moonrise,
    moonset,
    vikram_samvat: vikramSamvat,
    shak_samvat: shakSamvat,
    masa,
    paksha_tithi,
    vrat_tyohar: vratTyohar,
    ask_slides
  };

  res.json(panchang);
});
/* =========================
   Ask Bhakti API (QuickNews style)
   ========================= */
app.get("/api/ask-bhakti", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.json({ success: false, message: "Query missing" });
  }

  try {
    const searchUrl = `https://hi.wikipedia.org/wiki/${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    const html = await response.text();

    const $ = cheerio.load(html);

    let text = "";
    $("#mw-content-text p").each((i, el) => {
      if (i < 3) {
        text += $(el).text().trim() + "\n\n";
      }
    });

    if (!text) {
      text = "इस विषय की जानकारी नीचे दिए गए स्रोत पर उपलब्ध है।";
    }

    res.json({
      success: true,
      title: query,
      preview: text.trim(),
      source: searchUrl
    });

  } catch (err) {
    res.json({
      success: false,
      message: "डेटा लोड नहीं हो पाया",
      source: null
    });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Bhakti Panchang backend running");
});
