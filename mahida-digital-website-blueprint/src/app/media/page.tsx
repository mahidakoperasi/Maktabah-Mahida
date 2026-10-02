import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicMenu, getPublicPage } from '@/lib/cms';
import { getDesign } from '@/lib/design-store';
import DesignHero from '@/components/DesignHero';
import DesignSections from '@/components/DesignSections';
import { VisualItem } from '@/components/VisualMedia';
import RichContent from '@/components/RichContent';
import DesignTextBlock from '@/components/DesignTextBlock';
export const dynamic = 'force-dynamic';
export default async function MediaPage() {
  const page = await getPublicPage('/media');
  if (!page) notFound();
  const menu =
    (await getPublicMenu()).find((i) => i.path === '/media')?.children || [];
  const visual = await getDesign('/media', 'media');
  const cards = [
    ['/media/kegiatan', 'card-kegiatan'],
    ['/media/video', 'card-video'],
    ['/media/galeri', 'card-galeri'],
  ];
  return (
    <div className="min-h-screen bg-cream">
      <DesignHero path="/media" className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-[1280px]">
          <h1 className="text-4xl font-black md:text-6xl">{page.title}</h1>
          {page.intro && (
            <p className="mt-5 max-w-2xl leading-8">{page.intro}</p>
          )}
        </div>
      </DesignHero>
      <div className="mx-auto max-w-[1280px] space-y-12 px-5 py-14">
        <DesignTextBlock path="/media" hasText={Boolean(page.body)}>
          <div className="prose-article space-y-4">
            <RichContent content={page.body || ''} />
          </div>
        </DesignTextBlock>
        <nav
          aria-label="Jelajahi media"
          className="grid grid-cols-1 gap-5 sm:grid-cols-6 lg:grid-cols-12"
        >
          {cards.map(([path, area]) => {
            const item = menu.find((i) => i.path === path);
            if (!item) return null;
            const clip = visual?.clips.find((c) => c.area === area);
            return (
              <article
                key={path}
                data-media-card={area}
                className={`min-w-0 overflow-hidden border border-mahida-200 bg-white ${clip?.size === 'wide' ? 'sm:col-span-6 lg:col-span-12' : clip?.size === 'medium' ? 'sm:col-span-3 lg:col-span-6' : 'sm:col-span-2 lg:col-span-4'}`}
              >
                {clip && <VisualItem clip={clip} />}
                <Link
                  href={path}
                  className="flex min-h-16 items-center justify-between gap-3 p-5 text-xl font-bold hover:text-emerald-rich focus-visible:outline-2"
                >
                  {item.label}
                  <span aria-hidden>↗</span>
                </Link>
              </article>
            );
          })}
        </nav>
        <DesignSections path="/media" />
      </div>
    </div>
  );
}
