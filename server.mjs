import express from "express";
import cors from "cors";
import SunCalc from "suncalc";

const app = express();
app.use(cors());

app.get("/api/panchang", (req, res) => {

  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const date = `${today.getDate()} दिसंबर ${today.getFullYear()}`;
  const day = today.toLocaleDateString("hi-IN",{ weekday:"long" });

  const lat = 26.9124;   // Jaipur approx
  const lon = 75.7873;

  const times = SunCalc.getTimes(today, lat, lon);
  const moonTimes = SunCalc.getMoonTimes(today, lat, lon);

  const format = d =>
    d ? d.toLocaleTimeString("hi-IN",{ hour:"2-digit", minute:"2-digit" }) : "--";

  res.json({
    date,
    day,

    sunMoon: {
      sunrise: format(times.sunrise),
      sunset: format(times.sunset),
      moonrise: format(moonTimes.rise),
      moonset: format(moonTimes.set)
    },

    vikram_samvat: "2082",
    shak_samvat: "1947",

    masa: "पौष",
    paksha_tithi: "शुक्ल पक्ष द्वितीया"
  });
});

app.get("/api/ask-bhakti", (req,res)=>{
  const { q, type } = req.query;
  if(!q || !type) return res.json({success:false});

  if(q.includes("शिव")){
    if(type==="मंत्र"){
      return res.json({
        success:true,
        title:"ॐ नमः शिवाय",
        content:"ॐ नमः शिवाय।",
        sources:["sanskritdocuments.org"]
      });
    }

    if(type==="आरती"){
      return res.json({
        success:true,
        title:"शिव आरती",
        content:`जय शिव ओंकारा, हर शिव ओंकारा।
ब्रह्मा विष्णु सदाशिव, अर्द्धांगी धारा॥`,
        sources:["sanskritdocuments.org","templepurohit.com"]
      });
    }

    if(type==="पूजा विधि"){
      return res.json({
        success:true,
        title:"शिव पूजा विधि",
        content:`संकल्प लें।
जल, दूध से अभिषेक करें।
बेलपत्र अर्पित करें।
धूप, दीप, नैवेद्य अर्पित करें।
आरती कर प्रार्थना करें।`
      });
    }

    if(type==="चालीसा"){
      return res.json({
        success:true,
        title:"शिव चालीसा",
        pdf:"https://archive.org/download/shivchalisa/shivchalisa.pdf"
      });
    }

    if(type==="स्तोत्र"){
      return res.json({
        success:true,
        title:"रुद्राष्टकम",
        pdf:"https://archive.org/download/rudrashtakam/rudrashtakam.pdf"
      });
    }
  }

  res.json({success:false});
});

app.get("/api/panchang",(req,res)=>{
  res.json({
    date:"20 दिसंबर 2025",
    day:"शनिवार",
    sunMoon:{sunrise:"06:55",sunset:"17:30",moonrise:"07:20",moonset:"18:00"},
    vikram_samvat:2082,
    shak_samvat:1947,
    masa:"पौष",
    paksha_tithi:"कृष्ण पक्ष पंचमी"
  });
});

app.listen(3000,()=>console.log("Bhakti API running"));
