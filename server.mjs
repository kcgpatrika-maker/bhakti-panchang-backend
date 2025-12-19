import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());

/* =========================
   भारतीय दिवस / जयंती मैप
   ========================= */
const indianDayMap = {
  "01-26": ["🇮🇳 गणतंत्र दिवस"],
  "08-15": ["🇮🇳 स्वतंत्रता दिवस"],
  "10-02": ["गांधी जयंती"],
  "12-25": ["क्रिसमस"],
  "01-23": ["नेताजी सुभाष चंद्र बोस जयंती"],
  "04-14": ["डॉ. भीमराव अंबेडकर जयंती"],
  "09-05": ["शिक्षक दिवस"],
};

/* =========================
   Panchang API
   ========================= */
app.get("/api/panchang", async (req, res) => {
  try {
    const url = "https://www.drikpanchang.com/panchang/day-panchang.html";
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Date
    const date = $(".dpHeaderDate").first().text().trim();
    const vaar = $("span.dpDay").first().text().trim();

    // Maas + Paksha + Tithi
    const tithiRaw = $("td:contains('Tithi')").next().text().trim();
    const maasRaw = $("td:contains('Amanta')").next().text().trim();

    let paksha = "";
    if (tithiRaw.includes("Krishna")) paksha = "कृष्ण पक्ष";
    if (tithiRaw.includes("Shukla")) paksha = "शुक्ल पक्ष";

    const tithi = tithiRaw
      .replace("Krishna", "")
      .replace("Shukla", "")
      .trim();

    const maas = maasRaw + (paksha ? ` (${paksha})` : "");

    // Sun & Moon
    const sunrise = $("td:contains('Sunrise')").next().text().trim() || "--";
    const sunset = $("td:contains('Sunset')").next().text().trim() || "--";
    const moonrise = $("td:contains('Moonrise')").next().text().trim() || "--";
    const moonset = $("td:contains('Moonset')").next().text().trim() || "--";

    /* =========================
       व्रत-त्योहार (Drik Panchang)
       ========================= */
    let vratTyohar = [];
    $("ul.dpFestivalList li").each((i, el) => {
      const txt = $(el).text().trim();
      if (txt) vratTyohar.push(txt);
    });

    /* =========================
       भारतीय दिवस जोड़ना
       ========================= */
    const today = new Date();
    const key = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;

    if (indianDayMap[key]) {
      vratTyohar = [...indianDayMap[key], ...vratTyohar];
    }

    res.json({
      date,
      vaar,
      vikramSamvat: "2082",
      shakSamvat: "1947 (विश्वावसु)",
      maas,
      tithi: paksha ? `${paksha} ${tithi}` : tithi,
      sunMoon: {
        sunrise,
        sunset,
        moonrise,
        moonset,
      },
      vratTyohar,
    });
  } catch (err) {
    console.error(err);
    res.json({ error: "Panchang fetch failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Panchang backend running");
});
