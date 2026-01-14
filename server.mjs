import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;
const SRIMANDIR_URL = "https://www.srimandir.com/hi/panchang";

// वही पुराना पैटर्न: <p> टैग्स से label-based extraction
async function fetchSunTimes() {
  const res = await fetch(SRIMANDIR_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  function extractField(label) {
    let value = "";
    $("p").each((i, el) => {
      const text = $(el).text().trim();
      if (text.startsWith(label)) {
        // "लेबल : मान" से मान निकालना
        value = text.replace(label + " :", "").trim();
      }
    });
    return value;
  }

  const sunrise = extractField("सूर्योदय");
  const sunset  = extractField("सूर्यास्त");

  return { sunrise, sunset, source: SRIMANDIR_URL };
}

// छोटा endpoint—सिर्फ़ सूर्योदय/सूर्यास्त
app.get("/api/sun", async (req, res) => {
  try {
    const data = await fetchSunTimes();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "fetch failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
