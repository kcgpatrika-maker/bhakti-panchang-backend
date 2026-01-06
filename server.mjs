import express from "express";
import cors from "cors";

const router = express.Router();

router.get("/api/panchang", async (req, res) => {
  try {
    // YYYY-MM-DD expected
    const dateParam = req.query.date;
    if (!dateParam) {
      return res.status(400).json({ error: "date required (YYYY-MM-DD)" });
    }

    const [yyyy, mm, dd] = dateParam.split("-");
    const drikDate = `${dd}/${mm}/${yyyy}`;

    const url =
      `https://www.drikpanchang.com/panchang/day-panchang.html?date=${drikDate}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch Drik Panchang" });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const rawPanchang = {};

    $("table").each((_, table) => {
      $(table)
        .find("tr")
        .each((__, row) => {
          const cols = $(row).find("td");
          if (cols.length === 2) {
            const key = $(cols[0]).text().trim();
            const value = $(cols[1]).text().trim();

            if (
              key &&
              value &&
              /Day|Tithi|Paksha|Masa|Samvat|Sunrise|Sunset|Moonrise|Moonset/i.test(
                key
              )
            ) {
              rawPanchang[key] = value;
            }
          }
        });
    });

    if (Object.keys(rawPanchang).length === 0) {
      return res
        .status(500)
        .json({ error: "Panchang section not found" });
    }

    res.json({
      source: "drikpanchang.com",
      date: dateParam,
      panchang_raw: rawPanchang
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
