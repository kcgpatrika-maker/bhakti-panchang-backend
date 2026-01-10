// data/prokerala/fetchProkeralaPanchang.js
import * as cheerio from "cheerio";

export async function fetchProkeralaPanchang(dateISO) {
  // dateISO = "2026-01-10"
  const url = `https://www.prokerala.com/astrology/panchang/aaj-ka-panchang.html?date=${dateISO}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!res.ok) {
    throw new Error("Prokerala fetch failed");
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  /* ===============================
     DATA EXTRACTION
  =============================== */

  function getValue(label) {
    let value = "—";
    $("table tr").each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length === 2) {
        const key = $(tds[0]).text().trim();
        if (key.includes(label)) {
          value = $(tds[1]).text().trim();
        }
      }
    });
    return value;
  }

  const sunrise = getValue("सूर्योदय");
  const sunset = getValue("सूर्यास्त");
  const moonrise = getValue("चन्द्रोदय");
  const moonset = getValue("चन्द्रास्त");

  const vikram = getValue("विक्रम संवत");
  const shak = getValue("शक सम्वत");

  const masaPurnimant = getValue("पूर्णिमांत");
  const masaAmant = getValue("अमांत");

  const tithiBlock = $("h3:contains('तिथि')").next().text().trim();

  return {
    sunrise,
    sunset,
    moonrise,
    moonset,
    vikram_samvat: vikram,
    shak_samvat: shak,
    masa_purnimant: masaPurnimant,
    masa_amant: masaAmant,
    tithi_raw: tithiBlock,
    source: "prokerala.com"
  };
}
