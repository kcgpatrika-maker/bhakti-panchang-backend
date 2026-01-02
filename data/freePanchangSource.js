// data/freePanchangSource.js

// Jaipur location (example – later dynamic कर सकते हैं)
const LATITUDE = 26.9124;
const LONGITUDE = 75.7873;

export async function getPanchangFromFreeSource() {
  try {
    /* ==========================
       1️⃣ Sunrise / Sunset
    ========================== */
    const dateStr = new Date().toISOString().split("T")[0];
    const sunUrl =
      `https://api.sunrise-sunset.org/json?lat=${LATITUDE}&lng=${LONGITUDE}&date=${dateStr}&formatted=0`;

    const sunRes = await fetch(sunUrl);
    const sunJson = await sunRes.json();

    const sunrise = sunJson.results?.sunrise
      ? new Date(sunJson.results.sunrise).toLocaleTimeString("hi-IN", {
          hour: "2-digit",
          minute: "2-digit"
        })
      : "—";

    const sunset = sunJson.results?.sunset
      ? new Date(sunJson.results.sunset).toLocaleTimeString("hi-IN", {
          hour: "2-digit",
          minute: "2-digit"
        })
      : "—";

    /* ==========================
       2️⃣ Tithi / Masa / Paksha
       (Drik Panchang – HTML)
    ========================== */
    const dpUrl = "https://www.drikpanchang.com/panchang/day-panchang.html";
    const dpRes = await fetch(dpUrl);
    const html = await dpRes.text();

    // Simple regex based extract (safe + light)
    const tithiMatch = html.match(/Tithi<\/td>\s*<td[^>]*>(.*?)<\/td>/i);
    const pakshaMatch = html.match(/Paksha<\/td>\s*<td[^>]*>(.*?)<\/td>/i);
    const masaMatch = html.match(/Amanta Masa<\/td>\s*<td[^>]*>(.*?)<\/td>/i);

    const clean = (v) =>
      v ? v.replace(/<[^>]+>/g, "").trim() : "—";

    const tithi = clean(tithiMatch?.[1]);
    const paksha = clean(pakshaMatch?.[1]);
    const masa = clean(masaMatch?.[1]);

    return {
      sunrise,
      sunset,
      moonrise: "—",
      moonset: "—",
      vikram_samvat: "—",
      shak_samvat: "—",
      masa,
      tithi,
      paksha,
      note: "Drik Panchang + Sunrise API (Free)"
    };

  } catch (err) {
    console.error("Free Panchang Source Error:", err);

    return {
      sunrise: "—",
      sunset: "—",
      moonrise: "—",
      moonset: "—",
      vikram_samvat: "—",
      shak_samvat: "—",
      masa: "—",
      tithi: "—",
      paksha: "—",
      note: "Free source unavailable"
    };
  }
}
