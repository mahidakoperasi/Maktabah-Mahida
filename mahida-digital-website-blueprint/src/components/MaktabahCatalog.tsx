import Link from "next/link";
import type { Book } from "@/lib/maktabah-store";
import type { Fan, LibrarySettings } from "@/lib/maktabah-schema";
import ArabicText from "./ArabicText";
import EditorialImage from "./EditorialImage";
import { defaultLibrarySettings } from "@/lib/maktabah-schema";
import { matchesSearch } from "@/lib/kitab-search-text";
export function LibrarySearch({
  query = "",
  action = "/maktabah/pencarian",
  settings = defaultLibrarySettings,
  advanced = false,
  fans = [],
  selectedKind = "all",
  selectedFan = "",
}: {
  query?: string;
  action?: string;
  settings?: LibrarySettings;
  advanced?: boolean;
  fans?: Fan[];
  selectedKind?: string;
  selectedFan?: string;
}) {
  return (
    <form action={action} method="get" role="search" className="library-search">
      <label htmlFor="library-q">{settings.search.label}</label>
      <div>
        <input
          id="library-q"
          type="search"
          name="q"
          defaultValue={query}
          placeholder={settings.search.placeholder}
          maxLength={200}
        />
        <button type="submit">{settings.search.buttonLabel}</button>
      </div>
      {!advanced && selectedFan && (
        <input type="hidden" name="fan" value={selectedFan} />
      )}
      {advanced && (
        <div className="library-search-filters">
          <label>
            Jenis hasil
            <select name="jenis" defaultValue={selectedKind}>
              <option value="all">Semua</option>
              <option value="book">Kitab</option>
              <option value="chapter">Bab</option>
              <option value="body">Isi</option>
            </select>
          </label>
          <label>
            Fan
            <select name="fan" defaultValue={selectedFan}>
              <option value="">Seluruh fan</option>
              {fans
                .filter((f) => f.visible)
                .map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {f.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}
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
      className={`library-books library-columns-${settings.columns} library-cards-${settings.cardStyle}`}
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
  return books.filter((b) =>
    matchesSearch(
      `${b.meta.title} ${b.meta.arabicTitle} ${b.meta.summary}`,
      query,
    ),
  );
}
