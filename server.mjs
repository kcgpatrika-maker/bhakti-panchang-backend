import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());

/* ===============================
   FESTIVAL DATA LOAD
================================ */
const festivalDataPath = path.resolve("./data/festivals.json");
let festivalData = { bharatDiwasMap: {}, vratTyoharMap: {} };

try {
  festivalData = JSON.parse(fs.readFileSync(festivalDataPath, "utf-8"));
} catch (e) {
  console.error("festivals.json load error:", e);
}

/* ===============================
   HELPERS
================================ */
const pad = n => n.toString().padStart(2, "0");

/* ===============================
   PANCHANG API
================================ */
app.get("/api/panchang", (req, res) => {
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const date = `${today.getDate()} दिसंबर ${today.getFullYear()}`;
  const day = today.toLocaleDateString("hi-IN", { weekday: "long" });

  const vikram_samvat = 2082;
  const shak_samvat = 1947;

  const masa = "पौष";
  const paksha_tithi = "शुक्ल पक्ष द्वितीया";

  const mmdd = `${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  let festivalList = [];

  if (festivalData.bharatDiwasMap?.[mmdd])
    festivalList.push(...festivalData.bharatDiwasMap[mmdd]);

  if (festivalData.vratTyoharMap?.[mmdd])
    festivalList.push(...festivalData.vratTyoharMap[mmdd]);

  if (!festivalList.length) festivalList.push("कोई विशेष व्रत नहीं");

  res.json({
    success: true,
    data: {
      date,
      day,
      sunMoon: {
        sunrise: "06:55",
        sunset: "17:42",
        moonrise: "19:10",
        moonset: "07:30"
      },
      vikram_samvat,
      shak_samvat,
      masa,
      paksha_tithi,
      festivalList
    }
  });
});

/* ===============================
   ASK-BHAKTI CORE DATABASE
   (Public-domain, curated)
================================ */
const BHAKTI_DB = {
  "शिव": {
    "मंत्र": {
      content: `ॐ नमः शिवाय।
यह पंचाक्षरी मंत्र भगवान शिव का सर्वाधिक प्रचलित मंत्र है।
इसका जप शांति, वैराग्य और आत्मशुद्धि प्रदान करता है।`,
      sources: [
        "https://www.sanskritdocuments.org",
        "https://kavitakosh.org"
      ]
    },
    "आरती": {
      content: `जय शिव ओंकारा, हर शिव ओंकारा।
ब्रह्मा विष्णु सदाशिव, अर्द्धांगी धारा॥`,
      sources: [
        "https://kavitakosh.org"
      ]
    },
    "पूजा विधि": {
      content: `1. स्नान कर स्वच्छ वस्त्र धारण करें
2. शिवलिंग पर जल, दूध अर्पित करें
3. बिल्वपत्र, धतूरा अर्पित करें
4. ॐ नमः शिवाय का जप करें
5. आरती करें`,
      sources: []
    },
    "चालीसा": {
      content: `जय गिरिजा पति दीन दयाला।
सदा करत सन्तन प्रतिपाला॥`,
      sources: [
        "https://kavitakosh.org"
      ],
      pdf: "https://archive.org/download/shiv_chalisa/shiv_chalisa.pdf"
    },
    "स्तोत्र": {
      content: `नागेन्द्रहाराय त्रिलोचनाय
भस्माङ्गरागाय महेश्वराय॥`,
      sources: [
        "https://www.sanskritdocuments.org"
      ],
      pdf: "https://archive.org/download/shiv_tandav_stotra/shiv_tandav_stotra.pdf"
    }
  }
};

/* ===============================
   ASK-BHAKTI API
================================ */
app.get("/api/ask-bhakti", (req, res) => {
  const { q, type } = req.query;

  if (!q || !type)
    return res.json({ success: false });

  const deity = BHAKTI_DB[q];
  if (!deity || !deity[type])
    return res.json({ success: false });

  res.json({
    success: true,
    title: q,
    content: deity[type].content,
    sources: deity[type].sources || [],
    pdf: deity[type].pdf || null
  });
});

/* ===============================
   SERVER START
================================ */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log("Server running on port", PORT)
);
