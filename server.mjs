import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const SRIMANDIR_URL = "https://www.srimandir.com/hi/panchang";

/* ===============================
   FETCH SRIMANDIR RAW DATA
================================ */
async function fetchSrimandirData() {
  const res = await fetch(SRIMANDIR_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  const nextData = $("#__NEXT_DATA__").html();
  if (!nextData) return null;

  const json = JSON.parse(nextData);
  return json?.props?.pageProps || null;
}

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.send("Bhakti Panchang backend running");
});

/* ===============================
   PANCHANG API (STEP-1)
   ✔ Tithi
   ✔ Masa (Amant + Purnimant)
   ✔ Samvat
================================ */
app.get("/api/panchang", async (req, res) => {
  try {
    const raw = await fetchSrimandirData();
    if (!raw) {
      return res.json({ success: false, error: "No data" });
    }

    // ---- TITHI ----
    const tithiObj = raw?.panchangOne?.panchangOne
      ?.find(item => item.title === "तिथि");

    const tithi = tithiObj
      ? `${tithiObj.description} (${tithiObj.time})`
      : "—";

    // ---- MASA ----
    const masaAmant = raw?.panchangTwo?.[0]
      ?.find(i => i.title.includes("अमान्त"))?.description || "—";

    const masaPurnimant = raw?.panchangTwo?.[0]
      ?.find(i => i.title.includes("पूर्णिमांत"))?.description || "—";

    // ---- SAMVAT ----
    const vikramSamvat = raw?.panchangTwo?.[1]
      ?.find(i => i.title.includes("विक्रम"))?.description || "—";

    const shakSamvat = raw?.panchangTwo?.[1]
      ?.find(i => i.title.includes("शक"))?.description || "—";

    res.json({
      success: true,
      tithi,
      masa_amant: masaAmant,
      masa_purnimant: masaPurnimant,
      vikram_samvat: vikramSamvat,
      shak_samvat: shakSamvat,
      source: "Srimandir Panchang (Parsed)"
    });

  } catch (err) {
    console.error("Panchang API error:", err);
    res.status(500).json({ success: false });
  }
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
