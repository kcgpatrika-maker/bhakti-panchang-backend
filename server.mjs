import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

// 🔹 Static helpers
const WEEK_DAYS = [
  "रविवार","सोमवार","मंगलवार",
  "बुधवार","गुरुवार","शुक्रवार","शनिवार"
];

const HINDI_MONTHS = [
  "चैत्र","वैशाख","ज्येष्ठ","आषाढ़",
  "श्रावण","भाद्रपद","आश्विन","कार्तिक",
  "मार्गशीर्ष","पौष","माघ","फाल्गुन"
];

const TITHI_LIST = [
  "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी",
  "षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी",
  "एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","अमावस्या"
];

// 🔹 Limited festival map (extend later)
const FESTIVAL_MAP = {
  "01-14": ["मकर संक्रांति"],
  "02-19": ["महाशिवरात्रि"],
  "08-19": ["रक्षाबंधन"],
  "10-12": ["दशहरा"],
  "11-01": ["दीपावली"]
};

app.get("/api/panchang", (req, res) => {

  const today = new Date();

  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  const vaar = WEEK_DAYS[today.getDay()];
  const maas = HINDI_MONTHS[today.getMonth() % 12];

  // 🔹 पक्ष निर्धारण
  const paksha = today.getDate() <= 15 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";

  // 🔹 तिथि (temporary cycle)
  const tithiName = TITHI_LIST[today.getDate() % TITHI_LIST.length];
  const tithi = `${paksha} ${tithiName}`;

  const key = `${mm}-${dd}`;
  const vratTyohar = FESTIVAL_MAP[key] || [];

  res.json({
    date: `${dd}-${mm}-${yyyy}`,
    vaar,
    vikramSamvat: "2082",
    shakSamvat: "1947 (विश्वावसु)",
    maas,
    tithi,
    sunMoon: {
      sunrise: "--",
      sunset: "--",
      moonrise: "--",
      moonset: "--"
    },
    vratTyohar
  });
});

// 🔹 Render port binding
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Bhakti Panchang backend running");
});
