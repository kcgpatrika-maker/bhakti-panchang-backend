import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

const safeText = (v) => (typeof v === "string" ? v.trim() : "");

// Raw extractor: Srimandir HTML से पूरा JSON blob निकालना
function extractJsonFromHtml(html) {
  const $ = cheerio.load(html);
  let rawJson = null;

  $("script").each((i, el) => {
    const txt = $(el).html() || "";
    if (txt.includes("panchangRows") || txt.includes("headerTitle")) {
      const match = txt.match(/\{[\s\S]*?"panchangRows"[\s\S]*?\}/);
      if (match) {
        try { rawJson = JSON.parse(match[0]); } catch {}
      }
    }
  });

  if (!rawJson) {
    const blobMatch = html.match(/\{[\s\S]*?"panchangRows"[\s\S]*?\}/);
    if (blobMatch) {
      try { rawJson = JSON.parse(blobMatch[0]); } catch {}
    }
  }

  return rawJson || {};
}
function collectRows(raw) {
  const rows = [];
  const pushRows = (arr) => {
    if (Array.isArray(arr)) {
      for (const block of arr) {
        if (Array.isArray(block)) {
          for (const item of block) {
            if (item && item.title) rows.push({ title: safeText(item.title), description: safeText(item.description), time: safeText(item.time) });
          }
        } else if (block && block.title) {
          rows.push({ title: safeText(block.title), description: safeText(block.description), time: safeText(block.time) });
        }
      }
    }
  };
  pushRows(raw?.panchangRows);
  pushRows(raw?.panchangOne);
  pushRows(raw?.panchangTwo);
  pushRows(raw?.panchangThree);
  return rows;
}

function getByTitle(rows, title) {
  return rows.find((x) => safeText(x.title) === title) || null;
}

function formatForPage(raw) {
  const rows = collectRows(raw);

  const tithiDesc = safeText(getByTitle(rows, "तिथि")?.description);
  let paksha = "";
  let tithi = tithiDesc;
  const pkMatch = tithiDesc.match(/(कृष्ण|शुक्ल)\sपक्ष/);
  if (pkMatch) {
    paksha = pkMatch[0];
    tithi = tithiDesc.replace(pkMatch[0], "").trim();
  }

  const vikramRaw = safeText(getByTitle(rows, "विक्रम संवत")?.description);
  const shakRaw = safeText(getByTitle(rows, "शक")?.description);

  return {
    date: safeText(raw?.dateDisplay) || "14 जनवरी 2026, बुधवार",
    sunrise: safeText(raw?.sunrise) || "",
    sunset: safeText(raw?.sunset) || "",
    moonrise: safeText(raw?.moonrise) || "",
    moonset: safeText(raw?.moonset) || "",
    vikram_samvat: vikramRaw.replace(/\s*\([^)]*\)\s*/g, ""),
    shak_samvat: shakRaw.replace(/\s*\([^)]*\)\s*/g, ""),
    maas: safeText(getByTitle(rows, "महीना पूर्णिमांत")?.description), // प्राथमिकता पूर्णिमांत
    maas_variants: {
      purnimant: safeText(getByTitle(rows, "महीना पूर्णिमांत")?.description),
      amanat: safeText(getByTitle(rows, "महीना अमान्त")?.description)
    },
    paksha,
    tithi,
    nakshatra: safeText(getByTitle(rows, "नक्षत्र")?.description),
    yoga: safeText(getByTitle(rows, "योग")?.description),
    karana: safeText(getByTitle(rows, "करण")?.description),
    festivals: (raw?.festivals || []).flatMap(f => f.festivals?.map(x => safeText(x.festival)) || []),
    religious_message: safeText(raw?.religious_message) || ""
  };
}
// Raw endpoint: पूरा payload देखने के लिए
app.get("/api/raw", async (req,res) => {
  const url = "https://www.srimandir.com/hi/panchang";
  const resHtml = await fetch(url);
  const html = await resHtml.text();
  const raw = extractJsonFromHtml(html);
  res.json(raw);
});

// Clean endpoint: फ्रंटएंड के लिए साफ़ JSON
app.get("/api/panchang", async (req,res) => {
  const url = "https://www.srimandir.com/hi/panchang";
  const resHtml = await fetch(url);
  const html = await resHtml.text();
  const raw = extractJsonFromHtml(html);
  const clean = formatForPage(raw);
  res.json(clean);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
