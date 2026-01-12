// विक्रम संवत और शक संवत निकालने का नियम आधारित कोड

export function computeSamvats(localDate) {
  const y = localDate.getFullYear();
  const m = localDate.getMonth() + 1; // JS months 0-based होते हैं
  const d = localDate.getDate();

  // Leap year check
  const isLeap = ((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0);

  // शक संवत का आरंभ लगभग 21/22 मार्च से होता है
  const shakaStartDay = isLeap ? 21 : 22;
  const shak = (m > 3 || (m === 3 && d >= shakaStartDay))
    ? (y - 78)
    : (y - 79);

  // विक्रम संवत का आरंभ लगभग अप्रैल से माना जाता है
  const vikram = (m >= 4)
    ? (y + 57)
    : (y + 56);

  return {
    vikram_samvat: String(vikram),
    shak_samvat: String(shak)
  };
}
