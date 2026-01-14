import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

// --- Raw fetcher: Srimandir से पूरा HTML लेकर values निकालना ---
async function fetchSriMandir(city = "jaipur", date = "2026-01-13") {
  try {
    // Root URL से ही पूरा payload आता है
    const url = `https://www.srimandir.com/hi/panchang`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Fetch failed:", res.status);
      return { error: "fetch failed" };
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    // Helper: किसी label से value निकालना
    function extractField(label) {
      let value = "";
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

// --- Endpoint: Raw data ---
app.get("/api/raw", async (req, res) => {
  const raw = await fetchSriMandir();
  res.json(raw);
});

// --- Endpoint: Clean Panchang (frontend‑friendly) ---
app.get("/api/panchang", async (req, res) => {
  const raw = await fetchSriMandir();
  // अभी raw ही भेज रहे हैं; बाद में formatter जोड़ सकते हैं
  res.json(raw);
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
