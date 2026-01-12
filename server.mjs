import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const demoPanchang = {
  "2026-01-12": {
    sunrise: "07:15",
    sunset: "17:45",
    moonrise: "10:30",
    moonset: "21:00",
    vikram_samvat: "2082",
    shak_samvat: "1947",
    masa: "पौष",
    paksha: "शुक्ल",
    tithi: "द्वितीया"
  },
  "2026-01-13": {
    sunrise: "07:15",
    sunset: "17:46",
    moonrise: "11:20",
    moonset: "22:05",
    vikram_samvat: "2082",
    shak_samvat: "1947",
    masa: "पौष",
    paksha: "शुक्ल",
    tithi: "तृतीया"
  }
};

app.get("/api/panchang", (req, res) => {
  const dateISO = req.query.date || new Date().toISOString().slice(0, 10);
  const data = demoPanchang[dateISO] || {
    sunrise: "—",
    sunset: "—",
    moonrise: "—",
    moonset: "—",
    vikram_samvat: "—",
    shak_samvat: "—",
    masa: "—",
    paksha: "—",
    tithi: "—"
  };
  res.json({ date: dateISO, ...data, source: "Demo Dataset" });
});

app.get("/", (req, res) => res.send("Panchang API running"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
