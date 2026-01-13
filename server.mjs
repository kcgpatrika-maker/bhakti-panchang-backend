import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

let cachedPanchang = null;

// Gurdeep fetch (via Puppeteer)
async function fetchGurdeep() {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto("https://www.profgurdeeparora.com/panchang/today", {
      waitUntil: "networkidle2"
    });

    const dataMap = await page.evaluate(() => {
      let map = {};
      document.querySelectorAll("table tr").forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 2) {
          const title = cells[0].innerText.trim();
          const value = cells[1].innerText.trim();
          map[title] = value;
        }
      });
      return map;
    });

    await browser.close();

    return {
      date: new Date().toISOString().slice(0,10),
      sunrise: dataMap["Sun Rise Time"] || "—",
      sunset: dataMap["Sun Set Time"] || "—",
      moonrise: dataMap["Moon Rise"] || "—",
      moonset: dataMap["Moon Set"] || "—",
      tithi: dataMap["Tithi"] || "—",
      paksha: dataMap["Paksha"] || "—",
      masa: dataMap["Hindu Month"] || "—",
      vikram_samvat: dataMap["Vikram Samvat"] || "—",
      source: "profgurdeeparora.com (via Puppeteer)"
    };
  } catch (err) {
    console.error("Gurdeep fetch error:", err);
    return null;
  }
}

// Fallback fetch (AstroShade – only tithi/paksha/masa)
async function fetchFallback() {
  try {
    const res = await fetch("https://www.astrosage.com/panchang/");
    if (!res.ok) return null;
    const html = await res.text();

    // Simple regex for fallback
    function extract(label) {
      const regex = new RegExp(`${label}\\s*:?\\s*([^<]+)<`, "i");
      const match = html.match(regex);
      return match ? match[1].trim() : "—";
    }

    return {
      date: new Date().toISOString().slice(0,10),
      sunrise: "—",
      sunset: "—",
      moonrise: "—",
      moonset: "—",
      tithi: extract("Tithi"),
      paksha: extract("Paksha"),
      masa: extract("Month"),
      vikram_samvat: "—",
      source: "astrosage.com (fallback)"
    };
  } catch {
    return null;
  }
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
    cachedPanchang = await fetchGurdeep();
    if (!cachedPanchang) {
      cachedPanchang = await fetchFallback();
    }
    scheduleMidnightFetch(); // reschedule for next midnight
  }, millisTillMidnight);
}

// API endpoint
app.get("/api/panchang", (req, res) => {
  if (cachedPanchang) {
    res.json(cachedPanchang);
  } else {
    res.json({ note: "Data not yet fetched" });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  cachedPanchang = await fetchGurdeep();
  if (!cachedPanchang) {
    cachedPanchang = await fetchFallback();
  }
  scheduleMidnightFetch();
});
