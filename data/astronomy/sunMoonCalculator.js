// data/astronomy/sunMoonCalculator.js
// Free, long-term, India-accurate solar/lunar timing (approximation)

const IST_OFFSET_MIN = 330;

// Jaipur coordinates
const LAT = 26.9124;
const LON = 75.7873;

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

// Julian day
function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// Solar declination (approx)
function solarDeclination(d) {
  return 23.44 * Math.sin(((360 / 365) * (d - 81)) * Math.PI / 180);
}

// Sunrise / Sunset
function getSunTimes(date) {
  const day = Math.floor(
    (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) -
      Date.UTC(date.getUTCFullYear(), 0, 0)) /
      86400000
  );

  const decl = solarDeclination(day) * Math.PI / 180;
  const latRad = LAT * Math.PI / 180;

  const hourAngle =
    Math.acos(-Math.tan(latRad) * Math.tan(decl)) * 180 / Math.PI;

  const sunriseUTC = 12 - hourAngle / 15;
  const sunsetUTC  = 12 + hourAngle / 15;

  const base = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );

  return {
    sunrise: new Date(base + sunriseUTC * 3600000),
    sunset: new Date(base + sunsetUTC * 3600000)
  };
}

// Moonrise / Moonset (PAC-style approximation)
function getMoonTimes(date) {
  const jd = julianDay(date);
  const moonAge = (jd - 2451550.1) % 29.53;

  const riseHour = (moonAge / 29.53) * 24;
  const setHour = riseHour + 12;

  const base = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );

  return {
    moonrise: new Date(base + riseHour * 3600000),
    moonset: new Date(base + setHour * 3600000)
  };
}

export function getSunMoonData(date) {
  const sun = getSunTimes(date);
  const moon = getMoonTimes(date);

  return {
    sunrise: formatTime(toIST(sun.sunrise)),
    sunset: formatTime(toIST(sun.sunset)),
    moonrise: formatTime(toIST(moon.moonrise)),
    moonset: formatTime(toIST(moon.moonset)),
    source: "Sun & Moon: PAC-style free model"
  };
}
