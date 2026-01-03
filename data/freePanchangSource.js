function formatIST(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  d.setMinutes(d.getMinutes() + 330);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export async function getMoonData() {
  try {
    const url =
      "https://api.met.no/weatherapi/sunrise/3.0/moon?lat=26.9124&lon=75.7873";

    const res = await fetch(url, {
      headers: { "User-Agent": "Bhakti-Panchang-App" }
    });

    const json = await res.json();
    const today = json.location.time[0];

    return {
      moonrise: formatIST(today.moonrise?.time),
      moonset: formatIST(today.moonset?.time)
    };

  } catch (e) {
    console.error("Moon API error", e);
    return {
      moonrise: "—",
      moonset: "—"
    };
  }
}
