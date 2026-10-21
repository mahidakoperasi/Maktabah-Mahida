import Link from 'next/link';
import { getPublicMenu } from '@/lib/cms';
import { getVisibleDirectory } from '@/lib/public-directory-store';
import PublicDirectoryLinks from '@/components/PublicDirectoryLinks';
import { getHomepageSettings } from '@/lib/homepage-settings';
import BrandLogo from './BrandLogo';

export default async function Footer() {
  const [items, directory, settings] = await Promise.all([
    getPublicMenu(),
    getVisibleDirectory(),
    getHomepageSettings(),
  ]);
  const footerItems = items.filter((item) => item.path !== '/');

  return (
    <footer data-motion="fade" className="site-footer bg-[#062d20] text-white">
      <div className="mx-auto max-w-[1450px] px-5 py-10 sm:px-8 md:py-12 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_2.4fr] lg:gap-12">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              {settings.siteLogoUrl && (
                <BrandLogo
                  url={settings.siteLogoUrl}
                  name={settings.siteName}
                  className="h-12 w-12"
                />
              )}
              <div>
                <p className="font-serif text-2xl font-bold leading-tight">
                  {settings.siteName}
                </p>
                <p className="text-xs text-white/65">{settings.siteTagline}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/70">
              {settings.footerDescription}
            </p>
          </div>

          <nav
            aria-label="Tautan footer"
            className="grid gap-6 border-t border-white/15 pt-7 sm:grid-cols-2 lg:border-t-0 lg:pt-0 xl:grid-cols-4"
          >
            {footerItems.map((item) => (
              <div key={item.id} className="min-w-0">
                <Link
                  href={item.path}
                  className="inline-flex min-h-9 items-center text-sm font-semibold uppercase tracking-[0.08em] text-[#f0d43b]"
                >
                  {item.label}
                </Link>
                {item.children.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {item.children.slice(0, 6).map((child) => (
                      <Link
                        key={child.id}
                        href={child.path}
                        className="flex min-h-8 items-center text-sm leading-6 text-white/70 transition hover:text-white"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {(directory.socials.length > 0 || directory.contacts.length > 0) && (
          <PublicDirectoryLinks {...directory} variant="footer" />
        )}

        <p className="mt-8 border-t border-white/15 pt-5 text-xs text-white/55">
          © {new Date().getFullYear()} {settings.siteName}
        </p>
      </div>
    </footer>
  );
}
