import express from "express";
import cors from "cors";
import bhaktiData from "./data/bhakti-mantra-aarti.json";
const BHAKTI_DB = bhaktiData;
const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   BASIC HELPERS
========================= */
function pad(n) {
  return n.toString().padStart(2, "0");
}

function getHindiMonth(i) {
  return [
    "जनवरी","फरवरी","मार्च","अप्रैल","मई","जून",
    "जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"
  ][i];
}

/* =========================
   TITHI + MAAS (AUTO TABLE)
   (यह कैल्कुलेशन नहीं,
   भरोसेमंद पंचांग-टेबल है)
========================= */
const tithiTable2025 = {
  "12-23": { masa: "पौष", tithi: "शुक्ल पक्ष तृतीया" },
  "12-24": { masa: "पौष", tithi: "शुक्ल पक्ष चतुर्थी" }
  // आगे जरूरत अनुसार जोड़ते जायेंगे
};

/* =========================
   PANCHANG CORE
========================= */
function getPanchang() {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const dd = pad(now.getDate());
  const mm = pad(now.getMonth() + 1);
  const yyyy = now.getFullYear();

  const key = `${mm}-${dd}`;

  const tithiInfo = tithiTable2025[key] || {
    masa: "पौष",
    tithi: "जानकारी उपलब्ध नहीं"
  };

  return {
    date: `${dd} ${getHindiMonth(now.getMonth())} ${yyyy}`,
    day: now.toLocaleDateString("hi-IN", { weekday: "long" }),

    sunMoon: {
      sunrise: "06:55",
      sunset: "17:42",
      moonrise: "19:10",
      moonset: "07:30"
    },

    vikram_samvat: 2082,
    shak_samvat: 1947,

    masa: tithiInfo.masa,
    paksha_tithi: tithiInfo.tithi,

    festivalList: ["कोई विशेष व्रत नहीं"]
  };
}
/* =================================
   ASK-BHAKTI MASTER DATA (FREE)
   ================================= */

const BHAKTI_DB = {
  "शिव": {
    "mantra": [
      "ॐ नमः शिवाय।",
      "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात्॥"
    ],
    "aarti": "जय शिव ओंकारा, ॐ जय शिव ओंकारा। ब्रह्मा, विष्णु, सदाशिव, अर्द्धांगी धारा॥"
  },

  "राम": {
    "mantra": [
      "श्रीराम राम रामेति रमे रामे मनोरमे। सहस्रनाम तत्तुल्यं रामनाम वरानने॥",
      "ॐ श्री रामाय नमः।"
    ],
    "aarti": "श्री रामचन्द्र कृपालु भजमन हरण भवभय दारुणम्॥"
  },

  "कृष्ण": {
    "mantra": [
      "ॐ नमो भगवते वासुदेवाय।",
      "हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे। हरे राम हरे राम राम राम हरे हरे॥"
    ],
    "aarti": "ॐ जय जगदीश हरे, स्वामी जय जगदीश हरे॥"
  },

  "विष्णु": {
    "mantra": [
      "ॐ नमो नारायणाय।",
      "शान्ताकारं भुजगशयनं पद्मनाभं सुरेशम्॥"
    ],
    "aarti": "ॐ जय जगदीश हरे, स्वामी जय जगदीश हरे॥"
  },

  "हनुमान": {
    "mantra": [
      "ॐ नमो भगवते हनुमते नमः।",
      "ॐ ऐं भ्रीम हनुमते श्रीरामदूताय नमः॥"
    ],
    "aarti": "आरती कीजै हनुमान लला की, दुष्ट दलन रघुनाथ कला की॥"
  },

  "गणेश": {
    "mantra": [
      "ॐ गण गणपतये नमः।",
      "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभः॥"
    ],
    "aarti": "जय गणेश जय गणेश जय गणेश देवा॥"
  },

  "दुर्गा": {
    "mantra": [
      "ॐ दुं दुर्गायै नमः।",
      "सर्वमङ्गलमाङ्गल्ये शिवे सर्वार्थसाधिके॥"
    ],
    "aarti": "जय अम्बे गौरी, मैया जय श्यामा गौरी॥"
  },

  "लक्ष्मी": {
    "mantra": [
      "ॐ श्रीं महालक्ष्म्यै नमः।",
      "नमस्तेस्तु महामाये श्रीपीठे सुरपूजिते॥"
    ],
    "aarti": "ॐ जय लक्ष्मी माता, मैया जय लक्ष्मी माता॥"
  },

  "सरस्वती": {
    "mantra": [
      "ॐ ऐं सरस्वत्यै नमः।",
      "या कुन्देन्दु तुषार हार धवला॥"
    ],
    "aarti": "जय सरस्वती माता, मैया जय सरस्वती माता॥"
  }

  // बाकी देवियाँ/देव इसी pattern में जोड़े जाएँगे
};

/* =========================
   PANCHANG API
========================= */
app.get("/api/panchang", (req, res) => {
  try {
    res.json({
      success: true,
      data: getPanchang()
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});
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

/* =========================
   ROOT CHECK
========================= */
app.get("/", (req, res) => {
  res.send("Panchang Backend Running");
});

/* =================================
   SERVER START
   ================================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`Ask-Bhakti backend running on port ${PORT}`)
);
