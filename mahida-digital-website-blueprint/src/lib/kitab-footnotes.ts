import type { Block, Chapter } from "./kitab-content";
export type Footnote = {
  id: string;
  number: string;
  blocks: Block[];
  references: string[];
};
export function footnoteReferenceId(block: Block, runIndex: number) {
  return `footnote-ref-${block.id}-${runIndex}`;
}
export function collectFootnotes(chapters: Chapter[]) {
  const notes: Record<string, Footnote> = {};
  let serial = 0;
  function number(provided?: string) {
    serial = Math.max(serial + 1, Number(provided) || 0);
    return provided || String(serial);
  }
  function walk(blocks: Block[], isNote = false) {
    for (const block of blocks) {
      if (block.kind === "footnote") {
        const note = (notes[block.id] ??= {
          id: block.id,
          number: number(block.noteNumber),
          blocks: [],
          references: [],
        });
        note.blocks = block.rows?.[0]?.[0] ?? [];
        continue;
      }
      if (!isNote)
        block.runs?.forEach((run, i) => {
          if (!run.footnote) return;
          const note = (notes[run.footnote] ??= {
            id: run.footnote,
            number: number(run.footnoteNumber),
            blocks: [],
            references: [],
          });
          note.references.push(footnoteReferenceId(block, i));
        });
      block.rows?.forEach((row) => row.forEach((cell) => walk(cell, isNote)));
    }
  }
  chapters.forEach((chapter) => walk(chapter.blocks));
  return notes;
}
