import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

/* ======= PANCHANG API ======= */
app.get("/api/panchang", async (req, res) => {
  // आप यहां लाइव API या स्थायी JSON का इस्तेमाल कर सकते हैं
  const panchang = {
    date: "20 दिसंबर 2025",
    day: "शनिवार",
    sunMoon: {
      sunrise: "06:55",
      sunset: "17:30",
      moonrise: "07:20",
      moonset: "18:00"
    },
    vikram_samvat: 2082,
    shak_samvat: 1947,
    masa: "फाल्गुन",
    paksha_tithi: "कृष्ण पक्ष पंचमी",
    vrat_tyohar: ["कोई विशेष व्रत नहीं"]
  };
  res.json(panchang);
});

/* ======= ASK BHAKTI API ======= */
app.get("/api/ask-bhakti", async (req, res) => {
  const query = req.query.q;       // देवता/त्योहार का नाम
  const type = req.query.type;     // आरती, मंत्र, पूजा विधि, आदि

  if(!query || !type) {
    return res.json({ success:false, message:"Query या type missing" });
  }

  try {
    // AI / Predefined / Wikipedia फ्री कंटेंट fallback
    const searchUrl = `https://hi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    let content = "इस विषय की जानकारी उपलब्ध नहीं है।";

    if(data.extract) content = data.extract;

    // PDF या alternate link (सिर्फ उदाहरण)
    let pdfLink = null;
    if(type === "चालीसा") pdfLink = `https://www.sacred-texts.com/hin/${query}-chalisa.pdf`;
    if(type === "स्तोत्र") pdfLink = `https://www.sacred-texts.com/hin/${query}-stotra.pdf`;

    res.json({
      success:true,
      title: query + " " + type,
      content: content,
      source: searchUrl,
      pdf: pdfLink
    });

  } catch(err) {
    res.json({ success:false, message:"डेटा लोड नहीं हो पाया", source:null });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log("Bhakti Panchang backend running"));
