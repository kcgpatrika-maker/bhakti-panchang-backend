import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import cron from "node-cron";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SOURCE_URL = "https://www.srimandir.com/hi/panchang";

// In-memory cache
let CACHE = {
  data: null,
  updatedAt: null
};

// Helper: fetch with timeout using AbortController
async function fetchWithTimeout(url, ms = 20000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// Helper: scrape and shape JSON
async function scrapePanchang() {
  const res = await fetchWithTimeout(SOURCE_URL, 20000);
  if (!res.ok) throw new Error(`Source fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Resilient selectors—adjust if needed to match real DOM
  const date = $("meta[property='og:title']").attr("content")?.trim()
    || $(".panchang-date").text().trim()
    || new Date().toLocaleDateString("hi-IN");

  const day = new Date().toLocaleDateString("hi-IN", { weekday: "long" });

  const sunrise = $(".sunrise").text().trim()
    || $("div:contains('सूर्योदय')").next().text().trim()
    || "—";

  const sunset = $(".sunset").text().trim()
    || $("div:contains('सूर्यास्त')").next().text().trim()
    || "—";

  const moonrise = $(".moonrise").text().trim()
    || $("div:contains('चंद्रोदय')").next().text().trim()
    || "—";

  const moonset = $(".moonset").text().trim()
    || $("div:contains('चंद्रास्त')").next().text().trim()
    || "—";

  const vikramSamvat = $("div:contains('विक्रम संवत')").next().text().trim() || "—";
  const shakaSamvat  = $("div:contains('शक संवत')").next().text().trim() || "—";

  const month  = $("div:contains('मास')").next().text().trim() || "—";
  const paksha = $("div:contains('पक्ष')").next().text().trim() || "—";
  const tithi  = $("div:contains('तिथि')").next().text().trim() || "—";

  const festivalList = [];
  $(".festival-item, li:contains('व्रत'), li:contains('त्योहार')").each((_, el) => {
    const txt = $(el).text().trim();
    if (txt) festivalList.push(txt);
  });

  return {
    date,
    day,
    sunrise,
    sunset,
    moonrise,
    moonset,
    vikramSamvat,
    shakaSamvat,
    month,
    paksha,
    tithi,
    festivalList,
    source: "Bhakti Panchang API"
  };
}

// Refresh cache (used by cron and manual endpoint)
async function refreshCache() {
  const data = await scrapePanchang();
  CACHE = { data, updatedAt: new Date().toISOString() };
  return CACHE;
}

// API: serve from cache, refresh if empty
app.get("/api/panchang", async (req, res) => {
  try {
    if (!CACHE.data) {
      await refreshCache();
    }
    res.set("Cache-Control", "public, max-age=300"); // 5 min client cache
    res.json(CACHE.data);
  } catch (err) {
    console.error("API /api/panchang error:", err.message);
    if (CACHE.data) {
      res.set("Cache-Control", "no-cache");
      return res.json(CACHE.data); // serve stale cache
    }
    res.status(500).json({ error: "Panchang fetch failed" });
  }
});

// Admin: manual refresh (token-protected)
app.post("/admin/refresh", async (req, res) => {
  const token = req.headers["x-refresh-token"];
  const EXPECTED = process.env.REFRESH_TOKEN || "bhakti-refresh";
  if (token !== EXPECTED) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const updated = await refreshCache();
    res.json({ ok: true, updatedAt: updated.updatedAt });
  } catch (err) {
    console.error("Manual refresh error:", err.message);
    res.status(500).json({ error: "Refresh failed" });
  }
});

// Cron: refresh daily at 00:10 IST (Asia/Kolkata)
cron.schedule("10 0 * * *", async () => {
  try {
    console.log("[CRON] Refreshing Panchang cache…");
    await refreshCache();
    console.log("[CRON] Cache updated at", CACHE.updatedAt);
  } catch (err) {
    console.error("[CRON] Refresh failed:", err.message);
  }
}, { timezone: "Asia/Kolkata" });

app.get("/", (req, res) => {
  res.json({
    ok: true,
    cacheUpdatedAt: CACHE.updatedAt,
    hint: "Use /api/panchang for data"
  });
});

app.listen(PORT, () => {
  console.log(`Bhakti Panchang backend running on port ${PORT}`);
});
