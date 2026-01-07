import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import { fetchDrikHtml } from "./data/drik/fetchDrikHtml.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.send("Bhakti Panchang backend running");
});

/* ===============================
   PANCHANG API (STEP-L-1)
================================ */
app.get("/api/test-drik", async (req, res) => {
  try {
    const html = await fetchDrikHtml();
    res.send(html.slice(0, 2000)); // first 2000 chars only
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get("/api/panchang", async (req, res) => {
  try {
    const dateParam = req.query.date;
    if (!dateParam) {
      return res.status(400).json({ error: "date required YYYY-MM-DD" });
    }

    const [yyyy, mm, dd] = dateParam.split("-");
    const drikDate = `${dd}/${mm}/${yyyy}`;

    const url =
  `https://www.drikpanchang.com/panchang/jaipur-panchang.html?date=${drikDate}`;
     
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const raw = {};

$("dl").each((_, dl) => {
  const dts = $(dl).find("dt");
  const dds = $(dl).find("dd");

  dts.each((i, dt) => {
    const key = $(dt).text().trim();
    const value = $(dds[i]).text().trim();
    if (key && value) {
      raw[key] = value;
    }
  });
});
    
    res.json({
      source: "drikpanchang.com",
      date: dateParam,
      panchang_raw: raw
    });

  } catch (e) {
    res.status(500).json({ error: "failed" });
  }
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
