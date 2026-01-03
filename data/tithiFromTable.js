// data/tithiFromTable.js
import { TITHI_TABLE } from "./tithiTable.js";

export function getTithiFromTable(dateObj) {
  const key = dateObj.toISOString().split("T")[0];

  if (TITHI_TABLE[key]) {
    return TITHI_TABLE[key];
  }

  return {
    masa: "—",
    tithi: "तिथि जानकारी उपलब्ध नहीं",
    paksha: "—"
  };
}
