// Characters with no NFD decomposition that Postgres unaccent still maps.
// Keep in sync with the players.name_search generated column.
const UNACCENT_EXTRAS: Record<string, string> = {
  ø: "o",
  ß: "ss",
  ł: "l",
  đ: "d",
  æ: "ae",
  œ: "oe",
  þ: "th",
  ð: "d",
}

export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[øßłđæœþð]/g, (char) => UNACCENT_EXTRAS[char] ?? char)
}
