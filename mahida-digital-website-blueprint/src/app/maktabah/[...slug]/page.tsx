import { notFound } from "next/navigation";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPublicPage } from "@/lib/cms";
import {
  bookBySlug,
  fans,
  librarySettings,
  publicBooks,
} from "@/lib/maktabah-store";
import { canPreviewLibrary } from "@/lib/maktabah-preview";
import { getPromotionSettings } from "@/lib/promotion-store";
import {
  BookCards,
  FanCards,
  LibrarySearch,
  searchBooks,
} from "@/components/MaktabahCatalog";
import EditorialImage from "@/components/EditorialImage";
import ArabicText from "@/components/ArabicText";
import RichContent from "@/components/RichContent";
import ProtectedReading from "@/components/ProtectedReading";
import ResumeReading from "@/components/ResumeReading";
import BookReader from "@/components/BookReader";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug[0] !== "kitab" || !slug[1]) return {};
  const book = await bookBySlug(slug[1]);
  return book
    ? {
        title: book.meta.title,
        description: book.meta.summary,
        alternates: {
          canonical: `https://mahida.my.id/maktabah/kitab/${book.slug}`,
        },
      }
    : {};
}
export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{
    q?: string;
    sort?: string;
    maktabahPreview?: string;
  }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const preview = await canPreviewLibrary(query.maktabahPreview);
  if (!preview && !(await getPublicPage("/maktabah"))) notFound();
  const [fanList, settings] = await Promise.all([
    fans(),
    librarySettings(preview),
  ]);
  const s = settings.published;
  if (slug[0] === "kitab" && slug[1]) {
    const book = await bookBySlug(slug[1], preview);
    if (!book) notFound();
    const previewQuery = preview ? "?maktabahPreview=1" : "";
    if (slug[2] === "baca") {
      if (!book.chapters.length)
        return (
          <div className="library-container">
            <h1>Isi kitab belum tersedia</h1>
            <Link href={`/maktabah/kitab/${book.slug}${previewQuery}`}>
              Kembali ke pengenalan kitab
            </Link>
          </div>
        );
      if (!slug[3])
        redirect(
          `/maktabah/kitab/${book.slug}/baca/${book.chapters[0].id}${previewQuery}`,
        );
      if (slug.length !== 4) notFound();
      const index = book.chapters.findIndex((c) => c.id === slug[3]);
      if (index < 0) notFound();
      return (
        <BookReader
          book={book}
          index={index}
          protectedContent={(await getPromotionSettings()).protectionEnabled}
          preview={preview}
        />
      );
    }
    if (slug.length !== 2) notFound();
    const primary = fanList.find((f) => f.slug === book.meta.primaryFan);
    return (
      <div className="library-container">
        {preview && <p className="library-notice">Pratinjau draf kitab</p>}
        <Link className="library-back" href="/maktabah">
          ← Koleksi Maktabah
        </Link>
        <section
          className={`library-book-intro library-cover-${book.meta.coverPlacement}`}
        >
          <EditorialImage
            url={book.meta.coverUrl}
            label={book.meta.coverAlt || `Sampul ${book.meta.title}`}
            className="library-detail-cover"
          />
          <div>
            <p className="library-eyebrow">{primary?.name ?? "Terjemahan"}</p>
            <h1 dir="auto">
              <ArabicText text={book.meta.title} />
            </h1>
            {book.meta.arabicTitle && (
              <p className="library-arabic" dir="rtl">
                <ArabicText text={book.meta.arabicTitle} />
              </p>
            )}
            <span className="library-badge">
              {book.meta.completion === "complete"
                ? "Lengkap"
                : "Terjemahan Bertahap"}
            </span>
            <ProtectedReading enabled={!preview}>
              <RichContent content={book.meta.summary} />
            </ProtectedReading>
            <dl className="library-identities">
              {[
                ["Pengarang", book.meta.authorName],
                ["Penerjemah", book.meta.translatorName],
                ["Penyunting", book.meta.editorName],
                ["Kontributor", book.meta.contributorName],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd dir="auto">
                      <ArabicText text={value} />
                    </dd>
                  </div>
                ))}
            </dl>
            <div className="library-tags">
              {[book.meta.primaryFan, ...book.meta.additionalFans]
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((f) =>
                  fanList.find((fan) => fan.slug === f && fan.visible),
                )
                .filter(Boolean)
                .map((f) => (
                  <Link key={f!.slug} href={`/maktabah/fan/${f!.slug}`}>
                    {f!.name}
                  </Link>
                ))}
            </div>
            <div className="library-actions">
              {book.chapters.length ? (
                <>
                  <Link
                    className="library-button"
                    href={`/maktabah/kitab/${book.slug}/baca/${book.chapters[0].id}${previewQuery}`}
                  >
                    Mulai Membaca
                  </Link>
                  {!preview && (
                    <ResumeReading
                      id={book.id}
                      slug={book.slug}
                      chapterIds={book.chapters.map((c) => c.id)}
                    />
                  )}
                </>
              ) : (
                <p>Isi kitab belum tersedia.</p>
              )}
            </div>
          </div>
        </section>
        {book.meta.preface && (
          <section className="library-section">
            <h2>Kata Pengantar</h2>
            <ProtectedReading enabled={!preview}>
              <RichContent content={book.meta.preface} />
            </ProtectedReading>
          </section>
        )}
        {book.meta.sourceNote && (
          <section className="library-section">
            <h2>Sumber & Penyuntingan</h2>
            <ProtectedReading enabled={!preview}>
              <RichContent content={book.meta.sourceNote} />
            </ProtectedReading>
          </section>
        )}
      </div>
    );
  }
  const books = await publicBooks();
  let title = "Koleksi Kitab";
  let intro = "";
  let selected = books;
  let action = "/maktabah/pencarian";
  if (slug[0] === "fan" && slug.length === 1)
    return (
      <div className="library-container">
        <h1>Fan Kitab</h1>
        <FanCards fans={fanList} books={books} />
      </div>
    );
  const fanSlug =
    slug[0] === "fan" && slug.length === 2
      ? slug[1]
      : slug.length === 1 && fanList.some((f) => f.slug === slug[0])
        ? slug[0]
        : null;
  if (fanSlug) {
    const fan = fanList.find((f) => f.slug === fanSlug && f.visible);
    if (!fan) notFound();
    title = fan.name;
    intro = fan.intro;
    selected = books.filter(
      (b) =>
        b.meta.primaryFan === fan.slug ||
        b.meta.additionalFans.includes(fan.slug),
    );
    action = `/maktabah/fan/${fan.slug}`;
  } else if (
    slug.length === 1 &&
    ["pencarian", "kitab", "terjemahan", "kajian", "bahasa-arab"].includes(
      slug[0],
    )
  ) {
    title =
      slug[0] === "pencarian"
        ? "Pencarian Kitab"
        : slug[0] === "kajian"
          ? "Kajian"
          : slug[0] === "bahasa-arab"
            ? "Bahasa Arab"
            : "Koleksi Kitab";
    if (slug[0] === "kajian") selected = [];
    if (slug[0] === "bahasa-arab")
      selected = books.filter((b) =>
        ["nahwu", "sharaf", "balaghah"].includes(b.meta.primaryFan),
      );
  } else notFound();
  selected = searchBooks(selected, (query.q ?? "").slice(0, 200));
  if (query.sort === "az")
    selected.sort((a, b) => a.meta.title.localeCompare(b.meta.title, "id"));
  return (
    <div className="library-container">
      <p className="library-eyebrow">Maktabah Mahida</p>
      <h1>{title}</h1>
      {intro && <RichContent content={intro} />}
      <LibrarySearch query={query.q ?? ""} action={action} />
      <nav className="library-sort" aria-label="Urutan kitab">
        <Link
          aria-current={query.sort !== "az" ? "page" : undefined}
          href={`${action}?q=${encodeURIComponent(query.q ?? "")}&sort=latest`}
        >
          Terbaru
        </Link>
        <Link
          aria-current={query.sort === "az" ? "page" : undefined}
          href={`${action}?q=${encodeURIComponent(query.q ?? "")}&sort=az`}
        >
          A–Z
        </Link>
      </nav>
      <p className="library-result-count">{selected.length} kitab</p>
      <BookCards books={selected} fans={fanList} settings={s} />
    </div>
  );
}
