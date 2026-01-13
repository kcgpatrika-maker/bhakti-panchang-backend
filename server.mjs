import express from "express";
import { fetchTMP } from "./data/masaCalculator.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Helper: हिंदी में तारीख़ format करना
function formatHindiDate(dateISO) {
  const days = ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"];
  const months = ["जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];

  const d = new Date(dateISO);
  const dayName = days[d.getDay()];
  const monthName = months[d.getMonth()];
  const dayNum = d.getDate();

  return `${dayNum} ${monthName} ${d.getFullYear()} | ${dayName}`;
}

// Panchang API endpoint
app.get("/api/panchang", async (req, res) => {
  try {
    const dateISO = req.query.date || new Date().toISOString().slice(0,10);
    const display_date = formatHindiDate(dateISO);

    // Panchang तिथि/मास/पक्ष निकालना
    const tmp = await fetchTMP(dateISO);

    // Example static values (तुम चाहो तो इन्हें dynamic कर सकते हो)
    const sunrise = "07:17";
    const sunset = "17:52";
    const moonrise = "09:20";
    const moonset = "20:25";
    const vikram_samvat = "2082";
    const shak_samvat = "1947";

    res.json({
      date: dateISO,
      display_date,
      sunrise,
      sunset,
      moonrise,
      moonset,
      vikram_samvat,
      shak_samvat,
      panchang: {
        tithi: tmp.tithi,
        paksha: tmp.paksha,
        masa: tmp.masa
      },
      source: tmp.sourceNote,
      note: tmp.sourceNote
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
