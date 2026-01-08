import express from "express";

const app = express();
const PORT = process.env.PORT || 10000;

/* ===============================
   BASIC APP
================================ */
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bhakti Panchang backend running");
});

/* ===============================
   CONSTANTS
================================ */
const LOCATION = "Jaipur, India";
const SUNRISE_FIXED = "12:18 pm";
const SUNSET_FIXED = "10:41 pm";

/* ===============================
   DATE HELPERS
================================ */
function getISTDate() {
  const now = new Date();
  return new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

function formatDateHindi(date) {
  return date.toLocaleDateString("hi-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long"
  });
}

/* ===============================
   SAMVAT (AUTO)
================================ */
function getSamvat(gDate) {
  const year = gDate.getFullYear();
  return {
    vikram: year + 57,
    shak: year - 78
  };
}

/* ===============================
   TITHI / PAKSHA / MAAS LOGIC
   (Sunrise-based simplified model)
================================ */
const TITHI_NAMES = [
  "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी",
  "षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी",
  "एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी"
];

const MAAS_LIST = [
  "चैत्र","वैशाख","ज्येष्ठ","आषाढ़",
  "श्रावण","भाद्रपद","आश्विन","कार्तिक",
  "मार्गशीर्ष","पौष","माघ","फाल्गुन"
];

function getPanchang(date) {
  // Reference Amavasya (fixed anchor)
  const ref = new Date("2025-03-29T00:00:00+05:30");
  const diffDays = Math.floor((date - ref) / (1000 * 60 * 60 * 24));

  const lunarDay = ((diffDays % 30) + 30) % 30;

  let paksha, tithi, maasIndex;

  if (lunarDay < 15) {
    paksha = "कृष्ण पक्ष";
    if (lunarDay === 14) tithi = "अमावस्या";
    else tithi = TITHI_NAMES[lunarDay];
    maasIndex = Math.floor(diffDays / 30) % 12;
  } else {
    paksha = "शुक्ल पक्ष";
    if (lunarDay === 29) tithi = "पूर्णिमा";
    else tithi = TITHI_NAMES[lunarDay - 15];
    maasIndex = Math.floor((diffDays + 15) / 30) % 12;
  }

  return {
    maas: MAAS_LIST[(maasIndex + 12) % 12],
    paksha,
    tithi
  };
}

/* ===============================
   API : DAILY PANCHANG
================================ */
app.get("/api/panchang", (req, res) => {
  try {
    const today = getISTDate();

    const samvat = getSamvat(today);
    const panchang = getPanchang(today);

    res.json({
      success: true,
      date: formatDateHindi(today),
      location: LOCATION,

      sunrise: SUNRISE_FIXED,
      sunset: SUNSET_FIXED,

      moonrise: "Auto model",
      moonset: "Auto model",

      vikram_samvat: samvat.vikram,
      shak_samvat: samvat.shak,

      maas: panchang.maas,
      paksha: panchang.paksha,
      tithi: panchang.tithi,

      vrat_tyohar: "कोई विशेष व्रत नहीं",
      source: "Sunrise-based Panchang (Simplified)"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* ===============================
   SERVER START
================================ */
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
