// data/freePanchangSource.js

export async function getPanchangFromFreeSource() {
  try {
    // अभी placeholder / fallback (safe start)
    // अगला step: यहीं real free source fetch करेंगे
    return {
      masa: "पौष",
      paksha: "शुक्ल पक्ष",
      tithi: "सप्तमी",
      note: "Route B (Free Source)"
    };
  } catch (err) {
    return {
      masa: null,
      paksha: null,
      tithi: null,
      note: "Free source unavailable"
    };
  }
}
