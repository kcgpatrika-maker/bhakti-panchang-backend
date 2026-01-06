import https from "https";

/**
 * Simple HTML fetcher
 */
function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

/**
 * Text extractor helper
 */
function extractBetween(html, start, end) {
  const s = html.indexOf(start);
  if (s === -1) return null;
  const e = html.indexOf(end, s + start.length);
  if (e === -1) return null;
  return html
    .substring(s + start.length, e)
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * MAIN: Drik Panchang fetch
 */
export async function getDrikPanchang(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  // Jaipur geo-id (can change later)
  const url = `https://www.drikpanchang.com/panchang/day-panchang.html?date=${dd}/${mm}/${yyyy}&geoname-id=1269515`;

  const html = await fetchHTML(url);

  // VERY BASIC & SAFE extraction
  const tithi = extractBetween(html, "Tithi</span>", "</li>");
  const paksha = extractBetween(html, "Paksha</span>", "</li>");
  const masa = extractBetween(html, "Amanta Month</span>", "</li>");

  const sunrise = extractBetween(html, "Sunrise</span>", "</li>");
  const sunset = extractBetween(html, "Sunset</span>", "</li>");
  const moonrise = extractBetween(html, "Moonrise</span>", "</li>");
  const moonset = extractBetween(html, "Moonset</span>", "</li>");

  return {
    tithi: tithi || "—",
    paksha: paksha || "—",
    masa: masa || "—",
    sunrise: sunrise || "—",
    sunset: sunset || "—",
    moonrise: moonrise || "—",
    moonset: moonset || "—",
    source: "Drik Panchang (Auto Fetch)"
  };
}
