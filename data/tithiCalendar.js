// data/tithiCalendar.js

export function getTithiData(date = new Date()) {
  // Reference New Moon (standard)
  const referenceNewMoon = new Date("2024-01-11T11:57:00Z");

  const lunarMonthDays = 29.530588;
  const diffMs = date - referenceNewMoon;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const tithiIndex = Math.floor(
    ((diffDays % lunarMonthDays) + lunarMonthDays) % lunarMonthDays / (lunarMonthDays / 30)
  );

  const tithiNames = [
    "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी",
    "षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी",
    "एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा",
    "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी",
    "षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी",
    "एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","अमावस्या"
  ];

  return {
    masa: "—", // next step
    tithi: tithiNames[tithiIndex] || "—",
    paksha: tithiIndex < 15 ? "शुक्ल पक्ष" : "कृष्ण पक्ष"
  };
}
