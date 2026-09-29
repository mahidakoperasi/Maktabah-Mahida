import Link from 'next/link';
import { getPublicMenu } from '@/lib/cms';
import { getVisibleDirectory } from '@/lib/public-directory-store';
import PublicDirectoryLinks from '@/components/PublicDirectoryLinks';
import { getHomepageSettings } from '@/lib/homepage-settings';
import EditorialImage from './EditorialImage';

export default async function Footer() {
  const [items, directory, settings] = await Promise.all([getPublicMenu(), getVisibleDirectory(), getHomepageSettings()]);
  return (
    <footer className="site-footer bg-[#062d20] text-white">
      <div className="mx-auto max-w-[1450px] px-5 py-14 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          {settings.siteLogoUrl && <EditorialImage url={settings.siteLogoUrl} label={`Logo ${settings.siteName}`} className="h-14 w-14 object-contain" />}
          <div><p className="font-serif text-2xl font-bold">{settings.siteName}</p><p className="text-xs text-white/65">{settings.siteTagline}</p></div>
        </div>
        <p className="mt-5 max-w-xl text-sm text-white/70">{settings.footerDescription}</p>
        <nav aria-label="Tautan footer" className="mt-10 grid gap-8 border-t border-white/15 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.filter((item) => item.path !== '/').map((item) => (
            <div key={item.id}>
              <Link href={item.path} className="inline-flex min-h-11 items-center font-semibold text-[#f0d43b]">{item.label}</Link>
              <div className="mt-2 space-y-1">{item.children.map((child) => <Link key={child.id} href={child.path} className="flex min-h-11 items-center text-sm text-white/70 hover:text-white">{child.label}</Link>)}</div>
            </div>
          ))}
        </nav>
        {(directory.socials.length > 0 || directory.contacts.length > 0) &&
          <PublicDirectoryLinks {...directory} variant="footer" />}
        <p className="mt-12 border-t border-white/15 pt-6 text-xs text-white/55">© {new Date().getFullYear()} {settings.siteName}</p>
      </div>
    </footer>
  );
}
