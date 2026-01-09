// Moon age based tithi calculation (stable)

const TITHI_NAMES = [
  "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी",
  "षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी",
  "एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा",
  "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी",
  "षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी",
  "एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","अमावस्या"
];

export function getTithiFromMoon(date) {
  const knownNewMoon = new Date("2024-01-11T11:57:00Z");
  const diffDays = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const moonAge = ((diffDays % 29.53) + 29.53) % 29.53;

  const index = Math.floor(moonAge);
  const tithi = TITHI_NAMES[index] || "—";
  const paksha = index < 15 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";

  return { tithi, paksha };
}
