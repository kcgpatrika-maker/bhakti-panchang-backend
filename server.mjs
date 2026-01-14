// server.mjs
import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;
const URL = "https://www.srimandir.com/hi/panchang";

// 1) Raw fetcher: __NEXT_DATA__ JSON निकालना (defensive, stable)
async function fetchRaw() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const nextData = $("#__NEXT_DATA__").html();
  if (!nextData) throw new Error("NEXT_DATA not found");
  const parsed = JSON.parse(nextData);
  return parsed?.props?.pageProps || {};
}

// 2) Helper: किसी सेक्शन में title से row ढूँढना (object/array दोनों cases)
function findRowByTitle(section, title) {
  if (!section) return null;

  // section हो सकता है:
  // - object: { panchangOne: [...] }
  // - array: [ { panchangOne: [...] }, ... ]
  // - सीधे array: [...]
  const arr =
    Array.isArray(section?.panchangOne)
      ? section.panchangOne
      : Array.isArray(section)
        ? section
        : section?.panchangOne;

  if (!Array.isArray(arr)) return null;
  return arr.find(r => (r?.title || "").trim() === title);
}

// 3) Endpoint: सिर्फ़ तिथि (description + time) — multi-section fallback
app.get("/api/panchang", async (req, res) => {
  try {
    const raw = await fetchRaw();

    // तिथि अक्सर panchangOne में होती है; fallback panchangTwo/panchangRows
    const tithiRow =
      findRowByTitle(raw?.panchangOne, "तिथि") ||
      findRowByTitle(raw?.panchangTwo, "तिथि") ||
      findRowByTitle(raw?.panchangRows, "तिथि");

    const date =
      raw?.dateDisplay ||
      raw?.date ||
      raw?.headerTitle ||
      ""; // कुछ builds में dateDisplay missing होता है

    const tithi = tithiRow?.description || "";
    const tithi_time = tithiRow?.time || "";

    if (!tithi) {
      console.warn("Tithi not found — check /api/raw structure for panchangOne/panchangTwo/panchangRows.");
    }

    res.json({ date, tithi, tithi_time });
  } catch (e) {
    console.error("Error in /api/panchang:", e.message);
    res.status(500).json({ error: "fetch/parse failed" });
  }
});

// 4) Debug endpoint: पूरा raw दिखाओ (structure verify करने के लिए)
app.get("/api/raw", async (req, res) => {
  try {
    const raw = await fetchRaw();
    res.json(raw);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
