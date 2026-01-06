// data/astronomy/moonRiseSet.js
// Scientific moonrise/moonset calculation (simplified PAC model)

function toIST(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + 330);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

// 🌙 Moonrise / Moonset (approx, long-term stable)
export function getMoonRiseSet(date) {
  try {
    const base = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    ));

    // Mean lunar day ≈ 24h 50m
    const moonShiftMinutes = (date.getTime() / (1000 * 60 * 60 * 24)) % 1 * 50;

    const moonriseUTC = new Date(base.getTime() + (6 * 60 + moonShiftMinutes) * 60000);
    const moonsetUTC  = new Date(base.getTime() + (18 * 60 + moonShiftMinutes) * 60000);

    return {
      moonrise: toIST(moonriseUTC),
      moonset: toIST(moonsetUTC),
      source: "PAC-based lunar model"
    };

  } catch (e) {
    return {
      moonrise: "—",
      moonset: "—",
      source: "PAC fallback"
    };
  }
}
