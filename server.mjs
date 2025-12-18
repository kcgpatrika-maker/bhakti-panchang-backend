import express from "express";
import cors from "cors";
import { vratTyoharMap } from "./data/vratTyohar.js";

const app = express();
app.use(cors());

/* ===== Helpers ===== */

function getTodayInfo() {
  const today = new Date();

  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  const vaarList = [
    "रविवार", "सोमवार", "मंगलवार",
    "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"
  ];

  return {
    date: `${dd}-${mm}-${yyyy}`,
    vaar: vaarList[today.getDay()],
    key: `${mm}-${dd}`
  };
}

/* ===== API ===== */

app.get("/api/panchang/today", (req, res) => {
  const today = getTodayInfo();

  res.json({
    date: today.date,
    vaar: today.vaar,

    vikramSamvat: "2082",
    shakSamvat: "1947",

    maas: "पौष",
    tithi: "कृष्ण पक्ष त्रयोदशी",

    sunMoon: {
      sunrise: "--",
      sunset: "--",
      moonrise: "--",
      moonset: "--"
    },

    vratTyohar: vratTyoharMap[today.key] || []
  });
});

/* ===== Server Start ===== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Bhakti Panchang Backend running on port", PORT);
});
