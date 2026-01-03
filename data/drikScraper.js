// data/drikScraper.js

export async function getDrikPanchangToday() {
  try {
    const url = "https://www.drikpanchang.com/panchang/day-panchang.html?geoname-id=1269515";

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = await res.text();

    // तिथि
    const tithiMatch = html.match(/Tithi<\/td>\s*<td[^>]*>(.*?)<\/td>/i);
    const tithi = tithiMatch ? tithiMatch[1].replace(/<[^>]+>/g, "").trim() : null;

    // मास
    const masaMatch = html.match(/Amanta Masa<\/td>\s*<td[^>]*>(.*?)<\/td>/i);
    const masa = masaMatch ? masaMatch[1].replace(/<[^>]+>/g, "").trim() : null;

    return {
      masa,
      tithi,
      source: "Drik Panchang (Free Scrape)"
    };

  } catch (err) {
    console.error("Drik scrape failed", err);
    return null;
  }
}
