import { matchRanges } from "@/lib/kitab-search-text";
import ArabicText from "./ArabicText";
export default function SearchHighlight({
  text,
  query = "",
}: {
  text: string;
  query?: string;
}) {
  const ranges = matchRanges(text, query);
  if (!ranges.length) return <ArabicText text={text} />;
  const parts = ranges.map((range, i) => {
    const prefix = text.slice(i ? ranges[i - 1].end : 0, range.start);
    return (
      <span key={i}>
        <ArabicText text={prefix} />
        <mark data-search-match>
          <ArabicText text={text.slice(range.start, range.end)} />
        </mark>
      </span>
    );
  });
  return (
    <>
      {parts}
      <ArabicText text={text.slice(ranges[ranges.length - 1].end)} />
    </>
  );
}
