// data/masaCalculator.js

const MASA_LIST = [
  "चैत्र","वैशाख","ज्येष्ठ","आषाढ़",
  "श्रावण","भाद्रपद","आश्विन","कार्तिक",
  "मार्गशीर्ष","पौष","माघ","फाल्गुन"
];

// Reference: पौष अमावस्या (30 Dec 2025)
const REF_MASA_INDEX = 9; // पौष
const LUNAR_DAYS = 29.530588;
const REF_DATE = new Date("2025-12-30T00:00:00Z");

export function getMasa(dateObj) {
  const diffDays =
    (dateObj - REF_DATE) / (1000 * 60 * 60 * 24);

  const lunations = Math.floor(diffDays / LUNAR_DAYS);
  const masaIndex =
    (REF_MASA_INDEX + lunations) % 12;

  return MASA_LIST[(masaIndex + 12) % 12];
}
