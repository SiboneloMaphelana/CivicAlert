export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Jaccard similarity on word sets, 0–1 */
export function titleSimilarity(a: string, b: string): number {
  const wa = new Set(normalizeText(a).split(' ').filter((w) => w.length > 2));
  const wb = new Set(normalizeText(b).split(' ').filter((w) => w.length > 2));
  if (wa.size === 0 || wb.size === 0) return 0;
  let inter = 0;
  for (const w of wa) {
    if (wb.has(w)) inter++;
  }
  const union = wa.size + wb.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function locationMatches(a: string, b: string): boolean {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

/** Combined score for duplicate ranking (0–1). */
export function duplicateScore(titleA: string, locA: string, titleB: string, locB: string): number {
  const t = titleSimilarity(titleA, titleB);
  const locBoost = locationMatches(locA, locB) ? 0.18 : 0;
  return Math.min(1, t + locBoost);
}
