import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

/* =================================
   ASK-BHAKTI MASTER DATA (FREE)
   ================================= */

const BHAKTI_DB = {
  "शिव": {
    mantra: {
      title: "ॐ नमः शिवाय",
      content: `ॐ नमः शिवाय।
यह पंचाक्षरी मंत्र भगवान शिव का सर्वाधिक प्रचलित मंत्र है।
इसका जप शांति, वैराग्य और आत्मशुद्धि प्रदान करता है।`,
      sources: [
        "https://www.sanskritdocuments.org",
        "https://kavitakosh.org"
      ]
    },

    aarti: {
      title: "शिव आरती",
      content: `जय शिव ओंकारा, ॐ जय शिव ओंकारा।
ब्रह्मा, विष्णु, सदाशिव, अर्द्धांगी धारा॥`,
      sources: [
        "https://kavitakosh.org"
      ]
    },

    puja: {
      title: "शिव पूजा विधि (मंत्रोक्त)",
      content: `1. स्नान कर स्वच्छ वस्त्र धारण करें।
2. संकल्प लें – मम सर्वाभीष्ट सिद्ध्यर्थं शिव पूजनं करिष्ये।
3. ॐ नमः शिवाय मंत्र से आह्वान।
4. जल, दूध, बेलपत्र अर्पण।
5. धूप–दीप–नैवेद्य।
6. शिव आरती।
7. क्षमा प्रार्थना।`,
      sources: [
        "https://www.sanskritdocuments.org"
      ]
    },

    chalisa: {
      title: "शिव चालीसा",
      content: `जय गिरिजा पति दीन दयाला।
सदा करत सन्तन प्रतिपाला॥`,
      sources: [
        "https://kavitakosh.org"
      ],
      pdf: "https://archive.org/download/shiv_chalisa/shiv_chalisa.pdf"
    },

    stotra: {
      title: "शिव तांडव स्तोत्र",
      content: `जटाटवीगलज्जलप्रवाहपावितस्थले
गलेऽवलम्ब्य लम्बितां भुजंगतुंगमालिकाम्॥`,
      sources: [
        "https://www.sanskritdocuments.org"
      ],
      pdf: "https://archive.org/download/shiv_tandav_stotram/shiv_tandav_stotram.pdf"
    }
  }
};

/* =================================
   ALL-IN-ONE ASK-BHAKTI API
   ================================= */

app.get("/api/ask-bhakti-all", (req, res) => {
  const q = (req.query.q || "").trim();

  if (!q || !BHAKTI_DB[q]) {
    return res.json({
      success: false,
      message: "डेटा उपलब्ध नहीं"
    });
  }

  res.json({
    success: true,
    deity: q,
    data: BHAKTI_DB[q]
  });
});

/* =================================
   SERVER START
   ================================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`Ask-Bhakti backend running on port ${PORT}`)
);
