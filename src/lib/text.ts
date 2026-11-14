/** Lowercase without Vietnamese diacritics, so "de no den" finds "Để Nó Đến". */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();
}
