import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const SOURCE_URL = "https://www.srimandir.com/hi/panchang";

/* ===============================
   FETCH RAW SRIMANDIR DATA
================================ */
async function fetchSrimandirData() {
  try {
    const response = await fetch(SOURCE_URL);
    const html = await response.text();

    const $ = cheerio.load(html);
    const nextData = $("#__NEXT_DATA__").html();

    if (!nextData) {
      return null;
    }

    const parsed = JSON.parse(nextData);
    return parsed?.props?.pageProps || null;

  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.send("Bhakti Panchang backend running");
});

/* ===============================
   PANCHANG API
================================ */
app.get("/api/panchang", async (req, res) => {
  const raw = await fetchSrimandirData();

  if (!raw) {
    return res.json({
      success: false,
      message: "Panchang data not available"
    });
  }

  try {
    // 🔹 Safe optional chaining (page changes tolerant)
    const info = raw?.panchangOne || {};
    const rows = raw?.panchangRows || [];

    const getRow = (label) =>
      rows.find(r => r?.label?.includes(label))?.value || "—";

    const result = {
      success: true,

      date: info?.date || "—",
      location: info?.place || "India",

      sunrise: getRow("सूर्योदय"),
      sunset: getRow("सूर्यास्त"),

      moonrise: getRow("चन्द्रोदय"),
      moonset: getRow("चन्द्रास्त"),

      vikram_samvat: getRow("विक्रम संवत"),
      shak_samvat: getRow("शक संवत"),

      masa_purnimant: getRow("पूर्णिमांत"),
      masa_amant: getRow("अमांत"),

      tithi: getRow("तिथि"),

      source: "Srimandir Panchang (Server-fetched)",
      cached: false
    };

    res.json(result);

  } catch (err) {
    console.error("Parse error:", err);
    res.json({
      success: false,
      message: "Error parsing Panchang data"
    });
  }
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log("Bhakti Panchang backend running on port", PORT);
});
