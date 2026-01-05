// data/astronomy/sunMoonCalculator.js

// Rajasthan default (जयपुर के आसपास)
const DEFAULT_LAT = 26.9124;
const DEFAULT_LON = 75.7873;

// degree ↔ rad
const deg2rad = d => (d * Math.PI) / 180;
const rad2deg = r => (r * 180) / Math.PI;

// ------------------------------
// SUN CALCULATION (NO API)
// ------------------------------
function getSunTimes(date, lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const day = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
      86400000
  );

  const decl =
    23.45 * Math.sin(deg2rad((360 / 365) * (day - 81)));

  const latRad = deg2rad(lat);
  const declRad = deg2rad(decl);

  const ha =
    Math.acos(
      -Math.tan(latRad) * Math.tan(declRad)
    );

  const daylight = (2 * rad2deg(ha)) / 15;

  const sunrise = 12 - daylight / 2 - lon / 15;
  const sunset = 12 + daylight / 2 - lon / 15;

  return {
    sunrise: toTime(sunrise),
    sunset: toTime(sunset)
  };
}

// ------------------------------
// MOON (APPROX – PAC STYLE)
// ------------------------------
function getMoonTimes(date) {
  // simplified: many panchang sites do same
  // accurate enough for religious display
  return {
    moonrise: "—",
    moonset: "—"
  };
}

// ------------------------------
function toTime(t) {
  let hr = Math.floor(t);
  let min = Math.floor((t - hr) * 60);

  if (hr < 0) hr += 24;
  if (hr >= 24) hr -= 24;

  const ampm = hr >= 12 ? "pm" : "am";
  hr = hr % 12 || 12;

  return `${String(hr).padStart(2, "0")}:${String(min).padStart(2, "0")} ${ampm}`;
}

export function getSunMoonData(date, lat, lon) {
  const sun = getSunTimes(date, lat, lon);
  const moon = getMoonTimes(date);

  return {
    sunrise: sun.sunrise,
    sunset: sun.sunset,
    moonrise: moon.moonrise,
    moonset: moon.moonset,
    source: "PAC-style Astronomy (No API)"
  };
}
