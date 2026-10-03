import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { librarySettings } from "@/lib/maktabah-store";
import { getHomepageSettings } from "@/lib/homepage-settings";
export default async function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, site] = await Promise.all([
    librarySettings(),
    getHomepageSettings(),
  ]);
  const s = settings.published;
  return (
    <div className="maktabah-theme">
      <header className="library-header">
        <Link href="/maktabah" className="library-brand">
          <BrandLogo url={s.logoUrl || site.siteLogoUrl} name={s.name} />
          <span>{s.name}</span>
        </Link>
        <Link href="/" className="library-back">
          ← Kembali ke Mahida
        </Link>
        <nav aria-label="Navigasi Maktabah">
          <Link href="/maktabah">Beranda Maktabah</Link>
          <Link href="/maktabah/fan">Fan Kitab</Link>
          <Link href="/maktabah/pencarian">Pencarian</Link>
        </nav>
      </header>
      {children}
      <footer className="library-footer">
        <p>{s.name} · Perpustakaan terjemahan kitab Mahida</p>
        <Link href="/">Kembali ke Mahida</Link>
      </footer>
    </div>
  );
}
