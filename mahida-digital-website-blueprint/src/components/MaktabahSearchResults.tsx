import Link from "next/link";
import { searchLibrary } from "@/lib/maktabah-search";
import { hitUrl } from "@/lib/kitab-search-text";
import type { Fan, LibrarySettings } from "@/lib/maktabah-schema";
import SearchHighlight from "./SearchHighlight";
import ProtectedReading from "./ProtectedReading";
import { LibrarySearch } from "./MaktabahCatalog";
export default async function MaktabahSearchResults({
  query,
  settings,
  fans,
  kind = "all",
  fan = "",
  page = 1,
}: {
  query: string;
  settings: LibrarySettings;
  fans: Fan[];
  kind?: string;
  fan?: string;
  page?: number;
}) {
  const result = await searchLibrary(query, { kind, fan, page }).catch(
    () => null,
  );
  function url(next: number) {
    return `/maktabah/pencarian?${new URLSearchParams({ q: query, jenis: kind, fan, page: String(next) })}`;
  }
  return (
    <div className="library-container">
      <p className="library-eyebrow">{settings.name}</p>
      <h1>{settings.search.resultsTitle}</h1>
      <LibrarySearch
        query={query}
        settings={settings}
        fans={fans}
        advanced
        selectedKind={kind}
        selectedFan={fan}
      />
      {!result ? (
        <p role="alert" className="library-empty">
          Pencarian sementara gagal. Coba kembali.
        </p>
      ) : !query.trim() ? (
        <p className="library-empty">
          Masukkan judul kitab, judul bab, atau teks untuk menelusuri koleksi.
        </p>
      ) : (
        <>
          <p className="library-result-count" role="status">
            {result.total} hasil pencarian
          </p>
          {!result.total && (
            <p className="library-empty">
              Belum ditemukan hasil. Coba kata yang lebih singkat atau pilih
              Semua dan seluruh fan.
            </p>
          )}
          <ol className="library-search-results">
            {result.hits.map((hit) => (
              <li key={hit.id}>
                <p className="library-eyebrow">
                  {hit.kind === "book"
                    ? "Kitab"
                    : hit.kind === "chapter"
                      ? "Bab"
                      : hit.kind === "footnote"
                        ? "Catatan kaki"
                        : "Isi kitab"}{" "}
                  · {fans.find((f) => f.slug === hit.fan)?.name ?? "Terjemahan"}
                </p>
                <h2>
                  <Link href={hitUrl(hit, query)}>
                    <SearchHighlight
                      text={
                        hit.kind === "book"
                          ? hit.bookTitle
                          : hit.kind === "chapter"
                            ? hit.text
                            : hit.chapterTitle
                      }
                      query={query}
                    />
                  </Link>
                </h2>
                {hit.kind !== "book" && (
                  <p className="library-search-book">
                    <SearchHighlight text={hit.bookTitle} />
                  </p>
                )}
                <ProtectedReading>
                  <p dir="auto" className="library-search-snippet">
                    <SearchHighlight text={hit.text} query={query} />
                  </p>
                </ProtectedReading>
              </li>
            ))}
          </ol>
          {result.pages > 1 && (
            <nav
              aria-label="Halaman hasil pencarian"
              className="library-search-pagination"
            >
              {result.page > 1 && (
                <Link href={url(result.page - 1)}>Hasil sebelumnya</Link>
              )}
              <span>
                Halaman {result.page} dari {result.pages}
              </span>
              {result.page < result.pages && (
                <Link href={url(result.page + 1)}>Hasil berikutnya</Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
