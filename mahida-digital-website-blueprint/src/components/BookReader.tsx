"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { LibrarySettings } from "@/lib/maktabah-schema";
import { collectFootnotes, type Footnote } from "@/lib/kitab-footnotes";
import {
  hitUrl,
  type SearchHit,
  type SearchResponse,
} from "@/lib/kitab-search-text";
import BookReaderNavigation from "./BookReaderNavigation";
import KitabFootnoteDialog, { type OpenFootnote } from "./KitabFootnoteDialog";
import type { Book } from "@/lib/maktabah-store";
import KitabBlocks from "./KitabBlocks";
import RichContent from "./RichContent";
import ArabicText from "./ArabicText";
import ProtectedReadingClient from "./ProtectedReadingClient";
export type ReadingPosition = {
  chapter: string;
  scroll: number;
  hash: string;
  updated: number;
};
export const readingKey = (id: number) => `mahida-reading-${id}`;
export default function BookReader({
  book,
  index,
  protectedContent,
  preview = false,
  readingSettings,
}: {
  book: Book;
  index: number;
  protectedContent: boolean;
  preview?: boolean;
  readingSettings: LibrarySettings["reading"];
}) {
  const chapter = book.chapters[index];
  const [font, setFont] = useState(20);
  const [updated, setUpdated] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [message, setMessage] = useState("");
  const [tocOpen, setTocOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const tocButton = useRef<HTMLButtonElement>(null);
  const previewQuery = preview ? "?maktabahPreview=1" : "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = (searchParams.get("q") ?? "").slice(0, 200);
  const resultId = searchParams.get("result") ?? "";
  const searchHash = searchParams.get("searchHash") ?? "";
  const [tab, setTab] = useState(urlQuery ? "body" : "toc");
  const [chapterQuery, setChapterQuery] = useState("");
  const [query, setQuery] = useState(urlQuery);
  const [draft, setDraft] = useState(urlQuery);
  const [searchPaging, setSearchPaging] = useState({ page: 0, key: "" });
  const searchKey = `${book.id}:${resultId}:${query}`;
  const searchPage = searchPaging.key === searchKey ? searchPaging.page : 0;
  const [navigating, startNavigation] = useTransition();
  const chapterIds = book.chapters.map((c) => c.id).join("\u0000");
  const [results, setResults] = useState<SearchResponse>({
    hits: [],
    total: 0,
    page: 1,
    pages: 0,
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [origin, setOrigin] = useState<ReadingPosition | null>(null);
  const [noteOpen, setNoteOpen] = useState<OpenFootnote | null>(null);
  const adjacent = useRef<"first" | "last" | null>(null);
  const notes = collectFootnotes(book.chapters);
  const originKey = `mahida-search-origin-${book.id}`;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setQuery(urlQuery);
      setDraft(urlQuery);
      if (urlQuery) setTab("body");
      setNoteOpen(null);
      try {
        const saved = JSON.parse(
          sessionStorage.getItem(originKey) ?? "null",
        ) as ReadingPosition | null;
        setOrigin(
          saved && chapterIds.split("\u0000").includes(saved.chapter)
            ? saved
            : null,
        );
      } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, [urlQuery, originKey, chapterIds]);
  useEffect(() => {
    let stopped = false;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchError("");
      if (!query.trim() || preview || unavailable) {
        setResults({ hits: [], total: 0, page: 1, pages: 0 });
        setSearchLoading(false);
        return;
      }
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          kitab: book.slug,
          page: String(searchPage || 1),
        });
        if (!searchPage && resultId) params.set("selected", resultId);
        const response = await fetch(`/api/maktabah/pencarian?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw Error(data.error ?? "Pencarian gagal.");
        if (stopped) return;
        setResults(data);
        if (adjacent.current && data.hits.length) {
          const hit =
            adjacent.current === "first"
              ? data.hits[0]
              : data.hits[data.hits.length - 1];
          adjacent.current = null;
          startNavigation(() =>
            router.push(hitUrl(hit, query, data.page), { scroll: false }),
          );
        }
      } catch (error) {
        if (!stopped)
          setSearchError(
            error instanceof Error ? error.message : "Pencarian gagal.",
          );
      } finally {
        if (!stopped) setSearchLoading(false);
      }
    }, 0);
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    query,
    searchPage,
    resultId,
    book.slug,
    book.contentHash,
    preview,
    unavailable,
    router,
  ]);
  const scrollToResult = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (!target || !target.closest(".library-reading")) {
      setMessage("Bagian hasil pencarian berubah. Jalankan pencarian kembali.");
      return;
    }
    const element =
      id === "legacy-content"
        ? (target
            .querySelector("[data-search-match]")
            ?.closest("p,li,blockquote,td,h2,h3") ?? target)
        : target;
    document
      .querySelectorAll(".library-search-target")
      .forEach((e) => e.classList.remove("library-search-target"));
    element.classList.add("library-search-target");
    element.scrollIntoView({ block: "center", behavior: "instant" });
  }, []);
  useEffect(() => {
    if (!urlQuery || !resultId || query !== urlQuery || unavailable) return;
    const frame = requestAnimationFrame(() => {
      if (searchHash && searchHash !== book.contentHash)
        setMessage(
          "Isi telah diperbarui sejak pencarian. Periksa hasil pencarian terbaru.",
        );
      let target = "";
      try {
        target = decodeURIComponent(location.hash.slice(1));
      } catch {}
      if (target) scrollToResult(target);
    });
    return () => cancelAnimationFrame(frame);
  }, [
    urlQuery,
    resultId,
    query,
    chapter.id,
    book.contentHash,
    searchHash,
    unavailable,
    scrollToResult,
  ]);
  function rememberOrigin() {
    if (origin) return;
    const saved = {
      chapter: chapter.id,
      scroll: scrollY,
      hash: book.contentHash,
      updated: Date.now(),
    };
    setOrigin(saved);
    try {
      sessionStorage.setItem(originKey, JSON.stringify(saved));
    } catch {}
  }
  function startSearch() {
    rememberOrigin();
    adjacent.current = null;
    setSearchPaging({ key: "", page: 0 });
    setQuery(draft.trim());
  }
  function selectHit(hit: SearchHit) {
    rememberOrigin();
    if (hit.chapterId === chapter.id)
      requestAnimationFrame(() => scrollToResult(hit.blockId));
    startNavigation(() =>
      router.push(hitUrl(hit, query, results.page), { scroll: false }),
    );
  }
  function returnToReading() {
    if (!origin) return;
    if (origin.chapter === chapter.id) {
      history.replaceState(null, "", location.pathname);
      setQuery("");
      setDraft("");
      setTab("toc");
      document
        .querySelectorAll(".library-search-target")
        .forEach((e) => e.classList.remove("library-search-target"));
      if (origin.hash === book.contentHash)
        scrollTo({ top: origin.scroll, behavior: "instant" });
      else
        setMessage(
          "Isi kitab diperbarui. Anda kembali ke bab sebelum pencarian.",
        );
    } else {
      try {
        sessionStorage.setItem(
          `mahida-reading-return-${book.id}`,
          JSON.stringify(origin),
        );
      } catch {}
      location.assign(
        `/maktabah/kitab/${book.slug}/baca/${origin.chapter}?lanjut=1&kembali=1`,
      );
    }
    setOrigin(null);
    try {
      sessionStorage.removeItem(originKey);
    } catch {}
  }
  function openNote(note: Footnote, trigger: HTMLAnchorElement) {
    const rect = trigger.getBoundingClientRect();
    setNoteOpen({
      note,
      trigger,
      left: Math.max(16, Math.min(innerWidth - 456, rect.left)),
      top: Math.max(16, Math.min(innerHeight - 350, rect.bottom + 10)),
    });
  }
  function closeNote() {
    noteOpen?.trigger.focus({ preventScroll: true });
    setNoteOpen(null);
  }
  const selectedResult = results.hits.findIndex((hit) => hit.id === resultId);
  function moveResult(direction: number) {
    rememberOrigin();
    const next = selectedResult < 0 ? 0 : selectedResult + direction;
    if (next >= 0 && next < results.hits.length)
      startNavigation(() =>
        router.push(hitUrl(results.hits[next], query, results.page), {
          scroll: false,
        }),
      );
    else if (direction > 0 && results.page < results.pages) {
      adjacent.current = "first";
      setSearchPaging({ key: searchKey, page: results.page + 1 });
    } else if (direction < 0 && results.page > 1) {
      adjacent.current = "last";
      setSearchPaging({ key: searchKey, page: results.page - 1 });
    }
  }
  const navigationProps = {
    chapters: book.chapters,
    index,
    bookSlug: book.slug,
    preview,
    tab,
    onTab: setTab,
    chapterQuery,
    onChapterQuery: setChapterQuery,
    query,
    draft,
    onDraft: setDraft,
    onSearch: startSearch,
    results,
    loading: searchLoading || navigating,
    error: searchError,
    unavailable,
    onPage: (page: number) => {
      adjacent.current = null;
      setSearchPaging({ key: searchKey, page });
    },
    onSelect: selectHit,
    onClose: closeToc,
  };

  useEffect(() => {
    const hydration = requestAnimationFrame(() => {
      try {
        const saved = Number(localStorage.getItem("mahida-reading-font"));
        if (saved >= 18 && saved <= 28) setFont(saved);
        if (new URLSearchParams(location.search).get("lanjut") === "1") {
          const returning =
            new URLSearchParams(location.search).get("kembali") === "1";
          const returnKey = `mahida-reading-return-${book.id}`;
          const p = JSON.parse(
            (returning
              ? sessionStorage.getItem(returnKey)
              : localStorage.getItem(readingKey(book.id))) ?? "null",
          ) as ReadingPosition | null;
          if (returning) sessionStorage.removeItem(returnKey);
          if (p?.chapter === chapter.id) {
            if (p.hash === book.contentHash)
              requestAnimationFrame(() =>
                scrollTo({ top: p.scroll, behavior: "instant" }),
              );
            else
              setMessage(
                "Isi kitab diperbarui. Anda melanjutkan dari bab terakhir.",
              );
          }
        }
      } catch {
        /* Reading remains usable when storage is unavailable. */
      }
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    function save() {
      if (preview) return;
      try {
        localStorage.setItem(
          readingKey(book.id),
          JSON.stringify({
            chapter: chapter.id,
            scroll: window.scrollY,
            hash: book.contentHash,
            updated: Date.now(),
          }),
        );
      } catch {}
    }
    function onScroll() {
      clearTimeout(timer);
      timer = setTimeout(save, 500);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", save);
    return () => {
      cancelAnimationFrame(hydration);
      clearTimeout(timer);
      save();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", save);
    };
  }, [book.id, book.contentHash, chapter.id, preview]);
  useEffect(() => {
    if (preview) return;
    let stopped = false;
    const controller = new AbortController();
    async function check() {
      try {
        const r = await fetch(`/api/maktabah/kitab/${book.slug}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (stopped) return;
        if (r.status === 410 || r.status === 404) {
          setUnavailable(true);
          return;
        }
        if (r.ok) {
          const data = await r.json();
          if (!stopped && data.hash !== book.contentHash) setUpdated(true);
        }
      } catch {}
    }
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void check();
    }, 120000);
    const visible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      stopped = true;
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [book.slug, book.contentHash, preview]);
  useEffect(() => {
    if (tocOpen && !dialog.current?.open) dialog.current?.showModal();
    else if (!tocOpen && dialog.current?.open) dialog.current.close();
  }, [tocOpen]);
  function closeToc() {
    setTocOpen(false);
    tocButton.current?.focus();
  }
  function changeFont(value: number) {
    const next = Math.min(28, Math.max(18, value));
    setFont(next);
    try {
      localStorage.setItem("mahida-reading-font", String(next));
    } catch {}
  }
  async function share() {
    const url = `${location.origin}/maktabah/kitab/${book.slug}/baca/${chapter.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Tautan bab disalin.");
    } catch {
      setMessage(`Tautan bab: ${url}`);
    }
  }
  return (
    <div className="library-container library-reader-container">
      <Link
        href={`/maktabah/kitab/${book.slug}${previewQuery}`}
        className="library-back"
      >
        ← Pengenalan kitab
      </Link>
      <header className="library-reader-heading">
        <p className="library-eyebrow">
          <ArabicText text={book.meta.title} />
        </p>
        <h1 dir="auto">
          <ArabicText text={chapter.title} />
        </h1>
      </header>
      {preview && <p className="library-notice">Pratinjau draf kitab</p>}
      {message && (
        <p role="status" className="library-notice break-words">
          {message}
        </p>
      )}
      {updated && !unavailable && (
        <div role="status" className="library-notice library-update-notice">
          Isi kitab telah diperbarui. Posisi bacaan Anda tetap di sini.{" "}
          <button
            onClick={() => {
              try {
                localStorage.setItem(
                  readingKey(book.id),
                  JSON.stringify({
                    chapter: chapter.id,
                    scroll: scrollY,
                    hash: book.contentHash,
                    updated: Date.now(),
                  }),
                );
              } catch {}
              location.assign(`${location.pathname}?lanjut=1`);
            }}
          >
            Muat pembaruan
          </button>
        </div>
      )}
      <div className="library-reader-tools">
        <button
          ref={tocButton}
          className="library-toc-toggle"
          aria-expanded={tocOpen}
          aria-controls="mobile-kitab-toc"
          onClick={() => setTocOpen(true)}
        >
          Daftar Isi
        </button>
        <span>Ukuran huruf</span>
        <button
          aria-label="Perkecil huruf"
          disabled={font === 18}
          onClick={() => changeFont(font - 2)}
        >
          A−
        </button>
        <output aria-label="Ukuran huruf saat ini">{font}px</output>
        <button
          aria-label="Perbesar huruf"
          disabled={font === 28}
          onClick={() => changeFont(font + 2)}
        >
          A+
        </button>
        <button onClick={share}>Bagikan Bab</button>
        {origin && (
          <button onClick={returnToReading}>Kembali ke posisi baca</button>
        )}
        {query && !unavailable && results.total > 0 && (
          <div
            className="library-search-controls"
            aria-label="Navigasi hasil pencarian"
          >
            <button
              disabled={
                searchLoading ||
                navigating ||
                (selectedResult <= 0 && results.page <= 1)
              }
              onClick={() => moveResult(-1)}
            >
              Hasil sebelumnya
            </button>
            <span>
              {selectedResult >= 0
                ? `${(results.page - 1) * 12 + selectedResult + 1} / ${results.total}`
                : `${results.total} hasil`}
            </span>
            <button
              disabled={
                searchLoading ||
                navigating ||
                (selectedResult === results.hits.length - 1 &&
                  results.page >= results.pages)
              }
              onClick={() => moveResult(1)}
            >
              Hasil berikutnya
            </button>
          </div>
        )}
      </div>
      <div className="library-reader-grid">
        <aside className="library-desktop-toc">
          <h2>Daftar Isi</h2>
          <BookReaderNavigation {...navigationProps} prefix="desktop" />
        </aside>
        <article className="library-reading" style={{ fontSize: font }}>
          {unavailable ? (
            <p role="alert" className="library-empty">
              Kitab sementara tidak tersedia. Akses sumber atau status
              penerbitannya telah berubah.
            </p>
          ) : (
            <>
              <ProtectedReadingClient enabled={protectedContent && !preview}>
                {chapter.legacy ? (
                  <div id="legacy-content">
                    <RichContent content={chapter.legacy} query={query} />
                  </div>
                ) : (
                  <KitabBlocks
                    blocks={chapter.blocks}
                    query={query}
                    footnotes={notes}
                    onFootnote={openNote}
                    footnoteFontSize={readingSettings.footnoteFontSize}
                  />
                )}
              </ProtectedReadingClient>
              <nav className="library-chapter-nav" aria-label="Navigasi bab">
                {index > 0 ? (
                  <Link
                    href={`/maktabah/kitab/${book.slug}/baca/${book.chapters[index - 1].id}${previewQuery}`}
                  >
                    ← Bab Sebelumnya
                  </Link>
                ) : (
                  <span />
                )}
                {index < book.chapters.length - 1 && (
                  <Link
                    href={`/maktabah/kitab/${book.slug}/baca/${book.chapters[index + 1].id}${previewQuery}`}
                  >
                    Bab Berikutnya →
                  </Link>
                )}
              </nav>
            </>
          )}
        </article>
      </div>
      <dialog
        ref={dialog}
        id="mobile-kitab-toc"
        aria-labelledby="mobile-toc-title"
        className="library-toc-dialog"
        onCancel={(e) => {
          e.preventDefault();
          closeToc();
        }}
        onClose={() => setTocOpen(false)}
      >
        <div className="library-dialog-heading">
          <h2 id="mobile-toc-title">Daftar Isi & Pencarian</h2>
          <button onClick={closeToc} aria-label="Tutup daftar isi">
            ×
          </button>
        </div>
        <BookReaderNavigation {...navigationProps} prefix="mobile" />
      </dialog>
      <KitabFootnoteDialog
        open={unavailable ? null : noteOpen}
        onClose={closeNote}
        fontSize={readingSettings.footnoteFontSize}
        protectedContent={protectedContent && !preview}
        query={query}
      />
    </div>
  );
}
