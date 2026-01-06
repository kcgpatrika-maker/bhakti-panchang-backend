// data/masaCalculator.js
// Masa calculation via Surya Sankranti (Free, long-term stable)

const MASA_LIST = [
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
  "फाल्गुन"
];

// Approx solar longitude
function getSolarLongitude(date) {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0);
  const now = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );

  const dayOfYear = (now - startOfYear) / 86400000;

  // 360° in ~365.25 days
  return (dayOfYear * 360) / 365.25;
}

export function getMasa(date) {
  const solarLong = getSolarLongitude(date);

  /*
    Zodiac ranges (approx):
    Capricorn (Makara) starts ~270°
  */

  if (solarLong >= 270 && solarLong < 300) return "माघ";
  if (solarLong >= 300 && solarLong < 330) return "फाल्गुन";
  if (solarLong >= 330 || solarLong < 30) return "चैत्र";
  if (solarLong >= 30 && solarLong < 60) return "वैशाख";
  if (solarLong >= 60 && solarLong < 90) return "ज्येष्ठ";
  if (solarLong >= 90 && solarLong < 120) return "आषाढ़";
  if (solarLong >= 120 && solarLong < 150) return "श्रावण";
  if (solarLong >= 150 && solarLong < 180) return "भाद्रपद";
  if (solarLong >= 180 && solarLong < 210) return "आश्विन";
  if (solarLong >= 210 && solarLong < 240) return "कार्तिक";
  if (solarLong >= 240 && solarLong < 270) return "मार्गशीर्ष";

  return "—";
}
