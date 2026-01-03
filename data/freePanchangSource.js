function formatIST(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  d.setMinutes(d.getMinutes() + 330);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export async function getPanchangFromFreeSource() {
  let sunrise = "—", sunset = "—";
  let moonrise = "—", moonset = "—";
  let note = [];

  // ☀️ SUN
  try {
    const sunUrl =
      "https://api.sunrise-sunset.org/json?lat=26.9124&lng=75.7873&formatted=0";
    const sunRes = await fetch(sunUrl);
    const sunJson = await sunRes.json();

    sunrise = formatIST(sunJson.results.sunrise);
    sunset  = formatIST(sunJson.results.sunset);
    note.push("Sunrise-Sunset.org");
  } catch {}

  // 🌙 MOON (best free attempt)
  try {
    const moonUrl =
      "https://api.met.no/weatherapi/sunrise/3.0/moon?lat=26.9124&lon=75.7873";
    const moonRes = await fetch(moonUrl, {
      headers: { "User-Agent": "Bhakti-Panchang" }
    });
    const moonJson = await moonRes.json();
    const t = moonJson.location?.time?.[0];

    moonrise = formatIST(t?.moonrise?.time);
    moonset  = formatIST(t?.moonset?.time);
    note.push("MET.no Moon");
  } catch {}

  return {
    sunrise,
    sunset,
    moonrise,
    moonset,
    note: note.join(" + ") || "Free source unavailable"
  };
}
