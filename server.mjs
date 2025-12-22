import express from "express";
import cors from "cors";
import festivalData from "./data/festivals.json" assert { type: "json" };
import { bharatDiwasMap } from "./data/bharatDiwas.js";
import { vratTyoharMap } from "./data/vratTyohar.js";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Month names in Hindi
const monthNames = [
  "चैत्र","वैशाख","ज्येष्ठ","आषाढ़","श्रावण","भाद्रपद",
  "आश्विन","कार्तिक","मार्गशीर्ष","पौष","माघ","फाल्गुन"
];

app.get("/api/panchang", (req, res) => {
  const today = new Date(new Date().toLocaleString("en-US",{timeZone:"Asia/Kolkata"}));
  
  const dateNum = today.getDate();
  const monthNum = today.getMonth();
  const yearNum = today.getFullYear();
  
  const dayName = today.toLocaleDateString("hi-IN",{weekday:"long"});
  const monthName = monthNames[monthNum];
  
  // Approximate Panchang values
  const vikramSamvat = 2082 + (yearNum-2025);
  const shakSamvat = 1947 + (yearNum-2025);

  const masa = monthName;
  const paksha = dateNum <= 15 ? "शुक्ल" : "कृष्ण"; // simple approx
  const tithiNumber = ((dateNum-1)%15)+1;

  // 1️⃣ Perpetual Panchang festivals
  const key = `${masa}-${paksha}-${tithiNumber}`;
  let festivals = festivalData[key] || ["कोई विशेष व्रत नहीं"];

  // 2️⃣ Bharat Diwas merge
  const monthDayKey = `${String(monthNum+1).padStart(2,'0')}-${String(dateNum).padStart(2,'0')}`;
  if(bharatDiwasMap[monthDayKey]){
    festivals = festivals.concat(bharatDiwasMap[monthDayKey]);
  }

  // 3️⃣ Vrat Tyohar merge
  if(vratTyoharMap[monthDayKey]){
    festivals = festivals.concat(vratTyoharMap[monthDayKey]);
  }

  res.json({
    date:`${dateNum} ${monthName} ${yearNum}`,
    day:dayName,
    sunMoon:{
      sunrise:"06:55",
      sunset:"17:42",
      moonrise:"19:10",
      moonset:"07:30"
    },
    vikram_samvat:vikramSamvat,
    shak_samvat:shakSamvat,
    masa:masa,
    paksha_tithi:`${paksha} पक्ष ${tithiNumber}`,
    festivalList:festivals.length>0?festivals:["कोई विशेष व्रत नहीं"]
  });
});

app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
