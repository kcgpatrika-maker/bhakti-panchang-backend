import { getMasa } from "./masaCalculator.js";

const TITHI_NAMES = [
  "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी",
  "षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी",
  "एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा",
  "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी",
  "षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी",
  "एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","अमावस्या"
];

// Reference Amavasya
const REF_AMAVASYA = new Date("2025-12-30T00:00:00Z");
const LUNAR_DAYS = 29.530588;

export function getTithiData(dateObj) {
  const diffMs = dateObj - REF_AMAVASYA;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const lunarDay =
    Math.floor(
      ((diffDays % LUNAR_DAYS) + LUNAR_DAYS) % LUNAR_DAYS
    ) + 1;

  const tithi = TITHI_NAMES[lunarDay - 1];
  const paksha = lunarDay <= 15 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";

  return {
    masa: getMasa(dateObj),
    tithi,
    paksha
  };
}
