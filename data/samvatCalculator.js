export function computeSamvats(localDate) {
  const y = localDate.getFullYear();
  const m = localDate.getMonth() + 1;
  const d = localDate.getDate();
  const isLeap = ((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0);
  const shakaStartDay = isLeap ? 21 : 22;
  const shak = (m > 3 || (m === 3 && d >= shakaStartDay)) ? (y - 78) : (y - 79);
  const vikram = (m >= 4) ? (y + 57) : (y + 56);
  return { vikram_samvat: String(vikram), shak_samvat: String(shak) };
}
