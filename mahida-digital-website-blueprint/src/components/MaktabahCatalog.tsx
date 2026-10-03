import Link from "next/link";
import type { Book } from "@/lib/maktabah-store";
import type { Fan, LibrarySettings } from "@/lib/maktabah-schema";
import ArabicText from "./ArabicText";
import EditorialImage from "./EditorialImage";
export function LibrarySearch({
  query = "",
  action = "/maktabah/pencarian",
}: {
  query?: string;
  action?: string;
}) {
  return (
    <form action={action} method="get" role="search" className="library-search">
      <label htmlFor="library-q">Cari judul kitab atau topik</label>
      <div>
        <input
          id="library-q"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Judul kitab, ringkasan, atau topik…"
          maxLength={200}
        />
        <button type="submit">Cari Kitab</button>
      </div>
    </form>
  );
}
export function BookCards({
  books,
  fans,
  settings,
}: {
  books: Book[];
  fans: Fan[];
  settings: LibrarySettings;
}) {
  return books.length ? (
    <div
      className={`library-books library-columns-${settings.columns} library-${settings.cardStyle}`}
    >
      {books.map((book) => (
        <article key={book.id} className="library-book">
          <Link href={`/maktabah/kitab/${book.slug}`}>
            <div className="library-cover">
              <EditorialImage
                url={book.meta.coverUrl}
                label={book.meta.coverAlt || `Sampul ${book.meta.title}`}
                className="h-full w-full"
              />
            </div>
            <div className="library-card-body">
              <p className="library-eyebrow">
                {fans.find((f) => f.slug === book.meta.primaryFan)?.name ??
                  "Terjemahan"}
              </p>
              <h3 dir="auto">
                <ArabicText text={book.meta.title} />
              </h3>
              {book.meta.arabicTitle && (
                <p className="library-arabic" dir="rtl">
                  <ArabicText text={book.meta.arabicTitle} />
                </p>
              )}
              <p className="library-summary">{book.meta.summary}</p>
              <span className="library-badge">
                {book.meta.completion === "complete"
                  ? "Lengkap"
                  : "Terjemahan Bertahap"}
              </span>
            </div>
          </Link>
        </article>
      ))}
    </div>
  ) : (
    <p className="library-empty">Belum ada kitab terbit di bagian ini.</p>
  );
}
export function FanCards({ fans, books }: { fans: Fan[]; books: Book[] }) {
  const visible = fans.filter(
    (f) =>
      f.visible &&
      books.some(
        (b) =>
          b.meta.primaryFan === f.slug ||
          b.meta.additionalFans.includes(f.slug),
      ),
  );
  return visible.length ? (
    <div className="library-fans">
      {visible.map((f) => (
        <Link key={f.slug} href={`/maktabah/fan/${f.slug}`}>
          <EditorialImage
            url={f.imageUrl}
            label={f.imageAlt || f.name}
            className="aspect-video w-full"
            hideFallback
          />
          <h3>{f.name}</h3>
          <p>
            {
              books.filter(
                (b) =>
                  b.meta.primaryFan === f.slug ||
                  b.meta.additionalFans.includes(f.slug),
              ).length
            }{" "}
            kitab
          </p>
        </Link>
      ))}
    </div>
  ) : (
    <p className="library-empty">
      Fan akan tampil setelah memiliki kitab terbit.
    </p>
  );
}
export function searchBooks(books: Book[], query: string) {
  const terms = query
    .trim()
    .toLocaleLowerCase("id-ID")
    .split(/\s+/)
    .filter(Boolean);
  return books.filter((b) =>
    terms.every((term) =>
      `${b.meta.title} ${b.meta.arabicTitle} ${b.meta.summary}`
        .toLocaleLowerCase("id-ID")
        .includes(term),
    ),
  );
}
