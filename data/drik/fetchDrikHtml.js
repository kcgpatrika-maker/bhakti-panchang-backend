// data/drik/fetchDrikHtml.js

export async function fetchDrikHtml() {
  const url = "https://www.drikpanchang.com/panchang/day-panchang.html";

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
      "Accept-Language": "hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7",
      "Referer": "https://www.drikpanchang.com/"
    }
  });

  if (!res.ok) {
    throw new Error("Drik Panchang fetch failed: " + res.status);
  }

  return await res.text();
}
