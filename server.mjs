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
    return res.json({ success: false });
  }

  try {
    // ---- TITHI ----
    const tithiObj = raw?.panchangOne?.panchangOne
      ?.find(i => i.title === "तिथि");

    const tithi = tithiObj
      ? `${tithiObj.description} (${tithiObj.time})`
      : "—";

    // ---- MASA ----
    const amant = raw?.panchangTwo?.[0]
      ?.find(i => i.title.includes("अमान्त"))?.description || "—";

    const purnimant = raw?.panchangTwo?.[0]
      ?.find(i => i.title.includes("पूर्णिमांत"))?.description || "—";

    // ---- SAMVAT ----
    const vikram = raw?.panchangTwo?.[1]
      ?.find(i => i.title.includes("विक्रम"))?.description || "—";

    const shak = raw?.panchangTwo?.[1]
      ?.find(i => i.title.includes("शक"))?.description || "—";

    res.json({
      success: true,
      tithi,
      masa_amant: amant,
      masa_purnimant: purnimant,
      vikram_samvat: vikram,
      shak_samvat: shak,
      source: "Srimandir Panchang (Parsed)"
    });

  } catch (e) {
    console.error(e);
    res.json({ success: false });
  }
});

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
