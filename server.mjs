import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;
const URL = "https://www.srimandir.com/hi/panchang";

// Raw fetcher: Srimandir से __NEXT_DATA__ JSON निकालना
async function fetchRaw() {
  const res = await fetch(URL);
  const html = await res.text();
  const $ = cheerio.load(html);
  const nextData = $("#__NEXT_DATA__").html();
  if (!nextData) return {};
  const parsed = JSON.parse(nextData);
  return parsed?.props?.pageProps || {};
}

// Endpoint: सिर्फ़ तिथि और उसका समय
app.get("/api/panchang", async (req, res) => {
  try {
    const raw = await fetchRaw();

    // Srimandir payload में panchangOne के अंदर array है
    const section = Array.isArray(raw?.panchangOne)
      ? raw.panchangOne[0]
      : raw.panchangOne;

    const tithiRow = section?.panchangOne?.find(r => r.title === "तिथि");

    res.json({
      date: raw.dateDisplay || "",
      tithi: tithiRow?.description || "",
      tithi_time: tithiRow?.time || ""
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Server start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
