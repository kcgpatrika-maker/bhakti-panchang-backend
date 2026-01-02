// data/freePanchangSource.js

import fetch from "node-fetch";

// Coordinates for Jaipur, India (example)
const LATITUDE = 26.9124;
const LONGITUDE = 75.7873;

export async function getPanchangFromFreeSource() {
  try {
    // 1) Sunrise & Sunset from free API
    const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const url = `https://api.sunrise-sunset.org/json?lat=${LATITUDE}&lng=${LONGITUDE}&date=${dateStr}&formatted=1`;

    const response = await fetch(url);
    const json = await response.json();

    const sunrise = json.results?.sunrise || null;
    const sunset = json.results?.sunset || null;

    // 2) Placeholder values for now
    const moonrise = "—";
    const moonset = "—";
    const vikram_samvat = "—";
    const shak_samvat = "—";
    const masa = "—";
    const tithi = "तिथि जानकारी अपडेट प्रक्रिया में है";
    const paksha = "—";

    return {
      sunrise,
      sunset,
      moonrise,
      moonset,
      vikram_samvat,
      shak_samvat,
      masa,
      tithi,
      paksha,
      note: "Sunrise-Sunset API से डेटा"
    };
  } catch (err) {
    console.error("Free Source fetch error:", err);
    return {
      sunrise: null,
      sunset: null,
      moonrise: null,
      moonset: null,
      vikram_samvat: null,
      shak_samvat: null,
      masa: null,
      tithi: null,
      paksha: null,
      note: "Free source unavailable"
    };
  }
}
