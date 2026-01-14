import express from "express";
import cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const URL = "https://www.srimandir.com/hi/panchang";

async function fetchSrimandirData() {
  const res = await fetch(URL, {
    headers: {
      "user-agent": "Mozilla/5.0",
      "accept-language": "hi-IN"
    }
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  const nextData = $("#__NEXT_DATA__").html();
  if (!nextData) throw new Error("NEXT_DATA not found");

  const parsed = JSON.parse(nextData);
  return parsed?.props?.pageProps || {};
}

function refinePanchang
