import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { librarySettings } from "@/lib/maktabah-store";
import { getHomepageSettings } from "@/lib/homepage-settings";
import { headers } from "next/headers";
import { canPreviewLibrary } from "@/lib/maktabah-preview";
import MaktabahFooter from "@/components/MaktabahFooter";
export default async function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const preview = await canPreviewLibrary(
    (await headers()).get("x-mahida-maktabah-preview") ?? undefined,
  );
  const query = preview ? "?maktabahPreview=1" : "";
  const [settings, site] = await Promise.all([
    librarySettings(preview),
    getHomepageSettings(),
  ]);
  const s = settings.published;
  return (
    <div className="maktabah-theme">
      <header className="library-header">
        <Link href={`/maktabah${query}`} className="library-brand">
          <BrandLogo url={s.logoUrl || site.siteLogoUrl} name={s.name} />
          <span>{s.name}</span>
        </Link>
        <Link href="/" className="library-back">
          ← Kembali ke Mahida
        </Link>
        <nav aria-label="Navigasi Maktabah">
          <Link href={`/maktabah${query}`}>Beranda Maktabah</Link>
          <Link href={`/maktabah/fan${query}`}>Fan Kitab</Link>
          <Link href={`/maktabah/pencarian${query}`}>Pencarian</Link>
        </nav>
      </header>
      {children}
      <MaktabahFooter settings={s} />
    </div>
  );
}
