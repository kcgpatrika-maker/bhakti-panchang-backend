// data/freePanchangSource.js

const LATITUDE = 26.9124;   // Jaipur
const LONGITUDE = 75.7873;

export async function getPanchangFromFreeSource() {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

    const url =
      `https://api.sunrise-sunset.org/json?lat=${LATITUDE}&lng=${LONGITUDE}&date=${dateStr}&formatted=0`;

    const res = await fetch(url);
    const json = await res.json();

    if (json.status !== "OK") {
      throw new Error("Sunrise API failed");
    }

    function toIST(utcString) {
  const utcDate = new Date(utcString);
  const istTime = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));

  return istTime.toLocaleTimeString("hi-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

    return {
      sunrise: toIST(json.results.sunrise),
      sunset: toIST(json.results.sunset),
      moonrise: "—",
      moonset: "—",
      note: "Sunrise-Sunset.org (Free)"
    };
  } catch (err) {
    console.error("Free Panchang error:", err);
    return {
      sunrise: "—",
      sunset: "—",
      moonrise: "—",
      moonset: "—",
      note: "Free source unavailable"
    };
  }
}
