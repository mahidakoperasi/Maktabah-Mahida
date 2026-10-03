import { createHash } from "node:crypto";
export type Run = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  href?: string;
  footnote?: string;
  footnoteNumber?: string;
};
export type Block = {
  id: string;
  kind: "paragraph" | "heading" | "list" | "table" | "footnote";
  level?: number;
  ordered?: boolean;
  runs?: Run[];
  rows?: Block[][][];
  noteId?: string;
  noteNumber?: string;
};
export type Chapter = {
  id: string;
  title: string;
  blocks: Block[];
  legacy?: string;
};
type Element = {
  startIndex?: number;
  paragraph?: {
    paragraphStyle?: { namedStyleType?: string; headingId?: string };
    bullet?: { listId?: string; nestingLevel?: number };
    elements?: {
      textRun?: {
        content?: string;
        textStyle?: {
          bold?: boolean;
          italic?: boolean;
          underline?: boolean;
          link?: { url?: string };
        };
      };
      footnoteReference?: { footnoteId?: string; footnoteNumber?: string };
      inlineObjectElement?: unknown;
    }[];
  };
  table?: { tableRows?: { tableCells?: { content?: Element[] }[] }[] };
};
type DocTab = {
  body?: { content?: Element[] };
  footnotes?: Record<string, { content?: Element[] }>;
  lists?: Record<
    string,
    { listProperties?: { nestingLevels?: { glyphType?: string }[] } }
  >;
};
type Tab = {
  tabProperties?: { tabId?: string; title?: string };
  documentTab?: DocTab;
  childTabs?: Tab[];
};
export type DocsDocument = DocTab & { title?: string; tabs?: Tab[] };
export function parseDocs(doc: DocsDocument) {
  const chapters: Chapter[] = [];
  const warnings = new Set<string>();
  let serial = 0;
  let noteSerial = 0;
  const noteNumbers = new Map<string, string>();
  function read(elements: Element[], tab: DocTab, prefix: string): Block[] {
    return elements.flatMap<Block>((e) => {
      const id = `${prefix}-${e.startIndex ?? ++serial}`;
      if (e.table)
        return [
          {
            id,
            kind: "table" as const,
            rows:
              e.table.tableRows?.map(
                (row) =>
                  row.tableCells?.map((cell) =>
                    read(cell.content ?? [], tab, prefix),
                  ) ?? [],
              ) ?? [],
          },
        ];
      if (!e.paragraph) return [];
      const p = e.paragraph;
      const level = Number(
        /HEADING_([1-3])/.exec(p.paragraphStyle?.namedStyleType ?? "")?.[1] ??
          0,
      );
      const runs: Run[] = (p.elements ?? []).flatMap<Run>((el) => {
        if (el.inlineObjectElement) {
          warnings.add(
            "Gambar di dalam Docs belum diimpor. Gunakan gambar publik melalui editor Mahida.",
          );
          return [];
        }
        if (el.footnoteReference?.footnoteId) {
          const noteId = `${prefix}-${el.footnoteReference.footnoteId}`;
          if (!noteNumbers.has(noteId)) {
            noteSerial = Math.max(
              noteSerial + 1,
              Number(el.footnoteReference.footnoteNumber) || 0,
            );
            noteNumbers.set(
              noteId,
              el.footnoteReference.footnoteNumber || String(noteSerial),
            );
          }
          return [
            {
              text: "",
              footnote: noteId,
              footnoteNumber: noteNumbers.get(noteId),
            },
          ];
        }
        if (!el.textRun) return [];
        const s = el.textRun.textStyle;
        return [
          {
            text: (el.textRun.content ?? "").replace(/\n$/, ""),
            bold: s?.bold,
            italic: s?.italic,
            underline: s?.underline,
            href: s?.link?.url,
          },
        ];
      });
      if (!runs.some((r) => r.text.trim() || r.footnote)) return [];
      const nesting = p.bullet?.nestingLevel ?? 0;
      const glyph =
        tab.lists?.[p.bullet?.listId ?? ""]?.listProperties?.nestingLevels?.[
          nesting
        ]?.glyphType;
      return [
        {
          id: level
            ? `${prefix}-${p.paragraphStyle?.headingId ?? e.startIndex ?? ++serial}`
            : id,
          kind: level
            ? ("heading" as const)
            : p.bullet
              ? ("list" as const)
              : ("paragraph" as const),
          level: level || nesting,
          runs,
          ordered: Boolean(
            glyph && !["GLYPH_TYPE_UNSPECIFIED", "NONE"].includes(glyph),
          ),
        },
      ];
    });
  }
  function add(tab: DocTab, prefix: string, title: string) {
    const blocks = read(tab.body?.content ?? [], tab, prefix);
    let current: Chapter | undefined;
    for (const block of blocks) {
      if (block.kind === "heading" && block.level === 1) {
        current = {
          id: block.id,
          title: block.runs?.map((r) => r.text).join("") || title,
          blocks: [],
        };
        chapters.push(current);
      }
      if (!current) {
        current = {
          id: `${prefix}-awal`,
          title: chapters.length ? title : "Pembukaan",
          blocks: [],
        };
        chapters.push(current);
      }
      current.blocks.push(block);
    }
    for (const [noteId, note] of Object.entries(tab.footnotes ?? {})) {
      const id = `${prefix}-${noteId}`;
      const references = (blocks: Block[]): boolean =>
        blocks.some(
          (b) =>
            b.runs?.some((r) => r.footnote === id) ||
            b.rows?.some((row) => row.some(references)),
        );
      for (const chapter of chapters.filter((c) => references(c.blocks)))
        chapter.blocks.push({
          id,
          kind: "footnote",
          noteId: id,
          noteNumber: noteNumbers.get(id),
          rows: [
            [read(note.content ?? [], tab, `${prefix}-footnote-${noteId}`)],
          ],
        });
    }
  }
  function walk(tabs: Tab[]) {
    for (const tab of tabs) {
      if (tab.documentTab)
        add(
          tab.documentTab,
          tab.tabProperties?.tabId ?? `tab${++serial}`,
          tab.tabProperties?.title ?? "Bagian",
        );
      walk(tab.childTabs ?? []);
    }
  }
  if (doc.tabs?.length) walk(doc.tabs);
  else add(doc, "doc", doc.title ?? "Isi Kitab");
  return {
    chapters,
    warnings: [...warnings],
    hash: createHash("sha256").update(JSON.stringify(chapters)).digest("hex"),
  };
}
export function legacyChapters(raw: string): Chapter[] {
  if (!raw.trim()) return [];
  const pieces = raw.split(/(?=^#{1,2}\s+\S)/m).filter((s) => s.trim());
  return pieces.map((legacy, index) => ({
    id: `lama-${index + 1}`,
    title:
      /^#{1,2}\s+([^\n]+)/.exec(legacy)?.[1] ??
      (index === 0 ? "Isi Kitab" : `Bagian ${index + 1}`),
    blocks: [],
    legacy: legacy.replace(/^# /, "## "),
  }));
}
