export function getSamvat(dateObj) {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1; // Jan = 1

  let vikram = year + 57;
  let shak = year - 78;

  // चैत्र से पहले correction
  if (month < 4) {
    vikram -= 1;
    shak -= 1;
  }

  return {
    vikram_samvat: "विक्रम संवत " + vikram,
    shak_samvat: "शक संवत " + shak
  };
}
