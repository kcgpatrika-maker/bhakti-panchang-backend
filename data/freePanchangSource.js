function formatIST(utcString) {
  const date = new Date(utcString);

  // IST offset = +5:30
  date.setMinutes(date.getMinutes() + 330);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export async function getPanchangFromFreeSource() {
  try {
    const res = await fetch(
      "https://api.sunrise-sunset.org/json?lat=26.9124&lng=75.7873&formatted=0"
    );

    const data = await res.json();
    const r = data.results;

    return {
      sunrise: formatIST(r.sunrise),
      sunset: formatIST(r.sunset),
      moonrise: "—",
      moonset: "—",
      note: "Sunrise-Sunset.org (Free)"
    };

  } catch (err) {
    console.error("Free source error:", err);
    return {
      sunrise: "—",
      sunset: "—",
      moonrise: "—",
      moonset: "—",
      note: "Free source unavailable"
    };
  }
}
