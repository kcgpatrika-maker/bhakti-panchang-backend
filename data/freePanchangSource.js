// data/freePanchangSource.js

const LATITUDE = 26.9124;   // Jaipur
const LONGITUDE = 75.7873;

export async function getPanchangFromFreeSource() {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    // 🌙 Moonrise / Moonset (MET.no – free, no key)
    const moonUrl = `https://api.met.no/weatherapi/sunrise/3.0/moon?lat=${LATITUDE}&lon=${LONGITUDE}&date=${dateStr}&offset=+05:30`;

    const moonRes = await fetch(moonUrl, {
      headers: { "User-Agent": "BhaktiPanchang/1.0" }
    });

    const moonJson = await moonRes.json();

    const moonrise =
      moonJson?.location?.time?.[0]?.moonrise?.time?.slice(11, 16) ?? "—";

    const moonset =
      moonJson?.location?.time?.[0]?.moonset?.time?.slice(11, 16) ?? "—";

    return {
      sunrise: null,
      sunset: null,
      moonrise,
      moonset,
      note: "MET.no Moon API (Free)"
    };

  } catch (err) {
    console.error("Moon API error:", err);
    return {
      sunrise: null,
      sunset: null,
      moonrise: "—",
      moonset: "—",
      note: "Moon data unavailable"
    };
  }
}
