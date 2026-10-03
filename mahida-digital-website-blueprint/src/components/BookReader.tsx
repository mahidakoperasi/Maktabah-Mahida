"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
}: {
  book: Book;
  index: number;
  protectedContent: boolean;
  preview?: boolean;
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
  useEffect(() => {
    const hydration = requestAnimationFrame(() => {
      try {
        const saved = Number(localStorage.getItem("mahida-reading-font"));
        if (saved >= 18 && saved <= 28) setFont(saved);
        if (new URLSearchParams(location.search).get("lanjut") === "1") {
          const p = JSON.parse(
            localStorage.getItem(readingKey(book.id)) ?? "null",
          ) as ReadingPosition | null;
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
  const toc = (
    <nav aria-label="Daftar isi kitab">
      {book.chapters.map((c, i) => (
        <div key={c.id}>
          <Link
            aria-current={i === index ? "page" : undefined}
            href={`/maktabah/kitab/${book.slug}/baca/${c.id}${previewQuery}`}
            onClick={closeToc}
          >
            {c.title}
          </Link>
          {c.blocks
            .filter((b) => b.kind === "heading" && (b.level ?? 0) > 1)
            .map((b) => (
              <Link
                key={b.id}
                className={`toc-level-${b.level}`}
                href={`${i === index ? "" : `/maktabah/kitab/${book.slug}/baca/${c.id}${previewQuery}`}#${b.id}`}
                onClick={closeToc}
              >
                {b.runs?.map((r) => r.text).join("")}
              </Link>
            ))}
        </div>
      ))}
    </nav>
  );
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
      </div>
      <div className="library-reader-grid">
        <aside className="library-desktop-toc">
          <h2>Daftar Isi</h2>
          {toc}
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
                  <RichContent content={chapter.legacy} />
                ) : (
                  <KitabBlocks blocks={chapter.blocks} />
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
        <div>
          <h2 id="mobile-toc-title">Daftar Isi</h2>
          <button onClick={closeToc} aria-label="Tutup daftar isi">
            ×
          </button>
        </div>
        {toc}
      </dialog>
    </div>
  );
}
