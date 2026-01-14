import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;
const URL = "https://www.srimandir.com/hi/panchang";

async function fetchRaw() {
  const res = await fetch(URL);
  const html = await res.text();
  const $ = cheerio.load(html);
  const nextData = $("#__NEXT_DATA__").html();
  if (!nextData) return {};
  const parsed = JSON.parse(nextData);
  return parsed?.props?.pageProps || {};
}

// सिर्फ़ तिथि निकालने वाला endpoint
app.get("/api/tithi", async (req, res) => {
  try {
    const raw = await fetchRaw(); // वही __NEXT_DATA__ वाला fetchRaw
    const tithiRow = raw?.panchangOne?.panchangOne?.find(r => r.title === "तिथि");
    const tithi = tithiRow ? tithiRow.description : "";
    const tithiTime = tithiRow ? tithiRow.time : "";

    res.json({
      date: raw.dateDisplay || "",
      tithi,
      tithi_time: tithiTime
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
