"use client";
import Link from "next/link";
import type { Chapter } from "@/lib/kitab-content";
import {
  hitUrl,
  matchesSearch,
  type SearchHit,
  type SearchResponse,
} from "@/lib/kitab-search-text";
import SearchHighlight from "./SearchHighlight";
type Props = {
  chapters: Chapter[];
  index: number;
  bookSlug: string;
  preview: boolean;
  prefix: string;
  tab: string;
  onTab: (tab: string) => void;
  chapterQuery: string;
  onChapterQuery: (query: string) => void;
  query: string;
  draft: string;
  onDraft: (query: string) => void;
  onSearch: () => void;
  results: SearchResponse;
  loading: boolean;
  error: string;
  unavailable: boolean;
  onPage: (page: number) => void;
  onSelect: (hit: SearchHit) => void;
  onClose: () => void;
};
export default function BookReaderNavigation(p: Props) {
  const previewQuery = p.preview ? "?maktabahPreview=1" : "";
  const filter = p.tab === "chapters" ? p.chapterQuery : "";
  return (
    <div className="library-reader-navigation">
      <div
        role="tablist"
        aria-label="Navigasi dan pencarian kitab"
        className="library-reader-tabs"
      >
        {[
          ["toc", "Daftar Isi"],
          ["chapters", "Cari Bab"],
          ["body", "Cari Isi"],
        ].map(([id, label]) => (
          <button
            type="button"
            role="tab"
            key={id}
            id={`${p.prefix}-tab-${id}`}
            aria-selected={p.tab === id}
            aria-controls={`${p.prefix}-panel-${id}`}
            onClick={() => p.onTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${p.prefix}-panel-${p.tab}`}
        aria-labelledby={`${p.prefix}-tab-${p.tab}`}
      >
        {p.tab === "body" ? (
          <>
            <form
              role="search"
              className="library-reader-search"
              onSubmit={(e) => {
                e.preventDefault();
                p.onSearch();
              }}
            >
              <label htmlFor={`${p.prefix}-body-query`}>
                Cari teks dalam kitab
              </label>
              <input
                id={`${p.prefix}-body-query`}
                type="search"
                maxLength={200}
                value={p.draft}
                disabled={p.preview || p.unavailable}
                onChange={(e) => p.onDraft(e.target.value)}
                placeholder="Indonesia atau Arab…"
              />
              <button
                type="submit"
                disabled={p.preview || p.unavailable || p.loading}
              >
                Cari Isi Kitab
              </button>
            </form>
            {p.preview && (
              <p className="library-search-help">
                Pencarian isi tersedia pada kitab terbit.
              </p>
            )}
            {p.loading && <p role="status">Mencari…</p>}
            {p.error && <p role="alert">{p.error}</p>}
            {!p.loading && p.query && !p.error && (
              <p role="status">{p.results.total} hasil dalam kitab ini</p>
            )}
            <ol className="library-reader-results">
              {p.results.hits.map((hit) => (
                <li key={hit.id}>
                  <Link
                    href={hitUrl(hit, p.query)}
                    scroll={false}
                    onClick={(event) => {
                      if (
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey ||
                        event.button !== 0
                      )
                        return;
                      event.preventDefault();
                      p.onSelect(hit);
                      p.onClose();
                    }}
                  >
                    <span className="library-result-kind">
                      {hit.kind === "footnote" ? "Catatan kaki" : "Isi kitab"}
                    </span>
                    <strong>
                      <SearchHighlight
                        text={hit.chapterTitle}
                        query={p.query}
                      />
                    </strong>
                    <span dir="auto">
                      <SearchHighlight text={hit.text} query={p.query} />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            {p.results.pages > 1 && (
              <nav
                className="library-reader-pagination"
                aria-label="Halaman hasil dalam kitab"
              >
                <button
                  type="button"
                  disabled={p.loading || p.results.page <= 1}
                  onClick={() => p.onPage(p.results.page - 1)}
                >
                  Sebelumnya
                </button>
                <span>
                  {p.results.page}/{p.results.pages}
                </span>
                <button
                  type="button"
                  disabled={p.loading || p.results.page >= p.results.pages}
                  onClick={() => p.onPage(p.results.page + 1)}
                >
                  Berikutnya
                </button>
              </nav>
            )}
          </>
        ) : (
          <>
            {p.tab === "chapters" && (
              <div className="library-reader-search">
                <label htmlFor={`${p.prefix}-chapter-query`}>
                  Cari judul bab
                </label>
                <input
                  id={`${p.prefix}-chapter-query`}
                  type="search"
                  maxLength={200}
                  value={p.chapterQuery}
                  onChange={(e) => p.onChapterQuery(e.target.value)}
                  placeholder="Bab atau subbab…"
                />
              </div>
            )}
            <nav aria-label="Daftar isi kitab">
              {p.chapters.map((chapter, i) => {
                const headings = chapter.blocks.filter(
                  (block) => block.kind === "heading" && (block.level ?? 0) > 1,
                );
                const chapterMatches = matchesSearch(chapter.title, filter);
                const selected = headings.filter((block) =>
                  matchesSearch(
                    block.runs?.map((run) => run.text).join("") ?? "",
                    filter,
                  ),
                );
                if (!chapterMatches && !selected.length) return null;
                return (
                  <div key={chapter.id}>
                    <Link
                      aria-current={i === p.index ? "page" : undefined}
                      href={`/maktabah/kitab/${p.bookSlug}/baca/${chapter.id}${previewQuery}`}
                      onClick={p.onClose}
                    >
                      <SearchHighlight text={chapter.title} query={filter} />
                    </Link>
                    {(chapterMatches ? headings : selected).map((block) => (
                      <Link
                        key={block.id}
                        className={`toc-level-${block.level}`}
                        href={`${i === p.index ? "" : `/maktabah/kitab/${p.bookSlug}/baca/${chapter.id}${previewQuery}`}#${encodeURIComponent(block.id)}`}
                        onClick={p.onClose}
                      >
                        <SearchHighlight
                          text={
                            block.runs?.map((run) => run.text).join("") ?? ""
                          }
                          query={filter}
                        />
                      </Link>
                    ))}
                  </div>
                );
              })}
            </nav>
            {filter &&
              !p.chapters.some(
                (chapter) =>
                  matchesSearch(chapter.title, filter) ||
                  chapter.blocks.some(
                    (block) =>
                      block.kind === "heading" &&
                      matchesSearch(
                        block.runs?.map((run) => run.text).join("") ?? "",
                        filter,
                      ),
                  ),
              ) && <p role="status">Bab tidak ditemukan.</p>}
          </>
        )}
      </div>
    </div>
  );
}
