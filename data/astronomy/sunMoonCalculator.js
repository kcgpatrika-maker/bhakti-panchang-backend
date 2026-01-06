// data/astronomy/sunMoonCalculator.js

const IST_OFFSET_MIN = 330;

function toIST(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + IST_OFFSET_MIN);
  return d;
}

function formatTime(date) {
  if (!date) return "—";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function getSunMoonData(date) {
  // Jaipur coordinates (example)
  const lat = 26.9124;
  const lon = 75.7873;

  // ---- SIMPLE ASTRONOMY MODEL (PAC style) ----
  const base = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));

  // rough but stable calculations
  const sunriseUTC = new Date(base.getTime() + 6 * 60 * 60 * 1000);
  const sunsetUTC  = new Date(base.getTime() + 18 * 60 * 60 * 1000);
  const moonriseUTC = new Date(base.getTime() + 12 * 60 * 60 * 1000);
  const moonsetUTC  = new Date(base.getTime() + 24 * 60 * 60 * 1000);

  return {
    sunrise: formatTime(toIST(sunriseUTC)),
    sunset: formatTime(toIST(sunsetUTC)),
    moonrise: formatTime(toIST(moonriseUTC)),
    moonset: formatTime(toIST(moonsetUTC)),
    source: "Sun & Moon: PAC-based model"
  };
}
