//messageComposer.js
import { messagePools } from "data/dharmikMessages.js";

function getWeekNumber(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function pickRotating(arr, seed) {
  if (!arr || arr.length === 0) return "";
  return arr[seed % arr.length];
}

export function composeDharmikMessage({ weekday, tithi, festivalHints }) {
  const week = getWeekNumber();
  const wPool = messagePools.weekday[weekday] || messagePools.weekday.default;
  const tPool = messagePools.tithi[tithi] || [];
  const fPool = festivalHints || [];

  const wMsg = pickRotating(wPool, week);
  const tMsg = pickRotating(tPool, week);
  const fMsg = pickRotating(fPool, week);

  const parts = [fMsg, tMsg, wMsg].filter(Boolean);
  return parts.join(" — ");
}
