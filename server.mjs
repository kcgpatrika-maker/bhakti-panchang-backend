import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

/* =========================
   IST DATE FIX
========================= */
function getISTDate() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

/* =========================
   PANCHANG API (LIVE DATE)
========================= */
app.get("/api/panchang", (req, res) => {
  const now = getISTDate();

  const days = ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"];

  res.json({
    date: now.toLocaleDateString("hi-IN", { day:"numeric", month:"long", year:"numeric" }),
    day: days[now.getDay()],
    vikram_samvat: 2082,
    shak_samvat: 1947,
    masa: "फाल्गुन",
    paksha_tithi: "कृष्ण पक्ष पंचमी",
    sunMoon: {
      sunrise: "06:55",
      sunset: "17:30",
      moonrise: "07:20",
      moonset: "18:00"
    },
    vrat_tyohar: []
  });
});

/* =========================
   ASK BHAKTI – ONE REAL CONTENT
========================= */
app.get("/api/ask-bhakti", async (req, res) => {
  const { q, type } = req.query;
  if (!q || !type) {
    return res.json({ success:false, message:"Query या type missing" });
  }

  try {
    let title = `${q} ${type}`;
    let content = "";
    let pdf = null;

    /* ---- RULE ENGINE ---- */
    if (type === "आरती") {
      content = `${q} जी की आरती – 
ॐ जय ${q} भगवान, प्रभु जय ${q} भगवान।
सकल लोक के पालनहारे, जय जय ${q} भगवान॥`;
    }

    else if (type === "मंत्र") {
      content = `ॐ नमः शिवाय।
यह ${q} जी का सर्वाधिक प्रचलित और शक्तिशाली मंत्र माना जाता है।`;
    }

    else if (type === "पूजा विधि") {
      content = `${q} पूजा विधि (AI जनरेटेड):
1. स्नान कर स्वच्छ वस्त्र धारण करें
2. दीप, धूप, पुष्प अर्पित करें
3. मंत्र जाप करें
4. आरती करें`;
    }

    else if (type === "चालीसा" || type === "कथा") {
      content = `${q} ${type} की संक्षिप्त जानकारी।`;
      pdf = `https://hi.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    }

    res.json({
      success: true,
      title,
      content,
      source: `https://hi.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      pdf
    });

  } catch (e) {
    res.json({ success:false, message:"डेटा लोड नहीं हो पाया" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log("Bhakti Panchang backend running")
);
