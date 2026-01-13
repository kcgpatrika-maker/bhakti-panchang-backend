import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

let cachedPanchang = null;

// Helper: regex extractor
function extract(label, html) {
  const regex = new RegExp(`${label}[^:]*:?\\s*([A-Za-z0-9\\s]+)`, "i");
  const match = html.match(regex);
  return match ? match[1].trim() : "—";
}

// Fetch from News18 (tithi, nakshatra, yoga, rahukaal)
async function fetchNews18() {
  try {
    const res = await fetch("https://www.news18.com/astrology/panchang-today-january-13-2026-tithi-nakshatra-rahu-kaal-ws-e-9824552.html");
    if (!res.ok) return null;
    const html = await res.text();

    return {
      tithi: extract("Tithi", html),
      nakshatra: extract("Nakshatra", html),
      yoga: extract("Yoga", html),
      rahukaal: extract("Rahu Kaal", html),
      source: "news18.com"
    };
  } catch (err) {
    console.error("News18 fetch error:", err);
    return null;
  }
}

// Fetch from SriMandir (sunrise, sunset, moonrise, moonset)
async function fetchSriMandir() {
  try {
    const res = await fetch("https://www.srimandir.com/panchang/date/13-01-2026");
    if (!res.ok) return null;
    const html = await res.text();

    return {
      sunrise: extract("Sunrise", html),
      sunset: extract("Sunset", html),
      moonrise: extract("Moonrise", html),
      moonset: extract("Moonset", html),
      source: "srimandir.com"
    };
  } catch (err) {
    console.error("SriMandir fetch error:", err);
    return null;
  }
}

// Combined Panchang fetch
async function fetchPanchang() {
  const news18 = await fetchNews18();
  const srimandir = await fetchSriMandir();

  return {
    date: new Date().toISOString().slice(0,10),
    sunrise: srimandir?.sunrise || "—",
    sunset: srimandir?.sunset || "—",
    moonrise: srimandir?.moonrise || "—",
    moonset: srimandir?.moonset || "—",
    tithi: news18?.tithi || "—",
    nakshatra: news18?.nakshatra || "—",
    yoga: news18?.yoga || "—",
    rahukaal: news18?.rahukaal || "—",
    source: `${news18?.source || ""}, ${srimandir?.source || ""}`
  };
}

// Midnight scheduler
function scheduleMidnightFetch() {
  const now = new Date();
  const millisTillMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 5, 0, 0
  ) - now;

  setTimeout(async function() {
    cachedPanchang = await fetchPanchang();
    scheduleMidnightFetch();
  }, millisTillMidnight);
}

// API endpoint
app.get("/api/panchang", async (req, res) => {
  if (!cachedPanchang) {
    cachedPanchang = await fetchPanchang();
  }
  res.json(cachedPanchang);
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  cachedPanchang = await fetchPanchang();
  scheduleMidnightFetch();
});
