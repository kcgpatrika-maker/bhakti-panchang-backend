import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

let cachedRaw = null;

// --- Safe helpers ---
const safeText = (v) => (typeof v === "string" ? v.trim() : "");
const isValidTime = (t) => t && t !== "\\" && t !== "—" && t !== "-" && t !== null;

// --- Fetch Srimandir and extract embedded JSON ---
async function fetchSriMandir(city = "jaipur", date = "2026-01-14") {
  const url = `https://www.srimandir.com/hi/panchang`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Try to find embedded JSON in script tags or inline data blocks
  let rawJson = null;

  // 1) Look for a script tag containing "panchang" JSON
  $("script").each((i, el) => {
    const txt = $(el).html() || "";
    if (txt.includes("panchang")) {
      // Try to extract a JSON object substring
      const match = txt.match(/\{[\s\S]*?"panchangRows"[\s\S]*?\}/);
      if (match) {
        try {
          rawJson = JSON.parse(match[0]);
        } catch {}
      }
    }
  });

  // 2) Fallback: look for a data blob in the HTML (e.g., window.__DATA__ = {...})
  if (!rawJson) {
    const blobMatch = html.match(/\{[\s\S]*?"panchangRows"[\s\S]*?\}/);
    if (blobMatch) {
      try {
        rawJson = JSON.parse(blobMatch[0]);
      } catch {}
    }
  }

  // 3) If still not found, build a minimal raw from visible blocks (best-effort)
  if (!rawJson) {
    // Extract visible text lines as a fallback
    const text = $("body").text();
    rawJson = {
      headerTitle: "आज का पंचांग",
      suryodaya: (text.match(/(\d{1,2}:\d{2}\s?(AM|PM)).*सूर्यास्त\s?(\d{1,2}:\d{2}\s?(AM|PM))/i) || [])[0] || "",
      panchangRows: [
        [{ title: "तिथि", description: (text.match(/तिथि\s*[:：]\s*([^\n]+)/) || [,""])[1], time: "" }],
        [{ title: "नक्षत्र", description: (text.match(/नक्षत्र\s*[:：]\s*([^\n]+)/) || [,""])[1], time: "" }],
        [{ title: "योग", description: (text.match(/योग\s*[:：]\s*([^\n]+)/) || [,""])[1], time: "" }],
        [{ title: "करण", description: (text.match(/करण\s*[:：]\s*([^\n]+)/) || [,""])[1], time: "" }],
        [{ title: "महीना अमान्त", description: (text.match(/महीना अमान्त\s*[:：]\s*([^\n]+)/) || [,""])[1], time: "" }],
        [{ title: "महीना पूर्णिमांत", description: (text.match(/महीना पूर्णिमांत\s*[:：]\s*([^\n]+)/) || [,""])[1], time: "" }],
        [{ title: "विक्रम संवत", description: (text.match(/विक्रम संवत\s*[:：]\s*([^\n]+)/) || [,""])[1], time: "" }],
        [{ title: "शक", description: (text.match(/शक\s*[:：]\s*([^\n]+)/) || [,""])[1], time: "" }]
      ],
      festivals: []
    };
  }

  rawJson.source = url;
  return rawJson;
}

// --- Parse Srimandir JSON sections ---
function parsePanchangRows(raw) {
  const rows = Array.isArray(raw?.panchangRows) ? raw.panchangRows : [];
  const flat = rows.flat().filter(Boolean);

  const getByTitle = (title) => {
    const item = flat.find((x) => safeText(x?.title) === title);
    return item ? { description: safeText(item.description), time: safeText(item.time) } : null;
  };

  return {
    tithi: getByTitle("तिथि"),
    nakshatra: getByTitle("नक्षत्र"),
    yoga: getByTitle("योग"),
    karana: getByTitle("करण"),
    maasAmanat: getByTitle("महीना अमान्त"),
    maasPurnimant: getByTitle("महीना पूर्णिमांत"),
    paksha: getByTitle("पक्ष"),
    vikramSamvat: getByTitle("विक्रम संवत"),
    shakSamvat: getByTitle("शक"),
  };
}

function parseSunTimes(raw) {
  const combined = safeText(raw?.suryodaya);
  let sunrise = "", sunset = "";

  if (combined) {
    const srMatch = combined.match(/(\d{1,2}:\d{2}\s?(AM|PM))/i);
    const ssMatch = combined.match(/सूर्यास्त\s?(\d{1,2}:\d{2}\s?(AM|PM))/i);
    if (srMatch) sunrise = srMatch[1];
    if (ssMatch) sunset = ssMatch[1];
  }

  const suryodaya = safeText(raw?.suryodaya);
  const suryastha = safeText(raw?.suryastha);
  if (!sunrise && suryodaya) {
    const m = suryodaya.match(/(\d{1,2}:\d{2}\s?(AM|PM))/i);
    if (m) sunrise = m[1];
  }
  if (!sunset && suryastha) {
    const m = suryastha.match(/(\d{1,2}:\d{2}\s?(AM|PM))/i);
    if (m) sunset = m[1];
  }

  const moonrise = safeText(raw?.chandrodaya);
  const moonset = safeText(raw?.chandrasta);

  return {
    sunrise: sunrise || "",
    sunset: sunset || "",
    moonrise: moonrise || "",
    moonset: moonset || "",
  };
}

function parseFestivals(raw) {
  const list = Array.isArray(raw?.festivals) ? raw.festivals : [];
  const names = [];
  for (const group of list) {
    const arr = Array.isArray(group?.festivals) ? group.festivals : [];
    for (const item of arr) {
      const name = safeText(item?.festival);
      if (name) names.push(name);
    }
  }
  return [...new Set(names)];
}

// --- Formatter for your page ---
function formatForPage(raw) {
  const rows = parsePanchangRows(raw);
  const times = parseSunTimes(raw);

  const tithiDesc = safeText(rows?.tithi?.description);
  let paksha = safeText(rows?.paksha?.description);
  let tithi = tithiDesc;
  const pkMatch = tithiDesc.match(/(कृष्ण|शुक्ल)\sपक्ष/);
  if (pkMatch) {
    paksha = pkMatch[0];
    tithi = tithiDesc.replace(pkMatch[0], "").trim();
  }

  const vikramRaw = safeText(rows?.vikramSamvat?.description);
  const shakRaw = safeText(rows?.shakSamvat?.description);
  const vikram_samvat = vikramRaw.replace(/\s*\([^)]*\)\s*/g, "").trim();
  const shak_samvat = shakRaw.replace(/\s*\([^)]*\)\s*/g, "").trim();

  return {
    date: safeText(raw?.dateDisplay) || "14 जनवरी 2026, बुधवार",
    sunrise: times.sunrise,
    sunset: times.sunset,
    moonrise: times.moonrise,
    moonset: times.moonset,
    vikram_samvat,
    shak_samvat,
    maas: safeText(rows?.maasPurnimant?.description), // प्राथमिकता पूर्णिमांत
    maas_variants: {
      purnimant: safeText(rows?.maasPurnimant?.description),
      amanat: safeText(rows?.maasAmanat?.description)
    },
    paksha,
    tithi,
    nakshatra: safeText(rows?.nakshatra?.description),
    yoga: safeText(rows?.yoga?.description),
    karana: safeText(rows?.karana?.description),
    festivals: parseFestivals(raw),
    religious_message: safeText(raw?.religious_message) || ""
  };
}

// --- API endpoint ---
app.get("/api/panchang", async (req, res) => {
  try {
    const city = safeText(req.query.city) || "jaipur";
    const date = safeText(req.query.date) || "2026-01-14";

    // Always fetch fresh if cache empty
    if (!cachedRaw) {
      cachedRaw = await fetchSriMandir(city, date);
    }

    const clean = formatForPage(cachedRaw);
    res.json(clean);
  } catch (e) {
    console.error("Endpoint error:", e);
    res.status(500).json({ error: "formatter/fetch exception" });
  }
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    cachedRaw = await fetchSriMandir("jaipur", "2026-01-14");
  } catch (e) {
    console.error("Initial fetch failed:", e);
  }
});
