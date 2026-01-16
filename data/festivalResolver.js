//festivalResolver.js
import fs from "fs";
import path from "path";

const FESTIVAL_RULES = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data/festivals.json"), "utf-8")
).rules;

export function resolveCanonicalFestivals({ tithi, paksha, month, todayFestivals }) {
  const normalized = (s) => (s || "").trim();

  const matches = FESTIVAL_RULES.filter(rule => {
    if (rule.type === "solar") {
      // Solar festivals: rely on todayFestivals hint from Srimandir
      return (todayFestivals || []).some(f => normalized(f) === normalized(rule.name));
    }
    // Lunar rule match
    return (
      normalized(rule.tithi) === normalized(tithi) &&
      normalized(rule.paksha) === normalized(paksha) &&
      normalized(rule.month) === normalized(month)
    );
  }).map(rule => rule.name);

  // Merge with Srimandir todayFestivals, dedupe
  const merged = Array.from(new Set([...(todayFestivals || []), ...matches]));
  return merged;
}

export function getFestivalHints(festivalNames = []) {
  const hints = [];
  festivalNames.forEach(name => {
    const rule = FESTIVAL_RULES.find(r => r.name === name);
    if (rule?.hint?.length) hints.push(...rule.hint);
  });
  return hints;
}
