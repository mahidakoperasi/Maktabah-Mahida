import type { ReactNode } from "react";
import type { Block, Run } from "@/lib/kitab-content";
import { safeArticleLink } from "@/lib/rich-links";
import ArabicText from "./ArabicText";
function runs(values: Run[] = []) {
  return values.map((run, i) => {
    if (run.footnote)
      return (
        <sup key={i}>
          <a href={`#${run.footnote}`} aria-label="Baca catatan kaki">
            [catatan]
          </a>
        </sup>
      );
    let value: ReactNode = <ArabicText text={run.text} />;
    if (run.bold) value = <strong>{value}</strong>;
    if (run.italic) value = <em>{value}</em>;
    if (run.underline) value = <u>{value}</u>;
    const href = run.href ? safeArticleLink(run.href) : null;
    if (href)
      value = (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {value}
        </a>
      );
    return <span key={i}>{value}</span>;
  });
}
export default function KitabBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="reading-text kitab-blocks">
      {blocks.map((block, i) => {
        if (block.kind === "table")
          return (
            <div
              key={i}
              className="kitab-table-scroll"
              tabIndex={0}
              aria-label="Tabel kitab"
            >
              <table>
                <tbody>
                  {block.rows?.map((row, j) => (
                    <tr key={j}>
                      {row.map((cell, k) => (
                        <td key={k}>
                          <KitabBlocks blocks={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        if (block.kind === "footnote")
          return (
            <aside key={i} id={block.id} className="kitab-footnote">
              <p>Catatan kaki</p>
              {block.rows?.[0]?.[0] && (
                <KitabBlocks blocks={block.rows[0][0]} />
              )}
            </aside>
          );
        const value = runs(block.runs);
        if (block.kind === "heading") {
          const Heading =
            block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4";
          return (
            <Heading key={i} id={block.id} dir="auto">
              {value}
            </Heading>
          );
        }
        if (block.kind === "list") {
          const same = (other: Block | undefined) =>
            other?.kind === "list" &&
            other.ordered === block.ordered &&
            other.level === block.level;
          if (same(blocks[i - 1])) return null;
          const items: Block[] = [];
          for (let j = i; j < blocks.length && same(blocks[j]); j++)
            items.push(blocks[j]);
          const List = block.ordered ? "ol" : "ul";
          return (
            <List
              key={i}
              className="kitab-list"
              data-level={block.level}
              dir="auto"
            >
              {items.map((item, j) => (
                <li key={j}>{runs(item.runs)}</li>
              ))}
            </List>
          );
        }
        return (
          <p key={i} id={block.id} dir="auto">
            {value}
          </p>
        );
      })}
    </div>
  );
}
