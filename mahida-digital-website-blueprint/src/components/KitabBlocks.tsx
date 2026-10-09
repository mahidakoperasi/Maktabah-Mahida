"use client";
import type { ReactNode, MouseEvent } from "react";
import type { Block, Run } from "@/lib/kitab-content";
import { safeArticleLink } from "@/lib/rich-links";
import {
  collectFootnotes,
  footnoteReferenceId,
  type Footnote,
} from "@/lib/kitab-footnotes";
import SearchHighlight from "./SearchHighlight";

type Props = {
  blocks: Block[];
  query?: string;
  footnotes?: Record<string, Footnote>;
  onFootnote?: (note: Footnote, trigger: HTMLAnchorElement) => void;
  idPrefix?: string;
  footnoteFontSize?: number;
};
export default function KitabBlocks({
  blocks,
  query = "",
  footnotes,
  onFootnote,
  idPrefix = "",
  footnoteFontSize = 18,
}: Props) {
  const localNotes = collectFootnotes([{ id: "preview", title: "", blocks }]);
  const notes = footnotes ?? localNotes;
  const childProps = {
    query,
    footnotes: notes,
    onFootnote,
    idPrefix,
    footnoteFontSize,
  };
  function blockClass(block: Block) {
    return [
      block.dir === "rtl" ? "kitab-rtl" : "kitab-ltr",
      block.align ? `kitab-align-${block.align}` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function runs(values: Run[] = [], block: Block) {
    return values.map((run, i) => {
      if (run.footnote) {
        const note = notes[run.footnote];
        const number = run.footnoteNumber || note?.number || "?";
        return (
          <sup key={i} className="kitab-footnote-reference">
            <a
              id={`${idPrefix}${footnoteReferenceId(block, i)}`}
              href={`#${encodeURIComponent(run.footnote)}`}
              aria-label={`Baca catatan kaki ${number}`}
              onClick={
                onFootnote && note
                  ? (event: MouseEvent<HTMLAnchorElement>) => {
                      event.preventDefault();
                      onFootnote(note, event.currentTarget);
                    }
                  : undefined
              }
            >
              {number}
            </a>
          </sup>
        );
      }
      let value: ReactNode = <SearchHighlight text={run.text} query={query} />;
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
  const body = blocks.filter((block) => block.kind !== "footnote");
  const chapterNotes = blocks.filter((block) => block.kind === "footnote");
  return (
    <div className="reading-text kitab-blocks">
      {body.map((block, i) => {
        if (block.kind === "table")
          return (
            <div
              key={block.id}
              id={`${idPrefix}${block.id}`}
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
                          <KitabBlocks blocks={cell} {...childProps} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        if (block.kind === "heading") {
          const Heading =
            block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4";
          return (
            <Heading
              key={block.id}
              id={`${idPrefix}${block.id}`}
              dir={block.dir ?? "auto"}
              className={blockClass(block)}
            >
              {runs(block.runs, block)}
            </Heading>
          );
        }
        if (block.kind === "list") {
          const same = (other: Block | undefined) =>
            other?.kind === "list" &&
            other.ordered === block.ordered &&
            other.level === block.level;
          if (same(body[i - 1])) return null;
          const items: Block[] = [];
          for (let j = i; j < body.length && same(body[j]); j++)
            items.push(body[j]);
          const List = block.ordered ? "ol" : "ul";
          return (
            <List
              key={block.id}
              className={`kitab-list ${blockClass(block)}`}
              data-level={block.level}
              dir={block.dir ?? "auto"}
            >
              {items.map((item) => (
                <li key={item.id} id={`${idPrefix}${item.id}`}>
                  {runs(item.runs, item)}
                </li>
              ))}
            </List>
          );
        }
        return (
          <p
            key={block.id}
            id={`${idPrefix}${block.id}`}
            dir={block.dir ?? "auto"}
            className={blockClass(block)}
          >
            {runs(block.runs, block)}
          </p>
        );
      })}
      {chapterNotes.length > 0 && (
        <section
          className="kitab-footnotes"
          aria-label="Catatan kaki bab"
          style={{ fontSize: footnoteFontSize }}
        >
          <h2>Catatan kaki</h2>
          {chapterNotes.map((block) => {
            const note = notes[block.id];
            return (
              <aside
                key={block.id}
                id={`${idPrefix}${block.id}`}
                className="kitab-footnote"
              >
                <div className="kitab-footnote-heading">
                  <span>
                    Catatan kaki {note?.number || block.noteNumber || "?"}
                  </span>
                  {localNotes[block.id]?.references[0] && (
                    <a
                      href={`#${encodeURIComponent(idPrefix + localNotes[block.id].references[0])}`}
                    >
                      Kembali ke penanda
                    </a>
                  )}
                </div>
                <KitabBlocks
                  blocks={block.rows?.[0]?.[0] ?? []}
                  {...childProps}
                  idPrefix={`${idPrefix}${block.id}-body-`}
                />
              </aside>
            );
          })}
        </section>
      )}
    </div>
  );
}
