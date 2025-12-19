import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());

app.get("/api/panchang", async (req, res) => {
  try {
    const url = "https://www.drikpanchang.com/panchang/day-panchang.html";
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Date & Day
    const date = $(".dpHeaderDate").first().text().trim();
    const vaar = $("span.dpDay").first().text().trim();

    // Tithi (with Paksha)
    const tithi = $("td:contains('Tithi')").next().text().trim();

    // Maas
    const maas = $("td:contains('Amanta')").next().text().trim();

    // Sun & Moon
    const sunrise = $("td:contains('Sunrise')").next().text().trim() || "--";
    const sunset = $("td:contains('Sunset')").next().text().trim() || "--";
    const moonrise = $("td:contains('Moonrise')").next().text().trim() || "--";
    const moonset = $("td:contains('Moonset')").next().text().trim() || "--";

    // Vrat / Tyohar (religious only for now)
    const vratTyohar = [];
    $("ul.dpFestivalList li").each((i, el) => {
      const text = $(el).text().trim();
      if (text) vratTyohar.push(text);
    });

    res.json({
      date,
      vaar,
      vikramSamvat: "2082",
      shakSamvat: "1947 (विश्वावसु)",
      maas,
      tithi,
      sunMoon: {
        sunrise,
        sunset,
        moonrise,
        moonset
      },
      vratTyohar
    });

  } catch (err) {
    console.error(err);
    res.json({ error: "Panchang fetch failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Panchang backend running on port", PORT);
});
