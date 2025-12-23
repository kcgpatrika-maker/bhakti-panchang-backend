import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------
// Load festival data safely
// ---------------------------
const festivalDataPath = path.resolve("./data/festivals.json");
let festivalData = { bharatDiwasMap: {}, vratTyoharMap: {} };

try {
  if (fs.existsSync(festivalDataPath)) {
    festivalData = JSON.parse(fs.readFileSync(festivalDataPath, "utf-8"));
  }
} catch (e) {
  console.error("Error loading festivals.json:", e);
}

// ---------------------------
// Helper functions
// ---------------------------
function pad(num) {
  return num.toString().padStart(2, "0");
}

function getHindiMonth(index) {
  const months = [
    "जनवरी","फरवरी","मार्च","अप्रैल","मई","जून",
    "जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"
  ];
  return months[index] || "";
}

// ---------------------------
// Panchang logic
// ---------------------------
function getPanchang() {
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const date = `${today.getDate()} ${getHindiMonth(today.getMonth())} ${today.getFullYear()}`;
  const day = today.toLocaleDateString("hi-IN", { weekday: "long" });

  const vikram_samvat = 2082 + (today.getFullYear() - 2025);
  const shak_samvat = 1947 + (today.getFullYear() - 2025);

  const masa = "पौष";                 // placeholder
  const paksha_tithi = "शुक्ल पक्ष द्वितीया"; // placeholder

  let festivalList = [];
  const mmdd = `${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  if (festivalData.bharatDiwasMap?.[mmdd]) {
    festivalList.push(...festivalData.bharatDiwasMap[mmdd]);
  }

  if (festivalData.vratTyoharMap?.[mmdd]) {
    festivalList.push(...festivalData.vratTyoharMap[mmdd]);
  }

  if (festivalList.length === 0) {
    festivalList.push("कोई विशेष व्रत नहीं");
  }

  return {
    date,
    day,
    sunMoon: {
      sunrise: "06:55",
      sunset: "17:42",
      moonrise: "19:10",
      moonset: "07:30"
    },
    vikram_samvat,
    shak_samvat,
    masa,
    paksha_tithi,
    festivalList
  };
}

// ---------------------------
// Panchang API (FIXED)
// ---------------------------
app.get("/api/panchang", (req, res) => {
  try {
    res.json({
      success: true,
      data: getPanchang()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ---------------------------
// Ask Bhakti API
// ---------------------------
app.get("/api/ask-bhakti", (req, res) => {
  const { q, type } = req.query;
  if (!q || !type) {
    return res.json({ success: false });
  }

  const dataMap = {
    "शिव": {
      "मंत्र": {
        content: "ॐ नमः शिवाय।",
        sources: ["https://www.sanskritdocuments.org"]
      },
      "आरती": {
        content: "जय शिव ओंकारा...",
        sources: ["https://bhaktisangrah.com"]
      },
      "पूजा विधि": {
        content:
          "1. संकल्प\n2. स्नान\n3. पूजन\n4. अर्पण\n5. आरती\n6. विसर्जन",
        sources: []
      },
      "चालीसा": {
        content: "शिव चालीसा...",
        sources: ["https://kavitakosh.org"],
        pdf: "https://archive.org/download/shiv_chalisa.pdf"
      },
      "स्तोत्र": {
        content: "शिव स्तोत्र...",
        sources: ["https://vedabase.io"],
        pdf: "https://archive.org/download/shiv_stotra.pdf"
      }
    },

    "हनुमान": {
      "मंत्र": {
        content: "ॐ हनुमते नमः।",
        sources: ["https://www.sanskritdocuments.org"]
      },
      "आरती": {
        content: "जय हनुमान...",
        sources: ["https://bhaktisangrah.com"]
      },
      "पूजा विधि": {
        content:
          "1. संकल्प\n2. स्नान\n3. पूजन\n4. अर्पण\n5. आरती\n6. विसर्जन",
        sources: []
      },
      "चालीसा": {
        content: "हनुमान चालीसा...",
        sources: ["https://kavitakosh.org"],
        pdf: "https://archive.org/download/hanuman_chalisa.pdf"
      },
      "स्तोत्र": {
        content: "हनुमान स्तोत्र...",
        sources: ["https://vedabase.io"],
        pdf: "https://archive.org/download/hanuman_stotra.pdf"
      }
    }
  };

  const entry = dataMap[q];
  if (!entry || !entry[type]) {
    return res.json({ success: false });
  }

  res.json({
    success: true,
    title: q,
    content: entry[type].content,
    sources: entry[type].sources || [],
    pdf: entry[type].pdf || null
  });
});

// ---------------------------
// Root check (optional but useful)
// ---------------------------
app.get("/", (req, res) => {
  res.send("Ask Bhakti Backend Running");
});

// ---------------------------
// Start server
// ---------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
