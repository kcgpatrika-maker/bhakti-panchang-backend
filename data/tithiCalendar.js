// data/tithiCalendar.js

const TITHI_NAMES = [
  "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी",
  "षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी",
  "एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा",
  "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी",
  "षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी",
  "एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","अमावस्या"
];

// Reference Amavasya (safe anchor)
const REF_AMAVASYA = new Date("2025-12-30T00:00:00Z");
const LUNAR_DAYS = 29.530588;

// मास mapping (North Indian system)
function getMasa(date) {
  const d = date.getDate();
  const m = date.getMonth() + 1;

  if (m === 12 && d >= 15 || m === 1 && d <= 13) return "पौष";
  if (m === 1 && d >= 14 || m === 2 && d <= 12) return "माघ";
  if (m === 2 && d >= 13 || m === 3 && d <= 14) return "फाल्गुन";
  if (m === 3 && d >= 15 || m === 4 && d <= 13) return "चैत्र";
  if (m === 4 && d >= 14 || m === 5 && d <= 14) return "वैशाख";
  if (m === 5 && d >= 15 || m === 6 && d <= 14) return "ज्येष्ठ";
  if (m === 6 && d >= 15 || m === 7 && d <= 15) return "आषाढ़";
  if (m === 7 && d >= 16 || m === 8 && d <= 16) return "श्रावण";
  if (m === 8 && d >= 17 || m === 9 && d <= 16) return "भाद्रपद";
  if (m === 9 && d >= 17 || m === 10 && d <= 16) return "आश्विन";
  if (m === 10 && d >= 17 || m === 11 && d <= 15) return "कार्तिक";
  return "मार्गशीर्ष";
}

export function getTithiData(dateObj) {
  const diffMs = dateObj - REF_AMAVASYA;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const lunarDay =
    Math.floor((diffDays % LUNAR_DAYS + LUNAR_DAYS) % LUNAR_DAYS) + 1;

  const tithi = TITHI_NAMES[lunarDay - 1];
  const paksha = lunarDay <= 15 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";
  const masa = getMasa(dateObj);

  return {
    masa,
    tithi,
    paksha
  };
}
