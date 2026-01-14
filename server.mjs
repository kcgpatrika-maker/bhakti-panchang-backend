import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;
const SRIMANDIR_URL = "https://www.srimandir.com/hi/panchang";

// --- Raw fetcher: Srimandir से पूरा HTML लेकर values निकालना ---
async function fetchSriMandir() {
  const res = await fetch(SRIMANDIR_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

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
    date: $("h1").first().text().trim() || "",   // सबसे ऊपर की तारीख/वार
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
    source: SRIMANDIR_URL
  };
}

// --- Endpoint: Raw data ---
app.get("/api/raw", async (req, res) => {
  try {
    const raw = await fetchSriMandir();
    res.json(raw);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Endpoint: Panchang (frontend‑friendly) ---
app.get("/api/panchang", async (req, res) => {
  try {
    const raw = await fetchSriMandir();
    // अभी raw ही भेज रहे हैं; बाद में filter जोड़ सकते हैं
    res.json(raw);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
