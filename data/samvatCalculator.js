export function getSamvat(dateObj) {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;

  // Vikram Samvat ≈ Gregorian + 57
  let vikram = year + 57;
  if (month < 4) vikram -= 1;

  // Shaka Samvat ≈ Gregorian - 78
  let shak = year - 78;
  if (month < 3) shak -= 1;

  return {
    vikram_samvat: vikram.toString(),
    shak_samvat: shak.toString()
  };
}
