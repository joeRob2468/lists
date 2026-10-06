// Approximate: only needs singular and plural to map to the same token.
const singularize = (word: string) => {
  if (word.endsWith('ie')) return `${word.slice(0, -2)}y`;
  if (word.length <= 3 || word.endsWith('ss') || word.endsWith('us')) return word;
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (/(sses|ches|shes|xes|oes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
};

/** Canonical form for exact duplicate detection: "Milk, 2%" = "2% milk", "Eggs" = "egg". */
export const normalizeItemName = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9%\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(singularize)
    .sort()
    .join(' ');

const levenshtein = (a: string, b: string) => {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
};

/** Loose match for autocomplete: substring or small typo. Permissive, since suggestions are never auto-applied. */
export const isSimilarItemName = (query: string, name: string) => {
  const a = normalizeItemName(query);
  const b = normalizeItemName(name);
  if (a.length < 2 || b.length === 0) return false;
  if (b.includes(a) || a.includes(b)) return true;
  return a.length >= 4 && levenshtein(a, b) <= (a.length >= 8 ? 2 : 1);
};

/** Strict typo check for duplicate hints; unlike `isSimilarItemName`, substrings don't count ("almond milk" ≠ "milk"). */
export const isLikelyTypo = (a: string, b: string) => {
  const x = normalizeItemName(a);
  const y = normalizeItemName(b);
  if (x === y || Math.min(x.length, y.length) < 4) return false;
  return levenshtein(x, y) <= (x.length >= 8 ? 2 : 1);
};
