import express from "express"; 
import * as cheerio from "cheerio"; 
const app = express(); 
const PORT = process.env.PORT || 3000; 
const URL = "https://www.srimandir.com/hi/panchang"; 

async function fetchRaw() { 
  const res = await fetch(URL); 
  const html = await res.text(); 
  const $ = cheerio.load(html); 
  const nextData = $("#__NEXT_DATA__").html(); 
  if (!nextData) return {}; 
  const parsed = JSON.parse(nextData); 
  return parsed?.props?.pageProps || {};
} 
app.get("/api/panchang", async (req, res) => { 
  const raw = await fetchRaw(); 
  // raw.panchangRows, raw.panchangOne, raw.sunrise आदि से values निकालें 
  res.json(raw);
}); 
  app.listen(PORT, () => console.log(Server running on ${PORT}));
