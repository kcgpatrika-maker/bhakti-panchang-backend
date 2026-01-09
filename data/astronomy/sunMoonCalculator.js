// Simple, stable sunrise/sunset (Jaipur fixed)
// No external API, no fetch

export function getSunMoonData(date) {
  // Jaipur approx times (IST) – stable & predictable
  return {
    sunrise: "06:45 am",
    sunset: "05:45 pm",
    moonrise: "Auto model",
    moonset: "Auto model",
    source: "Offline Sunrise-based Panchang"
  };
}
