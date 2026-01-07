import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const PORT = process.env.PORT || 10000;

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.send("Bhakti Panchang backend running");
});

/* ===============================
   STEP-L-2 : PROCESS DRIK HTML
   Frontend HTML भेजेगा
================================ */
app.post("/api/process-drik-html", (req, res) => {
  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: "HTML missing" });
    }

    const $ = cheerio.load(html);
    const raw = {};

    $("dl").each((_, dl) => {
      const dts = $(dl).find("dt");
      const dds = $(dl).find("dd");

      dts.each((i, dt) => {
        const key = $(dt).text().trim();
        const value = $(dds[i]).text().trim();
        if (key && value) raw[key] = value;
      });
    });

    res.json({
      success: true,
      extracted_keys: Object.keys(raw),
      data: raw
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Parsing failed" });
  }
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
