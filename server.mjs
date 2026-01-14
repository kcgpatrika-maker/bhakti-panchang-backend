import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

async function fetchSriMandir() {
  const res = await fetch("https://www.srimandir.com/panchang/date/13-01-2026");
  const html = await res.text();
  const $ = cheerio.load(html);

  function getValueByLabel(label) {
    let value = "—";
    $("div").each((i, el) => {
      const text = $(el).text().trim();
      if (text.includes(label)) {
        const parent = $(el).parent();
        const possible = parent.find("div").last().text().trim();
        if (possible && !possible.includes("px") && !possible.includes("transparent")) {
          value = possible;
        }
      }
    });
    return value;
  }

  return {
    date: "2026-01-13",
    sunrise: getValueByLabel("Sunrise"),
    sunset: getValueByLabel("Sunset"),
    moonrise: getValueByLabel("Moonrise"),
    moonset: getValueByLabel("Moonset"),
    source: "srimandir.com"
  };
}

app.get("/api/panchang", async (req, res) => {
  const data = await fetchSriMandir();
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
