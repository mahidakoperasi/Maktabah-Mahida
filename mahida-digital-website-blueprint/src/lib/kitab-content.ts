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
  align?: "left" | "center" | "right" | "justify";
  dir?: "ltr" | "rtl";
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
    paragraphStyle?: {
      namedStyleType?: string;
      headingId?: string;
      alignment?: string;
      direction?: string;
    };
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

const ARABIC_SCRIPT =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const LATIN_SCRIPT = /[A-Za-zÀ-ÖØ-öø-ÿ]/g;

function blockDirection(runs: Run[]): "ltr" | "rtl" {
  const text = runs.map((run) => run.text).join("");
  const arabic = text.match(ARABIC_SCRIPT)?.length ?? 0;
  const latin = text.match(LATIN_SCRIPT)?.length ?? 0;
  return arabic > 0 && arabic >= latin ? "rtl" : "ltr";
}

function blockAlignment(
  value?: string,
): Block["align"] | undefined {
  if (value === "CENTER") return "center";
  if (value === "END" || value === "RIGHT") return "right";
  if (value === "JUSTIFIED") return "justify";
  if (value === "START" || value === "LEFT") return "left";
  return undefined;
}

function splitSoftLines(runs: Run[]) {
  const lines: Run[][] = [[]];
  for (const run of runs) {
    if (run.footnote) {
      lines[lines.length - 1].push(run);
      continue;
    }
    const parts = run.text.replace(/\r/g, "").split("\u000b");
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ ...run, text: part });
    });
  }
  return lines.filter((line) =>
    line.some((run) => run.text.trim() || run.footnote),
  );
}

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
      const kind = level
        ? ("heading" as const)
        : p.bullet
          ? ("list" as const)
          : ("paragraph" as const);
      const baseId = level
        ? `${prefix}-${p.paragraphStyle?.headingId ?? e.startIndex ?? ++serial}`
        : id;
      const align = blockAlignment(p.paragraphStyle?.alignment);
      const lines =
        kind === "paragraph" ? splitSoftLines(runs) : [runs];
      return lines.map((lineRuns, lineIndex) => ({
        id: lineIndex === 0 ? baseId : `${baseId}-line-${lineIndex + 1}`,
        kind,
        level: level || nesting,
        runs: lineRuns.map((run) => ({
          ...run,
          text:
            kind === "heading"
              ? run.text.replace(/\u000b+/g, " ")
              : run.text,
        })),
        ordered: Boolean(
          glyph && !["GLYPH_TYPE_UNSPECIFIED", "NONE"].includes(glyph),
        ),
        align,
        dir: blockDirection(lineRuns),
      }));
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
