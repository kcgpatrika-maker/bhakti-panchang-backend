// कोई import नहीं fetch के लिए

async function getPanchang() {
  const url = "https://www.srimandir.com/hi/panchang";

  const res = await fetch(url);
  const html = await res.text();

  function pick(label) {
    const re = new RegExp(label + "\\s*:?\\s*([^<\\n]+)", "i");
    const m = html.match(re);
    return m ? m[1].trim() : null;
  }

  return {
    tithi: pick("तिथि"),
    nakshatra: pick("नक्षत्र"),
    yog: pick("योग"),
    karan: pick("करण"),
    suryodaya: pick("सूर्योदय"),
    suryastha: pick("सूर्यास्त"),
    chandrodaya: pick("चन्द्रोदय"),
    chandrasta: pick("चन्द्रास्त")
  };
}

/* Example API */
import express from "express";
const app = express();

app.get("/api/panchang", async (req, res) => {
  try {
    const data = await getPanchang();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.listen(3000, () => {
  console.log("Server running");
});
