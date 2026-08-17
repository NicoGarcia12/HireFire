/** Match AND: todos los términos de `keywords` deben aparecer en `haystack`, sin importar mayúsculas. */
export function matchesKeywords(haystack: string, keywords: string): boolean {
  const terms = keywords.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const text = haystack.toLowerCase();
  return terms.every((term) => text.includes(term));
}
