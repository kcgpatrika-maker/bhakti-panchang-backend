import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const PORT = process.env.PORT || 10000;

/* ===============================
   STEP-L-3 : FRONTEND TEST API
================================ */
app.get("/api/frontend-test", async (req, res) => {
  try {
    const testUrl =
      "https://www.drikpanchang.com/panchang/jaipur-panchang.html";

    const response = await fetch(testUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html"
      }
    });

    const html = await response.text();

    res.json({
      success: true,
      htmlLength: html.length,
      sample: html.slice(0, 500)
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
});


/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
