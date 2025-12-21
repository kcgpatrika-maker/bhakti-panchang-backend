import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

/* =========================
   ASK BHAKTI – FINAL
   ========================= */
app.get("/api/ask-bhakti", (req, res) => {
  const { q, type } = req.query;
  if (!q || !type) {
    return res.json({ success: false });
  }

  // DEMO: शिव (बाकी देवता इसी पैटर्न पर बढ़ेंगे)
  if (q.includes("शिव")) {

    if (type === "मंत्र") {
      return res.json({
        success: true,
        title: "शिव मंत्र",
        content: "ॐ नमः शिवाय।",
        sources: [
          "https://www.sanskritdocuments.org",
          "https://archive.org"
        ]
      });
    }

    if (type === "आरती") {
      return res.json({
        success: true,
        title: "शिव आरती",
        content: `
जय शिव ओंकारा, हर शिव ओंकारा।
ब्रह्मा विष्णु सदाशिव, अर्द्धांगी धारा॥
`,
        sources: [
          "https://sanskritdocuments.org",
          "https://www.templepurohit.com"
        ]
      });
    }

    if (type === "पूजा विधि") {
      return res.json({
        success: true,
        title: "शिव पूजा विधि",
        content: `
प्रातः स्नान कर स्वच्छ वस्त्र धारण करें।
संकल्प लें – ममोपात्त समस्त दुरित क्षय द्वारा...
शिवलिंग पर जल, दूध, बेलपत्र अर्पित करें।
धूप, दीप, नैवेद्य अर्पित करें।
अंत में आरती कर प्रार्थना करें।
`,
        sources: ["AI Generated – Shastra based"]
      });
    }

    if (type === "चालीसा") {
      return res.json({
        success: true,
        title: "शिव चालीसा",
        pdf: "https://archive.org/download/shivchalisa/shivchalisa.pdf",
        sources: ["archive.org"]
      });
    }

    if (type === "स्तोत्र") {
      return res.json({
        success: true,
        title: "रुद्राष्टकम",
        pdf: "https://archive.org/download/rudrashtakam/rudrashtakam.pdf",
        sources: ["archive.org"]
      });
    }
  }

  res.json({ success: false });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Bhakti Panchang API Running"));
