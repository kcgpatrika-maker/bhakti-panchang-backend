import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;
const SRIMANDIR_URL = "https://www.srimandir.com/hi/panchang";

// ---------- Helpers ----------
const safe = (v) => (typeof v === "string" ? v.trim() : "");
const isTime = (t) => !!t && t !== "\\" && t !== "—" && t !== "-" && t !== null;

// ---------- Part 1: Raw extractor (Next.js __NEXT_DATA__) ----------
async function fetchRawPanchang() {
  const res = await fetch(SRIMANDIR_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Prefer Next.js payload
  const nextData = $("#__NEXT_DATA__").html();
  if (nextData) {
    try {
      const parsed = JSON.parse(nextData);
      const raw = parsed?.props?.pageProps || {};
      raw.source = SRIMANDIR_URL;
      return raw;
    } catch (e) {
      console.error("NEXT_DATA parse error:", e);
    }
  }

  // Fallback: try to find a blob with panchangRows
  const blobMatch = html.match(/\{[\s\S]*?"panchangRows"[\s\S]*?\}/);
  if (blobMatch) {
    try {
      const raw = JSON.parse(blobMatch[0]);
      raw.source = SRIMANDIR_URL;
      return raw;
    } catch (e) {
      console.error("Blob parse error:", e);
    }
  }

  // Last resort: minimal structure
  return { source: SRIMANDIR_URL };
}

// ---------- Part 2: Robust formatter ----------
function collectRows(raw) {
  const rows = [];
  const pushRows = (arr) => {
    if (Array.isArray(arr)) {
      for (const block of arr) {
        if (Array.isArray(block)) {
          for (const item of block) {
            if (item && item.title) rows.push({
              title: (item.title || "").trim(),
              description: (item.description || "").trim(),
              time: (item.time || "").trim()
            });
          }
        } else if (block && block.title) {
          rows.push({
            title: (block.title || "").trim(),
            description: (block.description || "").trim(),
            time: (block.time || "").trim()
          });
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

function findRow(rows, predicate) {
  return rows.find((x) => predicate((x.title || "").trim())) || {};
}

function extractSunTimesFlexible(raw) {
  const candidates = [
    (raw?.suryodaya || "").trim(),
    (raw?.sunrise || "").trim(),
    (raw?.sunset || "").trim(),
    (raw?.headerTitle || "").trim(),
  ];

  // किसी भी candidate text में से समय निकालो
  let sunrise = "", sunset = "";
  for (const text of candidates) {
    if (!text) continue;
    const srMatch = text.match(/(\d{1,2}:\d{2}\s?(AM|PM))/i);
    if (srMatch && !sunrise) sunrise = srMatch[1];
    const ssMatch = text.match(/सूर्यास्त\s?(\d{1,2}:\d{2}\s?(AM|PM))/i);
    if (ssMatch && !sunset) sunset = ssMatch[1];
  }

  // Moon times—कहीं भी हों
  const moonCandidates = [
    (raw?.moonrise || "").trim(),
    (raw?.moonset || "").trim(),
    (raw?.chandrodaya || "").trim(),
    (raw?.chandrasta || "").trim(),
  ];
  const moonrise = moonCandidates.find((t) => t && t !== "\\" && t !== "—" && t !== "-") || "";
  const moonset = moonCandidates.slice(1).find((t) => t && t !== "\\" && t !== "—" && t !== "-") || "";

  return { sunrise, sunset, moonrise, moonset };
}

function formatForPage(raw) {
  const rows = collectRows(raw);
  const times = extractSunTimesFlexible(raw);

  // Titles को includes से पकड़ो
  const tithiRow = findRow(rows, (t) => t.includes("तिथि"));
  const nakRow = findRow(rows, (t) => t.includes("नक्षत्र"));
  const yogRow = findRow(rows, (t) => t.includes("योग"));
  const karRow = findRow(rows, (t) => t.includes("करण"));
  const purnRow = findRow(rows, (t) => t.includes("पूर्णिमांत"));
  const amanRow = findRow(rows, (t) => t.includes("अमान्त"));
  const pakRow = findRow(rows, (t) => t.includes("पक्ष"));
  const vikRow = findRow(rows, (t) => t.includes("विक्रम"));
  const shakRow = findRow(rows, (t) => t.includes("शक"));

  // Tithi + Paksha split
  const tithiDesc = (tithiRow.description || "").trim();
  let paksha = (pakRow.description || "").trim();
  let tithi = tithiDesc;
  const pkMatch = tithiDesc.match(/(कृष्ण|शुक्ल)\sपक्ष/);
  if (pkMatch) {
    paksha = pkMatch[0];
    tithi = tithiDesc.replace(pkMatch[0], "").trim();
  }

  // Samvat numbers only
  const vikram_samvat = (vikRow.description || "").replace(/\s*\([^)]*\)\s*/g, "").trim();
  const shak_samvat = (shakRow.description || "").replace(/\s*\([^)]*\)\s*/g, "").trim();

  // Festivals—किसी भी nested में हों
  const festivals = (raw?.festivals || [])
    .flatMap((f) => f.festivals?.map((x) => (x.festival || "").trim()) || [])
    .filter(Boolean);
  const dedupFestivals = [...new Set(festivals)];

  return {
    date: (raw?.dateDisplay || "").trim() || "14 जनवरी 2026, बुधवार",
    sunrise: times.sunrise,
    sunset: times.sunset,
    moonrise: times.moonrise,
    moonset: times.moonset,
    vikram_samvat,
    shak_samvat,
    maas: (purnRow.description || "").trim(), // पूर्णिमांत प्राथमिक
    maas_variants: {
      purnimant: (purnRow.description || "").trim(),
      amanat: (amanRow.description || "").trim(),
    },
    paksha,
    tithi,
    nakshatra: (nakRow.description || "").trim(),
    yoga: (yogRow.description || "").trim(),
    karana: (karRow.description || "").trim(),
    festivals: dedupFestivals,
    religious_message: (raw?.religious_message || "").trim(),
    source: (raw?.source || "").trim(),
  };
}

// ---------- Part 3: Endpoints ----------
app.get("/api/raw", async (req, res) => {
  try {
    const raw = await fetchRawPanchang();
    res.json(raw); // पूरा payload (debug)
  } catch (e) {
    console.error("RAW error:", e);
    res.status(500).json({ error: "raw fetch failed" });
  }
});

app.get("/api/panchang", async (req, res) => {
  try {
    const raw = await fetchRawPanchang();
    const clean = formatForPage(raw);
    res.json(clean); // फ्रंटएंड‑friendly JSON
  } catch (e) {
    console.error("Panchang error:", e);
    res.status(500).json({ error: "panchang format failed" });
  }
});

// ---------- Final: start server ----------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
