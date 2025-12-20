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
   Ask Bhakti API (Wikipedia summary)
   ========================= */
app.get("/api/ask-bhakti", async (req, res) => {
  const { q, type } = req.query;

  if (!q || !type) {
    return res.json({
      success: false,
      message: "Query या type missing"
    });
  }

  try {
    // Wikipedia REST API (clean + free)
    const title = `${q} ${type}`;
    const apiUrl = `https://hi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    let content = "";

    if (data.extract && data.extract.length > 50) {
      content = data.extract;
    } else {
      // fallback: famous default content
      if (type === "मंत्र") {
        content = "ॐ नमः शिवाय ॥\nॐ नमः शिवाय ॥\nॐ नमः शिवाय ॥";
      } else if (type === "आरती") {
        content = "ॐ जय शिव ओंकारा...\n(प्रसिद्ध शिव आरती)";
      } else if (type === "चालीसा") {
        content = "जय गणेश गिरिजा सुवन...\n(प्रारंभिक चौपाइयाँ)";
      } else {
        content = "इस विषय की जानकारी उपलब्ध है, नीचे दिए गए स्रोत पर पढ़ें।";
      }
    }

    res.json({
      success: true,
      title: title,
      content: content,
      more_url: data.content_urls?.desktop?.page || apiUrl,
      source: "Wikipedia"
    });

  } catch (err) {
    res.json({
      success: false,
      message: "कंटेंट लोड नहीं हो पाया",
      source: null
    });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Bhakti Panchang backend running");
});
