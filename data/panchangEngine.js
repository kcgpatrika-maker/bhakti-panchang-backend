// data/panchangEngine.js

export function getTodayPanchang() {
  const today = new Date();

  const dateText = today.toLocaleDateString("hi-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const dayText = today.toLocaleDateString("hi-IN", {
    weekday: "long"
  });

  /* ===============================
     TEMP FIXED VALUES (AUTO DAILY DATE)
     (अगले चरण में इन्हें API / Govt source से sync करेंगे)
  =============================== */

  return {
    date: dateText,
    day: dayText,

    sunrise: "06:55",
    sunset: "17:42",

    moonrise: "19:10",
    moonset: "07:30",

    vikram_samvat: 2082,
    shak_samvat: 1947,

    // अभी placeholder — लेकिन API नहीं टूटेगी
    masa: "—",
    tithi: "तिथि जानकारी अपडेट प्रक्रिया में है"
  };
}
