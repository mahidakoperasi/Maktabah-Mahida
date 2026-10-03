import { notFound } from "next/navigation";
import { getPublicPage } from "@/lib/cms";
import { fans, librarySettings, publicBooks } from "@/lib/maktabah-store";
import { canPreviewLibrary } from "@/lib/maktabah-preview";
import {
  BookCards,
  FanCards,
  LibrarySearch,
} from "@/components/MaktabahCatalog";
import EditorialImage from "@/components/EditorialImage";
import RichContent from "@/components/RichContent";
import DesignSections from "@/components/DesignSections";
import DesignHero from "@/components/DesignHero";
import DesignTextBlock from "@/components/DesignTextBlock";
export const dynamic = "force-dynamic";
export const metadata = { title: "Maktabah Mahida" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ maktabahPreview?: string }>;
}) {
  const preview = await canPreviewLibrary((await searchParams).maktabahPreview);
  if (!preview && !(await getPublicPage("/maktabah"))) notFound();
  const [settings, fanList, books] = await Promise.all([
    librarySettings(preview),
    fans(),
    publicBooks(),
  ]);
  const s = settings.published;
  const featured = books
    .filter((b) => b.meta.featured)
    .sort((a, b) => a.meta.featuredOrder - b.meta.featuredOrder);
  return (
    <div className="library-container">
      {preview && (
        <p className="library-notice">
          Pratinjau draf tampilan · hanya admin dapat melihat draf ini.
        </p>
      )}
      {s.sections
        .filter((section) => section.visible)
        .map((section) => {
          const image = section.imageUrl ? (
            <EditorialImage
              url={section.imageUrl}
              label={section.imageAlt || section.title}
              className="library-section-image"
            />
          ) : null;
          const content = (
            <section
              key={section.id}
              id={`library-${section.id}`}
              className={`library-section library-image-${section.imagePlacement}`}
            >
              <div className="library-section-text">
                {section.id === "intro" ? (
                  <>
                    <p className="library-eyebrow">{section.title}</p>
                    <h1>{s.name}</h1>
                    <div className="library-intro">
                      <RichContent content={s.intro} />
                    </div>
                  </>
                ) : (
                  <h2>{section.title}</h2>
                )}
                {section.id === "search" && <LibrarySearch />}
                {section.id === "fans" && (
                  <FanCards fans={fanList} books={books} />
                )}{" "}
                {section.id === "featured" && (
                  <BookCards books={featured} fans={fanList} settings={s} />
                )}{" "}
                {section.id === "latest" && (
                  <BookCards
                    books={books.slice(0, 12)}
                    fans={fanList}
                    settings={s}
                  />
                )}{" "}
                {section.id === "about" && (
                  <DesignTextBlock path="/maktabah" hasText={Boolean(s.about)}>
                    <RichContent content={s.about} />
                  </DesignTextBlock>
                )}
              </div>
              {image}
            </section>
          );
          return section.id === "intro" ? (
            <DesignHero
              key={section.id}
              path="/maktabah"
              className="library-hero"
            >
              {content}
            </DesignHero>
          ) : (
            content
          );
        })}
      <DesignSections path="/maktabah" />
    </div>
  );
}
