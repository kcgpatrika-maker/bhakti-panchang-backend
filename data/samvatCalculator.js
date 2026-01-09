export function getSamvat(date) {
  const year = date.getFullYear();
  return {
    vikram_samvat: year + 56.7,
    shak_samvat: year - 77
  };
}
