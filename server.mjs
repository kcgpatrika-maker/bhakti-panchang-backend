import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import cheerio from "cheerio";

const app = express();
app.use(cors());

app.get("/api/panchang", async (req, res) => {
  try {
    // 🔗 Panchang source (today)
    const url = "https://www.drikpanchang.com/panchang/day-panchang.html";
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 🔹 Extract data (safe selectors)
    const date = $(".dpHeaderDate").first().text().trim();
    const vaar = $("span.dpDay").first().text().trim();

    const tithi = $("td:contains('Tithi')").next().text().trim();
    const maas = $("td:contains('Amanta')").next().text().trim();

    const sunrise = $("td:contains('Sunrise')").next().text().trim();
    const sunset = $("td:contains('Sunset')").next().text().trim();
    const moonrise = $("td:contains('Moonrise')").next().text().trim();
    const moonset = $("td:contains('Moonset')").next().text().trim();

    const vratTyohar = [];
    $("ul.dpFestivalList li").each((i, el) => {
      vratTyohar.push($(el).text().trim());
    });

    res.json({
      date,
      vaar,
      vikramSamvat: "2082",   // later auto
      shakSamvat: "1947",
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
    res.json({ error: "Panchang fetch failed" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Panchang backend running on port ${PORT}`);
});
