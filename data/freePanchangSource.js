// data/freePanchangSource.js

const LAT = 26.9124;   // Jaipur
const LON = 75.7873;

export async function getPanchangFromFreeSource() {
  try {
    const date = new Date().toISOString().split("T")[0];

    // 🌅 Sunrise / Sunset
    const sunRes = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${LAT}&lng=${LON}&date=${date}&formatted=0`
    );
    const sunJson = await sunRes.json();

    // 🌙 Moonrise / Moonset (MET.no)
    const moonRes = await fetch(
      `https://api.met.no/weatherapi/sunrise/3.0/?lat=${LAT}&lon=${LON}&date=${date}&offset=+05:30`
    );
    const moonJson = await moonRes.json();
    const moon = moonJson.location?.time?.[0];

    return {
      sunrise: sunJson.results.sunrise,
      sunset: sunJson.results.sunset,
      moonrise: moon?.moonrise?.time ?? "—",
      moonset: moon?.moonset?.time ?? "—",
      note: "Sunrise-Sunset.org + MET.no (Free)"
    };

  } catch (err) {
    console.error("Panchang free source error:", err);
    return {
      sunrise: "—",
      sunset: "—",
      moonrise: "—",
      moonset: "—",
      note: "Free source unavailable"
    };
  }
}
