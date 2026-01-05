// data/astronomy/tithiFromMoon.js

const TITHI_NAMES = [
  "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी",
  "अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा",
  "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी",
  "अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","अमावस्या"
];

// 🔒 Reference Amavasya (scientifically known)
const REF_AMAVASYA = new Date("2024-01-11T11:57:00Z");

export function getTithiFromMoon(date) {
  const diffMs = date - REF_AMAVASYA;
  const days = diffMs / (1000 * 60 * 60 * 24);

  const moonAge = ((days % 29.530588) + 29.530588) % 29.530588;

  const tithiIndex = Math.floor(moonAge / 0.984) + 1;

  const tithi = TITHI_NAMES[tithiIndex - 1] || "—";
  const paksha = tithiIndex <= 15 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";

  return {
    tithi,
    paksha,
    source: "Moon phase calculation (PAC-style)"
  };
}
