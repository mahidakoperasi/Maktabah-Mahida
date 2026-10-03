// Keep this normalization in sync with mahida_search_normalize in migration 0017.
const ignored =
  /[\u0300-\u036f\u0610-\u061a\u0640\u064b-\u065f\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7-\u06e8\u06ea-\u06ed\u08d3-\u08ff]/g;
export function normalizeSearch(value: string) {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("id-ID")
    .replace(ignored, "")
    .replace(/[٠-٩۰-۹]/g, (digit) =>
      String(digit.charCodeAt(0) - (digit >= "۰" ? 0x6f0 : 0x660)),
    )
    .replace(/ی/g, "ي")
    .replace(/ک/g, "ك");
}
export function searchTerms(value: string) {
  return [
    ...new Set(
      normalizeSearch(value.slice(0, 200)).match(/[\p{L}\p{N}]+/gu) ?? [],
    ),
  ]
    .slice(0, 8)
    .map((word) => word.slice(0, 80));
}
export function matchesSearch(text: string, query: string) {
  const words = normalizeSearch(text).match(/[\p{L}\p{N}]+/gu) ?? [];
  const terms = searchTerms(query);
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}
export function matchRanges(text: string, query: string) {
  const terms = searchTerms(query);
  if (!terms.length) return [];
  let normalized = "";
  const starts: number[] = [],
    ends: number[] = [];
  for (let offset = 0; offset < text.length;) {
    const character = String.fromCodePoint(text.codePointAt(offset)!);
    const part = normalizeSearch(character);
    normalized += part;
    for (let n = 0; n < part.length; n++) {
      starts.push(offset);
      ends.push(offset + character.length);
    }
    // Include trailing harakat in the original highlighted word.
    if (!part && ends.length) ends[ends.length - 1] = offset + character.length;
    offset += character.length;
  }
  const ranges: { start: number; end: number }[] = [];
  for (const match of normalized.matchAll(/[\p{L}\p{N}]+/gu)) {
    if (!terms.some((term) => match[0].startsWith(term))) continue;
    const start = match.index!,
      end = start + match[0].length - 1;
    ranges.push({ start: starts[start], end: ends[end] });
  }
  return ranges;
}
export function searchSnippet(text: string, query: string, max = 240) {
  const first = matchRanges(text, query)[0]?.start ?? 0;
  const start = Math.max(0, first - 65);
  return `${start ? "…" : ""}${text.slice(start, start + max)}${text.length > start + max ? "…" : ""}`;
}

export type SearchHit = {
  id: string;
  kind: "book" | "chapter" | "body" | "footnote";
  bookSlug: string;
  bookTitle: string;
  fan: string;
  chapterId: string;
  chapterTitle: string;
  blockId: string;
  text: string;
  hash: string;
};
export type SearchResponse = {
  hits: SearchHit[];
  total: number;
  page: number;
  pages: number;
};
export function hitUrl(hit: SearchHit, query: string, page = 1) {
  if (hit.kind === "book")
    return `/maktabah/kitab/${encodeURIComponent(hit.bookSlug)}`;
  const params = new URLSearchParams({
    q: query.slice(0, 200),
    searchPage: String(page),
    searchHash: hit.hash,
    result: hit.id,
  });
  return `/maktabah/kitab/${encodeURIComponent(hit.bookSlug)}/baca/${encodeURIComponent(hit.chapterId)}?${params}#${encodeURIComponent(hit.blockId)}`;
}
