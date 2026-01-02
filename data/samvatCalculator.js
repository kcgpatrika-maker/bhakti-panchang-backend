// data/samvatCalculator.js

export function getSamvat(dateObj) {
  const year = dateObj.getFullYear();

  // शुक्ल पक्ष आधारित सरल गणना (content purpose)
  const vikramSamvat = year + 57;
  const shakSamvat = year - 78;

  return {
    vikram_samvat: vikramSamvat.toString(),
    shak_samvat: shakSamvat.toString()
  };
}
