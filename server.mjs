async function fetchSriMandir(city = "jaipur", date = "2026-01-13") {
  try {
    const url = `https://www.srimandir.com/hi/panchang`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Fetch failed:", res.status);
      return { error: "fetch failed" };
    }
    const html = await res.text();
    console.log("HTML snippet:", html.substring(0, 500)); // Debug: पहले 500 chars

    const $ = cheerio.load(html);

    function extractField(label) {
      let value = "—";
      $("p").each((i, el) => {
        const text = $(el).text().trim();
        if (text.startsWith(label)) {
          value = text.replace(label + " :", "").trim();
        }
      });
      return value;
    }

    return {
      date,
      tithi: extractField("तिथि"),
      nakshatra: extractField("नक्षत्र"),
      yoga: extractField("योग"),
      karana: extractField("करण"),
      sunrise: extractField("सूर्योदय"),
      sunset: extractField("सूर्यास्त"),
      moonrise: extractField("चन्द्रोदय"),
      moonset: extractField("चंद्रास्त"),
      rahukaal: extractField("राहुकाल"),
      shubh_muhurat: extractField("शुभ मुहूर्त"),
      source: url
    };
  } catch (err) {
    console.error("SriMandir fetch error:", err);
    return { error: "exception" };
  }
}
