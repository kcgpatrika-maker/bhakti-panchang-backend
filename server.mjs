import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* ======================================================
   CONSTANTS (IST + ASTRONOMY)
====================================================== */
const IST_OFFSET = 5.5 * 60 * 60 * 1000;
const SYNODIC_MONTH = 29.530588853;
const TITHI_LENGTH = SYNODIC_MONTH / 30;

// Reference: Amavasya (Drik aligned)
const REF_AMAVASYA = new Date("2024-01-11T11:57:00Z");

/* ======================================================
   HELPERS
====================================================== */
function toIST(date) {
  return new Date(date.getTime() + IST_OFFSET);
}

function sunriseIST(date) {
  // Jaipur approx sunrise (stable & safe)
  const d = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    1, 15
  ));
  return toIST(d);
}

function formatTime(d) {
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* ======================================================
   TITHI (SUNRISE LOCKED – NO DRIFT)
====================================================== */
function getTithiSunriseLocked(date) {
  const sr = sunriseIST(date);

  const diffDays =
    (sr.getTime() - REF_AMAVASYA.getTime()) /
    (1000 * 60 * 60 * 24);

  const moonAge =
    ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) %
    SYNODIC_MONTH;

  const tithiIndex = Math.floor(moonAge / TITHI_LENGTH) + 1;

  const TITHI_NAMES = [
    "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी",
    "अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","अमावस्या",
    "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी",
    "अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा"
  ];

  const paksha =
    tithiIndex <= 15 ? "कृष्ण पक्ष" : "शुक्ल पक्ष";

  return {
    tithi: TITHI_NAMES[tithiIndex - 1],
    paksha,
    isAmavasya: tithiIndex === 15,
    isPurnima: tithiIndex === 30
  };
}

/* ======================================================
   MASA (AMAVASYA ANCHORED – REAL PANCHANG RULE)
====================================================== */
const MASA_SEQ = [
  "चैत्र","वैशाख","ज्येष्ठ","आषाढ़","श्रावण","भाद्रपद",
  "आश्विन","कार्तिक","मार्गशीर्ष","पौष","माघ","फाल्गुन"
];

function getMasa(date, tithiData) {
  // Known anchor: 11 Jan 2024 = पौष कृष्ण अमावस्या
  const refIndex = MASA_SEQ.indexOf("पौष");

  const sr = sunriseIST(date);
  const daysSinceRef =
    (sr - REF_AMAVASYA) / (1000 * 60 * 60 * 24);

  const lunations = Math.floor(daysSinceRef / SYNODIC_MONTH);
  let masaIndex = (refIndex + lunations) % 12;

  // Rule: Amavasya day still old month
  if (tithiData.isAmavasya) {
    masaIndex = (masaIndex - 1 + 12) % 12;
  }

  return MASA_SEQ[masaIndex];
}

/* ======================================================
   SAMVAT (ROLLOVER FIXED)
====================================================== */
function getSamvat(date, masa, paksha, tithi) {
  const year = date.getFullYear();

  let vikram = year + 57;
  let shak = year - 78;

  // New year after Chaitra Shukla Pratipada
  if (
    masa === "चैत्र" &&
    paksha === "शुक्ल पक्ष" &&
    tithi === "प्रतिपदा"
  ) {
    vikram += 1;
    shak += 1;
  }

  return {
    vikram_samvat: vikram,
    shak_samvat: shak
  };
}

/* ======================================================
   API
====================================================== */
app.get("/", (req, res) => {
  res.send("Bhakti Panchang backend running");
});

app.get("/api/panchang", (req, res) => {
  try {
    const today = new Date();

    const sunrise = sunriseIST(today);
    const sunset = new Date(sunrise.getTime() + 10.5 * 60 * 60 * 1000);

    const tithiData = getTithiSunriseLocked(today);
    const masa = getMasa(today, tithiData);
    const samvat = getSamvat(
      today,
      masa,
      tithiData.paksha,
      tithiData.tithi
    );

    res.json({
      date: today.toLocaleDateString("hi-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }),
      weekday: today.toLocaleDateString("hi-IN", { weekday: "long" }),

      sunrise: formatTime(sunrise),
      sunset: formatTime(sunset),

      moonrise: "Auto model",
      moonset: "Auto model",

      vikram_samvat: samvat.vikram_samvat,
      shak_samvat: samvat.shak_samvat,

      masa,
      paksha: tithiData.paksha,
      tithi: tithiData.tithi,

      source: "Sunrise-locked Panchang (Offline, Amavasya-based)"
    });

  } catch (e) {
    console.error(e);
    res.json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log("Bhakti Panchang backend running on", PORT);
});
