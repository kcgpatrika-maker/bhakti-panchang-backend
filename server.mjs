async function fetchSriMandir(city = "jaipur", date = "2026-01-14") {
  try {
    const url = "https://www.srimandir.com/hi/panchang";
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Fetch failed:", res.status);
      return { error: "fetch failed" };
    }
    const html = await res.text();
    console.log("HTML snippet:", html.substring(0, 500)); // Debug: पहले 500 chars

    const $ = cheerio.load(html);

    function extractField(label) {
      let value = "—";
      $("p").each((i, el) => {
        const text = $(el).text().trim();
        if (text.startsWith(label)) {
          value = text.replace(label + " :", "").trim();
        }
      });
      return value;
    }

// ---------- Part 2: Formatter (collect rows, extract clean fields) ----------
function collectRows(raw) {
  const rows = [];
  const pushRows = (arr) => {
    if (Array.isArray(arr)) {
      for (const block of arr) {
        if (Array.isArray(block)) {
          for (const item of block) {
            if (item && item.title) {
              rows.push({
                title: safe(item.title),
                description: safe(item.description),
                time: safe(item.time),
              });
            }
          }
        } else if (block && block.title) {
          rows.push({
            title: safe(block.title),
            description: safe(block.description),
            time: safe(block.time),
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

function getByTitle(rows, title) {
  return rows.find((x) => safe(x.title) === title) || {};
}

function extractSunTimes(raw) {
  // Srimandir often gives combined Hindi sentence: "6:46 AM और सूर्यास्त 5:30 PM का है।"
  const combined = safe(raw?.suryodaya);
  let sunrise = "", sunset = "";

  if (combined) {
    const srMatch = combined.match(/(\d{1,2}:\d{2}\s?(AM|PM))/i);
    const ssMatch = combined.match(/सूर्यास्त\s?(\d{1,2}:\d{2}\s?(AM|PM))/i);
    if (srMatch) sunrise = srMatch[1];
    if (ssMatch) sunset = ssMatch[1];
  }

  // Fallbacks if separate keys exist
  const sr = safe(raw?.sunrise);
  const ss = safe(raw?.sunset);
  if (!sunrise && sr) sunrise = sr;
  if (!sunset && ss) sunset = ss;

  const moonrise = safe(raw?.moonrise || raw?.chandrodaya);
  const moonset = safe(raw?.moonset || raw?.chandrasta);

  return {
    sunrise,
    sunset,
    moonrise: isTime(moonrise) ? moonrise : "",
    moonset: isTime(moonset) ? moonset : "",
  };
}

function formatForPage(raw) {
  const rows = collectRows(raw);
  const times = extractSunTimes(raw);

  // Tithi + Paksha split
  const tithiDesc = safe(getByTitle(rows, "तिथि").description);
  let paksha = safe(getByTitle(rows, "पक्ष").description);
  let tithi = tithiDesc;
  const pkMatch = tithiDesc.match(/(कृष्ण|शुक्ल)\sपक्ष/);
  if (pkMatch) {
    paksha = pkMatch[0];
    tithi = tithiDesc.replace(pkMatch[0], "").trim();
  }

  // Samvat numbers only (strip names in parentheses)
  const vikramRaw = safe(getByTitle(rows, "विक्रम संवत").description);
  const shakRaw = safe(getByTitle(rows, "शक").description);
  const vikram_samvat = vikramRaw.replace(/\s*\([^)]*\)\s*/g, "").trim();
  const shak_samvat = shakRaw.replace(/\s*\([^)]*\)\s*/g, "").trim();

  // Maas: Purnimant first, Amanat optional
  const maasPurnimant = safe(getByTitle(rows, "महीना पूर्णिमांत").description);
  const maasAmanat = safe(getByTitle(rows, "महीना अमान्त").description);

  // Festivals
  const festivals = (raw?.festivals || [])
    .flatMap((f) => f.festivals?.map((x) => safe(x.festival)) || [])
    .filter(Boolean);
  const dedupFestivals = [...new Set(festivals)];

  return {
    date: safe(raw?.dateDisplay) || "14 जनवरी 2026, बुधवार",
    sunrise: times.sunrise,
    sunset: times.sunset,
    moonrise: times.moonrise,
    moonset: times.moonset,
    vikram_samvat,
    shak_samvat,
    maas: maasPurnimant, // प्राथमिकता पूर्णिमांत (जैसे "माघ")
    maas_variants: {
      purnimant: maasPurnimant,
      amanat: maasAmanat,
    },
    paksha,
    tithi,
    nakshatra: safe(getByTitle(rows, "नक्षत्र").description),
    yoga: safe(getByTitle(rows, "योग").description),
    karana: safe(getByTitle(rows, "करण").description),
    festivals: dedupFestivals,
    religious_message: safe(raw?.religious_message) || "",
    source: safe(raw?.source) || SRIMANDIR_URL,
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
