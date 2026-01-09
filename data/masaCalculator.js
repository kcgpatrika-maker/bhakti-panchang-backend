// Hindu lunar month (Amavasya based)

const MASA_SEQUENCE = [
  "चैत्र","वैशाख","ज्येष्ठ","आषाढ़","श्रावण","भाद्रपद",
  "आश्विन","कार्तिक","मार्गशीर्ष","पौष","माघ","फाल्गुन"
];

export function getMasa(date, tithi) {
  const baseMonthIndex = date.getMonth(); // rough anchor
  let masaIndex = (baseMonthIndex + 8) % 12; // align with lunar

  if (tithi === "प्रतिपदा") {
    masaIndex = (masaIndex + 1) % 12;
  }

  return MASA_SEQUENCE[masaIndex];
}
