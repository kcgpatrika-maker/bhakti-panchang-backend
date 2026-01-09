export function getSamvat(date) {
  const year = date.getFullYear();
  return {
    vikram_samvat: year + 57,
    shak_samvat: year - 78
  };
}
