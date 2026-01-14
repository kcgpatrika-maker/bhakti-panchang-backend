import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

let cachedPanchang = null;

// --- Safe helpers ---
const safeText = (v) => (typeof v === "string" ? v.trim() : "");
const isValidTime = (t) => t && t !== "\\" && t !== "—" && t !== "-" && t !== null;

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
    moonrise: isValidTime(moonrise) ? moonrise : "",
    moonset: isValidTime(moonset) ? moonset : "",
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
    const raw = cachedPanchang || {}; // मान लीजिए raw JSON पहले से cached है
    const clean = formatForPage(raw);
    res.json(clean);
  } catch (e) {
    console.error("Formatter error:", e);
    res.status(500).json({ error: "formatter exception" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
