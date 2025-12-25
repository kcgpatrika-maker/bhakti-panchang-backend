import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

// JSON फाइल को पढ़कर BHAKTI_DB बनाना
const __dirname = path.resolve();
const bhaktiData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data/bhakti-mantra-aarti.json"), "utf8")
);
const BHAKTI_DB = bhaktiData;

const app = express();
app.use(cors());
app.use(express.json());
/* =========================
   BASIC HELPERS
========================= */
function pad(n) {
  return n.toString().padStart(2, "0");
}

function getHindiMonth(i) {
  return [
    "जनवरी","फरवरी","मार्च","अप्रैल","मई","जून",
    "जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"
  ][i];
}

/* =========================
   TITHI + MAAS (AUTO TABLE)
   (यह कैल्कुलेशन नहीं, भरोसेमंद पंचांग-टेबल है)
========================= */
const tithiTable2025 = {
  "12-23": { masa: "पौष", tithi: "शुक्ल पक्ष तृतीया" },
  "12-24": { masa: "पौष", tithi: "शुक्ल पक्ष चतुर्थी" }
  // आगे जरूरत अनुसार जोड़ते जायेंगे
};

/* =========================
   PANCHANG CORE
========================= */
function getPanchang() {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const dd = pad(now.getDate());
  const mm = pad(now.getMonth() + 1);
  const yyyy = now.getFullYear();

  const key = `${mm}-${dd}`;

  const tithiInfo = tithiTable2025[key] || {
    masa: "पौष",
    tithi: "जानकारी उपलब्ध नहीं"
  };

  return {
    date: `${dd} ${getHindiMonth(now.getMonth())} ${yyyy}`,
    day: now.toLocaleDateString("hi-IN", { weekday: "long" }),
    sunMoon: {
      sunrise: "06:55",
      sunset: "17:42",
      moonrise: "19:10",
      moonset: "07:30"
    },
    vikram_samvat: 2082,
    shak_samvat: 1947,
    masa: tithiInfo.masa,
    paksha_tithi: tithiInfo.tithi,
    festivalList: ["कोई विशेष व्रत नहीं"]
  };
}

/* =========================
   PANCHANG API
========================= */
app.get("/api/panchang", (req, res) => {
  try {
    res.json({
      success: true,
      data: getPanchang()
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

/* =================================
   ALL-IN-ONE ASK-BHAKTI API
================================= */
app.get("/api/ask-bhakti-all", (req, res) => {
  const q = (req.query.q || "").trim();

  if (!q || !BHAKTI_DB[q]) {
    return res.json({
      success: false,
      message: "डेटा उपलब्ध नहीं"
    });
  }

  res.json({
    success: true,
    deity: q,
    data: BHAKTI_DB[q]
  });
});

/* =========================
   ROOT CHECK
========================= */
app.get("/", (req, res) => {
  res.send("Panchang Backend Running");
});

/* =================================
   SERVER START
================================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`Ask-Bhakti backend running on port ${PORT}`)
);
